// Insights that end in one tap (U8). Each one states what your logs show and carries one action
// that changes your plan (a routine, a habit, a training day, a target), with Undo. An insight
// you can't act on is never shown.
//
// Insights come from engines: { id, run(date) → [candidate] }. The rules below are the first
// engine; a later one (an on-device model, say) plugs in with the same shape via register().
// A candidate is { id, area, title, detail, weight, action: { label, apply() → undo, done } }.
import * as store from '../data/store.js';
import * as H from './habits.js';
import * as M from './metrics.js';
import * as F from './fitness.js';
import * as R from './routines.js';
import * as G from './goals.js';
import { dayScore } from './scoring.js';
import { graduationDue, graduate } from './habit-system.js';
import { accept } from './adapt.js';
import { saveReview } from './day.js';
import { today, addDays, diffDays, range, weekday, fmtDay, fmtHM, parseHM } from './dates.js';
import { num, pct, kgOut, weightUnit } from '../ui/format.js';

const QUIET_DAYS = 14;
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const plural = (d) => `${fmtDay(d)}s`;
const scoredDays = (end, n) => range(addDays(end, -(n - 1)), end)
  .filter((d) => d >= H.trackingStart() && !H.isOff(H.dayMode(d)))
  .map((d) => ({ d, r: dayScore(d).ratio })).filter((x) => x.r != null);

/* ---------- the rules engine ---------- */

/** The habit in a routine that's done least, and the smallest change that would help it. */
function easeHabit(h) {
  const p = (() => {
    const tiny = H.tinyOf(h);
    if (tiny?.label || tiny?.min != null) return { kind: 'shrink', habitId: h.id, tiny: true, weeks: 2, label: `Make ${h.name} tiny for two weeks` };
    if (H.isNumeric(h) && !h.source && h.type !== 'rating' && h.target > 0) {
      const step = h.step > 0 ? h.step : 1;
      const to = Math.max(step, Math.round((h.target * 0.6) / step) * step);
      if (to < h.target) return { kind: 'shrink', habitId: h.id, from: h.target, to, weeks: 2, label: `Lower ${h.name} to ${num(to)} for two weeks` };
    }
    return { kind: 'pause', habitId: h.id, label: `Pause ${h.name} for two weeks` };
  })();
  return { label: p.label, apply: () => accept(p), done: `${p.label.replace(/^(Make|Lower|Pause)/, (w) => ({ Make: 'Made', Lower: 'Lowered', Pause: 'Paused' })[w])}.` };
}

function weakRoutine(date) {
  const end = addDays(date, -1);
  const days = range(addDays(end, -13), end).filter((d) => d >= H.trackingStart() && !H.isOff(H.dayMode(d)));
  const rates = R.routines().filter((r) => !r.archived).map((r) => {
    const runs = days.filter((d) => R.activeOn(r, d)).map((d) => R.progress(r, d)).filter((p) => p.total);
    return { r, n: runs.length, rate: mean(runs.map((p) => p.done / p.total)), runs };
  }).filter((x) => x.n >= 7);
  if (rates.length < 2) return [];
  rates.sort((a, b) => a.rate - b.rate);
  const weak = rates[0], best = rates[rates.length - 1];
  if (weak.rate >= 0.7 || best.rate - weak.rate < 0.2) return [];
  // its least-done habit step, unless a smaller version is already running
  const steps = new Map();
  for (const p of weak.runs) for (const s of p.steps) if (s.kind === 'habit') {
    const e = steps.get(s.habit.id) || { h: s.habit, n: 0, done: 0 };
    e.n++; if (s.done) e.done++;
    steps.set(s.habit.id, e);
  }
  const target = [...steps.values()].filter((e) => e.n >= 5 && !(e.h.temp && date < e.h.temp.until) && H.stateOf(e.h, date) !== 'paused')
    .sort((a, b) => a.done / a.n - b.done / b.n)[0];
  if (!target || target.done / target.n > 0.6) return [];
  return [{ id: `routine-${weak.r.id}`, area: 'Routines', weight: (best.rate - weak.rate) * 2,
    title: `${weak.r.name} is your weakest routine`,
    detail: `${pct(weak.rate)} of its steps done over the last two weeks, against ${pct(best.rate)} for ${best.r.name}. ${target.h.name} is the step that slips most (${target.done} of ${target.n}).`,
    action: easeHabit(target.h) }];
}

