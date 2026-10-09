// The habit engine: schedules, values, completion, consistency.
import * as store from '../data/store.js';
import { priorities } from './tasks.js';
import * as M from './metrics-core.js';
import { workoutFacts } from './fitness-core.js';
import { today, dayAt, weekday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, range, addDays, diffDays, lastNDays, monthKey } from './dates.js';

export const DATA_STORES = ['habits', 'habitLogs', 'waterLogs', 'nutritionLogs', 'stepLogs', 'sleepEntries', 'dailyReviews',
  'workouts', 'workoutSets', 'exercises', 'readingSessions', 'learningSessions', 'meditationSessions', 'relationshipEntries',
  'journalEntries', 'weeklyReviews', 'monthlyReviews', 'measurements', 'photos', 'profile', 'settings', 'tasks', 'routines', 'routineRuns'];

export const logId = (habitId, date) => `${habitId}:${date}`;
export const log = (habitId, date) => store.get('habitLogs', logId(habitId, date));

export const habits = () => store.memo('habits-sorted', ['habits'], () => store.all('habits').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
export const activeHabits = () => habits().filter((h) => !h.archived);
export const habit = (id) => store.get('habits', id);

export const isNumeric = (h) => ['numeric', 'duration', 'quantity', 'rating'].includes(h.type);
/** A habit to cut down or quit (13b): at most `limit` a day; 0 means none at all. */
export const isLimit = (h) => h.type === 'limit';
export const limitOf = (h) => Math.max(0, Number(h.limit) || 0);
export const isFlexible = (h) => ['perWeek', 'perMonth', 'interval'].includes(h.schedule?.kind);
export const trackingStart = () => store.profile()?.trackingStart || today();
export const startOf = (h) => (h.startDate && h.startDate > trackingStart() ? h.startDate : trackingStart());
export const started = (h, date) => date >= startOf(h);
export const dayMode = (date) => store.get('dailyReviews', date)?.mode || 'normal';
/** Days that don't count at all: sick days, and days marked away after time off (H9). */
export const isOff = (mode) => mode === 'sick' || mode === 'away';

/* ---------- source values ---------- */
export function sourceValue(source, date) {
  if (!source) return null;
  if (source.startsWith('workout:')) return workoutFacts(date)[source.slice(8)] ? 1 : 0;
  if (source.startsWith('rel:')) return M.relationship(date, source.slice(4)).length;
  const r = M.review(date);
  switch (source) {
    case 'sleep': return M.sleepHours(date);
    case 'water': return M.waterMl(date);
    case 'protein': return M.nutrition(date).protein;
    case 'produce': { const n = M.nutrition(date); return n.fruit + n.veg; }
    case 'steps': return M.steps(date);
    case 'mind': return M.mindMinutes(date);
    case 'meditation': return M.meditationMinutes(date);
    case 'journal': return M.journalCount(date);
    case 'top3': return priorities(date).length >= 3 ? 1 : 0;
    case 'deepWork': return r?.deepWork || 0;
    case 'breaks': return r?.breaks || 0;
    case 'eyeBreaks': return r?.eyeBreaks || 0;
    case 'shutdown': return r?.shutdown?.done ? 1 : 0;
    case 'weeklyReview': return store.get('weeklyReviews', startOfWeek(date))?.completedAt ? 1 : 0;
    case 'monthlyReview': return store.get('monthlyReviews', monthKey(date))?.completedAt ? 1 : 0;
    case 'measurements': return store.onDate('measurements', date).length ? 1 : 0;
    case 'photos': return store.onDate('photos', date).length ? 1 : 0;
    default: return null;
  }
}

const PERIOD_SOURCES = new Set(['weeklyReview', 'monthlyReview']);

/** Reviews are done once per period: on the day completed, on the habit's scheduled day,
 *  or (if completed late) on the period's last day. */
function periodSourceDone(h, date) {
  const weekly = h.source === 'weeklyReview';
  const rec = weekly ? store.get('weeklyReviews', startOfWeek(date)) : store.get('monthlyReviews', monthKey(date));
  if (!rec?.completedAt) return 0;
  const doneDate = dayAt(rec.completedAt);
  const start = weekly ? startOfWeek(date) : startOfMonth(date);
  const end = weekly ? endOfWeek(date) : endOfMonth(date);
  if (doneDate === date) return 1;
  if (h.schedule?.kind === 'weekdays' && isScheduledDay(h, date)) return 1;
  if ((doneDate > end || doneDate < start) && date === end) return 1;
  return 0;
}

export function value(h, date) {
  const l = log(h.id, date);
  const src = h.source ? (PERIOD_SOURCES.has(h.source) ? periodSourceDone(h, date) : sourceValue(h.source, date)) : null;
  if (h.type === 'binary' || h.type === 'check') {
    if (l?.value === 1) return 1;
    if (src) return 1;
    if (h.checklist?.length && l?.checklist && h.checklist.every((_, i) => l.checklist[i])) return 1;
    if (l && l.value === 0) return 0;
    return null;
  }
  if (h.source) return src ?? (h.type === 'duration' && h.unit === 'h' ? null : 0);
  return l?.value ?? null;
}

/** The number that counts as "done" for a date. On a minimum day, the tiny amount is enough. */
/** A smaller target agreed for two weeks (H7), in force on a date. */
const tempTarget = (h, date) => (h.temp?.target != null && date >= (h.temp.since || '') && date < h.temp.until ? h.temp.target : null);

export function threshold(h, date, mode = dayMode(date)) {
  if (mode === 'minimum' && tinyOf(h)?.min != null) return tinyOf(h).min;
  if (tempTarget(h, date) != null) return Math.min(tempTarget(h, date), h.min ?? h.target ?? Infinity);
  if (h.ramp) return M.stepsTarget(date, h.ramp);
  return h.min ?? h.target ?? 1;
}

/** The number shown as the goal. */
export function displayTarget(h, date, mode = dayMode(date)) {
  if (mode === 'minimum' && tinyOf(h)?.min != null) return tinyOf(h).min;
  if (tempTarget(h, date) != null) return tempTarget(h, date);
  if (h.ramp) return M.stepsTarget(date, h.ramp);
  return h.target ?? 1;
}

export function isDone(h, date, mode = dayMode(date)) {
  // A limit is kept while the day stays within it; a day with nothing logged was kept.
  if (isLimit(h)) return date <= today() && (log(h.id, date)?.value || 0) <= limitOf(h);
  const l = log(h.id, date);
  const v = value(h, date);
  if (h.type === 'binary' || h.type === 'check') return v === 1;
  if (l?.completed) return true;
  if (v == null) return false;
  if (h.type === 'rating') return v > 0;
  return v >= threshold(h, date, mode);
}

export function progress(h, date, mode = dayMode(date)) {
  if (!isNumeric(h)) return isDone(h, date, mode) ? 1 : 0;
  const v = value(h, date) || 0;
  const t = displayTarget(h, date, mode) || 1;
  return Math.max(0, Math.min(1, v / t));
}

/* ---------- scheduling ---------- */
/** Times done in the week (or month) of `date`, counting days up to `through` (and never
 *  past today). Judging a day uses only the days before it, so a later log never changes it. */
export function periodDone(h, date, through = today()) {
  const k = h.schedule?.kind;
  const from = k === 'perMonth' ? startOfMonth(date) : startOfWeek(date);
  const to = k === 'perMonth' ? endOfMonth(date) : endOfWeek(date);
  const last = through < today() ? through : today();
  let n = 0;
  for (const d of range(from, to)) if (d <= last && started(h, d) && isDone(h, d)) n++;
  return n;
}

/**
 * How many times a weekly or monthly habit is needed in the period holding `date`: its count, or
 * its share when part of the period can't be used (it began mid-period, sick or away days).
 */
export function periodNeed(h, date) {
  const s = h.schedule || {};
  const from = s.kind === 'perMonth' ? startOfMonth(date) : startOfWeek(date);
  return store.memo(`need:${h.id}:${from}`, ['habits', 'dailyReviews', 'profile'], () => {
    const to = s.kind === 'perMonth' ? endOfMonth(date) : endOfWeek(date);
    const usable = range(from, to).filter((d) => started(h, d) && !isOff(dayMode(d))).length;
    return Math.ceil(((s.count || 1) * usable) / (diffDays(to, from) + 1));
  });
}

export function lastDoneBefore(h, date) {
  for (let i = 1; i <= 120; i++) {
    const d = addDays(date, -i);
    if (d < startOf(h)) return null;
    if (isDone(h, d)) return d;
  }
  return null;
}

export function isScheduledDay(h, date) {
  const s = h.schedule || { kind: 'daily' };
  if (s.kind === 'weekdays') return (s.days || []).includes(weekday(date));
  return s.kind === 'daily';
}

const SICK_SOURCES = new Set(['water', 'sleep']);
const keptWhenSick = (h) => SICK_SOURCES.has(h.source) || h.id === 'h-lights-out' || h.keepWhenSick;

export function dueOn(h, date, mode = dayMode(date)) {
  if (h.archived || h.showOnToday === false || !started(h, date)) return false;
  if (skipped(h, date, mode)) return false;
  if (['paused', 'queue'].includes(stateOf(h, date))) return false;
  // A minimum day keeps the essentials, and your three in their tiny form.
  if (mode === 'minimum') return !!h.mvd || (stateOf(h, date) === 'focus' && dueOn(h, date, 'normal'));
  if (mode === 'sick') return keptWhenSick(h);
  if (mode === 'away') return false;
  const s = h.schedule || { kind: 'daily' };
  if (s.kind === 'daily' || s.kind === 'weekdays') return isScheduledDay(h, date);
  if (isDone(h, date)) return true;
  if (s.kind === 'perWeek' || s.kind === 'perMonth') return periodDone(h, date, addDays(date, -1)) < periodNeed(h, date);
  if (s.kind === 'interval') {
    const last = lastDoneBefore(h, date);
    if (!last) return diffDays(date, startOf(h)) % (s.every || 7) === 0 || diffDays(date, startOf(h)) >= (s.every || 7);
    return diffDays(date, last) >= (s.every || 7);
  }
  return true;
}

export function periodLabel(h, date) {
  const s = h.schedule || {};
  if (s.kind === 'perWeek') return `${periodDone(h, date)} of ${periodNeed(h, date)} this week`;
  if (s.kind === 'perMonth') return `${periodDone(h, date)} of ${periodNeed(h, date)} this month`;
  if (s.kind === 'interval') {
    const last = isDone(h, date) ? date : lastDoneBefore(h, date);
    if (!last) return 'Due';
    const next = addDays(last, s.every || 7);
    const d = diffDays(next, date);
    return d <= 0 ? 'Due' : `Next in ${d} day${d === 1 ? '' : 's'}`;
  }
  return '';
}

/* ---------- consistency ---------- */
export function consistency(h, end = today(), days = 7) {
  return store.memo(`cons:${h.id}:${end}:${days}`, DATA_STORES, () => computeConsistency(h, end, days));
}

function computeConsistency(h, end, days) {
  const t = today();
  let last = end > t ? t : end;
  if (last === t && !counts(h, t)) last = addDays(t, -1);
  const first = [addDays(end, -(days - 1)), startOf(h)].sort().pop();
  if (last < first) return { done: 0, expected: 0, ratio: null };
  const span = range(first, last).filter((d) => !isOff(dayMode(d)) && !isReserve(h, d) && !pausedOn(h, d));
  const s = h.schedule || { kind: 'daily' };
  const done = span.filter((d) => counts(h, d)).length;
  let expected;
  if (s.kind === 'daily' || s.kind === 'weekdays') expected = span.filter((d) => isScheduledDay(h, d)).length;
  else if (s.kind === 'perWeek') expected = ((s.count || 1) * span.length) / 7;
  else if (s.kind === 'perMonth') expected = ((s.count || 1) * span.length) / 30.4;
  else expected = span.length / (s.every || 7);
  if (s.kind === 'daily' || s.kind === 'weekdays') {
    const scheduledDone = span.filter((d) => isScheduledDay(h, d) && counts(h, d)).length;
    return { done: scheduledDone, expected, ratio: expected ? scheduledDone / expected : null };
  }
  expected = Math.max(expected, 0);
  return { done, expected, ratio: expected >= 0.5 ? Math.min(1, done / expected) : done > 0 ? 1 : null };
}

/** Seven small states for "5 of last 7 days" dots. */
export function dots(h, end = today(), n = 7) {
  return lastNDays(end, n).map((d) => {
    if (!started(h, d)) return { date: d, state: 'off' };
    if (d > today()) return { date: d, state: 'future' };
    if (isOff(dayMode(d)) || isReserve(h, d) || pausedOn(h, d)) return { date: d, state: 'rest' };
    if (isDone(h, d)) return { date: d, state: 'done' };
    if (isTiny(h, d)) return { date: d, state: 'tiny' };
    if (d === today()) return { date: d, state: 'today' };
    if (d > today()) return { date: d, state: 'future' };
    const s = h.schedule || {};
    if ((s.kind === 'daily' || s.kind === 'weekdays') && isScheduledDay(h, d)) return { date: d, state: 'miss' };
    return { date: d, state: 'off' };
  });
}

/* ---------- writes ---------- */
export function setLog(h, date, patch) {
  const id = logId(h.id, date);
  const prev = store.get('habitLogs', id) || { id, habitId: h.id, date };
  const next = { ...prev, ...patch };
  // Logging a habit takes back "not today".
  if (prev.skip && patch.skip == null && (patch.value || patch.completed || patch.tiny)) { next.skip = false; next.reserve = false; }
  next.completed = isNumeric(h) ? !!next.completed : next.value === 1;
  return store.put('habitLogs', next);
}

export function clearLog(h, date) {
  store.remove('habitLogs', logId(h.id, date));
}

/** One-tap toggle for binary/check habits; returns the new done state. */
export function toggle(h, date) {
  if (isLimit(h)) return isDone(h, date);
  const done = isDone(h, date);
  const l = log(h.id, date);
  if (h.type === 'check') {
    if (l?.value === 1) setLog(h, date, { value: 0 });
    else if (l?.value === 0) clearLog(h, date);
    else setLog(h, date, { value: 1 });
    return value(h, date) === 1;
  }
  if (isNumeric(h)) {
    setLog(h, date, { completed: !done });
    return !done;
  }
  if (done) {
    if (h.source && sourceValue(h.source, date)) {
      // Done because of logged data; a manual tick can't undo the data itself.
      return true;
    }
    if (h.checklist?.length) setLog(h, date, { value: 0, checklist: {} });
    else clearLog(h, date);
    return false;
  }
  setLog(h, date, { value: 1, tiny: false, checklist: h.checklist ? Object.fromEntries(h.checklist.map((_, i) => [i, true])) : undefined });
  return true;
}

export function setValue(h, date, v) {
  setLog(h, date, { value: v === '' || v == null ? null : Number(v) });
}


/* ---------- not today (U3) ---------- */

/** "Not today": the habit leaves the day's plan and score. A reserve day (a planned skip) leaves the
 *  run untouched; otherwise it counts as a miss. It never pretends the habit was done. */
export const skipped = (h, date, mode = dayMode(date)) => !!log(h.id, date)?.skip && !counts(h, date, mode);
export const isReserve = (h, date) => { const l = log(h.id, date); return !!(l?.skip && l.reserve) && !counts(h, date); };

/** Not today (on, with { reserve, reason }), or back in the plan (off). */
export function setSkip(h, date, on = true, extra = {}) {
  if (on) setLog(h, date, { skip: true, ...extra });
  else if (log(h.id, date)?.skip) setLog(h, date, { skip: false, reserve: false, reason: null });
}

/* ---------- tiny versions (H3) ---------- */

/** The two-minute version of a habit: { label, min }. It always counts. */
export const tinyOf = (h) => h.tiny || (h.mvdLabel || h.mvdMin != null ? { label: h.mvdLabel || null, min: h.mvdMin ?? null } : null);

/** Done in its tiny form (and not fully): marked by hand, or a number past the tiny amount. */
export function isTiny(h, date, mode = dayMode(date)) {
  if (isDone(h, date, mode)) return false;
  if (log(h.id, date)?.tiny) return true;
  const t = tinyOf(h);
  if (t?.min != null && h.type !== 'binary' && h.type !== 'check') {
    const v = value(h, date);
    return v != null && v >= t.min;
  }
  return false;
}

/** Counts for the score and for runs: fully done, or the tiny version. */
export const counts = (h, date, mode = dayMode(date)) => isDone(h, date, mode) || isTiny(h, date, mode);
export const level = (h, date, mode = dayMode(date)) => (isDone(h, date, mode) ? 'full' : isTiny(h, date, mode) ? 'tiny' : null);


export function setTiny(h, date, on = true) {
  if (on) setLog(h, date, { tiny: true });
  else if (log(h.id, date)) setLog(h, date, { tiny: false });
}

/** Two weeks of "just the tiny version" agreed after a rough patch (H7). */
export const tinyPlan = (h, date) => !!(h.temp?.tiny && date >= (h.temp.since || '') && date < h.temp.until);

/** A tap on a habit's circle. On a minimum day (or during a tiny-version fortnight) it logs the tiny version. */
export function tap(h, date, mode = dayMode(date)) {
  if ((mode === 'minimum' || tinyPlan(h, date)) && tinyOf(h) && (h.type === 'binary' || !h.type) && !h.checklist?.length && !h.source) {
    const lv = level(h, date, mode);
    if (lv === 'tiny') { setTiny(h, date, false); return false; }
    if (!lv) { setTiny(h, date, true); return true; }
  }
  return toggle(h, date);
}

/* ---------- states: focus on three (H1), or two to five if you choose ---------- */

const WORDS = ['none', 'one', 'two', 'three', 'four', 'five'];
/** How many habits can be in focus at once (Settings; three unless you change it). */
export const focusLimit = () => { const n = Number(store.settings().focusLimit); return n >= 2 && n <= 5 ? n : 3; };
/** "three": the focus count as a word, for "Your three" and "Choose your three". */
export const focusWord = () => WORDS[focusLimit()];

/** A habit's state on a date. A pause ends by itself on its end date. With a state history
 *  (stateLog, kept from when a habit's state is changed), a past day reads the state it had then,
 *  so pausing or moving a habit today never rewrites earlier days. */
export function stateOf(h, date = today()) {
  const log = h.stateLog;
  if (log?.length && date < today()) {
    let e = null;
    for (const x of log) if (x.from <= date) e = x;
    if (e) return e.state === 'paused' && e.until && date >= e.until ? e.before || 'autopilot' : e.state;
  }
  const s = h.state || 'autopilot';
  if (s === 'paused' && h.pausedUntil && date >= h.pausedUntil) return h.stateBeforePause || 'autopilot';
  return s;
}
/** Paused on that day: nothing was expected, so it neither counts nor breaks a run. */
export const pausedOn = (h, date) => stateOf(h, date) === 'paused';
export const inState = (state, date = today()) => activeHabits().filter((h) => stateOf(h, date) === state);
// In your order (Habits › Arrange); inState keeps the overall habit order.
export const focusHabits = (date = today()) => inState('focus', date);
export const queue = () => inState('queue').sort((a, b) => (a.queueOrder ?? a.order ?? 0) - (b.queueOrder ?? b.order ?? 0));

/* ---------- runs with grace (H4) ---------- */

/** The periods a habit is judged on: scheduled days, or weeks / months / intervals for flexible
 *  habits. met is true, false, or null while the period is still open. */
export function periodsOf(h, from, to) {
  const s = h.schedule || { kind: 'daily' };
  const t = today();
  const out = [];
  const usable = (d) => started(h, d) && !isOff(dayMode(d)) && !pausedOn(h, d);
  if (s.kind === 'perWeek' || s.kind === 'perMonth' || s.kind === 'interval') {
    // Intervals are counted from the habit's start, so the windows don't move from day to day.
    const every = s.every || 7;
    const anchor = startOf(h);
    let p = s.kind === 'perWeek' ? startOfWeek(from) : s.kind === 'perMonth' ? startOfMonth(from)
      : from > anchor ? addDays(anchor, Math.floor(diffDays(from, anchor) / every) * every) : from;
    while (p <= to) {
      const end = s.kind === 'perWeek' ? endOfWeek(p) : s.kind === 'perMonth' ? endOfMonth(p) : addDays(p, (s.every || 7) - 1);
      const days = range(p, end > to ? to : end).filter(usable);
      const need = s.kind === 'interval' ? 1 : periodNeed(h, p);
      const n = days.filter((d) => counts(h, d)).length;
      if (days.length) out.push({ key: p, met: n >= need ? true : end >= t ? null : false });
      p = addDays(end, 1);
    }
    return out;
  }
  for (const d of range(from, to)) {
    if (!usable(d) || !isScheduledDay(h, d) || isReserve(h, d)) continue;
    out.push({ key: d, met: counts(h, d) ? true : d >= t ? null : false });
  }
  return out;
}

export const runUnit = (h) => ({ perWeek: 'week', perMonth: 'month', interval: 'time' })[h.schedule?.kind] || 'day';

/** How much one judged period moves a habit's strength (as in Loop: half-life ~13 days for a daily habit). */
export function strengthStep(h) {
  const s = h.schedule || { kind: 'daily' };
  const k = s.kind === 'weekdays' ? Math.max(1, (s.days || []).length) : 7;
  const span = s.kind === 'perWeek' ? 7 * (s.count || 1) : s.kind === 'perMonth' ? 30.4 * (s.count || 1)
    : s.kind === 'interval' ? (s.every || 7) : 7 / k;
  return 1 - 0.5 ** (Math.sqrt(span) / 13);
}

/**
 * Runs that survive a single miss: only two misses in a row end one. Comebacks are completions
 * right after a miss (counted over the last 30 days). missesInRow is the misses since the last
 * completion, so 1 means "don't miss twice". strength (0–1) rises with each counted period and dips with a miss.
 */
export function runs(h, end = today(), lookback = 365) {
  return store.memo(`runs:${h.id}:${end}:${lookback}`, DATA_STORES, () => {
    const from = [addDays(end, -lookback), startOf(h)].sort().pop();
    const since = addDays(end, -29);
    const a = strengthStep(h);
    let run = 0, best = 0, misses = 0, comebacks = 0, total = 0, strength = 0;
    for (const p of periodsOf(h, from, end)) {
      if (p.met === null) continue;
      strength = strength * (1 - a) + (p.met ? a : 0);
      if (p.met) {
        if (misses > 0 && total > 0 && p.key >= since) comebacks++;
        run = misses >= 2 ? 1 : run + 1;
        misses = 0;
        total++;
        best = Math.max(best, run);
      } else {
        misses++;
        if (misses >= 2) run = 0;
      }
    }
    return { current: misses >= 2 ? 0 : run, best, comebacks, missesInRow: misses, total, unit: runUnit(h), strength };
  });
}

