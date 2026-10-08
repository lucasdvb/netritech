// A habit's history, worked out a stretch at a time: fixed stretches of about two months that end
// between its periods. Each is kept until something dated in it or before it changes (or anything
// undated it reads), so logging today never redoes the past, and the background work comes in
// steps small enough never to hold up a tap.
import * as store from '../data/store.js';
import { STORES } from '../data/schema.js';
import * as H from './habits.js';
import { addDays, addMonths, diffDays, startOfMonth } from './dates.js';

const EPOCH = '2000-01-03'; // a Monday, so stretches of whole weeks line up with weekly habits
const DAYS = 63;
const dated = (s) => STORES[s].indexes.includes('date');
/** What a habit's days read that carries no date (its settings, routines, reviews…). */
export const UNDATED = [...H.DATA_STORES.filter((s) => !dated(s)), 'meta'];
const DATED = H.DATA_STORES.filter((s) => dated(s) && s !== 'tasks');
/** The dated stores a habit's days read: tasks only for the one counted from your Top 3. */
export const historyStores = (h) => (h.source === 'top3' ? [...DATED, 'tasks'] : DATED);

/** Where the stretch after the one holding `d` begins. */
function nextStart(h, d) {
  const s = h.schedule || {};
  if (s.kind === 'perMonth') { const m = startOfMonth(d); return addMonths(m, +m.slice(5, 7) % 2 ? 2 : 1); } // odd months
  if (s.kind === 'interval') {
    const every = s.every || 7;
    const span = every * Math.max(1, Math.round(DAYS / every));
    const base = H.startOf(h);
    return addDays(base, (Math.floor(diffDays(d, base) / span) + 1) * span);
  }
  return addDays(EPOCH, (Math.floor(diffDays(d, EPOCH) / DAYS) + 1) * DAYS);
}

/** [from, to] cut into stretches: [[a, b], …]. */
export function stretches(h, from, to) {
  const out = [];
  for (let a = from; a <= to;) {
    const end = addDays(nextStart(h, a), -1);
    const b = end < to ? end : to;
    out.push([a, b]);
    a = addDays(b, 1);
  }
  return out;
}

/** fn() for one stretch of a habit, kept until data dated on or before its last day changes. */
export const settled = (name, h, [a, b], fn) => store.memo(`${name}:${h.id}:${a}:${b}`, UNDATED, fn, store.changedBefore(addDays(b, 1), historyStores(h)));
