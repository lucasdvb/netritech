// Phase 12: repeats you can shape, dates that come round every year, money against a budget,
// workouts you build, lists, the focus timer, and the limits that became settings.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { setDayEnd, addDays } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, habitsSeed } from '../../js/data/seed.js';
import * as T from '../../js/domain/tasks.js';
import * as E from '../../js/domain/events.js';
import * as $ from '../../js/domain/money.js';
import * as TP from '../../js/domain/templates.js';
import * as F from '../../js/domain/fitness-core.js';
import * as L from '../../js/domain/lists.js';
import * as FO from '../../js/domain/focus.js';
import * as H from '../../js/domain/habits.js';
import * as HS from '../../js/domain/habit-system.js';
import { moved } from '../../js/ui/reorder.js';

setDayEnd('00:00');
const base = () => ({ profile: [profileSeed()], settings: [settingsSeed()] });

test('task repeats: every n days, several weekdays, every weekday, monthly and yearly', () => {
  assert.equal(T.nextDate({ kind: 'daily', n: 1 }, '2026-10-08'), '2026-10-09');
  assert.equal(T.nextDate({ kind: 'daily', n: 3 }, '2026-10-08'), '2026-10-11');
  const mwf = { kind: 'weekly', day: 1, days: [1, 3, 5] };
  assert.equal(T.firstDate(mwf, '2026-10-08'), '2026-10-09'); // Thu → Fri
  assert.equal(T.nextDate(mwf, '2026-10-09'), '2026-10-12'); // Fri → Mon
  assert.equal(T.repeatLabel(mwf), 'Every Mon, Wed, Fri');
  assert.equal(T.repeatLabel({ kind: 'weekly', day: 1, days: [1, 2, 3, 4, 5] }), 'Every weekday');
  assert.equal(T.repeatLabel({ kind: 'weekly', day: 4 }), 'Every Thursday'); // older single-day repeats still read
  const yearly = { kind: 'yearly', month: 2, day: 29 };
  assert.equal(T.firstDate(yearly, '2026-10-08'), '2027-02-28');
  assert.equal(T.repeatLabel({ kind: 'yearly', month: 3, day: 14 }), 'Every year on March 14');
  assert.equal(T.nextDate({ kind: 'monthly', day: 31 }, '2026-10-31'), '2026-11-30');
});

test('dates: birthdays come round every year with an age; events count down once', async () => {
  await fresh(base());
  E.save({ title: 'Mum', kind: 'birthday', date: '1965-10-13' });
  E.save({ title: 'Our wedding', kind: 'event', date: '2027-01-03', countdown: true });
  E.save({ title: 'Grandad', kind: 'birthday', date: '1940-03-01', noYear: true });
  E.save({ title: 'Leap', kind: 'anniversary', date: '2020-02-29' });
  const from = '2026-10-08';
  const s = E.sorted(from);
  assert.deepEqual(s.map((x) => x.e.title), ['Mum', 'Our wedding', 'Leap', 'Grandad']);
  assert.equal(E.label(s[0]), 'Mum turns 61');
  assert.equal(s[0].in, 5);
  assert.equal(E.label(s.find((x) => x.e.title === 'Grandad')), 'Grandad’s birthday');
  assert.equal(E.next(s.find((x) => x.e.title === 'Leap').e, from), '2027-02-28');
  // Today shows the next two weeks, plus countdowns however far.
  assert.deepEqual(E.upcoming(from).map((x) => x.e.title), ['Mum', 'Our wedding']);
  assert.equal(E.inWords(0), 'Today');
  assert.equal(E.inWords(87), 'in 12 weeks');
  assert.throws(() => E.save({ title: '', date: '2026-01-01' }), /name/);
});

test('money: a month by category, against a budget, with what is left per day', async () => {
  await fresh(base());
  $.setConfig({ currency: 'EUR', budget: 1000 });
  $.save({ amount: 120.5, category: 'groceries', date: '2026-10-02' });
  $.save({ amount: 80, category: 'food', date: '2026-10-05', note: 'Lunch' });
  $.save({ amount: 40, category: 'groceries', date: '2026-10-07' });
  $.save({ amount: 999, category: 'fun', date: '2026-09-30' }); // last month
  const s = $.summary('2026-10', '2026-10-08');
  assert.equal(s.total, 240.5);
  assert.equal(s.count, 3);
  assert.deepEqual(s.byCategory.map((c) => [c.id, c.total]), [['groceries', 160.5], ['food', 80]]);
  assert.equal(s.left, 759.5);
  assert.equal(s.daysLeft, 24); // the 8th to the 31st
  assert.ok(Math.abs(s.perDay - 759.5 / 24) < 1e-9);
  assert.throws(() => $.save({ amount: 0 }), /above zero/);
  assert.match($.fmt(1250), /1,250/);
});

