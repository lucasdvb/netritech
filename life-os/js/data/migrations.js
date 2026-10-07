// Data migrations: ordered, idempotent changes to stored data, each applied once and
// recorded in meta 'migrations'. Before any of them touch existing data, a safety copy of
// everything you've entered is saved on this device (the last three are kept), so an
// update can always be undone from Settings › Data.
import * as store from './store.js';
import { BACKUP_STORES, DB_VERSION } from './schema.js';

/** Each run() returns store.batch ops; it must leave already-migrated data unchanged. */
export const MIGRATIONS = [
  {
    id: '2026-10-day-ends-at',
    about: 'the “day ends at” setting',
    run: () => {
      const me = store.profile();
      return me && me.dayEndsAt == null ? [{ store: 'profile', value: { ...me, dayEndsAt: '03:00' } }] : [];
    },
  },
];

const KEEP = 3;
const metaOf = () => store.get('meta', 'migrations') || { id: 'migrations', applied: [] };

export const pendingMigrations = (list = MIGRATIONS) => {
  const done = new Set(metaOf().applied);
  return list.filter((m) => !done.has(m.id));
};

/** New data from the seed is already in the latest shape. */
export const markAllApplied = (list = MIGRATIONS) => store.put('meta', { ...metaOf(), applied: list.map((m) => m.id) });

export async function runMigrations({ list = MIGRATIONS, backup = true } = {}) {
  const todo = pendingMigrations(list);
  if (!todo.length) return [];
  if (backup) await safetyBackup(`Before updating ${todo.map((m) => m.about).join(', ')}`);
  const applied = [...metaOf().applied];
  const ran = [];
  for (const m of todo) {
    applied.push(m.id);
    // The migration and its record land together, or not at all.
    store.batch([...(m.run() || []), { store: 'meta', value: { ...metaOf(), applied: [...applied] } }]);
    await store.flush();
    if (!new Set(metaOf().applied).has(m.id)) break; // the write failed and rolled back; retry next launch
    ran.push(m.id);
  }
  return ran;
}

/* ---------- safety copies ---------- */

export async function safetyBackup(reason) {
  await store.flush();
  const data = {};
  const counts = {};
  for (const s of BACKUP_STORES) {
    data[s] = store.all(s);
    counts[s] = data[s].length;
  }
  const at = new Date().toISOString();
  const rec = { id: at, createdAt: at, updatedAt: at, reason, schema: DB_VERSION, counts, data: JSON.stringify(data) };
  const disk = store.disk();
  const older = (await disk.getAll('localBackups')).sort((a, b) => (a.id < b.id ? -1 : 1));
  const drop = older.slice(0, Math.max(0, older.length - (KEEP - 1))).map((b) => ({ store: 'localBackups', delete: b.id }));
  await disk.write([{ store: 'localBackups', value: rec }, ...drop]);
  return { id: rec.id, reason, counts };
}

export async function safetyBackups() {
  const list = await store.disk().getAll('localBackups');
  return list.sort((a, b) => (a.id < b.id ? 1 : -1)).map(({ id, reason, counts }) => ({ id, reason, counts }));
}

/** The backup file format for a safety copy, ready for backup.restore(). */
export async function safetyBackupFile(id) {
  const b = await store.disk().get('localBackups', id);
  if (!b) throw new Error('That safety copy is no longer on this device.');
  return { app: 'life-os', kind: 'backup', schema: b.schema, exportedAt: b.createdAt, includesPhotos: false, counts: b.counts, data: JSON.parse(b.data) };
}
