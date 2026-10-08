// The Now card's next action across the day, and on minimum and sick days.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';
import * as H from '../../js/domain/habits.js';
import * as T from '../../js/domain/tasks.js';
import { nextAction, nextActions, useCoach } from '../../js/domain/next-action.js';
import { guidance } from '../../js/domain/coach.js';

useCoach(guidance);

setDayEnd('03:00');
const D = today();
const at = (hm, date = D) => { const [h, m] = hm.split(':').map(Number); const d = new Date(`${date}T00:00:00`); d.setHours(h, m); return d; };
const hb = (id, o = {}) => ({ id, name: id, type: 'binary', schedule: { kind: 'daily' }, state: 'autopilot', section: 'life', order: 0, ...o });

async function world({ habits = [], routines = [], extra = {} } = {}) {
  await fresh({ profile: [{ ...profileSeed(), trackingStart: addDays(D, -10), workDays: [1, 2, 3, 4, 5, 6, 7] }], settings: [settingsSeed()], habits, routines, templates: [], ...extra });
}
const checkIn = () => store.put('sleepEntries', { id: D, date: D, hours: 7.5, quality: 7 });

test('07:00 without a check-in: start with the check-in', async () => {
  await world();
  assert.equal(nextAction(D, at('07:00')).id, 'checkin');
});

test('07:00 after the check-in: the morning routine’s next step, with “Did it all”', async () => {
  await world({ habits: [hb('a', { section: 'morning' }), hb('b', { section: 'morning' })],
    routines: [{ id: 'r-m', name: 'Morning', order: 1, window: { from: '05:00', to: '10:00' }, steps: [{ id: 's1', habitId: 'a' }, { id: 's2', habitId: 'b' }] }] });
  checkIn();
  const a = nextAction(D, at('07:00'));
  assert.equal(a.kind, 'routine');
  assert.equal(a.title, 'a');
  assert.equal(a.secondary.act, 'did-it-all');
  H.toggle(H.habit('a'), D);
  assert.equal(nextAction(D, at('07:05')).title, 'b');
});

test('13:00 on a workday: the first open priority comes before your three', async () => {
  await world({ habits: [hb('f', { state: 'focus', focusSince: D })] });
  checkIn();
  T.setPriority(D, 0, 'Ship the proposal');
  const a = nextAction(D, at('13:00'));
  assert.equal(a.kind, 'priority');
  assert.equal(a.title, 'Ship the proposal');
  T.toggle(T.slots(D)[0].id);
  assert.equal(nextAction(D, at('13:00')).habitId, 'f');
});

test('21:00: close the work day first; overdue tasks wait until the morning', async () => {
  await world();
  checkIn();
  T.add({ title: 'Old thing', date: addDays(D, -2) });
  const list = nextActions(D, at('21:00'));
  assert.equal(list[0].id, 'shutdown');
  assert.ok(list.some((c) => c.kind === 'overdue'));
  assert.equal(nextActions(D, at('23:00')).some((c) => c.kind === 'overdue'), false, 'not at night');
});

test('00:30: nothing urgent, so the card says it is time to wind down', async () => {
  await world();
  checkIn();
  const a = nextAction(D, at('00:30', addDays(D, 1)));
  assert.equal(a.kind, 'done');
});

test('a minimum day offers the tiny versions; a sick day only asks you to rest', async () => {
  await world({ habits: [hb('m', { mvd: true, tiny: { label: 'Two minutes' } })] });
  checkIn();
  store.put('dailyReviews', { id: D, date: D, mode: 'minimum' });
  const a = nextAction(D, at('13:00'));
  assert.equal(a.eyebrow, 'Minimum day');
  assert.equal(a.title, 'Two minutes');
  store.put('dailyReviews', { id: D, date: D, mode: 'sick' });
  assert.equal(nextAction(D, at('13:00')).id, 'sick');
  assert.equal(nextActions(D, at('13:00')).length, 1);
});

test('past days have no next action', async () => {
  await world();
  assert.deepEqual(nextActions(addDays(D, -1), at('13:00')), []);
});
