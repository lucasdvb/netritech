// Routines (H5): steps in order, "Did it all" with Undo, the routine open now, and the score.
import { test } from 'node:test';
import * as HS from '../../js/domain/habit-system.js';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, habitsSeed } from '../../js/data/seed.js';
import * as H from '../../js/domain/habits.js';
import * as R from '../../js/domain/routines.js';
import { dayScore } from '../../js/domain/scoring.js';
import { MIGRATIONS } from '../../js/data/migrations.js';

setDayEnd('03:00');
const T = today();
const at = (hm, date = T) => { const [h, m] = hm.split(':').map(Number); const d = new Date(`${date}T00:00:00`); d.setHours(h, m); return d; };
const hb = (id, o = {}) => ({ id, name: id, type: 'binary', schedule: { kind: 'daily' }, state: 'autopilot', section: 'morning', order: 0, ...o });
const routine = { id: 'r-m', name: 'Morning', kind: 'morning', order: 1, window: { from: '05:00', to: '10:00' },
  steps: [{ id: 's1', habitId: 'a' }, { id: 's2', label: 'Make the bed' }, { id: 's3', habitId: 'b' }, { id: 's4', habitId: 'c' }] };

async function world({ habits = [hb('a'), hb('b'), hb('c', { checklist: ['x', 'y'] })], routines = [routine] } = {}) {
  await fresh({ profile: [{ ...profileSeed(), trackingStart: addDays(T, -30) }], settings: [settingsSeed()], habits, routines });
}

test('fresh installs get Morning and Evening routines from the grouped habits', () => {
  const rs = R.defaultRoutines(habitsSeed(), profileSeed());
  assert.deepEqual(rs.map((r) => r.name), ['Morning', 'Evening']);
  assert.ok(rs[0].steps.some((s) => s.habitId === 'h-prayer'));
  assert.ok(rs[1].steps.some((s) => s.habitId === 'h-lights-out'));
  assert.equal(rs[0].window.from, '05:00');
});

test('steps keep their order, and the next step is the first one not done', async () => {
  await world();
  H.toggle(H.habit('a'), T);
  const p = R.progress(R.routine('r-m'), T);
  assert.deepEqual(p.steps.map((s) => s.id), ['s1', 's2', 's3', 's4']);
  assert.equal(p.next.id, 's2');
  R.toggleLabel(R.routine('r-m'), p.next, T);
  assert.equal(R.progress(R.routine('r-m'), T).next.id, 's3');
});

test('“Did it all” finishes every step in one go, and Undo puts it all back', async () => {
  await world();
  H.toggle(H.habit('a'), T);
  const undo = R.didItAll(R.routine('r-m'), T);
  const p = R.progress(R.routine('r-m'), T);
  assert.equal(p.complete, true);
  assert.ok(p.completedAt);
  assert.equal(H.isDone(H.habit('c'), T), true, 'checklist habit fully done');
  undo();
  const q = R.progress(R.routine('r-m'), T);
  assert.equal(q.done, 1, 'only the step done before stays done');
  assert.equal(q.completedAt, null);
});

test('the routine open now follows its window, and 00:30 still belongs to the evening', async () => {
  await world({ routines: [routine, { id: 'r-e', name: 'Evening', order: 2, window: { from: '19:00', to: '23:59' }, steps: [{ id: 'e1', label: 'Teeth' }] }] });
  assert.equal(R.current(T, at('07:00'))?.routine.id, 'r-m');
  assert.equal(R.current(T, at('13:00')), null);
  assert.equal(R.current(T, at('21:00'))?.routine.id, 'r-e');
  assert.equal(R.windowState(R.routine('r-e'), at('00:30', addDays(T, 1))), 'after', 'past the evening window, before the day ends');
  assert.equal(R.windowState(R.routine('r-m'), at('04:00')), 'before');
});

test('a routine counts once in the score, with part credit; your three count on their own', async () => {
  await world({ habits: [hb('a'), hb('b'), hb('c'), hb('f', { state: 'focus', focusSince: T })],
    routines: [{ ...routine, steps: [...routine.steps, { id: 's5', habitId: 'f' }] }] });
  H.toggle(H.habit('a'), T);
  H.toggle(H.habit('b'), T);
  const s = dayScore(T);
  const r = s.items.find((i) => i.kind === 'routine');
  assert.equal(r.steps, 4, 'the focus habit is not a routine step for the score');
  assert.equal(r.stepsDone, 2);
  assert.equal(s.total, 2);
  assert.equal(s.ratio, (0.5 + 0) / 2);
});

test('sick and minimum days leave routines out of the plan; a paused habit leaves its routine', async () => {
  await world();
  store.put('dailyReviews', { id: T, date: T, mode: 'sick' });
  assert.equal(dayScore(T).items.filter((i) => i.kind === 'routine').length, 0);
  store.put('dailyReviews', { id: T, date: T, mode: 'normal' });
  HS.setState(H.habit('b'), 'paused', { until: addDays(T, 5) });
  assert.equal(R.progress(R.routine('r-m'), T).total, 3);
});

test('the migration creates routines once', async () => {
  await fresh({ profile: [profileSeed()], settings: [settingsSeed()], habits: habitsSeed() });
  const m = MIGRATIONS.find((x) => x.id === '2026-10-routines');
  store.batch(m.run());
  assert.equal(store.all('routines').length, 2);
  assert.equal(m.run().length, 0);
});
