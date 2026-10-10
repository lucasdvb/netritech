// Linking (phase 3): what each thing is linked to, moving or letting go of links when it's deleted,
// and #mentions / @mentions in notes and the journal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { setDayEnd, today } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed, habitsSeed } from '../../js/data/seed.js';
import { defaultRoutines } from '../../js/domain/routines.js';
import * as L from '../../js/domain/links.js';
import * as Mn from '../../js/domain/mentions.js';

setDayEnd('03:00');
const start = (extra = {}) => fresh({ profile: [profileSeed()], settings: [settingsSeed()], habits: habitsSeed(),
  routines: defaultRoutines(habitsSeed(), profileSeed()), ...extra });
const groups = (list) => list.map((l) => l.group);

test('a habit lists everything it is linked to', async () => {
  await start({ goals: [{ id: 'g1', name: 'Pray daily', status: 'active', habitIds: ['h-prayer'] }] });
  store.update('habits', 'h-prayer', { reminder: '06:05' });
  const list = L.linksOf('habit', 'h-prayer');
  assert.ok(groups(list).includes('Goal'), 'its goal');
  assert.ok(groups(list).includes('Your day'), 'its block in Your day');
  assert.ok(groups(list).includes('Reminder'), 'its reminder');
  assert.equal(list.find((l) => l.group === 'Goal').to, 'plan/goals/g1');
});

test('a goal lists the habits that carry it; a workout its days and the habit that starts it', async () => {
  await start({ goals: [{ id: 'g1', name: 'Strong', status: 'active', habitIds: ['h-prayer'], habitId: 'h-mobility' }],
    templates: [{ id: 't1', name: 'Upper', kind: 'strength', items: [] }] });
  store.update('habits', 'h-training', { templateId: 't1' });
  store.setProfile({ plan: { 1: 't1', 4: 't1' } });
  assert.deepEqual(L.linksOf('goal', 'g1').map((l) => l.label).sort(), ['Mobility & posture', 'Prayer'].sort().map((n) => store.get('habits', n === 'Prayer' ? 'h-prayer' : 'h-mobility').name).sort());
  const w = L.linksOf('workout', 't1');
  assert.equal(w[0].label, 'Mondays, Thursdays');
  assert.ok(w.some((l) => l.group === 'Habit' && l.to === 'plan/habits/h-training'));
});

test('deleting a habit: its links can move to another habit, in one batch', async () => {
  await start({ goals: [{ id: 'g1', name: 'Pray daily', status: 'active', habitIds: ['h-prayer'], habitId: 'h-prayer' }] });
  const ops = L.relink('habit', 'h-prayer', 'h-scripture');
  store.batch(ops);
  const g = store.get('goals', 'g1');
  assert.deepEqual(g.habitIds, ['h-scripture']);
  assert.equal(g.habitId, 'h-scripture');
  const day = store.profile().day;
  const b = day.find((x) => x.id === 'b-prayer');
  assert.equal(b.ref, 'h-scripture', 'the block now is the other habit');
  assert.ok(!(b.also || []).includes('h-scripture'), 'not listed twice');
});

test('deleting a habit: letting its links go leaves no dangling references', async () => {
  await start({ goals: [{ id: 'g1', name: 'Move', status: 'active', habitIds: ['h-mobility', 'h-prayer'] }] });
  store.batch(L.relink('habit', 'h-mobility', null));
  assert.deepEqual(store.get('goals', 'g1').habitIds, ['h-prayer']);
  assert.ok(!store.profile().day.some((b) => b.ref === 'h-mobility' || (b.also || []).includes('h-mobility')), 'out of Your day');
  for (const r of store.all('routines')) assert.ok(!(r.steps || []).some((s) => s.habitId === 'h-mobility'), 'out of every routine');
});

