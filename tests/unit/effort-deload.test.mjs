// Effort per set, autoregulation and the automatic deload: reps in reserve make the estimated max
// honest, move the next set and the next session; a lighter week is suggested when lifts stall,
// recovery is poor or hard weeks pile up, and while it runs the sessions are lighter.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';
import * as E from '../../js/domain/effort.js';
import * as DL from '../../js/domain/deload.js';
import { nextStep } from '../../js/domain/next-step.js';

setDayEnd('00:00');
const T = today();
const d = (n) => addDays(T, n);
const base = { profile: [{ ...profileSeed(), trackingStart: d(-120) }], settings: [settingsSeed()] };
const ex = (id, o = {}) => ({ id, name: id, category: 'chest', metric: 'reps', unilateral: false, family: null, level: 0, defaultLoad: 20, ...o });
let n = 0;
/** A finished session on day `day`: { exerciseId: [[reps, load, rir], …] }. */
function session(day, byEx) {
  const w = store.put('workouts', { id: `w${++n}`, date: d(day), title: 'S', kind: 'strength', status: 'done', startedAt: `${d(day)}T07:00:00` });
  const ops = [];
  let order = 0;
  for (const [exerciseId, sets] of Object.entries(byEx)) {
    sets.forEach(([reps, load, rir], i) => ops.push({ store: 'workoutSets', value: { workoutId: w.id, date: d(day), exerciseId, order, setIndex: i, reps, load, rir: rir ?? null, completed: true } }));
    order++;
  }
  store.batch(ops);
}

test('the estimated max counts reps left in the tank', () => {
  assert.equal(Math.round(E.e1rm(100, 5)), 117);
  assert.equal(E.e1rm(100, 8, 2), E.e1rm(100, 10, 0));
  assert.equal(E.e1rm(0, 10), null);
  assert.equal(E.e1rm(100, 5, 9), E.e1rm(100, 5, 4), 'RIR counts up to 4');
  assert.equal(Math.round(E.bestE1rm([{ load: 100, reps: 5, completed: true }, { load: 105, reps: 3, completed: true }, { load: 200, reps: 1, warmup: true, completed: true }])), 117);
});

test('the next set follows how the last one felt', () => {
  assert.deepEqual(E.adjustNext({ reps: 8, load: 60, rir: 4, completed: true }, '6–10'), { load: 62.5, reps: 8, why: '4+ reps left last set: a step heavier.' });
  assert.deepEqual(E.adjustNext({ reps: 4, load: 60, rir: 0, completed: true }, '6–10'), { load: 57, reps: 6, why: 'Nothing left and below the range: 5% lighter.' });
  assert.equal(E.adjustNext({ reps: 8, load: 60, rir: 2, completed: true }, '6–10'), null);
  assert.equal(E.adjustNext({ reps: 8, load: 60, completed: true }, '6–10'), null, 'no effort given: no change');
  assert.equal(E.adjustNext({ reps: 12, load: 0, rir: 4, completed: true }, '8–15', { bodyweight: true }).reps, 14);
});

test('the next session: a bigger step with lots to spare, lighter when the reps fell short with nothing left', async () => {
  await fresh({ ...base, exercises: [ex('bench'), ex('squat'), ex('row')] });
  session(-3, { bench: [[10, 60, 3], [10, 60, 3], [10, 60, 4]], squat: [[5, 100, 0], [4, 100, 0], [4, 100, 0]], row: [[8, 50, 3], [8, 50, 4], [8, 50, 3]] });
  const b = nextStep('bench', '6–10', { before: T });
  assert.deepEqual([b.kind, b.load, b.reps], ['load', 65, 6]);
  assert.match(b.why, /to spare/);
  const s = nextStep('squat', '6–10', { before: T });
  assert.deepEqual([s.kind, s.load, s.reps], ['load', 95, 6]);
  assert.match(s.why, /lighter/);
  const r = nextStep('row', '6–10', { before: T });
  assert.deepEqual([r.kind, r.reps, r.load], ['reps', 10, 50]);
  assert.match(r.why, /two more/i);
});

test('a lighter week is suggested when two lifts stall for three sessions, and not again for 14 days', async () => {
  await fresh({ ...base, exercises: [ex('bench'), ex('squat')] });
  session(-21, { bench: [[8, 80]], squat: [[8, 120]] });
  session(-14, { bench: [[8, 80]], squat: [[7, 120]] });
  session(-7, { bench: [[7, 80]], squat: [[8, 120]] });
  session(-1, { bench: [[8, 80]], squat: [[8, 120]] });
  assert.deepEqual(DL.stalledLifts(T).sort(), ['bench', 'squat']);
  const sig = DL.signal(T);
  assert.equal(sig.kind, 'stalled');
  const undo = DL.snooze(T);
  assert.equal(DL.signal(T), null);
  assert.equal(DL.signal(d(15))?.kind, 'stalled');
  undo();
  DL.start(sig.why, T);
  assert.ok(DL.active(T) && DL.active(d(6)) && !DL.active(d(7)));
  assert.equal(DL.signal(T), null, 'not while in one');
  assert.equal(DL.deloadSets(3), 2);
  assert.equal(DL.deloadSets(1), 1);
  DL.end(d(2));
  assert.ok(!DL.active(d(2)));
});

test('progress keeps a lighter week away; six hard weeks in a row bring one', async () => {
  await fresh({ ...base, exercises: [ex('bench')] });
  session(-21, { bench: [[8, 80]] });
  session(-14, { bench: [[8, 82.5]] });
  session(-7, { bench: [[8, 85]] });
  session(-1, { bench: [[8, 87.5]] });
  assert.deepEqual(DL.stalledLifts(T), []);
  assert.equal(DL.signal(T), null);
  for (let w = 1; w <= 6; w++) for (const day of [0, 2, 4]) session(-7 * w - (new Date().getDay() + 6) % 7 + day, { bench: [[8, 80 + w]] });
  assert.ok(DL.hardWeeks(T) >= 6);
  assert.equal(DL.signal(T)?.kind, 'weeks');
});
