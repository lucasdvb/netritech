// Tasks: the one-off and repeating to-dos, like the "Tasks" column of the workbook's Week Plan.
// The day's Top 3 are tasks too, with a rank of 1 to 3 (one task system, DR-07). A repeating
// task is a chain of single tasks: finishing one creates the next, so a slipped week never piles up.
import * as store from '../data/store.js';
import { today, addDays, weekday, fromISO, toISO, dayOf, cmp } from './dates.js';

const ORD = ['', 'st', 'nd', 'rd'];
const ordinal = (n) => `${n}${(n % 100 > 10 && n % 100 < 14) ? 'th' : ORD[n % 10] || 'th'}`;
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const sortOpen = (a, b) => cmp(a.date || '9999', b.date || '9999') || (a.order ?? 0) - (b.order ?? 0)
  || cmp(a.createdAt || '', b.createdAt || '');

export const all = () => store.all('tasks');
export const task = (id) => store.get('tasks', id);
export const open = () => store.memo('tasks:open', ['tasks'], () => all().filter((t) => !t.done).sort(sortOpen));

/** Open tasks dated before `ref`. */
export const overdue = (ref = today()) => open().filter((t) => t.date && t.date < ref);
/** Everything dated `date`, open first. */
export const onDay = (date) => store.onDate('tasks', date).slice().sort((a, b) => Number(a.done) - Number(b.done) || sortOpen(a, b));
/** Local calendar day a task was ticked off. */
export const doneDay = (t) => (t.doneAt ? dayOf(new Date(t.doneAt)) : null);
/** What Today shows: overdue tasks, the day's own, and late ones ticked off today (looking back: the day's own). */
export function forToday(date = today()) {
  return store.memo(`tasks:today:${date}:${today()}`, ['tasks'], () => {
    const own = onDay(date);
    if (date !== today()) return own;
    const since = addDays(date, -1); // a timestamp from `date` can't be earlier than this in any time zone
    const lateDone = all().filter((t) => t.done && t.date && t.date < date && t.doneAt >= since && doneDay(t) === date);
    return [...overdue(date), ...own.filter((t) => !t.done), ...lateDone, ...own.filter((t) => t.done)];
  });
}

const SHORT_DAYS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** The weekdays of a weekly repeat (older ones hold a single day). */
const daysOf = (r) => (r.days?.length ? [...r.days].sort() : [r.day]);

export function repeatLabel(r) {
  if (!r) return '';
  if (r.kind === 'daily') return (r.n || 1) > 1 ? `Every ${r.n} days` : 'Every day';
  if (r.kind === 'weekly') {
    const d = daysOf(r);
    if (d.length === 1) return `Every ${DAY_NAMES[d[0]]}`;
    if (d.join() === '1,2,3,4,5') return 'Every weekday';
    if (d.join() === '6,7') return 'Every weekend';
    return `Every ${d.map((x) => SHORT_DAYS[x]).join(', ')}`;
  }
  if (r.kind === 'monthly') return `Monthly on the ${ordinal(r.day)}`;
  if (r.kind === 'yearly') return `Every year on ${MONTHS[r.month - 1]} ${r.day}`;
  return '';
}

const monthDay = (y, m, d) => toISO(new Date(y, m, Math.min(d, new Date(y, m + 1, 0).getDate())));

/** First occurrence on or after `from`. */
export function firstDate(r, from = today()) {
  if (!r) return null;
  if (r.kind === 'daily') return from;
  if (r.kind === 'weekly') return daysOf(r).map((d) => addDays(from, (d - weekday(from) + 7) % 7)).sort()[0];
  if (r.kind === 'monthly') {
    const f = fromISO(from);
    const cand = monthDay(f.getFullYear(), f.getMonth(), r.day);
    return cand >= from ? cand : monthDay(f.getFullYear(), f.getMonth() + 1, r.day);
  }
  if (r.kind === 'yearly') {
    const y = fromISO(from).getFullYear();
    const cand = monthDay(y, r.month - 1, r.day);
    return cand >= from ? cand : monthDay(y + 1, r.month - 1, r.day);
  }
  return null;
}

/** Next occurrence strictly after `after` (every n days counts from the one just done). */
export const nextDate = (r, after) => (r?.kind === 'daily' ? addDays(after, Math.max(1, r.n || 1)) : firstDate(r, addDays(after, 1)));

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
  // Cleared: a bare priority typed here goes; a task with anything more to it (notes, a repeat,
  // a project, already done) stays in your tasks and only leaves the Top 3.
  if (!t) {
    if (!cur) return null;
    if (!cur.notes && !cur.repeat && !cur.projectId && !cur.done) store.remove('tasks', cur.id);
    else store.put('tasks', { ...cur, rank: null });
    return null;
  }
  if (cur) return cur.title === t ? cur : store.put('tasks', { ...cur, title: t });
  const maxOrder = all().reduce((m, x) => Math.max(m, x.order ?? 0), 0);
  return store.put('tasks', { id: store.uid(), title: t, notes: '', area: 'work', repeat: null, date, rank: i + 1, done: false, doneAt: null, order: maxOrder + 1 });
}

/** setPriority that returns an undo when it clears a slot (null otherwise). */
export function setPriorityUndoable(date, i, title) {
  const before = slots(date)[i];
  setPriority(date, i, title);
  if (!before || (title || '').trim()) return null;
  return () => store.put('tasks', before);
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

/** Friendly due label relative to today. */
export function dueLabel(date, ref = today()) {
  if (!date) return 'Anytime';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'No date';
  const d = Math.round((fromISO(date) - fromISO(ref)) / 86400000);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d === -1) return 'Yesterday';
  if (d < 0) return `${-d} days ago`;
  if (d < 7) return DAY_NAMES[weekday(date)];
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' }).format(fromISO(date));
}