test('workouts: build one, reorder its exercises, delete it and the plan clears (Undo puts both back)', async () => {
  await fresh({ ...base(), exercises: [{ id: 'e-a', name: 'A', category: 'chest', metric: 'reps' }, { id: 'e-b', name: 'B', category: 'core', metric: 'time' }, { id: 'e-c', name: 'C', category: 'cardio', metric: 'minutes' }] });
  const t = TP.create({ name: 'Push' });
  TP.addItem(t.id, 'e-a');
  TP.addItem(t.id, 'e-b');
  TP.addItem(t.id, 'e-c');
  assert.deepEqual(F.template(t.id).items.map((i) => [i.exerciseId, i.sets, i.reps]), [['e-a', 3, '8–12'], ['e-b', 3, '30–45 s'], ['e-c', 1, '20 min']]);
  assert.ok(F.template(t.id).items.every((i) => i.id), 'items carry ids');
  TP.moveItem(t.id, 2, 0);
  assert.deepEqual(F.template(t.id).items.map((i) => i.exerciseId), ['e-c', 'e-a', 'e-b']);
  TP.updateItem(t.id, 1, { sets: 4, rest: 120, load: 20 });
  assert.equal(F.template(t.id).items[1].rest, 120);
  assert.ok(TP.estimateMinutes(F.template(t.id).items) >= 25);
  store.setProfile({ plan: { 1: t.id, 3: t.id, 5: null } });
  assert.deepEqual(TP.planTargets(), { strength: 2, cardio: 0, recovery: 0 });
  const undo = TP.remove(t.id);
  assert.equal(F.template(t.id), undefined);
  assert.deepEqual(store.profile().plan, { 1: null, 3: null, 5: null });
  undo();
  assert.equal(F.template(t.id).name, 'Push');
  assert.equal(store.profile().plan[1], t.id);
  const copy = TP.duplicate(t.id);
  assert.equal(copy.name, 'Push (copy)');
  assert.equal(copy.items.length, 3);
});

test('a session becomes a workout: its exercises, set counts, rep range and top load', async () => {
  await fresh({ ...base(), exercises: [{ id: 'e-a', name: 'A', category: 'chest', metric: 'reps' }] });
  const w = store.put('workouts', { date: '2026-10-08', title: 'Monday push', kind: 'strength', status: 'done', minutes: 40 });
  [[8, 20], [10, 22.5], [9, 22.5]].forEach(([reps, load], i) => store.put('workoutSets', { workoutId: w.id, date: w.date, exerciseId: 'e-a', order: 0, setIndex: i, reps, load, completed: true }));
  const t = TP.fromWorkout(w.id);
  assert.equal(t.name, 'Monday push');
  assert.deepEqual(t.items.map((i) => [i.exerciseId, i.sets, i.reps, i.load]), [['e-a', 3, '8–10', 22.5]]);
});

test('lists: paste several lines, tick, clear the ticked, untick to reuse', async () => {
  await fresh(base());
  const l = L.create('Groceries');
  L.add(l.id, 'Eggs\n Milk \n\nBread');
  assert.deepEqual(L.list(l.id).items.map((i) => i.text), ['Eggs', 'Milk', 'Bread']);
  const [eggs, milk] = L.list(l.id).items;
  L.toggle(l.id, eggs.id);
  L.toggle(l.id, milk.id);
  assert.deepEqual(L.counts(L.list(l.id)), { done: 2, total: 3 });
  L.uncheckAll(l.id);
  assert.equal(L.counts(L.list(l.id)).done, 0);
  L.toggle(l.id, eggs.id);
  L.clearDone(l.id);
  assert.deepEqual(L.list(l.id).items.map((i) => i.text), ['Milk', 'Bread']);
  L.moveItem(l.id, 1, 0);
  assert.deepEqual(L.list(l.id).items.map((i) => i.text), ['Bread', 'Milk']);
});

test('focus timer: pauses, counts a finished block for its day, and settles one that ran out while away', async () => {
  await fresh(base());
  const t0 = Date.parse('2026-10-08T09:00:00');
  store.setSettings({ focus: { startedAt: new Date(t0).toISOString(), minutes: 25, label: 'Proposal', pausedAt: null, pausedMs: 0 } });
  assert.equal(FO.remaining(FO.current(), t0 + 10 * 60000), 15 * 60000);
  store.setSettings({ focus: { ...FO.current(), pausedAt: new Date(t0 + 10 * 60000).toISOString() } });
  assert.equal(FO.remaining(FO.current(), t0 + 20 * 60000), 15 * 60000, 'paused time does not count');
  assert.equal(FO.settle(t0 + 60 * 60000), null, 'a paused block never finishes on its own');
  store.setSettings({ focus: { ...FO.current(), pausedAt: null, pausedMs: 5 * 60000 } });
  assert.equal(FO.settle(t0 + 29 * 60000), null);
  const r = FO.settle(t0 + 31 * 60000);
  assert.equal(r.minutes, 25);
  assert.equal(r.date, '2026-10-08');
  assert.equal(store.get('dailyReviews', '2026-10-08').deepWork, 1);
  assert.equal(store.get('dailyReviews', '2026-10-08').focusMinutes, 25);
  assert.equal(FO.current(), null);
  assert.equal(FO.clock(61000), '1:01');
});

test('habits in focus: three unless you choose two to five', async () => {
  await fresh({ ...base(), habits: habitsSeed() });
  assert.equal(H.focusLimit(), 3);
  assert.equal(H.focusWord(), 'three');
  store.setSettings({ focusLimit: 5 });
  assert.equal(H.focusLimit(), 5);
  assert.equal(HS.suggestFocus().length, 5);
  store.setSettings({ focusLimit: 9 });
  assert.equal(H.focusLimit(), 3, 'out of range falls back to three');
});

test('reorder helper moves one entry', () => {
  assert.deepEqual(moved(['a', 'b', 'c', 'd'], 3, 1), ['a', 'd', 'b', 'c']);
  assert.deepEqual(moved(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a']);
  assert.equal(addDays('2026-10-08', 0), '2026-10-08');
});
