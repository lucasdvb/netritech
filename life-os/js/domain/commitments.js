// Commitments (G8): a pledge to a habit for 7, 14 or 30 days (or any length from 3 to 90), with a stake you choose, sealed with a hold.
// The days count from your logs (the tiny version counts). Ending one early asks what got in the
// way and offers a smaller pledge; nothing is ever called failed.
import * as store from '../data/store.js';
import * as H from './habits.js';
import { today, addDays, range, diffDays } from './dates.js';

export const LENGTHS = [7, 14, 30];

export const commitments = () => store.all('commitments').sort((a, b) => (a.start < b.start ? 1 : -1));
export const active = (date = today()) => commitments().filter((c) => c.status === 'active' && c.start <= date);
export const forHabit = (habitId, date = today()) => active(date).find((c) => c.habitId === habitId) || null;

export function create({ habitId, days = 7, stake = '', start = today(), tiny = false }) {
  const h = H.habit(habitId);
  if (!h) throw new Error('Choose a habit for the pledge');
  return store.put('commitments', { habitId, title: `${tiny && H.tinyOf(h)?.label ? H.tinyOf(h).label : h.name}, ${days} days`, days, stake: stake.trim(), start, end: addDays(start, days - 1), status: 'active', sealedAt: new Date().toISOString(), tiny });
}

/**
 * Where a pledge stands on a date: { day, of, due, kept, missed: [dates], left, finished }.
 * Due days are the habit's scheduled days so far; today counts once it's done.
 */
export function state(c, date = today()) {
  const h = H.habit(c.habitId);
  const last = c.end < date ? c.end : date;
  const days = last >= c.start ? range(c.start, last) : [];
  const due = h ? days.filter((d) => H.isScheduledDay(h, d) && !H.isOff(H.dayMode(d)) && (d < date || H.counts(h, d))) : [];
  const kept = h ? due.filter((d) => H.counts(h, d)) : [];
  return {
    day: Math.min(c.days, Math.max(0, diffDays(date, c.start) + 1)), of: c.days,
    due: due.length, kept: kept.length, missed: due.filter((d) => !kept.includes(d)),
    left: Math.max(0, diffDays(c.end, date)), finished: date > c.end,
  };
}

/** Close pledges whose last day has passed: kept in full, or kept for so many days. Returns them. */
export function finalize(date = today()) {
  const done = commitments().filter((c) => c.status === 'active' && date > c.end);
  if (done.length) store.batch(done.map((c) => { const s = state(c, date); return { store: 'commitments', value: { ...c, status: s.missed.length ? 'done' : 'kept', kept: s.kept, due: s.due } }; }));
  return done;
}

/** End a pledge early, with what got in the way. Returns an undo. */
export function endEarly(c, reason = '') {
  const before = { ...c };
  const s = state(c);
  store.put('commitments', { ...c, status: 'ended', endedAt: today(), reason: reason.trim(), kept: s.kept, due: s.due });
  return () => store.put('commitments', before);
}

/** The smaller pledge offered after ending one: seven days, and the tiny version if there is one. */
export function smaller(c) {
  const h = H.habit(c.habitId);
  return { habitId: c.habitId, days: 7, stake: c.stake, tiny: !!H.tinyOf(h || {})?.label };
}
