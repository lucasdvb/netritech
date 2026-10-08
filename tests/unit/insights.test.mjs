// Progress and Reflect (Phase 8): insight rules on fixtures (each ends in an action that changes the
// plan, with Undo), the week as a story, measures with decision lines, and a valid calendar file.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd, weekday, startOfWeek } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, templatesSeed } from '../../js/data/seed.js';
import * as H from '../../js/domain/habits.js';
import * as I from '../../js/domain/insights.js';
import * as S from '../../js/domain/story.js';
import { buildCalendar, reminderOptions, fold, escapeText } from '../../js/domain/ics.js';

setDayEnd('03:00');
const T = today();
const day = (n) => addDays(T, n);
const hb = (id, o = {}) => ({ id, name: id, type: 'binary', schedule: { kind: 'daily' }, state: 'autopilot', section: 'life', order: 0, ...o });
async function world({ habits = [], routines = [], profile = {}, settings = {}, ...rest } = {}) {
  await fresh({ profile: [{ ...profileSeed(), trackingStart: day(-70), ...profile }], settings: [{ ...settingsSeed(), ...settings }],
    habits, routines, templates: templatesSeed(), ...rest });
}
const done = (id, n) => store.put('habitLogs', { id: `${id}:${day(-n)}`, habitId: id, date: day(-n), value: 1 });
const find = (id) => I.insights(T).find((i) => i.id === id);

test('nothing to say without data, and never an insight without an action', async () => {
  await world();
  assert.deepEqual(I.insights(T), []);
  I.register({ id: 'test-engine', run: () => [{ id: 'no-action', title: 'A fact with nothing to do', weight: 9 },
    { id: 'with-action', title: 'Do this', weight: 1, action: { label: 'Go', apply: () => () => {} } }] });
  assert.deepEqual(I.insights(T).map((i) => i.id), ['with-action']);
});

test('the weakest routine: its least-done habit gets its tiny version for two weeks, with Undo', async () => {
  await world({
    habits: [hb('wake'), hb('water'), hb('read', { tiny: { label: 'One page' } }), hb('stretch')],
    routines: [
      { id: 'r-morning', name: 'Morning', kind: 'morning', order: 1, steps: [{ id: 's1', habitId: 'wake' }, { id: 's2', habitId: 'water' }] },
      { id: 'r-evening', name: 'Evening', kind: 'evening', order: 2, steps: [{ id: 's3', habitId: 'read' }, { id: 's4', habitId: 'stretch' }] }],
  });
  for (let n = 1; n <= 14; n++) { done('wake', n); done('water', n); if (n % 2) done('stretch', n); if (n % 7 === 0) done('read', n); }
  const ins = find('routine-r-evening');
  assert.ok(ins, 'evening is flagged');
  assert.match(ins.title, /Evening is your weakest routine/);
  assert.match(ins.action.label, /Make read tiny for two weeks/);
  const undo = I.apply(ins);
  assert.equal(H.habit('read').temp.tiny, true);
  assert.equal(find('routine-r-evening'), undefined, 'quiet once acted on');
  undo();
  assert.equal(H.habit('read').temp, undefined);
  assert.ok(find('routine-r-evening'), 'back after Undo');
});

test('the hardest weekday: next one is planned as a Minimum day', async () => {
  await world({ habits: [hb('x', { state: 'focus', focusSince: day(-70) })] });
  for (let n = 1; n <= 28; n++) if (weekday(day(-n)) !== 1) done('x', n);
  const ins = find('day-1');
  assert.ok(ins);
  assert.match(ins.title, /Mondays are your hardest day/);
  const undo = I.apply(ins);
  const monday = Array.from({ length: 7 }, (_, i) => day(i + 1)).find((d) => weekday(d) === 1);
  assert.equal(H.dayMode(monday), 'minimum');
  undo();
  assert.equal(H.dayMode(monday), 'normal');
});

test('short nights and the next day: a wind-down reminder 30 minutes before lights out', async () => {
  await world({ habits: [hb('x', { state: 'focus', focusSince: day(-70) }), hb('h-lights-out', { name: 'Lights out by 22:00' })], profile: { bedTime: '22:00' } });
  for (let n = 1; n <= 20; n++) {
    const short = n % 3 === 0;
    store.put('sleepEntries', { id: day(-n), date: day(-n), hours: short ? 5.5 : 7.8 });
    if (!short) done('x', n);
  }
  const ins = find('sleep-link');
  assert.ok(ins);
  assert.match(ins.detail, /under 7 h of sleep score 0%/);
  I.apply(ins);
  assert.equal(H.habit('h-lights-out').reminder, '21:30');
});

