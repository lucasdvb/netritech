// The safety nets (U5, H7, H8, H9): plain rules that notice and suggest, and never change anything
// by themselves. Each net shows at most once per occasion and can be turned off for good in
// Settings (settings.nets[name] === false).
import * as store from '../data/store.js';
import * as H from './habits.js';
import { planHabits } from './scoring.js';
import * as R from './routines.js';
import { today, addDays, diffDays, range } from './dates.js';

export const FORTNIGHT = 14;
export const netOn = (name) => store.settings()?.nets?.[name] !== false;

/* ---------- shrink and grow (H7) ---------- */

const roundTo = (v, step) => Math.max(step, Math.round(v / step) * step);
const unitStep = (h) => (h.step && h.step > 0 ? h.step : h.target >= 100 ? 10 : 1);

/** What a habit's last two weeks say: { misses7, rate14, scheduled14 } over finished days. */
export function recentRecord(h, date = today()) {
  const end = addDays(date, -1);
  const p14 = H.periodsOf(h, addDays(end, -(FORTNIGHT - 1)), end).filter((p) => p.met !== null);
  const p7 = p14.filter((p) => p.key >= addDays(end, -6));
  const flexible = H.isFlexible(h);
  return {
    periods: p14,
    misses7: p7.filter((p) => p.met === false).length,
    rate14: p14.length ? p14.filter((p) => p.met).length / p14.length : null,
    scheduled14: p14.length,
    flexible,
  };
}

/** A temporary change in force on a date (a smaller target for two weeks). */
export const tempOf = (h, date = today()) => (h.temp && date < h.temp.until ? h.temp : null);

/**
 * Misses since the last completion (what "don't miss twice" needs), the same answer as
 * H.runs(h, end).missesInRow but looking back only as far as it has to.
 */
export function missesInRow(h, end = today(), recent = null) {
  const start = [addDays(end, -365), H.startOf(h)].sort().pop(); // as far back as runs() looks
  const every = h.schedule?.kind === 'interval' ? (h.schedule.every || 7) : 0;
  for (const back of [FORTNIGHT - 1, 60, 365]) {
    let from = [addDays(end, -back), start].sort().pop();
    // Interval periods count from the start, so a shorter window begins on one of their boundaries.
    if (every && from > start) from = addDays(start, Math.ceil(diffDays(from, start) / every) * every);
    // The last fortnight's periods, when the caller already has them (recentRecord).
    const ps = recent && !every && back < FORTNIGHT ? recent : H.periodsOf(h, from, end);
    let misses = 0;
    for (let i = ps.length - 1; i >= 0; i--) {
      if (ps[i].met === null) continue;
      if (ps[i].met) return misses;
      misses++;
    }
    if (from === start) return misses;
  }
  return 0;
}

/**
 * A suggestion for one habit, or null. Shrink: three misses in a week, or two in a row.
 * Grow: two weeks at 95% or better on a numeric target. Never for paused or queued habits, never
 * while a smaller target is still running.
 */
export function proposal(h, date = today()) {
  if (h.archived || ['paused', 'queue'].includes(H.stateOf(h, date)) || tempOf(h, date)) return null;
  const rec = recentRecord(h, date);
  // Two misses in a row: the fortnight usually answers it; only a sparse schedule looks further back.
  const twoInRow = () => {
    let n = 0;
    for (let i = rec.periods.length - 1; i >= 0; i--) { if (rec.periods[i].met) return false; if (++n === 2) return true; }
    return missesInRow(h, addDays(date, -1), rec.periods) >= 2;
  };
  const numeric = H.isNumeric(h) && h.type !== 'rating' && !h.ramp && h.target > 0;
  if (!rec.flexible && (rec.misses7 >= 3 || twoInRow())) {
    const why = rec.misses7 >= 3 ? `${rec.misses7} misses in the last week` : 'Two misses in a row';
    if (numeric && !h.source) {
      const to = roundTo(h.target * 0.6, unitStep(h));
      if (to < h.target) return { kind: 'shrink', habitId: h.id, why, from: h.target, to, weeks: 2 };
    }
    const tiny = H.tinyOf(h);
    if (tiny?.label || tiny?.min != null) return { kind: 'shrink', habitId: h.id, why, tiny: true, label: tiny.label, weeks: 2 };
    return { kind: 'pause', habitId: h.id, why };
  }
  if (numeric && !h.source && rec.scheduled14 >= 10 && rec.rate14 >= 0.95) {
    const to = roundTo(h.target * 1.1, unitStep(h));
    if (to > h.target) return { kind: 'grow', habitId: h.id, why: 'Two weeks at 95% or better', from: h.target, to };
  }
  return null;
}

