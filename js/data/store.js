// Local-first data layer: every store is mirrored in memory for instant reads.
// Writes update memory first, then reach storage in the background: everything written
// in the same moment goes to disk in one transaction. A failed write is rolled back and
// reported as a friendly 'error' event.
//
// Each record carries an envelope (createdAt, updatedAt, rev, and tz on dated records).
// Deleting leaves a tombstone on disk, and every change to your data leaves its latest
// entry in the outbox, so a sync can be added later without changing screens or rules.
import * as idbAdapter from './adapter-idb.js';
import { CACHED, LOCAL_ONLY, DERIVED } from './schema.js';

let adapter = idbAdapter;
/** Swap the storage backend (the unit tests use the in-memory adapter). Call before init(). */
export function useAdapter(next) { adapter = next; }

const cache = Object.create(null);   // store → Map(id → live record)
const tombs = Object.create(null);   // store → Map(id → tombstone), so revisions keep counting
const dateIndex = Object.create(null);
const listeners = new Set();
const versions = Object.create(null);
const memos = new Map();
const MEMO_LIMIT = 20000;
// When each date's data last changed (a running count), so what's worked out from the past can
// stay cached while you log today (see changedBefore).
const dateStamps = new Map();
let stampSeq = 0;
let changed = new Set();
let changedDates = new Set();
let scheduled = false;
let pending = [];
let draining = false;
let writes = Promise.resolve();

const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { return null; } })();

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
export const now = () => new Date().toISOString();

export async function init() {
  await adapter.open();
  memos.clear(); // the data is being replaced, so nothing derived from it still holds
  const results = await Promise.all(CACHED.map((s) => adapter.getAll(s)));
  CACHED.forEach((s, i) => {
    const live = new Map();
    const dead = new Map();
    for (const r of results[i]) (r.deletedAt ? dead : live).set(r.id, r);
    cache[s] = live;
    tombs[s] = dead;
    delete dateIndex[s];
  });
}

/** Listeners get {type: 'change', stores, dates} (dates your data changed on) or {type: 'error', message}. */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(store, records = []) {
  changed.add(store);
  versions[store] = (versions[store] || 0) + 1;
  delete dateIndex[store];
  if (!DERIVED.has(store)) for (const r of records) if (r?.date) { changedDates.add(r.date); dateStamps.set(r.date, ++stampSeq); }
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    const stores = changed;
    const dates = changedDates;
    changed = new Set();
    changedDates = new Set();
    for (const fn of listeners) fn({ type: 'change', stores, dates });
  });
}

function fail(err, message) {
  console.error(err);
  for (const fn of listeners) fn({ type: 'error', message });
}

/* ---------- writing ---------- */

const SAVE_FAILED = 'Couldn’t save that entry. Your data is still safe. Try again.';
const DELETE_FAILED = 'Couldn’t delete that. Nothing was lost. Try again.';

// Queue disk operations; everything queued in the same moment lands in one transaction.
function enqueue(ops, rollback, message) {
  pending.push({ ops, rollback, message });
  if (!draining) {
    draining = true;
    queueMicrotask(drain);
  }
}

function drain() {
  draining = false;
  if (!pending.length) return writes;
  const group = pending;
  pending = [];
  const ops = group.flatMap((g) => g.ops);
  writes = writes.then(() => adapter.write(ops)).catch((err) => {
    for (const g of [...group].reverse()) g.rollback();
    fail(err, group[group.length - 1].message);
  });
  return writes;
}

/** Send anything queued to disk now, and resolve once every write has landed. */
export const flush = () => drain();

const outboxEntry = (store, rec, op) => ({ store: 'outbox', value: { id: `${store}:${rec.id}`, store, recId: rec.id, op, rev: rec.rev, at: rec.updatedAt } });

/** A record with its envelope filled in, ready to write. */
function stamp(store, record, ts) {
  const id = record.id || uid();
  const prev = cache[store].get(id);
  const base = prev || tombs[store].get(id);
  const rec = { ...record, id, createdAt: record.createdAt || prev?.createdAt || ts, updatedAt: ts, rev: (base?.rev || 0) + 1 };
  delete rec.deletedAt;
  if (rec.date && !rec.tz) {
    const tz = prev?.tz || TZ;
    if (tz) rec.tz = tz;
  }
  return rec;
}

function tombstoneOf(prev, ts) {
  const t = { id: prev.id, createdAt: prev.createdAt, updatedAt: ts, deletedAt: ts, rev: (prev.rev || 0) + 1 };
  if (prev.date) t.date = prev.date;
  return t;
}

// Memory side of one operation: applies it and returns how to persist and how to undo it.
function apply(store, op, ts) {
  if (!('delete' in op) && !op.value.id) op = { ...op, value: { ...op.value, id: uid() } };
  const id = op.delete ?? op.value.id;
  const prev = cache[store].get(id);
  const prevTomb = tombs[store].get(id);
  const undo = () => {
    if (prev) cache[store].set(prev.id, prev);
    else cache[store].delete(id);
    if (prevTomb) tombs[store].set(prevTomb.id, prevTomb);
    else tombs[store].delete(id);
  };
  if ('delete' in op) {
    if (!prev) return null;
    cache[store].delete(id);
    if (LOCAL_ONLY.has(store)) return { disk: [{ store, delete: id }], undo, touched: [prev], prev };
    const t = tombstoneOf(prev, ts);
    tombs[store].set(id, t);
    return { disk: [{ store, value: t }, outboxEntry(store, t, 'delete')], undo, touched: [prev], prev };
  }
  const rec = stamp(store, op.value, ts);
  cache[store].set(rec.id, rec);
  tombs[store].delete(rec.id);
  const disk = [{ store, value: rec }];
  if (!LOCAL_ONLY.has(store)) disk.push(outboxEntry(store, rec, 'put'));
  return { disk, undo, touched: [rec, prev], value: rec };
}

