// The progression layer (Phase 9): mastery levels, personal records, seasons, rewards, commitments
// and side quests, with backfilled, edited and deleted logs. Nothing here is points or currency.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd, weekday, startOfWeek, range } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, templatesSeed, exercisesSeed } from '../../js/data/seed.js';
import * as H from '../../js/domain/habits.js';
import * as L from '../../js/domain/levels.js';
import * as Rec from '../../js/domain/records.js';
import * as S from '../../js/domain/seasons.js';
import * as Rw from '../../js/domain/rewards.js';
import * as C from '../../js/domain/commitments.js';
import * as Q from '../../js/domain/quests.js';

setDayEnd('03:00');
const T = today();
const day = (n) => addDays(T, n);
const hb = (id, o = {}) => ({ id, name: id, type: 'binary', schedule: { kind: 'daily' }, state: 'autopilot', section: 'life', category: 'life', order: 0, ...o });
async function world({ habits = [hb('read', { name: 'Read' })], profile = {}, ...rest } = {}) {
  await fresh({ profile: [{ ...profileSeed(), trackingStart: day(-400), ...profile }], settings: [settingsSeed()], habits, templates: templatesSeed(), exercises: exercisesSeed(), ...rest });
}
const log = (id, n) => store.put('habitLogs', { id: `${id}:${day(-n)}`, habitId: id, date: day(-n), value: 1 });
const unlog = (id, n) => store.remove('habitLogs', `${id}:${day(-n)}`);

/* ---------- mastery levels ---------- */

test('levels: engraved with the day of the completion that reached them', async () => {
  await world();
  for (let n = 40; n >= 31; n--) log('read', n); // ten completions, 40 to 31 days ago
  const fresh1 = L.sync(T);
  assert.deepEqual(L.plates('read').map((p) => [p.level, p.date]), [['started', day(-40)], ['practised', day(-31)]]);
  assert.equal(fresh1.length, 0, 'old history is engraved quietly');
  const m = L.mastery(H.habit('read'));
  assert.deepEqual([m.count, m.level.name, m.next.name, m.toNext], [10, 'Practised', 'Steady', 20]);
});

test('levels: backfilled, edited and deleted logs never change an engraved date', async () => {
  await world();
  for (let n = 20; n >= 11; n--) log('read', n);
  L.sync(day(-1)); // engraved yesterday
  const was = L.plates('read').map((p) => p.date).join();
  log('read', 60); // backfill an older completion: the 10th is now earlier, but the plate stays
  unlog('read', 15); // delete one in the middle
  L.sync(T);
  assert.equal(L.plates('read').map((p) => p.date).join(), was);
  for (let n = 20; n >= 11; n--) unlog('read', n); // even with almost everything deleted
  L.sync(T);
  assert.equal(L.plates('read').length, 2);
});

test('levels: reached today is a moment; Undo on the same day takes it back', async () => {
  await world();
  for (let n = 9; n >= 1; n--) log('read', n);
  L.sync(T);
  log('read', 0);
  const f = L.sync(T);
  assert.deepEqual(f.map((x) => x.name), ['Practised']);
  assert.equal(L.sync(T).length, 0, 'once');
  unlog('read', 0);
  L.sync(T);
  assert.deepEqual(L.plates('read').map((p) => p.level), ['started']);
});

/* ---------- personal records ---------- */

const steps = (n, v) => store.put('stepLogs', { id: day(-n), date: day(-n), steps: v });

test('records never trigger on the first three data points', async () => {
  await world({ habits: [] });
  steps(10, 5000); steps(9, 6000); steps(8, 7000);
  assert.equal(Rec.shelf(T).length, 0, 'three rising values: no record yet');
  steps(7, 6500);
  assert.equal(Rec.shelf(T).length, 0);
  steps(6, 9000);
  const r = Rec.shelf(T).find((x) => x.id === 'steps-day');
  assert.deepEqual([r.value, r.date, r.previous], [9000, day(-6), 7000]);
});

test('records follow the data: an edited, deleted or backfilled value changes the shelf', async () => {
  await world({ habits: [] });
  [5000, 6000, 7000, 6500, 9000].forEach((v, i) => steps(10 - i, v));
  steps(6, 6800); // edited down: no longer a record
  assert.equal(Rec.shelf(T).length, 0);
  steps(6, 9000);
  store.remove('stepLogs', day(-6)); // deleted
  assert.equal(Rec.shelf(T).length, 0);
  steps(3, 9500);
  assert.equal(Rec.shelf(T)[0].value, 9500);
  steps(30, 12000); // a backfilled older best: the later value isn't a record any more
  assert.equal(Rec.shelf(T).length, 0);
});

