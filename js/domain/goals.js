// Goal progress: numbers for numeric goals, milestones for qualitative ones,
// consistency for habit-driven ones. Nothing is forced into a fake percentage.
import * as store from '../data/store.js';
import * as M from './metrics.js';
import { habit, consistency, counts } from './habits.js';
import { today, dayAt, addDays, diffDays } from './dates.js';

export const goals = () => store.all('goals').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

export function currentValue(g) {
  const m = measureOf(g);
  if (m === 'habitCount' || m === 'workouts' || m === 'pages') { const s = series(g); return s.length ? s[s.length - 1].value : 0; }
  if (g.metric === 'bodyFat' || m === 'bodyFat') return g.metric === 'bodyFat' ? M.bodyComposition().bodyFat : series(g).at(-1)?.value ?? null;
  if (g.metric === 'weight' || m === 'weight') return M.weightAvg(today(), 7);
  if (g.metric === 'waist') return M.latestMeasurement('waist')?.waist ?? null;
  if (g.metric === 'calves') return M.latestMeasurement('calves')?.calves ?? null;
  return g.current ?? null;
}

export function habitConsistency(g, days = 30) {
  const hs = (g.habitIds || []).map(habit).filter((h) => h && !h.archived);
  const rows = hs.map((h) => ({ habit: h, c: consistency(h, today(), days) }));
  const vals = rows.map((r) => r.c.ratio).filter((x) => x != null);
  return { rows, ratio: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null };
}

export function progress(g) {
  if (g.type === 'numeric') {
    const cur = currentValue(g);
    const m = measureOf(g);
    if (m === 'habitCount' || m === 'workouts' || m === 'pages') {
      const unit = m === 'habitCount' ? 'times' : m;
      return { kind: 'numeric', ratio: g.target ? Math.min(1, cur / g.target) : null, current: cur, label: `${fmt(cur)} of ${fmt(g.target)} ${unit}` };
    }
    if (cur == null || g.start == null || g.target == null || g.start === g.target) return { kind: 'numeric', ratio: null, current: cur };
    const r = (g.start - cur) / (g.start - g.target);
    return { kind: 'numeric', ratio: Math.max(0, Math.min(1, r)), current: cur, label: `${fmt(cur)}${g.unit} → ${fmt(g.target)}${g.unit}` };
  }
  if (g.type === 'milestones') {
    const ms = g.milestones || [];
    const done = ms.filter((m) => m.done).length;
    return { kind: 'milestones', ratio: ms.length ? done / ms.length : null, done, total: ms.length, label: `${done} of ${ms.length} milestones` };
  }
  const c = habitConsistency(g);
  return { kind: 'consistency', ratio: c.ratio, label: c.ratio == null ? 'Builds as you log' : `${Math.round(c.ratio * 100)}% consistent · 30 days` };
}

const fmt = (v) => (v == null ? '—' : Number.isInteger(v) ? String(v) : v.toFixed(1));

/* ---------- measures and projections (Phase 6) ---------- */

/** What a goal can be measured by. Cumulative ones count up from the goal's start. */
export const MEASURES = [
  { id: 'weight', label: 'Your weight', unit: 'kg', kind: 'level' },
  { id: 'bodyFat', label: 'Body fat', unit: '%', kind: 'level' },
  { id: 'habitCount', label: 'Times a habit is done', unit: 'times', kind: 'count' },
  { id: 'workouts', label: 'Workouts', unit: 'workouts', kind: 'count' },
  { id: 'pages', label: 'Pages read', unit: 'pages', kind: 'count' },
  { id: 'number', label: 'A number you update', unit: '', kind: 'level' },
];
export const measureOf = (g) => g.measure || (g.metric === 'bodyFat' ? 'bodyFat' : g.metric === 'weight' ? 'weight' : g.type === 'numeric' ? 'number' : null);
const startOfGoal = (g) => g.since || dayAt(g.createdAt) || today();

/** The goal's measure over time: [{ date, value }], oldest first. */
export function series(g, date = today()) {
  const m = measureOf(g);
  const byDate = (list, val) => list.filter((r) => r.date <= date).sort((a, b) => (a.date < b.date ? -1 : 1)).map((r) => ({ date: r.date, value: val(r) }));
  if (m === 'weight') return byDate(store.all('weightEntries'), (r) => r.kg);
  if (m === 'bodyFat') return byDate(store.all('bodyFatEstimates'), (r) => r.percent);
  if (m === 'number') return byDate([...(g.history || []), ...(g.current != null && !(g.history || []).length ? [{ date: dayAt(g.updatedAt) || date, value: g.current }] : [])], (r) => r.value);
  if (m === 'habitCount' || m === 'workouts' || m === 'pages') {
    const from = startOfGoal(g);
    const per = new Map();
    const add = (d, n) => { if (d >= from && d <= date) per.set(d, (per.get(d) || 0) + n); };
    if (m === 'habitCount') {
      const h = habit(g.habitId);
      if (h) for (const l of store.all('habitLogs')) if (l.habitId === h.id && counts(h, l.date)) add(l.date, 1);
    }
    if (m === 'workouts') for (const w of store.all('workouts')) if (w.status === 'done') add(w.date, 1);
    if (m === 'pages') for (const r of store.all('readingSessions')) if (r.pages) add(r.date, Number(r.pages) || 0);
    let total = 0;
    return [{ date: from, value: 0 }, ...[...per.keys()].sort().map((d) => ({ date: d, value: (total += per.get(d)) }))];
  }
  return [];
}

