// Phase 13: what the research says is missing. Reserve days, habit strength, stretch versions,
// comebacks, why it slipped, and a lighter day after a short night.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd, startOfWeek } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';
import * as H from '../../js/domain/habits-more.js';
import * as P from '../../js/domain/progression.js';
import * as I from '../../js/domain/insights.js';
import * as R from '../../js/domain/routines.js';
import { guidance } from '../../js/domain/coach.js';

setDayEnd('00:00');
const T = today();
const d = (n) => addDays(T, n);
const simple = (id, o = {}) => ({ id, name: id, type: 'binary', schedule: { kind: 'daily' }, state: 'focus', focusSince: d(-90), order: 0, ...o });
async function world(habits, extra = {}) {
  await fresh({ profile: [{ ...profileSeed(), trackingStart: d(-90) }], settings: [settingsSeed()], habits, ...extra });
}
const done = (id, n) => store.put('habitLogs', { id: H.logId(id, d(n)), habitId: id, date: d(n), value: 1, completed: true });

test('reserve days: not today spends the week’s reserve first and the run carries on; then it counts as a miss', async () => {
  await world([simple('a'), simple('flex', { schedule: { kind: 'perWeek', count: 3 } })]);
  const h = H.habit('a');
  assert.equal(H.reserveAllowance(h), 1);
  assert.equal(H.reserveAllowance(H.habit('flex')), 0, 'flexible habits already have slack');
  // A week fully in the past: done every day but one, which was set aside.
  const mon = startOfWeek(d(-14));
  const off = (n) => addDays(mon, n);
  for (let i = 0; i < 7; i++) if (i !== 2) store.put('habitLogs', { id: H.logId('a', off(i)), habitId: 'a', date: off(i), value: 1, completed: true });
  assert.deepEqual(H.skipToday(h, off(2)), { reserve: true });
  assert.ok(H.isReserve(h, off(2)));
  assert.equal(H.reservesLeft(h, off(4)), 0);
  assert.equal(H.runs(h, off(6)).current, 6, 'the reserve day is neutral: six done, no miss');
  assert.equal(H.consistency(h, off(6), 7).ratio, 1, 'nor does it lower consistency');
  // A second skip that week has no reserve left: it is a miss.
  H.setLog(h, off(4), { value: 0 });
  assert.deepEqual(H.skipToday(h, off(4)), { reserve: false });
  assert.equal(H.runs(h, off(4)).missesInRow, 1);
  // Logging it after all takes the skip and its reserve back.
  H.setLog(h, off(2), { value: 1 });
  assert.equal(H.isReserve(h, off(2)), false);
  // Your own number: none at all.
  store.put('habits', { ...H.habit('a'), reserves: 0 });
  assert.equal(H.reservesLeft(H.habit('a'), d(0)), 0);
});

test('strength: rises with each time it counts, dips a little with one miss, and is gentler on a weekly habit', async () => {
  await world([simple('a'), simple('w', { schedule: { kind: 'perWeek', count: 3 } })]);
  for (let i = 1; i <= 60; i++) done('a', -i);
  const before = H.strength(H.habit('a'), d(-1));
  assert.ok(before >= 90 && before <= 96, `60 days in a row: ${before}%`);
  store.remove('habitLogs', H.logId('a', d(-1)));
  const after = H.strength(H.habit('a'), d(-1));
  assert.ok(before - after <= 6 && after < before, `one miss dips it (${before} → ${after}), never resets it`);
  assert.equal(H.runs(H.habit('a'), d(-1)).current, 59, 'the run survives the one miss');
  // The step per judged period is bigger for a habit judged weekly.
  assert.ok(H.strengthStep(H.habit('w')) > H.strengthStep(H.habit('a')) * 4);
  assert.ok(Math.abs(H.strengthStep(H.habit('a')) - (1 - 0.5 ** (1 / 13))) < 1e-12);
});

test('stretch version: a bigger amount (or a hand mark) is marked as stretch and still counts as done', async () => {
  await world([
    simple('walk', { type: 'duration', unit: 'min', target: 20, tiny: { label: '5 min', min: 5 }, stretch: { label: 'The long loop', min: 45 } }),
    simple('read', { stretch: { label: 'A whole chapter' } }),
  ]);
  const w = H.habit('walk');
  H.setValue(w, T, 30);
  assert.equal(H.level(w, T), 'full');
  H.setValue(w, T, 50);
  assert.equal(H.level(w, T), 'stretch');
  assert.ok(H.counts(w, T));
  const r = H.habit('read');
  H.setStretch(r, T, true);
  assert.equal(H.level(r, T), 'stretch');
  assert.ok(H.isDone(r, T));
  H.setStretch(r, T, false);
  assert.equal(H.level(r, T), 'full', 'taking the stretch mark back leaves it done');
});

test('a comeback: the first time a habit counts after a miss is marked once a day', async () => {
  await world([simple('a')]);
  for (let i = 2; i <= 8; i++) done('a', -i);
  assert.equal(H.isComeback(H.habit('a'), T), false, 'not done yet today');
  done('a', 0);
  assert.equal(H.isComeback(H.habit('a'), T), true);
  const c = P.comeback(T);
  assert.equal(c.habitId, 'a');
  assert.equal(P.comeback(T), null, 'once a day');
  assert.equal(P.moment({ rewards: [], records: [], levels: [], seasons: [], comeback: c, focus: false }).kind, 'comeback');
  // A habit that never counted three times before has nothing to come back to.
  await world([simple('b')]);
  done('b', -3);
  done('b', 0);
  assert.equal(H.isComeback(H.habit('b'), T), false);
});

