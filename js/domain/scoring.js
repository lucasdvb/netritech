// The daily score and rolling consistency.
// Today's score is the share of today's plan that is done: your focus habits that are due, and
// your Top 3. Tiny versions count. Autopilot habits never lower it (docs DR-05).
import * as store from '../data/store.js';
import { activeHabits, counts, level, isScheduledDay, started, dayMode, trackingStart, DATA_STORES, consistency, stateOf, dueOn, periodDone, lastDoneBefore, isFlexible } from './habits.js';
import { today, lastNDays, endOfWeek, endOfMonth, diffDays } from './dates.js';
import { avg } from './metrics.js';

const isTraining = (h) => h.id === 'h-training' || !!h.source?.startsWith('workout:');

/** A flexible habit (so many times a week) only joins a day's plan when that day is needed. */
function neededOn(h, date) {
  const s = h.schedule || {};
  if (!isFlexible(h)) return isScheduledDay(h, date);
  if (counts(h, date)) return true;
  if (s.kind === 'interval') return dueOn(h, date, 'normal');
  const end = s.kind === 'perMonth' ? endOfMonth(date) : endOfWeek(date);
  const left = diffDays(end, date) + 1;
  return (s.count || 1) - periodDone(h, date) >= left;
}

/** The habits in a day's plan: focus habits that are due; on a minimum day, the essentials too. */
export function planHabits(date, mode = dayMode(date)) {
  if (mode === 'sick') return [];
  const live = activeHabits().filter((h) => started(h, date) && h.showOnToday !== false);
  const focus = live.filter((h) => stateOf(h, date) === 'focus' && neededOn(h, date) && !(mode === 'rest' && isTraining(h)));
  if (mode !== 'minimum') return focus;
  const essentials = live.filter((h) => h.mvd && !['paused', 'queue'].includes(stateOf(h, date)) && dueOn(h, date, 'minimum'));
  return [...new Set([...focus, ...essentials])];
}
export const scoreHabits = planHabits;

/** Today's Top 3 that have been written down. */
export const top3Items = (date) => (store.get('dailyReviews', date)?.top3 || [])
  .map((p, i) => ({ kind: 'top3', index: i, text: (p.text || '').trim(), done: !!p.done }))
  .filter((p) => p.text);

export function dayScore(date) {
  return store.memo(`score:${date}`, DATA_STORES, () => {
    const mode = dayMode(date);
    const items = [
      ...planHabits(date, mode).map((habit) => {
        const lv = level(habit, date, mode);
        return { kind: 'habit', habit, level: lv, done: !!lv };
      }),
      ...(mode === 'normal' || mode === 'rest' ? top3Items(date) : []),
    ];
    const done = items.filter((i) => i.done).length;
    const tiny = items.filter((i) => i.level === 'tiny').length;
    return { date, mode, items, done, tiny, total: items.length, ratio: items.length ? done / items.length : null };
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

/** Consistency of the habits in one state (focus by default), against their own schedules. */
export function stateConsistency(state = 'focus', end = today(), days = 7) {
  const hs = activeHabits().filter((h) => stateOf(h, end) === state && h.weekly !== false && started(h, end));
  const vals = hs.map((h) => consistency(h, end, days).ratio).filter((r) => r != null);
  return { ratio: avg(vals), habits: hs.length };
}

export function categoryConsistency(category, end = today(), days = 30) {
  const hs = activeHabits().filter((h) => h.category === category && !['queue', 'paused'].includes(stateOf(h, end)));
  const vals = hs.map((h) => consistency(h, end, days).ratio).filter((r) => r != null);
  return avg(vals);
}

export const pct = (r) => (r == null ? '—' : `${Math.round(r * 100)}%`);
