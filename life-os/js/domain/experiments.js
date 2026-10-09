// Experiments (13e): "try it for 7, 14 or 21 days". A habit (one you have, or a new one), and up
// to two things to watch. At the end the same number of days before and during are compared, and
// you keep the habit or drop it. One experiment at a time, so the comparison means something.
import * as store from '../data/store.js';
import * as H from './habits.js';
import * as M from './metrics-core.js';
import { dayScore } from './scoring.js';
import { newHabit } from './habit-system.js';
import { today, addDays, range, diffDays } from './dates.js';

export const LENGTHS = [7, 14, 21];
/** What can be watched: each a daily value (null when not logged), and how much a change matters. */
export const METRICS = {
  sleep: { label: 'Sleep', get: M.sleepHours, unit: 'h', digits: 1, notable: 0.3, better: 1 },
  mood: { label: 'Mood', get: (d) => M.mood(d)?.mood ?? null, unit: '/10', digits: 1, notable: 0.5, better: 1 },
  energy: { label: 'Energy', get: (d) => M.mood(d)?.energy ?? null, unit: '/10', digits: 1, notable: 0.5, better: 1 },
  plan: { label: 'Plan done', get: (d) => dayScore(d).ratio ?? null, unit: '%', pct: true, notable: 0.08, better: 1 },
  weight: { label: 'Weight', get: M.weight, unit: 'kg', digits: 1, notable: 0.3, better: 0 },
  steps: { label: 'Steps', get: M.steps, unit: '', digits: 0, notable: 800, better: 1 },
};

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
export const all = () => store.all('experiments').sort((a, b) => (a.start < b.start ? 1 : -1));
/** The experiment under way (started, not yet kept or dropped), if any. */
export const current = () => all().find((e) => e.status === 'running') || null;
export const endOf = (e) => addDays(e.start, e.days - 1);

/** Start one: { habitId } or { name } for a new habit, for `days`, watching up to two metrics. */
export function start({ habitId = null, name = '', days = 14, watch = [] }, date = today()) {
  if (current()) throw new Error('One experiment at a time: finish the current one first.');
  let created = false;
  let id = habitId;
  if (!id) {
    const title = name.trim();
    if (!title) throw new Error('Choose a habit, or name a new one.');
    const h = store.put('habits', newHabit({ name: title, startDate: date }));
    id = h.id;
    created = true;
  }
  return store.put('experiments', {
    habitId: id, created, days: LENGTHS.includes(days) ? days : 14, watch: watch.filter((k) => METRICS[k]).slice(0, 2),
    start: date, status: 'running',
  });
}

/** How it's going or how it went: adherence and, for each watched value, before against during. */
export function result(e, date = today()) {
  const h = H.habit(e.habitId);
  const end = endOf(e);
  const last = date < end ? addDays(date, -1) : end;
  const during = last >= e.start ? range(e.start, last) : [];
  const before = range(addDays(e.start, -e.days), addDays(e.start, -1));
  const due = h ? during.filter((d) => H.dueOn(h, d)) : [];
  return {
    habit: h,
    day: Math.min(e.days, Math.max(1, diffDays(date, e.start) + 1)),
    ended: date > end,
    left: Math.max(0, diffDays(end, date) + 1),
    done: h ? due.filter((d) => H.counts(h, d)).length : 0,
    due: due.length,
    metrics: e.watch.map((k) => {
      const m = METRICS[k];
      const b = before.map(m.get).filter((v) => v != null);
      const a = during.map(m.get).filter((v) => v != null);
      const vb = mean(b), va = mean(a);
      const diff = vb != null && va != null ? va - vb : null;
      return { key: k, label: m.label, before: vb, during: va, nBefore: b.length, nDuring: a.length, diff,
        verdict: diff == null || a.length < 3 || b.length < 3 ? 'unclear' : Math.abs(diff) < m.notable ? 'same' : (diff > 0) === !!m.better ? 'better' : 'worse' };
    }),
  };
}

/** End it: keep the habit, or drop it (a habit made for the experiment is archived; yours stays). */
export function finish(e, keep) {
  const before = { exp: { ...e }, habit: H.habit(e.habitId) ? { ...H.habit(e.habitId) } : null };
  store.put('experiments', { ...e, status: keep ? 'kept' : 'dropped', endedAt: new Date().toISOString() });
  if (!keep && e.created && before.habit) store.put('habits', { ...before.habit, archived: true });
  return () => { store.put('experiments', before.exp); if (before.habit) store.put('habits', before.habit); };
}

/** Stop early: it's gone, the habit stays as it is. */
export function cancel(e) {
  store.remove('experiments', e.id);
}

/** A value for display: "7.4 h", "82%", "8,200". */
export function fmt(key, v) {
  const m = METRICS[key];
  if (v == null) return '—';
  if (m.pct) return `${Math.round(v * 100)}%`;
  const n = Number(v.toFixed(m.digits)).toLocaleString('en-GB', { maximumFractionDigits: m.digits });
  return m.unit ? `${n}${m.unit.startsWith('/') ? '' : ' '}${m.unit}` : n;
}
