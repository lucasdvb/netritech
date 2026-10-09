// The yearly review (13f): offered from mid-December to the end of January. The year in numbers,
// three questions, and one word for the year ahead, which sits at the top of Plan all year. A new
// year is when a fresh start comes easiest (the fresh start effect: Dai, Milkman & Riis 2014).
import * as store from '../data/store.js';
import * as M from './metrics-core.js';
import { yearData } from './film.js';
import { today } from './dates.js';

export const QUESTIONS = [
  ['proud', 'What are you proudest of this year?'],
  ['leave', 'What will you leave behind?'],
  ['next', 'What will next year be about?'],
];

/** The year up for review on a date: this year from 15 December, last year in January; else null. */
export function due(date = today()) {
  const [y, m, d] = date.split('-').map(Number);
  if (m === 12 && d >= 15) return y;
  if (m === 1) return y - 1;
  return null;
}

export const review = (year) => store.get('yearlyReviews', String(year)) || null;

export function save(year, patch) {
  const cur = review(year) || { id: String(year), year, answers: {} };
  return store.put('yearlyReviews', { ...cur, ...patch, answers: { ...cur.answers, ...(patch.answers || {}) } });
}

/** The word for the year you're in (or, once chosen in December, the one coming): { year, word } or null. */
export function themeWord(date = today()) {
  const y = Number(date.slice(0, 4));
  const now = review(y - 1)?.word;
  if (now) return { year: y, word: now };
  const coming = review(y)?.word;
  return coming && due(date) === y ? { year: y + 1, word: coming } : null;
}

/** The year in numbers, from what's already counted elsewhere. */
export function numbers(year) {
  const from = `${year}-01-01`, to = `${year}-12-31`;
  const inYear = (r) => r.date >= from && r.date <= to;
  const yd = yearData(year);
  const weights = store.all('weightEntries').filter(inYear).sort((a, b) => (a.date < b.date ? -1 : 1));
  return {
    showedUp: yd.logged,
    sealed: yd.sealed,
    workouts: store.all('workouts').filter((w) => w.status === 'done' && w.kind !== 'mobility' && inYear(w)).length,
    books: new Set(store.all('readingSessions').filter((r) => r.finished && inYear(r)).map((r) => r.book)).size,
    pages: store.all('journalEntries').filter(inYear).length,
    weight: weights.length > 1 ? weights[weights.length - 1].kg - weights[0].kg : null,
    wins: store.all('dailyReviews').filter((r) => inYear(r) && (r.win || '').trim()).length,
    steps: (() => { const s = store.all('stepLogs').filter(inYear).map((x) => x.steps).filter(Boolean); return s.length ? M.avg(s) : null; })(),
  };
}
