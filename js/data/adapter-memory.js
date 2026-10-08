// In-memory storage adapter with the same interface as adapter-idb.js.
// Used by the unit tests, and keeps the store testable outside a browser.
import { STORES } from './schema.js';

const clone = (v) => (v === undefined ? v : structuredClone(v));

export function memoryAdapter(seed = {}) {
  const db = Object.fromEntries(Object.keys(STORES).map((s) => [s, new Map((seed[s] || []).map((r) => [r.id, clone(r)]))]));
  return {
    name: 'memory',
    db,
    writes: 0,
    failNext: false,
    async open() { return db; },
    async getAll(store) { return [...db[store].values()].map(clone); },
    async get(store, id) { return clone(db[store].get(id)); },
    async getSince(store, since) { return [...db[store].values()].filter((r) => r.date >= since).map(clone); },
    async write(ops) {
      if (this.failNext) { this.failNext = false; throw new Error('Simulated write failure'); }
      this.writes++;
      for (const op of ops) {
        if ('delete' in op) db[op.store].delete(op.delete);
        else db[op.store].set(op.value.id, clone(op.value));
      }
    },
    async replaceAll(data) {
      for (const [name, recs] of Object.entries(data)) db[name] = new Map(recs.map((r) => [r.id, clone(r)]));
    },
    async clearAll() { for (const name of Object.keys(db)) db[name].clear(); },
  };
}