function weakDay(date) {
  const list = scoredDays(addDays(date, -1), 28);
  const by = new Map();
  for (const x of list) { const w = weekday(x.d); by.set(w, [...(by.get(w) || []), x.r]); }
  const rows = [...by.entries()].filter(([, v]) => v.length >= 3).map(([w, v]) => ({ w, avg: mean(v), n: v.length }));
  if (rows.length < 5) return [];
  rows.sort((a, b) => a.avg - b.avg);
  const worst = rows[0];
  const others = mean(list.filter((x) => weekday(x.d) !== worst.w).map((x) => x.r));
  if (worst.avg >= 0.65 || others - worst.avg < 0.2) return [];
  let next = addDays(date, 1);
  while (weekday(next) !== worst.w) next = addDays(next, 1);
  if (H.dayMode(next) !== 'normal') return [];
  return [{ id: `day-${worst.w}`, area: 'Your week', weight: (others - worst.avg) * 2,
    title: `${plural(next)} are your hardest day`,
    detail: `${pct(worst.avg)} on average over the last four weeks, against ${pct(others)} on other days. A smaller plan that day keeps the thread.`,
    action: { label: `Plan next ${fmtDay(next)} as a Minimum day`, done: `Next ${fmtDay(next)} is a Minimum day.`,
      apply: () => { const before = store.get('dailyReviews', next) || null; saveReview(next, { mode: 'minimum' });
        return () => (before ? store.put('dailyReviews', before) : store.remove('dailyReviews', next)); } } }];
}

function sleepLink(date) {
  const t = M.targets();
  const min = t.sleepMinH ?? 7;
  const list = scoredDays(addDays(date, -1), 28).map((x) => ({ ...x, h: M.sleepHours(x.d) })).filter((x) => x.h != null);
  const short = list.filter((x) => x.h < min), full = list.filter((x) => x.h >= min);
  if (short.length < 3 || full.length < 3) return [];
  const a = mean(short.map((x) => x.r)), b = mean(full.map((x) => x.r));
  if (b - a < 0.15) return [];
  const h = H.habit('h-lights-out');
  if (!h || h.archived) return [];
  const bed = parseHM(store.profile()?.bedTime || '22:00');
  const at = fmtHM((bed - 30 + 1440) % 1440);
  if (h.reminder && parseHM(h.reminder) <= bed - 30) return [];
  return [{ id: 'sleep-link', area: 'Sleep', weight: (b - a) * 2,
    title: 'Short nights cost you the next day',
    detail: `Days after under ${min} h of sleep score ${pct(a)}, against ${pct(b)} after a full night (${short.length + full.length} nights).`,
    action: { label: `Remind me at ${at} to wind down`, done: `${h.name}: reminder at ${at}. Add it to your calendar from You › Reminders.`,
      apply: () => { const before = { ...h }; store.put('habits', { ...h, reminder: at }); return () => store.put('habits', before); } } }];
}

function trainingDays(date) {
  const plan = store.profile()?.plan || {};
  const end = addDays(date, -1);
  const days = range(addDays(end, -55), end).filter((d) => d >= H.trackingStart());
  const rows = [];
  for (let w = 1; w <= 7; w++) {
    const tpl = plan[w] ? F.template(plan[w]) : null;
    if (!tpl || tpl.kind !== 'strength') continue;
    const on = days.filter((d) => weekday(d) === w && !H.isOff(H.dayMode(d)));
    if (on.length < 4) continue;
    rows.push({ w, tpl, n: on.length, done: on.filter((d) => F.workoutsOn(d).length).length, sample: on[0] });
  }
  // Only for someone who logs training: a pattern needs sessions to show it.
  if (rows.reduce((a, r) => a + r.done, 0) < 6) return [];
  const weak = rows.filter((r) => r.done / r.n <= 0.34 && r.tpl.id !== 't-minimum').sort((a, b) => a.done / a.n - b.done / b.n)[0];
  if (!weak || !F.template('t-minimum')) return [];
  const strong = rows.filter((r) => r.done / r.n >= 0.75).map((r) => fmtDay(r.sample));
  return [{ id: `train-${weak.w}`, area: 'Training', weight: 1 - weak.done / weak.n,
    title: strong.length ? `You train most consistently on ${strong.length > 1 ? `${strong.slice(0, -1).join(', ')} and ${strong[strong.length - 1]}` : strong[0]}` : `${fmtDay(weak.sample)} sessions rarely happen`,
    detail: `${weak.tpl.name} on ${plural(weak.sample)} happened ${weak.done} of ${weak.n} weeks. A 20-minute session there is one you’ll do.`,
    action: { label: `Make ${fmtDay(weak.sample)} the 20-minute minimum`, done: `${fmtDay(weak.sample)} is now the 20-minute minimum.`,
      apply: () => { const before = store.profile().plan; store.setProfile({ plan: { ...before, [weak.w]: 't-minimum' } }); return () => store.setProfile({ plan: before }); } } }];
}

