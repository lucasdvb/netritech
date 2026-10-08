// The progression layer's watcher. A moment after your data settles it marks real progress, once:
// a reward unlocked, a new personal record or a new mastery level (at most one moment per action,
// in that order), and closes seasons and pledges whose time is up. It never runs on the tap itself.
import * as store from '../data/store.js';
import * as L from './levels.js';
import * as Rec from './records.js';
import * as Rw from './rewards.js';
import * as S from './seasons.js';
import * as C from './commitments.js';
import * as H from './habits.js';
import { planHabits } from './scoring.js';
import { today } from './dates.js';

const WATCH = new Set(['habitLogs', 'workouts', 'workoutSets', 'stepLogs', 'sleepEntries', 'nutritionLogs', 'dailyReviews', 'waterLogs',
  'tasks', 'goals', 'readingSessions', 'learningSessions', 'meditationSessions', 'journalEntries', 'routineRuns']);

/**
 * The last of your three done today: true the first time all of today's focus habits count
 * (once a day, and only on a normal or rest day).
 */
export function focusDone(date = today()) {
  if (store.get('meta', 'focusMoment')?.on === date || !['normal', 'rest'].includes(H.dayMode(date))) return false;
  const focus = planHabits(date).filter((h) => H.stateOf(h, date) === 'focus');
  if (!focus.length || !focus.every((h) => H.counts(h, date))) return false;
  store.put('meta', { id: 'focusMoment', on: date });
  return true;
}

/** Bring everything up to date. Returns what's new: { rewards, records, levels, seasons, focus }. */
export function run(date = today()) {
  const seasons = S.finalize(date);
  C.finalize(date);
  return { rewards: Rw.sync(date), records: Rec.sync(date), levels: L.sync(date), seasons, focus: focusDone(date) };
}

/** The one moment worth showing for what's new, or null (at most one per action). */
export function moment(news) {
  const r = news.rewards[0];
  if (r) return { kind: 'reward', title: r.title, text: `Unlocked: ${r.title}` };
  const rec = news.records[0];
  if (rec) return { kind: 'record', label: rec.label, value: rec.text, text: `New record · ${rec.label}: ${rec.text}` };
  const l = news.levels.sort((a, b) => b.at - a.at)[0];
  if (l) return { kind: 'level', habitId: l.habitId, name: l.habit.name, level: l.level, levelName: l.name, at: l.at, text: `${l.habit.name} · ${l.name}, ${l.at} time${l.at === 1 ? '' : 's'}` };
  if (news.focus) return { kind: 'focus', text: 'Your three are done' };
  const s = news.seasons[0];
  if (s) return { kind: 'season', id: s.id, name: s.name, text: `${s.name} is complete. Its summary is ready.` };
  return null;
}

let timer = 0;
let runId = 0;
const SLICE_MS = 8;
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 50));

/**
 * The same work as run(), in small steps (a habit at a time) taken in slices of about 8 ms, so it
 * never holds up a scroll or a tap. A newer run replaces one still in progress.
 */
function runInSteps(date, done) {
  const id = ++runId;
  const news = {};
  const steps = [
    () => { news.seasons = S.finalize(date); C.finalize(date); },
    () => { news.rewards = Rw.sync(date); },
    ...Rec.seriesSteps(date), () => { news.records = Rec.sync(date); },
    ...L.syncSteps(date), () => { news.levels = L.sync(date); },
    () => { news.focus = focusDone(date); },
  ];
  let i = 0;
  const slice = () => {
    if (id !== runId) return;
    const t0 = performance.now();
    do steps[i++](); while (i < steps.length && performance.now() - t0 < SLICE_MS);
    if (i < steps.length) setTimeout(slice); else done(news);
  };
  idle(slice);
}

/** Watch the data and call `show` with each moment. */
export function start(show) {
  const go = () => runInSteps(today(), (news) => { const m = moment(news); if (m) show(m); });
  store.subscribe((e) => {
    if (e.type !== 'change' || ![...e.stores].some((s) => WATCH.has(s))) return;
    clearTimeout(timer);
    timer = setTimeout(() => idle(go), 1200);
  });
  idle(go);
}
