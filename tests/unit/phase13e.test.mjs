// Phase 13e: what works for you. What helps (a habit against how the next day goes, as a pattern,
// with one tap to protect it), experiments (before against during, then keep or drop), and on this
// day (a year ago, else a month ago).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';
import * as H from '../../js/domain/habits.js';
import * as I from '../../js/domain/insights.js';
import * as X from '../../js/domain/experiments.js';
import { onThisDay, sameDay } from '../../js/domain/memories.js';

setDayEnd('00:00');
const T = today();
const d = (n) => addDays(T, n);
const simple = (id, o = {}) => ({ id, name: id, type: 'binary', schedule: { kind: 'daily' }, state: 'focus', focusSince: d(-120), startDate: d(-120), order: 0, ...o });
const world = (habits, extra = {}) => fresh({ profile: [{ ...profileSeed(), trackingStart: d(-120) }], settings: [settingsSeed()], habits, ...extra });
const done = (id, day) => store.put('habitLogs', { id: H.logId(id, day), habitId: id, date: day, value: 1, completed: true });

test('what helps you: the day after a habit goes better, shown as a pattern, and one tap keeps it on Minimum days', async () => {
  await world([simple('walk', { name: 'Evening walk' }), simple('other')]);
  // 40 days: the walk on even days. The day after a walk: energy 8; after none: energy 5.
  for (let i = 2; i <= 41; i++) {
    const day = d(-i);
    if (i % 2 === 0) done('walk', day);
    store.put('moodEntries', { id: d(-i + 1), date: d(-i + 1), energy: i % 2 === 0 ? 8 : 5, mood: 7, stress: 3 });
  }
  const b = I.helpsFor(H.habit('walk'), T);
  assert.equal(b.key, 'energy');
  assert.ok(b.with > b.without + 2 && b.nWith >= 5 && b.nWithout >= 5);
  const ins = I.insights(T).find((x) => x.id === 'helps-walk');
  assert.ok(ins, 'shown');
  assert.match(ins.title, /The day after Evening walk goes better/);
  assert.match(ins.detail, /A pattern, not proof/);
  const undo = I.apply(ins, T);
  assert.equal(H.habit('walk').mvd, true);
  assert.ok(!I.insights(T).some((x) => x.id === 'helps-walk'), 'not shown once acted on');
  undo();
  assert.ok(!H.habit('walk').mvd);
  // No clear difference, or too few days either way: nothing.
  assert.equal(I.helpsFor(H.habit('other'), T), null);
});

test('experiments: one at a time; before against during; keep it, or drop it and a habit made for it is archived', async () => {
  await world([simple('read')]);
  // 14 days before: sleep 6.5 h. During: 7.5 h, read on 10 of 14 days.
  for (let i = 1; i <= 14; i++) store.put('sleepEntries', { id: d(-28 + i - 1), date: d(-28 + i - 1), hours: 6.5 });
  const e = X.start({ name: 'No screens after 21:30', days: 14, watch: ['sleep', 'steps', 'mood'] }, d(-14));
  assert.equal(e.watch.length, 2, 'two things at most');
  assert.ok(e.created && H.habit(e.habitId).name === 'No screens after 21:30');
  assert.throws(() => X.start({ habitId: 'read' }, d(-14)), /One experiment at a time/);
  for (let i = 0; i < 14; i++) {
    store.put('sleepEntries', { id: d(-14 + i), date: d(-14 + i), hours: 7.5 });
    if (i < 10) done(e.habitId, d(-14 + i));
  }
  const mid = X.result(e, d(-7));
  assert.deepEqual([mid.day, mid.ended, mid.left], [8, false, 7]);
  const r = X.result(e, T);
  assert.equal(r.ended, true);
  assert.deepEqual([r.done, r.due], [10, 14]);
  const sleep = r.metrics.find((m) => m.key === 'sleep');
  assert.deepEqual([sleep.before, sleep.during, sleep.verdict], [6.5, 7.5, 'better']);
  assert.equal(r.metrics.find((m) => m.key === 'steps').verdict, 'unclear', 'nothing logged: no verdict');
  assert.equal(X.fmt('sleep', 7.5), '7.5 h');
  // Drop: the habit made for it is archived; Undo brings both back.
  const undo = X.finish(e, false);
  assert.equal(H.habit(e.habitId).archived, true);
  assert.equal(X.current(), null);
  undo();
  assert.equal(X.current()?.id, e.id);
  assert.ok(!H.habit(e.habitId).archived);
  X.finish(X.current(), true);
  assert.equal(store.get('experiments', e.id).status, 'kept');
  assert.ok(!H.habit(e.habitId).archived);
  // An experiment on a habit you already have leaves it alone when dropped.
  const e2 = X.start({ habitId: 'read', days: 7, watch: ['plan'] }, T);
  X.finish(e2, false);
  assert.ok(!H.habit('read').archived);
});

test('the same day a month or a year back, short months clamped', () => {
  assert.equal(sameDay('2026-10-08', -12), '2025-10-08');
  assert.equal(sameDay('2026-03-31', -1), '2026-02-28');
  assert.equal(sameDay('2028-02-29', -12), '2027-02-28');
  assert.equal(sameDay('2026-01-15', -1), '2025-12-15');
});

test('on this day: a year ago first, else a month ago, journal before the day’s win; nothing when nothing was written', async () => {
  await world([]);
  assert.equal(onThisDay(T), null);
  store.put('dailyReviews', { id: sameDay(T, -1), date: sameDay(T, -1), win: 'Closed the deal' });
  assert.deepEqual(onThisDay(T), { when: 'A month ago', date: sameDay(T, -1), kind: 'win', text: 'Closed the deal' });
  const j = store.put('journalEntries', { date: sameDay(T, -12), kind: 'evening', answers: { 0: 'Started training again' }, text: '' });
  const m = onThisDay(T);
  assert.deepEqual([m.when, m.kind, m.text, m.id], ['A year ago', 'journal', 'Started training again', j.id]);
});
