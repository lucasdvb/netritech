// Takeaways that come back: an idea worth keeping (from a book, a note, a review) returns in the
// morning check-in on a widening schedule (1, 3, 7, 16, 35, 90 days), so it's seen just as it's
// fading. "Used it" or "still true" moves it further out; "forgot it" brings it back sooner;
// "retire" stops it. Spaced retrieval is one of the most reliable findings in learning research
// (Cepeda et al. 2006, meta-analysis; Karpicke & Roediger 2008).
import * as store from '../data/store.js';
import { today, addDays } from './dates.js';

export const STEPS = [1, 3, 7, 16, 35, 90];

export const all = () => store.memo('takeaways-sorted', ['takeaways'], () => store.all('takeaways').filter((t) => !t.retired).sort((a, b) => String(a.due).localeCompare(String(b.due))));
export const one = (id) => store.get('takeaways', id);

/** Keep a takeaway. { text, source?: 'book:<id>' | 'note:<id>' | 'review' | '', sourceLabel? } */
export function add({ text, source = '', sourceLabel = '' }, date = today()) {
  const t = String(text || '').trim().slice(0, 280);
  if (!t) return null;
  return store.put('takeaways', { text: t, source, sourceLabel: String(sourceLabel).slice(0, 80), box: 0, due: addDays(date, STEPS[0]), seen: 0, retired: false });
}

/** What's due on a date, oldest first. */
export const due = (date = today()) => all().filter((t) => t.due <= date);
/** The one for the morning check-in (the most overdue; one a day keeps it light). */
export const forMorning = (date = today()) => due(date)[0] || null;

/**
 * Answer it: 'used' (put to use) and 'kept' (still true) move it a step further; 'forgot' goes back
 * to the start; 'retire' stops it. Returns an undo.
 */
export function answer(id, how, date = today()) {
  const t = one(id);
  if (!t) return () => {};
  const box = how === 'forgot' ? 0 : Math.min(STEPS.length - 1, (t.box || 0) + (how === 'used' ? 2 : 1));
  const patch = how === 'retire' ? { retired: true, retiredOn: date }
    : { box, due: addDays(date, STEPS[box]), seen: (t.seen || 0) + 1, last: date, ...(how === 'used' ? { used: (t.used || 0) + 1 } : {}) };
  store.put('takeaways', { ...t, ...patch });
  return () => store.put('takeaways', t);
}

export function edit(id, text) {
  const t = one(id);
  const v = String(text || '').trim().slice(0, 280);
  if (t && v) store.put('takeaways', { ...t, text: v });
}

export function remove(id) {
  const t = one(id);
  if (!t) return () => {};
  store.remove('takeaways', id);
  return () => store.put('takeaways', t);
}

/** Those from one source (a book's page lists its own). */
export const fromSource = (source) => store.all('takeaways').filter((t) => t.source === source);
