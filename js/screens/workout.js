import * as store from '../data/store.js';
import { deleteWithUndo } from '../ui/undo.js';
import * as F from '../domain/fitness.js';
import { today, fmtMDY, dayInline } from '../domain/dates.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, segmented, scale10 } from '../ui/components.js';
import { kgOut, kgIn, weightUnit, loadText } from '../ui/format.js';
import { nextStep, stepLabel } from '../domain/next-step.js';
import * as Clock from '../domain/session-clock.js';
import { restDefault } from '../domain/templates.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const VERDICT = { improved: ['Improved', 'good'], maintained: ['Maintained', ''], declined: ['Declined', 'warn'], first: ['First time', ''] };
const n = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));
let timer = null;

function groups(workoutId) {
  const sets = F.setsOf(workoutId);
  const map = new Map();
  for (const s of sets) {
    const k = s.order;
    if (!map.has(k)) map.set(k, { order: k, exerciseId: s.exerciseId, sets: [] });
    map.get(k).sets.push(s);
  }
  return [...map.values()].sort((a, b) => a.order - b.order);
}

function lastTimeLine(prev, e) {
  if (!prev) return 'First time logging this — anything counts.';
  const name = prev.exerciseId !== e.id ? `${F.exercise(prev.exerciseId)?.name} · ` : '';
  const body = prev.metric === 'time' ? `${prev.sets} × ${Math.round(prev.totalSeconds / prev.sets)} s (best ${prev.topSeconds} s)`
    : prev.metric === 'minutes' ? `${prev.minutes} min`
      : `${prev.sets} × ${Math.round(prev.totalReps / prev.sets)}${prev.topLoad ? ` · ${loadText(prev.topLoad)}` : ''}`;
  return `Last time · ${name}${body} · ${dayInline(prev.workout.date)}`;
}

/** The value a set is logged by: reps, or seconds for holds, or minutes for cardio. */
const mainOf = (e) => (e?.metric === 'time' ? 'seconds' : e?.metric === 'minutes' ? 'minutes' : 'reps');
const shown = (f, v) => (v == null ? '' : f === 'load' ? Math.round(kgOut(v) * 2) / 2 : v);
const prevOf = (prevSets, s) => prevSets[s.setIndex] || prevSets[prevSets.length - 1] || null;

/**
 * One set: its number (tap it to mark a warm-up), what you did last time (tap it to do the same),
 * then the weight and the reps. Entering the reps (or the time) is what logs the set: there's no
 * box to tick. The suggestion for today shows faintly until you type.
 */
function setRow(s, e, prevSets, label) {
  const p = prevOf(prevSets, s);
  const main = mainOf(e);
  const prevText = !p ? '—' : main === 'reps' ? `${p.load ? `${shown('load', p.load)} × ` : ''}${p.reps ?? '—'}` : `${p[main] ?? '—'}${main === 'seconds' ? ' s' : ' min'}`;
  // Bodyweight: no added weight is an empty field rather than a 0.
  const val = (f, v) => (f === 'load' && !e.defaultLoad && !Number(v) ? '' : shown(f, v));
  const field = (f, lbl, step = 1) => html`<input class="set-in" type="number" inputmode="${step % 1 ? 'decimal' : 'numeric'}" step="${step}" min="0" enterkeyhint="next"
    value="${val(f, s[f])}" placeholder="${val(f, s.plan?.[f] ?? p?.[f]) || (f === 'load' ? '0' : '')}" data-change="set" data-id="${s.id}" data-f="${f}" aria-label="Set ${label}: ${lbl}">`;
  return html`<li class="${cx('wset-row', `wset-row--${main}`, s.completed && 'is-done', s.warmup && 'is-warmup')}" data-key="${s.id}">
    <button type="button" class="set-num tnum" data-action="set-kind" data-id="${s.id}" aria-label="Set ${label}${s.warmup ? ', warm-up' : ''}. Tap to ${s.warmup ? 'count it as a working set' : 'mark it as a warm-up'}">${s.completed ? icon('check', { size: 14, stroke: 2.4 }) : label}</button>
    <button type="button" class="set-prev tnum" data-action="use-prev" data-id="${s.id}" ${p ? '' : 'disabled'} aria-label="${p ? `Same as last time: ${prevText}` : 'Nothing from last time'}">${prevText}</button>
    ${main === 'reps' ? field('load', e.defaultLoad ? weightUnit() : `${weightUnit()} added`, 0.5) : ''}
    ${field(main, main === 'reps' ? (e.unilateral ? 'reps per side' : 'reps') : main === 'seconds' ? 'seconds' : 'minutes')}
  </li>`;
}

