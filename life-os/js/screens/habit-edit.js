import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import { PRIORITIES, CATEGORIES, SECTIONS, HABIT_TYPES, SCHEDULES, catColor } from '../domain/taxonomy.js';
import { html, raw, cx, attr } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, segmented, stepper, toggle, settingRow } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const ICONS = ['circle', 'sunrise', 'sun', 'moon', 'moon-star', 'bed', 'droplet', 'beef', 'apple', 'salad', 'egg', 'coffee', 'activity', 'dumbbell',
  'footprints', 'bike', 'person-standing', 'heart-pulse', 'scan-eye', 'eye', 'pill', 'leaf', 'flower-2', 'sprout', 'book-open', 'graduation-cap',
  'notebook-pen', 'lightbulb', 'brain', 'hand-heart', 'book-heart', 'church', 'sparkle', 'heart', 'user-round', 'users', 'message-circle', 'house',
  'chef-hat', 'wallet', 'briefcase', 'focus', 'list-checks', 'target', 'power', 'monitor', 'smartphone', 'timer', 'flag', 'star'];
const DAYS = [[1, 'M'], [2, 'T'], [3, 'W'], [4, 'T'], [5, 'F'], [6, 'S'], [7, 'S']];
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const n = (v) => (v === '' || v == null ? null : Number(v));

function draftFor(params, ui) {
  if (ui.draft && ui.draftFor === (params.id || 'new')) return ui.draft;
  const base = params.id ? structuredClone(H.habit(params.id)) : H.newHabit();
  ui.draft = { ...base, checklist: base.checklist ? [...base.checklist] : [] };
  ui.draftFor = params.id || 'new';
  ui.errors = {};
  return ui.draft;
}

