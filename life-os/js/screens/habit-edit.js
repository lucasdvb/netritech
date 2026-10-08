// The habit editor, as a sheet: name, when, tiny version and state up front; everything else
// under "More options". Changes to an existing habit save as you make them, and closing the
// sheet offers Undo. A new habit (from "More options" in the three questions) has a Create button.
import * as store from '../data/store.js';
import * as HS from '../domain/habit-system.js';
import * as H from '../domain/habits-more.js';
import { CATEGORIES, SECTIONS, HABIT_TYPES, SCHEDULES, catColor } from '../domain/taxonomy.js';
import { fmtMD } from '../domain/dates.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { segmented, stepper, toggle, settingRow, fieldError } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const ICONS = ['circle', 'sunrise', 'sun', 'moon', 'moon-star', 'bed', 'droplet', 'beef', 'apple', 'salad', 'egg', 'coffee', 'activity', 'dumbbell',
  'footprints', 'bike', 'person-standing', 'heart-pulse', 'scan-eye', 'eye', 'pill', 'leaf', 'flower-2', 'sprout', 'book-open', 'graduation-cap',
  'notebook-pen', 'lightbulb', 'brain', 'hand-heart', 'book-heart', 'church', 'sparkle', 'heart', 'user-round', 'users', 'message-circle', 'house',
  'chef-hat', 'wallet', 'piggy-bank', 'receipt', 'briefcase', 'focus', 'list-checks', 'target', 'power', 'monitor', 'smartphone', 'timer', 'flag', 'star',
  'glass-water', 'trending-up', 'circle-dot', 'ruler', 'camera', 'image', 'scroll-text', 'calendar', 'calendar-days', 'cake', 'calendar-heart'];
const DAYS = [[1, 'M'], [2, 'T'], [3, 'W'], [4, 'T'], [5, 'F'], [6, 'S'], [7, 'S']];
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const n = (v) => (v === '' || v == null ? null : Number(v));
const STATE_CHOICES = ['focus', 'autopilot', 'queue'].map((id) => ({ id, label: H.STATES[id].label }));
const focusOthers = (id) => H.focusHabits().filter((h) => h.id !== id).length;

function draftOf(h) {
  return { ...structuredClone(h), checklist: h.checklist ? [...h.checklist] : [], tiny: H.tinyOf(h) ? { ...H.tinyOf(h) } : null, state: H.stateOf(h) };
}

/** What's wrong with a draft, by field. */
function check(d, id) {
  const errors = {};
  if (!d.name.trim()) errors.name = 'Give it a short name.';
  if (H.isNumeric(d) && d.type !== 'rating' && !(Number(d.target) > 0)) errors.target = 'Set a target above zero.';
  if (d.schedule.kind === 'weekdays' && !(d.schedule.days || []).length) errors.days = 'Pick at least one day.';
  const was = id ? H.stateOf(H.habit(id)) : null;
  if (d.state === 'focus' && was !== 'focus' && focusOthers(id) >= H.focusLimit()) errors.state = `Your ${H.focusWord()} are full. Choose Later, or swap one out first.`;
  return errors;
}

/** The record a valid draft becomes. */
function clean(d, before) {
  const tiny = d.tiny && ((d.tiny.label || '').trim() || d.tiny.min != null) ? { label: (d.tiny.label || '').trim() || null, min: d.tiny.min ?? null } : null;
  // The tiny version replaces the old minimum-day label and target.
  const out = { ...d, name: d.name.trim(), anchor: (d.anchor || '').trim() || null, tiny, mvdLabel: null, mvdMin: null, checklist: d.checklist.map((x) => x.trim()).filter(Boolean) };
  if (!out.checklist.length) out.checklist = null;
  out.why = (d.why || '').trim() || null;
  out.backup = (d.backup?.then || '').trim() ? { when: (d.backup.when || '').trim() || null, then: d.backup.then.trim() } : null;
  if (out.type === 'rating') { out.target = 10; out.unit = ''; }
  if (out.type === 'binary' || out.type === 'check') out.target = 1;
  if (out.min === '' || out.min == null || Number.isNaN(out.min)) out.min = null;
  // A target you set yourself replaces the automatic ramp (steps start at 7,000 and step up).
  if (before?.ramp && Number(d.target) !== Number(before.target)) out.ramp = null;
  // A new state brings its own bookkeeping: when focus began, the place in the queue.
  const was = before ? H.stateOf(before) : null;
  if (d.state !== was && d.state !== 'paused') Object.assign(out, HS.statePatch(before || { ...d, state: 'autopilot' }, d.state, { focusCount: 0 }));
  return out;
}

