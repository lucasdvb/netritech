import * as store from '../data/store.js';
import * as T from '../domain/tasks.js';
import { today, addDays, fmtDay, fmtMD } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { taskRow, taskActions, openTask } from './task-ui.js';

// Overdue tasks shown before "Show all", newest first.
const LATE_SHOWN = 10;

const group = (title, list, opts = {}, meta = '') => (list.length ? html`<section class="block tgroup" data-key="g-${title}">
  <div class="block-head"><h2 class="block-title">${title}</h2><span class="block-meta">${meta || list.length}</span></div>
  <ul class="tlist card">${list.map((t) => taskRow(t, opts))}</ul></section>` : '');

export default {
  id: 'tasks',
  title: 'Tasks',
  render({ ui }) {
    const d = today();
    const total = store.all('tasks').length;
    const late = T.overdue(d).slice().reverse();
    const todays = T.onDay(d).filter((t) => !t.done);
    const week = [];
    for (let i = 1; i <= 6; i++) {
      const day = addDays(d, i);
      const list = T.onDay(day).filter((t) => !t.done);
      if (list.length) week.push([i === 1 ? 'Tomorrow' : fmtDay(day), list, fmtMD(day)]);
    }
    const after = T.later(addDays(d, 6));
    const anytime = T.anytime();
    const done = T.doneRecently(14);
    return html`
      ${pageHead({ title: 'Tasks', back: { to: 'plan', label: 'Plan' }, sub: 'One-off jobs and weekly chores. Your Top 3 lives on Today.',
        actions: html`<button type="button" class="icon-btn icon-btn--filled" data-action="new" aria-label="New task">${icon('plus', { size: 20 })}</button>` })}
      ${!total ? empty({ ic: 'list-todo', title: 'No tasks yet', body: 'Add the one-off things that don’t belong in a habit: an appointment to book, a chore, a call to make.', cta: 'Add a task', action: 'new' }) : ''}
      ${late.length ? html`<section class="block tgroup" data-key="g-overdue">
        <div class="block-head"><h2 class="block-title">Overdue</h2><span class="block-meta">${late.length}</span>
          ${late.length > 1 ? html`<button type="button" class="link-btn" data-action="clear-overdue">Move to Anytime</button>` : ''}</div>
        <ul class="tlist card">${late.slice(0, ui.allLate ? late.length : LATE_SHOWN).map((t) => taskRow(t, { showDue: true }))}</ul>
        ${late.length > LATE_SHOWN && !ui.allLate ? html`<button type="button" class="link-btn center-link" data-action="all-late">Show all ${late.length}</button>` : ''}
      </section>` : ''}
      ${total ? html`<section class="block tgroup" data-key="g-today">
        <div class="block-head"><h2 class="block-title">Today</h2><span class="block-meta">${todays.length || ''}</span></div>
        ${todays.length ? html`<ul class="tlist card">${todays.map((t) => taskRow(t, { showDue: false }))}</ul>`
          : html`<button type="button" class="task-empty card" data-action="new" data-date="${d}">${icon('plus', { size: 16 })} Nothing due today. Add one?</button>`}
      </section>` : ''}
      ${week.map(([title, list, sub]) => group(title, list, { showDue: false }, sub))}
      ${group('Later', after, { showDue: true })}
      ${group('Anytime', anytime, { showDue: false })}
      ${done.length ? html`<section class="block tgroup" data-key="g-done">
        <button type="button" class="block-head block-head--btn" data-action="show-done" aria-expanded="${!!ui.showDone}">
          <h2 class="block-title">Done</h2><span class="block-meta">${done.length} in the last 2 weeks ${icon(ui.showDone ? 'chevron-up' : 'chevron-down', { size: 16 })}</span></button>
        ${ui.showDone ? html`<ul class="tlist card">${done.map((t) => taskRow(t, { showDue: true }))}</ul>` : ''}
      </section>` : ''}`;
  },
  actions: {
    ...taskActions,
    new: ({ data }) => openTask(null, { date: data.date ?? today() }),
    'show-done': ({ ui }) => { ui.showDone = !ui.showDone; app.refresh(); },
    'all-late': ({ ui }) => { ui.allLate = true; app.refresh(); },
    'clear-overdue': () => {
      // Overdue tasks lose their date and wait under Anytime instead of piling up.
      const moved = T.overdue();
      if (!moved.length) return;
      store.batch(moved.map((t) => ({ store: 'tasks', value: { ...t, date: null, rank: null } })));
      hap.tap();
      app.toast(`${moved.length} task${moved.length === 1 ? '' : 's'} moved to Anytime`, { action: { label: 'Undo', fn: () => store.batch(moved.map((t) => ({ store: 'tasks', value: t }))) } });
    },
  },
};
