// The habit system: states and focus on three, tiny versions, runs with grace, the score.
import { test } from 'node:test';
import * as HS from '../../js/domain/habit-system.js';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd, startOfWeek } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, habitsSeed } from '../../js/data/seed.js';
import * as H from '../../js/domain/habits.js';
import { dayScore } from '../../js/domain/scoring.js';
import { MIGRATIONS } from '../../js/data/migrations.js';

setDayEnd('00:00');
const T = today();
const d = (n) => addDays(T, n);
const simple = (id, o = {}) => ({ id, name: id, type: 'binary', schedule: { kind: 'daily' }, state: 'focus', focusSince: d(-60), order: 0, ...o });

async function world(habits, start = d(-60)) {
  await fresh({ profile: [{ ...profileSeed(), trackingStart: start }], settings: [settingsSeed()], habits });
}
const done = (id, n) => store.put('habitLogs', { id: H.logId(id, d(n)), habitId: id, date: d(n), value: 1, completed: true });

test('a tiny version counts as done for the score and for runs, but is not "fully done"', async () => {
  await world([simple('a', { tiny: { label: 'One line' } })]);
  H.setTiny(H.habit('a'), T);
  assert.equal(H.isDone(H.habit('a'), T), false);
  assert.equal(H.isTiny(H.habit('a'), T), true);
  assert.equal(H.counts(H.habit('a'), T), true);
  const s = dayScore(T);
  assert.deepEqual({ done: s.done, tiny: s.tiny, total: s.total }, { done: 1, tiny: 1, total: 1 });
});

test('a number past the tiny amount counts as tiny automatically', async () => {
  await world([simple('w', { type: 'numeric', unit: 'ml', target: 2800, min: 2500, tiny: { label: '2 litres', min: 2000 } })]);
  H.setValue(H.habit('w'), T, 2100);
  assert.equal(H.level(H.habit('w'), T), 'tiny');
  H.setValue(H.habit('w'), T, 2600);
  assert.equal(H.level(H.habit('w'), T), 'full');
});

test('one miss never ends a run; two in a row do', async () => {
  await world([simple('a')], d(-10));
  [-6, -5, -3, -2, -1].forEach((n) => done('a', n)); // miss on -4
  let r = H.runs(H.habit('a'));
  assert.equal(r.current, 5);
  assert.equal(r.comebacks, 1);
  assert.equal(r.missesInRow, 0);
  await world([simple('a')], d(-10));
  [-6, -5, -2, -1].forEach((n) => done('a', n)); // misses on -4 and -3
  r = H.runs(H.habit('a'));
  assert.equal(r.current, 2);
  assert.equal(r.best, 2);
});

test('after a single miss the habit says “don’t miss twice”', async () => {
  await world([simple('a')], d(-5));
  [-4, -3, -2].forEach((n) => done('a', n)); // yesterday missed, today open
  assert.equal(H.runs(H.habit('a')).missesInRow, 1);
  assert.equal(H.runs(H.habit('a')).current, 3);
});

test('weekly habits keep runs by the week', async () => {
  await world([simple('s', { schedule: { kind: 'perWeek', count: 1 } })], d(-40));
  for (const n of [-35, -28, -21, -7]) done('s', n);
  const r = H.runs(H.habit('s'));
  assert.equal(r.unit, 'week');
  assert.ok(r.current >= 3, `current ${r.current}`);
});

test('only three habits can be in focus', async () => {
  await world(['a', 'b', 'c', 'x'].map((id) => simple(id, { state: id === 'x' ? 'autopilot' : 'focus' })));
  assert.equal(HS.setState(H.habit('x'), 'focus'), null);
  assert.equal(H.stateOf(H.habit('x')), 'autopilot');
  HS.setState(H.habit('a'), 'autopilot');
  assert.ok(HS.setState(H.habit('x'), 'focus'));
  assert.equal(H.focusHabits().length, 3);
});

test('a pause ends by itself on its date', async () => {
  await world([simple('a', { state: 'autopilot' })]);
  HS.setState(H.habit('a'), 'paused', { until: d(3) });
  assert.equal(H.stateOf(H.habit('a'), d(1)), 'paused');
  assert.equal(H.stateOf(H.habit('a'), d(3)), 'autopilot');
  assert.equal(H.dueOn(H.habit('a'), T), false);
});

