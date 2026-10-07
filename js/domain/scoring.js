// Daily foundation score and rolling consistency.
import * as store from '../data/store.js';
import { activeHabits, isDone, isScheduledDay, started, dayMode, trackingStart, DATA_STORES, consistency } from './habits.js';
import { today, lastNDays } from './dates.js';
import { avg } from './metrics.js';

export function scoreHabits(date, mode = dayMode(date)) {
  if (mode === 'sick') return [];
  const hs = activeHabits().filter((h) => started(h, date));
  if (mode === 'minimum') return hs.filter((h) => h.mvd);
  return hs.filter((h) => h.affectsScore && h.priority !== 'optional' && isScheduledDay(h, date));
}

export function dayScore(date) {
  return store.memo(`score:${date}`, DATA_STORES, () => {
    const mode = dayMode(date);
    const items = scoreHabits(date, mode).map((habit) => ({ habit, done: isDone(habit, date, mode) }));
    const done = items.filter((i) => i.done).length;
    return { date, mode, items, done, total: items.length, ratio: items.length ? done / items.length : null };
  });
}

export function rolling(end = today(), n = 7) {
  return store.memo(`rolling:${end}:${n}`, DATA_STORES, () => {
    const start = trackingStart();
    const t = today();
    const vals = [];
    for (const d of lastNDays(end, n)) {
      if (d < start || d > t) continue;
      const s = dayScore(d);
      if (s.ratio == null) continue;
      if (d === t && s.done === 0) continue;
      vals.push(s.ratio);
    }
    return { ratio: avg(vals), days: vals.length };
  });
}

export function band(ratio) {
  const b = store.settings()?.bands || { strong: 85, steady: 70, attention: 50 };
  if (ratio == null) return { key: 'none', label: 'Getting started' };
  const pct = ratio * 100;
  if (pct >= b.strong) return { key: 'strong', label: 'Strong' };
  if (pct >= b.steady) return { key: 'steady', label: 'Steady' };
  if (pct >= b.attention) return { key: 'attention', label: 'Needs attention' };
  return { key: 'simplify', label: 'Time to simplify' };
}

/** Weekly consistency for high-value habits (scored against their weekly targets). */
export function priorityConsistency(priority, end = today(), days = 7) {
  const hs = activeHabits().filter((h) => h.priority === priority && h.weekly !== false && started(h, end));
  const vals = hs.map((h) => consistency(h, end, days).ratio).filter((r) => r != null);
  return { ratio: avg(vals), habits: hs.length };
}

export function categoryConsistency(category, end = today(), days = 30) {
  const hs = activeHabits().filter((h) => h.category === category && h.priority !== 'optional');
  const vals = hs.map((h) => consistency(h, end, days).ratio).filter((r) => r != null);
  return avg(vals);
}

export const pct = (r) => (r == null ? '—' : `${Math.round(r * 100)}%`);
