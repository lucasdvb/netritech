// The workout facts Today needs at first render (what's planned, what's done, what a habit can
// ask about a day). The rest of training (progression, bests, history) is in fitness.js, which
// re-exports all of this.
import * as store from '../data/store.js';
import { lastNDays, today, weekday } from './dates.js';

export const exercise = (id) => store.get('exercises', id);
export const exercises = () => store.all('exercises').filter((e) => !e.archived).sort((a, b) => a.name.localeCompare(b.name));
export const templates = () => store.all('templates').sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
export const template = (id) => store.get('templates', id);

export function plannedTemplate(date) {
  const plan = store.profile()?.plan || {};
  const id = plan[weekday(date)];
  return id ? template(id) : null;
}

export const workoutsOn = (date) => store.onDate('workouts', date).filter((w) => w.status === 'done');
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
export const allWorkouts = () => store.memo('all-workouts', ['workouts'], () => store.all('workouts').filter((w) => w.status === 'done').sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.startedAt || '').localeCompare(a.startedAt || ''))));
export const activeWorkout = () => store.all('workouts').find((w) => w.status === 'active') || null;

export function categoriesIn(workout) {
  const cats = new Set();
  for (const s of setsOf(workout.id)) {
    if (!s.completed) continue;
    const e = exercise(s.exerciseId);
    if (e) cats.add(e.category);
  }
  return cats;
}

/** Facts a habit source can ask about a date. */
export function workoutFacts(date) {
  return store.memo(`facts:${date}`, ['workouts', 'workoutSets', 'exercises'], () => computeFacts(date));
}

function computeFacts(date) {
  const ws = workoutsOn(date);
  const facts = { any: ws.length > 0, strength: false, core: false, calves: false, cardio: false, progression: false };
  for (const w of ws) {
    if (w.kind === 'strength') facts.strength = true;
    if (w.kind === 'cardio') facts.cardio = true;
    if (w.progression === 'improved') facts.progression = true;
    const cats = categoriesIn(w);
    if (cats.has('core')) facts.core = true;
    if (cats.has('calves')) facts.calves = true;
    if (cats.has('cardio')) {
      const mins = setsOf(w.id).filter((s) => s.completed && exercise(s.exerciseId)?.category === 'cardio')
        .reduce((a, s) => a + (Number(s.minutes) || 0), 0);
      if (mins >= 20) facts.cardio = true;
    }
  }
  return facts;
}

/** Recent "hard" sessions: strength workouts with difficulty ≥ 4 or RPE ≥ 8 in the last n days. */
export function hardSessions(end = today(), days = 4) {
  const span = new Set(lastNDays(end, days));
  return store.all('workouts').filter((w) => w.status === 'done' && span.has(w.date)
    && (Number(w.difficulty) >= 4 || Number(w.rpe) >= 8)).length;
}
