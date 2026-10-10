// Your days: plans with their own times, a plan per weekday, any date on another plan or adjusted
// on its own, and everything (habit times, reminders, routines, what's expected) following the
// plan of the date. With only Every day, nothing changes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { setDayEnd, weekday, addDays } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, habitsSeed } from '../../js/data/seed.js';
import { defaultRoutines } from '../../js/domain/routines.js';
import * as P from '../../js/domain/day-plans.js';
import * as D from '../../js/domain/day-blocks.js';
import * as H from '../../js/domain/habits.js';

setDayEnd('03:00');
const start = (extra = {}) => fresh({ profile: [profileSeed()], settings: [settingsSeed()], habits: habitsSeed(),
  routines: defaultRoutines(habitsSeed(), profileSeed()), ...extra });
// A Monday and the Tuesday after it.
const MON = '2026-10-12';
const TUE = '2026-10-13';

test('with only Every day, every date is the base plan and nothing moves', async () => {
  await start();
  assert.equal(P.inUse(), false);
  assert.equal(P.planIdFor(MON), P.BASE);
  const o = P.on(MON);
  assert.equal(o.base, true);
  const h = H.habit('h-prayer');
  assert.equal(o.habitTime(h), h.time);
  assert.equal(o.out('h-prayer'), false);
  assert.deepEqual(P.blocksOn(MON).map((b) => b.id), D.blocks().map((b) => b.id));
});

test('a new plan copies Every day with every time written out; a weekday can follow it', async () => {
  await start();
  const { id } = P.create('Short day');
  assert.equal(P.nameOf(id), 'Short day');
  assert.deepEqual(P.blocksOf({ plan: id }).map((b) => [b.id, b.time]), D.blocks().map((b) => [b.id, b.time]));
  P.setWeekday(weekday(TUE), id);
  assert.equal(P.planIdFor(TUE), id);
  assert.equal(P.planIdFor(MON), P.BASE);
  assert.equal(P.inUse(), true);
});

test('changing wake in a plan moves that day’s morning check-in, not other days’; habits follow their block', async () => {
  await start();
  const { id } = P.create('Short day');
  P.setWeekday(weekday(TUE), id);
  const wake = P.blocksOf({ plan: id }).find((b) => b.kind === 'wake');
  P.edit({ plan: id }, wake.id, { time: '07:30' });
  assert.equal(P.on(TUE).profile.wakeTime, '07:30');
  assert.equal(P.on(MON).profile.wakeTime, store.profile().wakeTime, 'Monday keeps its wake time');
  const base = store.settings().notifications.morning?.time || '06:15';
  const later = P.on(TUE).cat('morning', base);
  assert.notEqual(later, base, 'the check-in reminder moves with wake that day');
  // A habit block moved in the plan: the habit's time and reminder that day move with it.
  store.update('habits', 'h-prayer', { reminder: '06:05' });
  const prayer = P.blocksOf({ plan: id }).find((b) => b.ref === 'h-prayer');
  P.edit({ plan: id }, prayer.id, { time: '08:00' });
  const h = H.habit('h-prayer');
  assert.equal(P.on(TUE).habitTime(h), '08:00');
  assert.equal(P.on(MON).habitTime(h), h.time, 'Monday keeps the habit’s own time');
  assert.notEqual(P.on(TUE).reminder(h), '06:05');
  assert.equal(P.on(MON).reminder(h), '06:05');
});

test('a habit left out of a day’s plan isn’t expected that day, and doesn’t count as missed', async () => {
  await start();
  const { id } = P.create('Short day');
  P.setWeekday(weekday(TUE), id);
  const mob = P.blocksOf({ plan: id }).find((b) => b.ref === 'h-mobility');
  assert.ok(mob, 'mobility is in Every day');
  P.removeBlock({ plan: id }, mob.id);
  const h = H.habit('h-mobility');
  assert.equal(P.outOfPlan('h-mobility', TUE), true);
  assert.equal(P.outOfPlan('h-mobility', MON), false);
  assert.equal(H.dueOn(h, TUE), false, 'not due on the short day');
  assert.equal(H.dueOn(h, MON), H.isScheduledDay(h, MON), 'due as scheduled on Monday');
});

test('one date: another plan, or adjusted on its own without touching the plan; back to usual', async () => {
  await start();
  const { id } = P.create('Long day');
  P.setDate(MON, id);
  assert.equal(P.planIdFor(MON), id);
  assert.equal(P.planIdFor(addDays(MON, 7)), P.BASE, 'only that date');
  P.adjust(MON);
  const wake = P.blocksOn(MON).find((b) => b.kind === 'wake');
  P.edit({ date: MON }, wake.id, { time: '05:00' });
  assert.equal(P.on(MON).profile.wakeTime, '05:00');
  assert.notEqual(P.blocksOf({ plan: id }).find((b) => b.kind === 'wake').time, '05:00', 'the plan itself is untouched');
  P.setDate(MON, null);
  assert.equal(P.planIdFor(MON), P.BASE);
  assert.equal(P.adjusted(MON), false);
});

test('deleting a plan puts its days back on Every day, and Undo restores it', async () => {
  await start();
  const { id } = P.create('Saturday');
  P.setWeekday(6, id);
  P.setDate(MON, id);
  const undo = P.remove(id);
  assert.equal(P.week()[6], P.BASE);
  assert.equal(P.planIdFor(MON), P.BASE);
  undo();
  assert.equal(P.week()[6], id);
  assert.equal(P.planIdFor(MON), id);
});

test('free time: awake time less what’s planned, each minute counted once', async () => {
  await start();
  const f = P.freeTime({ plan: P.BASE });
  assert.ok(f.awake > 0 && f.planned > 0 && f.free >= 0 && f.planned + f.free === f.awake);
});

test('a routine’s window follows the plan of the day', async () => {
  await start();
  const r = store.all('routines')[0];
  const { id } = P.create('Short day');
  P.add({ plan: id }, { kind: 'routine', ref: r.id, time: '09:00', mins: 45 });
  P.setWeekday(weekday(TUE), id);
  assert.deepEqual(P.on(TUE).window(r), { from: '09:00', to: '09:45' });
  assert.deepEqual(P.on(MON).window(r), r.window);
});
