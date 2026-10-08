// Urges for the habits you're cutting down or quitting (13b): one tap for each one you resist or
// give in to, with where and how you felt if you like. What they have in common is the trigger to
// plan around, and the habit's "instead, I will…" is the plan.
import * as store from '../data/store.js';
import * as H from './habits-more.js';
import { today, addDays } from './dates.js';

export const WHERE = [['home', 'Home'], ['work', 'Work'], ['out', 'Out'], ['bed', 'In bed']];
export const FEELING = [['bored', 'Bored'], ['stressed', 'Stressed'], ['tired', 'Tired'], ['social', 'With people'], ['habit', 'Just habit']];
const WHEN = [['morning', 'mornings', 5, 12], ['afternoon', 'afternoons', 12, 17], ['evening', 'evenings', 17, 22], ['night', 'late at night', 22, 29]];

const hourOf = (at) => { const h = new Date(at).getHours(); return h < 5 ? h + 24 : h; };
export const whenOf = (at) => WHEN.find(([, , a, b]) => hourOf(at) >= a && hourOf(at) < b)?.[0] || 'night';

/** Log an urge. A slip also adds one to the day's count. Returns { id, undo }. */
export function log(h, { outcome, where = null, feeling = null, date = today(), at = new Date().toISOString() }) {
  const before = { log: H.log(h.id, date) ? { ...H.log(h.id, date) } : null };
  const u = store.put('urges', { habitId: h.id, date, at, outcome, where, feeling });
  if (outcome === 'slipped') H.addCount(h, date, 1);
  const undo = () => {
    store.remove('urges', u.id);
    if (outcome === 'slipped') before.log ? store.put('habitLogs', before.log) : store.remove('habitLogs', H.logId(h.id, date));
  };
  return { id: u.id, undo };
}

/** A habit's urges since a date, newest first. */
export const forHabit = (habitId, since = addDays(today(), -59)) =>
  store.where('urges', (u) => u.habitId === habitId && u.date >= since).sort((a, b) => (a.at < b.at ? 1 : -1));

/**
 * What the urges have in common: the most frequent time of day, place and feeling (each only when
 * it shows up in at least 3 urges and over a third of them), and how many were resisted.
 */
export function pattern(habitId, since) {
  const list = forHabit(habitId, since);
  const top = (key, label) => {
    const n = new Map();
    for (const u of list) { const k = key(u); if (k) n.set(k, (n.get(k) || 0) + 1); }
    const [k, c] = [...n.entries()].sort((a, b) => b[1] - a[1])[0] || [];
    return k && c >= 3 && c * 3 >= list.length ? { id: k, label: label(k), n: c } : null;
  };
  const name = (pairs) => (k) => pairs.find(([id]) => id === k)?.[1].toLowerCase() || k;
  return {
    total: list.length,
    resisted: list.filter((u) => u.outcome === 'resisted').length,
    slipped: list.filter((u) => u.outcome === 'slipped').length,
    when: top((u) => whenOf(u.at), (k) => WHEN.find(([id]) => id === k)[1]),
    where: top((u) => u.where, name(WHERE)),
    feeling: top((u) => u.feeling, name(FEELING)),
  };
}