/** Sets numbered as you count them: warm-ups are W, working sets 1, 2, 3. */
function numbered(sets) {
  let n = 0;
  return sets.map((s) => [s, s.warmup ? 'W' : String(++n)]);
}
const restOf = (e, s) => s?.rest ?? restDefault(e);
const restLabel = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
const restLeft = (w) => (w?.restUntil ? Math.max(0, Math.ceil((Date.parse(w.restUntil) - Date.now()) / 1000)) : 0);

/** A set just logged: a rest starts, as in gym mode, unless it was the last one. */
function startRest(w, s, e) {
  const more = F.setsOf(w.id).some((x) => !x.completed && x.id !== s.id);
  const rest = restOf(e, s);
  if (rest && more && w.status === 'active') store.update('workouts', w.id, { restUntil: new Date(Date.now() + rest * 1000).toISOString(), restFor: rest });
}

function exerciseCard(w, g, progress) {
  const e = F.exercise(g.exerciseId) || { id: g.exerciseId, name: 'Exercise', metric: 'reps', category: '' };
  const prev = F.previousPerformance(e.id, { excludeWorkoutId: w.id, before: w.date });
  const prevSets = prev ? F.setsOf(prev.workout.id).filter((s) => s.exerciseId === prev.exerciseId && s.completed) : [];
  const row = progress?.rows.find((r) => r.exerciseId === e.id);
  const family = e.family ? F.exercises().filter((x) => x.family === e.family) : [];
  const step = w.status === 'active' ? nextStep(e.id, g.sets[0].target, { excludeWorkoutId: w.id, before: w.date, unit: weightUnit() }) : null;
  return html`<section class="ex-card" data-key="ex-${g.sets[0].id}">
    <header class="ex-head">
      <button type="button" class="drag-handle" data-drag aria-label="Move ${e.name}" aria-describedby="drag-hint">${icon('grip-vertical', { size: 16 })}</button>
      <div class="ex-title">
        <p class="ex-name">${e.name}</p>
        <p class="ex-meta">${F.categoryLabel(e.category)}${e.unilateral ? ' · per side' : ''}${family.length > 1 ? ` · level ${e.level} of ${family.length}` : ''}</p>
      </div>
      ${row ? html`<span class="badge badge--${VERDICT[row.verdict]?.[1] || ''}" title="${row.reason}">${VERDICT[row.verdict]?.[0]}</span>` : ''}
      <button type="button" class="icon-btn icon-btn--sm" data-action="ex-menu" data-order="${g.order}" aria-label="Options for ${e.name}">${icon('ellipsis', { size: 18 })}</button>
    </header>
    <p class="ex-last">${lastTimeLine(prev, e)}${row && row.verdict !== 'first' ? html` · <strong>${row.reason}</strong>` : ''}</p>
    ${w.status === 'active' && !g.sets.some((x) => x.completed) && step ? html`<p class="ex-last ex-step"><strong>${stepLabel(step, loadText)}</strong> · ${step.why}</p>` : ''}
    ${g.sets[0].target ? html`<p class="ex-goal">Goal <b>${g.sets[0].target}</b>${restOf(e, g.sets[0]) ? html` · rest ${restLabel(restOf(e, g.sets[0]))}` : ''}</p>` : ''}
    <ol class="wset-list">
      <li class="${cx('wset-row wset-row--head', `wset-row--${mainOf(e)}`)}" aria-hidden="true"><span>Set</span><span>Previous</span>${mainOf(e) === 'reps' ? html`<span>${e.defaultLoad ? weightUnit() : `+${weightUnit()}`}</span>` : ''}<span>${mainOf(e) === 'reps' ? (e.unilateral ? 'Reps/side' : 'Reps') : mainOf(e) === 'seconds' ? 'Sec' : 'Min'}</span></li>
      ${numbered(g.sets).map(([s, label]) => setRow(s, e, prevSets, label))}
    </ol>
    <div class="ex-foot">
      <button type="button" class="link-btn" data-action="add-set" data-order="${g.order}">${icon('plus', { size: 16 })} Add set</button>
      ${g.sets.length > 1 && !g.sets[g.sets.length - 1].completed ? html`<button type="button" class="link-btn" data-action="del-set" data-id="${g.sets[g.sets.length - 1].id}">${icon('minus', { size: 16 })} Remove set</button>` : ''}
      ${e.cues ? html`<p class="ex-cue">${e.cues}</p>` : ''}
    </div>
  </section>`;
}

