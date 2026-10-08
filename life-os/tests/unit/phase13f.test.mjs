// Phase 13f: direction. The yearly review's window, the word for the year at the top of Plan, and
// the year in numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';
import * as Y from '../../js/domain/year-review.js';

test('the yearly review: offered from 15 December to the end of January, and its word heads the year it was chosen for', async () => {
  assert.equal(Y.due('2026-12-14'), null);
  assert.equal(Y.due('2026-12-15'), 2026);
  assert.equal(Y.due('2027-01-31'), 2026);
  assert.equal(Y.due('2027-02-01'), null);
  await fresh({ profile: [{ ...profileSeed(), trackingStart: '2026-01-01' }], settings: [settingsSeed()] });
  assert.equal(Y.themeWord('2026-12-20'), null);
  Y.save(2026, { answers: { proud: 'Trained through the move' } });
  Y.save(2026, { answers: { next: 'Building' }, word: 'Strength' });
  assert.deepEqual(Y.review(2026).answers, { proud: 'Trained through the move', next: 'Building' }, 'answers add up');
  assert.deepEqual(Y.themeWord('2026-12-20'), { year: 2027, word: 'Strength' }, 'chosen in December: shown for the year coming');
  assert.equal(Y.themeWord('2026-11-20'), null);
  assert.deepEqual(Y.themeWord('2027-06-01'), { year: 2027, word: 'Strength' }, 'all through the year');
  assert.equal(Y.themeWord('2028-06-01'), null, 'and not the year after');
});

test('the year in numbers counts what happened in that year only', async () => {
  await fresh({
    profile: [{ ...profileSeed(), trackingStart: '2026-01-01' }], settings: [settingsSeed()],
    workouts: [{ id: 'w1', date: '2026-03-01', status: 'done' }, { id: 'w2', date: '2026-07-01', status: 'done' }, { id: 'w3', date: '2025-12-31', status: 'done' }, { id: 'w4', date: '2026-08-01', status: 'active' }],
    readingSessions: [{ id: 'r1', date: '2026-02-01', book: 'Atomic Habits', finished: true }, { id: 'r2', date: '2026-02-03', book: 'Atomic Habits', finished: true }],
    weightEntries: [{ id: '2026-01-05', date: '2026-01-05', kg: 78 }, { id: '2026-12-01', date: '2026-12-01', kg: 73.5 }],
    dailyReviews: [{ id: '2026-05-05', date: '2026-05-05', win: 'Closed the deal' }, { id: '2026-05-06', date: '2026-05-06', win: '' }],
  });
  const n = Y.numbers(2026);
  assert.deepEqual([n.workouts, n.books, n.weight, n.wins], [2, 1, -4.5, 1]);
});