test('training days: the weekday that rarely happens becomes the 20-minute minimum', async () => {
  const plan = { 1: null, 2: 't-upper', 3: null, 4: 't-lower', 5: 't-upper', 6: null, 7: null };
  await world({ profile: { plan } });
  for (let n = 1; n <= 56; n++) {
    const d = day(-n), w = weekday(d);
    if (w === 2 || w === 4 || (w === 5 && n > 49)) store.put('workouts', { id: `w${n}`, date: d, status: 'done', title: 'S' });
  }
  const ins = find('train-5');
  assert.ok(ins);
  assert.match(ins.title, /You train most consistently on Tuesday and Thursday/);
  const undo = I.apply(ins);
  assert.equal(store.profile().plan[5], 't-minimum');
  undo();
  assert.equal(store.profile().plan[5], 't-upper');
});

test('a flat weight trend lowers the calorie target by 150 kcal, never below the floor', async () => {
  await world({ goals: [{ id: 'g', name: 'Lose', status: 'active', measure: 'weight', type: 'numeric', target: 75, habitIds: [], milestones: [] }] });
  for (let n = 0; n <= 20; n++) store.put('weightEntries', { id: day(-n), date: day(-n), kg: 80 + (n % 2) * 0.1 });
  const ins = find('weight-stall');
  assert.ok(ins);
  const kcal = store.settings().targets.kcal;
  const undo = I.apply(ins);
  assert.equal(store.settings().targets.kcal, kcal - 150);
  undo();
  assert.equal(store.settings().targets.kcal, kcal);
  store.setSettings({ targets: { ...store.settings().targets, kcal: 1650, kcalFloor: 1600 } });
  assert.equal(find('weight-stall'), undefined, 'not below the floor');
});

test('protein and steps gaps add one step to a routine; dismissing keeps it quiet for two weeks', async () => {
  await world({ routines: [{ id: 'r-morning', name: 'Morning', kind: 'morning', order: 1, steps: [] }, { id: 'r-evening', name: 'Evening', kind: 'evening', order: 2, steps: [] }] });
  for (let n = 1; n <= 6; n++) {
    store.put('nutritionLogs', { id: `n${n}`, date: day(-n), protein: 90, kcal: 1800 });
    store.put('stepLogs', { id: day(-n), date: day(-n), steps: 3000 });
  }
  const p = find('protein-gap');
  assert.match(p.title, /Protein is 60 g a day short/);
  const undo = I.apply(p);
  assert.deepEqual(store.get('routines', 'r-morning').steps.map((s) => s.label), ['Protein at breakfast']);
  undo();
  assert.deepEqual(store.get('routines', 'r-morning').steps, []);
  const s = find('steps-gap');
  I.dismiss(s);
  assert.equal(find('steps-gap'), undefined);
  for (let n = 8; n <= 13; n++) store.put('stepLogs', { id: day(n), date: day(n), steps: 3000 });
  assert.ok(I.insights(day(14)).some((i) => i.id === 'steps-gap'), 'back after two weeks');
});

test('the week as one sentence, against the same point last week', async () => {
  await world({ habits: [hb('x', { state: 'focus', focusSince: day(-70) }), hb('y', { state: 'focus', focusSince: day(-70) })] });
  store.setSettings({ ghost: 'last' });
  assert.match(S.sentence(S.week(T)), /^(A new week|Nothing done yet this week)/);
  const from = startOfWeek(T);
  for (let d = addDays(from, -7); d < T; d = addDays(d, 1)) { store.put('habitLogs', { id: `x:${d}`, habitId: 'x', date: d, value: 1 }); if (d >= from) store.put('habitLogs', { id: `y:${d}`, habitId: 'y', date: d, value: 1 }); }
  if (from === T) return; // Monday: nothing of this week to compare yet
  const w = S.week(T);
  assert.equal(w.ghost, 0.5);
  assert.equal(w.ratio, 1);
  assert.match(S.sentence(w), /^Ahead of last week: 100% of your plan done\.$/);
});