test('records are marked once, only when recent; lower is better for wake-ups', async () => {
  await world({ habits: [] });
  [5000, 6000, 7000, 6500].forEach((v, i) => steps(10 - i, v));
  steps(0, 9000);
  assert.deepEqual(Rec.sync(T).map((r) => r.kind), ['steps-day']);
  assert.equal(Rec.sync(T).length, 0, 'once');
  // five weeks of wake-ups, the latest the earliest
  const mon = addDays(startOfWeek(T), -35);
  for (let w = 0; w < 5; w++) for (let d = 0; d < 7; d++) store.put('sleepEntries', { id: addDays(mon, w * 7 + d), date: addDays(mon, w * 7 + d), wake: w === 4 ? '05:30' : '06:30', hours: 7 });
  const wake = Rec.shelf(T).find((r) => r.id === 'wake-week');
  assert.match(wake.text, /05:30/);
});

test('a run in progress becomes a record once, the day it takes the lead', async () => {
  await world();
  // runs of 3, 4 and 5 days (each ended by two misses), then a run of 7 that's still going
  let n = 40;
  for (const len of [3, 4, 5]) { for (let i = 0; i < len; i++) log('read', n--); n -= 2; }
  const start = n;
  for (let i = 0; i < 6; i++) log('read', n--);
  assert.equal(Rec.sync(day(-(start - 5))).length, 1, 'the day the run reaches 6 it takes the lead');
  log('read', n--);
  assert.equal(Rec.sync(day(-(n + 1))).length, 0, 'not again the next day');
  assert.match(Rec.shelf(T).find((r) => r.id === 'run:read').text, /7 days/);
});

test('lifts: heaviest per exercise, from completed sets only', async () => {
  await world({ habits: [] });
  const w = (n, load, done = true) => { store.put('workouts', { id: `w${n}`, date: day(-n), status: 'done', title: 'S' }); store.put('workoutSets', { id: `s${n}`, workoutId: `w${n}`, exerciseId: 'e-goblet-squat', order: 0, setIndex: 0, reps: 10, load, completed: done }); };
  w(20, 10); w(15, 12); w(10, 12); w(5, 14);
  assert.equal(Rec.shelf(T).find((r) => r.id === 'lift:e-goblet-squat').value, 14);
  w(1, 20, false);
  assert.equal(Rec.shelf(T).find((r) => r.id === 'lift:e-goblet-squat').value, 14, 'an unfinished set is not a record');
});

/* ---------- seasons ---------- */

test('seasons: six weeks from a Monday, three habits into focus, Undo puts it back', async () => {
  await world({ habits: [hb('a', { state: 'focus', focusSince: day(-30) }), hb('b'), hb('c'), hb('d')] });
  const { season: s, undo } = S.create({ name: 'Foundations', intention: 'Strong mornings', habitIds: ['b', 'c', 'd'], start: startOfWeek(T) });
  assert.equal(weekday(s.start), 1);
  assert.equal(s.end, addDays(s.start, 41));
  assert.deepEqual(['a', 'b', 'c', 'd'].map((id) => H.stateOf(H.habit(id))), ['autopilot', 'focus', 'focus', 'focus']);
  assert.equal(S.current(T).id, s.id);
  assert.equal(S.weekOf(s, addDays(s.start, 15)), 3);
  assert.ok(S.checkInDue(s, addDays(s.start, 15)));
  assert.ok(!S.checkInDue(s, addDays(s.start, 22)));
  undo();
  assert.equal(S.current(T), null);
  assert.deepEqual(['a', 'b'].map((id) => H.stateOf(H.habit(id))), ['focus', 'autopilot']);
});

test('seasons: the finale freezes the summary; later edits don’t change it', async () => {
  await world({ habits: [hb('a', { state: 'focus', focusSince: day(-90) })] });
  const start = addDays(startOfWeek(T), -49);
  const { season: s } = S.create({ name: 'Past', habitIds: ['a'], start });
  for (let d = start; d <= s.end; d = addDays(d, 1)) if (weekday(d) !== 7) store.put('habitLogs', { id: `a:${d}`, habitId: 'a', date: d, value: 1 });
  assert.equal(S.finalize(T).length, 1);
  const sum = S.season(s.id).summary;
  assert.equal(sum.days, 42);
  assert.ok(sum.score > 0.8 && sum.score < 0.9);
  store.remove('habitLogs', `a:${start}`);
  assert.deepEqual(S.summaryOf(S.season(s.id)), sum, 'frozen');
  assert.equal(S.finalize(T).length, 0, 'once');
});

/* ---------- rewards ---------- */

