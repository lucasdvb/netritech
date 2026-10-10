// One of your workouts: its name, type and length, and its exercises in order, each with sets, a
// target, a starting load and rest. Drag the handles to reorder. Everything saves as you type.
import * as store from '../data/store.js';
import * as F from '../domain/fitness.js';
import * as TP from '../domain/templates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, segmented } from '../ui/components.js';
import { num, kgOut, kgIn, weightUnit, fieldNum } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import { safeDelete } from '../ui/safe-delete.js';
import { linkedBlock } from '../ui/linked.js';
import * as hap from '../ui/haptics.js';
import { startWorkout } from './workout-actions.js';

const restLabel = (s) => (s === 0 ? 'No rest' : s >= 60 && s % 60 === 0 ? `${s / 60} min` : s > 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s} s`);
const loadText = (kg) => (!kg ? '' : `${num(kgOut(kg), kgOut(kg) % 1 ? 1 : 0)} ${weightUnit()}`);

export function itemLine(it, e) {
  const rest = it.rest ?? TP.restDefault(e);
  return [e?.metric === 'minutes' ? it.reps : `${it.sets} × ${it.reps || '—'}`, e?.metric === 'reps' ? loadText(it.load) : '', rest ? `rest ${restLabel(rest)}` : ''].filter(Boolean).join(' · ');
}

export default {
  id: 'template',
  title: ({ params }) => F.template(params.id)?.name || 'Workout',
  render({ params }) {
    const t = F.template(params.id);
    if (!t) return html`${pageHead({ title: 'Workout', back: { to: 'plan/training', label: 'Training' } })}${empty({ ic: 'dumbbell', title: 'This workout was deleted.', body: 'Your past sessions are still in your history.' })}`;
    const keys = TP.itemKeys(t.items);
    const est = TP.estimateMinutes(t.items);
    const days = Object.entries(store.profile().plan || {}).filter(([, v]) => v === t.id).map(([d]) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d - 1]);
    return html`
      ${pageHead({ title: t.name, eyebrow: days.length ? `In your plan · ${days.join(', ')}` : 'Not in your weekly plan', back: { to: 'plan/training', label: 'Training' },
        actions: t.items.length ? html`<button type="button" class="btn btn--primary btn--sm" data-action="start">${icon('play', { size: 16 })} Start</button>` : '' })}
      <div class="form block-tight">
        <label class="field"><span class="field-label">Name</span><input class="input" value="${t.name}" data-change="name" maxlength="60" aria-label="Workout name"></label>
        <div class="field"><span class="field-label">Type</span>${segmented(TP.KINDS, t.kind, { action: 'kind', name: 'Type' })}</div>
        <div class="grid-2">
          <label class="field"><span class="field-label">About</span>
            <span class="input-unit"><input class="input" type="number" inputmode="numeric" min="5" max="300" step="5" value="${t.minutes ?? ''}" placeholder="${est}" data-change="minutes" aria-label="Length in minutes"><span>min</span></span></label>
          <p class="field-hint tpl-est">${t.items.length ? `Sets and rest add up to about ${est} min.` : ''}</p>
        </div>
        <label class="field"><span class="field-label">Note <small>optional, shown when you start</small></span>
          <input class="input" value="${t.note || ''}" data-change="note" maxlength="160" placeholder="e.g. Warm up 5 minutes first"></label>
      </div>
      <section class="block">
        <div class="block-head"><h2 class="block-title">Exercises</h2><span class="block-meta tnum">${t.items.length ? `${t.items.length} · ${t.items.reduce((a, it) => a + (it.sets || 0), 0)} sets` : ''}</span></div>
        ${t.items.length ? html`<ol class="list sort-list" data-reorder="move-item">${t.items.map((it, i) => {
          const e = F.exercise(it.exerciseId);
          return html`<li class="sort-row" data-key="${keys[i]}">
            <button type="button" class="drag-handle" data-drag aria-label="Move ${e?.name || 'exercise'}" aria-describedby="drag-hint">${icon('grip-vertical', { size: 16 })}</button>
            <button type="button" class="row" data-action="item" data-i="${i}">
              <span class="row-main"><span class="row-title">${e?.name || 'Exercise'}</span><span class="row-sub tnum">${itemLine(it, e)}</span></span>
              <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></button>
          </li>`;
        })}</ol>` : html`<p class="muted">No exercises yet. Add them in the order you’ll do them; you can drag to change it later.</p>`}
        <button type="button" class="btn btn--soft btn--block block-tight" data-action="add">${icon('plus', { size: 16 })} Add exercises</button>
      </section>
      ${linkedBlock('workout', t.id, t.name)}
      <section class="block stack-sm">
        <button type="button" class="btn btn--soft btn--block" data-action="duplicate">${icon('copy', { size: 16 })} Duplicate</button>
        <button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="delete">${icon('trash-2', { size: 16 })} Delete workout</button>
      </section>`;
  },
  actions: {
    start: ({ params }) => startWorkout(params.id),
    kind: ({ data, params }) => { TP.update(params.id, { kind: data.value }); hap.tap(); },
    add: ({ params }) => import('./exercise-picker.js').then((m) => m.pickExercise({ title: 'Add exercises', multi: true, onPick: (id) => TP.addItem(params.id, id) })),
    item: ({ data, params }) => itemSheet(params.id, Number(data.i)),
    'move-item': ({ from, to, params }) => TP.moveItem(params.id, from, to),
    duplicate: ({ params }) => {
      const c = TP.duplicate(params.id);
      if (!c) return;
      hap.success();
      app.replace(`plan/training/workouts/${c.id}`);
      app.toast('Copy made. Rename it and change what you like.', { icon: 'copy' });
    },
    delete: ({ params }) => {
      const t = F.template(params.id);
      if (!t) return;
      // On days of your week, or started by a habit: it says so, and can hand those to another workout.
      safeDelete({ kind: 'workout', id: t.id, name: t.name, records: [{ store: 'templates', id: t.id }], after: () => app.replace('plan/training'),
        message: (to) => `${t.name} deleted${to ? `. ${to} takes its place` : ''}` });
    },
  },
  inputs: {
    name: ({ value, params }) => { if (value.trim()) TP.update(params.id, { name: value.trim() }); },
    minutes: ({ value, params }) => TP.update(params.id, { minutes: value ? Math.max(5, Math.min(300, Math.round(Number(value)))) : null }),
    note: ({ value, params }) => TP.update(params.id, { note: value.trim() }),
  },
};

/** Sets, target, load and rest for one exercise in a workout; swap it for another or remove it. */
function itemSheet(id, i) {
  const it0 = F.template(id)?.items[i];
  if (!it0) return;
  app.sheet({
    title: F.exercise(it0.exerciseId)?.name || 'Exercise',
    render: () => {
      const it = F.template(id)?.items[i];
      if (!it) return '';
      const e = F.exercise(it.exerciseId);
      const rest = it.rest ?? null;
      const restOpts = [{ id: 'auto', label: `Auto · ${restLabel(TP.restDefault(e))}` }, ...TP.REST_CHOICES.map((s) => ({ id: String(s), label: restLabel(s) }))];
      return html`<div class="form">
        ${e?.metric !== 'minutes' ? html`<div class="field"><span class="field-label">Sets</span>
          <div class="stepper" role="group" aria-label="Sets">
            <button type="button" class="icon-btn icon-btn--filled" data-action="sets" data-d="-1" aria-label="One set fewer"${it.sets <= 1 ? ' disabled' : ''}>${icon('minus', { size: 18 })}</button>
            <span class="stepper-val tnum" aria-live="polite">${it.sets}</span>
            <button type="button" class="icon-btn icon-btn--filled" data-action="sets" data-d="1" aria-label="One more set"${it.sets >= 12 ? ' disabled' : ''}>${icon('plus', { size: 18 })}</button>
          </div></div>` : ''}
        <div class="grid-2">
          <label class="field"><span class="field-label">${e?.metric === 'time' ? 'Hold' : e?.metric === 'minutes' ? 'Time' : 'Reps'}</span>
            <input class="input" value="${it.reps || ''}" data-change="reps" maxlength="20" placeholder="${e?.metric === 'time' ? '30–45 s' : e?.metric === 'minutes' ? '20 min' : '8–12'}"></label>
          ${e?.metric === 'reps' ? html`<label class="field"><span class="field-label">Start load</span>
            <span class="input-unit"><input class="input" type="number" inputmode="decimal" min="0" step="0.5" value="${it.load ? fieldNum(kgOut(it.load)) : ''}" placeholder="Bodyweight" data-change="load"><span>${weightUnit()}</span></span></label>` : html`<span></span>`}
        </div>
        <p class="field-hint">A range like 8–12 works well: when you reach the top for every set, the load goes up.</p>
        ${e?.metric !== 'minutes' ? html`<div class="field"><span class="field-label">Rest between sets</span>
          <div class="chip-row" role="group" aria-label="Rest between sets">${restOpts.map((o) => html`<button type="button" class="${cx('chip', (o.id === 'auto' ? rest == null : String(rest) === o.id) && 'is-on')}" aria-pressed="${o.id === 'auto' ? rest == null : String(rest) === o.id}" data-action="rest" data-v="${o.id}">${o.label}</button>`)}</div></div>` : ''}
        <button type="button" class="btn btn--soft btn--block" data-action="swap">${icon('repeat', { size: 16 })} Swap exercise</button>
        <button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="remove">Remove from workout</button>
      </div>`;
    },
    actions: {
      sets: ({ data }) => { const it = F.template(id).items[i]; TP.updateItem(id, i, { sets: Math.max(1, Math.min(12, (it.sets || 1) + Number(data.d))) }); hap.tap(); },
      rest: ({ data }) => { TP.updateItem(id, i, { rest: data.v === 'auto' ? null : Number(data.v) }); hap.tap(); },
      swap: () => import('./exercise-picker.js').then((m) => m.pickExercise({ title: 'Swap for', onPick: (ex) => TP.updateItem(id, i, { exerciseId: ex }) })),
      remove: ({ sheet }) => {
        const before = F.template(id);
        TP.removeItem(id, i);
        app.closeSheet(sheet);
        app.toast(`${F.exercise(it0.exerciseId)?.name || 'Exercise'} removed`, { action: { label: 'Undo', fn: () => store.put('templates', before) } });
      },
    },
    inputs: {
      reps: ({ value }) => TP.updateItem(id, i, { reps: value.trim() }),
      load: ({ value }) => TP.updateItem(id, i, { load: value === '' ? null : Math.round(kgIn(value) * 100) / 100 }),
    },
  });
}

/** A new, empty workout, opened for editing. */
export function newTemplate() {
  const t = TP.create();
  app.go(`plan/training/workouts/${t.id}`);
  return t;
}
