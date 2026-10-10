// What Your day adds to the plan: your calendar's events and the tasks you gave a time, in order
// with the blocks, and the free gaps from now to lights out, each with "Fill" to put a task in it.
import * as GP from '../../domain/day-gaps.js';
import * as ICS from '../../domain/ics-import.js';
import * as ES from '../../domain/estimates.js';
import * as EN from '../../domain/energy.js';
import { today } from '../../domain/dates.js';
import { html, cx } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { app } from '../../ui/app-api.js';
import * as hap from '../../ui/haptics.js';

const act = (label, name, data = {}) => ({ label, act: name, data });

/** Events and timed tasks as day rows ({ b, s }), to merge with the plan's blocks. */
export function extraRows(date) {
  const rows = [];
  for (const e of ICS.on(date)) {
    if (e.allDay) continue;
    const [h1, m1] = e.start.split(':').map(Number);
    const [h2, m2] = e.end.split(':').map(Number);
    rows.push({ b: { id: `ev-${e.id}`, kind: 'event', time: e.start, mins: Math.max(5, h2 * 60 + m2 - (h1 * 60 + m1)), title: e.title, detail: `Calendar · until ${e.end}` }, s: { done: null, action: null } });
  }
  for (const t of GP.timedTasks(date)) {
    rows.push({ b: { id: `tk-${t.task.id}`, kind: 'task', time: t.time, mins: t.mins, title: t.task.title, detail: t.task.estimate ? `Task · ${ES.fmtMin(t.mins)}` : 'Task' },
      s: { done: !!t.task.done, action: t.task.done ? null : act('Done', 'task-check', { id: t.task.id }) } });
  }
  return rows;
}

/** All-day calendar events, for a line above the day. */
export const allDay = (date) => ICS.on(date).filter((e) => e.allDay);

/** The free gaps (after now), with the energy peak marked. */
export function freeGaps(date) {
  if (date !== today()) return [];
  const peak = EN.peak();
  return GP.gaps(date).map((g) => ({ ...g, peak: !!peak && g.from < peak.to && g.to > peak.from }));
}

/** A gap's row in Your day. */
export const gapRow = (g) => html`<li class="${cx('ds-gap', g.peak && 'is-peak')}" data-key="gap-${g.from}">
  <span class="ds-time tnum">${g.from}</span><span class="ds-mark" aria-hidden="true"></span>
  <span class="ds-text"><span class="ds-title">Free · ${ES.fmtMin(g.mins)}</span>${g.peak ? html`<span class="ds-sub">Your energy peaks now: good for deep work</span>` : ''}</span>
  <button type="button" class="btn btn--sm btn--soft ds-go" data-action="gap-fill" data-from="${g.from}" data-mins="${g.mins}" aria-label="Put a task in the free time at ${g.from}">Fill</button>
</li>`;

/** Choose a task for a gap: the ones that fit (with your usual overrun) first. */
export function openGap(from, mins, date = today()) {
  const gap = { from, mins: Number(mins) };
  const list = GP.candidates(gap, date);
  const c = ES.calibration();
  app.sheet({
    title: `Free from ${from} · ${ES.fmtMin(gap.mins)}`,
    render: () => html`<div class="form gap-sheet">
      ${c ? html`<p class="sheet-note">${ES.summaryLine(c)}</p>` : ''}
      ${list.length ? html`<ul class="list">${list.slice(0, 12).map(({ task, mins: m, fits }) => html`<li data-key="g-${task.id}">
        <button type="button" class="row" data-action="gap-pick" data-id="${task.id}">
          <span class="row-ic">${icon(fits === false ? 'hourglass' : 'list-todo', { size: 16 })}</span>
          <span class="row-main"><span class="row-title">${task.title}</span>
            <span class="row-sub">${m ? `${fits ? 'Fits' : 'Longer than the gap'} · likely ${ES.fmtMin(m)}` : 'No estimate'}${task.date && task.date < date ? ' · overdue' : ''}</span></span>
          <span class="row-chev">${icon('plus', { size: 16 })}</span></button></li>`)}</ul>`
        : html`<p class="muted">No open tasks without a time. Add one and it can go here.</p>`}
      <button type="button" class="btn btn--ghost btn--block" data-action="gap-new">New task here</button>
    </div>`,
    actions: {
      'gap-pick': ({ data, sheet }) => {
        const undo = GP.place(data.id, from, date);
        hap.success();
        app.closeSheet(sheet);
        app.toast(`At ${from} today`, { icon: 'check', action: { label: 'Undo', fn: undo } });
      },
      'gap-new': async ({ sheet }) => {
        app.closeSheet(sheet);
        (await import('../task-ui.js')).openTask(null, { date, time: from });
      },
    },
  });
}
