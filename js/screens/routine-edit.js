// Edit a routine: its name, window and days, and its steps in order (habits or plain lines).
// Saves as you go; closing the sheet offers Undo. New routines start empty.
import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import * as R from '../domain/routines.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { deleteWithUndo } from '../ui/undo.js';

const DAYS = [[1, 'M', 'Monday'], [2, 'T', 'Tuesday'], [3, 'W', 'Wednesday'], [4, 'T', 'Thursday'], [5, 'F', 'Friday'], [6, 'S', 'Saturday'], [7, 'S', 'Sunday']];

export function newRoutine() {
  const order = Math.max(0, ...R.routines().map((r) => r.order ?? 0)) + 1;
  const r = store.put('routines', { id: store.uid(), name: 'New routine', kind: 'custom', order, days: null, window: { from: '12:00', to: '14:00' }, steps: [] });
  openRoutineEditor(r.id, { isNew: true });
}

export function openRoutineEditor(id, { isNew = false } = {}) {
  const original = R.routine(id);
  if (!original) return;
  let changed = false;
  const save = (patch) => { store.put('routines', { ...R.routine(id), ...patch }); changed = true; };
  const s = app.sheet({
    title: isNew ? 'New routine' : `Edit ${original.name}`,
    size: 'detent',
    render: () => {
      const r = R.routine(id);
      if (!r) return '';
      const used = new Set(R.routines().flatMap((x) => (x.steps || []).map((st) => st.habitId)).filter(Boolean));
      const addable = H.activeHabits().filter((h) => !used.has(h.id) && !['queue', 'paused'].includes(H.stateOf(h)));
      const days = r.days || [];
      return html`<div class="form routine-edit">
        <label class="field"><span class="field-label">Name</span>
          <input class="input" value="${r.name}" data-change="name" maxlength="40" ${raw(isNew ? 'autofocus' : '')}></label>
        <div class="grid-2">
          <label class="field"><span class="field-label">From</span><input class="input" type="time" value="${r.window?.from || ''}" data-change="from"></label>
          <label class="field"><span class="field-label">Until</span><input class="input" type="time" value="${r.window?.to || ''}" data-change="to"></label>
        </div>
        <div class="field"><span class="field-label">Days <small>${days.length ? '' : 'every day'}</small></span>
          <div class="day-pick" role="group" aria-label="Days">${DAYS.map(([v, l, name]) => html`<button type="button" class="${cx('day-opt', days.includes(v) && 'is-on')}" aria-pressed="${days.includes(v)}" aria-label="${name}" data-action="day" data-v="${v}">${l}</button>`)}</div></div>
        <div class="field"><span class="field-label">Steps, in order</span>
          ${(r.steps || []).length ? html`<ol class="re-steps">${r.steps.map((st, i) => {
            const h = st.habitId ? H.habit(st.habitId) : null;
            return html`<li class="re-step" data-key="re-${st.id}">
              <span class="tnum muted">${i + 1}</span>
              ${h ? html`<span class="re-name">${h.name}<small>Habit</small></span>`
                : html`<input class="input" value="${st.label || ''}" data-change="label" data-id="${st.id}" aria-label="Step ${i + 1}" maxlength="60">`}
              <button type="button" class="icon-btn icon-btn--sm" data-action="move" data-id="${st.id}" data-delta="-1" aria-label="Move step ${i + 1} up"${i === 0 ? ' disabled' : ''}>${icon('chevron-up', { size: 16 })}</button>
              <button type="button" class="icon-btn icon-btn--sm" data-action="move" data-id="${st.id}" data-delta="1" aria-label="Move step ${i + 1} down"${i === r.steps.length - 1 ? ' disabled' : ''}>${icon('chevron-down', { size: 16 })}</button>
              <button type="button" class="icon-btn icon-btn--sm" data-action="remove" data-id="${st.id}" aria-label="Remove step ${i + 1}">${icon('x', { size: 16 })}</button>
            </li>`;
          })}</ol>` : html`<p class="field-hint">No steps yet. Add habits you already do one after another, or plain steps like “make the bed”.</p>`}
        </div>
        <div class="grid-2 re-add">
          <label class="field"><span class="field-label">Add a habit</span>
            <select class="input" data-change="add-habit"><option value="">Choose…</option>${addable.map((h) => html`<option value="${h.id}">${h.name}</option>`)}</select></label>
          <label class="field"><span class="field-label">Add a plain step</span>
            <input class="input" data-change="add-label" placeholder="e.g. Make the bed" maxlength="60" enterkeyhint="done"></label>
        </div>
        <p class="field-hint">${icon('check', { size: 14, cls: 'inline-ic' })} Changes save as you go. A habit can be in one routine at a time.</p>
        <button type="button" class="btn btn--ghost btn--danger-text" data-action="delete">${icon('trash-2', { size: 18 })} Delete routine</button>
      </div>`;
    },
    onClose: () => {
      if (isNew || !changed || !R.routine(id)) return;
      app.toast('Routine saved', { action: { label: 'Undo', fn: () => store.put('routines', original) } });
    },
    actions: {
      day: ({ data }) => {
        const v = Number(data.v);
        const set = new Set(R.routine(id).days || []);
        set.has(v) ? set.delete(v) : set.add(v);
        save({ days: set.size && set.size < 7 ? [...set].sort() : null });
        hap.tap();
      },
      move: ({ data }) => {
        const steps = [...R.routine(id).steps];
        const i = steps.findIndex((x) => x.id === data.id);
        const j = i + Number(data.delta);
        if (j < 0 || j >= steps.length) return;
        [steps[i], steps[j]] = [steps[j], steps[i]];
        save({ steps });
        hap.tap();
      },
      remove: ({ data }) => { save({ steps: R.routine(id).steps.filter((x) => x.id !== data.id) }); hap.tap(); },
      delete: ({ sheet }) => {
        const r = R.routine(id);
        changed = false;
        app.closeSheet(sheet);
        deleteWithUndo([{ store: 'routines', id }], `${r.name} deleted. Its habits are still there.`);
      },
    },
    inputs: {
      name: ({ value }) => { if (value.trim()) save({ name: value.trim() }); },
      from: ({ value }) => { if (value) save({ window: { ...R.routine(id).window, from: value } }); },
      to: ({ value }) => { if (value) save({ window: { ...R.routine(id).window, to: value } }); },
      label: ({ el, value }) => save({ steps: R.routine(id).steps.map((x) => (x.id === el.dataset.id ? { ...x, label: value.trim() || x.label } : x)) }),
      'add-habit': ({ el, value }) => {
        if (!value) return;
        save({ steps: [...R.routine(id).steps, { id: `s-${value}`, habitId: value }] });
        el.value = '';
        hap.tap();
      },
      'add-label': ({ el, value }) => {
        const t = value.trim();
        if (!t) return;
        save({ steps: [...R.routine(id).steps, { id: store.uid(), label: t }] });
        el.value = '';
        hap.tap();
      },
    },
  });
  return s;
}
