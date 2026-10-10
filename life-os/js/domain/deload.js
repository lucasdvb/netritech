// The automatic deload: a lighter week, suggested when training stops paying off, and applied by
// itself while it runs (half the sets, 10% lighter, well short of failure). Fatigue builds faster
// than fitness shows; a planned lighter week lets it clear, and strength usually comes back higher
// (Bell et al. 2023, deloading practices in strength and physique sports; Pritchard et al. 2015
// and Coleman et al. 2024 on short reductions in training keeping or restoring strength).
//
// Suggested when one of these holds, and you haven't had one (or put it off) in the last 14 days:
// - stalled: your estimated maximum hasn't gone up for three sessions on two or more lifts;
// - recovery: a week of short sleep and low energy while still training hard;
// - six hard weeks in a row (three or more strength sessions each) since the last deload.
import * as store from '../data/store.js';
import { allWorkouts, setsOf, exercise } from './fitness-core.js';
import { bestE1rm } from './effort.js';
import { today, addDays, diffDays, lastNDays, startOfWeek } from './dates.js';
import { avg, sleepHours, mood, targets } from './metrics-core.js';

const LENGTH = 7;
export const LOAD_SHARE = 0.1;

const profile = () => store.profile() || {};

/** The deload you're in on a date: { from, to, reason } or null. */
export function active(date = today()) {
  const d = profile().deload;
  return d && d.from <= date && date <= d.to ? d : null;
}

/** Sets in a deload: half, at least one. */
export const deloadSets = (n) => Math.max(1, Math.ceil(Number(n || 0) / 2));

function strengthSessions(before) {
  return allWorkouts().filter((w) => w.kind === 'strength' && w.date <= before);
}

/** Lifts whose estimated max hasn't risen over their last three sessions (names). */
export function stalledLifts(date = today()) {
  const since = addDays(date, -42);
  const byEx = new Map();
  for (const w of strengthSessions(date)) {
    if (w.date < since) break;
    for (const s of setsOf(w.id)) {
      if (!s.completed || s.warmup || !(Number(s.load) > 0)) continue;
      if (!byEx.has(s.exerciseId)) byEx.set(s.exerciseId, new Map());
      const m = byEx.get(s.exerciseId);
      if (!m.has(w.id)) m.set(w.id, []);
      m.get(w.id).push(s);
    }
  }
  const out = [];
  for (const [id, m] of byEx) {
    // Newest first (allWorkouts is newest first).
    const vals = [...m.values()].slice(0, 4).map(bestE1rm).filter((v) => v != null);
    if (vals.length < 4) continue;
    const [last, ...before] = vals;
    // Three sessions without beating the best of what came before (1% tolerance for rounding).
    const ref = before[before.length - 1];
    if (Math.max(last, before[0], before[1]) <= ref * 1.01) out.push(exercise(id)?.name || 'A lift');
  }
  return out;
}

/** Hard weeks in a row up to this one: three or more strength sessions each, since the last deload. */
export function hardWeeks(date = today()) {
  const lastEnd = profile().deload?.to || '0000-00-00';
  let n = 0;
  for (let ws = startOfWeek(addDays(date, -7)); ws > lastEnd; ws = addDays(ws, -7)) {
    const count = strengthSessions(addDays(ws, 6)).filter((w) => w.date >= ws && w.date <= addDays(ws, 6)).length;
    if (count < 3) break;
    n++;
    if (n > 12) break;
  }
  return n;
}

/** Short sleep and low energy over the last week, while still training. */
function poorRecovery(date) {
  const days = lastNDays(date, 7);
  const sleep = avg(days.map(sleepHours).filter((v) => v != null));
  const energy = avg(days.map((d) => mood(d)?.energy).filter((v) => v != null));
  const trained = strengthSessions(date).filter((w) => w.date > addDays(date, -7)).length;
  const t = targets();
  if (sleep == null || energy == null || trained < 2) return null;
  if (sleep < (t.sleepMinH ?? 7) - 0.5 && energy <= 5) return { sleep, energy };
  return null;
}

/** Why a lighter week is due now: { kind, why } or null. */
export function signal(date = today()) {
  const p = profile();
  if (active(date) || (p.deload?.to && diffDays(date, p.deload.to) < 14)) return null;
  if (p.deloadSnoozed && diffDays(date, p.deloadSnoozed) < 14) return null;
  const stalled = stalledLifts(date);
  if (stalled.length >= 2) return { kind: 'stalled', why: `${stalled.slice(0, 2).join(' and ')}${stalled.length > 2 ? ` and ${stalled.length - 2} more` : ''} haven’t gone up in three sessions.` };
  const rec = poorRecovery(date);
  if (rec) return { kind: 'recovery', why: `Sleep has averaged ${rec.sleep.toFixed(1)} h and energy ${Math.round(rec.energy)}/10 this week while you kept training.` };
  const weeks = hardWeeks(date);
  if (weeks >= 6) return { kind: 'weeks', why: `${weeks} hard weeks in a row. A lighter one now keeps the next six moving.` };
  return null;
}

/** Start a lighter week today. Returns an undo. */
export function start(reason = '', date = today()) {
  const before = profile().deload ?? null;
  store.setProfile({ deload: { from: date, to: addDays(date, LENGTH - 1), reason }, deloadSnoozed: null });
  return () => store.setProfile({ deload: before });
}

/** End the lighter week now (back to normal from today). Returns an undo. */
export function end(date = today()) {
  const d = profile().deload;
  if (!d) return () => {};
  store.setProfile({ deload: { ...d, to: addDays(date, -1) } });
  return () => store.setProfile({ deload: d });
}

/** Not now: asked again in 14 days at the earliest. Returns an undo. */
export function snooze(date = today()) {
  const before = profile().deloadSnoozed ?? null;
  store.setProfile({ deloadSnoozed: date });
  return () => store.setProfile({ deloadSnoozed: before });
}