test('rewards unlock only from real counts made after they were set; no points anywhere', async () => {
  await world();
  for (let n = 1; n <= 10; n++) store.put('workouts', { id: `old${n}`, date: day(-n), status: 'done', title: 'S' });
  const r = Rw.create({ title: 'New running shoes', kind: 'workouts', target: 3 });
  assert.equal(Rw.progress(r).value, 0, 'earlier workouts don’t count');
  store.put('workouts', { id: 'n1', date: T, status: 'done', title: 'S' });
  store.put('workouts', { id: 'n2', date: T, status: 'active', title: 'S' });
  assert.equal(Rw.progress(store.get('rewards', r.id)).value, 1, 'an unfinished session doesn’t count');
  store.put('workouts', { id: 'n2', date: T, status: 'done', title: 'S' });
  store.put('workouts', { id: 'n3', date: T, status: 'done', title: 'S' });
  assert.deepEqual(Rw.sync(T).map((x) => x.title), ['New running shoes']);
  store.remove('workouts', 'n3'); // Undo the same day
  Rw.sync(T);
  assert.equal(store.get('rewards', r.id).status, 'active');
  store.put('workouts', { id: 'n3', date: T, status: 'done', title: 'S' });
  Rw.sync(T);
  store.remove('workouts', 'n3');
  Rw.sync(day(1));
  assert.equal(store.get('rewards', r.id).status, 'unlocked', 'a later day keeps what was earned');
  Rw.claim(store.get('rewards', r.id));
  assert.equal(store.get('rewards', r.id).status, 'claimed');
  for (const rec of store.all('rewards')) assert.ok(!Object.keys(rec).some((k) => /point|coin|xp|currency|balance/i.test(k)));
});

