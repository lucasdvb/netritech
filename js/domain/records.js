// Personal records (G3), found in your own data: the heaviest lift (or most reps, or longest hold)
// per exercise, your best protein week, your longest run on a habit, your most focus blocks in a
// week, your earliest average wake time over a week and your most steps in a day. A value is a
// record only when it beats at least three earlier data points, so first entries never trigger one.
// The shelf is worked out from the data each time, so an edited or deleted entry is reflected
// straight away; the `records` store only remembers which records have already been marked.
import * as store from '../data/store.js';
import * as M from './metrics.js';
import * as F from './fitness.js';
import * as H from './habits.js';
import { stretches, settled } from './history.js';
import { today, addDays, diffDays, range, startOfWeek, endOfWeek, startOfMonth, parseHM, fmtHM } from './dates.js';
import { num, kgOut, weightUnit } from '../ui/format.js';

export const MIN_PRIOR = 3;
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Complete weeks (Monday to Sunday) that ended before `end`, oldest first. */
function weeks(from, end) {
  const out = [];
  for (let w = startOfWeek(from); endOfWeek(w) < end; w = addDays(w, 7)) out.push(w);
  return out;
}

function lifts(_end) {
  const by = new Map();
  for (const w of F.allWorkouts()) {
    for (const s of F.setsOf(w.id)) {
      if (!s.completed || s.warmup) continue;
      const e = F.exercise(s.exerciseId);
      if (!e || e.metric === 'minutes') continue;
      if (!by.has(e.id)) by.set(e.id, { e, days: new Map() });
      const d = by.get(e.id).days;
      const cur = d.get(w.date) || { load: 0, reps: 0, seconds: 0 };
      d.set(w.date, { load: Math.max(cur.load, Number(s.load) || 0), reps: Math.max(cur.reps, Number(s.reps) || 0), seconds: Math.max(cur.seconds, Number(s.seconds) || 0) });
    }
  }
  const out = [];
  for (const { e, days } of by.values()) {
    const pts = [...days.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    if (e.metric === 'time') out.push({ id: `hold:${e.id}`, label: `${e.name}: longest hold`, unit: 's', fmt: (v) => `${num(v)} s`, points: pts.filter(([, v]) => v.seconds).map(([date, v]) => ({ date, value: v.seconds })) });
    else if (pts.some(([, v]) => v.load > 0)) out.push({ id: `lift:${e.id}`, label: `${e.name}: heaviest`, fmt: (v) => { const x = Math.round(kgOut(v) * 10) / 10; return `${num(x, x % 1 ? 1 : 0)} ${weightUnit()}`; }, points: pts.filter(([, v]) => v.load > 0).map(([date, v]) => ({ date, value: v.load })) });
    else out.push({ id: `reps:${e.id}`, label: `${e.name}: most reps in a set`, fmt: (v) => `${num(v)} reps`, points: pts.filter(([, v]) => v.reps).map(([date, v]) => ({ date, value: v.reps })) });
  }
  return out;
}

function proteinWeeks(end) {
  const first = store.all('nutritionLogs').reduce((a, r) => (!a || r.date < a ? r.date : a), null);
  if (!first) return [];
  const points = weeks(first, end).map((w) => {
    const vals = range(w, endOfWeek(w)).map((d) => M.nutrition(d).protein).filter((p) => p > 0);
    return vals.length >= 5 ? { date: endOfWeek(w), value: Math.round(mean(vals)) } : null;
  }).filter(Boolean);
  return [{ id: 'protein-week', label: 'Best protein week', fmt: (v) => `${num(v)} g a day`, points }];
}

function focusWeeks(end) {
  const days = store.all('dailyReviews').filter((r) => r.deepWork > 0);
  if (!days.length) return [];
  const first = days.reduce((a, r) => (r.date < a ? r.date : a), days[0].date);
  const points = weeks(first, end).map((w) => {
    const n = range(w, endOfWeek(w)).reduce((a, d) => a + (store.get('dailyReviews', d)?.deepWork || 0), 0);
    return n ? { date: endOfWeek(w), value: n } : null;
  }).filter(Boolean);
  return [{ id: 'focus-week', label: 'Most focus blocks in a week', fmt: (v) => `${num(v)} blocks`, points }];
}

function wakeWeeks(end) {
  const entries = store.all('sleepEntries').filter((s) => parseHM(s.wake) != null);
  if (!entries.length) return [];
  const first = entries.reduce((a, s) => (s.date < a ? s.date : a), entries[0].date);
  const points = weeks(first, end).map((w) => {
    const vals = range(w, endOfWeek(w)).map((d) => parseHM(store.get('sleepEntries', d)?.wake)).filter((m) => m != null);
    return vals.length >= 5 ? { date: endOfWeek(w), value: Math.round(mean(vals)) } : null;
  }).filter(Boolean);
  return [{ id: 'wake-week', label: 'Earliest week of wake-ups', lower: true, fmt: (v) => `${fmtHM(v)} on average`, points }];
}

function stepDays(end) {
  const points = store.all('stepLogs').filter((s) => s.steps > 0 && s.date <= end).sort((a, b) => (a.date < b.date ? -1 : 1)).map((s) => ({ date: s.date, value: s.steps }));
  return points.length ? [{ id: 'steps-day', label: 'Most steps in a day', fmt: (v) => num(v), points }] : [];
}

/** Runs through a list of periods, carrying on from `from`. */
function foldRuns(periods, from) {
  let { run, misses, last } = from;
  const points = [...from.points];
  for (const p of periods) {
    if (p.met === null) continue;
    if (p.met) { run = misses >= 2 ? 1 : run + 1; misses = 0; last = p.key; }
    else { misses++; if (misses === 2 && run) { points.push({ date: last, value: run }); run = 0; } }
  }
  return { run, misses, last, points };
}
const NO_RUNS = { run: 0, misses: 0, last: null, points: [] };

/** Where the period holding `end` starts: everything before it is settled. */
function periodStart(h, end) {
  const s = h.schedule || {};
  if (s.kind === 'perWeek') return startOfWeek(end);
  if (s.kind === 'perMonth') return startOfMonth(end);
  if (s.kind === 'interval') { const every = s.every || 7; const start = H.startOf(h); return addDays(start, Math.floor(diffDays(end, start) / every) * every); }
  return end;
}

// The settled periods (before the one still open) by stretch, then the open one as it stands.
const pastStretches = (h, end) => { const start = H.startOf(h), cut = periodStart(h, end); return cut > start ? stretches(h, start, addDays(cut, -1)) : []; };
const pastPeriods = (h, ab) => settled('periods', h, ab, () => H.periodsOf(h, ab[0], ab[1]));

/** A habit's runs ("never miss twice"), as data points: a run's length on the day it ended or now. */
function habitRuns(h, end) {
  const past = pastStretches(h, end).reduce((state, ab) => foldRuns(pastPeriods(h, ab), state), NO_RUNS);
  const start = H.startOf(h), cut = periodStart(h, end);
  const { run, last, points } = foldRuns(H.periodsOf(h, cut > start ? cut : start, end), past);
  if (run) points.push({ date: last, value: run, ongoing: true });
  const unit = H.runUnit(h) === 'day' ? 'days' : H.runUnit(h) === 'week' ? 'weeks' : 'times';
  return points.length ? [{ id: `run:${h.id}`, label: `${h.name}: longest run`, fmt: (v) => `${num(v)} ${unit}`, points }] : [];
}

// Each part is cached on its own, against only the data it reads, so the background watcher works
// out one at a time and only what a change can affect (logging water never redoes the lifts).
const PARTS = {
  lifts: [lifts, ['workouts', 'workoutSets', 'exercises']],
  protein: [proteinWeeks, ['nutritionLogs']],
  focus: [focusWeeks, ['dailyReviews']],
  wake: [wakeWeeks, ['sleepEntries']],
  steps: [stepDays, ['stepLogs']],
};
const part = (name, end) => store.memo(`record-part:${name}:${end}`, PARTS[name][1], () => PARTS[name][0](end));
const runOf = (h, end) => store.memo(`record-run:${h.id}:${end}`, H.DATA_STORES, () => habitRuns(h, end));
const runHabits = () => H.activeHabits().filter((h) => !h.optional && h.weekly !== false);

/** Every series that can hold a record. */
export function series(end = today()) {
  return store.memo(`record-series:${end}`, H.DATA_STORES, () => [...Object.keys(PARTS).flatMap((k) => part(k, end)), ...runHabits().flatMap((h) => runOf(h, end))]);
}

/** The work behind series(), as small separate steps (for the background watcher). */
export const seriesSteps = (end = today()) => [...Object.keys(PARTS).map((k) => () => part(k, end)),
  ...runHabits().flatMap((h) => [...pastStretches(h, end).map((ab) => () => pastPeriods(h, ab)), () => runOf(h, end)])];

const better = (s, a, b) => (s.lower ? a < b : a > b);

/** The points in a series that set a record (each beats at least three earlier points). */
export function recordPoints(s) {
  const out = [];
  let best = null;
  s.points.forEach((p, i) => {
    if (best != null && i >= MIN_PRIOR && better(s, p.value, best.value)) out.push({ ...p, previous: best.value, previousDate: best.date });
    if (best == null || better(s, p.value, best.value)) best = p;
  });
  return out;
}

/**
 * The records shelf: for each series with a record, the current one, newest first:
 * { id, label, value, text, date, previous, previousText }.
 */
export function shelf(end = today()) {
  return series(end).map((s) => {
    const r = recordPoints(s).pop();
    return r ? { id: s.id, label: s.label, value: r.value, text: s.fmt(r.value), date: r.date, previous: r.previous, previousText: s.fmt(r.previous), ongoing: !!r.ongoing } : null;
  }).filter(Boolean).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Records set between two dates (for a season's summary). */
export const setBetween = (from, to, end = today()) => series(end).flatMap((s) => recordPoints(s).filter((p) => p.date >= from && p.date <= to).map((p) => ({ id: s.id, label: s.label, text: s.fmt(p.value), date: p.date })));

/**
 * Mark records set today or yesterday that haven't been marked yet (each one once). An ongoing run
 * is marked once per new length. Returns the new ones, for the moment that marks them.
 */
export function sync(date = today()) {
  const fresh = [];
  const ops = [];
  for (const s of series(date)) {
    for (const p of recordPoints(s)) {
      if (p.date < addDays(date, -1)) continue;
      // A run in progress is marked once, on the day it takes the lead, not on every day after.
      if (p.ongoing && p.value !== p.previous + 1) continue;
      const id = `${s.id}:${p.date}:${p.value}`;
      if (store.get('records', id)) continue;
      const r = { id, kind: s.id, value: p.value, date: p.date, previous: p.previous, label: s.label, text: s.fmt(p.value) };
      ops.push({ store: 'records', value: r });
      fresh.push(r);
    }
  }
  if (ops.length) store.batch(ops);
  return fresh;
}
