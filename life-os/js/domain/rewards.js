// Rewards you set yourself (G7), tied only to real counts or outcomes: workouts done, times you did
// a habit, days sealed, a season's score, a goal reached. There are no points and no currency: a
// reward unlocks when the thing itself has happened, counted from the day you set it. Once unlocked
// it stays unlocked, except that an Undo on the same day takes it back.
import * as store from '../data/store.js';
import * as H from './habits.js';
import * as F from './fitness.js';
import * as G from './goals.js';
import { completionDays } from './levels.js';
import { summaryOf } from './seasons.js';
import { today } from './dates.js';

export const KINDS = {
  workouts: { label: 'Workouts', unit: (n) => `${n} workout${n === 1 ? '' : 's'}`,
    count: (r, end) => F.allWorkouts().filter((w) => w.date >= r.since && w.date <= end).length },
  habit: { label: 'Times you do a habit', unit: (n, r) => `${H.habit(r.ref)?.name || 'Habit'} ${n} time${n === 1 ? '' : 's'}`,
    count: (r, end) => { const h = H.habit(r.ref); return h ? completionDays(h, end).filter((d) => d >= r.since).length : 0; } },
  sealed: { label: 'Days sealed', unit: (n) => `${n} day${n === 1 ? '' : 's'} sealed`,
    count: (r, end) => store.all('dailyReviews').filter((d) => d.sealedAt && d.date >= r.since && d.date <= end).length },
  season: { label: 'A season’s score', unit: (n) => `a season at ${n}%`,
    count: (r) => { const s = store.get('seasons', r.ref); return s?.summary?.score != null ? Math.round(s.summary.score * 100) : s ? Math.round((summaryOf(s).score || 0) * 100) : 0; },
    final: (r) => !!store.get('seasons', r.ref)?.summary },
  goal: { label: 'A goal reached', unit: () => 'the goal reached', target: 1,
    count: (r) => { const g = G.goals().find((x) => x.id === r.ref); if (!g) return 0; const p = G.progress(g); return g.status === 'done' || (p.kind !== 'consistency' && (p.ratio ?? 0) >= 1) ? 1 : 0; } },
};

export const rewards = () => store.all('rewards').sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

/** How close a reward is: { value, target, ratio, done }. */
export function progress(r, end = today()) {
  const k = KINDS[r.kind];
  const target = k?.target ?? r.target;
  const value = k ? k.count(r, end) : 0;
  const done = value >= target && (!k?.final || k.final(r));
  return { value: Math.min(value, target), target, ratio: target ? Math.min(1, value / target) : 0, done };
}

export const describe = (r) => `${KINDS[r.kind]?.unit(KINDS[r.kind]?.target ?? r.target, r) || ''}`;

export function create({ title, kind, ref = null, target }) {
  const k = KINDS[kind];
  if (!k || !title?.trim()) throw new Error('A reward needs a title and a condition');
  return store.put('rewards', { title: title.trim(), kind, ref, target: k.target ?? Math.max(1, Math.round(Number(target) || 1)), since: today(), status: 'active', createdAt: new Date().toISOString() });
}

/** Unlock the rewards whose condition has really happened. Returns the ones unlocked now. */
export function sync(date = today()) {
  const fresh = [];
  const ops = [];
  for (const r of rewards()) {
    const p = progress(r, date);
    if (r.status === 'active' && p.done) {
      const v = { ...r, status: 'unlocked', unlockedAt: date };
      ops.push({ store: 'rewards', value: v });
      fresh.push(v);
    } else if (r.status === 'unlocked' && !p.done && r.unlockedAt === date) {
      ops.push({ store: 'rewards', value: { ...r, status: 'active', unlockedAt: null } });
    }
  }
  if (ops.length) store.batch(ops);
  return fresh;
}

export const claim = (r) => store.put('rewards', { ...r, status: 'claimed', claimedAt: today() });
