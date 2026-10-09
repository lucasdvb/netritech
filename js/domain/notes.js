// Brain dump: notes to get things out of your head, each filed under a category you choose.
// A note is its text, a category (or none: Unsorted), and a pin. The categories are a short
// starter set plus your own, kept in settings in your order; deleting one moves its notes to
// Unsorted rather than losing them.
import * as store from '../data/store.js';

export const DEFAULT_CATEGORIES = ['Ideas', 'To think about', 'Work', 'Personal', 'Someday'];
export const UNSORTED = '';
const MAX_NAME = 24;

export const categories = () => store.settings().noteCategories || DEFAULT_CATEGORIES;
const setCategories = (list) => store.setSettings({ noteCategories: list });
const clean = (name) => String(name || '').trim().replace(/\s+/g, ' ').slice(0, MAX_NAME);
const same = (a, b) => a.toLowerCase() === b.toLowerCase();

/** Every note, pinned first, then the latest written or edited first. */
export const notes = () => store.memo('notes-sorted', ['notes'], () => store.all('notes')
  .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || (b.updatedAt || '').localeCompare(a.updatedAt || '')));
export const note = (id) => store.get('notes', id);

/** Notes in a category ('all', '' for Unsorted, or a name), matching a search when there is one. */
export function filter({ category = 'all', q = '' } = {}) {
  const t = q.trim().toLowerCase();
  return notes().filter((n) => (category === 'all' || (n.category || '') === category) && (!t || n.text.toLowerCase().includes(t)));
}

/** How many notes each category holds: Map(name → count), '' for Unsorted. */
export const counts = () => notes().reduce((m, n) => m.set(n.category || '', (m.get(n.category || '') || 0) + 1), new Map());

export function create(text, category = UNSORTED) {
  const t = String(text || '').trim();
  if (!t) return null;
  return store.put('notes', { text: t.slice(0, 4000), category: category || UNSORTED, pinned: false });
}
export const setText = (id, text) => { const t = String(text || '').trim(); if (t && note(id)) store.update('notes', id, { text: t.slice(0, 4000) }); };
export const file = (id, category) => store.update('notes', id, { category: category || UNSORTED });
export const pin = (id) => { const n = note(id); if (n) store.update('notes', id, { pinned: !n.pinned }); };

/** A new category at the end; returns its name (the existing one when it's already there). */
export function addCategory(name) {
  const c = clean(name);
  if (!c) return null;
  const have = categories().find((x) => same(x, c));
  if (have) return have;
  setCategories([...categories(), c]);
  return c;
}

/** Rename a category; its notes move with it. Merges into one that already has the new name. */
export function renameCategory(from, to) {
  const c = clean(to);
  if (!c || c === from) return from;
  const merged = categories().find((x) => same(x, c) && x !== from);
  setCategories(merged ? categories().filter((x) => x !== from) : categories().map((x) => (x === from ? c : x)));
  const target = merged || c;
  store.batch(store.all('notes').filter((n) => n.category === from).map((n) => ({ store: 'notes', value: { ...n, category: target } })));
  return target;
}

/** Delete a category: its notes go to Unsorted. Returns an undo. */
export function deleteCategory(name) {
  const before = categories();
  const moved = store.all('notes').filter((n) => n.category === name);
  setCategories(before.filter((x) => x !== name));
  store.batch(moved.map((n) => ({ store: 'notes', value: { ...n, category: UNSORTED } })));
  return () => { setCategories(before); store.batch(moved.map((n) => ({ store: 'notes', value: n }))); };
}

export function moveCategory(from, to) {
  const list = [...categories()];
  const [x] = list.splice(from, 1);
  if (x == null) return;
  list.splice(to, 0, x);
  setCategories(list);
}

/** The first line, for titles and toasts. */
export const firstLine = (text, max = 60) => {
  const l = String(text || '').split('\n').find((x) => x.trim())?.trim() || '';
  return l.length > max ? `${l.slice(0, max - 1)}…` : l;
};
