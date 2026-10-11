// The bug hunt over the planning and life tools (phases A–E): each test is a case that went wrong
// before and must stay right.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, habitsSeed } from '../../js/data/seed.js';
import { defaultRoutines } from '../../js/domain/routines.js';
import * as TR from '../../js/domain/trips.js';
import * as H from '../../js/domain/habits.js';
import * as P from '../../js/domain/day-plans.js';
import { saveReview } from '../../js/domain/day.js';
import { exercisesSeed, templatesSeed } from '../../js/data/seed.js';
import * as MP from '../../js/domain/meal-plan.js';
import * as L from '../../js/domain/lists.js';
import * as BL from '../../js/domain/bills.js';
import * as WE from '../../js/domain/wealth.js';
import * as SU from '../../js/domain/supplements.js';
import * as E from '../../js/domain/effort.js';
import * as F from '../../js/domain/fitness.js';
import * as S from '../../js/domain/setup.js';
import * as PG from '../../js/domain/programmes.js';
import * as WH from '../../js/domain/wheel.js';
import * as TK from '../../js/domain/takeaways.js';
import * as ICS from '../../js/domain/ics-import.js';
import * as GP from '../../js/domain/day-gaps.js';
import { nextStep } from '../../js/domain/next-step.js';
import { publicHttps } from '../../server/worker.js';

setDayEnd('00:00');
const T = today();
const d = (n) => addDays(T, n);
const start = (extra = {}) => fresh({ profile: [{ ...profileSeed(), trackingStart: d(-120) }], settings: [settingsSeed()], habits: habitsSeed(),
  routines: defaultRoutines(habitsSeed(), profileSeed()), ...extra });

test('trip undo puts back only what the trip did; tasks added meanwhile stay', async () => {
  await start();
  store.put('tasks', { id: 'keep-me', title: 'Old', date: T, done: false, order: 1 });
  const { undo } = await TR.save(null, { name: 'Paris', from: d(3), to: d(5), mode: 'away' });
  store.put('tasks', { id: 'added-after', title: 'New', date: T, done: false, order: 2 });
  store.remove('tasks', 'keep-me');
  const rev = store.get('tasks', 'added-after').rev;
  undo();
  assert.ok(store.get('tasks', 'added-after'), 'a task added after the trip stays');
  assert.equal(store.get('tasks', 'added-after').rev, rev, 'and is not rewritten');
  assert.equal(store.get('tasks', 'keep-me'), undefined, 'a task deleted after the trip stays deleted');
  assert.equal(TR.all().length, 0);
  assert.equal(H.dayMode(d(4)), 'normal');
});

test('a trip leaves days you set yourself alone, and gives each day back as it was', async () => {
  await start();
  saveReview(d(3), { mode: 'sick' });
  const a = (await TR.save(null, { name: 'A', from: d(1), to: d(5), mode: 'away' })).trip;
  assert.equal(H.dayMode(d(3)), 'sick');
  const b = (await TR.save(null, { name: 'B', from: d(4), to: d(8), mode: 'away' })).trip;
  await TR.remove(b.id);
  assert.equal(H.dayMode(d(4)), 'away', 'still A’s day');
  assert.equal(H.dayMode(d(7)), 'normal');
  // A day you set back to normal during the trip stays normal when the trip is renamed.
  saveReview(d(2), { mode: null, tripId: null, prevMode: null });
  await TR.save(a.id, { name: 'A renamed' });
  assert.equal(H.dayMode(d(2)), 'normal');
  await TR.remove(a.id);
  assert.equal(H.dayMode(d(3)), 'sick');
  assert.equal(H.dayMode(d(4)), 'normal');
});

test('a removed leg takes its own task with it; the next leg keeps whether it was done', async () => {
  await start();
  const t = (await TR.save(null, { name: 'Rome', from: d(3), to: d(5), mode: 'normal', legs: [{ date: d(3), what: 'Flight out' }, { date: d(5), what: 'Flight back' }] })).trip;
  const [out, back] = t.legs;
  store.update('tasks', `t-trip-${t.id}-leg-${out.id}`, { done: true });
  await TR.save(t.id, { legs: [back] });
  assert.equal(store.get('tasks', `t-trip-${t.id}-leg-${back.id}`).done, false);
});

test('a travel trip gives each date back the plan it had before', async () => {
  await start();
  const other = P.create('Long day').id;
  P.setDate(d(2), other);
  const t = (await TR.save(null, { name: 'Work', from: d(1), to: d(3), mode: 'travel' })).trip;
  assert.equal(P.on(d(2)).name, 'Travel');
  await TR.remove(t.id);
  assert.equal(P.planIdFor(d(2)), other);
  assert.equal(P.on(d(1)).base, true);
});

