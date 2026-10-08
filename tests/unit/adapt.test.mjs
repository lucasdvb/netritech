// Safety nets (Phase 5): shrink and grow, time away, catch-up, the weekly tidy-up, rituals and
// sealing the day. Rules suggest; nothing changes until you accept, and Undo puts it back.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';
import * as H from '../../js/domain/habits.js';
import * as A from '../../js/domain/adapt.js';
import * as Rt from '../../js/domain/rituals.js';
import { dayScore } from '../../js/domain/scoring.js';

setDayEnd('03:00');
const T = today();
const hb = (id, o = {}) => ({ id, name: id, type: 'binary', schedule: { kind: 'daily' }, state: 'focus', focusSince: addDays(T, -60), section: 'life', order: 0, ...o });
const pushups = (o = {}) => hb('push', { name: 'Push-ups', type: 'quantity', unit: 'reps', target: 50, step: 5, ...o });

async function world({ habits = [pushups()], settings = {}, start = addDays(T, -60) } = {}) {
  await fresh({ profile: [{ ...profileSeed(), trackingStart: start }], settings: [{ ...settingsSeed(), ...settings }], habits });
}
const logDays = (id, days, value = 1) => { for (const n of days) store.put('habitLogs', { id: `${id}:${addDays(T, -n)}`, habitId: id, date: addDays(T, -n), value }); };

test('shrink: three misses in a week suggests a smaller target for two weeks, and Undo restores it', async () => {
  await world();
  logDays('push', [1, 3, 5, 9, 10, 11, 12, 13], 50); // days 2, 4, 6 and 7 missed
  const p = A.proposal(H.habit('push'));
  assert.equal(p.kind, 'shrink');
  assert.equal(p.to, 30);
  const undo = A.accept(p);
  assert.equal(H.threshold(H.habit('push'), T), 30);
  assert.equal(H.threshold(H.habit('push'), addDays(T, 14)), 50, 'the smaller target ends after two weeks');
  assert.equal(A.proposal(H.habit('push')), null, 'no new suggestion while the smaller target runs');
  undo();
  assert.equal(H.habit('push').temp, undefined);
  assert.equal(H.threshold(H.habit('push'), T), 50);
});

test('shrink: two misses in a row on a yes/no habit suggests its tiny version', async () => {
  await world({ habits: [hb('pray', { tiny: { label: 'One sentence', min: null } })] });
  logDays('pray', [3, 4, 5, 6, 7]);
  const p = A.proposal(H.habit('pray'));
  assert.deepEqual([p.kind, p.tiny, p.label], ['shrink', true, 'One sentence']);
});

test('grow: two steady weeks at 95% suggest a 10% step up', async () => {
  await world();
  logDays('push', Array.from({ length: 14 }, (_, i) => i + 1), 50);
  const p = A.proposal(H.habit('push'));
  assert.deepEqual([p.kind, p.from, p.to], ['grow', 50, 55]);
  A.accept(p);
  assert.equal(H.habit('push').target, 55);
});

test('no suggestion repeats within 14 days, and the net can be turned off', async () => {
  await world();
  logDays('push', [1, 3, 5, 9], 50);
  assert.equal(A.suggestions(T).length, 1);
  A.markSuggested('push', T);
  for (let d = 0; d < 14; d++) assert.ok(!A.suggestions(addDays(T, d)).some((p) => p.habitId === 'push'), `day ${d}`);
  assert.ok(!A.recentlySuggested('push', addDays(T, 14)));
  store.setSettings({ nets: { adapt: false } });
  assert.deepEqual(A.suggestions(T), []);
});

test('time away: three or more empty days are found, marked away, and skipped by runs and scores', async () => {
  await world({ habits: [hb('pray')] });
  logDays('pray', [6, 7, 8, 9, 10]);
  const a = A.absence(T);
  assert.deepEqual(a, { from: addDays(T, -5), to: addDays(T, -1), days: 5 });
  assert.equal(H.runs(H.habit('pray'), addDays(T, -1)).current, 0, 'before: the gap reads as misses');
  A.markAway(a);
  assert.equal(H.dayMode(addDays(T, -3)), 'away');
  const r = H.runs(H.habit('pray'), addDays(T, -1));
  assert.equal(r.missesInRow, 0);
  assert.equal(r.current, 5, 'the run carries on over the days away');
  assert.equal(dayScore(addDays(T, -3)).total, 0);
  assert.equal(A.catchUp(T), null, 'no catch-up list after time away');
});

