// Derived numbers from raw entries. Pure reads over the in-memory store.
import * as store from '../data/store.js';
import { addDays, range, lastNDays, diffDays, today } from './dates.js';
import { avg, targets, nutrition, weight } from './metrics-core.js';
export * from './metrics-core.js';

const round = (n, d = 1) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d);

export function series(from, to, fn) {
  return range(from, to).map((date) => ({ date, value: fn(date) }));
}

export function averageOver(end, days, fn, { skipNull = true } = {}) {
  const vals = lastNDays(end, days).map(fn).filter((v) => (skipNull ? v != null && v > 0 : true));
  return { value: avg(vals), n: vals.length };
}

/* ---------- weight ---------- */
const weightEntries = () => store.all('weightEntries').sort((a, b) => (a.date < b.date ? -1 : 1));

export function weightAvg(date, days = 7) {
  const vals = [];
  for (let i = 0; i < days; i++) {
    const w = weight(addDays(date, -i));
    if (w != null) vals.push(w);
  }
  return vals.length ? avg(vals) : null;
}

/** Least-squares slope of the 7-day average over `days`, in kg per week. */
export function weightTrend(end = today(), days = 30) {
  const pts = [];
  for (const d of lastNDays(end, days)) {
    const a = weightAvg(d, 7);
    if (a != null && weight(d) != null) pts.push([diffDays(d, end), a]);
  }
  if (pts.length < 5) return null;
  const n = pts.length;
  const mx = avg(pts.map((p) => p[0]));
  const my = avg(pts.map((p) => p[1]));
  let num = 0, den = 0;
  for (const [x, y] of pts) { num += (x - mx) * (y - my); den += (x - mx) ** 2; }
  if (!den) return null;
  return { perWeek: (num / den) * 7, points: n, span: pts[n - 1][0] - pts[0][0] };
}

export function weightSummary(end = today()) {
  const entries = weightEntries();
  const first = entries[0] || null;
  const latest = [...entries].reverse().find((e) => e.date <= end) || null;
  const avg7 = weightAvg(end, 7);
  const avg14 = weightAvg(end, 14);
  const avg7WeekAgo = weightAvg(addDays(end, -7), 7);
  const avg7MonthAgo = weightAvg(addDays(end, -30), 7);
  const trend = weightTrend(end, 30);
  const startKg = store.profile()?.startWeightKg ?? first?.kg ?? null;
  return {
    first, latest, avg7: round(avg7, 2), avg14: round(avg14, 2),
    weekChange: avg7 != null && avg7WeekAgo != null ? avg7 - avg7WeekAgo : null,
    monthChange: avg7 != null && avg7MonthAgo != null ? avg7 - avg7MonthAgo : null,
    sinceStart: avg7 != null && startKg != null ? avg7 - startKg : null,
    startKg,
    trend,
    count: entries.length,
  };
}

/* ---------- body composition (estimates) ---------- */
export function navyBodyFat({ waist, neck }, heightCm) {
  if (!waist || !neck || !heightCm || waist <= neck) return null;
  const inch = 2.54;
  const bf = 86.01 * Math.log10((waist - neck) / inch) - 70.041 * Math.log10(heightCm / inch) + 36.76;
  return bf > 2 && bf < 60 ? bf : null;
}

export function latestMeasurement(field, before = today()) {
  return store.all('measurements')
    .filter((m) => m.date <= before && m[field] != null && m[field] !== '')
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null;
}

export function bodyComposition(date = today()) {
  const p = store.profile();
  const manual = store.all('bodyFatEstimates').filter((b) => b.date <= date).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const waist = latestMeasurement('waist', date);
  const neck = latestMeasurement('neck', date);
  const navy = waist && neck ? navyBodyFat({ waist: Number(waist.waist), neck: Number(neck.neck) }, p.heightCm) : null;
  let bf = null, source = null, sourceDate = null;
  if (manual) { bf = Number(manual.percent); source = manual.method || 'Your estimate'; sourceDate = manual.date; }
  else if (navy) { bf = navy; source = 'Tape estimate (US Navy formula)'; sourceDate = waist.date; }
  else { bf = p.startBodyFat; source = 'Starting estimate'; sourceDate = p.trackingStart; }
  const w = weightAvg(date, 7) ?? weight(date) ?? p.startWeightKg;
  const fat = w != null && bf != null ? (w * bf) / 100 : null;
  const lean = w != null && fat != null ? w - fat : null;
  const goalWeight = lean != null ? lean / (1 - p.goalBodyFat / 100) : null;
  return { bodyFat: bf, source, sourceDate, weight: w, fatMass: fat, leanMass: lean, navy, goalWeight, goalBodyFat: p.goalBodyFat };
}

export { round };

/* ---------- adaptive calories (estimate, never a prescription) ---------- */
export function adaptiveCalories(end = today(), days = 21) {
  const t = targets();
  const span = lastNDays(end, days);
  const kcalDays = span.filter((d) => nutrition(d).kcal > 600);
  const trend = weightTrend(end, days);
  const avgKcal = avg(kcalDays.map((d) => nutrition(d).kcal));
  const enough = kcalDays.length >= 10 && trend && trend.points >= 8;
  if (!enough) {
    return { ready: false, loggedDays: kcalDays.length, weighIns: trend?.points || 0, needDays: 10, needWeighIns: 8, avgKcal };
  }
  // ~7,700 kcal per kg of body-weight change; rough by design.
  const dailyBalance = (trend.perWeek * 7700) / 7;
  const maintenance = avgKcal - dailyBalance;
  const lossPerWeek = -trend.perWeek;
  let status = 'on-track';
  if (lossPerWeek < 0.15) status = 'stalled';
  else if (lossPerWeek > Math.max(t.lossMaxKg ?? 0.8, ((t.lossMaxPct ?? 1) / 100) * (weightAvg(end, 7) || 76))) status = 'fast';
  const ideal = maintenance - (0.5 * 7700) / 7;
  const suggested = Math.round(Math.max(t.kcalFloor ?? 1600, Math.min(maintenance - 250, ideal)) / 50) * 50;
  return { ready: true, avgKcal, maintenance, lossPerWeek, status, suggested, loggedDays: kcalDays.length, weighIns: trend.points };
}