test('groceries: the same ingredient in two units stays two lines; an edited line is yours', async () => {
  await start();
  const r1 = MP.saveRecipe(null, { name: 'A', servings: 1, ingredients: ['1 kg rice', '2 tbsp olive oil'] });
  const r2 = MP.saveRecipe(null, { name: 'B', servings: 1, ingredients: ['500 g rice', 'olive oil'] });
  MP.set(T, 'lunch', { recipeId: r1.id });
  MP.set(T, 'dinner', { recipeId: r2.id });
  const { list } = MP.toList();
  assert.deepEqual(list.items.map((i) => i.text).sort(), ['olive oil', 'olive oil · 2 tbsp', 'rice · 1 kg', 'rice · 500 g']);
  const rice = list.items.find((i) => i.text === 'rice · 500 g');
  L.setText(list.id, rice.id, 'rice · 600 g (brown)');
  MP.set(T, 'dinner', {});
  const after = MP.toList().list.items.map((i) => i.text);
  assert.ok(after.includes('rice · 600 g (brown)'), 'your edit stays');
  assert.ok(!after.includes('olive oil'), 'a planned line no longer needed goes');
});

test('ingredients: fractions and thousands read as numbers', () => {
  assert.deepEqual(MP.parseIngredient('1/2 cup milk'), { qty: 0.5, unit: 'cup', name: 'milk' });
  assert.deepEqual(MP.parseIngredient('1,000 g flour'), { qty: 1000, unit: 'g', name: 'flour' });
  assert.deepEqual(MP.parseIngredient('1,5 kg potatoes'), { qty: 1.5, unit: 'kg', name: 'potatoes' });
});

test('bills: the 31st survives an edit after a short month; old reminders go when the date moves; deleted ones stay gone', async () => {
  await start();
  const b = BL.save(null, { name: 'Phone', amount: 300, next: '2027-01-31' });
  BL.pay(b.id);
  assert.equal(BL.bill(b.id).next, '2027-02-28');
  BL.save(b.id, { amount: 320, next: '2027-02-28' });
  assert.equal(BL.after(BL.bill(b.id).next, 'month', BL.bill(b.id).anchorDay), '2027-03-31');
  const c = BL.save(null, { name: 'Gym', amount: 100, next: d(2) });
  BL.ensureTasks();
  const first = store.all('tasks').filter((t) => t.source === `bill:${c.id}`);
  assert.equal(first.length, 1);
  BL.save(c.id, { next: d(1) });
  BL.ensureTasks();
  assert.deepEqual(store.all('tasks').filter((t) => t.source === `bill:${c.id}`).map((t) => t.id), [`t-bill-${c.id}-${d(1)}`]);
  store.remove('tasks', `t-bill-${c.id}-${d(1)}`);
  BL.ensureTasks();
  assert.equal(store.all('tasks').filter((t) => t.source === `bill:${c.id}`).length, 0, 'a reminder you deleted isn’t made again');
  const undo = BL.skip(c.id);
  undo();
  assert.equal(BL.bill(c.id).next, d(1));
});

test('savings reach the target to the cent; an overdue goal says what it needs; an overdrawn account counts against you', async () => {
  await start();
  const g = WE.saveGoal(null, { name: 'Trip', target: 400, by: d(-10) });
  for (const a of [100.1, 200.2, 99.7]) WE.contribute(g.id, a);
  assert.equal(WE.goal(g.id).saved, 400);
  assert.ok(WE.goal(g.id).reachedOn);
  const h = WE.saveGoal(null, { name: 'Car', target: 1000, by: d(-5) });
  assert.equal(WE.progress(WE.goal(h.id)).perMonth, 1000);
  assert.equal(WE.progress(WE.goal(h.id)).onTrack, false);
  const cur = WE.saveAccount(null, { name: 'Current', kind: 'cash' });
  const card = WE.saveAccount(null, { name: 'Card', kind: 'card' });
  WE.setBalance(cur.id, -200);
  WE.setBalance(card.id, -300);
  assert.deepEqual(WE.netWorth(), { own: -200, owe: 300, net: -500, stale: [] });
});

test('supplements: untaking a dose gives back what it took, not a whole dose', async () => {
  await start();
  const s = SU.save(null, { name: 'D3', stock: 0.5, perDose: 1 });
  SU.toggle(s.id, '08:00');
  assert.equal(SU.one(s.id).stock, 0);
  SU.toggle(s.id, '08:00');
  assert.equal(SU.one(s.id).stock, 0.5);
});