export function put(store, record) {
  return batch([{ store, value: record }])[0];
}

export function update(store, id, patch) {
  const prev = cache[store].get(id);
  if (!prev) return null;
  return put(store, { ...prev, ...patch });
}

/** Deletes a record (leaving a tombstone) and returns what it was, so callers can offer Undo. */
export function remove(store, id) {
  const prev = cache[store].get(id);
  if (!prev) return null;
  batch([{ store, delete: id }], DELETE_FAILED);
  return prev;
}

/** Several writes that must land together. ops: [{store, value}] | [{store, delete: id}] */
export function batch(ops, message = SAVE_FAILED) {
  const ts = now();
  const applied = [];
  for (const op of ops) {
    const res = apply(op.store, op, ts);
    if (res) applied.push({ store: op.store, ...res });
  }
  if (!applied.length) return [];
  const byStore = new Map();
  for (const a of applied) byStore.set(a.store, [...(byStore.get(a.store) || []), ...a.touched]);
  byStore.forEach((recs, store) => emit(store, recs));
  enqueue(applied.flatMap((a) => a.disk), () => {
    for (const a of [...applied].reverse()) a.undo();
    byStore.forEach((recs, store) => emit(store, recs));
  }, message);
  return applied.filter((a) => a.value).map((a) => a.value);
}

/* ---------- reading ---------- */

const stampOf = (stores) => stores.map((s) => versions[s] || 0).join('.');
/** Cache a derived value until any of the listed stores changes (or `extra`, when given, differs). */
export function memo(key, stores, fn, extra = '') {
  const stamp = stampOf(stores) + extra;
  const hit = memos.get(key);
  if (hit && hit.stamp === stamp) return hit.value;
  const value = fn();
  memos.set(key, { stamp, stores, value });
  // Past the limit, drop what no longer holds first; only if that isn't enough, start over.
  if (memos.size > MEMO_LIMIT) {
    for (const [k, m] of memos) if (m.stamp !== stampOf(m.stores)) memos.delete(k);
    if (memos.size > MEMO_LIMIT) memos.clear();
  }
  return value;
}

export const all = (store) => [...cache[store].values()];
export const get = (store, id) => cache[store].get(id);
export const has = (store, id) => cache[store].has(id);
export const count = (store) => cache[store].size;
/** The tombstone left by deleting a record, if any. */
export const deleted = (store, id) => tombs[store]?.get(id);

/** A stamp that changes whenever data dated before `date` changes (for memo's `extra`). */
export function changedBefore(date) {
  let m = 0;
  for (const [d, v] of dateStamps) if (d < date && v > m) m = v;
  return `|${m}`;
}

/** Records of a date-indexed store for one date (cached per store until it changes). */
export function onDate(store, date) {
  let idx = dateIndex[store];
  if (!idx) {
    idx = new Map();
    for (const r of cache[store].values()) {
      if (!r.date) continue;
      let list = idx.get(r.date);
      if (!list) idx.set(r.date, (list = []));
      list.push(r);
    }
    dateIndex[store] = idx;
  }
  return idx.get(date) || [];
}

export function where(store, fn) {
  const out = [];
  for (const r of cache[store].values()) if (fn(r)) out.push(r);
  return out;
}

/** Reload memory from disk after bulk operations such as restore. */
export async function reload() {
  await flush();
  await init();
  CACHED.forEach((s) => emit(s));
}

/** Direct access to the storage adapter, for bulk operations (restore, erase, safety backups). */
export const disk = () => adapter;

// Photo data lives outside the memory cache and is read on demand.
export const blobs = {
  async get(id) {
    const r = await adapter.get('photoBlobs', id);
    return r && !r.deletedAt ? r : null;
  },
  async put(id, blob) {
    const ts = now();
    const prev = await adapter.get('photoBlobs', id);
    const rec = { id, blob, createdAt: (!prev?.deletedAt && prev?.createdAt) || ts, updatedAt: ts, rev: (prev?.rev || 0) + 1 };
    await adapter.write([{ store: 'photoBlobs', value: rec }, outboxEntry('photoBlobs', rec, 'put')]);
  },
  async del(id) {
    const prev = await adapter.get('photoBlobs', id);
    if (!prev || prev.deletedAt) return;
    const t = tombstoneOf(prev, now());
    await adapter.write([{ store: 'photoBlobs', value: t }, outboxEntry('photoBlobs', t, 'delete')]);
  },
  all: async () => (await adapter.getAll('photoBlobs')).filter((b) => !b.deletedAt),
};

export const settings = () => cache.settings.get('app');
export const profile = () => cache.profile.get('me');
export const setSettings = (patch) => put('settings', { ...settings(), ...patch });
export const setProfile = (patch) => put('profile', { ...profile(), ...patch });