test('deleting a workout clears or moves its days and the habits that start it', async () => {
  await start({ templates: [{ id: 't1', name: 'Upper', kind: 'strength', items: [] }, { id: 't2', name: 'Lower', kind: 'strength', items: [] }] });
  store.update('habits', 'h-training', { templateId: 't1' });
  store.setProfile({ plan: { 1: 't1', 3: 't2' } });
  store.batch(L.relink('workout', 't1', 't2'));
  assert.deepEqual(store.profile().plan, { 1: 't2', 3: 't2' });
  assert.equal(store.get('habits', 'h-training').templateId, 't2');
});

test('mentions: # names things by their name without spaces, @ names anyone', async () => {
  await start({ goals: [{ id: 'g1', name: 'Run a 10k', status: 'active', habitIds: [] }],
    notes: [{ id: 'n1', text: 'Felt great after #prayer today with @Sarah. Email me@x.com, C# is fine.', category: '', createdAt: `${today()}T08:00:00Z` }],
    journalEntries: [{ id: 'j1', date: today(), kind: 'free', answers: {}, text: 'Long run for #Run-a-10K, and @sarah came too. #nothing' }] });
  assert.deepEqual(Mn.scan('a #b-c @D e@f.com C#').map((m) => `${m.sign}${m.word}`), ['#b-c', '@D']);
  assert.equal(Mn.tagOf('Prayer & Scripture'), 'PrayerScripture');
  const prayer = Mn.mentionsOf('habit', 'h-prayer');
  assert.equal(prayer.length, 1);
  assert.equal(prayer[0].source, 'note');
  assert.equal(Mn.mentionsOf('goal', 'g1')[0].source, 'journal');
  const people = Mn.people();
  assert.equal(people.length, 1, '@Sarah and @sarah are the same person');
  assert.equal(people[0].count, 2);
  const s = Mn.suggest('Today #pray', 11);
  assert.equal(s.options[0].insert, '#Prayer');
  assert.equal(Mn.suggest('no mention here', 5), null);
});

test('goals measured by anything: a habit’s total, several habits, a measurement, sleep', async () => {
  const { addDays } = await import('../../js/domain/dates.js');
  const G = await import('../../js/domain/goals.js');
  const t = today();
  await start({
    habits: [...habitsSeed(), { id: 'h-run', name: 'Run', type: 'numeric', unit: 'km', target: 5, schedule: { kind: 'daily' }, section: 'anytime', category: 'body', createdAt: `${addDays(t, -20)}T08:00:00Z` }],
    habitLogs: [...[['h-run', -2, 5], ['h-run', -1, 7.5], ['h-prayer', -1, 1], ['h-scripture', -1, 1]].map(([habitId, n, value]) => ({ id: `${habitId}:${addDays(t, n)}`, habitId, date: addDays(t, n), value }))],
    measurements: [{ id: 'm1', date: addDays(t, -14), waist: 90 }, { id: 'm2', date: addDays(t, -7), waist: 88 }, { id: 'm3', date: t, waist: 87 }],
    sleepEntries: [{ id: addDays(t, -1), date: addDays(t, -1), hours: 7 }, { id: t, date: t, hours: 8 }],
  });
  const since = addDays(t, -10);
  const total = { id: 'a', type: 'numeric', measure: 'habitTotal', habitId: 'h-run', target: 100, since };
  assert.equal(G.currentValue(total), 12.5);
  assert.equal(G.unitOf(total), 'km');
  assert.equal(G.progress(total).label, '12.5 of 100 km');
  const mix = { id: 'b', type: 'numeric', measure: 'habits', habitIds: ['h-prayer', 'h-scripture'], target: 10, since };
  assert.equal(G.currentValue(mix), 2);
  const waist = { id: 'c', type: 'numeric', measure: 'measurement', field: 'waist', start: 90, target: 80, since };
  assert.equal(G.currentValue(waist), 87);
  assert.equal(Math.round(G.progress(waist).ratio * 100), 30);
  assert.equal(G.projection(waist).status === 'on-pace' || G.projection(waist).status === 'behind', true, 'three measurements over two weeks make a projection');
  const sleep = { id: 'd', type: 'numeric', measure: 'sleep', start: 6.5, target: 8, since };
  assert.equal(G.currentValue(sleep), 7.5, 'the 7-day average');
});
