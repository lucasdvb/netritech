// Seasons (G1): six weeks starting on a Monday, with a name, three focus habits and one intention.
// Week 3 has a short check-in; when the season ends its summary is frozen, so it reads the same
// whatever you change later.
import * as store from '../data/store.js';
import * as H from './habits.js';
import * as F from './fitness.js';
import { statePatch } from './habit-system.js';
import { dayScore } from './scoring.js';
import { setBetween } from './records.js';
import { today, addDays, startOfWeek, range, diffDays } from './dates.js';

export const WEEKS = 6;
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export const seasons = () => store.all('seasons').sort((a, b) => (a.start < b.start ? -1 : 1));
export const season = (id) => store.get('seasons', id);
/** The season running on a date. */
export const current = (date = today()) => seasons().find((s) => !s.endedEarly && s.start <= date && date <= s.end) || null;
/** A season that's set to start later. */
export const upcoming = (date = today()) => seasons().find((s) => s.start > date) || null;
export const past = (date = today()) => seasons().filter((s) => s.end < date || s.endedEarly).reverse();

/** Which week of the season a date falls in (1–6). */
export const weekOf = (s, date = today()) => Math.min(WEEKS, Math.max(1, Math.floor(diffDays(date, s.start) / 7) + 1));
export const daysLeft = (s, date = today()) => Math.max(0, diffDays(s.end, date));

/** Where a new season would start: this Monday until Wednesday, otherwise next Monday. */
export function nextStart(date = today()) {
  const mon = startOfWeek(date);
  return diffDays(date, mon) <= 2 ? mon : addDays(mon, 7);
}

/**
 * Start a season. Its three habits become your focus three; any other habit in focus moves to
 * autopilot. Returns an undo that puts everything back.
 */
export function create({ name, intention = '', habitIds = [], start = nextStart() }) {
  const ids = habitIds.slice(0, H.focusLimit());
  const s = { id: store.uid(), name: name.trim() || `Season ${seasons().length + 1}`, intention: intention.trim(), habitIds: ids, start, end: addDays(start, WEEKS * 7 - 1), createdAt: new Date().toISOString() };
  const before = [];
  const ops = [{ store: 'seasons', value: s }];
  for (const h of H.activeHabits()) {
    const want = ids.includes(h.id) ? 'focus' : H.stateOf(h) === 'focus' ? 'autopilot' : null;
    if (!want || H.stateOf(h) === want) continue;
    before.push({ ...h });
    ops.push({ store: 'habits', value: { ...h, ...statePatch(h, want, { focusCount: 0 }) } });
  }
  store.batch(ops);
  return { season: s, undo: () => store.batch([{ store: 'seasons', delete: s.id }, ...before.map((v) => ({ store: 'habits', value: v }))]) };
}

/** The mid-season check-in is due in week 3, once. */
export const checkInDue = (s, date = today()) => !!s && !s.checkIn && weekOf(s, date) === 3;
export function checkIn(s, { note = '', keep = true } = {}) {
  store.put('seasons', { ...s, checkIn: { date: today(), note: note.trim(), keep } });
}

/** The season's numbers, worked out from the data (live until the season ends). */
export function summarize(s, end = today()) {
  const last = s.end < end ? s.end : end;
  const days = last >= s.start ? range(s.start, last).filter((d) => d >= H.trackingStart()) : [];
  const scored = days.map((d) => dayScore(d)).filter((x) => x.ratio != null && !H.isOff(x.mode));
  const focus = s.habitIds.map((id) => H.habit(id)).filter(Boolean).map((h) => {
    const c = H.consistency(h, last, days.length || 1);
    return { habitId: h.id, name: h.name, ratio: c.ratio, done: c.done };
  });
  return {
    days: days.length,
    score: mean(scored.map((x) => x.ratio)),
    sealed: days.filter((d) => store.get('dailyReviews', d)?.sealedAt).length,
    workouts: F.allWorkouts().filter((w) => w.date >= s.start && w.date <= last).length,
    focus,
    records: setBetween(s.start, last).map((r) => ({ label: r.label, text: r.text, date: r.date })),
    levels: store.all('levelEvents').filter((e) => e.date >= s.start && e.date <= last).map((e) => ({ habitId: e.habitId, level: e.level, date: e.date })),
  };
}

/** A season's summary: frozen once it has ended, live while it runs. */
export const summaryOf = (s, date = today()) => s.summary || summarize(s, date);

/** End a season early (its summary is frozen as it stands). */
export function endEarly(s, date = today()) {
  store.put('seasons', { ...s, endedEarly: date, end: addDays(date, -1) < s.start ? s.start : addDays(date, -1), summary: summarize(s, addDays(date, -1)) });
}

/** Freeze the summary of every season that has ended. Returns the ones frozen now (for the finale). */
export function finalize(date = today()) {
  const done = seasons().filter((s) => !s.summary && s.end < date);
  if (done.length) store.batch(done.map((s) => ({ store: 'seasons', value: { ...s, summary: summarize(s, s.end), finishedAt: date } })));
  return done;
}
