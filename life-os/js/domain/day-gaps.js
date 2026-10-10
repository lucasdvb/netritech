// What fills a day besides your plan, and the free time left: your calendar's events and the tasks
// you've given a time, merged with the day's blocks; the gaps between them (after now, before
// lights out) are where a task can go. Putting a task into a gap gives it that date and time, so it
// shows in Your day at its slot. Deciding when and where you'll do something is what gets it done
// (implementation intentions, Gollwitzer & Sheeran 2006), and a task sized to the gap you have
// (with your own estimate ratio, estimates.js) fits it.
import * as store from '../data/store.js';
import * as P from './day-plans.js';
import * as D from './day-blocks.js';
import * as ICS from './ics-import.js';
import * as ES from './estimates.js';
import { parseHM, fmtHM, minutesOfDay, today } from './dates.js';

export const MIN_GAP = 20;
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Tasks on a date with a time of their own: [{ task, time, mins }]. */
export function timedTasks(date) {
  return store.onDate('tasks', date).filter((t) => HM.test(t.time || '')).map((t) => ({ task: t, time: t.time, mins: ES.realistic(t.estimate) || 30 }))
    .sort((a, b) => a.time.localeCompare(b.time));
}

/** Busy spans on a date in day minutes (from wake): blocks, events and timed tasks. [[from, to]] */
function busy(date) {
  const spans = [];
  for (const b of P.blocksOn(date)) if (b.kind !== 'bed' && b.mins) spans.push([D.dayMinutes(b.time), D.dayMinutes(b.time) + b.mins]);
  for (const [a, b] of ICS.busy(date)) spans.push([D.dayMinutes(fmtHM(a)), D.dayMinutes(fmtHM(a)) + (b - a)]);
  for (const t of timedTasks(date)) spans.push([D.dayMinutes(t.time), D.dayMinutes(t.time) + t.mins]);
  return spans.sort((x, y) => x[0] - y[0]);
}

/**
 * The free gaps on a date from `now` (or wake) to lights out: [{ from 'HH:MM', to, mins }], each
 * at least MIN_GAP minutes.
 */
export function gaps(date = today(), now = new Date()) {
  const list = P.blocksOn(date);
  const wake = list.find((b) => b.kind === 'wake');
  const bed = list.find((b) => b.kind === 'bed');
  if (!wake || !bed) return [];
  const start = D.dayMinutes(wake.time);
  const end = D.dayMinutes(bed.time);
  let cursor = Math.max(start, date === today() ? D.dayMinutes(fmtHM(minutesOfDay(now))) : start);
  // Round the start up to the next 5 minutes.
  cursor = Math.ceil(cursor / 5) * 5;
  const out = [];
  for (const [a, b] of busy(date)) {
    if (a > cursor && Math.min(a, end) - cursor >= MIN_GAP) out.push([cursor, Math.min(a, end)]);
    cursor = Math.max(cursor, b);
    if (cursor >= end) break;
  }
  if (end - cursor >= MIN_GAP) out.push([cursor, end]);
  const wakeAt = parseHM(wake.time);
  return out.map(([a, b]) => ({ from: fmtHM(wakeAt + (a - start)), to: fmtHM(wakeAt + (b - start)), mins: b - a }));
}

/**
 * Tasks that could go into a gap: open ones for today, overdue or without a date, without a time
 * yet, those whose (realistic) estimate fits first. [{ task, mins, fits }]
 */
export function candidates(gap, date = today()) {
  const open = store.all('tasks').filter((t) => !t.done && !HM.test(t.time || '') && (!t.date || t.date <= date));
  return open.map((t) => { const m = ES.realistic(t.estimate); return { task: t, mins: m, fits: m == null ? null : m <= gap.mins }; })
    .sort((a, b) => Number(b.fits === true) - Number(a.fits === true) || Number(!!b.task.rank) - Number(!!a.task.rank) || String(a.task.date || '9').localeCompare(String(b.task.date || '9')));
}

/** Put a task into a gap: today at the gap's start. Returns an undo. */
export function place(taskId, time, date = today()) {
  const t = store.get('tasks', taskId);
  if (!t || !HM.test(time)) return () => {};
  store.put('tasks', { ...t, date, time });
  return () => store.put('tasks', t);
}

/** Take a task's time away (it stays on its day). Returns an undo. */
export function unplace(taskId) {
  const t = store.get('tasks', taskId);
  if (!t) return () => {};
  store.put('tasks', { ...t, time: null });
  return () => store.put('tasks', t);
}
