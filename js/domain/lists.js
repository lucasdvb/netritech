// Lists: plain checklists for the things that aren't tasks (groceries, packing, ideas, gifts).
// A list is one record with its items in order; ticking keeps an item until you clear it, so a
// packing list can be reused by unticking everything.
import * as store from '../data/store.js';

export const lists = () => store.memo('lists-sorted', ['lists'], () => store.all('lists').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
export const list = (id) => store.get('lists', id);
export const counts = (l) => ({ done: (l.items || []).filter((i) => i.done).length, total: (l.items || []).length });

export function create(name = 'New list') {
  const order = Math.max(-1, ...lists().map((l) => l.order ?? 0)) + 1;
  return store.put('lists', { name: name.trim().slice(0, 40) || 'New list', order, items: [] });
}

const edit = (id, fn) => { const l = list(id); return l ? store.put('lists', { ...l, items: fn([...(l.items || [])]) }) : null; };

export const rename = (id, name) => { const t = name.trim(); if (t) store.update('lists', id, { name: t.slice(0, 40) }); };
/** Add one item, or several when pasted one per line. */
export const add = (id, text) => edit(id, (items) => [...items, ...text.split('\n').map((t) => t.trim()).filter(Boolean).map((t) => ({ id: store.uid(), text: t.slice(0, 120), done: false }))]);
export const toggle = (id, itemId) => edit(id, (items) => items.map((i) => (i.id === itemId ? { ...i, done: !i.done } : i)));
export const setText = (id, itemId, text) => { const t = text.trim(); if (t) edit(id, (items) => items.map((i) => (i.id === itemId ? { ...i, text: t.slice(0, 120) } : i))); };
export const removeItem = (id, itemId) => edit(id, (items) => items.filter((i) => i.id !== itemId));
export const clearDone = (id) => edit(id, (items) => items.filter((i) => !i.done));
export const uncheckAll = (id) => edit(id, (items) => items.map((i) => ({ ...i, done: false })));
export function moveItem(id, from, to) {
  return edit(id, (items) => { const [x] = items.splice(from, 1); items.splice(to, 0, x); return items; });
}
export function move(from, to) {
  const all = [...lists()];
  const [l] = all.splice(from, 1);
  if (!l) return;
  all.splice(to, 0, l);
  store.batch(all.map((x, i) => (x.order === i ? null : { store: 'lists', value: { ...x, order: i } })).filter(Boolean));
}