/** Open the editor for a habit id, or for a new habit's draft. */
export function openHabitEditor(target) {
  const isNew = typeof target !== 'string';
  const original = isNew ? null : H.habit(target);
  if (!isNew && !original) return;
  const draft = draftOf(isNew ? target : original);
  const id = isNew ? null : original.id;
  let saveTimer = null;
  let pending = false;

  // Existing habits save as you go: each valid change is written at once (typing waits a beat).
  const commit = (sheet, { soon = false } = {}) => {
    const u = sheet.ui;
    u.errors = check(u.draft, id);
    if (isNew) return;
    clearTimeout(saveTimer);
    const write = () => {
      pending = false;
      if (Object.keys(check(u.draft, id)).length) return;
      store.put('habits', clean(u.draft, H.habit(id)));
      u.changed = true;
      // Later saves compare against the record as it now is.
      u.draft.state = H.stateOf(H.habit(id));
    };
    if (soon) { pending = true; saveTimer = setTimeout(write, 400); } else write();
  };
  const changed = (sheet, opts) => { commit(sheet, opts); if (!opts?.soon) sheet.refresh(); };

  const s = app.sheet({
    title: isNew ? 'New habit' : `Edit ${original.name}`,
    size: 'detent',
    ui: { draft, errors: {}, more: isNew, isNew, changed: false },
    render: (sheet) => {
      const u = sheet.ui;
      const d = u.draft;
      const numeric = H.isNumeric(d);
      const s = d.schedule || { kind: 'daily' };
      const goals = store.all('goals').filter((g) => g.status !== 'archived');
      const e = u.errors || {};
      return html`<form class="editor" data-submit="save" novalidate>
        <section class="ed-group">
          <label class="field"><span class="field-label">Name</span>
            <textarea class="input input--grow${e.name ? ' is-invalid' : ''}" rows="1" data-grow name="name" data-input="f" data-f="name" placeholder="e.g. Evening walk" maxlength="60" ${raw(u.isNew ? 'autofocus' : '')} aria-invalid="${!!e.name}" enterkeyhint="done">${d.name}</textarea>
            ${fieldError(e.name)}</label>
          <div class="field"><span class="field-label">When <small>after something you already do</small></span>
            <div class="chips" role="group" aria-label="Suggested moments">${HS.anchorSuggestions().slice(0, 6).map((a) => html`<button type="button" class="${cx('chip', d.anchor === a && 'is-active')}" aria-pressed="${d.anchor === a}" data-action="anchor" data-v="${a}">${a}</button>`)}</div>
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

        <details class="disclosure ed-more" ${raw(u.more ? 'open' : '')}>
          <summary data-action="toggle-more">More options</summary>
          <div class="ed-more-body">
        <section class="ed-group">
          <label class="field"><span class="field-label">Description <small>optional</small></span>
            <textarea class="input" rows="2" data-input="f" data-f="description" placeholder="What counts? Keep it simple.">${d.description || ''}</textarea></label>
          <div class="field"><span class="field-label">Icon</span>
            <div class="icon-grid" role="radiogroup" aria-label="Icon">${(ICONS.includes(d.icon) || !d.icon ? ICONS : [d.icon, ...ICONS]).map((ic) => html`<button type="button" role="radio" aria-checked="${d.icon === ic}" aria-label="${ic}" class="${cx('icon-opt', d.icon === ic && 'is-on')}" data-action="icon" data-v="${ic}" style="--ic:${catColor(d.color || d.category)}">${icon(ic, { size: 18 })}</button>`)}</div></div>
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
          <h2 class="ed-title">For the days you'd skip</h2>
          <label class="field"><span class="field-label">Your why <small>who this makes you</small></span>
            <textarea class="input input--grow" rows="1" data-grow data-input="f" data-f="why" placeholder="I’m someone who…" maxlength="120" enterkeyhint="done">${d.why || ''}</textarea></label>
          <div class="grid-2">
            <label class="field"><span class="field-label">Backup plan: if…</span><input class="input" value="${d.backup?.when || ''}" data-input="backup" data-k="when" placeholder="It rains" maxlength="60"></label>
            <label class="field"><span class="field-label">…then</span><input class="input" value="${d.backup?.then || ''}" data-input="backup" data-k="then" placeholder="20 minutes at home" maxlength="80"></label>
          </div>
          <p class="field-hint">Shown when you go to mark it “not today”.</p>
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

        ${u.isNew ? html`<div class="ed-actions"><button type="submit" class="btn btn--primary btn--block">Create habit</button></div>`
          : html`<p class="field-hint ed-autosave">${icon('check', { size: 14, cls: 'inline-ic' })} Changes save as you go.</p>`}
      </form>`;
    },
    onClose: () => {
      clearTimeout(saveTimer);
      if (isNew) return;
      const u = s.ui;
      if (pending && !Object.keys(check(u.draft, id)).length) { store.put('habits', clean(u.draft, H.habit(id))); u.changed = true; }
      if (!u.changed || !H.habit(id)) return;
      app.toast('Changes saved', { action: { label: 'Undo', fn: () => store.put('habits', original) } });
    },
    actions: {
      icon: ({ data, sheet }) => { sheet.ui.draft.icon = data.v; hap.tap(); changed(sheet); },
      day: ({ data, sheet }) => {
        const sch = sheet.ui.draft.schedule;
        const v = Number(data.v);
        const days = new Set(sch.days || []);
        days.has(v) ? days.delete(v) : days.add(v);
        sch.days = [...days].sort();
        hap.tap();
        changed(sheet);
      },
      count: ({ data, sheet }) => { const sch = sheet.ui.draft.schedule; sch.count = Math.max(1, Math.min(sch.kind === 'perWeek' ? 7 : 31, (sch.count || 1) + Number(data.delta))); changed(sheet); },
      every: ({ data, sheet }) => { const sch = sheet.ui.draft.schedule; sch.every = Math.max(2, Math.min(90, (sch.every || 7) + Number(data.delta))); changed(sheet); },
      state: ({ data, sheet }) => {
        if (data.value === 'focus' && sheet.ui.draft.state !== 'focus' && focusOthers(id) >= H.focusLimit()) {
          app.toast(`Your ${H.focusWord()} are full. Swap one out first.`, { action: { label: 'Choose', fn: () => { app.closeSheet(sheet); app.go('plan/habits/sort'); } } });
          return;
        }
        sheet.ui.draft.state = data.value;
        hap.tap();
        changed(sheet);
      },
      anchor: ({ data, sheet }) => { const d = sheet.ui.draft; d.anchor = d.anchor === data.v ? null : data.v; hap.tap(); changed(sheet); },
      'toggle-more': ({ sheet, event }) => { event.preventDefault(); sheet.ui.more = !sheet.ui.more; if (sheet.ui.more) sheet.expand?.(); sheet.refresh(); },
      difficulty: ({ data, sheet }) => { sheet.ui.draft.difficulty = Number(data.value); changed(sheet); },
      flag: ({ data, sheet }) => {
        const d = sheet.ui.draft;
        const f = data.f;
        d[f] = f === 'showOnToday' || f === 'weekly' ? d[f] === false : !d[f];
        hap.tap();
        changed(sheet);
      },
      'add-step': ({ sheet }) => { sheet.ui.draft.checklist.push(''); sheet.refresh(); requestAnimationFrame(() => [...sheet.el.querySelectorAll('.step-edit input')].pop()?.focus()); },
      'del-step': ({ data, sheet }) => { sheet.ui.draft.checklist.splice(Number(data.i), 1); changed(sheet); },
      save: ({ sheet }) => {
        const u = sheet.ui;
        u.errors = check(u.draft, null);
        if (Object.keys(u.errors).length) {
          if (u.errors.target || u.errors.days) u.more = true;
          sheet.refresh();
          app.toast('A couple of fields need a look.');
          return;
        }
        const h = store.put('habits', clean(u.draft, null));
        hap.success();
        app.closeSheet(sheet);
        app.toast(h.state === 'focus' ? `${h.name} is one of your ${H.focusWord()}.` : h.state === 'queue' ? `${h.name} is waiting in Later.` : 'Habit created', {
          icon: 'check', action: { label: 'Open', fn: () => app.go(`plan/habits/${h.id}`) },
        });
      },
    },
    inputs: {
      f: ({ el, value, sheet }) => {
        const d = sheet.ui.draft;
        d[el.dataset.f] = value === '' && ['time', 'reminder', 'goalId'].includes(el.dataset.f) ? null : value;
        changed(sheet, { soon: el.tagName !== 'SELECT' && el.type !== 'time' });
      },
      num: ({ el, value, sheet }) => { sheet.ui.draft[el.dataset.f] = n(value); changed(sheet, { soon: true }); },
      tiny: ({ el, value, sheet }) => {
        const t = { label: null, min: null, ...(sheet.ui.draft.tiny || {}) };
        t[el.dataset.k] = el.dataset.k === 'min' ? n(value) : value;
        sheet.ui.draft.tiny = t;
        changed(sheet, { soon: true });
      },
      step: ({ el, value, sheet }) => { sheet.ui.draft.checklist[Number(el.dataset.i)] = value; changed(sheet, { soon: true }); },
      backup: ({ el, value, sheet }) => { sheet.ui.draft.backup = { when: '', then: '', ...(sheet.ui.draft.backup || {}), [el.dataset.k]: value }; changed(sheet, { soon: true }); },
      type: ({ value, sheet }) => {
        const d = sheet.ui.draft;
        d.type = value;
        if (value === 'duration' && !d.unit) d.unit = 'min';
        if (['numeric', 'duration', 'quantity'].includes(value) && !(d.target > 1)) d.target = value === 'duration' ? 20 : 10;
        changed(sheet);
      },
      kind: ({ value, sheet }) => {
        const d = sheet.ui.draft;
        const prev = d.schedule || {};
        d.schedule = { kind: value, days: prev.days || [1, 2, 3, 4, 5], count: prev.count || (value === 'perMonth' ? 2 : 3), every: prev.every || 14 };
        changed(sheet);
      },
    },
  });
  if (isNew) s.expand?.();
  return s;
}
