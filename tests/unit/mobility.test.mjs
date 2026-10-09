// Mobility & posture as a workout plan: the update that converts an installed habit (keeping its
// history), the habit ticking itself from the workout, and mobility not counting as training.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, exercisesSeed, templatesSeed } from '../../js/data/seed.js';
import { MIGRATIONS } from '../../js/data/migrations.js';
import * as H from '../../js/domain/habits.js';
import * as F from '../../js/domain/fitness.js';

setDayEnd('00:00');
const T = today();
const d = (n) => addDays(T, n);
const LIST = ['Chin tucks × 10', 'Wall angels × 10', 'Thoracic extensions × 8–10', 'External rotation (2 kg) × 12–15',
  'Scapular retractions × 12–15', 'Doorway chest stretch 2 × 30 s', 'Cat-cow × 8', 'Hip-flexor stretch 30 s / side'];
const oldHabit = { id: 'h-mobility', name: 'Mobility & posture', type: 'binary', section: 'morning', category: 'posture', state: 'focus', schedule: { kind: 'daily' },
  startDate: d(-30), order: 0, goalId: 'g-posture', description: '10 minutes. Consistency, not perfection.', checklist: LIST };
const migration = MIGRATIONS.find((m) => m.id === '2026-10-mobility-workout');

test('the update: a workout plan, the habit linked to it, and every fully ticked day still done', async () => {
  const all = Object.fromEntries(LIST.map((_, i) => [i, true]));
  await fresh({ profile: [{ ...profileSeed(), trackingStart: d(-30) }], settings: [settingsSeed()], exercises: exercisesSeed(),
    templates: templatesSeed().filter((t) => t.id !== 't-mobility'), habits: [oldHabit],
    habitLogs: [
      { id: `h-mobility:${d(-3)}`, habitId: 'h-mobility', date: d(-3), checklist: all },                 // every item ticked
      { id: `h-mobility:${d(-2)}`, habitId: 'h-mobility', date: d(-2), checklist: { 0: true, 1: true } }, // part of it
      { id: `h-mobility:${d(-1)}`, habitId: 'h-mobility', date: d(-1), value: 1, completed: true },
    ] });
  assert.equal(H.isDone(H.habit('h-mobility'), d(-3)), true, 'done before the update');
  store.batch(migration.run());
  const t = store.get('templates', 't-mobility');
  assert.equal(t.kind, 'mobility');
  assert.deepEqual(t.items.map((i) => i.exerciseId), ['e-chin-tuck', 'e-wall-angel', 'e-thoracic', 'e-ext-rotation', 'e-scap-retraction', 'e-doorway', 'e-cat-cow', 'e-hip-flexor']);
  const h = H.habit('h-mobility');
  assert.deepEqual([h.templateId, h.source, h.checklist.length, h.goalId, h.state], ['t-mobility', 'workout:mobility', 0, 'g-posture', 'focus']);
  assert.deepEqual([d(-3), d(-2), d(-1)].map((x) => H.isDone(h, x)), [true, false, true], 'history kept');
  assert.deepEqual(migration.run(), [], 'runs once');
});

test('a mobility workout ticks the habit, and isn’t the day’s training', async () => {
  await fresh({ profile: [{ ...profileSeed(), trackingStart: d(-30) }], settings: [settingsSeed()], exercises: exercisesSeed(), templates: templatesSeed(),
    habits: [{ ...oldHabit, checklist: [], source: 'workout:mobility', templateId: 't-mobility' },
      { id: 'h-training', name: 'Training', type: 'binary', state: 'focus', schedule: { kind: 'daily' }, startDate: d(-30), order: 1, source: 'workout:any' }] });
  const w = store.put('workouts', { date: T, templateId: 't-mobility', title: 'Mobility & posture', kind: 'mobility', status: 'done' });
  store.put('workoutSets', { workoutId: w.id, date: T, exerciseId: 'e-chin-tuck', order: 0, setIndex: 0, reps: 10, completed: true });
  assert.equal(H.isDone(H.habit('h-mobility'), T), true);
  assert.equal(H.isDone(H.habit('h-training'), T), false);
  assert.equal(F.workoutsOn(T).length, 0, 'not a training session');
  assert.equal(F.workoutsOn(T, { mobility: true }).length, 1);
  assert.equal(F.weekStats(T).sessions, 0);
  assert.ok(F.exerciseHistory('e-chin-tuck').length >= 1, 'the exercise’s own history still has it');
});
