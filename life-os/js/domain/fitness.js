// Workouts, sets, progression and personal bests.
import * as store from '../data/store.js';
import { exercise, setsOf, allWorkouts } from './fitness-core.js';
export * from './fitness-core.js';
import { addDays, startOfWeek, endOfWeek, today } from './dates.js';

export const CATEGORIES = [
  { id: 'chest', label: 'Chest' }, { id: 'back', label: 'Back' }, { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' }, { id: 'legs', label: 'Legs' }, { id: 'glutes', label: 'Glutes' },
  { id: 'calves', label: 'Calves' }, { id: 'core', label: 'Core' }, { id: 'mobility', label: 'Mobility' },
  { id: 'cardio', label: 'Cardio' },
];
export const categoryLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;

/* ---------- performance of one exercise in one workout ---------- */
export function performance(workoutId, exerciseId) {
  return perfOf(setsOf(workoutId).filter((s) => s.exerciseId === exerciseId && s.completed), exercise(exerciseId));
}

function perfOf(sets, e) {
  if (!sets.length) return null;
  const reps = sets.map((s) => Number(s.reps) || 0);
  const secs = sets.map((s) => Number(s.seconds) || 0);
  const loads = sets.map((s) => Number(s.load) || 0);
  return {
    sets: sets.length,
    totalReps: reps.reduce((a, b) => a + b, 0),
    topReps: Math.max(...reps),
    topLoad: Math.max(...loads),
    totalSeconds: secs.reduce((a, b) => a + b, 0),
    topSeconds: Math.max(...secs),
    minutes: sets.reduce((a, s) => a + (Number(s.minutes) || 0), 0),
    volume: sets.reduce((a, s) => a + (Number(s.reps) || 0) * (Number(s.load) || 0), 0),
    level: e?.level || 0,
    metric: e?.metric || 'reps',
  };
}

/** Most recent completed workout before `beforeDate`/`excludeId` that trained this exercise (or one in its family). */
export function previousPerformance(exerciseId, { excludeWorkoutId, before } = {}) {
  const e = exercise(exerciseId);
  const family = e?.family;
  const ids = family ? store.all('exercises').filter((x) => x.family === family).map((x) => x.id) : [exerciseId];
  for (const w of allWorkouts()) {
    if (w.id === excludeWorkoutId) continue;
    if (before && w.date > before) continue;
    for (const id of [exerciseId, ...ids.filter((i) => i !== exerciseId)]) {
      const p = performance(w.id, id);
      if (p) return { workout: w, exerciseId: id, ...p };
    }
  }
  return null;
}

/** 'improved' | 'maintained' | 'declined' | 'first' with a short human reason. */
export function compare(current, previous) {
  if (!current) return null;
  if (!previous) return { verdict: 'first', reason: 'First time logged' };
  if (current.level > previous.level) return { verdict: 'improved', reason: 'Harder variation' };
  if (current.level < previous.level) return { verdict: 'maintained', reason: 'Easier variation' };
  if (current.metric === 'time') {
    if (current.topSeconds > previous.topSeconds) return { verdict: 'improved', reason: `Longer hold (+${current.topSeconds - previous.topSeconds} s)` };
    if (current.totalSeconds > previous.totalSeconds) return { verdict: 'improved', reason: 'More total time' };
    if (current.totalSeconds < previous.totalSeconds * 0.9) return { verdict: 'declined', reason: 'Less total time' };
    return { verdict: 'maintained', reason: 'Same as last time' };
  }
  if (current.metric === 'minutes') {
    if (current.minutes > previous.minutes) return { verdict: 'improved', reason: `+${current.minutes - previous.minutes} min` };
    if (current.minutes < previous.minutes * 0.85) return { verdict: 'declined', reason: 'Shorter session' };
    return { verdict: 'maintained', reason: 'Same as last time' };
  }
  if (current.topLoad > previous.topLoad) return { verdict: 'improved', reason: `Heavier (+${current.topLoad - previous.topLoad} kg)` };
  if (current.topLoad < previous.topLoad) {
    return current.totalReps > previous.totalReps ? { verdict: 'maintained', reason: 'Lighter, more reps' } : { verdict: 'declined', reason: 'Lighter load' };
  }
  if (current.sets > previous.sets && current.totalReps >= previous.totalReps) return { verdict: 'improved', reason: '+1 set' };
  if (current.totalReps > previous.totalReps) return { verdict: 'improved', reason: `+${current.totalReps - previous.totalReps} reps` };
  if (current.topReps > previous.topReps) return { verdict: 'improved', reason: 'Better top set' };
  if (current.totalReps < previous.totalReps * 0.9) return { verdict: 'declined', reason: `${current.totalReps - previous.totalReps} reps` };
  return { verdict: 'maintained', reason: 'Same as last time' };
}

export function workoutProgress(workout) {
  const ids = [...new Set(setsOf(workout.id).filter((s) => s.completed).map((s) => s.exerciseId))];
  const rows = ids.map((id) => {
    const cur = performance(workout.id, id);
    const prev = previousPerformance(id, { excludeWorkoutId: workout.id, before: workout.date });
    return { exerciseId: id, current: cur, previous: prev, ...compare(cur, prev) };
  });
  const improved = rows.filter((r) => r.verdict === 'improved').length;
  const declined = rows.filter((r) => r.verdict === 'declined').length;
  const verdict = improved ? 'improved' : declined > rows.length / 2 ? 'declined' : 'maintained';
  return { rows, improved, declined, verdict };
}

/* ---------- weekly views ---------- */
export function weekStats(date = today()) {
  return store.memo(`week-stats:${startOfWeek(date)}`, ['workouts', 'workoutSets', 'exercises'], () => computeWeekStats(date));
}

function computeWeekStats(date) {
  const from = startOfWeek(date), to = endOfWeek(date);
  const ws = store.all('workouts').filter((w) => w.status === 'done' && w.date >= from && w.date <= to);
  let calfSessions = 0, coreSessions = 0, calfReps = 0, calfVolume = 0, minutes = 0;
  for (const w of ws) {
    minutes += Number(w.minutes) || 0;
    const sets = setsOf(w.id).filter((s) => s.completed);
    const cat = (s) => exercise(s.exerciseId)?.category;
    if (sets.some((s) => cat(s) === 'calves')) calfSessions++;
    if (sets.some((s) => cat(s) === 'core')) coreSessions++;
    for (const s of sets.filter((x) => cat(x) === 'calves')) {
      calfReps += Number(s.reps) || 0;
      calfVolume += (Number(s.reps) || 0) * (Number(s.load) || 0);
    }
  }
  return {
    from, to,
    sessions: ws.length,
    strength: ws.filter((w) => w.kind === 'strength').length,
    cardio: ws.filter((w) => w.kind === 'cardio').length,
    calfSessions, coreSessions, calfReps, calfVolume, minutes,
  };
}

export function weeklySeries(weeks, fn, end = today()) {
  const out = [];
  let start = startOfWeek(end);
  for (let i = weeks - 1; i >= 0; i--) out.push({ date: addDays(start, -7 * i), ...fn(addDays(start, -7 * i)) });
  return out;
}

/* ---------- personal bests ---------- */
export function personalBests() {
  const best = new Map();
  for (const s of store.all('workoutSets')) {
    if (!s.completed) continue;
    const w = store.get('workouts', s.workoutId);
    if (!w || w.status !== 'done') continue;
    const e = exercise(s.exerciseId);
    if (!e) continue;
    const cur = best.get(e.id) || { exercise: e, reps: 0, repsDate: null, load: 0, loadDate: null, seconds: 0, secondsDate: null, minutes: 0 };
    if ((Number(s.reps) || 0) > cur.reps) { cur.reps = Number(s.reps); cur.repsDate = w.date; }
    if ((Number(s.load) || 0) > cur.load) { cur.load = Number(s.load); cur.loadDate = w.date; }
    if ((Number(s.seconds) || 0) > cur.seconds) { cur.seconds = Number(s.seconds); cur.secondsDate = w.date; }
    if ((Number(s.minutes) || 0) > cur.minutes) cur.minutes = Number(s.minutes);
    best.set(e.id, cur);
  }
  return [...best.values()];
}

/** One exercise's performance in every completed workout that trained it, oldest first (at most `limit`, the latest). */
export function exerciseHistory(exerciseId, limit = 20) {
  const all = store.memo(`ex-history:${exerciseId}`, ['workouts', 'workoutSets', 'exercises'],
    () => allWorkouts().map((w) => ({ workout: w, perf: performance(w.id, exerciseId) })).filter((x) => x.perf));
  return all.slice(0, limit).reverse();
}

/** How many completed workouts trained each exercise: Map(exerciseId → count). */
export const sessionsPerExercise = () => store.memo('ex-sessions', ['workouts', 'workoutSets'], () => {
  const done = new Set(allWorkouts().map((w) => w.id));
  const seen = new Map();
  for (const s of store.all('workoutSets')) {
    if (!s.completed || !done.has(s.workoutId)) continue;
    if (!seen.has(s.exerciseId)) seen.set(s.exerciseId, new Set());
    seen.get(s.exerciseId).add(s.workoutId);
  }
  return new Map([...seen].map(([id, ws]) => [id, ws.size]));
});
