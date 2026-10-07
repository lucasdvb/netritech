import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import { CATEGORIES, SECTIONS, HABIT_TYPES, SCHEDULES, catColor } from '../domain/taxonomy.js';
import { fmtMD } from '../domain/dates.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, segmented, stepper, toggle, settingRow, fieldError } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { takePending } from './habit-new.js';

const ICONS = ['circle', 'sunrise', 'sun', 'moon', 'moon-star', 'bed', 'droplet', 'beef', 'apple', 'salad', 'egg', 'coffee', 'activity', 'dumbbell',
  'footprints', 'bike', 'person-standing', 'heart-pulse', 'scan-eye', 'eye', 'pill', 'leaf', 'flower-2', 'sprout', 'book-open', 'graduation-cap',
  'notebook-pen', 'lightbulb', 'brain', 'hand-heart', 'book-heart', 'church', 'sparkle', 'heart', 'user-round', 'users', 'message-circle', 'house',
  'chef-hat', 'wallet', 'briefcase', 'focus', 'list-checks', 'target', 'power', 'monitor', 'smartphone', 'timer', 'flag', 'star'];
const DAYS = [[1, 'M'], [2, 'T'], [3, 'W'], [4, 'T'], [5, 'F'], [6, 'S'], [7, 'S']];
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const n = (v) => (v === '' || v == null ? null : Number(v));
const STATE_CHOICES = ['focus', 'autopilot', 'queue'].map((id) => ({ id, label: H.STATES[id].label }));

function draftFor(params, ui) {
  const handed = !params.id && takePending();
  if (!handed && ui.draft && ui.draftFor === (params.id || 'new')) return ui.draft;
  const base = handed || (params.id ? structuredClone(H.habit(params.id)) : H.newHabit());
  ui.draft = { ...base, checklist: base.checklist ? [...base.checklist] : [], tiny: base.tiny ? { ...base.tiny } : H.tinyOf(base) ? { ...H.tinyOf(base) } : null, state: H.stateOf(base) };
  ui.draftFor = params.id || 'new';
  ui.errors = {};
  // Arriving from the three-question sheet means you came here for the other options.
  ui.more = !!handed;
  return ui.draft;
}

