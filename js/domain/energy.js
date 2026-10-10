// Energy through the day: a one-tap check-in (1–5) whenever you like, kept with its time, builds
// your own energy curve; the hours where it's reliably highest are your peak, and the app suggests
// putting deep work there. Alertness follows a daily rhythm that differs between people (chronotype)
// and is highest a few hours after waking for most (Wieth & Zacks 2011; Facer-Childs et al. 2019),
// so your own logs beat a generic schedule.
import * as store from '../data/store.js';
import { today, addDays, parseHM, fmtHM, minutesOfDay } from './dates.js';

export const LEVELS = [
  [1, 'Drained'], [2, 'Low'], [3, 'Okay'], [4, 'Good'], [5, 'Sharp'],
];
/** Two-hour windows the curve is counted in, from 06:00 to 22:00. */
const WINDOWS = Array.from({ length: 8 }, (_, i) => 6 * 60 + i * 120);
const MIN_LOGS = 3; // per window before it counts
const MIN_DAYS = 5; // days with a check-in before a peak is named

export const logs = (date) => store.onDate('energyLogs', date).slice().sort((a, b) => (a.time < b.time ? -1 : 1));

/** Log how your energy is right now. Returns the record (with an undo). */
export function log(level, now = new Date()) {
  const lv = Math.max(1, Math.min(5, Math.round(Number(level))));
  const date = today();
  const time = fmtHM(minutesOfDay(now));
  const id = `${date}:${time}`;
  const before = store.get('energyLogs', id);
  const rec = store.put('energyLogs', { id, date, time, level: lv });
  return { rec, undo: () => (before ? store.put('energyLogs', before) : store.remove('energyLogs', id)) };
}

/** The latest check-in today, if any. */
export const latest = (date = today()) => logs(date).pop() || null;

/** Your curve over the last `days`: [{ from 'HH:MM', to, avg, n }] for each window with logs. */
export function curve(days = 28, end = today()) {
  const since = addDays(end, -(days - 1));
  const sums = WINDOWS.map(() => ({ s: 0, n: 0 }));
  const dates = new Set();
  for (const r of store.all('energyLogs')) {
    if (r.date < since || r.date > end) continue;
    const m = parseHM(r.time);
    const i = WINDOWS.findIndex((w) => m >= w && m < w + 120);
    if (i < 0) continue;
    sums[i].s += r.level;
    sums[i].n += 1;
    dates.add(r.date);
  }
  return { days: dates.size, windows: WINDOWS.map((w, i) => ({ from: fmtHM(w), to: fmtHM(w + 120), avg: sums[i].n ? sums[i].s / sums[i].n : null, n: sums[i].n })) };
}

/** Your peak hours: the best window (and the next one when it's as good), or null without enough logs. */
export function peak(days = 28, end = today()) {
  const c = curve(days, end);
  if (c.days < MIN_DAYS) return null;
  const counted = c.windows.map((w, i) => ({ ...w, i })).filter((w) => w.n >= MIN_LOGS);
  if (counted.length < 2) return null;
  const best = counted.reduce((a, b) => (b.avg > a.avg ? b : a));
  const low = counted.reduce((a, b) => (b.avg < a.avg ? b : a));
  // A flat curve has no peak worth planning around.
  if (best.avg - low.avg < 0.5) return null;
  const nextTo = counted.find((w) => w.i === best.i + 1 && best.avg - w.avg <= 0.25);
  return { from: best.from, to: nextTo ? nextTo.to : best.to, avg: best.avg, low: { from: low.from, to: low.to, avg: low.avg } };
}

/** The line for planning: "Your energy peaks 09:00–11:00: deep work there." */
export function peakLine(p = peak()) {
  return p ? `Your energy peaks ${p.from}–${p.to}. Put deep work there; leave ${p.low.from}–${p.low.to} for lighter tasks.` : null;
}

/** How many days of check-ins until a peak can be named (0 when it can). */
export function daysToPeak(end = today()) {
  return Math.max(0, MIN_DAYS - curve(28, end).days);
}
