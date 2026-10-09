// Phase 13d: less effort to log. Same as yesterday (one tap, Undo-able), and the next step for an
// exercise from last time against its goal range.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';
import * as Meals from '../../js/domain/meals.js';
import { nextStep, parseRange, stepLabel } from '../../js/domain/next-step.js';

setDayEnd('00:00');
const T = today();
const d = (n) => addDays(T, n);
const base = { profile: [{ ...profileSeed(), trackingStart: d(-90) }], settings: [settingsSeed()] };

test('same as yesterday: yesterday’s food lands on today at the same times, once, and Undo takes it all back', async () => {
  await fresh({ ...base, nutritionLogs: [
    { id: 'a', date: d(-1), name: 'Oats + whey', protein: 35, kcal: 420, fruit: 1, veg: 0, at: `${d(-1)}T08:00:00` },
    { id: 'b', date: d(-1), name: 'Chicken curry', protein: 40, kcal: 650, fruit: 0, veg: 1, at: `${d(-1)}T13:00:00` },
    { id: 'c', date: d(-2), name: 'Not this one', protein: 99, kcal: 999, at: `${d(-2)}T09:00:00` },
  ] });
  assert.ok(Meals.canRepeat(T));
  assert.deepEqual(Meals.summary(Meals.dayBefore(T)), { count: 2, protein: 75, kcal: 1070 });
  const ids = Meals.repeatDayBefore(T);
  assert.equal(ids.length, 2);
  const now = store.onDate('nutritionLogs', T).sort((x, y) => (x.at < y.at ? -1 : 1));
  assert.deepEqual(now.map((l) => [l.name, l.protein, l.at.slice(10)]), [['Oats + whey', 35, 'T08:00:00'], ['Chicken curry', 40, 'T13:00:00']]);
  assert.ok(now.every((l) => l.repeated && !['a', 'b'].includes(l.id)), 'new entries, marked as repeated');
  assert.equal(Meals.canRepeat(T), false, 'offered once a day');
  store.batch(ids.map((id) => ({ store: 'nutritionLogs', delete: id })));
  assert.equal(store.onDate('nutritionLogs', T).length, 0);
  assert.equal(store.onDate('nutritionLogs', d(-1)).length, 2, 'yesterday untouched');
});

const ex = (id, o = {}) => ({ id, name: id, category: 'push', metric: 'reps', unilateral: false, family: null, level: 0, ...o });
let n = 0;
/** A finished session on day `day` with sets [[reps, load], …] (or seconds for holds). */
function session(day, exerciseId, sets, field = 'reps') {
  const w = store.put('workouts', { id: `w${++n}`, date: d(day), title: 'S', kind: 'strength', status: 'done', startedAt: `${d(day)}T07:00:00` });
  store.batch(sets.map(([v, load], i) => ({ store: 'workoutSets', value: { workoutId: w.id, date: d(day), exerciseId, order: 0, setIndex: i, [field]: v, load: load ?? null, completed: true } })));
}

test('next step: heavier once every set reaches the top, else one more rep; hold after two flat sessions', async () => {
  assert.deepEqual(parseRange('8–15'), { low: 8, high: 15 });
  assert.deepEqual(parseRange('10'), { low: 10, high: 10 });
  assert.deepEqual(parseRange('30–45 s'), { low: 30, high: 45 });
  assert.equal(parseRange('as many as you can'), null);
  await fresh({ ...base, exercises: [ex('row', { defaultLoad: 10 }), ex('push'), ex('push2', { family: 'push', level: 1, name: 'Decline push-up' }), ex('push1', { family: 'push', level: 0 }), ex('plank', { metric: 'time' }), ex('flat', { defaultLoad: 10 })] });
  // Every set at the top of 8–12 with 10 kg: 12.5 kg for 8.
  session(-3, 'row', [[12, 10], [12, 10], [12, 10]]);
  const up = nextStep('row', '8–12', { before: T });
  assert.deepEqual([up.kind, up.load, up.reps], ['load', 12.5, 8]);
  assert.match(up.why, /Every set reached 12/);
  // In pounds: 10 kg is 22 lb, rounded to the 2.5 lb plate step, then 5 lb more: 27.5 lb.
  assert.equal(Math.round(nextStep('row', '8–12', { before: T, unit: 'lb' }).load / 0.45359237 * 10) / 10, 27.5, '5 lb in pounds');
  // And stepping from a round number of pounds stays round, with no drift.
  session(-2, 'row', [[12, 100 * 0.45359237], [12, 100 * 0.45359237]]);
  assert.equal(Math.round(nextStep('row', '8–12', { before: T, unit: 'lb' }).load / 0.45359237 * 1000) / 1000, 105);
  assert.equal(stepLabel(up, (kg) => `${kg} kg`), 'Next step: 12.5 kg × 8');
  // Not all at the top: one more rep on the weakest, same weight.
  session(-1, 'row', [[12, 12.5], [10, 12.5], [9, 12.5]]);
  const rep = nextStep('row', '8–12', { before: T });
  assert.deepEqual([rep.kind, rep.reps, rep.load], ['reps', 10, 12.5]);
  // Bodyweight at the top: the harder variation when the family has one, else one more rep.
  session(-2, 'push1', [[15, 0], [15, 0]]);
  const v = nextStep('push1', '6–15', { before: T });
  assert.deepEqual([v.kind, v.exerciseId, v.reps], ['variation', 'push2', 6]);
  session(-2, 'push', [[15], [16]]);
  assert.deepEqual([nextStep('push', '6–15', { before: T }).kind, nextStep('push', '6–15', { before: T }).reps], ['reps', 17]);
  // Holds: 5 more seconds.
  session(-2, 'plank', [[45], [45]], 'seconds');
  assert.deepEqual([nextStep('plank', '30–45 s', { before: T }).kind, nextStep('plank', '30–45 s', { before: T }).seconds], ['seconds', 50]);
  // Three sessions, the last two without progress, below the top: hold.
  session(-9, 'flat', [[10, 20], [9, 20]]);
  session(-6, 'flat', [[10, 20], [9, 20]]);
  session(-3, 'flat', [[9, 20], [9, 20]]);
  const hold = nextStep('flat', '8–12', { before: T });
  assert.deepEqual([hold.kind, hold.load], ['hold', 20]);
  assert.match(hold.why, /Two sessions without progress/);
  // Nothing to go on: first time, or no range.
  assert.equal(nextStep('push2', '6–15', { before: T }), null);
  assert.equal(nextStep('row', 'to failure', { before: T }), null);
});
