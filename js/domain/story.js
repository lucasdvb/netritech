// Progress as a story (A12): this week in one sentence, the score against the same point last week
// (the ghost that Phase 9 races), the few measures that drive a decision, and what's moving.
// Every measure carries a decision line, and a measure with no data isn't shown at all.
import * as store from '../data/store.js';
import * as M from './metrics.js';
import * as F from './fitness.js';
import * as G from './goals.js';
import { dayScore, rolling } from './scoring.js';
import { trackingStart, isOff } from './habits.js';
import { today, addDays, startOfWeek, endOfWeek, range, fmtDay, parseHM, fmtHM, durationHM } from './dates.js';
import { num, pct, kgOut, weightUnit } from '../ui/format.js';

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** A day's score as the week counts it: none before tracking, on days off, or for today before anything is done. */
function counted(d) {
  if (d < trackingStart() || d > today()) return null;
  const s = dayScore(d);
  if (s.ratio == null || isOff(s.mode) || (d === today() && s.done === 0)) return null;
  return s.ratio;
}

/* ---------- the ghost (G2): your past self at the same point of its week ---------- */

export const GHOSTS = [
  { id: 'four', label: 'A month ago', noun: 'a month ago' },
  { id: 'best', label: 'Your best week', noun: 'your best week' },
  { id: 'last', label: 'Last week', noun: 'last week' },
];
const weekScore = (from, upTo) => { const v = range(from, upTo).map(counted).filter((r) => r != null); return v.length ? { ratio: mean(v), days: v.length } : null; };

/**
 * The week to race: four weeks ago (the default), your best of the last twelve full weeks, or last
 * week; whichever is chosen in Settings, falling back to last week when there's no data for it.
 * Returns { id, label, noun, from, ratio } with ratio taken at the same point of that week.
 */
export function ghost(date = today(), kind = store.settings()?.ghost || 'four') {
  const from = startOfWeek(date);
  const point = (wk) => addDays(wk, Math.round((Date.parse(date) - Date.parse(from)) / 864e5));
  const pick = (id, wk) => { const sc = weekScore(wk, point(wk)); return sc ? { ...GHOSTS.find((g) => g.id === id), from: wk, ratio: sc.ratio } : null; };
  if (kind === 'best') {
    let best = null;
    for (let i = 1; i <= 12; i++) {
      const wk = addDays(from, -7 * i);
      const full = weekScore(wk, endOfWeek(wk));
      if (full && full.days >= 5 && (!best || full.ratio > best.full)) best = { wk, full: full.ratio };
    }
    const g = best && pick('best', best.wk);
    if (g) return g;
  }
  if (kind === 'four') { const g = pick('four', addDays(from, -28)); if (g) return g; }
  return pick('last', addDays(from, -7));
}

/** The week so far, and your past self at the same point (the ghost). */
export function week(date = today()) {
  const from = startOfWeek(date);
  const days = range(from, endOfWeek(date)).map((d) => {
    const s = d <= today() && d >= trackingStart() ? dayScore(d) : null;
    return { date: d, ratio: d <= date ? counted(d) : null, future: d > date, off: isOff(s?.mode), sealed: !!store.get('dailyReviews', d)?.sealedAt };
  });
  const sofar = days.filter((d) => !d.future);
  const ratio = mean(sofar.map((d) => d.ratio).filter((r) => r != null));
  const g = ghost(date);
  const ws = F.weekStats(date);
  const wNow = M.weightAvg(date, 7);
  const wThen = M.weightAvg(addDays(from, -1), 7);
  return {
    from, days, ratio, elapsed: sofar.length,
    ghost: g?.ratio ?? null, ghostOf: g,
    sealed: sofar.filter((d) => d.sealed).length,
    sessions: ws.sessions,
    weightChange: wNow != null && wThen != null && Math.abs(wNow - wThen) >= 0.1 ? wNow - wThen : null,
  };
}

/** This week in one sentence, from the strongest facts. */
export function sentence(w = week()) {
  if (w.ratio == null && w.elapsed <= 1) return 'A new week. The first thing you log sets its shape.';
  if (!w.ratio && !w.sessions) return 'Nothing done yet this week. One small thing today restarts it.';
  const diff = w.ghost == null ? null : w.ratio - w.ghost;
  const noun = w.ghostOf?.noun || 'last week';
  const lead = diff == null ? (w.elapsed <= 1 ? 'Day one' : 'So far') : diff >= 0.05 ? `Ahead of ${noun}` : diff <= -0.05 ? `Behind ${noun}` : `Level with ${noun}`;
  const parts = [`${pct(w.ratio)} of your plan done`];
  if (w.sessions) parts.push(`${w.sessions} training session${w.sessions === 1 ? '' : 's'}`);
  if (w.weightChange != null) parts.push(`weight ${w.weightChange < 0 ? 'down' : 'up'} ${num(Math.abs(kgOut(w.weightChange)), 1)} ${weightUnit()}`);
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  return `${lead}: ${list}.`;
}