const focusOthers = (id) => H.focusHabits().filter((h) => h.id !== id).length;

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
            <textarea class="input input--grow${e.name ? ' is-invalid' : ''}" rows="1" data-grow name="name" data-input="f" data-f="name" placeholder="e.g. Evening walk" maxlength="60" ${raw(params.id ? '' : 'autofocus')} aria-invalid="${!!e.name}" enterkeyhint="done">${d.name}</textarea>
            ${fieldError(e.name)}</label>
          <div class="field"><span class="field-label">When <small>after something you already do</small></span>
            <div class="chips" role="group" aria-label="Suggested moments">${H.anchorSuggestions().slice(0, 6).map((a) => html`<button type="button" class="${cx('chip', d.anchor === a && 'is-active')}" aria-pressed="${d.anchor === a}" data-action="anchor" data-v="${a}">${a}</button>`)}</div>
            <textarea class="input input--grow" rows="1" data-grow data-input="f" data-f="anchor" placeholder="After I…" maxlength="60" aria-label="When, in your own words" enterkeyhint="done">${d.anchor || ''}</textarea></div>
          <div class="${numeric && d.type !== 'rating' ? 'grid-2' : ''}">
            <label class="field"><span class="field-label">Tiny version</span>
              <textarea class="input input--grow" rows="1" data-grow data-input="tiny" data-k="label" placeholder="${d.name ? `The two-minute ${d.name.toLowerCase()}` : 'e.g. Read one page'}" maxlength="60" enterkeyhint="done">${d.tiny?.label || ''}</textarea></label>
            ${numeric && d.type !== 'rating' ? html`<label class="field"><span class="field-label">Tiny amount <small>${d.unit || 'counts as tiny'}</small></span>
              <input class="input" type="number" inputmode="decimal" step="any" min="0" value="${d.tiny?.min ?? ''}" data-input="tiny" data-k="min"></label>` : ''}
          </div>
          <p class="field-hint">What you’d still do on your worst day. It always counts, for your score and your run.</p>
          <div class="field"><span class="field-label">State</span>
            ${segmented(STATE_CHOICES, d.state, { action: 'state', name: 'State' })}
            ${fieldError(e.state)}
            <span class="field-hint">${d.state === 'paused' ? `Paused${d.pausedUntil ? ` until ${fmtMD(d.pausedUntil)}` : ''}. Pick a state to bring it back now.` : H.STATES[d.state]?.hint || ''}</span></div>
        </section>

        <details class="disclosure ed-more" ${raw(ui.more ? 'open' : '')}>
          <summary data-action="toggle-more">More options</summary>
          <div class="ed-more-body">
        <section class="ed-group">
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
            ${fieldError(e.target)}` : ''}
          ${d.type === 'binary' || d.type === 'check' ? html`<div class="field"><span class="field-label">Steps <small>optional — one tick still completes it</small></span>
            <ul class="step-edit">${d.checklist.map((item, i) => html`<li data-key="st-${i}"><span class="tnum muted">${i + 1}</span><input class="input" value="${item}" data-input="step" data-i="${i}" aria-label="Step ${i + 1}">
              <button type="button" class="icon-btn icon-btn--sm" data-action="del-step" data-i="${i}" aria-label="Remove step ${i + 1}">${icon('x', { size: 16 })}</button></li>`)}</ul>
            <button type="button" class="link-btn" data-action="add-step">${icon('plus', { size: 16 })} Add a step</button></div>` : ''}
        </section>

        <section class="ed-group">
          <h2 class="ed-title">Schedule</h2>
          <label class="field"><span class="field-label">Frequency</span><select class="input" data-change="kind">${SCHEDULES.map((x) => html`<option value="${x.id}" ${raw(s.kind === x.id ? 'selected' : '')}>${x.label}</option>`)}</select></label>
          ${s.kind === 'weekdays' ? html`<div class="field"><span class="field-label">Days</span><div class="day-pick" role="group" aria-label="Days">${DAYS.map(([v, l]) => html`<button type="button" class="${cx('day-opt', (s.days || []).includes(v) && 'is-on')}" aria-pressed="${(s.days || []).includes(v)}" aria-label="${DAY_NAMES[v]}" data-action="day" data-v="${v}">${l}</button>`)}</div>
            ${fieldError(e.days)}</div>` : ''}
          ${s.kind === 'perWeek' || s.kind === 'perMonth' ? html`<div class="field"><span class="field-label">Times per ${s.kind === 'perWeek' ? 'week' : 'month'}</span>${stepper(s.count || 1, { action: 'count', step: 1, min: 1 })}</div>` : ''}
          ${s.kind === 'interval' ? html`<div class="field"><span class="field-label">Every</span>${stepper(s.every || 7, { action: 'every', step: 1, unit: 'days', min: 2 })}</div>` : ''}
          <div class="grid-2">
            <label class="field"><span class="field-label">Start time <small>optional</small></span><input class="input" type="time" value="${d.time || ''}" data-change="f" data-f="time"></label>
            <label class="field"><span class="field-label">Reminder <small>optional</small></span><input class="input" type="time" value="${d.reminder || ''}" data-change="f" data-f="reminder"></label>
          </div>
        </section>

        <section class="ed-group">
          <h2 class="ed-title">Effort and goal</h2>
          <div class="field"><span class="field-label">Difficulty</span>${segmented([{ id: 1, label: 'Easy' }, { id: 2, label: 'Medium' }, { id: 3, label: 'Hard' }].map((x) => ({ ...x, id: String(x.id) })), String(d.difficulty || 2), { action: 'difficulty', name: 'Difficulty' })}</div>
          <label class="field"><span class="field-label">Goal</span><select class="input" data-change="f" data-f="goalId"><option value="">None</option>${goals.map((g) => html`<option value="${g.id}" ${raw(d.goalId === g.id ? 'selected' : '')}>${g.name}</option>`)}</select></label>
        </section>

        <section class="ed-group">
          <h2 class="ed-title">Behaviour</h2>
          <div class="set-list">
            ${settingRow('Show on Today', toggle(d.showOnToday !== false, { action: 'flag', data: { f: 'showOnToday' }, label: 'Show on Today' }))}
            ${settingRow('Weekly consistency', toggle(d.weekly !== false, { action: 'flag', data: { f: 'weekly' }, label: 'Counts toward weekly consistency' }))}
            ${settingRow('Show best run', toggle(d.streaks, { action: 'flag', data: { f: 'streaks' }, label: 'Show best run' }), { hint: 'A quiet line on the detail screen. No streak pressure on Today.' })}
            ${settingRow('Essential on a minimum day', toggle(d.mvd, { action: 'flag', data: { f: 'mvd' }, label: 'Essential on a minimum day' }), { hint: 'Kept, in its tiny version, when you switch a day to Minimum.' })}
          </div>
        </section>
          </div>
        </details>

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
    state: ({ data, ui, params }) => {
      if (data.value === 'focus' && ui.draft.state !== 'focus' && focusOthers(params.id) >= H.FOCUS_LIMIT) {
        app.toast('Your three are full. Swap one out first.', { action: { label: 'Choose', fn: () => app.go('habits/sort') } });
        return;
      }
      ui.draft.state = data.value;
      ui.errors = { ...ui.errors, state: '' };
      hap.tap();
      app.refresh();
    },
    anchor: ({ data, ui }) => { ui.draft.anchor = ui.draft.anchor === data.v ? null : data.v; hap.tap(); app.refresh(); },
    'toggle-more': ({ ui, event }) => { event.preventDefault(); ui.more = !ui.more; app.refresh(); },
    difficulty: ({ data, ui }) => { ui.draft.difficulty = Number(data.value); app.refresh(); },
    flag: ({ data, ui }) => {
      const f = data.f;
      ui.draft[f] = f === 'showOnToday' || f === 'weekly' ? ui.draft[f] === false : !ui.draft[f];
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
      const before = params.id ? H.habit(params.id) : null;
      const was = before ? H.stateOf(before) : null;
      if (d.state === 'focus' && was !== 'focus' && focusOthers(params.id) >= H.FOCUS_LIMIT) errors.state = 'Your three are full. Choose Later, or swap one out first.';
      ui.errors = errors;
      if (Object.keys(errors).length) {
        if (errors.target || errors.days) ui.more = true;
        app.refresh();
        app.toast('A couple of fields need a look.');
        return;
      }
      const tiny = d.tiny && ((d.tiny.label || '').trim() || d.tiny.min != null) ? { label: (d.tiny.label || '').trim() || null, min: d.tiny.min ?? null } : null;
      // The tiny version replaces the old minimum-day label and target.
      const clean = { ...d, name: d.name.trim(), anchor: (d.anchor || '').trim() || null, tiny, mvdLabel: null, mvdMin: null, checklist: d.checklist.map((x) => x.trim()).filter(Boolean) };
      // A new state brings its own bookkeeping: when focus began, the place in the queue.
      if (d.state !== was && d.state !== 'paused') Object.assign(clean, H.statePatch(before || { ...d, state: 'autopilot' }, d.state, { focusCount: 0 }));
      if (!clean.checklist.length) clean.checklist = null;
      if (clean.type === 'rating') { clean.target = 10; clean.unit = ''; }
      if (clean.type === 'binary' || clean.type === 'check') { clean.target = 1; }
      if (clean.min === '' || clean.min == null || Number.isNaN(clean.min)) clean.min = null;
      store.put('habits', clean);
      hap.success();
      ui.draft = null;
      app.toast(params.id ? 'Habit updated' : clean.state === 'focus' ? `${clean.name} is one of your three.` : 'Habit created', { icon: 'check' });
      app.replace(`habits/${clean.id}`);
    },
  },
  inputs: {
    f: ({ el, value, ui }) => { ui.draft[el.dataset.f] = value === '' && ['time', 'reminder', 'goalId'].includes(el.dataset.f) ? null : value; if (el.tagName === 'SELECT') app.refresh(); },
    num: ({ el, value, ui }) => { ui.draft[el.dataset.f] = n(value); },
    tiny: ({ el, value, ui }) => {
      const t = { label: null, min: null, ...(ui.draft.tiny || {}) };
      t[el.dataset.k] = el.dataset.k === 'min' ? n(value) : value;
      ui.draft.tiny = t;
    },
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
