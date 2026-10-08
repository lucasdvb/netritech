// Apple Health paste (U10): the Shortcut's text and the obvious variations, never a guess.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHealth, SAMPLE } from '../../js/domain/health-paste.js';

const T = '2026-10-07';

test('the Shortcut’s own text', () => {
  assert.deepEqual(parseHealth(SAMPLE, T), { date: T, steps: 8432, sleepHours: 7.4, weightKg: 76.4, unknown: [] });
});

test('labels in any order, units, separators and durations', () => {
  const p = parseHealth('Weight: 168 lb\nSleep: 7h 30m\nSteps: 10,432', T);
  assert.equal(p.steps, 10432);
  assert.equal(p.sleepHours, 7.5);
  assert.ok(Math.abs(p.weightKg - 76.2) < 0.01);
  assert.equal(parseHealth('sleep: 7:15', T).sleepHours, 7.25);
  assert.equal(parseHealth('sleep: 450 min', T).sleepHours, 7.5);
  assert.equal(parseHealth('sleep: 27000', T).sleepHours, 7.5, 'seconds from Health');
  assert.equal(parseHealth('steps 8432; weight 76,4 kg', T).weightKg, 76.4);
});

test('JSON from a Shortcut dictionary', () => {
  const p = parseHealth('{"steps": 9001, "sleep": 6.9, "weight": "75.8"}', T);
  assert.deepEqual([p.steps, p.sleepHours, p.weightKg], [9001, 6.9, 75.8]);
});

test('dates: yesterday and explicit days, never the future', () => {
  assert.equal(parseHealth('date: yesterday\nsteps: 5000', T).date, '2026-10-06');
  assert.equal(parseHealth('date: 2026-10-05\nsteps: 5000', T).date, '2026-10-05');
  assert.equal(parseHealth('date: 2026-12-01\nsteps: 5000', T).date, T);
});

test('nothing it can place is ever guessed', () => {
  assert.equal(parseHealth('hello world', T), null);
  assert.equal(parseHealth('', T), null);
  const p = parseHealth('steps: 8000\nheart rate: 61\nweight: 9999', T);
  assert.equal(p.steps, 8000);
  assert.equal(p.weightKg, null, 'an impossible weight is left out');
  assert.deepEqual(p.unknown, ['heart rate: 61']);
});
