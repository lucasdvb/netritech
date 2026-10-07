// Storage adapter for IndexedDB. The store talks only to this interface
// (open, getAll, get, write, replaceAll, clearAll), so another adapter, such as
// a sync-backed one, can replace it without touching screens or rules.
import { DB_NAME, DB_VERSION, STORES } from './schema.js';

let dbp = null;

const req = (r) => new Promise((resolve, reject) => {
  r.onsuccess = () => resolve(r.result);
  r.onerror = () => reject(r.error);
});

const done = (tx) => new Promise((resolve, reject) => {
  tx.oncomplete = () => resolve();
  tx.onerror = () => reject(tx.error);
  tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
});

// Ask the browser to commit now instead of waiting for the next task.
const commit = (tx) => { try { tx.commit?.(); } catch { /* already committing */ } };

export function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    // Structural upgrades only ever add stores and indexes, so they can't lose data.
    // Changes to the data itself run later as migrations, after a safety backup.
    r.onupgradeneeded = () => {
      const db = r.result;
      for (const [name, def] of Object.entries(STORES)) {
        const store = db.objectStoreNames.contains(name)
          ? r.transaction.objectStore(name)
          : db.createObjectStore(name, { keyPath: 'id' });
        for (const idx of def.indexes) {
          if (!store.indexNames.contains(idx)) store.createIndex(idx, idx, { unique: false });
        }
      }
    };
    r.onsuccess = () => {
      const db = r.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error('Database upgrade blocked by another tab'));
  });
  return dbp;
}

export async function getAll(store) {
  const db = await open();
  return req(db.transaction(store).objectStore(store).getAll());
}

export async function get(store, id) {
  const db = await open();
  return req(db.transaction(store).objectStore(store).get(id));
}

/** Writes many records across stores in one transaction: [{store, value}] or [{store, delete: id}]. */
export async function write(ops) {
  if (!ops.length) return;
  const db = await open();
  const names = [...new Set(ops.map((o) => o.store))];
  const tx = db.transaction(names, 'readwrite');
  for (const op of ops) {
    const s = tx.objectStore(op.store);
    if ('delete' in op) s.delete(op.delete);
    else s.put(op.value);
  }
  commit(tx);
  return done(tx);
}

/** Replaces the full contents of the given stores atomically. data = {store: [records]} */
export async function replaceAll(data) {
  const db = await open();
  const names = Object.keys(data);
  const tx = db.transaction(names, 'readwrite');
  for (const name of names) {
    const s = tx.objectStore(name);
    s.clear();
    for (const rec of data[name]) s.put(rec);
  }
  commit(tx);
  return done(tx);
}

export async function clearAll() {
  const db = await open();
  const names = [...db.objectStoreNames];
  const tx = db.transaction(names, 'readwrite');
  for (const n of names) tx.objectStore(n).clear();
  commit(tx);
  return done(tx);
}
