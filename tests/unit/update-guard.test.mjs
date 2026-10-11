// Your data through updates: what counts as lost after an update (and what doesn't), the weekly
// safety copy, and that a warning never takes a copy that would push a good one out.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';
import * as G from '../../js/data/update-guard.js';
import { safetyBackups } from '../../js/data/migrations.js';

test('lost: a store emptied, or a fifth of everything gone; small changes and your own deletions are not', () => {
  assert.deepEqual(G.missing({ habitLogs: 120, tasks: 30 }, { habitLogs: 0, tasks: 30 }), [{ store: 'habitLogs', before: 120, now: 0 }]);
  assert.deepEqual(G.missing({ habitLogs: 200, tasks: 100 }, { habitLogs: 150, tasks: 70 }), [{ store: 'all', before: 300, now: 220 }]);
  assert.deepEqual(G.missing({ habitLogs: 200, tasks: 100 }, { habitLogs: 195, tasks: 90 }), []);
  assert.deepEqual(G.missing({ tasks: 4 }, { tasks: 0 }), [], 'too few to judge');
  assert.deepEqual(G.missing({}, { tasks: 10 }), [], 'a first run has nothing to compare');
});

test('a weekly safety copy, and only one a week', async () => {
  await fresh({ profile: [profileSeed()], settings: [settingsSeed()] });
  store.put('tasks', { id: 't1', title: 'A', date: '2026-10-11', done: false, order: 1 });
  const first = await G.check();
  assert.equal(first.copied, true);
  assert.equal((await safetyBackups())[0].reason, 'Weekly copy');
  const again = await G.check();
  assert.equal(again.copied, false);
  const later = await G.check({ now: Date.now() + 8 * 864e5 });
  assert.equal(later.copied, true);
  assert.equal(store.get('meta', 'dataCheck').counts.tasks, 1);
});
