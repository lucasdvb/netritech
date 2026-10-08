// The next step for an exercise (13d), from what you did last time against the goal range:
// - every set reached the top of the range → add weight (2.5 kg or 5 lb), or for a bodyweight
//   exercise one more rep, or the harder variation when there is one; holds get 5 more seconds;
// - otherwise one more rep (or 5 more seconds) on the same weight;
// - after two sessions in a row without progress, still below the top → hold the weight and make
//   every rep clean.
// Double progression, the standard way to progress within a rep range.
import * as store from '../data/store.js';
import { exercise, allWorkouts, setsOf } from './fitness-core.js';
import { performance, compare } from './fitness.js';

const LB = 0.45359237;

/** "8–15" → { low: 8, high: 15 }; "10" → { low: 10, high: 10 }; "30–45 s" → seconds. */
export function parseRange(target) {
  const m = String(target || '').match(/(\d+)(?:\s*[–-]\s*(\d+))?/);
  if (!m) return null;
  const low = Number(m[1]);
  const high = Number(m[2] || m[1]);
  return { low: Math.min(low, high), high: Math.max(low, high) };
}

/** The last sessions that trained this exercise before a workout (newest first). */
function lastSessions(exerciseId, { excludeWorkoutId, before } = {}, n = 3) {
  const out = [];
  for (const w of allWorkouts()) {
    if (w.id === excludeWorkoutId || (before && w.date > before)) continue;
    const sets = setsOf(w.id).filter((s) => s.exerciseId === exerciseId && s.completed);
    if (!sets.length) continue;
    out.push({ workout: w, sets, perf: performance(w.id, exerciseId) });
    if (out.length === n) break;
  }
  return out;
}

const harder = (e) => (e?.family ? store.all('exercises').filter((x) => x.family === e.family && !x.archived && (x.level || 0) === (e.level || 0) + 1)[0] || null : null);

/**
 * { kind: 'load' | 'reps' | 'seconds' | 'variation' | 'hold', load?, reps?, seconds?, exerciseId?, why }
 * or null when there's nothing to go on (first time, no goal, or minutes-based).
 */
export function nextStep(exerciseId, target, { excludeWorkoutId, before, unit = 'kg' } = {}) {
  const e = exercise(exerciseId);
  const range = parseRange(target);
  if (!e || !range || e.metric === 'minutes') return null;
  const [last, prev, older] = lastSessions(exerciseId, { excludeWorkoutId, before });
  if (!last) return null;
  const time = e.metric === 'time';
  const vals = last.sets.map((s) => Number(time ? s.seconds : s.reps) || 0);
  const topLoad = Math.max(...last.sets.map((s) => Number(s.load) || 0));
  const allTop = vals.every((v) => v >= range.high);
  if (allTop) {
    if (time) return { kind: 'seconds', seconds: range.high + 5, why: `Every hold reached ${range.high} s last time.` };
    if (topLoad > 0 || e.defaultLoad) {
      const step = unit === 'lb' ? 5 * LB : 2.5;
      return { kind: 'load', load: Math.round(((topLoad || e.defaultLoad) + step) * 100) / 100, reps: range.low, why: `Every set reached ${range.high} reps last time.` };
    }
    const h = harder(e);
    if (h) return { kind: 'variation', exerciseId: h.id, reps: range.low, why: `Every set reached ${range.high} reps last time: ready for ${h.name}.` };
    return { kind: 'reps', reps: Math.max(...vals) + 1, why: `Every set reached ${range.high} reps last time.` };
  }
  // Two sessions in a row without progress: hold, and own the reps before adding more.
  const stalled = (a, b) => a && b && ['maintained', 'declined'].includes(compare(a.perf, b.perf)?.verdict);
  if (stalled(last, prev) && stalled(prev, older)) {
    return { kind: 'hold', load: topLoad || null, reps: Math.min(...vals), why: 'Two sessions without progress: hold the weight and make every rep clean.' };
  }
  const weakest = Math.min(...vals);
  return time ? { kind: 'seconds', seconds: Math.min(range.high, weakest + 5), why: 'Five more seconds than last time, up to the top of the range.' }
    : { kind: 'reps', reps: Math.min(range.high, weakest + 1), load: topLoad || null, why: `One more rep than last time, up to ${range.high}.` };
}

/** The short line for a set screen: "Next step: 12.5 kg × 8". */
export function stepLabel(s, fmtLoad = (kg) => `${kg} kg`) {
  if (!s) return '';
  if (s.kind === 'variation') return `Next step: ${exercise(s.exerciseId)?.name || 'the harder variation'}`;
  if (s.kind === 'seconds') return `Next step: ${s.seconds} s`;
  if (s.kind === 'load') return `Next step: ${fmtLoad(s.load)} × ${s.reps}`;
  if (s.kind === 'hold') return `Hold: ${s.load ? `${fmtLoad(s.load)} × ` : ''}${s.reps}`;
  return `Next step: ${s.reps} reps${s.load ? ` at ${fmtLoad(s.load)}` : ''}`;
}
