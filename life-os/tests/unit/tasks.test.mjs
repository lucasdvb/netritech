// The day's Top 3 are ranked tasks (DR-07).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd } from '../../js/domain/dates.js';
import * as T from '../../js/domain/tasks-more.js';
import { MIGRATIONS } from '../../js/data/migrations.js';
import { dayScore } from '../../js/domain/scoring.js';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';

setDayEnd('00:00');
const D = today();

test('priorities fill three slots, reorder, and an empty title removes one', async () => {
  await fresh({ profile: [profileSeed()], settings: [settingsSeed()] });
  T.setPriority(D, 0, 'Ship it');
  T.setPriority(D, 2, 'Call mum');
  assert.deepEqual(T.slots(D).map((t) => t?.title ?? null), ['Ship it', null, 'Call mum']);
  T.movePriority(D, 2, 0);
  assert.deepEqual(T.slots(D).map((t) => t?.title ?? null), ['Call mum', 'Ship it', null]);
  T.setPriority(D, 1, '');
  assert.deepEqual(T.priorities(D).map((t) => t.title), ['Call mum']);
});

test('the first priority for tomorrow goes on top, and a fourth loses its rank', async () => {
  await fresh({ profile: [profileSeed()], settings: [settingsSeed()] });
  const tm = addDays(D, 1);
  ['A', 'B', 'C'].forEach((x, i) => T.setPriority(tm, i, x));
  T.addFirstPriority(tm, 'First');
  assert.deepEqual(T.priorities(tm).map((t) => t.title), ['First', 'A', 'B']);
  assert.equal(T.all().find((t) => t.title === 'C').rank, null);
  T.addFirstPriority(tm, 'First');
  assert.equal(T.all().filter((t) => t.title === 'First').length, 1, 'no duplicate');
});

test('a task can be promoted to a free slot, and demoted', async () => {
  await fresh({ profile: [profileSeed()], settings: [settingsSeed()] });
  const t = T.add({ title: 'Book dentist', date: D });
  assert.equal(T.promote(t.id, D), true);
  assert.equal(T.task(t.id).rank, 1);
  T.demote(t.id);
  assert.equal(T.task(t.id).rank, null);
});

test('the migration turns written Top 3 into ranked tasks and keeps done', async () => {
  await fresh({ profile: [profileSeed()], settings: [settingsSeed()],
    dailyReviews: [{ id: D, date: D, top3: [{ text: 'One', done: true }, { text: '' }, { text: 'Three', done: false }], win: 'kept' }] });
  const m = MIGRATIONS.find((x) => x.id === '2026-10-top3-tasks');
  store.batch(m.run());
  assert.deepEqual(T.priorities(D).map((t) => [t.title, t.rank, t.done]), [['One', 1, true], ['Three', 2, false]]);
  assert.equal(store.get('dailyReviews', D).top3, undefined);
  assert.equal(store.get('dailyReviews', D).win, 'kept');
  assert.equal(m.run().length, 0, 'running again changes nothing');
  assert.equal(dayScore(D).items.filter((i) => i.kind === 'top3').length, 2);
});