function autopilot(date) {
  return H.focusHabits(date).map((h) => ({ h, g: graduationDue(h, date) })).filter((x) => x.g).slice(0, 1).map(({ h, g }) => {
    const next = H.queue().find((q) => q.id !== h.id);
    return { id: `grad-${h.id}`, area: 'Habits', weight: 0.8,
      title: `${h.name} has become automatic`,
      detail: `Done on ${pct(g.ratio)} of ${H.runUnit(h) === 'day' ? 'days' : 'weeks'} for six weeks. Autopilot keeps it going and frees a focus slot${next ? ` for ${next.name}` : ''}.`,
      action: { label: 'Move it to autopilot', done: `${h.name} is on autopilot${next ? `; ${next.name} takes its slot` : ''}.`,
        apply: () => { const before = [h, next].filter(Boolean).map((x) => ({ ...x })); graduate(H.habit(h.id)); return () => store.batch(before.map((v) => ({ store: 'habits', value: v }))); } } };
  });
}

function weightStall(date) {
  const t = M.targets();
  const s = store.settings();
  const logged = range(addDays(date, -20), date).filter((d) => M.weight(d) != null).length;
  const now7 = M.weightAvg(date, 7), then7 = M.weightAvg(addDays(date, -14), 7);
  if (logged < 10 || now7 == null || then7 == null || now7 < then7 - 0.1) return [];
  const g = G.goals().find((x) => x.status !== 'done' && G.measureOf(x) === 'weight' && x.target != null);
  if (g && g.target >= now7) return [];
  if (!t.kcal || t.kcal - 150 < (t.kcalFloor ?? 1500)) return [];
  const to = t.kcal - 150;
  return [{ id: 'weight-stall', area: 'Body', weight: 1,
    title: 'Weight has been flat for two weeks',
    detail: `7-day average ${num(kgOut(now7), 1)} ${weightUnit()}, against ${num(kgOut(then7), 1)} ${weightUnit()} two weeks ago, with ${logged} weigh-ins. A small cut restarts it; a crash diet doesn’t.`,
    action: { label: `Lower the calorie target to ${num(to)} kcal`, done: `Calorie target is now ${num(to)} kcal.`,
      apply: () => { const before = s.targets; store.setSettings({ targets: { ...before, kcal: to, kcalMin: before.kcalMin != null ? before.kcalMin - 150 : before.kcalMin, kcalMax: before.kcalMax != null ? before.kcalMax - 150 : before.kcalMax } });
        return () => store.setSettings({ targets: before }); } } }];
}

/** Add a plain step to a routine (morning or evening), with an undo. */
function addStep(kind, label) {
  const r = R.routines().find((x) => x.kind === kind && !x.archived);
  if (!r || (r.steps || []).some((s) => (s.label || '').toLowerCase() === label.toLowerCase())) return null;
  return { routine: r, apply: () => { const before = { ...r }; store.put('routines', { ...r, steps: [...(r.steps || []), { id: store.uid(), label }] }); return () => store.put('routines', before); } };
}

function proteinGap(date) {
  const t = M.targets();
  const pr = M.averageOver(addDays(date, -1), 7, (d) => M.nutrition(d).protein);
  if (pr.n < 4 || pr.value >= (t.proteinHitG ?? 135)) return [];
  const step = addStep('morning', 'Protein at breakfast');
  if (!step) return [];
  return [{ id: 'protein-gap', area: 'Food', weight: ((t.proteinG ?? 150) - pr.value) / 40,
    title: `Protein is ${num((t.proteinG ?? 150) - pr.value)} g a day short`,
    detail: `${num(pr.value)} g a day over ${pr.n} logged days, against ${t.proteinG ?? 150} g. Protein early in the day is the easiest gap to close.`,
    action: { label: `Add “Protein at breakfast” to ${step.routine.name}`, done: `${step.routine.name} now includes protein at breakfast.`, apply: step.apply } }];
}

