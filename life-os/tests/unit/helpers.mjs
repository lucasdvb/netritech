// Shared setup for the unit tests: a fresh in-memory store per test.
import * as store from '../../js/data/store.js';
import { memoryAdapter } from '../../js/data/adapter-memory.js';

export async function fresh(seed = {}) {
  await store.flush(); // the previous test's writes land in its own storage, not the new one
  const adapter = memoryAdapter(seed);
  store.useAdapter(adapter);
  await store.init();
  return adapter;
}

/** Let queued microtasks (store events, write batching) run. */
export const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

export { store };