const elapsed = (w) => Clock.clockText(Clock.activeMs(w));
const inSession = (id) => location.hash.includes(`workout/${id}`);

export default {
  id: 'workout',
  title: ({ params }) => store.get('workouts', params.id)?.title || 'Workout',
  render({ params, ui }) {
    const w = store.get('workouts', params.id);
    if (!w) return html`${pageHead({ title: 'Workout', back: { to: 'plan/training', label: 'Training' } })}${empty({ ic: 'dumbbell', title: 'This session doesn’t exist anymore.' })}`;
    const gs = groups(w.id);
    const active = w.status === 'active';
    const progress = active ? null : F.workoutProgress(w);
    const doneSets = F.setsOf(w.id).filter((s) => s.completed).length;
    const total = F.setsOf(w.id).length;
    const tpl = w.templateId ? F.template(w.templateId) : null;
    return html`
      ${pageHead({ title: w.title, eyebrow: `${fmtMDY(w.date)}${active ? ' · in progress' : ''}`, back: { to: 'plan/training', label: 'Training' },
        actions: html`${active && gs.length ? html`<button type="button" class="btn btn--soft btn--sm btn--gym" data-action="gym">${icon('dumbbell', { size: 15 })} Gym mode</button>` : ''}
          <button type="button" class="icon-btn icon-btn--filled" data-action="menu" aria-label="Session options">${icon('ellipsis', { size: 20 })}</button>` })}
      <div class="wo-bar">
        ${active ? html`<button type="button" class="wo-stat wo-clock" data-action="clock" aria-label="${Clock.isRunning(w) ? 'Pause the session clock' : 'Carry on the session clock'}"><span class="muted">${Clock.isRunning(w) ? 'Time' : 'Paused'}</span> <b class="tnum" id="wo-timer">${elapsed(w)}</b>${icon(Clock.isRunning(w) ? 'pause' : 'play', { size: 14 })}</button>`
          : html`<span class="wo-stat"><span class="muted">Time</span> <b class="tnum" id="wo-timer">${elapsed(w)}</b></span>`}
        <span class="wo-stat"><span class="muted">Sets</span> <b class="tnum">${doneSets}/${total}</b></span>
        ${active && restLeft(w) ? html`<button type="button" class="wo-stat wo-rest" data-action="rest-skip" aria-label="Rest. Tap to skip"><span class="muted">Rest</span> <b class="tnum" id="wo-rest">${restLabel(restLeft(w))}</b> <span class="muted">Skip</span></button>` : ''}
        ${!active && progress ? html`<span class="wo-stat"><span class="muted">Progress</span> <b>${progress.improved ? `${progress.improved} improved` : VERDICT[progress.verdict][0]}</b></span>` : ''}
      </div>
      ${tpl?.note ? html`<p class="sheet-note block-tight">${tpl.note}</p>` : ''}
      ${w.adjusted ? html`<p class="note-card">${w.adjusted}</p>` : ''}
      ${!gs.length ? empty({ ic: 'dumbbell', title: 'Your first exercise starts here.', body: 'Add exercises from the library. Sets fill in from last time.', cta: 'Add exercise', action: 'add-ex' }) : ''}
      <div class="ex-list" data-reorder="move-ex">${gs.map((g) => exerciseCard(w, g, progress))}</div>
      ${gs.length ? html`<button type="button" class="btn btn--soft btn--block" data-action="add-ex">${icon('plus', { size: 16 })} Add exercise</button>` : ''}
      ${!active && w.notes ? html`<div class="card block"><p class="section-label">Notes</p><p>${w.notes}</p></div>` : ''}
      ${!active ? html`<p class="fine-print center">Difficulty ${w.difficulty ?? '—'}/5${w.rpe ? ` · RPE ${w.rpe}` : ''} · ${w.minutes ? `${w.minutes} min` : ''}</p>` : ''}
      <div class="wo-actions">
        ${active ? html`<button type="button" class="btn btn--primary btn--block" data-action="finish" ${raw(doneSets ? '' : 'aria-disabled="true"')}>${icon('check', { size: 18 })} Finish session</button>`
          : html`<button type="button" class="btn btn--soft btn--block" data-action="finish-edit">Edit difficulty & notes</button>`}
      </div>`;
  },
  mount(el, { params }) {
    Clock.enter(store, params.id);
    clearInterval(timer);
    timer = setInterval(() => {
      const w = store.get('workouts', params.id);
      const t = document.getElementById('wo-timer');
      if (w && t && w.status === 'active') t.textContent = elapsed(w);
      const r = document.getElementById('wo-rest');
      if (r) { const left = restLeft(w); if (left) r.textContent = restLabel(left); else { hap.success(); app.refresh(); } }
    }, 1000);
  },
  unmount(el, { params } = {}) { clearInterval(timer); if (params?.id) Clock.leave(store, params.id, () => inSession(params.id)); },
  actions: {
    // The set number marks a warm-up: it's logged, but doesn't count for records or progress.
    'set-kind': ({ data }) => { const s = store.get('workoutSets', data.id); if (s) { store.update('workoutSets', s.id, { warmup: !s.warmup }); hap.tap(); } },
    // Same as last time, in one tap: the weight and the reps, and the set is logged.
    'use-prev': ({ data }) => {
      const s = store.get('workoutSets', data.id);
      const w = store.get('workouts', s.workoutId);
      const e = F.exercise(s.exerciseId);
      const prev = F.previousPerformance(s.exerciseId, { excludeWorkoutId: w.id, before: w.date });
      const p = prevOf(prev ? F.setsOf(prev.workout.id).filter((x) => x.exerciseId === prev.exerciseId && x.completed) : [], s);
      if (!p) return;
      const main = mainOf(e);
      store.update('workoutSets', s.id, { [main]: p[main], ...(main === 'reps' ? { load: p.load ?? s.load } : {}), completed: true });
      if (!s.completed) startRest(w, s, e);
      hap.success();
      if (w.status === 'done') store.update('workouts', w.id, { progression: F.workoutProgress(w).verdict });
    },
    'del-set': ({ data }) => { const s = store.get('workoutSets', data.id); if (s && !s.completed) { store.remove('workoutSets', s.id); hap.tap(); } },
    'rest-skip': ({ params }) => { store.update('workouts', params.id, { restUntil: null }); hap.tap(); },
    'add-set': ({ data, params }) => {
      const sets = F.setsOf(params.id).filter((s) => s.order === Number(data.order));
      const last = sets[sets.length - 1];
      store.put('workoutSets', { ...last, id: undefined, createdAt: undefined, setIndex: last.setIndex + 1, completed: false, warmup: false,
        plan: { reps: last.reps ?? last.plan?.reps ?? null, seconds: last.seconds ?? last.plan?.seconds ?? null, minutes: last.minutes ?? last.plan?.minutes ?? null }, reps: null, seconds: null, minutes: null });
      hap.tap();
    },
    'ex-menu': ({ data, params }) => exerciseMenu(params.id, Number(data.order)),
    // Exercises in a new order: every set takes its exercise's new position.
    'move-ex': ({ from, to, params }) => {
      const gs = groups(params.id);
      const [g] = gs.splice(from, 1);
      gs.splice(to, 0, g);
      store.batch(gs.flatMap((x, i) => x.sets.filter((s) => s.order !== i).map((s) => ({ store: 'workoutSets', value: { ...s, order: i } }))));
    },
    'add-ex': ({ params }) => openPicker(params.id),
    menu: ({ params }) => sessionMenu(params.id),
    gym: ({ params }) => app.replace(`workout/${params.id}/gym`),
    clock: ({ params }) => { Clock.toggle(store, params.id); hap.tap(); app.refresh(); },
    finish: ({ params, el }) => {
      if (el.getAttribute('aria-disabled') === 'true') { app.toast('Log at least one set first.'); return; }
      finishSheet(params.id, true);
    },
    'finish-edit': ({ params }) => finishSheet(params.id, false),
  },
  inputs: {
    set: ({ el, value }) => {
      const s = store.get('workoutSets', el.dataset.id);
      if (!s) return;
      const v = n(value);
      const f = el.dataset.f;
      const e = F.exercise(s.exerciseId);
      const w = store.get('workouts', s.workoutId);
      const patch = { [f]: f === 'load' && v != null ? Math.round(kgIn(v) * 100) / 100 : v };
      // The reps (or the time) are what log a set; clearing them takes it back.
      if (f === mainOf(e)) {
        patch.completed = v != null;
        if (v != null && !s.completed) startRest(w, s, e);
      }
      store.update('workoutSets', s.id, patch);
      if (w?.status === 'done') store.update('workouts', w.id, { progression: F.workoutProgress(w).verdict });
    },
  },
};

