// The habit engine: schedules, values, completion, consistency.
import * as store from '../data/store.js';
import * as M from './metrics.js';
import { workoutFacts } from './fitness.js';
import { today, weekday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, range, addDays, diffDays, lastNDays, monthKey } from './dates.js';

export const DATA_STORES = ['habits', 'habitLogs', 'waterLogs', 'nutritionLogs', 'stepLogs', 'sleepEntries', 'dailyReviews',
  'workouts', 'workoutSets', 'exercises', 'readingSessions', 'learningSessions', 'meditationSessions', 'relationshipEntries',
  'journalEntries', 'weeklyReviews', 'monthlyReviews', 'measurements', 'photos', 'profile', 'settings'];

export const logId = (habitId, date) => `${habitId}:${date}`;
export const log = (habitId, date) => store.get('habitLogs', logId(habitId, date));

export const habits = () => store.memo('habits-sorted', ['habits'], () => store.all('habits').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
export const activeHabits = () => habits().filter((h) => !h.archived);
export const habit = (id) => store.get('habits', id);

export const isNumeric = (h) => ['numeric', 'duration', 'quantity', 'rating'].includes(h.type);
export const isFlexible = (h) => ['perWeek', 'perMonth', 'interval'].includes(h.schedule?.kind);
export const trackingStart = () => store.profile()?.trackingStart || today();
export const startOf = (h) => (h.startDate && h.startDate > trackingStart() ? h.startDate : trackingStart());
export const started = (h, date) => date >= startOf(h);
export const dayMode = (date) => store.get('dailyReviews', date)?.mode || 'normal';

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
    case 'top3': return (r?.top3 || []).filter((p) => (p.text || '').trim()).length >= 3 ? 1 : 0;
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
  const doneDate = rec.completedAt.slice(0, 10);
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

/** The number that counts as "done" for a date. */
export function threshold(h, date, mode = dayMode(date)) {
  if (mode === 'minimum' && h.mvdMin != null) return h.mvdMin;
  if (h.ramp) return M.stepsTarget(date, h.ramp);
  return h.min ?? h.target ?? 1;
}

/** The number shown as the goal. */
export function displayTarget(h, date, mode = dayMode(date)) {
  if (mode === 'minimum' && h.mvdMin != null) return h.mvdMin;
  if (h.ramp) return M.stepsTarget(date, h.ramp);
  return h.target ?? 1;
}

export function isDone(h, date, mode = dayMode(date)) {
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
export function periodDone(h, date) {
  const k = h.schedule?.kind;
  const from = k === 'perMonth' ? startOfMonth(date) : startOfWeek(date);
  const to = k === 'perMonth' ? endOfMonth(date) : endOfWeek(date);
  let n = 0;
  for (const d of range(from, to)) if (d <= today() && started(h, d) && isDone(h, d)) n++;
  return n;
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
  if (mode === 'minimum') return !!h.mvd;
  if (mode === 'sick') return keptWhenSick(h);
  const s = h.schedule || { kind: 'daily' };
  if (s.kind === 'daily' || s.kind === 'weekdays') return isScheduledDay(h, date);
  if (isDone(h, date)) return true;
  if (s.kind === 'perWeek' || s.kind === 'perMonth') return periodDone(h, date) < (s.count || 1);
  if (s.kind === 'interval') {
    const last = lastDoneBefore(h, date);
    if (!last) return diffDays(date, startOf(h)) % (s.every || 7) === 0 || diffDays(date, startOf(h)) >= (s.every || 7);
    return diffDays(date, last) >= (s.every || 7);
  }
  return true;
}

export function scheduleLabel(h) {
  const s = h.schedule || { kind: 'daily' };
  const names = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  switch (s.kind) {
    case 'daily': return 'Every day';
    case 'weekdays': {
      const d = [...(s.days || [])].sort();
      if (d.join() === '1,2,3,4,5') return 'Weekdays';
      if (d.join() === '6,7') return 'Weekends';
      if (d.length === 7) return 'Every day';
      return d.map((x) => names[x]).join(', ');
    }
    case 'perWeek': return `${s.count}× a week`;
    case 'perMonth': return `${s.count}× a month`;
    case 'interval': return s.every === 14 ? 'Every 2 weeks' : `Every ${s.every} days`;
    default: return '';
  }
}

export function periodLabel(h, date) {
  const s = h.schedule || {};
  if (s.kind === 'perWeek') return `${periodDone(h, date)} of ${s.count} this week`;
  if (s.kind === 'perMonth') return `${periodDone(h, date)} of ${s.count} this month`;
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
  if (last === t && !isDone(h, t)) last = addDays(t, -1);
  const first = [addDays(end, -(days - 1)), startOf(h)].sort().pop();
  if (last < first) return { done: 0, expected: 0, ratio: null };
  const span = range(first, last).filter((d) => dayMode(d) !== 'sick');
  const s = h.schedule || { kind: 'daily' };
  const done = span.filter((d) => isDone(h, d)).length;
  let expected;
  if (s.kind === 'daily' || s.kind === 'weekdays') expected = span.filter((d) => isScheduledDay(h, d)).length;
  else if (s.kind === 'perWeek') expected = ((s.count || 1) * span.length) / 7;
  else if (s.kind === 'perMonth') expected = ((s.count || 1) * span.length) / 30.4;
  else expected = span.length / (s.every || 7);
  if (s.kind === 'daily' || s.kind === 'weekdays') {
    const scheduledDone = span.filter((d) => isScheduledDay(h, d) && isDone(h, d)).length;
    return { done: scheduledDone, expected, ratio: expected ? scheduledDone / expected : null };
  }
  expected = Math.max(expected, 0);
  return { done, expected, ratio: expected >= 0.5 ? Math.min(1, done / expected) : done > 0 ? 1 : null };
}

/** Seven small states for "5 of last 7 days" dots. */
export function dots(h, end = today(), n = 7) {
  return lastNDays(end, n).map((d) => {
    if (!started(h, d)) return { date: d, state: 'off' };
    if (dayMode(d) === 'sick') return { date: d, state: 'rest' };
    if (isDone(h, d)) return { date: d, state: 'done' };
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
  next.completed = isNumeric(h) ? !!next.completed : next.value === 1;
  return store.put('habitLogs', next);
}

export function clearLog(h, date) {
  store.remove('habitLogs', logId(h.id, date));
}

/** One-tap toggle for binary/check habits; returns the new done state. */
export function toggle(h, date) {
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
  setLog(h, date, { value: 1, checklist: h.checklist ? Object.fromEntries(h.checklist.map((_, i) => [i, true])) : undefined });
  return true;
}

export function toggleChecklistItem(h, date, index) {
  const l = log(h.id, date);
  const checklist = { ...(l?.checklist || {}) };
  checklist[index] = !checklist[index];
  const all = h.checklist.every((_, i) => checklist[i]);
  setLog(h, date, { checklist, value: all ? 1 : l?.value === 1 && all ? 1 : 0 });
}

export function setValue(h, date, v) {
  setLog(h, date, { value: v === '' || v == null ? null : Number(v) });
}

export function newHabit(overrides = {}) {
  return {
    id: store.uid(), name: '', description: '', section: 'life', category: 'life', icon: 'circle', color: null,
    type: 'binary', unit: '', target: 1, min: null, max: null, step: 1,
    schedule: { kind: 'daily' }, time: null, reminder: null, difficulty: 2, priority: 'high',
    goalId: null, affectsScore: false, showOnToday: true, optional: false, streaks: false, weekly: true,
    source: null, ramp: null, checklist: null, mvd: false, mvdMin: null, mvdLabel: null, archived: false,
    startDate: today(), order: habits().length, ...overrides,
  };
}

/** Longest and current runs of consecutive scheduled days completed (rest days and sick days don't break a run). */
export function runs(h, end = today(), lookback = 365) {
  let best = 0, cur = 0, current = 0;
  const from = [addDays(end, -lookback), startOf(h)].sort().pop();
  for (const d of range(from, end)) {
    if (dayMode(d) === 'sick') continue;
    const s = h.schedule || {};
    if ((s.kind === 'daily' || s.kind === 'weekdays') && !isScheduledDay(h, d)) continue;
    if (isDone(h, d)) { cur++; best = Math.max(best, cur); }
    else if (d !== today()) cur = 0;
  }
  current = cur;
  return { best, current };
}
