// The handover audit: each defect found, pinned down so it stays fixed. Calculations (pauses,
// state changes, intervals, weekly targets, limits, durations, money), data safety (backup ids,
// CSV), and markup safety (colours and categories that land in HTML).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd, startOfWeek, durationHM } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';
import * as H from '../../js/domain/habits-more.js';
import * as HS from '../../js/domain/habit-system.js';
import * as T from '../../js/domain/tasks.js';
import { dayScore } from '../../js/domain/scoring.js';
import { mastery } from '../../js/domain/levels.js';
import { catColor } from '../../js/domain/taxonomy.js';
import { safeColor } from '../../js/ui/charts.js';
import { inspect, toCSV } from '../../js/data/backup.js';
import * as Money from '../../js/domain/money.js';
import { fieldNum } from '../../js/ui/format.js';

setDayEnd('00:00');
const D = today();
const d = (n) => addDays(D, n);
const simple = (id, o = {}) => ({ id, name: id, type: 'binary', schedule: { kind: 'daily' }, state: 'focus', focusSince: d(-60), startDate: d(-60), order: 0, ...o });
const world = (habits, start = d(-60)) => fresh({ profile: [{ ...profileSeed(), trackingStart: start }], settings: [settingsSeed()], habits });
const done = (id, n) => store.put('habitLogs', { id: H.logId(id, d(n)), habitId: id, date: d(n), value: 1, completed: true });

test('a pause counts as neither done nor missed: the run carries through it', async () => {
  await world([simple('a')]);
  for (let n = -30; n <= -11; n++) done('a', n);
  // Paused on day -10 until day -3 (recorded as it would have been, on that day).
  const h = H.habit('a');
  store.put('habits', { ...h, state: 'focus', stateLog: [{ from: '0000-01-01', state: 'focus' }, { from: d(-10), state: 'paused', until: d(-3), before: 'focus' }] });
  for (let n = -3; n <= -1; n++) done('a', n);
  const r = H.runs(H.habit('a'));
  assert.ok(r.current >= 23, `run ${r.current}`);
  const c = H.consistency(H.habit('a'), D, 30);
  assert.equal(c.done, c.expected, JSON.stringify(c));
  assert.ok(H.dots(H.habit('a'), d(-4), 7).every((x) => x.state === 'rest'), 'paused days show as rest');
});

test('changing a habit’s state today leaves earlier days’ scores as they were', async () => {
  await world([simple('A'), simple('B')]);
  done('A', -10);
  const before = dayScore(d(-10));
  assert.deepEqual([before.done, before.total], [1, 2]);
  HS.setState(H.habit('B'), 'paused', { until: d(7) });
  const after = dayScore(d(-10));
  assert.deepEqual([after.done, after.total], [1, 2], 'pausing B today doesn’t take it out of day -10');
  assert.equal(H.stateOf(H.habit('B'), D), 'paused');
  assert.equal(H.stateOf(H.habit('B'), d(-10)), 'focus');
});

test('every-three-days windows stay put from one day to the next', async () => {
  await world([simple('i', { schedule: { kind: 'interval', every: 3 }, startDate: d(-500) })], d(-500));
  for (let n = -500; n < 0; n++) if (((n + 500) % 6 === 0) || ((n + 500) % 6 === 2)) done('i', n);
  const a = H.periodsOf(H.habit('i'), d(-30), d(-1)).map((p) => p.key);
  const b = H.periodsOf(H.habit('i'), d(-29), d(-1)).map((p) => p.key);
  assert.ok(b.every((k) => a.includes(k)), JSON.stringify({ a: a.slice(0, 3), b: b.slice(0, 3) }));
  // So the run doesn't halve or double overnight.
  const today = H.runs(H.habit('i'), D).current, yesterday = H.runs(H.habit('i'), d(-1)).current;
  assert.ok(Math.abs(today - yesterday) <= 1, `${today} vs ${yesterday}`);
});