function exerciseMenu(workoutId, order) {
  const sets = F.setsOf(workoutId).filter((s) => s.order === order);
  const e = F.exercise(sets[0]?.exerciseId);
  const family = e?.family ? F.exercises().filter((x) => x.family === e.family).sort((a, b) => a.level - b.level) : [];
  app.sheet({
    title: e?.name || 'Exercise',
    render: () => html`<div class="form">
      ${family.length > 1 ? html`<div><p class="form-label">Variation</p><ul class="tpl-list">${family.map((f) => html`<li><button type="button" class="${cx('tpl-item', f.id === e.id && 'is-suggested')}" data-action="swap" data-id="${f.id}">
        <span class="tpl-name">${f.name}</span><span class="tpl-meta">Level ${f.level}${f.id === e.id ? ' · current' : f.level > e.level ? ' · harder' : ' · easier'}</span></button></li>`)}</ul></div>` : ''}
      ${e?.cues ? html`<p class="sheet-note">${e.cues}</p>` : ''}
      <button type="button" class="btn btn--soft btn--block" data-action="history">Exercise history</button>
      <button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="remove">Remove from session</button>
    </div>`,
    actions: {
      swap: ({ data, sheet }) => {
        store.batch(sets.map((s) => ({ store: 'workoutSets', value: { ...s, exerciseId: data.id } })));
        hap.tap();
        app.closeSheet(sheet);
      },
      history: ({ sheet }) => { app.closeSheet(sheet); app.go(`plan/training/exercises/${e.id}`); },
      remove: ({ sheet }) => {
        store.batch(sets.map((s) => ({ store: 'workoutSets', delete: s.id })));
        app.closeSheet(sheet);
        app.toast(`${e.name} removed`, { action: { label: 'Undo', fn: () => store.batch(sets.map((s) => ({ store: 'workoutSets', value: s }))) } });
      },
    },
  });
}

