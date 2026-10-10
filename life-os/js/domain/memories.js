// On this day (13e): what you wrote a year ago, or else a month ago, when there's something: a
// journal entry, or the day's win. Shown on Review; nothing when there's nothing.
import * as store from '../data/store.js';
import { addDays, today } from './dates.js';

const words = (j) => [(j.text || '').trim(), ...Object.values(j.answers || {}).map((a) => String(a || '').trim())].filter(Boolean);

/** What's written on one date: the journal first, then the day's win. */
export function writtenOn(date) {
  for (const j of store.onDate('journalEntries', date)) {
    const w = words(j);
    if (w.length) return { date, kind: 'journal', id: j.id, text: w[0] };
  }
  const win = (store.get('dailyReviews', date)?.win || '').trim();
  return win ? { date, kind: 'win', text: win } : null;
}

/** The same day of the month `n` months away (the month's last day when it's shorter). */
export function sameDay(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return `${first.getUTCFullYear()}-${String(first.getUTCMonth() + 1).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}

/** { when: 'A year ago' | 'A month ago', date, kind, text, id? } or null. */
export function onThisDay(date = today()) {
  const year = sameDay(date, -12);
  const month = sameDay(date, -1);
  const pick = (d, when) => { const w = writtenOn(d); return w ? { when, ...w } : null; };
  // A day either side, so a short month or a leap day still finds its match.
  return pick(year, 'A year ago') || pick(addDays(year, -1), 'A year ago') || pick(month, 'A month ago') || null;
}
