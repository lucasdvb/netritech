// Morning and evening rituals (U4) and sealing the day (G5). Each ritual is a short run of
// screens, one question each, about a minute in all; every step can be skipped. The steps that
// appear depend on the day (no "habits left" screen when nothing is left).
import * as store from '../data/store.js';
import * as H from './habits.js';
import * as T from './tasks.js';
import * as R from './routines.js';
import { planHabits } from './scoring.js';
import { reviewOf } from './day.js';

/** Habits still open on a date: the day's plan and routine steps not done or set aside. */
export function openHabits(date) {
  const mode = H.dayMode(date);
  const map = new Map(planHabits(date, mode).map((h) => [h.id, h]));
  for (const p of R.forDay(date, mode)) for (const s of p.steps) if (s.kind === 'habit') map.set(s.habit.id, s.habit);
  return [...map.values()].filter((h) => !H.counts(h, date, mode) && !H.skipped(h, date, mode) && h.source !== 'sleep' && h.source !== 'top3');
}

/** Tasks dated today or earlier that are still open. */
export const unfinished = (date) => T.open().filter((t) => t.date && t.date <= date);

export function steps(which, date) {
  if (which === 'morning') return ['sleep', 'feel', 'weight', 'three', 'start'];
  return [
    ...(openHabits(date).length ? ['habits'] : []),
    'win',
    ...(unfinished(date).length ? ['tasks'] : []),
    'tomorrow',
    'seal',
  ];
}

export const ritualDone = (date, which) => !!reviewOf(date).ritual?.[which];
export function markRitual(date, which) {
  const r = reviewOf(date);
  store.put('dailyReviews', { ...r, id: date, date, ritual: { ...(r.ritual || {}), [which]: new Date().toISOString() } });
}

/* ---------- seal the day (G5) ---------- */

export const sealedAt = (date) => reviewOf(date).sealedAt || null;

/** Seal a day. Returns an undo that puts the day record back exactly. */
export function seal(date) {
  const before = store.get('dailyReviews', date) || null;
  store.put('dailyReviews', { ...reviewOf(date), id: date, date, sealedAt: new Date().toISOString() });
  return () => (before ? store.put('dailyReviews', before) : store.remove('dailyReviews', date));
}

