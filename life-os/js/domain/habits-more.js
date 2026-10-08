// The habit rules the later screens need (labels, states, checklists), kept out of the first
// screen's code. Everything in habits.js comes through here too.
import { log, setLog, isNumeric, counts, runs, isFlexible, isReserve, setSkip, isDone, startOf, dayMode, value, level as coreLevel } from './habits.js';
import { today, addDays, range, startOfWeek, endOfWeek } from './dates.js';

export * from './habits.js';

/** What each state means, for the screens that let you choose one. */
export const STATES = {
  focus: { label: 'Focus', hint: 'In training: logged every day and counted in your score.' },
  autopilot: { label: 'Autopilot', hint: 'Already part of your day. Never counted against you.' },
  queue: { label: 'Later', hint: 'Waiting for a free focus slot.' },
  paused: { label: 'Paused', hint: 'Off until the date you choose. Nothing is counted.' },
};

/** The schedule in words: "Weekdays", "3× a week", "Every 2 weeks". */
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

export function toggleChecklistItem(h, date, index) {
  const l = log(h.id, date);
  const checklist = { ...(l?.checklist || {}) };
  checklist[index] = !checklist[index];
  const all = h.checklist.every((_, i) => checklist[i]);
  setLog(h, date, { checklist, value: all ? 1 : l?.value === 1 && all ? 1 : 0 });
}

/* ---------- Phase 13: what the later screens need ---------- */

/** Planned skips a week: one by default for daily and weekday habits (0–3 in its options); flexible
 *  habits already have slack, and a limit habit has nothing to skip. */
export const reserveAllowance = (h) => (isFlexible(h) || h.type === 'limit' ? 0 : Math.max(0, Math.min(3, h.reserves ?? 1)));
/** Reserves left in the week holding `date` (not counting one already spent on that date). */
export function reservesLeft(h, date) {
  const used = range(startOfWeek(date), endOfWeek(date)).filter((d) => d !== date && isReserve(h, d)).length;
  return Math.max(0, reserveAllowance(h) - used);
}
/** Not today, spending the week's reserve first: then the run carries on. Returns { reserve }. */
export function skipToday(h, date, { reason } = {}) {
  const l = log(h.id, date);
  const reserve = l?.skip && l.reserve ? true : reservesLeft(h, date) > 0;
  setSkip(h, date, true, { reserve, ...(reason !== undefined ? { reason } : {}) });
  return { reserve };
}

/** Days in a row a limit habit has been kept, up to and including `date`. */
export function keptDays(h, date = today()) {
  let n = 0;
  for (let d = date; d >= startOf(h) && n < 3650; d = addDays(d, -1)) { if (!isDone(h, d)) break; n++; }
  return n;
}

/** Why it slipped (one optional tap): what each reason is called. */
export const REASONS = [['sick', 'Sick'], ['travel', 'Travel'], ['busy', 'Busy'], ['forgot', 'Forgot'], ['meh', 'Not feeling it']];

/** The great-day version of a habit: { label, min }. It counts as done, and is marked (13a). */
export const stretchOf = (h) => (h.stretch?.label || h.stretch?.min != null ? h.stretch : null);

/** Done in its stretch form: marked by hand, or a number at or past the stretch amount. */
export function isStretch(h, date, mode = dayMode(date)) {
  const st = stretchOf(h);
  if (!st || !isDone(h, date, mode)) return false;
  if (log(h.id, date)?.stretch) return true;
  if (st.min != null && isNumeric(h)) { const v = value(h, date); return v != null && v >= st.min; }
  return false;
}

/** The level a day reached: 'stretch', 'full', 'tiny' or null (Today only needs the last three). */
export const level = (h, date, mode = dayMode(date)) => (isStretch(h, date, mode) ? 'stretch' : coreLevel(h, date, mode));

/** Mark (or take back) the stretch version for a day. */
export function setStretch(h, date, on = true) {
  if (!on) { if (log(h.id, date)) setLog(h, date, { stretch: false }); return; }
  if (isNumeric(h)) setLog(h, date, { stretch: true, completed: true });
  else setLog(h, date, { stretch: true, value: 1, tiny: false });
}

/** One more (or one less) for a limit habit; never below zero. Returns the new count. */
export function addCount(h, date, delta = 1) {
  const n = Math.max(0, (log(h.id, date)?.value || 0) + delta);
  setLog(h, date, { value: n });
  return n;
}

/** The four questions of the Self-Report Behavioural Automaticity Index (Gardner 2012). */
export const AUTO_QUESTIONS = ['I do it automatically.', 'I do it without having to consciously remember.', 'I do it without thinking.', 'I start doing it before I realise I’m doing it.'];
/** The latest answer, 1–5 (the average of the four), or null. */
export const autoScore = (h) => h.auto?.at(-1)?.score ?? null;
/** It feels automatic: its reminders fade, and autopilot is offered. */
export const feelsAutomatic = (h) => (autoScore(h) ?? 0) >= 4;

/** Strength as a whole percentage (0–100). */
export const strength = (h, end = today()) => Math.round(runs(h, end).strength * 100);

/** The first time a habit counts after a miss: a comeback (it had counted at least three times before). */
export function isComeback(h, date = today()) {
  if (!counts(h, date)) return false;
  const r = runs(h, addDays(date, -1));
  return r.missesInRow >= 1 && r.total >= 3;
}