export default {
  id: 'habit-edit',
  title: ({ params }) => (params.id ? 'Edit habit' : 'New habit'),
  render({ params, ui }) {
    if (params.id && !H.habit(params.id)) return html`${pageHead({ title: 'Not found', back: { to: 'habits', label: 'Habits' } })}`;
    const d = draftFor(params, ui);
    const numeric = H.isNumeric(d);
    const s = d.schedule || { kind: 'daily' };
    const goals = store.all('goals').filter((g) => g.status !== 'archived');
    const e = ui.errors || {};
    return html`
      ${pageHead({ title: params.id ? 'Edit habit' : 'New habit', back: params.id ? { to: `habits/${params.id}`, label: d.name || 'Habit' } : { to: 'habits', label: 'Habits' } })}
      <form class="editor" data-submit="save" novalidate>
        <section class="ed-group">
          <label class="field"><span class="field-label">Name</span>
            <input class="input${e.name ? ' is-invalid' : ''}" name="name" value="${d.name}" data-input="f" data-f="name" placeholder="e.g. Evening walk" maxlength="60" ${raw(params.id ? '' : 'autofocus')} aria-invalid="${!!e.name}">
            ${e.name ? html`<span class="field-error">${e.name}</span>` : ''}</label>
          <label class="field"><span class="field-label">Description <small>optional</small></span>
            <textarea class="input" rows="2" data-input="f" data-f="description" placeholder="What counts? Keep it simple.">${d.description || ''}</textarea></label>
          <div class="field"><span class="field-label">Icon</span>
            <div class="icon-grid" role="radiogroup" aria-label="Icon">${ICONS.map((ic) => html`<button type="button" role="radio" aria-checked="${d.icon === ic}" aria-label="${ic}" class="${cx('icon-opt', d.icon === ic && 'is-on')}" data-action="icon" data-v="${ic}" style="--ic:${catColor(d.color || d.category)}">${icon(ic, { size: 18 })}</button>`)}</div></div>
          <div class="grid-2">
            <label class="field"><span class="field-label">Area</span><select class="input" data-change="f" data-f="category">${CATEGORIES.map((c) => html`<option value="${c.id}" ${raw(d.category === c.id ? 'selected' : '')}>${c.label}</option>`)}</select></label>
            <label class="field"><span class="field-label">Today group</span><select class="input" data-change="f" data-f="section">${SECTIONS.map((c) => html`<option value="${c.id}" ${raw(d.section === c.id ? 'selected' : '')}>${c.label}</option>`)}</select></label>
          </div>
        </section>

        <section class="ed-group">
          <h2 class="ed-title">Tracking</h2>
          <label class="field"><span class="field-label">Type</span><select class="input" data-change="type">${HABIT_TYPES.map((t) => html`<option value="${t.id}" ${raw(d.type === t.id ? 'selected' : '')}>${t.label} — ${t.hint}</option>`)}</select></label>
          ${d.source ? html`<p class="field-hint">${icon('info', { size: 14, cls: 'inline-ic' })} Filled automatically from your logs. You can still mark it done by hand.</p>` : ''}
          ${numeric && d.type !== 'rating' ? html`
            <div class="grid-2">
              <label class="field"><span class="field-label">Unit</span><input class="input" value="${d.unit || ''}" data-input="f" data-f="unit" placeholder="min, g, reps…"></label>
              <label class="field"><span class="field-label">Ideal target</span><input class="input${e.target ? ' is-invalid' : ''}" type="number" inputmode="decimal" step="any" min="0" value="${d.target ?? ''}" data-input="num" data-f="target"></label>
              <label class="field"><span class="field-label">Minimum <small>counts as done</small></span><input class="input" type="number" inputmode="decimal" step="any" min="0" value="${d.min ?? ''}" data-input="num" data-f="min" placeholder="= target"></label>
              <label class="field"><span class="field-label">Maximum <small>optional</small></span><input class="input" type="number" inputmode="decimal" step="any" min="0" value="${d.max ?? ''}" data-input="num" data-f="max"></label>
              <label class="field"><span class="field-label">Quick-add step</span><input class="input" type="number" inputmode="decimal" step="any" min="0" value="${d.step ?? 1}" data-input="num" data-f="step"></label>
            </div>
            ${e.target ? html`<span class="field-error">${e.target}</span>` : ''}` : ''}
          ${d.type === 'binary' || d.type === 'check' ? html`<div class="field"><span class="field-label">Steps <small>optional — one tick still completes it</small></span>
            <ul class="step-edit">${d.checklist.map((item, i) => html`<li data-key="st-${i}"><span class="tnum muted">${i + 1}</span><input class="input" value="${item}" data-input="step" data-i="${i}" aria-label="Step ${i + 1}">
              <button type="button" class="icon-btn icon-btn--sm" data-action="del-step" data-i="${i}" aria-label="Remove step ${i + 1}">${icon('x', { size: 16 })}</button></li>`)}</ul>
            <button type="button" class="link-btn" data-action="add-step">${icon('plus', { size: 16 })} Add a step</button></div>` : ''}
        </section>

        <section class="ed-group">
          <h2 class="ed-title">Schedule</h2>
          <label class="field"><span class="field-label">Frequency</span><select class="input" data-change="kind">${SCHEDULES.map((x) => html`<option value="${x.id}" ${raw(s.kind === x.id ? 'selected' : '')}>${x.label}</option>`)}</select></label>
          ${s.kind === 'weekdays' ? html`<div class="field"><span class="field-label">Days</span><div class="day-pick" role="group" aria-label="Days">${DAYS.map(([v, l]) => html`<button type="button" class="${cx('day-opt', (s.days || []).includes(v) && 'is-on')}" aria-pressed="${(s.days || []).includes(v)}" aria-label="${DAY_NAMES[v]}" data-action="day" data-v="${v}">${l}</button>`)}</div>
            ${e.days ? html`<span class="field-error">${e.days}</span>` : ''}</div>` : ''}
          ${s.kind === 'perWeek' || s.kind === 'perMonth' ? html`<div class="field"><span class="field-label">Times per ${s.kind === 'perWeek' ? 'week' : 'month'}</span>${stepper(s.count || 1, { action: 'count', step: 1, min: 1 })}</div>` : ''}
          ${s.kind === 'interval' ? html`<div class="field"><span class="field-label">Every</span>${stepper(s.every || 7, { action: 'every', step: 1, unit: 'days', min: 2 })}</div>` : ''}
          <div class="grid-2">
            <label class="field"><span class="field-label">Start time <small>optional</small></span><input class="input" type="time" value="${d.time || ''}" data-change="f" data-f="time"></label>
            <label class="field"><span class="field-label">Reminder <small>optional</small></span><input class="input" type="time" value="${d.reminder || ''}" data-change="f" data-f="reminder"></label>
          </div>
        </section>

        <section class="ed-group">
          <h2 class="ed-title">Priority</h2>
          ${segmented(PRIORITIES.map((p) => ({ id: p.id, label: p.label })), d.priority, { action: 'priority', name: 'Priority' })}
          <p class="field-hint">${PRIORITIES.find((p) => p.id === d.priority)?.hint}</p>
          <div class="field"><span class="field-label">Difficulty</span>${segmented([{ id: 1, label: 'Easy' }, { id: 2, label: 'Medium' }, { id: 3, label: 'Hard' }].map((x) => ({ ...x, id: String(x.id) })), String(d.difficulty || 2), { action: 'difficulty', name: 'Difficulty' })}</div>
          <label class="field"><span class="field-label">Goal</span><select class="input" data-change="f" data-f="goalId"><option value="">None</option>${goals.map((g) => html`<option value="${g.id}" ${raw(d.goalId === g.id ? 'selected' : '')}>${g.name}</option>`)}</select></label>
        </section>

        <section class="ed-group">
          <h2 class="ed-title">Behaviour</h2>
          <div class="set-list">
            ${settingRow('Counts toward daily score', toggle(d.affectsScore, { action: 'flag', data: { f: 'affectsScore' }, label: 'Counts toward daily score' }), { hint: d.priority === 'optional' ? 'Optional habits never affect the score.' : 'Keep the score to a handful of key habits.' })}
            ${settingRow('Show on Today', toggle(d.showOnToday !== false, { action: 'flag', data: { f: 'showOnToday' }, label: 'Show on Today' }))}
            ${settingRow('Optional', toggle(d.optional, { action: 'flag', data: { f: 'optional' }, label: 'Optional' }), { hint: 'Never creates guilt when missed.' })}
            ${settingRow('Weekly consistency', toggle(d.weekly !== false, { action: 'flag', data: { f: 'weekly' }, label: 'Counts toward weekly consistency' }))}
            ${settingRow('Show best run', toggle(d.streaks, { action: 'flag', data: { f: 'streaks' }, label: 'Show best run' }), { hint: 'A quiet line on the detail screen. No streak pressure on Today.' })}
            ${settingRow('Part of Minimum Day', toggle(d.mvd, { action: 'flag', data: { f: 'mvd' }, label: 'Part of Minimum Day' }))}
          </div>
          ${d.mvd ? html`<div class="grid-2">
            <label class="field"><span class="field-label">Minimum-day label</span><input class="input" value="${d.mvdLabel || ''}" data-input="f" data-f="mvdLabel" placeholder="${d.name || 'e.g. 5-minute version'}"></label>
            ${numeric ? html`<label class="field"><span class="field-label">Minimum-day target</span><input class="input" type="number" inputmode="decimal" step="any" value="${d.mvdMin ?? ''}" data-input="num" data-f="mvdMin"></label>` : ''}
          </div>` : ''}
        </section>

        <div class="ed-actions">
          <button type="button" class="btn btn--ghost" data-action="cancel">Cancel</button>
          <button type="submit" class="btn btn--primary">${params.id ? 'Save changes' : 'Create habit'}</button>
        </div>
      </form>`;
  },
  actions: {
    icon: ({ data, ui }) => { ui.draft.icon = data.v; hap.tap(); app.refresh(); },
    day: ({ data, ui }) => {
      const sch = ui.draft.schedule;
      const v = Number(data.v);
      const days = new Set(sch.days || []);
      days.has(v) ? days.delete(v) : days.add(v);
      sch.days = [...days].sort();
      hap.tap();
      app.refresh();
    },
    count: ({ data, ui }) => { const sch = ui.draft.schedule; sch.count = Math.max(1, Math.min(sch.kind === 'perWeek' ? 7 : 31, (sch.count || 1) + Number(data.delta))); app.refresh(); },
    every: ({ data, ui }) => { const sch = ui.draft.schedule; sch.every = Math.max(2, Math.min(90, (sch.every || 7) + Number(data.delta))); app.refresh(); },
    priority: ({ data, ui }) => {
      ui.draft.priority = data.value;
      if (data.value === 'optional') { ui.draft.optional = true; ui.draft.affectsScore = false; }
      else ui.draft.optional = false;
      hap.tap();
      app.refresh();
    },
    difficulty: ({ data, ui }) => { ui.draft.difficulty = Number(data.value); app.refresh(); },
    flag: ({ data, ui }) => {
      const f = data.f;
      ui.draft[f] = f === 'showOnToday' || f === 'weekly' ? ui.draft[f] === false : !ui.draft[f];
      if (f === 'optional' && ui.draft.optional) { ui.draft.priority = 'optional'; ui.draft.affectsScore = false; }
      if (f === 'optional' && !ui.draft.optional && ui.draft.priority === 'optional') ui.draft.priority = 'high';
      hap.tap();
      app.refresh();
    },
    'add-step': ({ ui }) => { ui.draft.checklist.push(''); app.refresh(); requestAnimationFrame(() => [...document.querySelectorAll('.step-edit input')].pop()?.focus()); },
    'del-step': ({ data, ui }) => { ui.draft.checklist.splice(Number(data.i), 1); app.refresh(); },
    cancel: ({ params, ui }) => { ui.draft = null; app.back(params.id ? `habits/${params.id}` : 'habits'); },
    save: ({ params, ui }) => {
      const d = ui.draft;
      const errors = {};
      if (!d.name.trim()) errors.name = 'Give it a short name.';
      if (H.isNumeric(d) && d.type !== 'rating' && !(Number(d.target) > 0)) errors.target = 'Set a target above zero.';
      if (d.schedule.kind === 'weekdays' && !(d.schedule.days || []).length) errors.days = 'Pick at least one day.';
      ui.errors = errors;
      if (Object.keys(errors).length) { app.refresh(); app.toast('A couple of fields need a look.'); return; }
      const clean = { ...d, name: d.name.trim(), checklist: d.checklist.map((x) => x.trim()).filter(Boolean) };
      if (!clean.checklist.length) clean.checklist = null;
      if (clean.type === 'rating') { clean.target = 10; clean.unit = ''; }
      if (clean.type === 'binary' || clean.type === 'check') { clean.target = 1; }
      if (clean.min === '' || clean.min == null || Number.isNaN(clean.min)) clean.min = null;
      store.put('habits', clean);
      hap.success();
      ui.draft = null;
      app.toast(params.id ? 'Habit updated' : 'Habit created', { icon: 'check' });
      app.replace(`habits/${clean.id}`);
    },
  },
  inputs: {
    f: ({ el, value, ui }) => { ui.draft[el.dataset.f] = value === '' && ['time', 'reminder', 'goalId'].includes(el.dataset.f) ? null : value; if (el.tagName === 'SELECT') app.refresh(); },
    num: ({ el, value, ui }) => { ui.draft[el.dataset.f] = n(value); },
    step: ({ el, value, ui }) => { ui.draft.checklist[Number(el.dataset.i)] = value; },
    type: ({ value, ui }) => {
      ui.draft.type = value;
      if (value === 'duration' && !ui.draft.unit) ui.draft.unit = 'min';
      if (['numeric', 'duration', 'quantity'].includes(value) && !(ui.draft.target > 1)) ui.draft.target = value === 'duration' ? 20 : 10;
      app.refresh();
    },
    kind: ({ value, ui }) => {
      const prev = ui.draft.schedule || {};
      ui.draft.schedule = { kind: value, days: prev.days || [1, 2, 3, 4, 5], count: prev.count || (value === 'perMonth' ? 2 : 3), every: prev.every || 14 };
      app.refresh();
    },
  },
};
