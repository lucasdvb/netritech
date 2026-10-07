// Goal progress: numbers for numeric goals, milestones for qualitative ones,
// consistency for habit-driven ones. Nothing is forced into a fake percentage.
import * as store from '../data/store.js';
import * as M from './metrics.js';
import { habit, consistency } from './habits.js';
import { today } from './dates.js';

export const goals = () => store.all('goals').sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

export function currentValue(g) {
  if (g.metric === 'bodyFat') return M.bodyComposition().bodyFat;
  if (g.metric === 'weight') return M.weightAvg(today(), 7);
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