export function openPicker(workoutId) {
  import('./exercise-picker.js').then((m) => m.pickExercise({ onPick: (id) => addExercise(workoutId, id) }));
}

export function addExercise(workoutId, exerciseId, sets = 3) {
  const w = store.get('workouts', workoutId);
  const e = F.exercise(exerciseId);
  const order = Math.max(-1, ...F.setsOf(workoutId).map((s) => s.order)) + 1;
  const prev = F.previousPerformance(exerciseId, { excludeWorkoutId: workoutId, before: w.date });
  const prevSets = prev ? F.setsOf(prev.workout.id).filter((s) => s.exerciseId === prev.exerciseId && s.completed) : [];
  const count = Math.max(sets, prevSets.length || 0);
  store.batch(Array.from({ length: count }, (_, i) => {
    const p = prevSets[i] || prevSets[prevSets.length - 1];
    return { store: 'workoutSets', value: { workoutId, date: w.date, exerciseId, order, setIndex: i, target: '', reps: null, seconds: null, minutes: null, load: p?.load ?? e?.defaultLoad ?? null, completed: false } };
  }));
}

function sessionMenu(workoutId) {
  const w = store.get('workouts', workoutId);
  app.sheet({
    title: 'Session',
    render: () => html`<form class="form" data-submit="save">
      <label class="field"><span class="field-label">Name</span><input class="input" name="title" value="${w.title}"></label>
      <label class="field"><span class="field-label">Date</span><input class="input" type="date" name="date" value="${w.date}" max="${today()}"></label>
      <label class="field"><span class="field-label">Type</span><select class="input" name="kind">${['strength', 'cardio', 'recovery'].map((k) => html`<option value="${k}" ${raw(w.kind === k ? 'selected' : '')}>${k[0].toUpperCase() + k.slice(1)}</option>`)}</select></label>
      <button type="submit" class="btn btn--primary btn--block">Save</button>
      ${F.setsOf(w.id).length ? html`<button type="button" class="btn btn--soft btn--block" data-action="as-template">${icon('copy', { size: 16 })} Save as a workout</button>` : ''}
      <button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="discard">${w.status === 'active' ? 'Discard session' : 'Delete session'}</button>
    </form>`,
    actions: {
      save: ({ form, sheet }) => {
        const date = form.date && form.date <= today() ? form.date : w.date;
        const sets = F.setsOf(w.id);
        store.batch([{ store: 'workouts', value: { ...w, title: form.title.trim() || w.title, date, kind: form.kind } },
          ...sets.map((s) => ({ store: 'workoutSets', value: { ...s, date } }))]);
        app.closeSheet(sheet);
      },
      'as-template': async ({ sheet }) => {
        if (sheet.saving) return;
        sheet.saving = true;
        const TP = await import('../domain/templates.js');
        const t = TP.fromWorkout(w.id);
        app.closeSheet(sheet);
        hap.success();
        app.toast(`Saved as “${t.name}”. Find it in Training.`, { icon: 'check', action: { label: 'Open', fn: () => app.go(`plan/training/workouts/${t.id}`) } });
      },
      discard: async ({ sheet }) => {
        app.closeSheet(sheet);
        const sets = F.setsOf(w.id);
        app.replace('plan/training');
        deleteWithUndo([{ store: 'workouts', id: w.id }, ...sets.map((s) => ({ store: 'workoutSets', id: s.id }))],
          w.status === 'active' ? 'Session discarded' : 'Session deleted');
      },
    },
  });
}

