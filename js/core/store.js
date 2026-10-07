// Local-first data layer: every store is mirrored in memory for instant reads,
// writes update memory first and persist to IndexedDB in the background.
// Failed writes are rolled back and reported as a friendly 'error' event.
import * as idb from '../db/idb.js';
import { CACHED } from '../db/schema.js';

const cache = Object.create(null);
const dateIndex = Object.create(null);
const listeners = new Set();
const versions = Object.create(null);
const memos = new Map();
let changed = new Set();
let scheduled = false;
let writes = Promise.resolve();

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
export const now = () => new Date().toISOString();

export async function init() {
  await idb.open();
  const results = await Promise.all(CACHED.map((s) => idb.getAll(s)));
  CACHED.forEach((s, i) => {
    cache[s] = new Map(results[i].map((r) => [r.id, r]));
  });
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(store) {
  changed.add(store);
  versions[store] = (versions[store] || 0) + 1;
  delete dateIndex[store];
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    const stores = changed;
    changed = new Set();
    for (const fn of listeners) fn({ type: 'change', stores });
  });
}

function fail(err, message) {
  console.error(err);
  for (const fn of listeners) fn({ type: 'error', message });
}

function queue(task, rollback, message = 'Couldn’t save that entry. Your data is still safe. Try again.') {
  writes = writes.then(task).catch((err) => {
    rollback();
    fail(err, message);
  });
  return writes;
}

/** Cache a derived value until any of the listed stores changes. */
export function memo(key, stores, fn) {
  const stamp = stores.map((s) => versions[s] || 0).join('.');
  const hit = memos.get(key);
  if (hit && hit.stamp === stamp) return hit.value;
  const value = fn();
  memos.set(key, { stamp, value });
  if (memos.size > 5000) memos.clear();
  return value;
}

export const all = (store) => [...cache[store].values()];
export const get = (store, id) => cache[store].get(id);
export const has = (store, id) => cache[store].has(id);
export const count = (store) => cache[store].size;

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

export function put(store, record) {
  const ts = now();
  const prev = cache[store].get(record.id);
  const rec = { ...record, id: record.id || uid(), createdAt: record.createdAt || prev?.createdAt || ts, updatedAt: ts };
  cache[store].set(rec.id, rec);
  emit(store);
  queue(() => idb.put(store, rec), () => {
    if (prev) cache[store].set(rec.id, prev);
    else cache[store].delete(rec.id);
    emit(store);
  });
  return rec;
}

export function update(store, id, patch) {
  const prev = cache[store].get(id);
  if (!prev) return null;
  return put(store, { ...prev, ...patch });
}

export function remove(store, id) {
  const prev = cache[store].get(id);
  if (!prev) return;
  cache[store].delete(id);
  emit(store);
  queue(() => idb.del(store, id), () => {
    cache[store].set(id, prev);
    emit(store);
  }, 'Couldn’t delete that. Nothing was lost. Try again.');
}

/** Several writes that must land together. ops: [{store, value}] | [{store, delete: id}] */
export function batch(ops) {
  const ts = now();
  const undo = [];
  const persisted = ops.map((op) => {
    const prev = cache[op.store].get(op.delete ?? op.value.id);
    undo.push({ store: op.store, id: op.delete ?? op.value.id, prev });
    if ('delete' in op) {
      cache[op.store].delete(op.delete);
      return op;
    }
    const value = { ...op.value, id: op.value.id || uid(), createdAt: op.value.createdAt || prev?.createdAt || ts, updatedAt: ts };
    cache[op.store].set(value.id, value);
    return { store: op.store, value };
  });
  new Set(ops.map((o) => o.store)).forEach(emit);
  queue(() => idb.batch(persisted), () => {
    for (const u of undo.reverse()) {
      if (u.prev) cache[u.store].set(u.id, u.prev);
      else cache[u.store].delete(u.id);
      emit(u.store);
    }
  });
  return persisted.filter((p) => p.value).map((p) => p.value);
}

/** Wait for every queued write to reach disk. */
export const flush = () => writes;

/** Reload memory from disk after bulk operations such as restore. */
export async function reload() {
  await flush();
  await init();
  CACHED.forEach(emit);
}

// Photo blobs live outside the memory cache.
export const blobs = {
  get: (id) => idb.get('photoBlobs', id),
  put: (id, blob) => idb.put('photoBlobs', { id, blob, createdAt: now(), updatedAt: now() }),
  del: (id) => idb.del('photoBlobs', id),
  all: () => idb.getAll('photoBlobs'),
};

export const settings = () => cache.settings.get('app');
export const profile = () => cache.profile.get('me');
export const setSettings = (patch) => put('settings', { ...settings(), ...patch });
export const setProfile = (patch) => put('profile', { ...profile(), ...patch });