test('a past day of a weekly-target habit isn’t changed by a later log that week', async () => {
  await world([simple('w', { schedule: { kind: 'perWeek', count: 3 } })]);
  const mon = addDays(startOfWeek(D), -7);
  const fri = addDays(mon, 4);
  const sat = addDays(mon, 5);
  const before = dayScore(fri);
  store.put('habitLogs', { id: H.logId('w', sat), habitId: 'w', date: sat, value: 1, completed: true });
  const after = dayScore(fri);
  assert.deepEqual([after.done, after.total], [before.done, before.total]);
});

test('limits: a day that hasn’t come isn’t kept yet, and clean days count towards mastery', async () => {
  await world([simple('L', { type: 'limit', limit: 0, startDate: d(-21) })], d(-21));
  assert.equal(H.isDone(H.habit('L'), d(3)), false);
  assert.deepEqual(H.dots(H.habit('L'), d(3), 7).slice(-3).map((x) => x.state), ['future', 'future', 'future']);
  assert.ok(mastery(H.habit('L')).count >= 20, `mastery ${mastery(H.habit('L')).count}`);
});

test('clearing a priority: a bare one goes; one with more to it stays as a task', async () => {
  await world([]);
  T.setPriority(D, 0, 'Quick call');
  const rich = T.setPriority(D, 1, 'Prepare the proposal');
  store.put('tasks', { ...rich, notes: 'Pricing, timeline, references' });
  const undo = T.setPriorityUndoable(D, 0, '   ');
  assert.equal(T.all().some((t) => t.title === 'Quick call'), false);
  undo();
  assert.equal(T.all().some((t) => t.title === 'Quick call'), true, 'Undo brings it back');
  T.setPriority(D, 1, '');
  const kept = T.all().find((t) => t.title === 'Prepare the proposal');
  assert.ok(kept && !kept.rank && kept.notes, 'kept with its notes, out of the Top 3');
});

test('durations never read “60m”, money never “-$0”, cents round in decimal', () => {
  assert.equal(durationHM(119.6), '2h 00m');
  assert.equal(durationHM(59.7), '1h 00m');
  assert.equal(durationHM(479.66), '8h 00m');
  assert.ok(!Money.fmt(-0.004).includes('-'));
  assert.equal(fieldNum(72.45), '72.5');
  assert.equal(fieldNum(1200.04), '1200');
  assert.equal(fieldNum(null), '');
});

test('backups: ids must be real ids; photos must be image data', () => {
  const ok = { app: 'life-os', kind: 'backup', schema: 1, data: { tasks: [{ id: 't1', title: 'x' }] } };
  assert.ok(inspect(ok));
  for (const bad of [{ id: {} }, { id: [] }, { id: '' }, { id: null }, ['x']]) {
    assert.throws(() => inspect({ ...ok, data: { tasks: [bad] } }), /missing their ids/);
  }
  assert.throws(() => inspect({ ...ok, data: { photoBlobs: [{ id: 'p', dataUrl: 'https://example.com/x.png' }] } }), /damaged/);
  assert.ok(inspect({ ...ok, data: { photoBlobs: [{ id: 'p', dataUrl: 'data:image/jpeg;base64,AAAA' }] } }));
});

test('CSV: formulas stay text, quotes and line breaks are quoted, and it starts with a BOM', () => {
  const csv = toCSV([{ a: '=HYPERLINK("x")', b: -5, c: 'café, "q"', d: 'two\r\nlines' }]);
  assert.ok(csv.startsWith('﻿a,b,c,d'));
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")"`));
  assert.ok(csv.includes(',-5,'), 'numbers stay numbers');
  assert.ok(csv.includes('"café, ""q"""'));
  assert.ok(csv.includes('"two\r\nlines"'));
});

test('only known categories and plain colours reach markup', () => {
  assert.equal(catColor('body'), 'var(--c-body)');
  assert.equal(catColor('x)"/><img src=x onerror=alert(1)>'), 'var(--c-life)');
  assert.equal(safeColor('var(--accent)'), 'var(--accent)');
  assert.equal(safeColor('#22808A'), '#22808A');
  assert.equal(safeColor('red" onload="x'), 'var(--accent)');
});
