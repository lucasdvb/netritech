// Plan (Phase 6): goal projections from real data, books that move with your reading, flat projects.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';
import * as G from '../../js/domain/goals.js';
import * as B from '../../js/domain/books.js';
import * as P from '../../js/domain/projects.js';
import * as T from '../../js/domain/tasks.js';
import { parse } from '../../js/domain/capture.js';
import { save } from '../../js/domain/capture-save.js';

setDayEnd('03:00');
const D = today();
const day = (n) => addDays(D, n);
async function world(extra = {}) {
  await fresh({ profile: [{ ...profileSeed(), trackingStart: day(-90) }], settings: [settingsSeed()], ...extra });
}
const goal = (o) => ({ id: 'g', name: 'G', status: 'active', habitIds: [], milestones: [], since: day(-60), ...o });

test('slope: a straight line has its gradient', () => {
  assert.equal(G.slope([{ date: day(-10), value: 80 }, { date: day(-5), value: 79 }, { date: day(0), value: 78 }]), -0.2);
  assert.equal(G.slope([{ date: day(0), value: 1 }]), null);
});

test('weight goal: on pace, behind, flat, and what it needs', async () => {
  await world();
  const g = goal({ type: 'numeric', measure: 'weight', start: 80, target: 75, deadline: day(60) });
  assert.equal(G.projection(g).status, 'needs');
  assert.match(G.projection(g).needs, /3 times over a week/);
  // 0.1 kg a day down: 78 → 75 in 30 days, well before the deadline
  for (let i = 20; i >= 0; i -= 2) store.put('weightEntries', { id: day(-i), date: day(-i), kg: 78 + i * 0.1 });
  let p = G.projection(g);
  assert.equal(p.status, 'on-pace');
  assert.equal(p.eta, day(30));
  assert.equal(p.daysEarly, 30);
  p = G.projection({ ...g, deadline: day(14) });
  assert.equal(p.status, 'behind');
  assert.equal(p.weeksBehind, 3);
  // going the wrong way is "flat", never a fake date
  for (let i = 20; i >= 0; i -= 2) store.put('weightEntries', { id: day(-i), date: day(-i), kg: 78 - i * 0.1 });
  assert.equal(G.projection(g).status, 'flat');
});

test('count goals project from their pace since the goal began', async () => {
  await world();
  const g = goal({ type: 'numeric', measure: 'workouts', target: 40, since: day(-27), deadline: day(60) });
  for (let i = 0; i < 28; i += 2) store.put('workouts', { id: `w${i}`, date: day(-i), status: 'done', title: 'W', kind: 'strength' });
  const p = G.projection(g);
  assert.equal(p.current, 14);
  assert.equal(p.status, 'on-pace');
  assert.equal(p.eta, day(52), '26 to go at half a workout a day');
  assert.equal(G.projection({ ...g, target: 10 }).status, 'done');
});

test('every seeded kind of goal shows a projection or says what it needs', async () => {
  await world();
  for (const g of [goal({ type: 'milestones', milestones: [] }), goal({ type: 'consistency', habitIds: [] }), goal({ type: 'numeric', measure: 'bodyFat', target: 15, start: 25 }),
    goal({ type: 'numeric', measure: 'number', target: 10 }), goal({ type: 'numeric', measure: 'pages', target: 1000 })]) {
    const p = G.projection(g);
    assert.ok(p.status, JSON.stringify(g));
    if (p.status === 'needs') assert.ok(p.needs.length > 10);
  }
});

test('books: "read 20 pages" moves the current book, and finishing marks it finished', async () => {
  await world();
  const b = B.create({ title: 'Atomic Habits', pages: 300 });
  B.create({ title: 'Deep Work', pages: 280, status: 'want' });
  const ctx = { today: D, habits: [], foods: [] };
  save(parse('read 20 pages', ctx).items, ctx);
  assert.equal(B.book(b.id).currentPage, 20);
  save(parse('read 30 pages of atomic habits', ctx).items, ctx);
  assert.equal(B.book(b.id).currentPage, 50);
  assert.equal(store.all('readingSessions').filter((r) => r.bookId === b.id).length, 2);
  const pace = B.pace(B.book(b.id));
  assert.equal(pace.read, 50);
  assert.ok(pace.finish > D);
  store.batch(B.readingOps(B.book(b.id), { pages: 260 }));
  assert.equal(B.book(b.id).status, 'finished');
  assert.equal(B.book(b.id).currentPage, 300);
  assert.equal(B.match('deep work').title, 'Deep Work');
  assert.equal(B.match('cooking'), null);
});

test('projects: one level of tasks, progress, and deleting keeps the tasks', async () => {
  await world();
  const p = P.create({ name: 'Launch the website', outcome: 'Live by November' });
  P.addTask(p.id, 'Write the copy', day(1));
  const t2 = P.addTask(p.id, 'Choose photos');
  T.toggle(t2.id);
  const pr = P.progress(p.id);
  assert.deepEqual([pr.open, pr.done, pr.total], [1, 1, 2]);
  assert.equal(pr.next.title, 'Write the copy');
  assert.ok(T.all().every((t) => !t.parentId), 'no task nests under another task');
  const { ops } = P.removalOps(p.id);
  store.batch(ops);
  assert.equal(P.project(p.id), undefined);
  assert.equal(T.all().filter((t) => t.title === 'Write the copy').length, 1);
  assert.equal(T.all().find((t) => t.title === 'Write the copy').projectId, null);
});
