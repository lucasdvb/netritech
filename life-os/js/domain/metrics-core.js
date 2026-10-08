// The day's totals Today needs at first render (water, food, steps, sleep, mood, the day record)
// and the adaptive steps target. Trends and estimates are in metrics.js, which re-exports these.
import * as store from '../data/store.js';
import { diffDays } from './dates.js';

const sum = (xs, f) => xs.reduce((a, x) => a + (Number(f(x)) || 0), 0);
export const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export const targets = () => store.settings()?.targets || {};

/* ---------- daily totals ---------- */
export const waterMl = (date) => sum(store.onDate('waterLogs', date), (r) => r.ml);
export function nutrition(date) {
  const logs = store.onDate('nutritionLogs', date);
  return {
    kcal: sum(logs, (r) => r.kcal),
    protein: sum(logs, (r) => r.protein),
    fat: sum(logs, (r) => r.fat),
    carbs: sum(logs, (r) => r.carbs),
    fruit: sum(logs, (r) => r.fruit),
    veg: sum(logs, (r) => r.veg),
    count: logs.length,
    logs,
  };
}
export const steps = (date) => store.get('stepLogs', date)?.steps ?? null;
export const sleep = (date) => store.get('sleepEntries', date) || null;
export const sleepHours = (date) => sleep(date)?.hours ?? null;
export const mood = (date) => store.get('moodEntries', date) || null;
export const review = (date) => store.get('dailyReviews', date) || null;
export const weight = (date) => store.get('weightEntries', date)?.kg ?? null;
export const mindMinutes = (date) => sum(store.onDate('readingSessions', date), (r) => r.minutes)
  + sum(store.onDate('learningSessions', date), (r) => r.minutes);
export const meditationMinutes = (date) => sum(store.onDate('meditationSessions', date), (r) => r.minutes);
export const relationship = (date, who) => store.onDate('relationshipEntries', date).filter((r) => r.person === who || r.kind === who);
export const journalCount = (date) => store.onDate('journalEntries', date).filter((j) => (j.text || '').trim() || Object.values(j.answers || {}).some((a) => (a || '').trim())).length;

/* ---------- series helpers ---------- */

/* ---------- steps target (adaptive ramp) ---------- */
export function stepsTarget(date, ramp = targets().stepsRamp || [7000, 8000, 9000]) {
  const start = store.profile()?.trackingStart || date;
  const week = Math.max(0, Math.floor(diffDays(date, start) / 7));
  return ramp[Math.min(week, ramp.length - 1)];
}
