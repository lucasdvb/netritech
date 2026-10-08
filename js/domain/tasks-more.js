// The task actions only the Tasks screen and the sheets need (lists by when, repeats, moving and
// ranking). Re-exports everything in tasks.js, which Today loads at first render.
import * as store from '../data/store.js';
import { today, addDays } from './dates.js';
import { open, all, task, doneDay, priorities, slots, RANKS } from './tasks.js';
export * from './tasks.js';

/** Open tasks with no date. */
export const anytime = () => open().filter((t) => !t.date);
/** Open tasks dated after `from`. */
export const later = (from = today()) => open().filter((t) => t.date && t.date > from);

/** Finished in the last `days` days, newest first. */
export const doneRecently = (days = 14) => {
  const since = addDays(today(), -days);
  return all().filter((t) => t.done && doneDay(t) >= since).sort((a, b) => (a.doneAt < b.doneAt ? 1 : -1));
};

/* ---------- repeats ---------- */
export const REPEATS = [
  { id: 'none', label: 'Doesn’t repeat' },
  { id: 'weekly', label: 'Every week' },
  { id: 'monthly', label: 'Every month' },
];

export const remove = (id) => store.remove('tasks', id);

/**
 * Move every unfinished task dated on or before `from` to `to`. Returns how many moved. A priority
 * keeps its place only if that slot is free on `to` (the most recent day wins); the rest move as
 * plain tasks, so a day never holds two of the same rank.
 */
export function moveUnfinished(from, to) {
  const list = open().filter((t) => t.date && t.date <= from).reverse();
  if (!list.length) return 0;
  const taken = new Set(priorities(to).map((t) => t.rank));
  store.batch(list.map((t) => {
    const rank = t.rank && !taken.has(t.rank) ? t.rank : null;
    if (rank) taken.add(rank);
    return { store: 'tasks', value: { ...t, date: to, rank } };
  }));
  return list.length;
}

/** Put a title first on a day's list (the shutdown's "tomorrow's first priority"). Others move down; a fourth drops its rank. */
export function addFirstPriority(date, title) {
  const t = (title || '').trim();
  if (!t) return;
  const list = slots(date).filter(Boolean);
  if (list.some((x) => x.title === t)) return;
  const maxOrder = all().reduce((m, x) => Math.max(m, x.order ?? 0), 0);
  store.batch([
    { store: 'tasks', value: { id: store.uid(), title: t, notes: '', area: 'work', repeat: null, date, rank: 1, done: false, doneAt: null, order: maxOrder + 1 } },
    ...list.map((x, i) => ({ store: 'tasks', value: { ...x, rank: i + 2 <= RANKS ? i + 2 : null } })),
  ]);
}

/** Make an open task one of a day's priorities, in the first free slot. Returns false when all three are taken. */
export function promote(id, date = today()) {
  const t = task(id);
  const free = slots(date).findIndex((x) => !x);
  if (!t || free < 0) return false;
  store.put('tasks', { ...t, date, rank: free + 1 });
  return true;
}
export const demote = (id) => { const t = task(id); if (t) store.put('tasks', { ...t, rank: null }); };