function stepsGap(date) {
  const st = M.averageOver(addDays(date, -1), 7, (d) => M.steps(d));
  const target = M.stepsTarget(date);
  if (st.n < 4 || st.value >= target * 0.8) return [];
  const step = addStep('evening', '20-minute walk');
  if (!step) return [];
  return [{ id: 'steps-gap', area: 'Movement', weight: (target - st.value) / target * 2,
    title: `Steps are ${num(target - st.value)} a day short`,
    detail: `${num(st.value)} a day over ${st.n} logged days, against ${num(target)}. A 20-minute walk adds about 2,000.`,
    action: { label: `Add a 20-minute walk to ${step.routine.name}`, done: `${step.routine.name} now includes a 20-minute walk.`, apply: step.apply } }];
}

/**
 * A habit mostly set aside because you forgot (13a): forgetting is a weak cue, so tie it to a routine
 * you already run (habit stacking), at the end of the one that fits its time of day.
 */
function forgotten(date) {
  const since = addDays(date, -27);
  const out = [];
  for (const h of H.activeHabits()) {
    if (R.inRoutine(h.id) || H.stateOf(h, date) === 'paused') continue;
    const logs = store.where('habitLogs', (l) => l.habitId === h.id && l.skip && l.reason && l.date >= since && l.date <= date);
    const forgot = logs.filter((l) => l.reason === 'forgot').length;
    if (forgot < 3 || forgot * 2 < logs.length) continue;
    const evening = (h.time && parseHM(h.time) >= parseHM('15:00')) || h.section === 'evening';
    const r = R.routines().find((x) => x.kind === (evening ? 'evening' : 'morning') && !x.archived);
    if (!r) continue;
    out.push({ id: `forgot-${h.id}`, area: 'Habits', weight: 0.9,
      title: `${h.name} slips because it’s forgotten`,
      detail: `You set it aside ${forgot} times in four weeks because you forgot. A cue you can’t miss beats trying harder: as a step of ${r.name}, it comes up right after something you already do.`,
      action: { label: `Add it to ${r.name}`, done: `${h.name} is now a step of ${r.name}.`,
        apply: () => { const before = { ...R.routine(r.id) }; R.append(r.id, h.id); return () => store.put('routines', before); } } });
  }
  return out.slice(0, 1);
}

/**
 * What helps you (13e): days with a habit against days it was due and skipped, on how the next day
 * went (plan done, mood, energy), over the last 60 days. Needs 5 days each way and a clear
 * difference, and says it's a pattern, not a cause. The one tap protects the habit: it stays on
 * Minimum days. Answers the brief's "what habits are correlated with better weeks?"
 */
export const HELPS = { days: 60, least: 5, plan: 0.12, scale: 1 };
export function helpsFor(h, date) {
  const end = addDays(date, -2); // the day after must be complete too
  const days = range(addDays(date, -(HELPS.days + 1)), end).filter((d) => d >= H.trackingStart() && !H.isOff(H.dayMode(d)) && H.dueOn(h, d));
  const yes = days.filter((d) => H.counts(h, d));
  const no = days.filter((d) => !H.counts(h, d));
  if (yes.length < HELPS.least || no.length < HELPS.least) return null;
  const next = (d) => addDays(d, 1);
  const measures = [
    { key: 'plan', what: 'of your plan done', get: (d) => dayScore(next(d)).ratio, min: HELPS.plan, fmt: pct },
    { key: 'energy', what: 'energy', get: (d) => M.mood(next(d))?.energy, min: HELPS.scale, fmt: (v) => `${num(v, 1)}/10` },
    { key: 'mood', what: 'mood', get: (d) => M.mood(next(d))?.mood, min: HELPS.scale, fmt: (v) => `${num(v, 1)}/10` },
  ];
  let best = null;
  for (const m of measures) {
    const a = yes.map(m.get).filter((v) => v != null), b = no.map(m.get).filter((v) => v != null);
    if (a.length < HELPS.least || b.length < HELPS.least) continue;
    const diff = mean(a) - mean(b);
    if (diff < m.min) continue;
    const score = diff / m.min;
    if (!best || score > best.score) best = { ...m, with: mean(a), without: mean(b), nWith: a.length, nWithout: b.length, score };
  }
  return best;
}

// Sixty days of patterns don't change with each tap, and comparing every habit takes a moment on a
// phone. So it's worked out once a day, a few habits at a time between other work (never one long
// task), and the screens showing insights refresh when it's ready (onHelps).
const found = { date: null, list: null, busy: null };
const ready = new Set();
export const onHelps = (fn) => { ready.add(fn); return () => ready.delete(fn); };
const candidates = (date) => H.activeHabits().filter((h) => !h.mvd && !H.isLimit(h) && H.stateOf(h, date) !== 'paused');