/* ---------- measures that drive a decision ---------- */

/** Whether the owner's weight goal is a loss (most are); maintaining otherwise. */
function losing() {
  const g = G.goals().find((x) => x.status !== 'done' && G.measureOf(x) === 'weight' && x.target != null);
  const cur = M.weightAvg(today(), 7);
  return g ? (cur == null ? true : g.target < cur) : true;
}

function nextSession(date) {
  for (let d = addDays(date, 1); d <= endOfWeek(date); d = addDays(d, 1)) {
    const t = F.plannedTemplate(d);
    if (t && t.kind === 'strength') return { date: d, template: t };
  }
  return null;
}

/**
 * The measures Progress shows: consistency, weight, sleep, protein, steps and training. Each is
 * { id, label, value, decision, good, change, changeText, to }; change is the week-on-week move,
 * scaled so 1 means "clearly moved".
 */
export function measures(date = today()) {
  const t = M.targets();
  const p = store.profile() || {};
  const out = [];

  const r7 = rolling(date, 7), r0 = rolling(addDays(date, -7), 7);
  if (r7.ratio != null) {
    const r = r7.ratio;
    const pts = r0.ratio != null ? Math.round((r - r0.ratio) * 100) : null;
    out.push({ id: 'consistency', label: 'Consistency', value: pct(r), to: 'progress/trends/consistency',
      good: r >= 0.7,
      decision: r >= 0.85 ? 'Strong. Keep the system exactly as it is.'
        : r >= 0.7 ? 'Steady. Protect what you already do before adding anything.'
          : r >= 0.5 ? 'Slipping. Lean on tiny versions this week; they always count.'
            : 'Too heavy right now. Run Minimum days and add nothing new.',
      change: pts == null ? 0 : pts / 8, up: pts > 0,
      changeText: pts == null || !pts ? '' : `${pts > 0 ? 'up' : 'down'} from ${pct(r0.ratio)} last week` });
  }

  const avg7 = M.weightAvg(date, 7);
  if (avg7 != null) {
    const trend = M.weightTrend(date, 21);
    const lose = losing();
    const prev = M.weightAvg(addDays(date, -7), 7);
    const wk = prev != null ? avg7 - prev : null;
    const pace = trend ? -trend.perWeek / avg7 * 100 : null;
    const unit = weightUnit();
    const rate = trend ? `${num(Math.abs(kgOut(trend.perWeek)), 1)} ${unit} a week` : '';
    let decision, good;
    if (!trend) { decision = 'Weigh in most mornings; the trend needs about a week of entries.'; good = null; }
    else if (lose && pace > (t.lossMaxPct ?? 1)) { decision = `Dropping fast (${rate}). Add 150–200 kcal a day to protect muscle.`; good = false; }
    else if (lose && pace >= 0.25) { decision = `Down ${rate}, a healthy pace. Keep the plan as it is.`; good = true; }
    else if (lose) { decision = `${trend.perWeek > 0.05 ? `Up ${rate}` : 'Flat'} over three weeks. Trim 150 kcal or add 2,000 steps a day.`; good = false; }
    else { decision = Math.abs(trend.perWeek) < 0.2 ? 'Holding steady. Keep doing what you do.' : `Moving ${trend.perWeek < 0 ? 'down' : 'up'} ${rate}. Check portions if that isn’t the plan.`; good = Math.abs(trend.perWeek) < 0.2; }
    out.push({ id: 'weight', label: 'Weight', value: `${num(kgOut(avg7), 1)} ${unit}`, sub: '7-day average', to: 'progress/body/weight', decision, good,
      change: wk == null ? 0 : wk / 0.4, up: wk > 0, rightWay: wk == null ? null : lose ? wk < 0 : Math.abs(wk) < 0.2,
      changeText: wk == null || Math.abs(wk) < 0.05 ? '' : `${wk < 0 ? 'down' : 'up'} ${num(Math.abs(kgOut(wk)), 1)} ${unit} on last week` });
  }

  const sl = M.averageOver(date, 7, (d) => M.sleepHours(d));
  if (sl.n >= 3) {
    const prev = M.averageOver(addDays(date, -7), 7, (d) => M.sleepHours(d));
    const short = range(addDays(date, -6), date).filter((d) => M.sleepHours(d) != null && M.sleepHours(d) < (t.sleepMinH ?? 7)).length;
    const bed = fmtHM(parseHM(p.bedTime || '22:00'));
    const diff = prev.n >= 3 ? (sl.value - prev.value) * 60 : null;
    out.push({ id: 'sleep', label: 'Sleep', value: durationHM(sl.value * 60), sub: 'a night', to: 'progress/body/sleep',
      good: sl.value >= (t.sleepMinH ?? 7),
      decision: sl.value >= (t.sleepH ?? 7.5) ? `Enough sleep. Keep lights out at ${bed}.`
        : sl.value >= (t.sleepMinH ?? 7) ? `Close to target${short ? `, with ${short} short night${short === 1 ? '' : 's'}` : ''}. Keep lights out at ${bed}.`
          : `Under ${t.sleepMinH ?? 7} h on ${short} night${short === 1 ? '' : 's'}. Lights out by ${bed} this week.`,
      change: diff == null ? 0 : diff / 30, up: diff > 0,
      changeText: diff == null || Math.abs(diff) < 10 ? '' : `${diff > 0 ? 'up' : 'down'} ${Math.round(Math.abs(diff))} min a night on last week` });
  }

  const pr = M.averageOver(addDays(date, -1), 7, (d) => M.nutrition(d).protein);
  if (pr.n >= 3) {
    const prev = M.averageOver(addDays(date, -8), 7, (d) => M.nutrition(d).protein);
    const gap = (t.proteinG ?? 150) - pr.value;
    const diff = prev.n >= 3 ? pr.value - prev.value : null;
    out.push({ id: 'protein', label: 'Protein', value: `${num(pr.value)} g`, sub: 'a day', to: 'progress/body/nutrition',
      good: pr.value >= (t.proteinHitG ?? 135),
      decision: pr.value >= (t.proteinHitG ?? 135) ? 'On target. Keep protein in every meal.' : `${num(gap)} g a day short. One whey shake (25 g) closes most of it.`,
      change: diff == null ? 0 : diff / 15, up: diff > 0,
      changeText: diff == null || Math.abs(diff) < 3 ? '' : `${diff > 0 ? 'up' : 'down'} ${num(Math.abs(diff))} g a day on last week` });
  }

  const st = M.averageOver(addDays(date, -1), 7, (d) => M.steps(d));
  if (st.n >= 3) {
    const prev = M.averageOver(addDays(date, -8), 7, (d) => M.steps(d));
    const target = M.stepsTarget(date);
    const diff = prev.n >= 3 ? st.value - prev.value : null;
    out.push({ id: 'steps', label: 'Steps', value: num(st.value), sub: 'a day', to: 'progress/trends/steps',
      good: st.value >= target * 0.9,
      decision: st.value >= target * 0.9 ? `On target (${num(target)}). Keep the daily walk.` : `${num(target - st.value)} short of ${num(target)}. A 20-minute walk adds about 2,000.`,
      change: diff == null ? 0 : diff / 1500, up: diff > 0,
      changeText: diff == null || Math.abs(diff) < 300 ? '' : `${diff > 0 ? 'up' : 'down'} ${num(Math.abs(diff))} a day on last week` });
  }

  const from = startOfWeek(date);
  const planned = range(from, endOfWeek(date)).filter((d) => F.plannedTemplate(d)?.kind === 'strength');
  const ws = F.weekStats(date);
  const lastSoFar = F.trainingWorkouts().filter((w) => w.date >= addDays(from, -7) && w.date <= addDays(date, -7)).length;
  if (planned.length || ws.sessions || lastSoFar) {
    const due = planned.filter((d) => d <= date).length;
    const next = nextSession(date);
    const nextLine = next ? ` Next: ${next.template.name}, ${fmtDay(next.date)}.` : '';
    const diff = ws.sessions - lastSoFar;
    out.push({ id: 'training', label: 'Training', value: `${ws.sessions}${planned.length ? ` of ${planned.length}` : ''}`, sub: 'sessions this week', to: 'progress/trends/training',
      good: ws.sessions >= due,
      decision: ws.sessions >= due ? `On plan.${nextLine || ' Nothing else planned this week.'}` : `${due - ws.sessions} behind. Don’t make it up; do the next one as planned.${nextLine}`,
      change: diff / 1.5, up: diff > 0,
      changeText: diff ? `${Math.abs(diff)} ${diff > 0 ? 'more' : 'fewer'} than last week by ${fmtDay(date)}` : '' });
  }
  return out;
}

/** What's moving: the biggest week-on-week changes, each with what to do. */
export function moving(date = today(), list = measures(date)) {
  return list.filter((m) => m.changeText && Math.abs(m.change) >= 0.6)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 3)
    .map((m) => ({ ...m, rightWay: m.rightWay ?? m.up }));
}
