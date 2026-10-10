// Focus timer: one block of deep work at a time (25, 50 or 90 minutes, or your own). It lives in
// settings, so it survives closing the app; a finished block counts as a focus block for the day
// it started, with its minutes. A block started for a task adds its minutes to the task's time taken.
import * as store from '../data/store.js';
import { reviewOf, saveReview } from './day.js';
import { dayOf } from './dates.js';

export const LENGTHS = [25, 50, 90];

/** The running (or paused) block, or null: { startedAt, minutes, label, pausedAt, pausedMs }. */
export const current = () => store.settings().focus || null;

/** Milliseconds left at `now` (0 when it's over). */
export function remaining(t = current(), now = Date.now()) {
  if (!t) return 0;
  const end = new Date(t.startedAt).getTime() + t.minutes * 60000 + (t.pausedMs || 0);
  const at = t.pausedAt ? new Date(t.pausedAt).getTime() : now;
  return Math.max(0, end - at);
}

export function start(minutes = 25, label = '', taskId = null) {
  const m = Math.max(5, Math.min(180, Math.round(minutes)));
  store.setSettings({ focus: { startedAt: new Date().toISOString(), minutes: m, label: label.trim().slice(0, 60), taskId: taskId || null, pausedAt: null, pausedMs: 0 } });
  return current();
}

export function pause() {
  const t = current();
  if (t && !t.pausedAt) store.setSettings({ focus: { ...t, pausedAt: new Date().toISOString() } });
}

export function resume() {
  const t = current();
  if (!t?.pausedAt) return;
  const extra = Date.now() - new Date(t.pausedAt).getTime();
  store.setSettings({ focus: { ...t, pausedAt: null, pausedMs: (t.pausedMs || 0) + extra } });
}

/** Stop without counting it. Returns an undo. */
export function stop() {
  const t = current();
  store.setSettings({ focus: null });
  return () => store.setSettings({ focus: t });
}

/** Count the block (now, or early with the minutes done so far) and clear it. Returns what was logged. */
export function finish({ early = false, now = Date.now() } = {}) {
  const t = current();
  if (!t) return null;
  const done = early ? Math.max(1, Math.round((t.minutes * 60000 - remaining(t, now)) / 60000)) : t.minutes;
  const date = dayOf(new Date(t.startedAt));
  const r = reviewOf(date);
  saveReview(date, { deepWork: (r.deepWork || 0) + 1, focusMinutes: (r.focusMinutes || 0) + done });
  // A block for a task counts towards the time it took (estimates.js learns from it).
  const task = t.taskId && store.get('tasks', t.taskId);
  if (task) store.put('tasks', { ...task, spent: (Number(task.spent) || 0) + done });
  store.setSettings({ focus: null });
  return { date, minutes: done, label: t.label, blocks: (r.deepWork || 0) + 1 };
}

/** A block whose time ran out (even while the app was closed) is counted now. */
export function settle(now = Date.now()) {
  const t = current();
  return t && !t.pausedAt && remaining(t, now) === 0 ? finish({ now }) : null;
}

export const clock = (ms) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
