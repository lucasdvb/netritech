// Bills, subscriptions and renewals: what's due, when, and what it costs a month. Each has a next
// due date that moves on by itself when you mark it paid (logging the expense in Money), a reminder
// task a few days before for the ones you pay by hand, and for subscriptions and renewals a "decide
// by" nudge before they renew, when cancelling is still possible. Forgotten subscriptions are
// common and costly; a renewal you see coming is one you can choose (CMA 2023 consumer survey).
import * as store from '../data/store.js';
import { today, addDays, diffDays, fromISO, toISO } from './dates.js';
import { fmt } from './money.js';

export const KINDS = [
  { id: 'bill', label: 'Bill', hint: 'Rent, electricity, phone, insurance' },
  { id: 'subscription', label: 'Subscription', hint: 'Streaming, apps, memberships' },
  { id: 'renewal', label: 'Renewal', hint: 'Yearly: domain, licence, insurance, passport' },
];
export const EVERY = [
  { id: 'week', label: 'Every week', perMonth: 52 / 12 },
  { id: 'month', label: 'Every month', perMonth: 1 },
  { id: 'quarter', label: 'Every 3 months', perMonth: 1 / 3 },
  { id: 'year', label: 'Every year', perMonth: 1 / 12 },
];

export const all = () => store.memo('bills-sorted', ['bills'], () => store.all('bills').filter((b) => !b.archived).sort((a, b) => String(a.next).localeCompare(String(b.next)) || a.name.localeCompare(b.name)));
export const bill = (id) => store.get('bills', id) || null;

/** The date after `date` for a bill that repeats `every`, keeping the day of the month (the 31st → the last day). */
export function after(date, every, anchorDay) {
  if (every === 'week') return addDays(date, 7);
  const d = fromISO(date);
  const months = every === 'quarter' ? 3 : every === 'year' ? 12 : 1;
  const day = anchorDay || d.getDate();
  const t = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate();
  t.setDate(Math.min(day, last));
  return toISO(t);
}

/** What a bill costs a month, on average. */
export const perMonth = (b) => (Number(b.amount) || 0) * (EVERY.find((e) => e.id === b.every)?.perMonth ?? 1);
/** The total of everything a month, and of subscriptions alone. */
export function monthly() {
  const list = all();
  return { total: list.reduce((s, b) => s + perMonth(b), 0), subscriptions: list.filter((b) => b.kind !== 'bill').reduce((s, b) => s + perMonth(b), 0), count: list.length };
}

/** Due within `days` (overdue ones too), soonest first. */
export const upcoming = (days = 14, from = today()) => all().filter((b) => b.next && b.next <= addDays(from, days));
export const daysTo = (b, from = today()) => diffDays(b.next, from);

/** Add or change a bill. Returns the record. */
export function save(id, patch) {
  const cur = id ? bill(id) : null;
  const next = patch.next ?? cur?.next ?? today();
  const value = { kind: 'bill', every: 'month', remindDays: 3, autopay: false, ...cur, ...patch, next, anchorDay: patch.next ? fromISO(patch.next).getDate() : cur?.anchorDay ?? fromISO(next).getDate() };
  value.name = String(value.name || 'Bill').trim().slice(0, 60) || 'Bill';
  value.amount = Math.max(0, Math.round((Number(value.amount) || 0) * 100) / 100);
  return store.put('bills', value);
}

/**
 * Mark the one due as paid: the expense goes into Money (on the day you pay), the next due date
 * moves on, and its reminder task is ticked. Returns an undo.
 */
export function pay(id, date = today()) {
  const b = bill(id);
  if (!b) return () => {};
  const expense = { id: `bill:${b.id}:${b.next}`, date, amount: b.amount, category: b.category || 'home', note: b.name, billId: b.id };
  const task = store.get('tasks', taskId(b));
  const ops = [
    { store: 'bills', value: { ...b, next: after(b.next, b.every, b.anchorDay), lastPaid: date } },
    ...(b.amount > 0 ? [{ store: 'expenses', value: expense }] : []),
    ...(task && !task.done ? [{ store: 'tasks', value: { ...task, done: true, doneAt: new Date().toISOString() } }] : []),
  ];
  store.batch(ops);
  return () => store.batch([{ store: 'bills', value: b }, ...(b.amount > 0 ? [{ store: 'expenses', delete: expense.id }] : []), ...(task ? [{ store: 'tasks', value: task }] : [])]);
}

/** Skip this one (not paid, not due any more: a month off, a free period). Returns an undo. */
export function skip(id) {
  const b = bill(id);
  if (!b) return () => {};
  store.put('bills', { ...b, next: after(b.next, b.every, b.anchorDay) });
  return () => store.put('bills', b);
}

const taskId = (b) => `t-bill-${b.id}-${b.next}`;
/** For a subscription or renewal: the last day to decide whether to keep it (a few days before it renews). */
export const decideBy = (b) => (b.kind === 'bill' ? null : addDays(b.next, -Math.max(1, Number(b.remindDays) || 3)));

/**
 * The reminder tasks: one per bill you pay by hand, dated a few days before it's due; one "keep or
 * cancel?" for a subscription or renewal before it renews. Made once each (stable ids), on open.
 */
export function ensureTasks(from = today()) {
  const ops = [];
  let order = store.all('tasks').reduce((m, x) => Math.max(m, x.order ?? 0), 0);
  for (const b of all()) {
    if (!b.next) continue;
    const lead = Math.max(0, Number(b.remindDays) || 3);
    const on = addDays(b.next, -lead);
    if (on > from) continue;
    const id = taskId(b);
    if (store.get('tasks', id)) continue;
    const money = b.amount ? ` (${fmt(b.amount)})` : '';
    const base = { id, date: on < from ? from : on, done: false, doneAt: null, area: 'life', repeat: null, order: ++order, source: `bill:${b.id}` };
    if (b.kind === 'bill' && !b.autopay) ops.push({ store: 'tasks', value: { ...base, title: `Pay ${b.name}${money}`, notes: `Due ${b.next}. Mark it paid in Money › Bills to log it.` } });
    else if (b.kind !== 'bill') ops.push({ store: 'tasks', value: { ...base, title: `${b.name} renews ${b.next}: keep it?`, notes: 'Cancel before it renews if you no longer use it.' } });
  }
  if (ops.length) store.batch(ops);
  return ops.length;
}

/** Remove a bill (its past expenses stay in Money). Returns an undo. */
export function remove(id) {
  const b = bill(id);
  if (!b) return () => {};
  store.remove('bills', id);
  return () => store.put('bills', b);
}
