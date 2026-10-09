// Your day as linked blocks: each block's time lives on what it's linked to (a habit, a routine,
// your profile), so changing a block moves the habit, its reminders and the routine window with it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, habitsSeed } from '../../js/data/seed.js';
import { defaultRoutines } from '../../js/domain/routines.js';
import * as D from '../../js/domain/day-blocks.js';

setDayEnd('03:00');
const start = () => fresh({ profile: [profileSeed()], settings: [settingsSeed()], habits: habitsSeed(),
  routines: defaultRoutines(habitsSeed(), profileSeed()) });
const at = (id) => D.block(id);
const habit = (id) => store.get('habits', id);
const nt = () => store.settings().notifications;

test('the day you start with: linked to your habits and times, in order', async () => {
  await start();
  const list = D.blocks();
  assert.deepEqual(list.map((b) => b.id), ['b-wake', 'b-prayer', 'b-mobility', 'b-train', 'b-breakfast', 'b-work', 'b-shutdown', 'b-evening', 'b-quiet', 'b-bed']);
  assert.deepEqual(list.map((b) => b.time), ['06:00', '06:05', '06:15', '06:30', '08:00', '10:00', '20:00', '21:00', '21:30', '22:00']);
  assert.equal(at('b-work').mins, 600, 'work runs from start to end');
  assert.equal(store.profile().day, undefined, 'nothing is stored until you change it');
});

test('a habit block: its time is the habit’s, its reminder and named reminder move with it, Undo puts it all back', async () => {
  await start();
  store.update('habits', 'h-evening', { reminder: '20:55' });
  const undo = D.edit('b-evening', { time: '21:30', mins: 45 });
  assert.equal(habit('h-evening').time, '21:30');
  assert.equal(habit('h-evening').reminder, '21:25', 'its own reminder moved by the same amount');
  assert.equal(nt().evening.time, '21:30', 'the evening reminder follows the evening routine');
  assert.equal(at('b-evening').mins, 45);
  // Changing the habit anywhere else changes the block: one time, one place.
  store.update('habits', 'h-evening', { time: '21:15' });
  assert.equal(at('b-evening').time, '21:15');
  undo();
  assert.equal(habit('h-evening').time, '21:00');
  assert.equal(nt().evening.time, '21:00');
  assert.equal(habit('h-evening').reminder, '20:55');
});

test('a block with two habits moves both; training moves your training time and its reminder', async () => {
  await start();
  D.edit('b-prayer', { time: '06:20' });
  assert.deepEqual([habit('h-prayer').time, habit('h-scripture').time], ['06:20', '06:25']);
  D.edit('b-train', { time: '07:00' });
  assert.equal(store.profile().trainTime, '07:00');
  assert.equal(habit('h-training').time, '07:00');
  assert.equal(nt().workout.time, '06:55');
});

test('moving wake: alone, only wake moves; carrying the morning moves its blocks, reminders and routine window', async () => {
  await start();
  D.edit('b-wake', { time: '06:30' });
  assert.equal(store.profile().wakeTime, '06:30');
  assert.equal(habit('h-morning-reset').time, '06:30');
  assert.ok(habit('h-morning-reset').checklist.includes('Out of bed at 06:30'), 'the time in its words moved too');
  assert.equal(nt().morning.time, '06:35');
  assert.equal(habit('h-prayer').time, '06:05', 'the rest of the morning stays without carry');

  await start();
  const before = store.get('routines', 'r-morning').window;
  const undo = D.edit('b-wake', { time: '07:00' }, { carry: true });
  assert.deepEqual([habit('h-prayer').time, habit('h-scripture').time, habit('h-mobility').time], ['07:05', '07:10', '07:15']);
  assert.equal(store.profile().trainTime, '07:30');
  assert.equal(at('b-breakfast').time, '09:00', 'a plain block moves too');
  assert.equal(store.profile().workStart, '10:00', 'work isn’t part of the morning');
  const after = store.get('routines', 'r-morning').window;
  assert.deepEqual([before.from, after.from], ['05:00', '06:00'], 'the morning routine opens an hour later too');
  undo();
  assert.equal(store.profile().wakeTime, '06:00');
  assert.equal(habit('h-mobility').time, '06:15');
  assert.deepEqual(store.get('routines', 'r-morning').window, before);
});

test('lights out carries the evening, and renames "Lights out by 22:00"', async () => {
  await start();
  D.edit('b-bed', { time: '22:30' }, { carry: true });
  assert.equal(store.profile().bedTime, '22:30');
  assert.equal(habit('h-lights-out').name, 'Lights out by 22:30');
  assert.equal(habit('h-evening').time, '21:30');
  assert.equal(at('b-quiet').time, '22:00');
  assert.equal(habit('h-shutdown').time, '20:30', 'shutdown sits after work, so it’s part of the evening');
});

