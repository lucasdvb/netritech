// Gym mode (U9): one set at a time, big controls for one hand, the screen kept awake, and a rest
// timer that starts when you log a set. The timer is a timestamp on the workout, so it stays right
// to the second across app switches and reloads. The full list is one tap away.
import * as store from '../data/store.js';
import * as F from '../domain/fitness.js';
import { restDefault } from '../domain/templates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { empty } from '../ui/components.js';
import { kgOut, kgIn, weightUnit, loadText } from '../ui/format.js';
import { nextStep, stepLabel } from '../domain/next-step.js';
import * as Clock from '../domain/session-clock.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { mediaLine, mediaActions, mediaInputs, hydrateMedia, openMedia } from './exercise-media-ui.js';
import { RIR, rirLabel, adjustNext } from '../domain/effort.js';
import { LINKED } from '../domain/reminder-links.js';

// Rest between sets by kind of exercise, in seconds.
// Rest: what the workout sets for this exercise, or a default by category.
const restFor = (e, s) => s?.rest ?? restDefault(e);
const loadStep = (e) => (weightUnit() === 'lb' ? 2.5 : e?.loadStep || 1);

let tick = 0;
let lock = null;
let lockState = 'off';

/** Every set in order, with its exercise. */
function sequence(workoutId) {
  return F.setsOf(workoutId).slice().sort((a, b) => a.order - b.order || a.setIndex - b.setIndex).map((s) => ({ s, e: F.exercise(s.exerciseId) }));
}

const stepFor = (w, s) => w.kind === 'mobility' ? null : nextStep(s.exerciseId, s.target, { excludeWorkoutId: w.id, before: w.date, unit: weightUnit() });

/** What a set will be logged as: what you've entered, or last time's numbers, or the goal. */
function suggested(w, s, e) {
  const prev = F.previousPerformance(s.exerciseId, { excludeWorkoutId: w.id, before: w.date });
  const prevSets = prev ? F.setsOf(prev.workout.id).filter((x) => x.exerciseId === prev.exerciseId && x.completed) : [];
  const p = prevSets[s.setIndex] || prevSets[prevSets.length - 1];
  // Within this session, the set before carries forward (next set prefilled).
  const before = F.setsOf(w.id).filter((x) => x.order === s.order && x.setIndex < s.setIndex && x.completed).pop();
  const goal = Number(String(s.target || '').match(/\d+/)?.[0]) || null;
  // The first set of an exercise starts from the next step (13d): heavier, one more rep, or held.
  const step = !before ? stepFor(w, s) : null;
  const next = step && step.kind !== 'variation' ? { reps: step.reps, load: step.load, seconds: step.seconds } : {};
  // A set adjusted by how the last one felt keeps its adjusted plan over the carry-forward.
  const pick = (f) => s[f] ?? (s.adjusted ? s.plan?.[f] : null) ?? before?.[f] ?? next[f] ?? s.plan?.[f] ?? p?.[f] ?? null;
  return {
    reps: e?.metric === 'reps' ? pick('reps') ?? goal ?? 10 : null,
    load: e?.metric === 'reps' ? pick('load') ?? e?.defaultLoad ?? null : null,
    seconds: e?.metric === 'time' ? pick('seconds') ?? goal ?? 30 : null,
    minutes: e?.metric === 'minutes' ? pick('minutes') ?? goal ?? 10 : null,
  };
}

/** Temptation bundling: what you only enjoy while training (the training habit's pairing). */
const bundleOf = (w) => (w.kind === 'mobility' ? '' : store.get('habits', LINKED.workout)?.bundle || '');

/** The set the controls act on: the one you moved to, or the first not done. */
function targetOf(w, ui) {
  const seq = sequence(w.id);
  return ui.at != null ? seq[Math.min(ui.at, seq.length - 1)] : seq[Math.max(0, seq.findIndex((x) => !x.s.completed))];
}

