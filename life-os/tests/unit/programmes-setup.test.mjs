// Programmes and the 5-minute setup: following a programme sets up its workouts and week and
// keeps your recovery and cardio days; stopping and undo put your own back; every exercise a
// programme uses resolves. The setup builds the days through the linked rules, and its undo is
// exact.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, habitsSeed, exercisesSeed, templatesSeed } from '../../js/data/seed.js';
import { defaultRoutines } from '../../js/domain/routines.js';
import * as PG from '../../js/domain/programmes.js';
import * as S from '../../js/domain/setup.js';
import * as P from '../../js/domain/day-plans.js';
import * as H from '../../js/domain/habits.js';

setDayEnd('03:00');
const start = () => fresh({ profile: [profileSeed()], settings: [settingsSeed()], habits: habitsSeed(),
  routines: defaultRoutines(habitsSeed(), profileSeed()), exercises: exercisesSeed(), templates: templatesSeed() });
const dump = () => JSON.stringify(['profile', 'settings', 'habits', 'routines', 'templates', 'exercises']
  .map((s) => store.all(s).map(({ updatedAt, rev, createdAt, ...r }) => r).sort((a, b) => String(a.id).localeCompare(String(b.id)))));

test('every programme uses exercises that exist, and every week names real workouts', async () => {
  await start();
  for (const p of PG.PROGRAMMES) {
    for (const w of p.workouts) assert.equal(PG.itemsOf(w).length, w.items.length, `${p.id} ${w.name}`);
    for (const short of [false, true]) for (const d of PG.weekOf(p.id, { short })) if (d.workout) assert.ok(p.workouts.some((w) => w.name === d.workout));
  }
});

test('following a programme sets its workouts and week, keeps recovery and cardio, and undo is exact', async () => {
  await start();
  const before = dump();
  const undo = PG.follow('upper-lower-4');
  const pr = store.profile();
  assert.equal(pr.programme.id, 'upper-lower-4');
  assert.deepEqual([pr.plan[1], pr.plan[2], pr.plan[4], pr.plan[5]], [0, 1, 2, 3].map((i) => `t-pg-upper-lower-4-${i}`));
  assert.equal(pr.plan[3], 't-recovery');
  assert.equal(pr.plan[6], 't-cardio');
  assert.equal(pr.plan[7], null);
  assert.ok(store.get('exercises', 'e-bench-press'));
  undo();
  assert.equal(dump(), before);
});

test('switching programmes keeps your own week to come back to; stop brings it back', async () => {
  await start();
  const own = store.profile().plan;
  PG.follow('full-body-3');
  PG.follow('minimum-2');
  assert.equal(store.profile().programme.id, 'minimum-2');
  assert.deepEqual(store.profile().programme.prevPlan, own);
  PG.stop();
  assert.deepEqual(store.profile().plan, own);
  assert.equal(store.profile().programme, null);
  assert.ok(store.get('templates', 't-pg-minimum-2-0'), 'the workouts stay in the library');
});

test('the recommendation fits days and place', () => {
  assert.equal(S.recommend(0, 'gym'), null);
  assert.equal(S.recommend(2, 'gym').id, 'minimum-2');
  assert.equal(S.recommend(3, 'gym').id, 'full-body-3');
  assert.equal(S.recommend(4, 'gym').id, 'upper-lower-4');
  assert.equal(S.recommend(6, 'gym').id, 'ppl-6');
  assert.equal(S.recommend(4, 'home').id, 'home-3');
});

test('the setup builds linked days, a weekend plan, a programme, focus and reminders; undo is exact', async () => {
  await start();
  const before = dump();
  const a = { ...S.current(), name: 'Sam', wake: '07:00', bed: '23:00', workStart: '09:00', workEnd: '17:00', workDays: [1, 2, 3, 4, 5],
    days: 'weekend', weekendWake: '08:30', weekendBed: '23:30', trainDays: 3, where: 'gym', trainTime: '07:30', training: 'programme',
    reminders: { morning: true, workout: true, evening: true, weekly: false } };
  a.focus = S.focusChoices().options.slice(0, 2).map((h) => h.id);
  const undo = await S.apply(a);
  const pr = store.profile();
  assert.deepEqual([pr.name, pr.wakeTime, pr.bedTime, pr.workStart, pr.workEnd, pr.trainTime], ['Sam', '07:00', '23:00', '09:00', '17:00', '07:30']);
  assert.equal(pr.programme.id, 'full-body-3');
  // The morning moved with the wake time (prayer is 5 minutes after waking).
  assert.equal(H.habit('h-prayer').time, '07:05');
  const sat = P.on('2026-10-17');
  assert.equal(sat.name, 'Weekend');
  assert.equal(sat.profile.wakeTime, '08:30');
  assert.equal(sat.work, false);
  assert.equal(P.on('2026-10-12').work, true);
  assert.deepEqual(H.activeHabits().filter((h) => H.stateOf(h) === 'focus').map((h) => h.id).sort(), [...a.focus].sort());
  const n = store.settings().notifications;
  assert.deepEqual([n.morning.on, n.morning.time, n.workout.time, n.evening.time, n.weeklyReview.on], [true, '07:05', '07:25', '22:00', false]);
  assert.ok(store.settings().setupDone);
  undo();
  assert.equal(dump(), before);
});

test('running the setup again changes the Weekend plan rather than adding another; no training clears the week', async () => {
  await start();
  const a = { ...S.current(), days: 'weekend', weekendWake: '08:00', training: 'none', trainDays: 0 };
  await S.apply(a);
  await S.apply({ ...a, weekendWake: '09:00' });
  assert.equal(P.plans().filter((p) => p.name === 'Weekend').length, 1);
  assert.equal(P.on('2026-10-18').profile.wakeTime, '09:00');
  assert.ok(Object.values(store.profile().plan).every((v) => v == null));
});
