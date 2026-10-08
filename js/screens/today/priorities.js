// Priorities and tasks, one card (DR-07): the day's Top 3 pinned at the top, then everything else
// due today. Priorities reorder by dragging the handle or with the arrow keys.
import * as T from '../../domain/tasks.js';
import { isWorkday } from '../../domain/day-plan.js';
import { today } from '../../domain/dates.js';
import { html, cx } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { check } from '../../ui/controls.js';
import { taskRow } from '../task-ui.js';

const PLACEHOLDERS = ['The one that matters most', 'Second priority', 'Third priority'];
// Today shows only the most recent overdue tasks; the rest wait on the Tasks screen.
const LATE_SHOWN = 3;

export function prioritiesBlock(date, mode) {
  if (mode === 'sick' || mode === 'minimum') return '';
  const isToday = date === today();
  const slots = T.slots(date);
  const doneN = slots.filter((t) => t?.done).length;
  let others = T.forToday(date).filter((t) => !(t.rank && t.date === date));
  const late = isToday ? others.filter((t) => !t.done && t.date < date) : [];
  const hidden = Math.max(0, late.length - LATE_SHOWN);
  if (late.length) {
    const recent = late.slice(hidden).reverse();
    const lateSet = new Set(late);
    others = [...recent, ...others.filter((t) => !lateSet.has(t))];
  }
  if (!isToday && !slots.some(Boolean) && !others.length) return '';
  return html`<section class="prio" data-key="priorities" aria-label="Priorities and tasks">
    <div class="block-head"><h2 class="block-title">${isWorkday(date) ? 'Priorities' : 'Top 3 for today'}</h2>
      <span class="block-meta tnum">${doneN}/3</span>
      <a class="link-btn" href="#/plan/tasks" data-action="nav" data-to="plan/tasks">All tasks</a></div>
    <ol class="top3-list" data-top3 data-reorder="move-priority">${slots.map((t, i) => html`<li class="${cx('top3-item', t?.done && 'is-done')}" data-key="${t?.id || `slot-${i}`}" data-index="${i}">
      <button type="button" class="drag-handle" data-drag aria-label="Move priority ${i + 1}" aria-describedby="drag-hint">${icon('grip-vertical', { size: 16 })}</button>
      ${check(!!t?.done, { action: 'top3-check', data: { i }, label: `Priority ${i + 1}${t ? `: ${t.title}` : ''}${t?.done ? ', done' : ''}`, cls: 'check--sm' })}
      <input class="top3-input" value="${t?.title || ''}" placeholder="${PLACEHOLDERS[i]}" aria-label="Priority ${i + 1}" data-change="top3-text" data-i="${i}" enterkeyhint="done" maxlength="120">
    </li>`)}</ol>
    ${others.length ? html`<p class="prio-label">Also today</p><ul class="tlist">${others.map((t) => taskRow(t, { showDue: t.date !== date, ref: date }))}</ul>` : ''}
    ${hidden ? html`<a class="link-btn prio-more" href="#/plan/tasks" data-action="nav" data-to="plan/tasks">${hidden} more from earlier days</a>` : ''}
    ${isToday ? html`<div class="task-add">
      <span class="task-add-ic" aria-hidden="true">${icon('plus', { size: 18 })}</span>
      <input class="task-add-input" data-change="task-add" placeholder="${others.length ? 'Add another task' : 'Add a task for today'}" aria-label="Add a task for today" enterkeyhint="done" maxlength="140">
      <button type="button" class="icon-btn icon-btn--sm" data-action="task-new" aria-label="New task with a date, repeat or area">${icon('ellipsis', { size: 18 })}</button>
    </div>` : ''}
  </section>`;
}
