// Tasks: the one-off and repeating to-dos, like the "Tasks" column of the workbook's Week Plan.
// The day's Top 3 are tasks too, with a rank of 1 to 3 (one task system, DR-07). A repeating
// task is a chain of single tasks: finishing one creates the next, so a slipped week never piles up.
import * as store from '../data/store.js';
import { today, addDays, weekday, fromISO, toISO, dayOf } from './dates.js';

const ORD = ['', 'st', 'nd', 'rd'];
const ordinal = (n) => `${n}${(n % 100 > 10 && n % 100 < 14) ? 'th' : ORD[n % 10] || 'th'}`;
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const sortOpen = (a, b) => (a.date || '9999').localeCompare(b.date || '9999') || (a.order ?? 0) - (b.order ?? 0)
  || (a.createdAt || '').localeCompare(b.createdAt || '');

export const all = () => store.all('tasks');
export const task = (id) => store.get('tasks', id);
export const open = () => store.memo('tasks:open', ['tasks'], () => all().filter((t) => !t.done).sort(sortOpen));

/** Open tasks dated before `ref`. */
export const overdue = (ref = today()) => open().filter((t) => t.date && t.date < ref);
/** Everything dated `date`, open first. */
export const onDay = (date) => all().filter((t) => t.date === date).sort((a, b) => Number(a.done) - Number(b.done) || sortOpen(a, b));
/** Open tasks with no date. */
export const anytime = () => open().filter((t) => !t.date);
/** Open tasks dated after `from`. */
export const later = (from = today()) => open().filter((t) => t.date && t.date > from);
/** Local calendar day a task was ticked off. */
export const doneDay = (t) => (t.doneAt ? dayOf(new Date(t.doneAt)) : null);
/** Finished in the last `days` days, newest first. */
export const doneRecently = (days = 14) => {
  const since = addDays(today(), -days);
  return all().filter((t) => t.done && doneDay(t) >= since).sort((a, b) => (a.doneAt < b.doneAt ? 1 : -1));
};

/** What Today shows: overdue items, the day's own tasks, and late ones ticked off today (only the day's own when looking back). */
export function forToday(date = today()) {
  const own = onDay(date);
  if (date !== today()) return own;
  const lateDone = all().filter((t) => t.done && t.date && t.date < date && doneDay(t) === date);
  return [...overdue(date), ...own.filter((t) => !t.done), ...lateDone, ...own.filter((t) => t.done)];
}

/* ---------- repeats ---------- */
export const REPEATS = [
  { id: 'none', label: 'Doesn’t repeat' },
  { id: 'weekly', label: 'Every week' },
  { id: 'monthly', label: 'Every month' },
];

export function repeatLabel(r) {
  if (!r) return '';
  if (r.kind === 'weekly') return `Every ${DAY_NAMES[r.day]}`;
  if (r.kind === 'monthly') return `Monthly on the ${ordinal(r.day)}`;
  return '';
}

const monthDay = (y, m, d) => toISO(new Date(y, m, Math.min(d, new Date(y, m + 1, 0).getDate())));

/** First occurrence on or after `from`. */
export function firstDate(r, from = today()) {
  if (!r) return null;
  if (r.kind === 'weekly') return addDays(from, (r.day - weekday(from) + 7) % 7);
  if (r.kind === 'monthly') {
    const f = fromISO(from);
    const cand = monthDay(f.getFullYear(), f.getMonth(), r.day);
    return cand >= from ? cand : monthDay(f.getFullYear(), f.getMonth() + 1, r.day);
  }
  return null;
}

/** Next occurrence strictly after `after`. */
export const nextDate = (r, after) => firstDate(r, addDays(after, 1));

/* ---------- writes ---------- */
export function add({ title, date = null, area = 'life', repeat = null, notes = '', projectId = null }) {
  const t = (title || '').trim();
  if (!t) return null;
  const maxOrder = all().reduce((m, x) => Math.max(m, x.order ?? 0), 0);
  return store.put('tasks', { id: store.uid(), title: t, notes, area, repeat, date: date || (repeat ? firstDate(repeat) : null),
    done: false, doneAt: null, order: maxOrder + 1, ...(projectId ? { projectId } : {}) });
}

