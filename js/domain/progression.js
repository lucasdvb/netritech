// The progression layer's watcher. A moment after your data settles it marks real progress, once:
// a reward unlocked, a new personal record or a new mastery level (at most one moment per action,
// in that order), and closes seasons and pledges whose time is up. It never runs on the tap itself.
import * as store from '../data/store.js';
import * as L from './levels.js';
import * as Rec from './records.js';
import * as Rw from './rewards.js';
import * as S from './seasons.js';
import * as C from './commitments.js';
import { today } from './dates.js';

const WATCH = new Set(['habitLogs', 'workouts', 'workoutSets', 'stepLogs', 'sleepEntries', 'nutritionLogs', 'dailyReviews', 'waterLogs',
  'tasks', 'goals', 'readingSessions', 'learningSessions', 'meditationSessions', 'journalEntries', 'routineRuns']);

/** Bring everything up to date. Returns what's new: { rewards, records, levels, seasons }. */
export function run(date = today()) {
  const seasons = S.finalize(date);
  C.finalize(date);
  return { rewards: Rw.sync(date), records: Rec.sync(date), levels: L.sync(date), seasons };
}

/** The one moment worth showing for what's new, or null. */
export function moment(news) {
  const r = news.rewards[0];
  if (r) return { kind: 'reward', icon: 'trophy', text: `Unlocked: ${r.title}` };
  const rec = news.records[0];
  if (rec) return { kind: 'record', icon: 'medal', text: `New record · ${rec.label}: ${rec.text}` };
  const l = news.levels.sort((a, b) => b.at - a.at)[0];
  if (l) return { kind: 'level', icon: 'star', text: `${l.habit.name} · ${l.name}, ${l.at} time${l.at === 1 ? '' : 's'}` };
  const s = news.seasons[0];
  if (s) return { kind: 'season', icon: 'flag', text: `${s.name} is complete. Its summary is ready.` };
  return null;
}

let timer = 0;
const idle = (fn) => (window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 50));

/** The same work as run(), one step per idle moment, so it never holds up a scroll or a tap. */
function runInSteps(date, done) {
  const news = {};
  const steps = [() => { news.seasons = S.finalize(date); C.finalize(date); }, () => { news.rewards = Rw.sync(date); },
    () => { news.records = Rec.sync(date); }, () => { news.levels = L.sync(date); }];
  const next = (i) => (i < steps.length ? idle(() => { steps[i](); next(i + 1); }) : done(news));
  next(0);
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