test('work: its length is your work hours', async () => {
  await start();
  D.edit('b-work', { time: '09:00', mins: 480 });
  assert.deepEqual([store.profile().workStart, store.profile().workEnd], ['09:00', '17:00']);
});

test('drag: a block dropped after another starts when that one ends', async () => {
  await start();
  const list = D.blocks();
  const from = list.findIndex((b) => b.id === 'b-mobility');
  const to = list.findIndex((b) => b.id === 'b-breakfast');
  D.move(from, to);
  assert.equal(habit('h-mobility').time, '08:30', 'after breakfast (08:00 + 30 min)');
  assert.deepEqual(D.blocks().map((b) => b.id).slice(0, 6), ['b-wake', 'b-prayer', 'b-train', 'b-breakfast', 'b-mobility', 'b-work']);
});

test('add and remove: any habit or a plain block; the habit and its history stay; wake and lights out can’t go', async () => {
  await start();
  assert.ok(D.addable().habits.some((h) => h.id === 'h-read'));
  assert.ok(!D.addable().habits.some((h) => h.id === 'h-scripture'), 'already in a block');
  const { id } = D.add({ kind: 'habit', ref: 'h-read', time: '21:45', mins: 20 });
  assert.equal(habit('h-read').time, '21:45', 'a habit without a time takes the block’s');
  assert.ok(D.blocks().some((b) => b.id === id && b.title === 'Read / learn'));
  const { id: plain } = D.add({ kind: 'plain', label: '  Lunch ', time: '13:00', mins: 45 });
  assert.equal(D.block(plain).title, 'Lunch');
  const undo = D.remove(id);
  assert.ok(!D.block(id));
  assert.ok(habit('h-read'), 'the habit stays');
  undo();
  assert.ok(D.block(id));
  D.remove('b-wake');
  assert.ok(D.block('b-wake'), 'wake stays');
});

test('adding a habit that has a time moves it to the block’s time, and Undo puts it back', async () => {
  await start();
  store.update('habits', 'h-meditation', { time: '07:00', reminder: '07:00' });
  const { id, undo } = D.add({ kind: 'habit', ref: 'h-meditation', time: '21:40', mins: 10 });
  assert.deepEqual([habit('h-meditation').time, habit('h-meditation').reminder, D.block(id).time], ['21:40', '21:40', '21:40']);
  undo();
  assert.equal(habit('h-meditation').time, '07:00');
  assert.ok(!D.block(id));
});

test('a list from a backup or another device is read safely', async () => {
  await start();
  store.setProfile({ day: [{ id: 'x', kind: 'plain', label: '<b>Odd</b>', time: '99:99', mins: 'lots' }, null, { kind: 'plain' }, { id: 'y', kind: 'habit', ref: 'h-gone' }] });
  const list = D.blocks();
  assert.equal(list.length, 1);
  assert.deepEqual([list[0].time, list[0].mins, list[0].title], ['12:00', 15, '<b>Odd</b>']);
});

test('routines follow: steps run in time order, and a habit moved into another routine’s window joins it', async () => {
  await start();
  const steps = (id) => store.get('routines', id).steps.map((x) => x.habitId);
  assert.deepEqual(steps('r-morning').slice(-2), ['h-mobility', 'h-training']);
  D.edit('b-mobility', { time: '09:00' });
  assert.deepEqual(steps('r-morning').slice(-2), ['h-training', 'h-mobility'], 'mobility after training now');
  assert.equal(steps('r-morning')[0], 'h-sleep', 'a step without a time keeps its place');
  D.edit('b-prayer', { time: '21:15' });
  assert.ok(!steps('r-morning').includes('h-prayer'));
  assert.ok(steps('r-evening').includes('h-prayer'), 'prayer is in the evening now');
  const ev = steps('r-evening');
  assert.ok(ev.indexOf('h-prayer') > ev.indexOf('h-evening') && ev.indexOf('h-prayer') < ev.indexOf('h-lights-out'), ev.join());
});

test('a time changed in Settings moves what it’s linked to, as its block would', async () => {
  await start();
  D.setTime('trainTime', '07:15');
  assert.deepEqual([store.profile().trainTime, habit('h-training').time, nt().workout.time], ['07:15', '07:15', '07:10']);
  D.setTime('workEnd', '18:00');
  assert.deepEqual([store.profile().workStart, store.profile().workEnd], ['10:00', '18:00']);
  D.setTime('bedTime', '23:00');
  assert.equal(habit('h-lights-out').name, 'Lights out by 23:00');
  assert.equal(habit('h-evening').time, '21:00', 'without carry, only lights out moves');
});
