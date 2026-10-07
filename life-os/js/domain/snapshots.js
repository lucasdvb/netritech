// Day snapshots: one compact summary per day, built from everything logged that day.
// Progress, insights, the ghost, the year artwork and any future AI read these instead of
// walking every log again. Today is always computed live; finished days are kept in the
// daySnapshots store and rebuilt in the background, in small slices, when their data changes.
import * as store from '../data/store.js';
import { today, range, addDays } from './dates.js';
import { dayScore } from './scoring.js';
import { trackingStart } from './habits.js';
import { workoutsOn } from './fitness.js';
import * as M from './metrics.js';
import { doneDay } from './tasks.js';

export const SNAPSHOT_VERSION = 1;

// Changes to these reshape every day's score, so every cached day is rebuilt.
const RESHAPE_ALL = new Set(['habits', 'settings', 'profile']);
const SLICE_MS = 8;

export function buildSnapshot(date) {
  const score = dayScore(date);
  const food = M.nutrition(date);
  const mood = M.mood(date);
  const review = M.review(date);
  return {
    id: date,
    date,
    v: SNAPSHOT_VERSION,
    mode: score.mode,
    planned: score.total,
    done: score.done,
    score: score.ratio,
    sleepHours: M.sleepHours(date),
    weight: M.weight(date),
    weight7: M.weightAvg(date),
    steps: M.steps(date),
    waterMl: M.waterMl(date),
    protein: food.count ? food.protein : null,
    kcal: food.count ? food.kcal : null,
    workouts: workoutsOn(date).length,
    mood: mood?.mood ?? null,
    energy: mood?.energy ?? null,
    journal: M.journalCount(date),
    tasksDone: store.where('tasks', (t) => t.done && doneDay(t) === date).length,
    sealed: !!review?.sealedAt,
  };
}

// Cached summaries carry the generation they were built in. Changes that reshape every
// day (habits, settings, profile) start a new generation; a change to one past day deletes
// that day's summary. Both are stored, so nothing stale survives a reload.
const gen = () => store.get('meta', 'snapshots')?.gen || 0;
let timer = null;
let started = false;

const fresh = (date) => {
  const s = store.get('daySnapshots', date);
  return s && s.v === SNAPSHOT_VERSION && s.gen === gen() ? s : null;
};

/** The summary of one day: cached for finished days, live for today. */
export const snapshot = (date) => (date >= today() ? buildSnapshot(date) : fresh(date) || buildSnapshot(date));

export const snapshots = (from, to) => range(from, to).map(snapshot);

/** Past days whose cached summary is missing or outdated. */
function outdated() {
  const end = addDays(today(), -1);
  const start = trackingStart();
  if (start > end) return [];
  return range(start, end).filter((d) => !fresh(d));
}

/** Rebuild and save outdated summaries. With a time budget it may stop early; returns true when done. */
export function rebuild(budgetMs = Infinity) {
  const t0 = performance.now();
  const g = gen();
  const ops = [];
  const todo = outdated();
  let i = 0;
  for (; i < todo.length && (i === 0 || performance.now() - t0 <= budgetMs); i++) { // at least one per slice
    ops.push({ store: 'daySnapshots', value: { ...buildSnapshot(todo[i]), gen: g } });
  }
  if (ops.length) store.batch(ops);
  return i >= todo.length;
}

/** Mark summaries out of date after a change (called from the store subscription). */
export function invalidate({ stores, dates }) {
  const ops = [];
  if ([...stores].some((s) => RESHAPE_ALL.has(s))) {
    ops.push({ store: 'meta', value: { ...(store.get('meta', 'snapshots') || { id: 'snapshots' }), gen: gen() + 1 } });
  }
  const t = today();
  for (const d of dates) if (d < t && store.has('daySnapshots', d)) ops.push({ store: 'daySnapshots', delete: d });
  if (ops.length) store.batch(ops);
  return ops.length > 0;
}

function schedule() {
  if (timer) return;
  timer = setTimeout(function step() {
    timer = null;
    if (!rebuild(SLICE_MS)) timer = setTimeout(step, 50);
  }, 1500);
}

/** Keep summaries current in the background. Safe to call more than once. */
export function start() {
  if (started) return;
  started = true;
  store.subscribe((ev) => {
    if (ev.type !== 'change' || [...ev.stores].every((s) => s === 'daySnapshots' || s === 'meta')) return;
    if (invalidate(ev)) schedule();
  });
  schedule();
}