test('the ghost: a month ago by default, your best week on request, last week when nothing else exists', async () => {
  await world({ habits: [hb('x', { state: 'focus', focusSince: day(-70) }), hb('y', { state: 'focus', focusSince: day(-70) })], profile: { trackingStart: day(-70) } });
  const from = startOfWeek(T);
  if (from === T) return; // Monday: nothing of this week yet
  // four weeks ago: one of two habits; two weeks ago: both (the best week); this week: both
  const log = (id, d) => store.put('habitLogs', { id: `${id}:${d}`, habitId: id, date: d, value: 1 });
  for (let i = 0; i < 7; i++) { log('x', addDays(from, -28 + i)); log('x', addDays(from, -14 + i)); log('y', addDays(from, -14 + i)); }
  for (let d = from; d < T; d = addDays(d, 1)) { log('x', d); log('y', d); }
  assert.equal(S.ghost(T).id, 'four');
  assert.equal(S.ghost(T).ratio, 0.5);
  assert.equal(S.ghost(T, 'best').from, addDays(from, -14));
  assert.equal(S.ghost(T, 'best').ratio, 1);
  assert.equal(S.ghost(T, 'last').ratio, 0);
  assert.match(S.sentence(S.week(T)), /^Ahead of a month ago/);
  store.setSettings({ ghost: 'best' });
  assert.match(S.sentence(S.week(T)), /^Level with your best week/);
});

test('every measure carries a decision line; what’s moving is the biggest change', async () => {
  await world({ habits: [hb('x', { state: 'focus', focusSince: day(-70) })] });
  for (let n = 0; n < 14; n++) {
    store.put('sleepEntries', { id: day(-n), date: day(-n), hours: n < 7 ? 6 : 8 });
    store.put('stepLogs', { id: day(-n), date: day(-n), steps: 9000 });
    done('x', n);
  }
  const ms = S.measures(T);
  assert.deepEqual(ms.map((m) => m.id), ['consistency', 'sleep', 'steps', 'training'], 'weight and protein: no data, not shown');
  for (const m of ms) assert.ok(m.decision && m.decision.length > 10, `${m.id} has a decision`);
  assert.match(ms.find((m) => m.id === 'sleep').decision, /Lights out by 22:00 this week/);
  const mv = S.moving(T, ms);
  assert.equal(mv[0].id, 'sleep');
  assert.match(mv[0].changeText, /down 120 min a night/);
  assert.equal(mv[0].rightWay, false);
});

test('the calendar file is valid iCalendar with an alert on every event', async () => {
  await world({ habits: [hb('h-stretch', { name: 'Stretch, then breathe; slowly', reminder: '07:15', schedule: { kind: 'weekdays', days: [1, 3, 5] } })],
    profile: { plan: { 1: 't-upper', 2: null, 3: null, 4: 't-lower', 5: null, 6: null, 7: null }, trainTime: '07:00' } });
  const opts = reminderOptions('https://example.app/');
  const keys = opts.map((o) => o.key);
  assert.deepEqual(keys, ['morning', 'train-1', 'train-4', 'evening', 'week', 'month', 'habit-h-stretch']);
  const ics = buildCalendar(opts.map((o) => o.event), { now: new Date(Date.UTC(2026, 9, 8, 12)) });
  assert.ok(ics.endsWith('\r\n'));
  const lines = ics.split('\r\n').slice(0, -1);
  assert.ok(lines.every((l) => new TextEncoder().encode(l).length <= 75), 'folded at 75 octets');
  const unfolded = ics.replace(/\r\n /g, '').split('\r\n');
  assert.equal(unfolded[0], 'BEGIN:VCALENDAR');
  assert.equal(unfolded.filter((l) => l === 'BEGIN:VEVENT').length, 7);
  assert.equal(unfolded.filter((l) => l === 'BEGIN:VALARM').length, 7);
  assert.equal(unfolded.filter((l) => l === 'TRIGGER:PT0S').length, 7);
  assert.equal(unfolded.filter((l) => l.startsWith('UID:')).length, 7);
  assert.ok(unfolded.includes('DTSTAMP:20261008T120000Z'));
  assert.ok(unfolded.includes('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR'));
  assert.ok(unfolded.includes('RRULE:FREQ=WEEKLY;BYDAY=TH'));
  assert.ok(unfolded.includes('SUMMARY:Stretch\\, then breathe\\; slowly'));
  assert.ok(unfolded.some((l) => /^DTSTART:\d{8}T071500$/.test(l)));
  // BEGIN and END pair up
  const stack = [];
  for (const l of unfolded) {
    if (l.startsWith('BEGIN:')) stack.push(l.slice(6));
    if (l.startsWith('END:')) assert.equal(stack.pop(), l.slice(4));
  }
  assert.equal(stack.length, 0);
});

test('folding and escaping', () => {
  assert.equal(escapeText('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
  const long = `DESCRIPTION:${'é'.repeat(60)}`;
  const f = fold(long).split('\r\n');
  assert.ok(f.every((l) => new TextEncoder().encode(l).length <= 75));
  assert.equal(f.map((l, i) => (i ? l.slice(1) : l)).join(''), long);
});
