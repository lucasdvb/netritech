// Local-first data layer: every store is mirrored in memory for instant reads.
// Writes update memory first, then reach storage in the background: everything written
// in the same moment goes to disk in one transaction. A failed write is rolled back and
// reported as a friendly 'error' event.
//
// Each record carries an envelope (createdAt, updatedAt, rev, and tz on dated records).
// Deleting leaves a tombstone on disk, and every change to your data leaves its latest
// entry in the outbox, so a sync can be added later without changing screens or rules.
import * as idbAdapter from './adapter-idb.js';
import { STORES, CACHED, LOCAL_ONLY, DERIVED, DEFERRED } from './schema.js';

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
// store → (date → when it last changed, a running count). See changedBefore.
const dateStamps = new Map();
let stampSeq = 0;
let changed = new Set();
let changedDates = new Set();
let scheduled = false;
let pending = [];
let draining = false;
let writes = Promise.resolve();
// Each record's writes not yet on disk, so a failed one is undone without undoing a later one.
const unsaved = new Map();

const TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || null; } catch { return null; } })();

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`);
export const now = () => new Date().toISOString();

// Set when another window took the database over (an update opened there): from then on this
// window writes nothing, so nothing half-saves, and it asks once to be reloaded.
let closed = false;

// Opening on Today, workout sets (the biggest store) load only their last three weeks, all Today
// reads, and day summaries none; the rest follows (loadRest). What needs it all waits for complete().
const RECENT_DAYS = 21;
let partial = new Set();
let rest = Promise.resolve();
let restDone = null;
let restFailed = null;
export const complete = () => rest;

function fill(s, rows) {
  const live = new Map();
  const dead = new Map();
  for (const r of rows) (r.deletedAt ? dead : live).set(r.id, r);
  cache[s] = live;
  tombs[s] = dead;
  delete dateIndex[s];
}

/** Load everything into memory. With { recentFirst }, the deferred stores load only their recent days for now. */
export async function init({ recentFirst = false } = {}) {
  adapter.onClosed?.(() => {
    if (closed) return;
    closed = true;
    for (const fn of listeners) fn({ type: 'closed' });
  });
  await adapter.open();
  memos.clear(); // the data is being replaced, so nothing derived from it still holds
  partial = new Set(recentFirst && adapter.getSince ? DEFERRED : []);
  const since = new Date(Date.now() - RECENT_DAYS * 864e5).toISOString().slice(0, 10);
  const first = (s) => (STORES[s].indexes.includes('date') ? adapter.getSince(s, since) : []);
  const results = await Promise.all(CACHED.map((s) => (partial.has(s) ? first(s) : adapter.getAll(s))));
  CACHED.forEach((s, i) => fill(s, results[i]));
  rest = partial.size ? new Promise((resolve, reject) => { restDone = resolve; restFailed = reject; }) : Promise.resolve();
  rest.catch(() => {}); // reported where it's awaited
}

/** Load the rest of the deferred stores (after the first screen). Anything written meanwhile is kept. */
export async function loadRest() {
  if (!partial.size) return;
  const names = [...partial];
  let rows;
  try {
    rows = await Promise.all(names.map((s) => adapter.getAll(s)));
  } catch (err) {
    // A backup waiting for all of it fails rather than saving part.
    restFailed?.(err);
    restDone = restFailed = null;
    throw err;
  }
  const newer = (a, b) => (a.updatedAt || '') > (b?.updatedAt || '');
  names.forEach((s, i) => {
    const mine = cache[s];
    const gone = tombs[s];
    fill(s, rows[i]);
    for (const [id, r] of mine) if (!cache[s].has(id) || newer(r, cache[s].get(id))) cache[s].set(id, r);
    // A delete made meanwhile may not be on the disk yet: it still holds.
    for (const [id, t] of gone) {
      const live = cache[s].get(id);
      if (live && !newer(t, live)) continue; // written again since
      cache[s].delete(id);
      if (newer(t, tombs[s].get(id))) tombs[s].set(id, t);
    }
  });
  partial = new Set();
  memos.clear(); // what was worked out from part of the history no longer holds
  names.forEach((s) => emit(s));
  restDone?.();
  restDone = restFailed = null;
}

/**
 * Listeners get {type: 'change', stores, dates} (dates your data changed on), {type: 'error',
 * message}, or {type: 'closed'} when another window has taken the database over.
 */
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(store, records = []) {
  changed.add(store);
  versions[store] = (versions[store] || 0) + 1;
  delete dateIndex[store];
  if (!DERIVED.has(store)) for (const r of records) if (r?.date) {
    changedDates.add(r.date);
    if (!dateStamps.has(store)) dateStamps.set(store, new Map());
    dateStamps.get(store).set(r.date, ++stampSeq);
  }
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
function enqueue(ops, rollback, message, commit) {
  pending.push({ ops, rollback, message, commit });
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
  writes = writes.then(() => adapter.write(ops)).then(() => {
    for (const g of group) g.commit();
  }, (err) => {
    for (const g of [...group].reverse()) g.rollback();
    if (!closed) fail(err, group[group.length - 1].message);
  });
  return writes;
}

/** Send anything queued to disk now, and resolve once every write has landed. */
export const flush = () => drain();

export const outboxEntry = (store, rec, op) => ({ store: 'outbox', value: { id: `${store}:${rec.id}`, store, recId: rec.id, op, rev: rec.rev, at: rec.updatedAt } });

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

export function tombstoneOf(prev, ts) {
  const t = { id: prev.id, createdAt: prev.createdAt, updatedAt: ts, deletedAt: ts, rev: (prev.rev || 0) + 1 };
  if (prev.date) t.date = prev.date;
  return t;
}

// Memory side of one operation: applies it and returns how to persist and how to undo it.
function apply(store, op, ts) {
  if (!('delete' in op) && !op.value.id) op = { ...op, value: { ...op.value, id: uid() } };
  const id = op.delete ?? op.value.id;
  const prev = cache[store].get(id);
  if ('delete' in op && !prev) return null;
  const w = track(store, id, prev, tombs[store].get(id));
  const undo = () => undoWrite(w);
  const commit = () => commitWrite(w);
  if ('delete' in op) {
    cache[store].delete(id);
    if (LOCAL_ONLY.has(store)) return { disk: [{ store, delete: id }], undo, commit, touched: [prev], prev };
    const t = tombstoneOf(prev, ts);
    tombs[store].set(id, t);
    return { disk: [{ store, value: t }, outboxEntry(store, t, 'delete')], undo, commit, touched: [prev], prev };
  }
  const rec = stamp(store, op.value, ts);
  cache[store].set(rec.id, rec);
  tombs[store].delete(rec.id);
  const disk = [{ store, value: rec }];
  if (!LOCAL_ONLY.has(store)) disk.push(outboxEntry(store, rec, 'put'));
  return { disk, undo, commit, touched: [rec, prev], value: rec };
}

// Writes land in order: when one settles, every older write of the same record has too.
function track(store, id, prev, prevTomb) {
  const key = `${store}\u0000${id}`;
  const w = { store, id, key, prev, prevTomb, older: unsaved.get(key) || null, newer: null };
  if (w.older) w.older.newer = w;
  unsaved.set(key, w);
  return w;
}

function unlink(w) {
  if (w.older) w.older.newer = w.newer;
  if (w.newer) w.newer.older = w.older;
  else if (w.older) unsaved.set(w.key, w.older);
  else unsaved.delete(w.key);
}

/** It reached the disk. */
function commitWrite(w) { unlink(w); }

/** It failed: put back what it replaced, or leave that to a later write still on its way. */
function undoWrite(w) {
  unlink(w);
  if (w.newer) {
    w.newer.prev = w.prev;
    w.newer.prevTomb = w.prevTomb;
    return;
  }
  if (w.prev) cache[w.store].set(w.id, w.prev);
  else cache[w.store].delete(w.id);
  if (w.prevTomb) tombs[w.store].set(w.id, w.prevTomb);
  else tombs[w.store].delete(w.id);
}

export function put(store, record) {
  return batch([{ store, value: record }])[0] ?? (closed ? record : undefined);
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
  if (closed) {
    for (const fn of listeners) fn({ type: 'closed' });
    return [];
  }
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
  }, message, () => { for (const a of applied) a.commit(); });
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

/** For memo's `extra`: changes when data dated before `date` changes (in `stores`, or any). */
export function changedBefore(date, stores = dateStamps.keys()) {
  let m = 0;
  for (const s of stores) for (const [d, v] of dateStamps.get(s) || []) if (v > m && d < date) m = v;
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
  await rest;
  await init();
  CACHED.forEach((s) => emit(s));
}

/** Direct access to the storage adapter, for bulk operations (restore, erase, safety backups). */
export const disk = () => adapter;

// Never missing: an empty record stands in until there is one (a restore without them, say).
export const settings = () => cache.settings.get('app') || { id: 'app' };
export const profile = () => cache.profile.get('me') || { id: 'me' };
export const setSettings = (patch) => put('settings', { ...settings(), ...patch });
export const setProfile = (patch) => put('profile', { ...profile(), ...patch });