test('lighter is lighter even for small dumbbells', () => {
  assert.equal(E.lighter(4, 0.05), 3.5);
  assert.equal(E.lighter(100, 0.1), 90);
  const lb = (x) => Math.round(x / 0.45359237 * 10) / 10;
  assert.equal(lb(E.lighter(10 * 0.45359237, 0.05, 'lb')), 7.5);
  assert.equal(lb(E.lighter(100 * 0.45359237, 0.1, 'lb')), 90);
});

test('a deload session is skipped: the next one builds on the session before it, not on the light loads', async () => {
  await fresh({ profile: [{ ...profileSeed(), trackingStart: d(-120) }], settings: [settingsSeed()], exercises: [{ id: 'bench', name: 'Bench', category: 'chest', metric: 'reps', defaultLoad: 20 }] });
  const sess = (id, day, load, deload) => {
    store.put('workouts', { id, date: d(day), title: 'S', kind: 'strength', status: 'done', startedAt: `${d(day)}T07:00:00`, ...(deload ? { deload: true } : {}) });
    store.batch([0, 1, 2].map((i) => ({ store: 'workoutSets', value: { workoutId: id, date: d(day), exerciseId: 'bench', order: 0, setIndex: i, reps: 8, load, rir: 2, completed: true } })));
  };
  sess('w1', -10, 100, false);
  sess('w2', -5, 90, true);
  assert.equal(F.previousPerformance('bench', { before: T }).workout.id, 'w1');
  const step = nextStep('bench', '6–10', { before: T });
  assert.ok(!step || step.load == null || step.load >= 100, 'progression carries on from 100 kg');
});

test('the setup run again with its defaults keeps your programme and your work days', async () => {
  await fresh({ profile: [profileSeed()], settings: [settingsSeed()], habits: habitsSeed(), routines: defaultRoutines(habitsSeed(), profileSeed()), exercises: exercisesSeed(), templates: templatesSeed() });
  await S.apply({ ...S.current(), training: 'programme', where: 'gym', trainDays: 4 });
  assert.equal(PG.following().id, 'upper-lower-4');
  await S.apply({ ...S.current(), wake: '06:15' });
  assert.equal(PG.following().id, 'upper-lower-4');
  await S.apply({ ...S.current(), work: false });
  const a = S.current();
  assert.deepEqual(a.workDays, [1, 2, 3, 4, 5], 'turning work back on starts from weekdays');
});

test('the life wheel never suggests an optional habit for the season', async () => {
  await start();
  for (const a of WH.AREAS) WH.rate(a.id, a.id === 'mind' ? 2 : 7);
  const sugg = WH.seasonSuggestion();
  assert.equal(sugg.area.id, 'mind');
  for (const id of sugg.habitIds) assert.ok(!store.get('habits', id).optional, id);
});

test('one takeaway a day: once one is answered, the morning has no other', async () => {
  await start();
  const a = TK.add({ text: 'One' }, d(-5));
  TK.add({ text: 'Two' }, d(-5));
  assert.equal(TK.forMorning().id, a.id);
  TK.answer(a.id, 'kept');
  assert.equal(TK.forMorning(), null);
});

test('your day’s calendar runs wake to wake: 00:30 tonight is today’s, 00:30 this morning was last night’s', async () => {
  await start();
  ICS.save('c', [
    { id: 'c:a', date: T, start: '00:30', end: '01:00', allDay: false, title: 'Early', source: 'c' },
    { id: 'c:b', date: T, start: '10:00', end: '11:00', allDay: false, title: 'Day', source: 'c' },
    { id: 'c:c', date: d(1), start: '00:30', end: '01:00', allDay: false, title: 'Late', source: 'c' },
  ]);
  assert.deepEqual(ICS.dayEvents(T).map((e) => e.title), ['Day', 'Late']);
});

test('a task put into a gap from another day leaves its rank behind', async () => {
  await start();
  store.put('tasks', { id: 'x', title: 'X', date: d(-1), rank: 1, done: false, order: 1 });
  GP.place('x', '14:00');
  assert.equal(store.get('tasks', 'x').rank, null);
});

test('the server reads calendars only from public addresses', () => {
  for (const bad of ['http://example.com/a.ics', 'https://localhost/a', 'https://127.0.0.1/a', 'https://0.0.0.0/a', 'https://[::1]/a', 'https://[::ffff:127.0.0.1]/a',
    'https://10.1.2.3/a', 'https://192.168.1.1/a', 'https://169.254.169.254/a', 'https://2130706433/a', 'https://printer.local/a']) assert.equal(publicHttps(new URL(bad)), false, bad);
  assert.equal(publicHttps(new URL('https://calendar.google.com/calendar/ical/x/basic.ics')), true);
});