export function finishSheet(workoutId, finishing) {
  const w = store.get('workouts', workoutId);
  const ui = { difficulty: w.difficulty ?? 3, rpe: w.rpe ?? null, notes: w.notes || '' };
  const LEVELS = [{ id: '1', label: 'Easy' }, { id: '2', label: 'Light' }, { id: '3', label: 'Solid' }, { id: '4', label: 'Hard' }, { id: '5', label: 'Max' }];
  app.sheet({
    title: finishing ? 'Finish session' : 'Session details',
    ui,
    render: (s) => html`<div class="form">
      <div><p class="form-label">How hard was it?</p>${segmented(LEVELS, String(s.ui.difficulty), { action: 'diff', name: 'Difficulty' })}</div>
      <details class="disclosure" ${s.ui.rpe ? raw('open') : ''}><summary>RPE <small>optional</small></summary>${scale10(s.ui.rpe, { action: 'rpe', low: 'Very easy', high: 'All-out', name: 'RPE' })}</details>
      <label class="field"><span class="field-label">Notes <small>optional</small></span><textarea class="input" rows="3" data-input="notes" placeholder="How did it feel? Anything to change next time?">${s.ui.notes}</textarea></label>
      <button type="button" class="btn btn--primary btn--block" data-action="done">${finishing ? 'Save session' : 'Save'}</button>
    </div>`,
    inputs: { notes: ({ value, sheet }) => { sheet.ui.notes = value; } },
    actions: {
      diff: ({ data, sheet }) => { sheet.ui.difficulty = Number(data.value); hap.tap(); sheet.refresh(); },
      rpe: ({ data, sheet }) => { sheet.ui.rpe = sheet.ui.rpe === Number(data.value) ? null : Number(data.value); sheet.refresh(); },
      done: ({ sheet }) => {
        const end = finishing ? new Date().toISOString() : w.endedAt;
        // The time you trained: the session clock, so pauses don't count.
        const stop = finishing ? Clock.stopPatch(w) : {};
        const minutes = finishing ? Math.max(1, Math.round(stop.activeMs / 60000)) : w.minutes;
        const updated = { ...w, ...stop, status: 'done', endedAt: end, minutes, difficulty: sheet.ui.difficulty, rpe: sheet.ui.rpe, notes: sheet.ui.notes };
        store.put('workouts', updated);
        const prog = F.workoutProgress(updated);
        store.update('workouts', w.id, { progression: prog.verdict, improvedCount: prog.improved });
        hap.success();
        app.closeSheet(sheet);
        if (finishing) {
          app.toast(prog.improved ? `Session saved · ${prog.improved} exercise${prog.improved === 1 ? '' : 's'} improved` : 'Session saved. Showing up counts.', { icon: 'check' });
        }
      },
    },
  });
}