export function save(id, patch) {
  const cur = task(id);
  if (!cur) return null;
  const next = { ...cur, ...patch, title: (patch.title ?? cur.title).trim() || cur.title };
  if (next.repeat && !next.date) next.date = firstDate(next.repeat);
  return store.put('tasks', next);
}

/** Tick or untick. Finishing a repeating task schedules its next one; unticking takes that back if untouched. */
export function toggle(id) {
  const t = task(id);
  if (!t) return false;
  if (!t.done) {
    const ops = [];
    let nextId = null;
    if (t.repeat) {
      const base = t.date && t.date > today() ? t.date : today();
      nextId = store.uid();
      const { id: _i, createdAt: _c, updatedAt: _u, doneAt: _d, nextId: _n, ...rest } = t;
      ops.push({ store: 'tasks', value: { ...rest, id: nextId, date: nextDate(t.repeat, base), done: false, doneAt: null } });
    }
    ops.unshift({ store: 'tasks', value: { ...t, done: true, doneAt: new Date().toISOString(), nextId } });
    store.batch(ops);
    return true;
  }
  const ops = [{ store: 'tasks', value: { ...t, done: false, doneAt: null, nextId: null } }];
  const nx = t.nextId && task(t.nextId);
  if (nx && !nx.done && nx.updatedAt === nx.createdAt) ops.push({ store: 'tasks', delete: nx.id });
  store.batch(ops);
  return false;
}

export const remove = (id) => store.remove('tasks', id);

/** Move every unfinished task dated on or before `from` to `to`. Returns how many moved. */
export function moveUnfinished(from, to) {
  const list = open().filter((t) => t.date && t.date <= from);
  if (list.length) store.batch(list.map((t) => ({ store: 'tasks', value: { ...t, date: to } })));
  return list.length;
}

/* ---------- priorities: the day's Top 3 (DR-07) ---------- */
export const RANKS = 3;

/** A day's priorities in rank order (at most three, slots may be empty). */
export const priorities = (date) => store.memo(`tasks:pri:${date}`, ['tasks'], () => all().filter((t) => t.rank && t.date === date).sort((a, b) => a.rank - b.rank));
/** The three slots for a day: a task or null. */
export const slots = (date) => Array.from({ length: RANKS }, (_, i) => priorities(date).find((t) => t.rank === i + 1) || null);

/** Write the priority in slot i (0–2). An empty title removes it. */
export function setPriority(date, i, title) {
  const t = (title || '').trim();
  const cur = slots(date)[i];
  if (!t) { if (cur) store.remove('tasks', cur.id); return null; }
  if (cur) return cur.title === t ? cur : store.put('tasks', { ...cur, title: t });
  const maxOrder = all().reduce((m, x) => Math.max(m, x.order ?? 0), 0);
  return store.put('tasks', { id: store.uid(), title: t, notes: '', area: 'work', repeat: null, date, rank: i + 1, done: false, doneAt: null, order: maxOrder + 1 });
}

/** Move the priority in slot `from` to slot `to`; the others shift. */
export function movePriority(date, from, to) {
  const list = slots(date);
  if (to < 0 || to >= RANKS || from === to) return;
  const [it] = list.splice(from, 1);
  list.splice(to, 0, it);
  const ops = list.map((t, i) => (t && t.rank !== i + 1 ? { store: 'tasks', value: { ...t, rank: i + 1 } } : null)).filter(Boolean);
  if (ops.length) store.batch(ops);
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

/** Friendly due label relative to today. */
export function dueLabel(date, ref = today()) {
  if (!date) return 'Anytime';
  const d = Math.round((fromISO(date) - fromISO(ref)) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d < 0) return `${-d} days ago`;
  if (d < 7) return DAY_NAMES[weekday(date)];
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(fromISO(date));
}