test('the score counts focus habits and Top 3, never autopilot', async () => {
  await world([simple('f1'), simple('f2'), simple('auto', { state: 'autopilot' })]);
  store.put('tasks', { id: 't1', title: 'Ship it', date: T, rank: 1, done: true });
  store.put('tasks', { id: 't2', title: 'Call mum', date: T, rank: 2, done: false });
  done('f1', 0);
  const s = dayScore(T);
  assert.equal(s.total, 4);
  assert.equal(s.done, 2);
  assert.ok(!s.items.some((i) => i.habit?.id === 'auto'));
});

test('a weekly focus habit joins the plan only on the days it is needed', async () => {
  await world([simple('s', { schedule: { kind: 'perWeek', count: 1 } })], d(-30));
  const monday = addDays(startOfWeek(T), 7);
  assert.equal(dayScore(monday).total, 0, 'a whole week left: not needed on Monday');
  assert.equal(dayScore(addDays(monday, 6)).total, 1, 'last chance on Sunday: in the plan');
});

test('six weeks at 85% or better makes a focus habit ready for autopilot', async () => {
  await world([simple('a'), simple('later', { state: 'queue', queueOrder: 1 })], d(-80));
  for (let n = -70; n <= -1; n++) if (n % 9 !== 0) done('a', n);
  const g = HS.graduation(H.habit('a'));
  assert.ok(g && g.ratio >= 0.85, JSON.stringify(g));
  const next = HS.graduate(H.habit('a'));
  assert.equal(H.stateOf(H.habit('a')), 'autopilot');
  assert.equal(next.id, 'later');
  assert.equal(H.stateOf(H.habit('later')), 'focus');
});

test('suggested focus habits are ones that matter and are not yet automatic', async () => {
  await world(habitsSeed());
  const picks = HS.suggestFocus();
  assert.equal(picks.length, 3);
  assert.ok(picks.every((h) => h.affectsScore || h.priority === 'core'));
});

test('the migration turns priorities into states and adds tiny versions', async () => {
  const old = habitsSeed().map(({ state, tiny, anchor, ...h }) => h);
  await world(old);
  const m = MIGRATIONS.find((x) => x.id === '2026-10-habit-states');
  store.batch(m.run());
  assert.equal(H.habit('h-meditation').state, 'queue');
  assert.equal(H.habit('h-prayer').state, 'autopilot');
  assert.equal(H.habit('h-mobility').tiny.label, '5-minute mobility');
  assert.equal(H.habit('h-water').tiny.min, 2000);
  assert.ok(H.habit('h-scripture').tiny.label);
  assert.equal(m.run().length, 0, 'running again changes nothing');
});

test('a sort is saved in one write and never leaves more than three in focus', async () => {
  await world(['a', 'b', 'c', 'd', 'e'].map((id, i) => simple(id, { state: 'autopilot', order: i })));
  assert.equal(HS.applyStates({ a: 'focus', b: 'focus', c: 'focus', d: 'queue', e: 'queue' }), 5);
  assert.deepEqual(H.focusHabits().map((h) => h.id).sort(), ['a', 'b', 'c']);
  assert.deepEqual(H.queue().map((h) => h.id), ['d', 'e']);
  assert.throws(() => HS.applyStates({ d: 'focus' }), /At most 3/);
  assert.equal(HS.applyStates({ a: 'autopilot', d: 'focus' }), 2);
  assert.equal(H.habit('d').focusSince, T);
  assert.equal(HS.applyStates({ d: 'focus' }), 0, 'unchanged habits are not rewritten');
});

test('on a minimum day a tap logs the tiny version, and your three stay in the plan', async () => {
  await world([simple('a', { tiny: { label: 'One page' } }), simple('m', { state: 'autopilot', mvd: true }), simple('x', { state: 'autopilot' })]);
  store.put('dailyReviews', { id: T, date: T, mode: 'minimum' });
  assert.equal(H.dueOn(H.habit('a'), T), true, 'focus habit due on a minimum day');
  assert.equal(H.dueOn(H.habit('x'), T), false, 'autopilot extras rest');
  assert.equal(H.tap(H.habit('a'), T), true);
  assert.equal(H.level(H.habit('a'), T), 'tiny');
  assert.equal(dayScore(T).total, 2);
  assert.equal(H.tap(H.habit('a'), T), false);
  assert.equal(H.level(H.habit('a'), T), null);
});

test('“not yet” puts graduation off for two weeks', async () => {
  await world([simple('a')], d(-60));
  for (let n = -50; n <= -1; n++) done('a', n);
  assert.ok(HS.graduationDue(H.habit('a')));
  store.update('habits', 'a', { graduationSnoozed: d(-3) });
  assert.equal(HS.graduationDue(H.habit('a')), null);
  store.update('habits', 'a', { graduationSnoozed: d(-14) });
  assert.ok(HS.graduationDue(H.habit('a')));
});
