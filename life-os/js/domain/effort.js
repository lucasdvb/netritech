// Effort per set and what it changes. Each working set can carry how many more reps you had in you
// (reps in reserve, RIR: 0 = nothing left, 4 = four or more). Effort makes the estimate of your
// maximum honest (a set of 8 with 2 left counts like a set of 10 to failure) and lets the next set,
// and the next session, follow how the weight actually felt:
// - Helms et al. 2016 (RIR-based RPE scale for resistance training): lifters rate RIR accurately,
//   especially close to failure, so it's usable for adjusting load from set to set.
// - Graham & Cleather 2021, Larsen et al. 2021: autoregulated loading (adjusting to the day's
//   performance) matches or beats fixed percentages for strength.
// - Estimated one-rep max: Epley's formula, load × (1 + reps / 30), with reps + RIR as the reps
//   that set was worth.
import { parseRange } from './next-step.js';

const LB = 0.45359237;
export const RIR = [0, 1, 2, 3, 4];
export const rirLabel = (r) => (r == null ? '' : r >= 4 ? '4+' : String(r));

/** Estimated one-rep max of a set (null without a load). */
export function e1rm(load, reps, rir = 0) {
  const l = Number(load);
  const r = Number(reps);
  if (!(l > 0) || !(r > 0) || r > 20) return null;
  return l * (1 + (r + Math.min(4, Number(rir) || 0)) / 30);
}

/** The best estimated max among sets. */
export function bestE1rm(sets) {
  let best = null;
  for (const s of sets) {
    if (s.warmup || s.completed === false) continue;
    const v = e1rm(s.load, s.reps, s.rir);
    if (v != null && (best == null || v > best)) best = v;
  }
  return best;
}

/** One load step up or down in your unit (2.5 kg or 5 lb), kept in kg and rounded there. */
export function stepLoad(kg, steps, unit = 'kg') {
  if (unit === 'lb') return Math.max(0, (Math.round(kg / LB / 2.5) * 2.5 + 5 * steps) * LB);
  return Math.max(0, Math.round((kg + 2.5 * steps) * 100) / 100);
}
/** A load a share lighter, rounded to what you can load (0.5 kg or 2.5 lb). */
export function lighter(kg, share, unit = 'kg') {
  const v = kg * (1 - share);
  if (unit === 'lb') return Math.round(v / LB / 2.5) * 2.5 * LB;
  return Math.round(v * 2) / 2;
}

/**
 * The next set in a session from how the one before felt: four or more reps left inside the range
 * → a step heavier; nothing left and below the range → 5% lighter. Otherwise null (keep going).
 * { load?, reps?, why }
 */
export function adjustNext(prev, target, { unit = 'kg', bodyweight = false } = {}) {
  if (!prev || prev.rir == null || !prev.completed || prev.warmup) return null;
  const range = parseRange(target);
  const reps = Number(prev.reps) || 0;
  const load = Number(prev.load) || 0;
  if (!range || !reps) return null;
  if (prev.rir >= 4 && reps >= range.low) {
    if (load > 0 && !bodyweight) return { load: stepLoad(load, 1, unit), reps: Math.max(range.low, Math.min(reps, range.high)), why: '4+ reps left last set: a step heavier.' };
    return { reps: Math.min(range.high + 5, reps + 2), why: '4+ reps left last set: two more reps.' };
  }
  if (prev.rir === 0 && reps < range.low && load > 0) {
    return { load: lighter(load, 0.05, unit), reps: range.low, why: 'Nothing left and below the range: 5% lighter.' };
  }
  return null;
}

/** Average RIR of sets that have one (null when none do). */
export function avgRir(sets) {
  const r = sets.filter((s) => s.rir != null).map((s) => Number(s.rir));
  return r.length ? r.reduce((a, b) => a + b, 0) / r.length : null;
}