/** When each habit last had a suggestion (so none repeats within 14 days). */
const shownLog = () => store.get('meta', 'adaptShown')?.items || {};
export const recentlySuggested = (habitId, date = today()) => {
  const last = shownLog()[habitId];
  return !!last && diffDays(date, last) < FORTNIGHT;
};
export function markSuggested(habitId, date = today()) {
  store.put('meta', { id: 'adaptShown', items: { ...shownLog(), [habitId]: date } });
}

// What the suggestions and the catch-up read besides dated data: they look only at days before
// today, so logging today never makes them work everything out again.
const UNDATED = ['habits', 'settings', 'profile', 'meta', 'routines', 'weeklyReviews', 'monthlyReviews'];

/** Today's suggestions, focus habits first, at most one per habit per fortnight. */
export function suggestions(date = today()) {
  if (!netOn('adapt')) return [];
  return store.memo(`suggestions:${date}`, UNDATED, () => {
    const list = H.activeHabits().filter((h) => H.started(h, addDays(date, -7)));
    const focus = (h) => (H.stateOf(h, date) === 'focus' ? 0 : 1);
    return list.sort((a, b) => focus(a) - focus(b))
      .filter((h) => !recentlySuggested(h.id, date))
      .map((h) => proposal(h, date)).filter(Boolean);
  }, store.changedBefore(date));
}

/** Accept a suggestion. Returns an undo that puts the habit back exactly. */
export function accept(p, date = today()) {
  const h = H.habit(p.habitId);
  if (!h) return () => {};
  const before = { ...h };
  if (p.kind === 'shrink' && p.to != null) store.put('habits', { ...h, temp: { target: p.to, from: p.from, until: addDays(date, p.weeks * 7), since: date } });
  else if (p.kind === 'shrink' && p.tiny) store.put('habits', { ...h, temp: { tiny: true, until: addDays(date, p.weeks * 7), since: date } });
  else if (p.kind === 'grow') store.put('habits', { ...h, target: p.to, min: h.min != null && h.min >= h.target ? p.to : h.min });
  else if (p.kind === 'pause') store.put('habits', { ...h, state: 'paused', stateBeforePause: H.stateOf(h, date), pausedUntil: addDays(date, FORTNIGHT) });
  markSuggested(p.habitId, date);
  return () => store.put('habits', before);
}

/* ---------- away and fresh start (H9) ---------- */

// Anything you logged by hand counts as being here.
const ACTIVITY = ['habitLogs', 'waterLogs', 'nutritionLogs', 'stepLogs', 'weightEntries', 'sleepEntries', 'moodEntries', 'journalEntries',
  'readingSessions', 'learningSessions', 'meditationSessions', 'spiritualSessions', 'relationshipEntries', 'workouts', 'routineRuns'];

/** The last day before `date` with anything logged, or null. */
export function lastActive(date = today()) {
  return store.memo(`last-active:${date}`, [...ACTIVITY, 'tasks'], () => {
    let best = null;
    for (const s of ACTIVITY) for (const r of store.all(s)) if (r.date && r.date < date && (!best || r.date > best)) best = r.date;
    for (const t of store.all('tasks')) { const d = t.doneAt?.slice(0, 10); if (t.done && d && d < date && (!best || d > best)) best = d; }
    return best;
  });
}

/** Three or more days with nothing logged right before today: { from, to, days }. */
export function absence(date = today()) {
  // Quick answer for the usual case: something was logged in the last three days.
  for (let i = 1; i <= 3; i++) { const d = addDays(date, -i); if (ACTIVITY.some((s) => store.onDate(s, d).length)) return null; }
  const start = H.trackingStart();
  const last = lastActive(date);
  const from = last ? addDays(last, 1) : start;
  const begin = from < start ? start : from;
  const to = addDays(date, -1);
  const days = diffDays(to, begin) + 1;
  return days >= 3 ? { from: begin, to, days } : null;
}

