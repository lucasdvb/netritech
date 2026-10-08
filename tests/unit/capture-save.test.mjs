// Saving captures and "not today": one write per capture, and Undo puts everything back exactly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, habitsSeed, foodsSeed } from '../../js/data/seed.js';
import * as H from '../../js/domain/habits.js';
import * as M from '../../js/domain/metrics.js';
import { parse } from '../../js/domain/capture.js';
import { save } from '../../js/domain/capture-save.js';
import { planHabits, dayScore } from '../../js/domain/scoring.js';

setDayEnd('03:00');
const T = today();
const snapshot = () => JSON.stringify(Object.fromEntries(['waterLogs', 'nutritionLogs', 'habitLogs', 'tasks', 'dailyReviews', 'moodEntries', 'weightEntries', 'stepLogs', 'sleepEntries', 'workouts', 'foods', 'journalEntries', 'measurements', 'spiritualSessions']
  .map((s) => [s, store.all(s).map(({ updatedAt, rev, ...r }) => r).sort((a, b) => (a.id < b.id ? -1 : 1))])));

async function world() {
  await fresh({ profile: [{ ...profileSeed(), trackingStart: addDays(T, -30) }], settings: [settingsSeed()], habits: habitsSeed(), foods: foodsSeed(),
    weightEntries: [{ id: addDays(T, -1), date: addDays(T, -1), kg: 76.2 }] });
}
const ctx = () => ({ today: T, weightUnit: 'kg', lengthUnit: 'cm', lastWeightKg: 76.2, habits: H.habits(), foods: store.all('foods') });
const run = (text) => { const r = parse(text, ctx()); assert.equal(r.status, 'ok', `${text}: ${r.status}`); return save(r.items, ctx()); };

test('each capture lands where the sheets put it', async () => {
  await world();
  run('water 750');
  assert.equal(M.waterMl(T), 750);
  run('76.4');
  assert.equal(M.weight(T), 76.4);
  run('2 fruit and 3 veg');
  const n = M.nutrition(T);
  assert.equal(n.fruit, 2);
  assert.equal(n.veg, 3);
  run('6 eggs');
  assert.equal(M.nutrition(T).protein, 38 + 6);
  assert.equal(store.get('foods', 'f-eggs').uses, 1);
  run('prayed');
  assert.ok(H.isDone(H.habit('h-prayer'), T));
  run('2 deep work blocks');
  run('deep work block');
  assert.equal(store.get('dailyReviews', T).deepWork, 3);
  run('energy 6 mood 7');
  assert.deepEqual([store.get('moodEntries', T).energy, store.get('moodEntries', T).mood], [6, 7]);
  run('slept 11pm to 6:30');
  assert.equal(M.sleepHours(T), 7.5);
  run('walked 30 min');
  assert.ok(H.isDone(H.habit('h-training'), T), 'a quick walk counts as training');
  const t = run('call mum friday');
  assert.match(t.message, /Task added · Call mum/);
  assert.equal(store.all('tasks').find((x) => x.title === 'Call mum').area, 'relationships');
});

test('Undo restores every record exactly, including ones that already existed', async () => {
  await world();
  run('water 500');
  run('energy 5');
  run('deep work block');
  const before = snapshot();
  const r = run('water 1l, energy 8, 2 deep work blocks, prayed, slept 7h, weight 75.8');
  assert.notEqual(snapshot(), before);
  r.undo();
  assert.equal(snapshot(), before);
});

test('things that live elsewhere open there instead of being guessed', async () => {
  await world();
  const r = run('journal');
  assert.equal(r.open, 'h-journal');
  assert.equal(r.saved, 0);
});

test('not today: the habit leaves the plan and the score, and logging it takes it back', async () => {
  await world();
  const h = H.habit('h-prayer');
  store.put('habits', { ...h, state: 'focus', focusSince: addDays(T, -10) });
  assert.ok(planHabits(T).some((x) => x.id === 'h-prayer'));
  const total = dayScore(T).total;
  run('skip prayer');
  assert.ok(H.skipped(H.habit('h-prayer'), T));
  assert.ok(!H.dueOn(H.habit('h-prayer'), T));
  assert.ok(!planHabits(T).some((x) => x.id === 'h-prayer'));
  assert.equal(dayScore(T).total, total - 1);
  H.toggle(H.habit('h-prayer'), T);
  assert.ok(!H.skipped(H.habit('h-prayer'), T), 'doing it anyway clears "not today"');
  assert.ok(H.isDone(H.habit('h-prayer'), T));
});

test('with no reserve left, not today counts as a miss for the run, so two in a row end it', async () => {
  await world();
  store.put('habits', { ...H.habit('h-prayer'), reserves: 0 });
  const h = H.habit('h-prayer');
  for (let i = 1; i <= 5; i++) H.setLog(h, addDays(T, -i - 2), { value: 1 });
  H.setSkip(h, addDays(T, -2));
  assert.equal(H.runs(h, addDays(T, -1)).missesInRow, 2, 'yesterday was not logged, the day before was skipped');
  H.setSkip(h, addDays(T, -2), false);
  H.setLog(h, addDays(T, -2), { value: 1 });
  assert.equal(H.runs(h, addDays(T, -1)).current, 6);
});
