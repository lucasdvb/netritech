import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, tick, store } from './helpers.mjs';
import { today, addDays, setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, habitsSeed } from '../../js/data/seed.js';
import { buildSnapshot, snapshot, rebuild, invalidate, SNAPSHOT_VERSION } from '../../js/domain/snapshots.js';

setDayEnd('00:00');
const T = today();
const d = (n) => addDays(T, n);

async function seeded() {
  const disk = await fresh({
    profile: [{ ...profileSeed(), trackingStart: d(-5) }],
    settings: [settingsSeed()],
    habits: habitsSeed(),
  });
  store.put('weightEntries', { id: d(-2), date: d(-2), kg: 76.0 });
  store.put('stepLogs', { id: d(-2), date: d(-2), steps: 8421 });
  await store.flush();
  return disk;
}

test('a snapshot summarises one day', async () => {
  await seeded();
  const s = buildSnapshot(d(-2));
  assert.equal(s.id, d(-2));
  assert.equal(s.v, SNAPSHOT_VERSION);
  assert.equal(s.weight, 76);
  assert.equal(s.steps, 8421);
  assert.equal(typeof s.planned, 'number');
  assert.equal(s.sealed, false);
});

test('finished days are cached; today is always live', async () => {
  await seeded();
  assert.equal(rebuild(), true);
  assert.equal(store.count('daySnapshots'), 5, 'the five finished days since tracking started');
  assert.equal(store.has('daySnapshots', T), false);
  assert.equal(snapshot(d(-2)), store.get('daySnapshots', d(-2)));
  assert.equal(rebuild(), true);
});

test('changing a past day drops its summary; changing habits rebuilds them all', async () => {
  await seeded();
  rebuild();
  store.put('stepLogs', { id: d(-2), date: d(-2), steps: 12000 });
  invalidate({ stores: new Set(['stepLogs']), dates: new Set([d(-2)]) });
  assert.equal(store.has('daySnapshots', d(-2)), false);
  assert.equal(snapshot(d(-2)).steps, 12000, 'reads stay correct before the rebuild');
  rebuild();
  assert.equal(store.get('daySnapshots', d(-2)).steps, 12000);
  const before = store.get('daySnapshots', d(-3)).gen;
  invalidate({ stores: new Set(['habits']), dates: new Set() });
  assert.equal(snapshot(d(-3)).gen, undefined, 'stale cache is not served');
  rebuild();
  assert.equal(store.get('daySnapshots', d(-3)).gen, before + 1);
});

test('a time-boxed rebuild always makes progress and then finishes', async () => {
  await seeded();
  let rounds = 0;
  while (!rebuild(0) && rounds < 50) rounds++;
  assert.ok(rounds < 50);
  assert.equal(store.count('daySnapshots'), 5);
  await tick();
});
