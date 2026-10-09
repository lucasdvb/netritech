// The add/edit task sheet, loaded the first time you open a task.
import * as T from '../domain/tasks-more.js';
import * as P from '../domain/projects.js';
import { CATEGORIES, catColor } from '../domain/taxonomy.js';
import { today, addDays, weekday, fromISO } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const DAYS = [[1, 'M'], [2, 'T'], [3, 'W'], [4, 'T'], [5, 'F'], [6, 'S'], [7, 'S']];
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
    days: cur?.repeat?.kind === 'weekly' ? (cur.repeat.days?.length ? cur.repeat.days : [cur.repeat.day]) : null,
    mday: cur?.repeat?.kind === 'monthly' ? cur.repeat.day : null,
    every: cur?.repeat?.kind === 'daily' ? cur.repeat.n || 1 : 1,
    projectId: cur ? cur.projectId || null : defaults.projectId || null,
    error: '',
  };
  const repeatOf = () => {
    if (ui.repeat === 'daily') return { kind: 'daily', n: ui.every || 1 };
    if (ui.repeat === 'weekly') {
      const days = ui.days?.length ? [...ui.days].sort() : [ui.date ? weekday(ui.date) : weekday(today())];
      return days.length === 1 ? { kind: 'weekly', day: days[0] } : { kind: 'weekly', day: days[0], days };
    }
    if (ui.repeat === 'monthly') return { kind: 'monthly', day: ui.mday || Math.min(28, fromISO(ui.date || today()).getDate()) };
    if (ui.repeat === 'yearly') { const d = fromISO(ui.date || today()); return { kind: 'yearly', month: d.getMonth() + 1, day: d.getDate() }; }
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
          <input class="input" data-input="title" data-enter="save" value="${u.title}" placeholder="What needs doing?" maxlength="140" enterkeyhint="done" autofocus aria-label="Task">
          ${u.error ? html`<span class="field-error" role="alert">${u.error}</span>` : ''}</label>
        <div class="field"><span class="field-label">When</span>
          <div class="chips">${opts.map(([label, d]) => html`<button type="button" class="${cx('chip', u.date === d && 'is-active')}" aria-pressed="${u.date === d}" data-action="when" data-date="${d}">${label}</button>`)}</div>
          <input class="input input--date" type="date" value="${u.date}" data-change="date" aria-label="Pick a date">
          ${custom ? html`<span class="field-hint">${T.dueLabel(u.date)}</span>` : ''}</div>
        <div class="field"><span class="field-label">Repeat</span>
          <div class="chips" role="group" aria-label="Repeat">${T.REPEATS.map((r) => html`<button type="button" class="${cx('chip', u.repeat === r.id && 'is-active')}" aria-pressed="${u.repeat === r.id}" data-action="repeat" data-value="${r.id}">${r.label}</button>`)}</div>
          ${u.repeat === 'daily' ? html`<select class="input" data-change="every" aria-label="How often">${[1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30, 60, 90].map((n) => html`<option value="${n}" ${u.every === n ? 'selected' : ''}>${n === 1 ? 'Every day' : `Every ${n} days`}</option>`)}</select>` : ''}
          ${u.repeat === 'weekly' ? html`<div class="day-pick" role="group" aria-label="Days of the week">${DAYS.map(([v, l]) => {
            const r = repeatOf();
            const on = (r?.days || [r?.day]).includes(v);
            return html`<button type="button" class="${cx('day-opt', on && 'is-on')}" aria-pressed="${on}" aria-label="${DAY_NAMES[v]}" data-action="rday" data-v="${v}">${l}</button>`;
          })}</div>` : ''}
          ${u.repeat === 'monthly' ? html`<select class="input" data-change="mday" aria-label="Day of the month">${Array.from({ length: 28 }, (_, i) => i + 1).map((n) => html`<option value="${n}" ${repeatOf().day === n ? 'selected' : ''}>On day ${n}</option>`)}</select>` : ''}
          ${u.repeat !== 'none' ? html`<span class="field-hint">${T.repeatLabel(repeatOf())}${u.repeat === 'yearly' ? ', from the date above' : ''}. Ticking one schedules the next, so missed ones never pile up.</span>` : ''}</div>
        <div class="field"><span class="field-label">Area</span>
          <div class="chips">${CATEGORIES.map((c) => html`<button type="button" class="${cx('chip chip--area', u.area === c.id && 'is-active')}" style="--ic:${catColor(c.id)}" aria-pressed="${u.area === c.id}" data-action="area" data-id="${c.id}"><i class="chip-dot" aria-hidden="true"></i>${c.label}</button>`)}</div></div>
        ${P.active().length || u.projectId ? html`<div class="field"><span class="field-label">Project</span>
          <div class="chips"><button type="button" class="${cx('chip', !u.projectId && 'is-active')}" aria-pressed="${!u.projectId}" data-action="project" data-id="">None</button>
          ${[...new Set([...P.active().map((p) => p.id), ...(u.projectId ? [u.projectId] : [])])].map((pid) => P.project(pid)).filter(Boolean).map((p) => html`<button type="button" class="${cx('chip', u.projectId === p.id && 'is-active')}" aria-pressed="${u.projectId === p.id}" data-action="project" data-id="${p.id}">${p.name}</button>`)}</div></div>` : ''}
        <label class="field"><span class="field-label">Notes <span class="muted">(optional)</span></span>
          <textarea class="input" rows="2" data-input="notes">${u.notes}</textarea></label>
        ${cur && !cur.done ? html`<button type="button" class="btn btn--soft btn--block" data-action="to-calendar">${icon('calendar-check', { size: 18 })} ${cur.calendar ? `In your calendar · ${cur.calendar.time}, ${cur.calendar.minutes} min` : 'Put it in your calendar'}</button>` : ''}
        <button type="button" class="btn btn--primary btn--block" data-action="save">${cur ? 'Save' : 'Add task'}</button>
        ${cur ? html`<button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="delete">${icon('trash-2', { size: 16 })} Delete task</button>` : ''}
      </div>`;
    },
    inputs: {
      title: ({ sheet, value }) => { sheet.ui.title = value; if (sheet.ui.error && value.trim()) { sheet.ui.error = ''; sheet.refresh(); } },
      notes: ({ sheet, value }) => { sheet.ui.notes = value; },
      date: ({ sheet, value }) => { sheet.ui.date = value || ''; sheet.refresh(); },
      mday: ({ sheet, value }) => { sheet.ui.mday = Number(value); sheet.refresh(); },
      every: ({ sheet, value }) => { sheet.ui.every = Number(value) || 1; sheet.refresh(); },
    },
    actions: {
      when: ({ sheet, data }) => { sheet.ui.date = data.date || ''; sheet.refresh(); },
      repeat: ({ sheet, data }) => { sheet.ui.repeat = data.value; sheet.refresh(); },
      rday: ({ sheet, data }) => {
        const v = Number(data.v);
        const cur = repeatOf()?.days || [repeatOf()?.day];
        const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
        sheet.ui.days = next.length ? next : cur;
        sheet.refresh();
      },
      area: ({ sheet, data }) => { sheet.ui.area = data.id; sheet.refresh(); },
      project: ({ sheet, data }) => { sheet.ui.projectId = data.id || null; sheet.refresh(); },
      save: ({ sheet }) => {
        const u = sheet.ui;
        const title = (sheet.el.querySelector('input[data-input="title"]')?.value ?? u.title).trim();
        if (!title) { u.error = 'Give the task a name.'; sheet.refresh(); return; }
        const repeat = repeatOf();
        // A repeating task lands on its first matching day unless you picked one that already matches.
        let date = u.date || null;
        if (repeat && (!date || T.firstDate(repeat, date) !== date)) date = T.firstDate(repeat, date && date > today() ? date : today());
        const notes = (sheet.el.querySelector('textarea[data-input="notes"]')?.value ?? u.notes).trim();
        if (cur) T.save(cur.id, { title, notes, area: u.area, date, repeat, projectId: u.projectId || null });
        else T.add({ title, notes, area: u.area, date, repeat, projectId: u.projectId });
        hap.success();
        app.closeSheet(sheet);
        if (!cur) app.toast(`Added · ${T.dueLabel(date).toLowerCase() === 'anytime' ? 'anytime' : T.dueLabel(date).toLowerCase()}`, { icon: 'check' });
      },
      'to-calendar': async ({ sheet }) => {
        app.closeSheet(sheet);
        (await import('./task-calendar.js')).openTaskCalendar(cur.id);
      },
      delete: ({ sheet }) => {
        const rec = T.task(cur.id);
        T.remove(cur.id);
        app.closeSheet(sheet);
        app.toast('Task deleted', { action: { label: 'Undo', fn: () => import('../data/store.js').then((s) => s.put('tasks', rec)) } });
      },
    },
  });
}