/** Least-squares slope in units per day, or null with fewer than two points. */
export function slope(points) {
  if (points.length < 2) return null;
  const x0 = points[0].date;
  const xs = points.map((p) => diffDays(p.date, x0));
  const ys = points.map((p) => p.value);
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const my = ys.reduce((a, b) => a + b, 0) / ys.length;
  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  return den ? num / den : null;
}

/**
 * Where a goal is heading: { status, current, target, eta, deadline, daysEarly, weeksBehind, rate, needs }.
 * status: done · on-pace · behind · flat (not moving towards it) · needs (what data it needs) · steady,
 * improving or slipping (consistency goals) · milestones.
 */
export function projection(g, date = today()) {
  const m = measureOf(g);
  if (g.type === 'milestones' && !m) {
    const ms = g.milestones || [];
    const done = ms.filter((x) => x.done).length;
    if (!ms.length) return { status: 'needs', needs: 'Add a milestone or two to see where this goal stands.' };
    return { status: done === ms.length ? 'done' : 'milestones', done, total: ms.length, deadline: g.deadline || null, daysLeft: g.deadline ? diffDays(g.deadline, date) : null };
  }
  if (!m) {
    // Consistency goals: the last two weeks against the two before.
    const rows = habitConsistencyBetween(g, date);
    if (rows.now == null) return { status: 'needs', needs: 'Link habits to this goal and log them for a week.' };
    const delta = rows.before == null ? 0 : rows.now - rows.before;
    return { status: delta > 0.05 ? 'improving' : delta < -0.05 ? 'slipping' : 'steady', now: rows.now, before: rows.before, delta };
  }
  const meta = MEASURES.find((x) => x.id === m);
  const pts = series(g, date);
  const current = pts.length ? pts[pts.length - 1].value : null;
  const target = g.target;
  if (target == null) return { status: 'needs', needs: 'Set a target to see a projection.' };
  if (meta.kind === 'count') {
    const from = startOfGoal(g);
    const days = Math.max(1, diffDays(date, from) + 1);
    if (current >= target) return { status: 'done', current, target };
    if (days < 7 || current === 0) return { status: 'needs', current, target, needs: m === 'pages' ? 'Log reading with pages for a week to see your pace.' : m === 'workouts' ? 'A week of logged workouts shows your pace.' : 'A week of logging shows your pace.' };
    const rate = current / days;
    const eta = addDays(date, daysUp((target - current) / rate));
    return paced({ current, target, rate, eta, deadline: g.deadline, date });
  }
  // Levels (weight, body fat, a number): the trend over the last six weeks.
  const recent = pts.filter((p) => p.date >= addDays(date, -42));
  const span = recent.length ? diffDays(recent[recent.length - 1].date, recent[0].date) : 0;
  const down = g.direction ? g.direction === 'down' : (g.start ?? current) > target;
  if (current != null && (down ? current <= target : current >= target)) return { status: 'done', current, target };
  if (recent.length < 3 || span < 7) {
    const what = m === 'weight' ? 'Log your weight 3 times over a week' : m === 'bodyFat' ? 'Two more body-fat estimates, a week or more apart,' : 'Update the number 3 times over a week';
    return { status: 'needs', current, target, needs: `${what} to see a projection.` };
  }
  const rate = slope(recent);
  if (!rate || (down ? rate >= 0 : rate <= 0)) return { status: 'flat', current, target, rate: rate || 0 };
  const eta = addDays(date, daysUp(Math.abs((target - current) / rate)));
  return paced({ current, target, rate, eta, deadline: g.deadline, date });
}

// Whole days, without float noise turning 30.000000001 into 31.
const daysUp = (x) => Math.ceil(x - 1e-6);

function paced({ current, target, rate, eta, deadline, date }) {
  if (!deadline) return { status: 'on-pace', current, target, rate, eta, deadline: null };
  const early = diffDays(deadline, eta);
  if (early >= 0) return { status: 'on-pace', current, target, rate, eta, deadline, daysEarly: early };
  return { status: 'behind', current, target, rate, eta, deadline, weeksBehind: Math.ceil(-early / 7), daysLeft: diffDays(deadline, date) };
}

function habitConsistencyBetween(g, date) {
  const hs = (g.habitIds || []).map(habit).filter((h) => h && !h.archived);
  const avg = (end) => { const v = hs.map((h) => consistency(h, end, 14).ratio).filter((x) => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  return { now: avg(date), before: avg(addDays(date, -14)) };
}
