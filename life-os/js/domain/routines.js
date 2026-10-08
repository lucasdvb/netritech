// Routines (H5): habits linked into a sequence with a window of time, done step by step or all at
// once with "Did it all". A step is a habit or a plain line ("make the bed"). Plain steps, and
// when the routine was finished, are kept per day in routineRuns.
import * as store from '../data/store.js';
import * as H from './habits.js';
import { today, weekday, parseHM, fmtHM, minutesOfDay, dayEndMinutes } from './dates.js';

export const runId = (routineId, date) => `${routineId}:${date}`;
export const routines = () => store.memo('routines-sorted', ['routines'], () => store.all('routines').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
export const routine = (id) => store.get('routines', id);
export const run = (routineId, date) => store.get('routineRuns', runId(routineId, date));

/** The routine a habit belongs to, and its step. */
export function routineOf(habitId) {
  for (const r of routines()) {
    const step = (r.steps || []).find((s) => s.habitId === habitId);
    if (step) return { routine: r, step };
  }
  return null;
}
export const inRoutine = (habitId) => !!routineOf(habitId);

export const activeOn = (r, date) => !r.archived && (!r.days?.length || r.days.includes(weekday(date)));

/** The steps that apply on a date: plain steps always, habit steps when the habit is due. */
export function stepsOn(r, date, mode = H.dayMode(date)) {
  return (r.steps || []).flatMap((s) => {
    if (!s.habitId) return [{ ...s, kind: 'label' }];
    const h = H.habit(s.habitId);
    if (!h || h.archived || !H.dueOn(h, date, mode)) return [];
    return [{ ...s, kind: 'habit', habit: h }];
  });
}

export function stepDone(r, step, date) {
  if (step.kind === 'habit') return H.counts(step.habit, date);
  return !!run(r.id, date)?.steps?.[step.id];
}

/** Where a routine stands on a date. */
export function progress(r, date = today(), mode = H.dayMode(date)) {
  const steps = stepsOn(r, date, mode).map((s) => ({ ...s, done: stepDone(r, s, date) }));
  const done = steps.filter((s) => s.done).length;
  const next = steps.find((s) => !s.done) || null;
  return { routine: r, steps, done, total: steps.length, next, complete: steps.length > 0 && done === steps.length, completedAt: run(r.id, date)?.completedAt || null };
}

/** Minutes into the day, where the hours before the day boundary (03:00) belong to yesterday's evening. */
const minutesNow = (now) => { const m = minutesOfDay(now); return m < dayEndMinutes() ? m + 1440 : m; };
const windowOf = (r) => ({ from: parseHM(r.window?.from || '00:00'), to: parseHM(r.window?.to || '23:59') });

/** 'before', 'now' or 'after' the routine's window. */
export function windowState(r, now = new Date()) {
  const m = minutesNow(now);
  const w = windowOf(r);
  if (m < w.from) return 'before';
  return m <= w.to ? 'now' : 'after';
}
export const windowLabel = (r) => `${r.window?.from || ''}–${r.window?.to || ''}`;

/** Today's routines with their progress, in order. */
export function forDay(date = today(), mode = H.dayMode(date)) {
  if (mode === 'sick') return [];
  return routines().filter((r) => activeOn(r, date)).map((r) => progress(r, date, mode)).filter((p) => p.total > 0);
}

/** The routine to have open now: the first unfinished one whose window is open. */
export function current(date = today(), now = new Date()) {
  if (date !== today()) return null;
  return forDay(date).find((p) => !p.complete && windowState(p.routine, now) === 'now') || null;
}

/* ---------- writes ---------- */

function touchRun(r, date, patch) {
  const id = runId(r.id, date);
  const prev = store.get('routineRuns', id) || { id, routineId: r.id, date, steps: {} };
  return { store: 'routineRuns', value: { ...prev, ...patch, steps: { ...prev.steps, ...(patch.steps || {}) } } };
}

/** The log a habit step needs to count as fully done. */
function doneLog(h, date) {
  const id = H.logId(h.id, date);
  const prev = store.get('habitLogs', id) || { id, habitId: h.id, date };
  if (H.isNumeric(h)) return { ...prev, completed: true, tiny: false };
  const checklist = h.checklist?.length ? Object.fromEntries(h.checklist.map((_, i) => [i, true])) : prev.checklist;
  return { ...prev, value: 1, completed: true, tiny: false, ...(checklist ? { checklist } : {}) };
}

/** Mark the routine finished when its last step is done (keeps the time it happened). */
export function settle(r, date) {
  const p = progress(r, date);
  const has = run(r.id, date)?.completedAt;
  if (p.complete && !has) store.batch([touchRun(r, date, { completedAt: new Date().toISOString() })]);
  if (!p.complete && has) store.batch([touchRun(r, date, { completedAt: null })]);
}

/** Tick or untick a plain step. */
export function toggleLabel(r, step, date) {
  const on = !run(r.id, date)?.steps?.[step.id];
  store.batch([touchRun(r, date, { steps: { [step.id]: on } })]);
  settle(r, date);
  return on;
}

/**
 * "Did it all": every remaining step done in one write. Returns an undo function that puts each
 * habit log and the day's run back exactly as they were.
 */
export function didItAll(r, date = today()) {
  const p = progress(r, date);
  const before = [];
  const ops = [];
  const labels = {};
  for (const s of p.steps) {
    if (s.done) continue;
    if (s.kind === 'label') { labels[s.id] = true; continue; }
    const id = H.logId(s.habit.id, date);
    before.push({ store: 'habitLogs', id, value: store.get('habitLogs', id) || null });
    ops.push({ store: 'habitLogs', value: doneLog(s.habit, date) });
  }
  const rid = runId(r.id, date);
  before.push({ store: 'routineRuns', id: rid, value: store.get('routineRuns', rid) || null });
  ops.push(touchRun(r, date, { steps: labels, completedAt: new Date().toISOString() }));
  store.batch(ops);
  return () => store.batch(before.map((b) => (b.value ? { store: b.store, value: b.value } : { store: b.store, delete: b.id })));
}

/** Routines built from the habits grouped as Morning and Evening (fresh installs and the migration). */
export function defaultRoutines(habits, profile = {}) {
  const byTime = (a, b) => (a.time || '99').localeCompare(b.time || '99') || (a.order ?? 0) - (b.order ?? 0);
  const pick = (section) => habits.filter((h) => !h.archived && h.section === section).sort(byTime).map((h, i) => ({ id: `s-${h.id}`, habitId: h.id, order: i }));
  const wake = parseHM(profile.wakeTime || '06:00');
  const bed = parseHM(profile.bedTime || '22:00');
  return [
    { id: 'r-morning', name: 'Morning', kind: 'morning', order: 1, days: null,
      window: { from: fmtHM(Math.max(0, wake - 60)), to: fmtHM(Math.max(wake + 240, parseHM('10:00'))) }, steps: pick('morning') },
    { id: 'r-evening', name: 'Evening', kind: 'evening', order: 2, days: null,
      window: { from: '19:00', to: fmtHM(Math.min(bed + 90, 1439)) }, steps: pick('evening') },
  ].filter((r) => r.steps.length);
}

/** Add a habit to the end of a routine (new habits anchored in the morning or evening). */
export function append(routineId, habitId) {
  const r = routine(routineId);
  if (!r || (r.steps || []).some((s) => s.habitId === habitId)) return;
  store.put('routines', { ...r, steps: [...(r.steps || []), { id: `s-${habitId}`, habitId }] });
}