test('no points, XP, coins or currency in any screen or rule', () => {
  const dirs = ['js/screens', 'js/screens/today', 'js/domain', 'js/ui'];
  for (const dir of dirs) {
    // Money (real spending, in your own currency) is not a game currency.
    for (const f of readdirSync(new URL(`../../${dir}/`, import.meta.url)).filter((x) => x.endsWith('.js') && x !== 'money.js')) {
      const src = readFileSync(new URL(`../../${dir}/${f}`, import.meta.url), 'utf8');
      const strings = src.match(/(['"`])(?:(?!\1)[^\\\n]|\\.)*\1/g) || [];
      for (const s of strings) assert.ok(!/\b(\d+\s*points|XP|coins?|currency|earn \d)\b/i.test(s) || /data points/i.test(s), `${dir}/${f}: ${s.slice(0, 60)}`);
    }
  }
});

/* ---------- commitments ---------- */

test('commitments: days kept from your logs, a missed day named, kept or done at the end', async () => {
  await world();
  const c = C.create({ habitId: 'read', days: 7, stake: 'Coffee for a friend', start: day(-6) });
  for (const n of [6, 5, 4, 2, 1]) log('read', n);
  let s = C.state(c, T);
  assert.deepEqual([s.day, s.of, s.due, s.kept, s.missed], [7, 7, 6, 5, [day(-3)]], 'today is due once it’s done');
  log('read', 0);
  s = C.state(c, T);
  assert.deepEqual([s.due, s.kept], [7, 6]);
  assert.equal(C.finalize(T).length, 0, 'still running on its last day');
  C.finalize(day(1));
  assert.equal(store.get('commitments', c.id).status, 'done');
  const k = C.create({ habitId: 'read', days: 7, start: day(1) });
  for (let i = 1; i <= 7; i++) store.put('habitLogs', { id: `read:${day(i)}`, habitId: 'read', date: day(i), value: 1 });
  C.finalize(day(8));
  assert.equal(store.get('commitments', k.id).status, 'kept');
});

test('commitments: ending early asks why and offers a smaller pledge; Undo restores it', async () => {
  await world({ habits: [hb('read', { name: 'Read', tiny: { label: 'One page' } })] });
  const c = C.create({ habitId: 'read', days: 30, stake: '€20 to charity' });
  const undo = C.endEarly(c, 'Travel week');
  assert.deepEqual([store.get('commitments', c.id).status, store.get('commitments', c.id).reason], ['ended', 'Travel week']);
  assert.deepEqual(C.smaller(c), { habitId: 'read', days: 7, stake: '€20 to charity', tiny: true });
  undo();
  assert.equal(store.get('commitments', c.id).status, 'active');
});

/* ---------- side quests ---------- */

test('side quests: one a week, the quietest area, never repeated within twelve weeks; accepting makes a task', async () => {
  await world({ habits: [hb('m', { category: 'mind', state: 'focus' }), hb('s', { category: 'spirit', state: 'focus' })] });
  for (let n = 1; n <= 20; n++) log('m', n); // mind is done, spirit isn't
  const q = Q.offer(T);
  assert.equal(q.areaId, 'spirit');
  assert.equal(Q.offer(T).templateId, q.templateId, 'the same all week');
  const undo = Q.accept(q);
  const t = store.all('tasks').find((x) => x.questId === q.id);
  assert.equal(t.title, q.title);
  assert.equal(store.get('quests', q.id).status, 'accepted');
  undo();
  assert.ok(!store.all('tasks').some((x) => x.questId === q.id));
  const seen = new Set([q.templateId]);
  for (let w = 1; w < 3; w++) seen.add(Q.offer(addDays(T, 7 * w)).templateId);
  assert.equal(seen.size, 3, 'no repeats');
  Q.decline(Q.offer(addDays(T, 21)));
  assert.equal(Q.quest(startOfWeek(addDays(T, 21))).status, 'declined');
});

test('records: runs worked out in two parts (the settled past, then this period) match the whole history', async () => {
  const habits = [hb('d'), hb('w', { schedule: { kind: 'perWeek', count: 3 } }), hb('m', { schedule: { kind: 'perMonth', count: 8 } }), hb('i', { schedule: { kind: 'interval', every: 3 } })];
  await world({ habits });
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (const h of habits) for (let n = 0; n <= 400; n++) if (rand() < 0.6) log(h.id, n);
  // The whole history in one pass, as records worked it out before.
  const whole = (h) => {
    const points = [];
    let run = 0, misses = 0, last = null;
    for (const p of H.periodsOf(h, H.startOf(h), T)) {
      if (p.met === null) continue;
      if (p.met) { run = misses >= 2 ? 1 : run + 1; misses = 0; last = p.key; }
      else { misses++; if (misses === 2 && run) { points.push({ date: last, value: run }); run = 0; } }
    }
    if (run) points.push({ date: last, value: run, ongoing: true });
    return points;
  };
  const check = (when) => {
    const got = Object.fromEntries(Rec.series(T).filter((s) => s.id.startsWith('run:')).map((s) => [s.id.slice(4), s.points]));
    for (const id of ['d', 'w', 'm', 'i']) assert.deepEqual(got[id] || [], whole(H.habit(id)), `${id}, ${when}`);
  };
  check('first');
  log('d', 0); log('w', 0); log('i', 0);
  check('after logging today');
  for (const n of [40, 41, 120, 200]) { unlog('d', n); unlog('w', n); unlog('m', n); unlog('i', n); }
  log('m', 90);
  check('after changing the past');
  store.put('dailyReviews', { id: day(-60), date: day(-60), mode: 'sick' });
  check('after a sick day in the past');
  store.update('habits', 'w', { schedule: { kind: 'perWeek', count: 2 } });
  check('after changing the schedule');
});

test('levels: the days counted, worked out a stretch at a time, match the whole history', async () => {
  const habits = [hb('d'), hb('wat', { type: 'numeric', unit: 'ml', target: 3000, source: 'water', tiny: { label: 'A bottle', min: 1000 } }), hb('w', { schedule: { kind: 'perWeek', count: 3 } })];
  await world({ habits });
  let seed = 11;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let n = 0; n <= 400; n++) {
    if (rand() < 0.6) log('d', n);
    if (rand() < 0.5) log('w', n);
    if (rand() < 0.7) store.put('waterLogs', { id: `w-${n}`, date: day(-n), ml: Math.round(rand() * 4000) });
  }
  const whole = (h) => {
    const logs = [...new Set(store.where('habitLogs', (l) => l.habitId === h.id).map((l) => l.date))].sort();
    return (h.source ? range(H.startOf(h), T) : logs.filter((d) => d <= T)).filter((d) => H.started(h, d) && H.counts(h, d));
  };
  const check = (when) => { for (const id of ['d', 'wat', 'w']) assert.deepEqual(L.completionDays(H.habit(id), T), whole(H.habit(id)), `${id}, ${when}`); };
  check('first');
  log('d', 0); store.put('waterLogs', { id: 'w-today', date: T, ml: 3500 });
  check('after logging today');
  unlog('d', 150); store.remove('waterLogs', 'w-200'); store.put('waterLogs', { id: 'w-x', date: day(-90), ml: 5000 });
  check('after changing the past');
  store.put('dailyReviews', { id: day(-30), date: day(-30), mode: 'minimum' });
  check('after a minimum day in the past');
  store.update('habits', 'wat', { tiny: { label: 'A glass', min: 250 } });
  check('after changing the tiny version');
});
