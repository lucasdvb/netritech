// Shared task pieces: the row used on Today and the Tasks screen, and the add/edit sheet.
import * as T from '../core/tasks.js';
import { CATEGORIES, catColor, catLabel } from '../core/taxonomy.js';
import { today, addDays, weekday, fromISO } from '../core/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { check, segmented } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const DAYS = [[1, 'M'], [2, 'T'], [3, 'W'], [4, 'T'], [5, 'F'], [6, 'S'], [7, 'S']];
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function taskRow(t, { showDue = true, ref = today() } = {}) {
  const late = !t.done && t.date && t.date < ref;
  const meta = [showDue || late ? T.dueLabel(t.date, ref) : '', t.repeat ? T.repeatLabel(t.repeat) : '', catLabel(t.area)].filter(Boolean);
  return html`<li class="${cx('trow', t.done && 'is-done', late && 'is-late')}" data-key="t-${t.id}" style="--ic:${catColor(t.area)}">
    ${check(t.done, { action: 'task-check', data: { id: t.id }, label: `${t.title}${t.done ? ', done' : ''}`, color: catColor(t.area), cls: 'check--sm' })}
    <button type="button" class="trow-main" data-action="task-open" data-id="${t.id}">
      <span class="trow-title">${t.title}</span>
      <span class="trow-meta">${t.repeat ? icon('repeat', { size: 12 }) : ''}${meta.join(' · ')}</span>
    </button>
  </li>`;
}

/** Shared actions for any screen that shows task rows. */
export const taskActions = {
  'task-check': ({ data }) => {
    const t = T.task(data.id);
    if (!t) return;
    const now = T.toggle(data.id);
    if (now) {
      hap.success();
      if (t.repeat) app.toast(`Done. Next one ${T.dueLabel(T.task(T.task(data.id)?.nextId)?.date).toLowerCase()}.`, { icon: 'repeat' });
    } else hap.tap();
  },
  'task-open': ({ data }) => openTask(data.id),
};

const whenOptions = (ref) => {
  const sat = addDays(ref, (6 - weekday(ref) + 7) % 7 || 7);
  const mon = addDays(ref, 8 - weekday(ref));
  return [['Today', ref], ['Tomorrow', addDays(ref, 1)], [weekday(ref) >= 6 ? 'Next weekend' : 'Weekend', sat], ['Next week', mon], ['Anytime', '']];
};