/** Mark the days away so they read as "away", not missed, and runs and scores skip them. */
export function markAway({ from, to }) {
  const ops = range(from, to).map((d) => ({ store: 'dailyReviews', value: { ...(store.get('dailyReviews', d) || { id: d, date: d }), mode: 'away' } }));
  if (ops.length) store.batch(ops);
}

/** The fresh-start sheet is due: away three or more days, not already answered today. */
export function freshStartDue(date = today()) {
  if (!netOn('freshStart')) return null;
  const a = absence(date);
  if (!a) return null;
  if (store.get('meta', 'freshStart')?.on === date) return null;
  return a;
}
export const markFreshStart = (date = today()) => store.put('meta', { id: 'freshStart', on: date });

/* ---------- catch-up (U5) ---------- */

/** Yesterday's planned habits that weren't logged, once, unless you were away or it was sealed. */
export function catchUp(date = today()) {
  if (!netOn('catchUp')) return null;
  const y = addDays(date, -1);
  if (y < H.trackingStart()) return null;
  const r = store.get('dailyReviews', y);
  const mode = r?.mode || 'normal';
  if (r?.catchUp || r?.sealedAt || mode === 'sick' || mode === 'away' || absence(date)) return null;
  const planned = new Map(planHabits(y, mode).map((h) => [h.id, h]));
  for (const p of R.forDay(y, mode)) for (const s of p.steps) if (s.kind === 'habit' && !s.habit.source) planned.set(s.habit.id, s.habit);
  const habits = [...planned.values()].filter((h) => !H.counts(h, y, mode) && !H.skipped(h, y, mode) && !h.source?.startsWith('workout:') && h.source !== 'sleep');
  return habits.length ? { date: y, habits } : null;
}
export const closeCatchUp = (date) => store.put('dailyReviews', { ...(store.get('dailyReviews', date) || { id: date, date }), catchUp: new Date().toISOString() });

/* ---------- weekly tidy-up (H8) ---------- */

/** Habits you haven't touched for 14 days (no log, no skip) that are still meant to run. */
export function untouched(date = today()) {
  const since = addDays(date, -FORTNIGHT);
  return H.activeHabits().filter((h) => {
    if (h.source || ['paused', 'queue'].includes(H.stateOf(h, date)) || !H.started(h, since)) return false;
    return !store.all('habitLogs').some((l) => l.habitId === h.id && l.date >= since);
  });
}

/** The tidy-up is due once a week (from Sunday), when there's something to tidy. */
export function tidyDue(date = today()) {
  if (!netOn('tidy')) return null;
  const last = store.get('meta', 'tidy')?.on;
  if (last && diffDays(date, last) < 7) return null;
  const list = untouched(date);
  return list.length ? list : null;
}
export const markTidy = (date = today()) => store.put('meta', { id: 'tidy', on: date });

/** Words for a suggestion: { title, sub, yes }. */
export function describeProposal(p) {
  const h = H.habit(p.habitId);
  if (!h) return null;
  const unit = h.unit ? ` ${h.unit}` : '';
  if (p.kind === 'grow') return { title: `${h.name}: step up to ${p.to}${unit}?`, sub: `${p.why}. A small step: ${p.from} → ${p.to}${unit}.`, yes: 'Step up' };
  if (p.kind === 'pause') return { title: `${h.name}: pause it for two weeks?`, sub: `${p.why}. A pause keeps it out of your plan without losing it.`, yes: 'Pause' };
  if (p.tiny) return { title: `${h.name}: just the tiny version for two weeks?`, sub: `${p.why}. ${p.label ? `“${p.label}” counts every day.` : 'The tiny version counts every day.'}`, yes: 'Make it smaller' };
  return { title: `${h.name}: ${p.to}${unit} for two weeks?`, sub: `${p.why}. Smaller for now (${p.from} → ${p.to}${unit}), then back up.`, yes: 'Make it smaller' };
}