function computeHelps(date) {
  const list = candidates(date);
  if (typeof setTimeout === 'undefined' || typeof document === 'undefined') { found.date = date; found.list = list.map((h) => [h.id, helpsFor(h, date)]); return; }
  if (found.busy === date) return;
  found.busy = date;
  const out = [];
  let i = 0;
  const step = () => {
    if (found.busy !== date) return;
    const until = performance.now() + 8;
    while (i < list.length && performance.now() < until) { out.push([list[i].id, helpsFor(list[i], date)]); i++; }
    if (i < list.length) { setTimeout(step, 0); return; }
    found.date = date; found.list = out; found.busy = null;
    ready.forEach((fn) => fn());
  };
  setTimeout(step, 0);
}

function helps(date) {
  if (found.date !== date) computeHelps(date);
  if (found.date !== date) return [];
  const out = [];
  for (const [id, b] of found.list) {
    const h = H.habit(id);
    if (!b || !h || h.mvd || h.archived) continue;
    out.push({ id: `helps-${h.id}`, area: 'What helps you', weight: 0.7 + Math.min(0.6, b.score / 10),
      title: `The day after ${h.name} goes better`,
      detail: `Over the last ${HELPS.days} days, the day after ${h.name} you had ${b.fmt(b.with)} ${b.what}, against ${b.fmt(b.without)} after a day without it (${b.nWith} and ${b.nWithout} days). A pattern, not proof, but worth protecting.`,
      action: { label: `Keep ${h.name} on Minimum days`, done: `${h.name} now stays on Minimum days.`,
        apply: () => { const before = { ...H.habit(h.id) }; store.put('habits', { ...before, mvd: true }); return () => store.put('habits', before); } } });
  }
  return out.sort((a, b) => b.weight - a.weight).slice(0, 1);
}

export const rules = {
  id: 'rules',
  run: (date) => [weakRoutine, weakDay, sleepLink, trainingDays, autopilot, weightStall, proteinGap, stepsGap, forgotten, helps].flatMap((f) => f(date)),
};

/* ---------- the engine interface ---------- */

const engines = [rules];
export function register(engine) { if (!engines.some((e) => e.id === engine.id)) engines.push(engine); }

const record = () => store.get('meta', 'insights')?.items || {};
const quiet = (id, date) => { const r = record()[id]; return !!r && diffDays(date, r.on) < QUIET_DAYS; };
function mark(ins, outcome, date = today()) { store.put('meta', { id: 'insights', items: { ...record(), [ins.id]: { on: date, outcome, title: ins.title, label: ins.action.label } } }); }
function unmark(id) { const items = { ...record() }; delete items[id]; store.put('meta', { id: 'insights', items }); }

/** Insights worth showing on a date: acted on or set aside ones stay quiet for two weeks. */
// Writing in the journal, or anything else no rule reads, doesn't run the rules again.
const READS = [...new Set([...H.DATA_STORES.filter((s) => s !== 'journalEntries'), 'routines', 'routineRuns', 'dailyReviews', 'sleepEntries', 'moodEntries', 'weightEntries', 'nutritionLogs',
  'stepLogs', 'workouts', 'workoutSets', 'templates', 'goals', 'settings', 'profile', 'meta'])];
export function insights(date = today(), { limit = Infinity } = {}) {
  return store.memo(`insights:${date}`, READS, () => compute(date), `${found.date === date}:${engines.length}`).slice(0, limit);
}

function compute(date) {
  const out = [];
  for (const e of engines) {
    let list = [];
    try { list = e.run(date) || []; } catch (err) { console.warn(`insight engine ${e.id} failed`, err); }
    out.push(...list.filter((i) => i?.action?.apply && i.action.label && !quiet(i.id, date)));
  }
  return out.sort((a, b) => b.weight - a.weight);
}

/** Apply an insight's action. Returns an undo that reverses the change and brings the insight back. */
export function apply(ins, date = today()) {
  const undo = ins.action.apply();
  mark(ins, 'applied', date);
  return () => { undo?.(); unmark(ins.id); };
}

/** Set an insight aside for two weeks. */
export const dismiss = (ins, date = today()) => { mark(ins, 'dismissed', date); return () => unmark(ins.id); };

/** What was acted on or set aside, newest first: [{ id, on, outcome, title, label }]. */
export const history = () => Object.entries(record()).map(([id, r]) => ({ id, ...r })).sort((a, b) => (a.on < b.on ? 1 : -1));