const clock = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec % 60)).padStart(2, '0')}`;
const restLeft = (w) => (w?.restUntil ? Math.max(0, Math.ceil((new Date(w.restUntil).getTime() - Date.now()) / 1000)) : 0);

async function keepAwake() {
  if (!('wakeLock' in navigator)) { lockState = 'unsupported'; return; }
  try {
    lock = await navigator.wakeLock.request('screen');
    lockState = 'on';
    lock.addEventListener?.('release', () => { if (lockState === 'on') lockState = 'released'; });
  } catch { lockState = 'failed'; }
}
const onVisible = () => { if (document.visibilityState === 'visible' && document.querySelector('.gym')) { keepAwake().then(() => app.refresh()); } };

function control(label, f, value, step, unit) {
  return html`<div class="gym-ctl" data-key="ctl-${f}">
    <button type="button" class="gym-step" data-action="g-step" data-f="${f}" data-d="${-step}" aria-label="${label}: ${step} less">${icon('minus', { size: 28 })}</button>
    <p class="gym-val"><span class="tnum">${value ?? '—'}</span><small>${unit}</small></p>
    <button type="button" class="gym-step" data-action="g-step" data-f="${f}" data-d="${step}" aria-label="${label}: ${step} more">${icon('plus', { size: 28 })}</button>
  </div>`;
}

export default {
  id: 'gym',
  title: 'Gym mode',
  render({ params, ui }) {
    const w = store.get('workouts', params.id);
    if (!w) return empty({ ic: 'dumbbell', title: 'This session doesn’t exist anymore.' });
    const seq = sequence(w.id);
    const done = seq.filter((x) => x.s.completed).length;
    // The set in front of you: the one you moved to, or the first one not done.
    const curIdx = Math.max(0, ui.at != null ? Math.min(ui.at, seq.length - 1) : seq.findIndex((x) => !x.s.completed));
    const allDone = seq.length > 0 && done === seq.length;
    const cur = seq[curIdx];
    const resting = restLeft(w) > 0;
    const exIndex = cur ? [...new Set(seq.map((x) => x.s.order))].indexOf(cur.s.order) : 0;
    const exCount = new Set(seq.map((x) => x.s.order)).size;
    const setsOfEx = cur ? seq.filter((x) => x.s.order === cur.s.order) : [];
    const v = cur ? suggested(w, cur.s, cur.e) : {};
    return html`<div class="gym" data-key="gym">
      <header class="gym-top">
        <button type="button" class="gym-ghost" data-action="g-list" aria-label="Back to the full session">${icon('chevron-left', { size: 22 })}<span>List</span></button>
        <button type="button" class="${cx('gym-meta tnum', !Clock.isRunning(w) && 'is-paused')}" data-action="g-clock" aria-label="${Clock.isRunning(w) ? 'Pause the session clock' : 'Carry on the session clock'}">${icon(Clock.isRunning(w) ? 'pause' : 'play', { size: 14 })}<span id="gym-elapsed">${Clock.clockText(Clock.activeMs(w))}</span> · ${done}/${seq.length}</button>
        <button type="button" class="gym-ghost" data-action="g-finish">Finish</button>
      </header>
      ${bundleOf(w) ? html`<p class="gym-bundle">${icon('sparkles', { size: 16 })} With ${bundleOf(w)}</p>` : ''}
      ${lockState === 'unsupported' || lockState === 'failed' ? html`<p class="gym-warn" role="status">${icon('circle-alert', { size: 16 })} This browser can’t keep the screen on. Set Auto-Lock to Never while you train (Settings › Display & Brightness).</p>` : ''}
      ${!cur ? html`<div class="gym-empty"><p class="gym-name">No exercises yet</p><button type="button" class="gym-ghost" data-action="g-list">Add them in the list</button></div>`
        : allDone && !resting ? html`<div class="gym-card gym-card--done">
            <p class="gym-eyebrow">Every set done</p><p class="gym-name">${w.title}</p>
            <button type="button" class="gym-go" data-action="g-finish">Finish session</button></div>`
        : html`<div class="${cx('gym-card', resting && 'is-resting')}" data-key="card-${cur.s.id}">
          <p class="gym-eyebrow">Exercise ${exIndex + 1} of ${exCount} · set ${cur.s.setIndex + 1} of ${setsOfEx.length}${cur.s.target ? ` · goal ${cur.s.target}` : ''}</p>
          <p class="gym-name">${cur.e?.name || 'Exercise'}</p>
          ${w.adjusted && cur.s.order === 0 && cur.s.setIndex === 0 && !cur.s.completed ? html`<p class="gym-step-note">${w.adjusted}</p>` : ''}
          ${cur.e ? html`${mediaLine(cur.e, { tone: 'gym' })}<button type="button" class="gym-ghost gym-media-link" data-action="g-media" data-ex="${cur.e.id}">${icon('image-plus', { size: 16 })} ${cur.e.photos?.length || cur.e.note ? 'Edit pictures and note' : 'Add a picture or note'}</button>` : ''}
          ${!resting && cur.s.adjusted && !cur.s.completed ? html`<p class="gym-step-note" data-key="adj-${cur.s.id}"><b>Adjusted</b> · ${cur.s.adjusted}</p>` : ''}
          ${!resting && cur.s.setIndex === 0 && !cur.s.completed && stepFor(w, cur.s) ? html`<p class="gym-step-note" data-key="step-${cur.s.exerciseId}"><b>${stepLabel(stepFor(w, cur.s), loadText)}</b> · ${stepFor(w, cur.s).why}</p>` : ''}
          ${resting ? html`<div class="gym-rest" aria-live="polite">
              <p class="gym-rest-label">Rest</p>
              <p class="gym-rest-time tnum" id="gym-rest">${clock(restLeft(w))}</p>
              <div class="gym-rest-ctl">
                <button type="button" class="gym-ghost" data-action="g-rest" data-d="30">+30 s</button>
                <button type="button" class="gym-ghost" data-action="g-rest-skip">Skip rest</button>
              </div>
              <p class="gym-next">Next: ${cur.s.completed ? 'all done' : `set ${cur.s.setIndex + 1}${v.reps != null ? ` · ${v.reps} reps` : ''}${v.load ? ` · ${loadText(v.load)}` : ''}`}</p>
            </div>`
          : html`<div class="gym-ctls">
              ${cur.e?.metric === 'time' ? control('Seconds', 'seconds', v.seconds, 5, 's') : cur.e?.metric === 'minutes' ? control('Minutes', 'minutes', v.minutes, 1, 'min') : control('Reps', 'reps', v.reps, 1, cur.e?.unilateral ? 'reps / side' : 'reps')}
              ${cur.e?.metric === 'reps' ? control('Load', 'load', Math.round(kgOut(v.load ?? 0) * 2) / 2, loadStep(cur.e), cur.e?.defaultLoad ? weightUnit() : `${weightUnit()} added`) : ''}
            </div>
            ${cur.e?.metric === 'reps' && w.kind !== 'mobility' ? html`<div class="gym-effort" role="radiogroup" aria-label="Reps left in the tank (optional)">
              <span class="gym-effort-label">Reps left</span>
              ${RIR.map((r) => html`<button type="button" role="radio" class="gym-rir" aria-checked="${cur.s.rir === r}" aria-label="${rirLabel(r)} reps left" data-action="g-rir" data-r="${r}">${rirLabel(r)}</button>`)}
            </div>` : ''}
            <button type="button" class="gym-go" data-action="g-done" data-id="${cur.s.id}">${cur.s.completed ? 'Log it again' : `Log set ${cur.s.setIndex + 1}`}</button>`}
        </div>`}
      ${cur && !allDone ? html`<nav class="gym-nav" aria-label="Sets">
        <button type="button" class="gym-ghost" data-action="g-move" data-d="-1" ${curIdx === 0 ? 'disabled' : ''}>${icon('chevron-left', { size: 20 })} Previous</button>
        <button type="button" class="gym-ghost" data-action="g-move" data-d="1" ${curIdx >= seq.length - 1 ? 'disabled' : ''}>Next ${icon('chevron-right', { size: 20 })}</button>
      </nav>` : ''}
    </div>`;
  },
  update(el) { hydrateMedia(el); },
  mount(el, { params }) {
    hydrateMedia(el);
    Clock.enter(store, params.id);
    document.documentElement.classList.add('in-gym');
    keepAwake().then(() => app.refresh());
    document.addEventListener('visibilitychange', onVisible);
    clearInterval(tick);
    tick = setInterval(() => {
      const w = store.get('workouts', params.id);
      if (!w) return;
      const t = document.getElementById('gym-elapsed');
      if (t) t.textContent = Clock.clockText(Clock.activeMs(w));
      const left = restLeft(w);
      const r = document.getElementById('gym-rest');
      if (r) r.textContent = clock(left);
      // Rest over while it's on screen: a firm buzz, and the next set's controls come back.
      if (r && !left) { hap.success(); app.refresh(); }
    }, 250);
  },
  unmount(el, { params } = {}) {
    if (params?.id) Clock.leave(store, params.id, () => location.hash.includes(`workout/${params.id}`));
    clearInterval(tick);
    document.documentElement.classList.remove('in-gym');
    document.removeEventListener('visibilitychange', onVisible);
    lockState = 'off';
    lock?.release?.().catch(() => {});
    lock = null;
  },
  inputs: { ...mediaInputs },
  actions: {
    ...mediaActions,
    'g-media': ({ data }) => openMedia(data.ex),
    'g-step': ({ data, params, ui }) => {
      const w = store.get('workouts', params.id);
      const seq = sequence(w.id);
      const target = ui.at != null ? seq[Math.min(ui.at, seq.length - 1)] : seq[Math.max(0, seq.findIndex((x) => !x.s.completed))];
      if (!target) return;
      const v = suggested(w, target.s, target.e);
      const f = data.f;
      // Loads step in your unit (1 kg or 2.5 lb) and are kept in kg.
      const next = f === 'load' ? Math.max(0, Math.round(kgIn(Math.round(kgOut(Number(v.load) || 0) * 2) / 2 + Number(data.d)) * 100) / 100)
        : Math.max(0, Math.round(((Number(v[f]) || 0) + Number(data.d)) * 10) / 10);
      store.update('workoutSets', target.s.id, { [f]: next });
      hap.tap();
    },
    // How many more reps you had in you (optional): tap again to clear it.
    'g-rir': ({ data, params, ui }) => {
      const w = store.get('workouts', params.id);
      const t = w && targetOf(w, ui);
      if (!t) return;
      const r = Number(data.r);
      store.update('workoutSets', t.s.id, { rir: t.s.rir === r ? null : r });
      hap.tap();
    },
    'g-done': ({ data, params, ui }) => {
      const w = store.get('workouts', params.id);
      const s = store.get('workoutSets', data.id);
      const e = F.exercise(s.exerciseId);
      const before = { ...s };
      const wBefore = { ...w };
      const vals = suggested(w, s, e);
      // How it felt moves the sets still to come of this exercise (effort.js): 4+ reps left inside
      // the range → a step heavier; nothing left below it → 5% lighter.
      const adj = e?.metric === 'reps' ? adjustNext({ ...s, ...vals, completed: true }, s.target, { unit: weightUnit(), bodyweight: !e?.defaultLoad && !(Number(vals.load) > 0) }) : null;
      const later = adj ? F.setsOf(w.id).filter((x) => x.order === s.order && x.setIndex > s.setIndex && !x.completed && !x.warmup) : [];
      const laterBefore = later.map((x) => ({ ...x }));
      store.batch([{ store: 'workoutSets', value: { ...s, ...vals, completed: true } },
        ...later.map((x) => ({ store: 'workoutSets', value: { ...x, ...(adj.load != null ? { load: adj.load } : {}), reps: null, plan: { ...(x.plan || {}), ...(adj.reps != null ? { reps: adj.reps } : {}) }, adjusted: adj.why } }))]);
      const rest = restFor(e, s);
      const seq = sequence(w.id);
      const more = seq.some((x) => !x.s.completed);
      if (rest && more) store.update('workouts', w.id, { restUntil: new Date(Date.now() + rest * 1000).toISOString(), restFor: rest });
      ui.at = null;
      hap.success();
      app.toast(more ? `Set done${rest ? ` · rest ${clock(rest)}` : ''}` : 'Last set done', {
        action: { label: 'Undo', fn: () => { store.batch([{ store: 'workoutSets', value: before }, ...laterBefore.map((value) => ({ store: 'workoutSets', value })), { store: 'workouts', value: wBefore }]); } } });
    },
    'g-rest': ({ data, params }) => {
      const w = store.get('workouts', params.id);
      const base = Math.max(Date.now(), new Date(w.restUntil || 0).getTime());
      store.update('workouts', w.id, { restUntil: new Date(base + Number(data.d) * 1000).toISOString() });
      hap.tap();
    },
    'g-rest-skip': ({ params }) => { store.update('workouts', params.id, { restUntil: null }); hap.tap(); },
    'g-move': ({ data, params, ui }) => {
      const seq = sequence(params.id);
      const cur = ui.at != null ? ui.at : Math.max(0, seq.findIndex((x) => !x.s.completed));
      ui.at = Math.max(0, Math.min(seq.length - 1, cur + Number(data.d)));
      store.update('workouts', params.id, { restUntil: null });
      hap.tap();
      app.refresh();
    },
    'g-list': ({ params }) => app.replace(`workout/${params.id}`),
    'g-clock': ({ params }) => { Clock.toggle(store, params.id); hap.tap(); app.refresh(); },
    'g-finish': async ({ params }) => {
      const sets = F.setsOf(params.id).filter((s) => s.completed).length;
      if (!sets) { app.toast('Log at least one set first.'); return; }
      (await import('./workout.js')).finishSheet(params.id, true);
    },
  },
};