test('why it slipped: a habit mostly set aside because you forgot is offered a place in a routine, with Undo', async () => {
  const routines = [{ id: 'r-morning', name: 'Morning', kind: 'morning', window: { from: '06:00', to: '09:00' }, steps: [], order: 0 }];
  await world([simple('a', { time: '07:30' })], { routines });
  for (const n of [-3, -9, -16]) H.skipToday(H.habit('a'), d(n), { reason: 'forgot' });
  H.skipToday(H.habit('a'), d(-20), { reason: 'busy' });
  assert.equal(H.log('a', d(-3)).reason, 'forgot');
  const ins = I.insights(T).find((i) => i.id === 'forgot-a');
  assert.ok(ins, 'the insight is offered');
  assert.match(ins.title, /forgotten/);
  const undo = I.apply(ins);
  assert.ok(R.routine('r-morning').steps.some((s) => s.habitId === 'a'));
  undo();
  assert.equal(R.routine('r-morning').steps.length, 0);
});

test('a short night offers a lighter day, once the check-in says so', async () => {
  await world([simple('a')]);
  const noon = new Date(`${T}T08:30:00`);
  assert.ok(!guidance(T, noon).some((g) => g.id === 'light-day'));
  store.put('sleepEntries', { id: T, date: T, hours: 4.5 });
  const g = guidance(T, noon).find((x) => x.id === 'light-day');
  assert.ok(g, 'offered after 4.5 hours');
  assert.deepEqual(g.action.data, { mode: 'minimum' });
  store.put('sleepEntries', { id: T, date: T, hours: 7.5 });
  store.put('moodEntries', { id: T, date: T, energy: 2 });
  assert.ok(guidance(T, noon).some((x) => x.id === 'light-day'), 'or after a low-energy check-in');
  store.put('dailyReviews', { id: T, date: T, mode: 'minimum' });
  assert.ok(!guidance(T, noon).some((x) => x.id === 'light-day'), 'not once the day is already lighter');
});

test('habits to cut down or quit: a day within the limit is kept; urges show what they have in common', async () => {
  const U = await import('../../js/domain/urges.js');
  await world([simple('coffee', { type: 'limit', limit: 2, unit: 'coffees' }), simple('sugar', { type: 'limit', limit: 0 })]);
  const c = H.habit('coffee');
  assert.ok(H.isLimit(c));
  assert.ok(H.isDone(c, T), 'nothing logged: kept');
  H.addCount(c, T, 1);
  H.addCount(c, T, 1);
  assert.ok(H.isDone(c, T), 'at the limit: kept');
  H.addCount(c, T, 1);
  assert.equal(H.isDone(c, T), false, 'over the limit');
  assert.equal(H.addCount(c, T, -5), 0, 'never below zero');
  assert.equal(H.reserveAllowance(c), 0, 'nothing to skip');
  // Quitting: days free in a row, and a slip through the urge log adds to the count.
  const sg = H.habit('sugar');
  assert.ok(H.keptDays(sg, T) >= 30);
  const at = (n, hour) => new Date(`${d(n)}T${String(hour).padStart(2, '0')}:15:00`).toISOString();
  for (const n of [-1, -2, -3, -5]) U.log(sg, { outcome: 'resisted', where: 'home', feeling: 'tired', date: d(n), at: at(n, 20) });
  const slip = U.log(sg, { outcome: 'slipped', where: 'work', feeling: 'stressed', date: T, at: at(0, 15) });
  assert.equal(H.isDone(sg, T), false);
  assert.equal(H.keptDays(sg, T), 0);
  assert.equal(H.keptDays(sg, d(-1)) >= 30, true, 'yesterday was still free');
  const p = U.pattern('sugar');
  assert.deepEqual([p.total, p.resisted, p.slipped], [5, 4, 1]);
  assert.equal(p.when.id, 'evening');
  assert.equal(p.where.id, 'home');
  assert.equal(p.feeling.id, 'tired');
  slip.undo();
  assert.ok(H.isDone(sg, T), 'Undo takes the slip back');
  assert.equal(U.pattern('sugar').total, 4);
});

test('does it feel automatic: asked once a habit is strong, and a yes makes its reminders fade', async () => {
  const HS = await import('../../js/domain/habit-system.js');
  const R = await import('../../js/domain/reminders.js');
  await world([simple('a', { focusSince: d(-40), reminder: '07:00' }), simple('b', { focusSince: d(-5) })]);
  for (let i = 1; i <= 35; i++) done('a', -i);
  assert.ok(HS.autoDue(H.habit('a')));
  assert.equal(HS.autoDue(H.habit('b')), false, 'too new to ask');
  assert.equal(HS.recordAuto(H.habit('a'), [5, 4, 4, 4]), 4.3);
  assert.ok(H.feelsAutomatic(H.habit('a')));
  assert.equal(HS.autoDue(H.habit('a')), false, 'asked again only after four weeks');
  store.setSettings({ notifications: { habits: { on: true } } });
  const seven = new Date(`${T}T07:10:00`);
  assert.ok(!R.candidates(seven).some((c) => c.habitId === 'a'), 'its reminder has faded');
  HS.recordAuto(H.habit('a'), [2, 2, 3, 2], d(30));
  assert.equal(H.feelsAutomatic(H.habit('a')), false);
});
