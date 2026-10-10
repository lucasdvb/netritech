// Your day on Today: the blocks from Your plan › Your day in order, a line where you are now, the
// block you're in open with its one action, and the ones already behind you folded. Each block is
// the real habit, routine, workout or time behind it, so what's done here is done there.
// Loaded just after the first screen.
import * as D from '../../domain/day-blocks.js';
import * as P from '../../domain/day-plans.js';
import * as H from '../../domain/habits.js';
import * as M from '../../domain/metrics-core.js';
import * as R from '../../domain/routines.js';
import * as F from '../../domain/fitness-core.js';
import { trainingCall } from '../../domain/day-plan.js';
import { minutesOfDay, fmtHM, today } from '../../domain/dates.js';
import { html, cx, dataAttrs } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { extraRows, freeGaps, gapRow, allDay } from './gaps.js';

const act = (label, name, data = {}) => ({ label, act: name, data });

/** Whether a block is done today, and the one thing to do for it. */
function stateOf(b, date) {
  const h = b.ref ? H.habit(b.ref) : null;
  switch (b.kind) {
    case 'wake': {
      const done = !!(M.sleep(date) || M.mood(date) || M.review(date)?.ritual?.morning);
      return { done, action: done ? null : act('Check in', 'ritual', { which: 'morning' }) };
    }
    case 'bed': {
      const done = !!M.review(date)?.sealedAt;
      return { done, action: done ? null : act('Close the day', 'ritual', { which: 'evening' }) };
    }
    case 'train': {
      if (F.workoutsOn(date).length) return { done: true, action: null };
      const call = trainingCall(date);
      return { done: false, action: call.template ? act('Start', 'start-workout', { template: call.template.id }) : null, sub: call.title };
    }
    case 'routine': {
      const r = R.routine(b.ref);
      const p = r ? R.progress(r, date) : null;
      return { done: !!p?.complete, action: p && !p.complete ? act('Open', 'routine', { id: r.id }) : null, sub: p?.total ? `${p.done} of ${p.total}` : '' };
    }
    case 'habit': {
      if (!h) return { done: false, action: null };
      if (!H.dueOn(h, date)) return { done: false, rest: true, action: null };
      const done = H.counts(h, date);
      if (done) return { done, action: null };
      const needs = h.templateId || H.isNumeric(h) || h.source || h.checklist?.length;
      return { done, action: needs ? act(h.templateId ? 'Start' : 'Log', 'habit', { id: h.id }) : act('Done', 'toggle', { id: h.id }) };
    }
    default: return { done: null, action: null };
  }
}

export function dayBlock(date, ui, now = new Date()) {
  if (date !== today()) return '';
  const list = P.blocksOn(date);
  if (!list.length) return '';
  const at = D.dayMinutes(fmtHM(minutesOfDay(now)));
  // Your calendar's events and the tasks you gave a time go in among the plan's blocks.
  const all = [...list.map((b) => ({ b, s: stateOf(b, date) })), ...extraRows(date)]
    .map((x, i) => ({ ...x, i })).sort((x, y) => D.dayMinutes(x.b.time) - D.dayMinutes(y.b.time) || x.i - y.i);
  const rows = all.map(({ b, s }) => {
    const from = D.dayMinutes(b.time);
    const to = from + Math.max(b.mins, 1);
    // Blocks without a tick of their own (work, breakfast) are done once their time has passed.
    const done = s.done ?? at >= to;
    return { b, s, done, past: at >= to, now: at >= from && at < to };
  });
  // You're in the block whose time this is; between blocks, it's the next one coming.
  // When blocks overlap (wake runs into prayer), the one that started last is where you are.
  let cur = rows.map((r, i) => (r.now && !r.done ? i : -1)).filter((i) => i >= 0).pop() ?? -1;
  if (cur < 0) cur = rows.findIndex((r) => !r.done && !r.past && !r.s.rest);
  const behind = rows.filter((r, i) => i < (cur < 0 ? rows.length : cur) && r.done);
  const shown = ui.dayAll ? rows : rows.filter((r) => !behind.includes(r));
  const doneN = rows.filter((r) => r.done && r.s.done !== null).length;
  const countable = rows.filter((r) => r.s.done !== null).length;
  const gaps = freeGaps(date).slice(0, 4);
  const dayEvents = allDay(date);
  let lineDrawn = false;
  const line = (r) => {
    if (lineDrawn || D.dayMinutes(r.b.time) <= at) return '';
    lineDrawn = true;
    return html`<li class="ds-now" aria-hidden="true" data-key="ds-now"><span class="tnum">${fmtHM(minutesOfDay(now))}</span></li>`;
  };
  return html`<section class="dstrip" data-key="day" aria-label="Your day">
    <div class="block-head"><h2 class="block-title">Your day${P.inUse() ? html`<span class="ds-plan"> · ${P.on(date).name}</span>` : ''}</h2>
      <span class="block-meta tnum">${countable ? `${doneN} of ${countable}` : ''}</span>
      <button type="button" class="link-btn" data-action="nav" data-to="plan/playbook">Edit</button></div>
    ${dayEvents.length ? html`<p class="ds-allday">${icon('calendar', { size: 14 })} ${dayEvents.map((e) => e.title).join(' · ')}</p>` : ''}
    <ol class="ds-list">
      ${behind.length ? html`<li class="ds-fold" data-key="ds-fold"><button type="button" class="link-btn" data-action="day-all" aria-expanded="${!!ui.dayAll}">${ui.dayAll ? 'Hide what’s done' : `${behind.length} done earlier · show`}</button></li>` : ''}
      ${shown.map((r) => {
        const i = rows.indexOf(r);
        const isCur = i === cur;
        const a = r.s.action;
        return html`${line(r)}<li class="${cx('ds-row', r.done && 'is-done', isCur && 'is-current', r.s.rest && 'is-rest', r.b.kind === 'event' && 'is-event', r.b.kind === 'task' && 'is-task')}" data-key="ds-${r.b.id}">
          <span class="ds-time tnum">${r.b.time}</span>
          <span class="ds-mark" aria-hidden="true">${r.done ? icon('check', { size: 14, stroke: 2.4 }) : ''}</span>
          <span class="ds-text"><span class="ds-title">${r.b.title}</span>${isCur && (r.s.sub || r.b.detail) ? html`<span class="ds-sub">${r.s.sub || r.b.detail}</span>` : ''}</span>
          ${a && (isCur || D.dayMinutes(r.b.time) <= at) ? html`<button type="button" class="${cx('btn btn--sm', isCur ? 'btn--primary' : 'btn--soft')} ds-go" data-action="${a.act}"${dataAttrs(a.data)} aria-label="${a.label}: ${r.b.title}">${a.label}</button>` : ''}
        </li>`;
      })}
      ${lineDrawn ? '' : html`<li class="ds-now" aria-hidden="true" data-key="ds-now"><span class="tnum">${fmtHM(minutesOfDay(now))}</span></li>`}
    </ol>
    ${gaps.length ? html`<ol class="ds-list ds-gaps" aria-label="Free time">${gaps.map(gapRow)}</ol>` : ''}
  </section>`;
}