/** Add (no id) or edit a task. `defaults` pre-fills a new one: { date, area, title }. */
export function openTask(id = null, defaults = {}) {
  const cur = id ? T.task(id) : null;
  if (id && !cur) return;
  const ui = {
    title: cur?.title ?? defaults.title ?? '',
    notes: cur?.notes ?? '',
    area: cur?.area ?? defaults.area ?? 'life',
    date: cur ? cur.date || '' : defaults.date ?? today(),
    repeat: cur?.repeat ? cur.repeat.kind : 'none',
    day: cur?.repeat?.kind === 'weekly' ? cur.repeat.day : null,
    mday: cur?.repeat?.kind === 'monthly' ? cur.repeat.day : null,
    error: '',
  };
  const repeatOf = () => {
    if (ui.repeat === 'weekly') return { kind: 'weekly', day: ui.day || (ui.date ? weekday(ui.date) : weekday(today())) };
    if (ui.repeat === 'monthly') return { kind: 'monthly', day: ui.mday || Math.min(28, fromISO(ui.date || today()).getDate()) };
    return null;
  };
  app.sheet({
    title: cur ? 'Edit task' : 'New task',
    ui,
    render: (s) => {
      const u = s.ui;
      const opts = whenOptions(today());
      const custom = u.date && !opts.some(([, d]) => d === u.date);
      return html`<div class="form task-form">
        <label class="field"><span class="field-label">Task</span>
          <input class="input" data-input="title" value="${u.title}" placeholder="What needs doing?" maxlength="140" enterkeyhint="done" autofocus>
          ${u.error ? html`<span class="field-error" role="alert">${u.error}</span>` : ''}</label>
        <div class="field"><span class="field-label">When</span>
          <div class="chips">${opts.map(([label, d]) => html`<button type="button" class="${cx('chip', u.date === d && 'is-active')}" aria-pressed="${u.date === d}" data-action="when" data-date="${d}">${label}</button>`)}</div>
          <input class="input input--date" type="date" value="${u.date}" data-change="date" aria-label="Pick a date">
          ${custom ? html`<span class="field-hint">${T.dueLabel(u.date)}</span>` : ''}</div>
        <div class="field"><span class="field-label">Repeat</span>
          ${segmented(T.REPEATS.map((r) => ({ id: r.id, label: r.id === 'none' ? 'Once' : r.id === 'weekly' ? 'Weekly' : 'Monthly' })), u.repeat, { action: 'repeat', name: 'Repeat', size: 'sm' })}
          ${u.repeat === 'weekly' ? html`<div class="day-pick" role="group" aria-label="Day of the week">${DAYS.map(([v, l]) => {
            const on = (repeatOf()?.day) === v;
            return html`<button type="button" class="${cx('day-opt', on && 'is-on')}" aria-pressed="${on}" aria-label="${DAY_NAMES[v]}" data-action="rday" data-v="${v}">${l}</button>`;
          })}</div>` : ''}
          ${u.repeat === 'monthly' ? html`<select class="input" data-change="mday" aria-label="Day of the month">${Array.from({ length: 28 }, (_, i) => i + 1).map((n) => html`<option value="${n}" ${repeatOf().day === n ? 'selected' : ''}>On day ${n}</option>`)}</select>` : ''}
          ${u.repeat !== 'none' ? html`<span class="field-hint">${T.repeatLabel(repeatOf())}. Ticking one schedules the next, so missed ones never pile up.</span>` : ''}</div>
        <div class="field"><span class="field-label">Area</span>
          <div class="chips">${CATEGORIES.map((c) => html`<button type="button" class="${cx('chip chip--area', u.area === c.id && 'is-active')}" style="--ic:${catColor(c.id)}" aria-pressed="${u.area === c.id}" data-action="area" data-id="${c.id}"><i class="chip-dot" aria-hidden="true"></i>${c.label}</button>`)}</div></div>
        <label class="field"><span class="field-label">Notes <span class="muted">(optional)</span></span>
          <textarea class="input" rows="2" data-input="notes">${u.notes}</textarea></label>
        <button type="button" class="btn btn--primary btn--block" data-action="save">${cur ? 'Save' : 'Add task'}</button>
        ${cur ? html`<button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="delete">${icon('trash-2', { size: 16 })} Delete task</button>` : ''}
      </div>`;
    },
    inputs: {
      title: ({ sheet, value }) => { sheet.ui.title = value; if (sheet.ui.error && value.trim()) { sheet.ui.error = ''; sheet.refresh(); } },
      notes: ({ sheet, value }) => { sheet.ui.notes = value; },
      date: ({ sheet, value }) => { sheet.ui.date = value || ''; sheet.refresh(); },
      mday: ({ sheet, value }) => { sheet.ui.mday = Number(value); sheet.refresh(); },
    },
    actions: {
      when: ({ sheet, data }) => { sheet.ui.date = data.date || ''; sheet.refresh(); },
      repeat: ({ sheet, data }) => { sheet.ui.repeat = data.value; sheet.refresh(); },
      rday: ({ sheet, data }) => { sheet.ui.day = Number(data.v); sheet.refresh(); },
      area: ({ sheet, data }) => { sheet.ui.area = data.id; sheet.refresh(); },
      save: ({ sheet }) => {
        const u = sheet.ui;
        const title = (sheet.el.querySelector('input[data-input="title"]')?.value ?? u.title).trim();
        if (!title) { u.error = 'Give the task a name.'; sheet.refresh(); return; }
        const repeat = repeatOf();
        // A repeating task lands on its first matching day unless you picked one that already matches.
        let date = u.date || null;
        if (repeat && (!date || T.firstDate(repeat, date) !== date)) date = T.firstDate(repeat, date && date > today() ? date : today());
        const notes = (sheet.el.querySelector('textarea[data-input="notes"]')?.value ?? u.notes).trim();
        if (cur) T.save(cur.id, { title, notes, area: u.area, date, repeat });
        else T.add({ title, notes, area: u.area, date, repeat });
        hap.success();
        app.closeSheet(sheet);
        if (!cur) app.toast(`Added · ${T.dueLabel(date).toLowerCase() === 'anytime' ? 'anytime' : T.dueLabel(date).toLowerCase()}`, { icon: 'check' });
      },
      delete: ({ sheet }) => {
        const rec = T.task(cur.id);
        T.remove(cur.id);
        app.closeSheet(sheet);
        app.toast('Task deleted', { action: { label: 'Undo', fn: () => import('../core/store.js').then((s) => s.put('tasks', rec)) } });
      },
    },
  });
}
