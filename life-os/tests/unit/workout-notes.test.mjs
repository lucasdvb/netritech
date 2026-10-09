// The owner's fixes (October 2026): the session clock pauses when you leave and stops when you
// finish; warm-up sets are logged but don't count; and the brain dump, with categories.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { settingsSeed } from '../../js/data/seed.js';
import * as Clock from '../../js/domain/session-clock.js';
import * as F from '../../js/domain/fitness.js';
import * as N from '../../js/domain/notes.js';
import { parse } from '../../js/domain/capture.js';
import { save } from '../../js/domain/capture-save.js';

const t0 = Date.parse('2026-10-09T06:00:00Z');
const min = 60000;
const at = (m) => t0 + m * min;
const iso = (ms) => new Date(ms).toISOString();

test('the session clock: runs while you are in, pauses when you leave, carries on, and stops at the finish', () => {
  let w = { status: 'active', startedAt: iso(t0), activeMs: 0, runningSince: iso(t0) };
  assert.equal(Clock.activeMs(w, at(10)), 10 * min);
  assert.equal(Clock.isRunning(w), true);
  w = { ...w, ...Clock.pausePatch(w, at(10)) };
  assert.equal(Clock.isRunning(w), false);
  assert.equal(Clock.activeMs(w, at(45)), 10 * min, 'paused: the time stands still');
  assert.equal(Clock.pausePatch(w, at(45)), null);
  w = { ...w, ...Clock.resumePatch(w, at(45)) };
  assert.equal(Clock.activeMs(w, at(50)), 15 * min);
  w = { ...w, ...Clock.stopPatch(w, at(50)), status: 'done' };
  assert.equal(Clock.activeMs(w, at(500)), 15 * min, 'finished: it never moves again');
  assert.equal(Clock.resumePatch(w, at(500)), null);
  assert.equal(Clock.clockText(15 * min + 5000), '15:05');
  assert.equal(Clock.clockText(62 * min + 5000), '1:02:05');
});

test('the session clock: a session left open counts four hours at most; older sessions read as before', () => {
  const open = { status: 'active', startedAt: iso(t0), activeMs: 0, runningSince: iso(t0) };
  assert.equal(Clock.activeMs(open, at(3 * 24 * 60)), Clock.MAX_STRETCH);
  const legacyActive = { status: 'active', startedAt: iso(t0) };
  assert.equal(Clock.activeMs(legacyActive, at(20)), 20 * min);
  assert.equal(Clock.activeMs(legacyActive, at(2 * 24 * 60)), Clock.MAX_STRETCH);
  assert.equal(Clock.isRunning(legacyActive), true);
  assert.deepEqual(Clock.pausePatch(legacyActive, at(20)), { activeMs: 20 * min, runningSince: null });
  const legacyDone = { status: 'done', startedAt: iso(t0), endedAt: iso(at(52)), minutes: 52 };
  assert.equal(Clock.activeMs(legacyDone, at(9999)), 52 * min);
});

test('warm-up sets are logged but count for neither progress nor records', async () => {
  await fresh({ settings: [settingsSeed()], exercises: [{ id: 'e1', name: 'Squat', metric: 'reps', category: 'legs', defaultLoad: 20 }] });
  const w = store.put('workouts', { id: 'w1', date: '2026-10-08', title: 'Legs', kind: 'strength', status: 'done' });
  store.batch([
    { store: 'workoutSets', value: { workoutId: w.id, date: w.date, exerciseId: 'e1', order: 0, setIndex: 0, reps: 20, load: 40, completed: true, warmup: true } },
    { store: 'workoutSets', value: { workoutId: w.id, date: w.date, exerciseId: 'e1', order: 0, setIndex: 1, reps: 8, load: 60, completed: true } },
    { store: 'workoutSets', value: { workoutId: w.id, date: w.date, exerciseId: 'e1', order: 0, setIndex: 2, reps: 7, load: 60, completed: true } },
  ]);
  const p = F.performance(w.id, 'e1');
  assert.deepEqual([p.sets, p.totalReps, p.topReps, p.topLoad], [2, 15, 8, 60]);
  const best = F.personalBests().find((b) => b.exercise.id === 'e1');
  assert.deepEqual([best.reps, best.load], [8, 60]);
});

test('brain dump: notes filed by category, found by search, pinned first', async () => {
  await fresh({ settings: [settingsSeed()] });
  assert.deepEqual(N.categories(), N.DEFAULT_CATEGORIES);
  assert.equal(N.create('   '), null);
  const a = N.create('Coaching offer for small gyms', 'Ideas');
  const b = N.create('Ask the bank about the fixed rate', 'To think about');
  const c = N.create('Standing desk?');
  assert.equal(c.category, N.UNSORTED);
  assert.deepEqual(N.filter({ category: 'Ideas' }).map((n) => n.id), [a.id]);
  assert.deepEqual(N.filter({ category: N.UNSORTED }).map((n) => n.id), [c.id]);
  assert.deepEqual(N.filter({ q: 'BANK' }).map((n) => n.id), [b.id]);
  assert.equal(N.counts().get('Ideas'), 1);
  N.pin(a.id);
  assert.equal(N.notes()[0].id, a.id, 'pinned first');
  N.file(c.id, 'Work');
  assert.equal(N.note(c.id).category, 'Work');
  assert.equal(N.firstLine('\n  First line here\nsecond'), 'First line here');
});

test('brain dump categories: your own, renamed with their notes, merged, and deleted to Unsorted with Undo', async () => {
  await fresh({ settings: [settingsSeed()] });
  assert.equal(N.addCategory('  business   ideas '), 'business ideas');
  assert.equal(N.addCategory('IDEAS'), 'Ideas', 'no duplicates, whatever the case');
  assert.equal(N.categories().length, N.DEFAULT_CATEGORIES.length + 1);
  const n = N.create('Gym coaching', 'business ideas');
  N.renameCategory('business ideas', 'Business');
  assert.equal(N.note(n.id).category, 'Business');
  assert.ok(N.categories().includes('Business') && !N.categories().includes('business ideas'));
  // Renamed onto one that exists: the two become one.
  N.renameCategory('Business', 'work');
  assert.equal(N.note(n.id).category, 'Work');
  assert.equal(N.categories().filter((x) => x === 'Work').length, 1);
  N.moveCategory(N.categories().indexOf('Work'), 0);
  assert.equal(N.categories()[0], 'Work');
  const undo = N.deleteCategory('Work');
  assert.ok(!N.categories().includes('Work'));
  assert.equal(N.note(n.id).category, N.UNSORTED);
  undo();
  assert.equal(N.categories()[0], 'Work');
  assert.equal(N.note(n.id).category, 'Work');
});

test('capture: "idea:" and "dump:" go to the brain dump, filed when the category exists', async () => {
  await fresh({ settings: [settingsSeed()] });
  const ctx = { today: '2026-10-09', weightUnit: 'kg', lengthUnit: 'cm', habits: [], foods: [] };
  const r = parse('idea: a 6-week coaching package', ctx);
  assert.deepEqual(r.items, [{ kind: 'dump', text: 'A 6-week coaching package', category: 'Ideas' }]);
  assert.equal(parse('dump: call the plumber about the noise', ctx).items[0].category, '');
  assert.equal(parse('journal: long day', ctx).items[0].kind, 'note', 'the journal keeps its own prefix');
  const { message } = save(r.items, ctx);
  assert.equal(message, 'Saved to your brain dump');
  assert.deepEqual(store.all('notes').map((x) => [x.text, x.category]), [['A 6-week coaching package', 'Ideas']]);
});
