// Mastery levels (G4), from how many times you've done a habit: Started at 1, Practised at 10,
// Steady at 30, Second nature at 66 (about the median time for a habit to become automatic, Lally
// et al. 2009) and Mastered at 150. Each level is a plate engraved with the day it was reached.
// The engraving is stored, so later edits, backfills and deletions never change it; the one
// exception is an Undo on the same day, which takes back a level reached and lost that day.
import * as store from '../data/store.js';
import * as H from './habits.js';
import { today, addDays, range } from './dates.js';

export const LEVELS = [
  { id: 'started', name: 'Started', at: 1 },
  { id: 'practised', name: 'Practised', at: 10 },
  { id: 'steady', name: 'Steady', at: 30 },
  { id: 'second-nature', name: 'Second nature', at: 66 },
  { id: 'mastered', name: 'Mastered', at: 150 },
];
export const level = (id) => LEVELS.find((l) => l.id === id) || null;

const logsByHabit = () => store.memo('logs-by-habit', ['habitLogs'], () => {
  const m = new Map();
  for (const l of store.all('habitLogs')) { if (!m.has(l.habitId)) m.set(l.habitId, []); m.get(l.habitId).push(l.date); }
  return m;
});

/** The days a habit counted (its tiny version counts too), oldest first. */
export function completionDays(h, end = today()) {
  return store.memo(`completions:${h.id}:${end}`, H.DATA_STORES, () => {
    const days = h.source ? range(H.startOf(h), end) : [...new Set(logsByHabit().get(h.id) || [])].filter((d) => d <= end).sort();
    return days.filter((d) => H.started(h, d) && H.counts(h, d));
  });
}

const eventsByHabit = () => store.memo('level-events', ['levelEvents'], () => {
  const m = new Map();
  for (const e of store.all('levelEvents')) { if (!m.has(e.habitId)) m.set(e.habitId, []); m.get(e.habitId).push(e); }
  for (const list of m.values()) list.sort((a, b) => level(a.level).at - level(b.level).at);
  return m;
});

/** The plates a habit has, lowest first: [{ level, name, at, date }]. */
export const plates = (habitId) => (eventsByHabit().get(habitId) || []).map((e) => ({ ...e, name: level(e.level)?.name, at: level(e.level)?.at }));

/** Where a habit stands: how many times, its level, and how far to the next one. */
export function mastery(h, end = today()) {
  const count = completionDays(h, end).length;
  const ps = plates(h.id);
  const current = ps[ps.length - 1] || null;
  const next = LEVELS.find((l) => l.at > (current?.at || 0)) || null;
  return { count, level: current, next, toNext: next ? Math.max(0, next.at - count) : 0, plates: ps };
}

/** The work behind sync(), one habit per step (for the background watcher). */
export const syncSteps = (date = today(), habits = H.activeHabits()) => habits.map((h) => () => completionDays(h, date));

/**
 * Engrave newly reached levels for the given habits. Returns the plates engraved now whose day is
 * today or yesterday, the ones worth a moment (older history is engraved quietly).
 */
export function sync(date = today(), habits = H.activeHabits()) {
  const ops = [];
  const fresh = [];
  for (const h of habits) {
    const days = completionDays(h, date);
    const have = new Map((eventsByHabit().get(h.id) || []).map((e) => [e.level, e]));
    for (const l of LEVELS) {
      const ev = have.get(l.id);
      if (!ev && days.length >= l.at) {
        const e = { id: `${h.id}:${l.id}`, habitId: h.id, level: l.id, date: days[l.at - 1], engravedOn: date };
        ops.push({ store: 'levelEvents', value: e });
        if (e.date >= addDays(date, -1)) fresh.push({ ...e, habit: h, name: l.name, at: l.at });
      } else if (ev && days.length < l.at && ev.engravedOn === date) {
        ops.push({ store: 'levelEvents', delete: ev.id });
      }
    }
  }
  if (ops.length) store.batch(ops);
  return fresh;
}
