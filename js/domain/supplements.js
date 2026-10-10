// Supplements and medication: what you take, when, how much is left and when to reorder. Each has
// its times of day; taking a dose is one tap (and counts the stock down); when what's left covers
// fewer days than the reorder point, a "reorder" task appears once. Medication can be marked so its
// reminder is never paused (away, trips, quiet days). Linking a dose to a time and a routine you
// already have is what makes adherence stick (implementation intentions: Gollwitzer & Sheeran
// 2006; WHO 2003 on adherence to long-term therapies).
import * as store from '../data/store.js';
import { today, addDays } from './dates.js';

export const all = () => store.memo('supplements-sorted', ['supplements'], () => store.all('supplements').filter((s) => !s.archived).sort((a, b) => Number(b.kind === 'medication') - Number(a.kind === 'medication') || (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)));
export const one = (id) => store.get('supplements', id);

const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
const cleanTimes = (ts) => [...new Set((ts || []).filter((t) => HM.test(t)))].sort();

export function save(id, patch) {
  const cur = id ? one(id) : null;
  const order = cur?.order ?? Math.max(-1, ...store.all('supplements').map((s) => s.order ?? 0)) + 1;
  const v = { kind: 'supplement', dose: '', perDose: 1, times: ['08:00'], stock: null, reorderDays: 7, ...cur, ...patch, order };
  v.name = String(v.name || 'Supplement').trim().slice(0, 60) || 'Supplement';
  v.times = cleanTimes(v.times);
  if (!v.times.length) v.times = ['08:00'];
  v.perDose = Math.max(0.25, Number(v.perDose) || 1);
  v.stock = v.stock === '' || v.stock == null ? null : Math.max(0, Number(v.stock) || 0);
  return store.put('supplements', v);
}

const logId = (date, sid, time) => `${date}:${sid}:${time}`;
export const taken = (sid, time, date = today()) => !!store.get('supplementLogs', logId(date, sid, time));

/** Today's doses in time order: [{ s, time, taken }]. */
export function doses(date = today()) {
  const out = [];
  for (const s of all()) for (const time of s.times) out.push({ s, time, taken: taken(s.id, time, date) });
  return out.sort((a, b) => a.time.localeCompare(b.time) || a.s.name.localeCompare(b.s.name));
}

/** Take (or untake) a dose: logged, and the stock counts down (or back up). Returns an undo. */
export function toggle(sid, time, date = today()) {
  const s = one(sid);
  if (!s) return () => {};
  const id = logId(date, sid, time);
  const was = store.get('supplementLogs', id);
  const ops = [was ? { store: 'supplementLogs', delete: id } : { store: 'supplementLogs', value: { id, date, supplementId: sid, time, at: new Date().toISOString() } }];
  if (s.stock != null) ops.push({ store: 'supplements', value: { ...s, stock: Math.max(0, Math.round((s.stock + (was ? 1 : -1) * s.perDose) * 100) / 100) } });
  store.batch(ops);
  return () => store.batch([was ? { store: 'supplementLogs', value: was } : { store: 'supplementLogs', delete: id }, { store: 'supplements', value: s }]);
}

/** Days the stock lasts at your dose (null without a stock count). */
export const daysLeft = (s) => (s.stock == null ? null : Math.floor(s.stock / (s.perDose * Math.max(1, s.times.length))));
export const runningLow = (s) => { const d = daysLeft(s); return d != null && d <= (Number(s.reorderDays) || 7); };

/** Restock: add what you bought. Returns an undo. */
export function restock(sid, amount) {
  const s = one(sid);
  if (!s) return () => {};
  store.put('supplements', { ...s, stock: (s.stock || 0) + Math.max(0, Number(amount) || 0), restockedOn: today() });
  const t = store.get('tasks', reorderTaskId(s));
  if (t && !t.done) store.put('tasks', { ...t, done: true, doneAt: new Date().toISOString() });
  return () => { store.put('supplements', s); if (t) store.put('tasks', t); };
}

const reorderTaskId = (s) => `t-reorder-${s.id}-${s.restockedOn || 'first'}`;
/** A "reorder" task for each one running low, once per restock. */
export function ensureTasks(date = today()) {
  const ops = [];
  let order = store.all('tasks').reduce((m, x) => Math.max(m, x.order ?? 0), 0);
  for (const s of all()) {
    if (!runningLow(s)) continue;
    const id = reorderTaskId(s);
    if (store.get('tasks', id)) continue;
    const d = daysLeft(s);
    ops.push({ store: 'tasks', value: { id, title: `Reorder ${s.name}`, notes: `${d} day${d === 1 ? '' : 's'} left at your dose. Restock it in Body › Supplements when it arrives.`, date, done: false, doneAt: null, area: 'health', repeat: null, order: ++order, source: `supplement:${s.id}` } });
  }
  if (ops.length) store.batch(ops);
  return ops.length;
}

/** How consistently you've taken it: share of doses logged over the last `days`. */
export function adherence(sid, days = 14, end = today()) {
  const s = one(sid);
  if (!s) return null;
  const since = s.createdAt ? s.createdAt.slice(0, 10) : addDays(end, -(days - 1));
  let due = 0;
  let got = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(end, -i);
    if (d < since) break;
    for (const t of s.times) { due++; if (taken(s.id, t, d)) got++; }
  }
  return due ? got / due : null;
}

/** Doses due at a time slot that aren't taken yet (for the reminder). */
export const dueAt = (time, date = today()) => doses(date).filter((x) => x.time === time && !x.taken);
