// Your plan › Your day: the day as blocks you can change. Each block is linked to the habit, routine
// or time behind it (domain/day-blocks.js), so a change here is a change there: Today, the Now card
// and your reminders follow. Tap a block to change its time, length or name; drag one to move it;
// add any habit, routine or a plain block like "Lunch".
import * as D from '../domain/day-blocks.js';
import { parseHM } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { segmented, toggle } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const ANCHORS = new Set(['wake', 'bed']);
const lengthText = (m) => (!m ? '' : m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`);

/** The list on Your plan. */
export function dayPlanner() {
  const list = D.blocks();
  return html`<ol class="card plan-day plan-day--edit sort-list" data-reorder="day-move" aria-label="Your day">${list.map((b) => html`<li class="${cx('plan-block', ANCHORS.has(b.kind) && 'is-anchor')}" data-key="${b.id}">
      ${ANCHORS.has(b.kind) ? html`<span class="drag-gap" aria-hidden="true"></span>`
        : html`<button type="button" class="drag-handle" data-drag aria-label="Move ${b.title}" aria-describedby="drag-hint">${icon('grip-vertical', { size: 16 })}</button>`}
      <button type="button" class="plan-block-main" data-action="day-edit" data-id="${b.id}" aria-label="${b.title} at ${b.time}${b.mins ? `, ${lengthText(b.mins)}` : ''}. Change">
        <span class="plan-time tnum">${b.time}</span>
        <span class="plan-what"><strong>${b.title}</strong>${b.detail || b.mins ? html`<span>${[b.mins && b.kind !== 'bed' ? lengthText(b.mins) : '', b.detail].filter(Boolean).join(' · ')}</span>` : ''}</span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span>
      </button></li>`)}</ol>
    <p class="sr-only" id="drag-hint">Drag, or use the arrow keys, to move a block. It starts when the block before it ends.</p>
    <div class="btn-row plan-day-actions">
      <button type="button" class="btn btn--soft btn--sm" data-action="day-add">${icon('plus', { size: 16 })} Add a block</button>
    </div>`;
}

function editSheet(id) {
  const b = D.block(id);
  if (!b) return;
  const anchor = ANCHORS.has(b.kind);
  const part = b.kind === 'wake' ? 'morning' : b.kind === 'bed' ? 'evening' : null;
  const carried = part ? D.partOf(part) : [];
  app.sheet({
    title: b.title,
    size: 'detent',
    ui: { carry: carried.length > 0, error: '' },
    render: (s) => {
      const cur = D.block(id) || b;
      return html`<form class="form" data-submit="day-save">
        ${D.linkedTo(cur) ? html`<p class="sheet-note">Linked to ${D.linkedTo(cur)}. A change here changes it there too, and its reminders move with it.</p>` : html`<p class="sheet-note">A plain block: it’s in your plan, not on Today.</p>`}
        <div class="grid-2">
          <label class="field"><span class="field-label">Starts</span><input class="input" type="time" name="time" value="${cur.time}" required></label>
          ${cur.kind === 'bed' ? '' : html`<label class="field"><span class="field-label">${cur.kind === 'work' ? 'Length (min)' : 'Minutes'}</span>
            <input class="input" type="number" name="mins" inputmode="numeric" min="0" max="${D.MAX_MINS}" step="5" value="${cur.mins}"></label>`}
        </div>
        ${part && carried.length ? html`<div class="set-row set-row--plain"><span class="set-text"><span class="set-label">Move the ${part} with it</span>
            <span class="set-hint">${carried.slice(0, 3).map((c) => c.title).join(', ')}${carried.length > 3 ? ` and ${carried.length - 3} more` : ''} move by the same amount.</span></span>
          ${toggle(s.ui.carry, { action: 'day-carry', label: `Move the ${part} with it` })}</div>` : ''}
        <label class="field"><span class="field-label">Name${cur.kind === 'plain' ? '' : ' in your day'}</span>
          <input class="input" name="label" value="${cur.label || ''}" maxlength="60" placeholder="${cur.kind === 'plain' ? 'e.g. Lunch' : cur.title}" ${cur.kind === 'plain' ? 'required' : ''}></label>
        <label class="field"><span class="field-label">Note</span><input class="input" name="detail" value="${cur.detail || ''}" maxlength="200" placeholder="What it involves"></label>
        ${s.ui.error ? html`<p class="field-error" role="alert">${s.ui.error}</p>` : ''}
        <button type="submit" class="btn btn--primary btn--block">Save</button>
        ${cur.kind === 'habit' ? html`<button type="button" class="btn btn--ghost btn--block" data-action="nav" data-to="plan/habits/${cur.ref}">Open the habit</button>` : ''}
        ${anchor ? '' : html`<button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="day-remove">Remove from my day</button>`}
      </form>`;
    },
    actions: {
      'day-carry': ({ sheet }) => { sheet.ui.carry = !sheet.ui.carry; sheet.refresh(); },
      'day-save': ({ form, sheet }) => {
        if (!D.validTime(form.time)) { sheet.ui.error = 'Choose a time.'; sheet.refresh(); return; }
        const cur = D.block(id) || b;
        if (cur.kind === 'plain' && !String(form.label || '').trim()) { sheet.ui.error = 'Give the block a name.'; sheet.refresh(); return; }
        const undo = D.edit(id, { time: form.time, mins: form.mins, label: form.label, detail: form.detail }, { carry: sheet.ui.carry });
        hap.success();
        app.closeSheet(sheet);
        const moved = parseHM(form.time) !== parseHM(cur.time);
        app.toast(moved ? `${cur.title} now at ${form.time}` : 'Saved', { action: { label: 'Undo', fn: undo } });
      },
      'day-remove': ({ sheet }) => {
        const undo = D.remove(id);
        hap.tap();
        app.closeSheet(sheet);
        app.toast(`${b.title} taken out of your day`, { action: { label: 'Undo', fn: undo } });
      },
    },
  });
}

function addSheet() {
  const can = D.addable();
  const kinds = [
    { id: 'plain', label: 'Block' },
    ...(can.habits.length ? [{ id: 'habit', label: 'Habit' }] : []),
    ...(can.routines.length ? [{ id: 'routine', label: 'Routine' }] : []),
    ...(can.train ? [{ id: 'train', label: 'Training' }] : []),
    ...(can.work ? [{ id: 'work', label: 'Work' }] : []),
  ];
  app.sheet({
    title: 'Add to your day',
    size: 'detent',
    ui: { kind: 'plain', error: '' },
    render: (s) => {
      const k = s.ui.kind;
      const pick = k === 'habit' ? can.habits : k === 'routine' ? can.routines : [];
      return html`<form class="form" data-submit="day-new">
        ${kinds.length > 1 ? segmented(kinds, k, { action: 'day-kind', name: 'What to add', cls: 'seg--compact' }) : ''}
        ${k === 'plain' ? html`<label class="field"><span class="field-label">Name</span><input class="input" name="label" maxlength="60" placeholder="e.g. Lunch, school run, gym commute" autofocus></label>` : ''}
        ${pick.length ? html`<label class="field"><span class="field-label">${k === 'habit' ? 'Habit' : 'Routine'}</span>
          <select class="input" name="ref" aria-label="${k === 'habit' ? 'Habit' : 'Routine'}">${pick.map((x) => html`<option value="${x.id}">${x.name}${x.time ? ` · ${x.time}` : ''}</option>`)}</select></label>` : ''}
        ${k === 'train' ? html`<p class="sheet-note">Today’s session from your weekly plan, at your training time.</p>` : ''}
        ${k === 'work' ? html`<p class="sheet-note">Your work hours. Work reminders and Today’s work part follow them.</p>` : ''}
        <div class="grid-2">
          <label class="field"><span class="field-label">Starts</span><input class="input" type="time" name="time" value="12:00" required></label>
          <label class="field"><span class="field-label">Minutes</span><input class="input" type="number" name="mins" inputmode="numeric" min="0" max="${D.MAX_MINS}" step="5" value="${k === 'work' ? 480 : k === 'train' ? 60 : 30}"></label>
        </div>
        ${k === 'habit' ? html`<p class="field-hint">If the habit has a time, it moves to this one, and Today shows it here.</p>` : ''}
        ${s.ui.error ? html`<p class="field-error" role="alert">${s.ui.error}</p>` : ''}
        <button type="submit" class="btn btn--primary btn--block">Add</button>
      </form>`;
    },
    actions: {
      'day-kind': ({ data, sheet }) => { sheet.ui.kind = data.value; sheet.ui.error = ''; sheet.refresh(); },
      'day-new': ({ form, sheet }) => {
        const k = sheet.ui.kind;
        if (!D.validTime(form.time)) { sheet.ui.error = 'Choose a time.'; sheet.refresh(); return; }
        if (k === 'plain' && !String(form.label || '').trim()) { sheet.ui.error = 'Give the block a name.'; sheet.refresh(); return; }
        if ((k === 'habit' || k === 'routine') && !form.ref) { sheet.ui.error = 'Choose one.'; sheet.refresh(); return; }
        const { undo } = D.add({ kind: k, ref: form.ref, label: form.label, time: form.time, mins: form.mins });
        hap.success();
        app.closeSheet(sheet);
        app.toast('Added to your day', { action: { label: 'Undo', fn: undo } });
      },
    },
  });
}

export const dayActions = {
  'day-edit': ({ data }) => editSheet(data.id),
  'day-add': () => addSheet(),
  'day-move': ({ from, to }) => {
    const list = D.blocks();
    const b = list[from];
    const undo = D.move(from, to);
    hap.tap();
    const now = b && D.block(b.id);
    if (now) app.toast(`${now.title} now at ${now.time}`, { action: { label: 'Undo', fn: undo } });
  },
};
