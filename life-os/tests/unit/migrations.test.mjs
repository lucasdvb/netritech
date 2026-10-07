import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { runMigrations, pendingMigrations, markAllApplied, safetyBackup, safetyBackups, safetyBackupFile, MIGRATIONS } from '../../js/data/migrations.js';
import { inspect } from '../../js/data/backup.js';

const v2 = () => ({
  profile: [{ id: 'me', name: 'Lucas', trackingStart: '2026-09-01', createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z' }],
  meta: [{ id: 'seed', version: 2 }],
  weightEntries: [{ id: '2026-10-01', date: '2026-10-01', kg: 76.4 }],
});

test('existing data is migrated once, after a safety copy', async () => {
  const disk = await fresh(v2());
  assert.equal(pendingMigrations().length, MIGRATIONS.length);
  const ran = await runMigrations();
  assert.deepEqual(ran, MIGRATIONS.map((m) => m.id));
  assert.equal(store.profile().dayEndsAt, '03:00');
  assert.equal(disk.db.localBackups.size, 1);
  const [copy] = await safetyBackups();
  assert.equal(copy.counts.weightEntries, 1);
  assert.match(copy.reason, /Before updating/);
  assert.deepEqual(await runMigrations(), [], 'second run does nothing');
  assert.equal(disk.db.localBackups.size, 1, 'and takes no new copy');
});

test('a migration leaves already-migrated data alone', async () => {
  await fresh(v2());
  store.setProfile({ dayEndsAt: '01:00' });
  await runMigrations();
  assert.equal(store.profile().dayEndsAt, '01:00');
});

test('a fresh install is marked as already up to date', async () => {
  await fresh();
  markAllApplied();
  assert.equal(pendingMigrations().length, 0);
});

test('a failed write leaves the migration pending for next time', async () => {
  const disk = await fresh(v2());
  disk.failNext = false;
  const origError = console.error;
  console.error = () => {};
  const list = [{ id: 'x-fails', about: 'a test', run: () => { disk.failNext = true; return [{ store: 'profile', value: { ...store.profile(), flag: 1 } }]; } }];
  const ran = await runMigrations({ list, backup: false });
  console.error = origError;
  assert.deepEqual(ran, []);
  assert.equal(pendingMigrations(list).length, 1);
  assert.equal(store.profile().flag, undefined);
});

test('only the last three safety copies are kept, newest first', async () => {
  const disk = await fresh(v2());
  for (let i = 0; i < 5; i++) {
    await safetyBackup(`copy ${i}`);
    await new Promise((r) => setTimeout(r, 2));
  }
  assert.equal(disk.db.localBackups.size, 3);
  const list = await safetyBackups();
  assert.deepEqual(list.map((c) => c.reason), ['copy 4', 'copy 3', 'copy 2']);
});

test('a safety copy restores like a backup file', async () => {
  await fresh(v2());
  const { id } = await safetyBackup('test');
  const file = await safetyBackupFile(id);
  const info = inspect(file);
  assert.equal(info.counts.weightEntries, 1);
  assert.equal(info.counts.profile, 1);
});
