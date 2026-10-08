// Dates that matter: birthdays and anniversaries come round every year; an event happens once and
// can count down on Today (a wedding, a trip, a race). Today shows what's within two weeks.
import * as store from '../data/store.js';
import { today, diffDays, fromISO, toISO, cmp } from './dates.js';

export const KINDS = [
  { id: 'birthday', label: 'Birthday', ic: 'cake' },
  { id: 'anniversary', label: 'Anniversary', ic: 'heart' },
  { id: 'event', label: 'Event', ic: 'calendar-heart' },
];
export const kindOf = (e) => KINDS.find((k) => k.id === e.kind) || KINDS[2];
export const SOON = 14;

const yearly = (e) => e.kind !== 'event';
const onYear = (e, y) => {
  const d = fromISO(e.date);
  // 29 February falls on the 28th in other years.
  const last = new Date(y, d.getMonth() + 1, 0).getDate();
  return toISO(new Date(y, d.getMonth(), Math.min(d.getDate(), last)));
};

/** The next time it happens, on or after `from` (a past one-off event: its own date). */
export function next(e, from = today()) {
  if (!yearly(e)) return e.date;
  const y = fromISO(from).getFullYear();
  const cand = onYear(e, y);
  return cand >= from ? cand : onYear(e, y + 1);
}

/** Years since the first date, on its next occurrence ("turns 40", "5 years"), when the year is known. */
export function years(e, from = today()) {
  if (!yearly(e) || e.noYear) return null;
  const n = fromISO(next(e, from)).getFullYear() - fromISO(e.date).getFullYear();
  return n > 0 ? n : null;
}

export const all = () => store.all('events');

/** Everything in order of when it next happens; past one-off events last. */
export function sorted(from = today()) {
  return all().map((e) => ({ e, on: next(e, from), in: diffDays(next(e, from), from) }))
    .sort((a, b) => (a.in < 0) - (b.in < 0) || (a.in < 0 ? b.in - a.in : a.in - b.in) || cmp(a.e.title, b.e.title));
}

/** What Today shows: within two weeks, plus the countdowns you asked for. */
export const upcoming = (from = today()) => sorted(from).filter((x) => x.in >= 0 && (x.in <= SOON || x.e.countdown));

/** "Today", "Tomorrow", "in 5 days", "in 12 weeks". */
export function inWords(n) {
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n < 0) return `${-n} day${n === -1 ? '' : 's'} ago`;
  if (n <= 60) return `in ${n} days`;
  return `in ${Math.round(n / 7)} weeks`;
}

export function label(x) {
  const y = years(x.e);
  if (x.e.kind === 'birthday') return y ? `${x.e.title} turns ${y}` : `${x.e.title}’s birthday`;
  if (x.e.kind === 'anniversary') return y ? `${x.e.title} · ${y} year${y === 1 ? '' : 's'}` : x.e.title;
  return x.e.title;
}

export function save({ id, title, date, kind = 'birthday', countdown = false, noYear = false }) {
  const t = (title || '').trim();
  if (!t) throw new Error('Give it a name.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) throw new Error('Pick a date.');
  const prev = id ? store.get('events', id) : null;
  return store.put('events', { ...(prev || {}), ...(id ? { id } : {}), title: t.slice(0, 60), date, kind, countdown: !!countdown, noYear: !!noYear });
}