test('a fresh install or a short gap is not "away"', async () => {
  await world({ habits: [hb('pray')], start: T });
  assert.equal(A.absence(T), null);
  await world({ habits: [hb('pray')] });
  logDays('pray', [3]);
  assert.equal(A.absence(T), null, 'two empty days are just two days');
});

test('catch-up: yesterday’s unlogged plan, once, and never on a sick or sealed day', async () => {
  await world({ habits: [hb('pray'), hb('read')] });
  logDays('pray', [1, 2]);
  logDays('read', [2]);
  const c = A.catchUp(T);
  assert.deepEqual(c.habits.map((h) => h.id), ['read']);
  A.closeCatchUp(c.date);
  assert.equal(A.catchUp(T), null);
  await world({ habits: [hb('pray')] });
  logDays('pray', [2]);
  store.put('dailyReviews', { id: addDays(T, -1), date: addDays(T, -1), mode: 'sick' });
  assert.equal(A.catchUp(T), null);
  store.put('dailyReviews', { id: addDays(T, -1), date: addDays(T, -1), sealedAt: 'x' });
  assert.equal(A.catchUp(T), null);
  store.setSettings({ nets: { catchUp: false } });
  store.remove('dailyReviews', addDays(T, -1));
  assert.equal(A.catchUp(T), null);
});

test('tidy-up: habits untouched for two weeks, once a week', async () => {
  await world({ habits: [hb('pray', { state: 'autopilot' }), hb('old', { state: 'autopilot' })] });
  logDays('pray', [2]);
  logDays('old', [20]);
  assert.deepEqual(A.untouched(T).map((h) => h.id), ['old']);
  assert.ok(A.tidyDue(T));
  A.markTidy(T);
  assert.equal(A.tidyDue(addDays(T, 3)), null);
  assert.ok(A.tidyDue(addDays(T, 7)));
});

test('rituals: the evening only asks what applies; sealing is undoable', async () => {
  await world({ habits: [hb('pray')] });
  assert.deepEqual(Rt.steps('evening', T), ['habits', 'win', 'tomorrow', 'seal']);
  logDays('pray', [0]);
  assert.deepEqual(Rt.steps('evening', T), ['win', 'tomorrow', 'seal']);
  const undo = Rt.seal(T);
  assert.ok(Rt.sealedAt(T));
  undo();
  assert.equal(Rt.sealedAt(T), null);
  Rt.markRitual(T, 'morning');
  assert.ok(Rt.ritualDone(T, 'morning'));
});

test('the bounded miss count matches the full history, for every kind of schedule', async () => {
  const kinds = [{ kind: 'daily' }, { kind: 'weekdays', days: [1, 3, 5] }, { kind: 'perWeek', count: 3 }, { kind: 'perMonth', count: 4 }, { kind: 'interval', every: 3 }];
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const schedule of kinds) {
    for (let trial = 0; trial < 8; trial++) {
      await world({ habits: [hb('x', { schedule })], start: addDays(T, -200) });
      // Long gaps on some trials, so the answer sits beyond the 14- and 60-day windows.
      const gap = [0, 20, 90, 190][trial % 4];
      logDays('x', Array.from({ length: 200 }, (_, i) => i).filter((n) => n > gap && rand() < (trial % 2 ? 0.5 : 0.15)));
      const end = addDays(T, -1);
      const full = H.runs(H.habit('x'), end).missesInRow;
      assert.equal(A.missesInRow(H.habit('x'), end), full, `${schedule.kind}, trial ${trial}`);
      assert.equal(A.missesInRow(H.habit('x'), end, A.recentRecord(H.habit('x'), T).periods), full, `${schedule.kind}, trial ${trial}, sharing the fortnight`);
    }
  }
});
