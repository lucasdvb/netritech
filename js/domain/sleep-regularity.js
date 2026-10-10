// Sleep regularity: how much your bedtime and wake time move from night to night, and a guard on
// your day plans so they don't pull your wake time around by more than an hour. Regular timing
// matters on its own, beyond hours slept: irregular sleepers have later, weaker body clocks
// (Phillips et al. 2017), and regularity predicts health outcomes more strongly than duration
// (Windred et al. 2024, UK Biobank). Waking much later on some days than others works like
// crossing time zones every week ("social jetlag", Wittmann et al. 2006).
import * as store from '../data/store.js';
import { today, addDays, parseHM, fmtHM, lastNDays } from './dates.js';
import { on as planOn } from './day-plans-core.js';

const NOON = 12 * 60;
/** Minutes on a clock that runs from noon to noon, so 23:30 and 00:30 are an hour apart. */
const night = (hm) => { const m = parseHM(hm); return m == null ? null : (m - NOON + 1440) % 1440; };
const day = (hm) => parseHM(hm);

function spread(values) {
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length);
}
const meanOf = (values) => values.reduce((a, b) => a + b, 0) / values.length;

/**
 * Your last `days` nights: { nights, wake: { spread, mean }, bed: { spread, mean }, rating, line }
 * or null with fewer than five nights that have both times.
 */
export function regularity(end = today(), days = 14) {
  const nights = lastNDays(end, days).map((d) => store.get('sleepEntries', d)).filter((s) => s?.wake && s?.bedtime);
  if (nights.length < 5) return null;
  const wakes = nights.map((s) => day(s.wake)).filter((v) => v != null);
  const beds = nights.map((s) => night(s.bedtime)).filter((v) => v != null);
  const w = spread(wakes);
  const b = spread(beds);
  const worst = Math.max(w ?? 0, b ?? 0);
  const rating = worst <= 30 ? 'steady' : worst <= 60 ? 'variable' : 'irregular';
  const wakeMean = fmtHM(Math.round(meanOf(wakes)));
  const bedMean = fmtHM(Math.round(meanOf(beds) + NOON));
  const line = rating === 'steady' ? `Steady: up around ${wakeMean} and in bed around ${bedMean}, within half an hour most nights.`
    : rating === 'variable' ? `Variable: your ${(b ?? 0) > (w ?? 0) ? 'bedtime' : 'wake time'} moves by about ${Math.round(worst)} minutes. Within 30 minutes is the aim.`
      : `Irregular: your ${(b ?? 0) > (w ?? 0) ? 'bedtime' : 'wake time'} moves by over an hour. A fixed wake time, every day, is the quickest fix.`;
  return { nights: nights.length, wake: { spread: w, mean: wakeMean }, bed: { spread: b, mean: bedMean }, rating, line };
}

/**
 * Your day plans over the coming week: when their wake times are more than an hour apart,
 * { earliest, latest, gap, line }; otherwise null.
 */
export function planGuard(from = today()) {
  const wakes = [];
  for (let i = 0; i < 7; i++) {
    const o = planOn(addDays(from, i));
    const t = o.profile?.wakeTime;
    if (t) wakes.push({ t, m: parseHM(t), name: o.name });
  }
  if (wakes.length < 2) return null;
  const lo = wakes.reduce((a, b) => (b.m < a.m ? b : a));
  const hi = wakes.reduce((a, b) => (b.m > a.m ? b : a));
  const gap = hi.m - lo.m;
  if (gap <= 60) return null;
  const h = Math.floor(gap / 60);
  const m = gap % 60;
  return { earliest: lo, latest: hi, gap,
    line: `Your days wake you between ${lo.t} (${lo.name}) and ${hi.t} (${hi.name}), ${h ? `${h} h` : ''}${m ? ` ${m} min` : ''} apart. More than an hour’s difference works like crossing time zones each week; keep wake times within an hour where you can.` };
}
