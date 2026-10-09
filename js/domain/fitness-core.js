// The workout facts Today needs at first render (what's planned, what's done, what a habit can
// ask about a day). The rest of training (progression, bests, history) is in fitness.js, which
// re-exports all of this.
import * as store from '../data/store.js';
import { lastNDays, today, weekday, cmp } from './dates.js';

export const exercise = (id) => store.get('exercises', id);
export const exercises = () => store.all('exercises').filter((e) => !e.archived).sort((a, b) => a.name.localeCompare(b.name));
export const templates = () => store.all('templates').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
export const template = (id) => store.get('templates', id);

export function plannedTemplate(date) {
  const plan = store.profile()?.plan || {};
  const id = plan[weekday(date)];
  return id ? template(id) : null;
}

/** Finished training sessions on a date. Mobility sessions have their own habit and aren't
 *  training, so they're left out unless asked for. */
export const workoutsOn = (date, { mobility = false } = {}) => store.onDate('workouts', date).filter((w) => w.status === 'done' && (mobility || w.kind !== 'mobility'));
export const isTraining = (w) => w.kind !== 'mobility';
const setIndex = () => store.memo('sets-by-workout', ['workoutSets'], () => {
  const m = new Map();
  for (const s of store.all('workoutSets')) {
    if (!m.has(s.workoutId)) m.set(s.workoutId, []);
    m.get(s.workoutId).push(s);
  }
  for (const list of m.values()) list.sort((a, b) => (a.order - b.order) || (a.setIndex - b.setIndex));
  return m;
});
export const setsOf = (workoutId) => setIndex().get(workoutId) || [];
/** Training sessions only (no mobility), for counts of sessions. */
export const trainingWorkouts = () => store.memo('training-workouts', ['workouts'], () => allWorkouts().filter(isTraining));
export const allWorkouts = () => store.memo('all-workouts', ['workouts'], () => store.all('workouts').filter((w) => w.status === 'done').sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : cmp(b.startedAt || '', a.startedAt || ''))));
export const activeWorkout = () => store.all('workouts').find((w) => w.status === 'active') || null;

/** Facts a habit source can ask about a date. */
export function workoutFacts(date) {
  return store.memo(`facts:${date}`, ['workouts', 'workoutSets', 'exercises'], () => computeFacts(date));
}

function computeFacts(date) {
  const ws = workoutsOn(date, { mobility: true });
  // Mobility has its own habit: a mobility session alone isn't the day's training.
  const facts = { any: ws.some((w) => w.kind !== 'mobility'), mobility: ws.some((w) => w.kind === 'mobility'), strength: false, core: false, calves: false, cardio: false, progression: false };
  if (!ws.length) return facts;
  // One pass over the sets of this day's workouts (cheaper than indexing every set ever logged).
  const ids = new Set(ws.map((w) => w.id));
  const cats = new Map(ws.map((w) => [w.id, { cats: new Set(), cardioMin: 0 }]));
  for (const s of store.where('workoutSets', (x) => x.completed && ids.has(x.workoutId))) {
    const c = exercise(s.exerciseId)?.category;
    if (!c) continue;
    const w = cats.get(s.workoutId);
    w.cats.add(c);
    if (c === 'cardio') w.cardioMin += Number(s.minutes) || 0;
  }
  for (const w of ws) {
    if (w.kind === 'strength') facts.strength = true;
    if (w.kind === 'cardio') facts.cardio = true;
    if (w.progression === 'improved') facts.progression = true;
    const { cats: c, cardioMin } = cats.get(w.id);
    if (c.has('core')) facts.core = true;
    if (c.has('calves')) facts.calves = true;
    if (c.has('cardio') && cardioMin >= 20) facts.cardio = true;
  }
  return facts;
}

/** Recent "hard" sessions: strength workouts with difficulty ≥ 4 or RPE ≥ 8 in the last n days. */
export function hardSessions(end = today(), days = 4) {
  const span = new Set(lastNDays(end, days));
  return store.all('workouts').filter((w) => w.status === 'done' && span.has(w.date)
    && (Number(w.difficulty) >= 4 || Number(w.rpe) >= 8)).length;
}
