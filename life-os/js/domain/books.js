// Books: what you're reading, want to read and have finished. A reading session with pages moves
// the book's current page ("read 20 pages" updates the book), and the pace of the last two weeks
// says when you'll finish.
import * as store from '../data/store.js';
import { today, addDays, diffDays } from './dates.js';

export const STATUS = { reading: 'Reading', want: 'Want to read', finished: 'Finished' };

export const books = () => store.memo('books-sorted', ['books'], () => store.all('books')
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (b.updatedAt || '').localeCompare(a.updatedAt || '')));
export const book = (id) => store.get('books', id);
export const byStatus = (s) => books().filter((b) => (b.status || 'want') === s);
/** The book in your hands: the one you read most recently. */
export const current = () => byStatus('reading').sort((a, b) => (b.lastRead || '').localeCompare(a.lastRead || '') || (b.updatedAt || '').localeCompare(a.updatedAt || ''))[0] || null;

const words = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !['the', 'and', 'for', 'with'].includes(w));
/** The book a title names (most words in common), or null. */
export function match(title) {
  const want = words(title);
  if (!want.length) return null;
  let best = null, score = 0;
  for (const b of books()) {
    const have = words(b.title);
    const n = want.filter((w) => have.includes(w)).length;
    if (n > score || (n === score && n && b.status === 'reading')) { best = b; score = n; }
  }
  return score >= Math.min(2, want.length) ? best : null;
}

export function create({ title, author = '', pages = null, status = 'reading' }) {
  const t = (title || '').trim();
  if (!t) return null;
  const order = books().reduce((m, b) => Math.max(m, b.order ?? 0), 0) + 1;
  return store.put('books', { id: store.uid(), title: t, author: author.trim(), pages: pages ? Number(pages) : null, currentPage: 0, status,
    startedAt: status === 'reading' ? today() : null, finishedAt: null, notes: '', order });
}

export function progress(b) {
  const page = b.currentPage || 0;
  return { page, pages: b.pages || null, ratio: b.pages ? Math.min(1, page / b.pages) : null, left: b.pages ? Math.max(0, b.pages - page) : null };
}

/** Pages a day over the last 14 days, and the day you'd finish at that pace. */
export function pace(b, date = today()) {
  const from = addDays(date, -13);
  const read = store.all('readingSessions').filter((r) => r.bookId === b.id && r.date >= from && r.date <= date).reduce((a, r) => a + (Number(r.pages) || 0), 0);
  const perDay = read / 14;
  const left = progress(b).left;
  return { perDay, read, finish: perDay > 0 && left != null ? addDays(date, Math.ceil(left / perDay)) : null };
}

/**
 * The writes for reading `pages` (and/or `minutes`) of a book on a date: a session linked to the
 * book, the book's page moved on, and "finished" when the last page is reached.
 */
export function readingOps(b, { pages = null, minutes = null, date = today(), notes = '' } = {}) {
  const session = { id: store.uid(), date, bookId: b.id, book: b.title, pages: pages ?? null, minutes: minutes || 0, notes, finished: false };
  const page = Math.max(0, (b.currentPage || 0) + (Number(pages) || 0));
  const done = b.pages && page >= b.pages;
  const next = { ...b, currentPage: b.pages ? Math.min(page, b.pages) : page, lastRead: date, status: done ? 'finished' : b.status === 'want' ? 'reading' : b.status,
    startedAt: b.startedAt || date, finishedAt: done ? date : b.finishedAt || null };
  if (done) session.finished = true;
  return [{ store: 'readingSessions', value: session }, { store: 'books', value: next }];
}

export const daysReading = (b, date = today()) => (b.startedAt ? diffDays(date, b.startedAt) + 1 : null);
