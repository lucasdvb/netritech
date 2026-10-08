import { test } from 'node:test';
import { blobs } from '../../js/data/blobs.js';
import assert from 'node:assert/strict';
import { fresh, tick, store } from './helpers.mjs';
import { memoryAdapter } from '../../js/data/adapter-memory.js';

test('a new record gets an envelope; dated records also get a time zone', async () => {
  await fresh();
  const a = store.put('tasks', { title: 'Call the bank' });
  assert.ok(a.id);
  assert.equal(a.rev, 1);
  assert.equal(a.createdAt, a.updatedAt);
  assert.equal(a.tz, undefined);
  const b = store.put('weightEntries', { id: '2026-10-07', date: '2026-10-07', kg: 76.2 });
  assert.equal(typeof b.tz, 'string');
});

test('updates count revisions and keep createdAt and tz', async () => {
  await fresh();
  const a = store.put('weightEntries', { id: '2026-10-07', date: '2026-10-07', kg: 76.2, createdAt: '2026-10-07T06:00:00.000Z', tz: 'Indian/Mauritius' });
  const b = store.update('weightEntries', a.id, { kg: 76.0 });
  assert.equal(b.rev, 2);
  assert.equal(b.createdAt, '2026-10-07T06:00:00.000Z');
  assert.equal(b.tz, 'Indian/Mauritius');
});

test('deleting leaves a tombstone on disk without the data, and returns the record for Undo', async () => {
  const disk = await fresh();
  const t = store.put('tasks', { title: 'Private note', date: '2026-10-07' });
  await store.flush();
  const prev = store.remove('tasks', t.id);
  assert.equal(prev.title, 'Private note');
  assert.equal(store.get('tasks', t.id), undefined);
  await store.flush();
  const onDisk = disk.db.tasks.get(t.id);
  assert.ok(onDisk.deletedAt);
  assert.equal(onDisk.title, undefined);
  assert.equal(onDisk.date, '2026-10-07');
  assert.equal(onDisk.rev, 2);
  assert.equal(store.deleted('tasks', t.id).rev, 2);
});

test('putting a deleted record back keeps counting revisions', async () => {
  await fresh();
  const t = store.put('tasks', { title: 'Again' });
  const prev = store.remove('tasks', t.id);
  const back = store.put('tasks', prev);
  assert.equal(back.rev, 3);
  assert.equal(back.deletedAt, undefined);
  assert.equal(store.deleted('tasks', t.id), undefined);
});

test('the outbox keeps one latest entry per record, and skips device-only stores', async () => {
  const disk = await fresh();
  const t = store.put('tasks', { title: 'One' });
  store.update('tasks', t.id, { title: 'Two' });
  store.put('meta', { id: 'seed', version: 2 });
  store.put('daySnapshots', { id: '2026-10-06', date: '2026-10-06', score: 0.5 });
  await store.flush();
  const out = [...disk.db.outbox.values()];
  assert.equal(out.length, 1);
  assert.deepEqual({ id: out[0].id, op: out[0].op, rev: out[0].rev }, { id: `tasks:${t.id}`, op: 'put', rev: 2 });
  store.remove('tasks', t.id);
  store.remove('daySnapshots', '2026-10-06');
  await store.flush();
  assert.equal(disk.db.outbox.get(`tasks:${t.id}`).op, 'delete');
  assert.equal(disk.db.daySnapshots.has('2026-10-06'), false, 'device-only stores delete outright');
});

test('everything written in the same moment lands in one transaction', async () => {
  const disk = await fresh();
  store.put('tasks', { title: 'a' });
  store.put('tasks', { title: 'b' });
  store.batch([{ store: 'stepLogs', value: { id: '2026-10-07', date: '2026-10-07', steps: 9000 } }]);
  await store.flush();
  assert.equal(disk.writes, 1);
});

test('a failed write rolls memory back and reports a friendly error', async () => {
  const disk = await fresh();
  const events = [];
  const off = store.subscribe((e) => events.push(e));
  disk.failNext = true;
  const origError = console.error;
  console.error = () => {};
  const t = store.put('tasks', { title: 'Lost?' });
  assert.ok(store.get('tasks', t.id), 'visible immediately');
  await store.flush();
  console.error = origError;
  await tick();
  off();
  assert.equal(store.get('tasks', t.id), undefined, 'rolled back');
  const err = events.find((e) => e.type === 'error');
  assert.match(err.message, /Couldn’t save/);
});

/** Writes that take a moment to land (and fail the first `fails` times), as on a slow, full disk. */
function slowDisk(disk, fails = 0) {
  const write = disk.write.bind(disk);
  disk.write = async (ops) => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    if (fails-- > 0) throw new Error('Simulated full disk');
    return write(ops);
  };
}

test('two quick changes to one record, the first failing: what is shown matches what is stored', async () => {
  const origError = console.error;
  console.error = () => {};
  try {
    for (const [fails, second] of [[1, 'edit'], [2, 'edit'], [1, 'delete'], [2, 'delete']]) {
      const disk = await fresh();
      const t = store.put('tasks', { title: 'Original' });
      await store.flush();
      slowDisk(disk, fails);
      store.update('tasks', t.id, { title: 'First edit' });
      await Promise.resolve(); // the first change is on its way to the disk
      if (second === 'edit') store.update('tasks', t.id, { title: 'Second edit' });
      else store.remove('tasks', t.id);
      await store.flush();
      const onDisk = disk.db.tasks.get(t.id);
      const shown = store.get('tasks', t.id);
      const label = `${second}, ${fails} failing`;
      if (onDisk.deletedAt) assert.equal(shown, undefined, `${label}: deleted on disk, so not shown`);
      else assert.equal(shown?.title, onDisk.title, label);
    }
  } finally {
    console.error = origError;
  }
});

test('the workout history loading in two steps keeps a set deleted meanwhile deleted', async () => {
  const d = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10);
  const disk = memoryAdapter({ workoutSets: [{ id: 's-new', date: d(1), reps: 8 }, { id: 's-old', date: d(100), reps: 5 }] });
  store.useAdapter(disk);
  await store.init({ recentFirst: true });
  assert.equal(store.get('workoutSets', 's-old'), undefined, 'only the recent weeks at first');
  slowDisk(disk);
  store.remove('workoutSets', 's-new');
  await store.loadRest(); // reads the disk before the delete has landed
  await store.complete();
  assert.ok(store.get('workoutSets', 's-old'), 'the rest arrived');
  assert.equal(store.get('workoutSets', 's-new'), undefined, 'the deleted set stays deleted');
  assert.ok(store.deleted('workoutSets', 's-new'), 'and keeps its tombstone');
  await store.flush();
});

test('change events say which days changed, ignoring derived summaries', async () => {
  await fresh();
  const events = [];
  const off = store.subscribe((e) => events.push(e));
  store.put('stepLogs', { id: '2026-10-05', date: '2026-10-05', steps: 5000 });
  store.put('daySnapshots', { id: '2026-10-04', date: '2026-10-04' });
  await tick();
  off();
  const dates = new Set(events.flatMap((e) => [...e.dates]));
  assert.deepEqual([...dates], ['2026-10-05']);
});

test('reloading from disk keeps data and hides tombstones', async () => {
  const disk = await fresh();
  const keep = store.put('tasks', { title: 'Keep' });
  const gone = store.put('tasks', { title: 'Gone' });
  store.remove('tasks', gone.id);
  await store.flush();
  await store.init();
  assert.equal(store.get('tasks', keep.id).title, 'Keep');
  assert.equal(store.get('tasks', gone.id), undefined);
  assert.equal(store.count('tasks'), 1);
  assert.ok(disk.db.tasks.get(gone.id).deletedAt);
});

test('photo data is deleted with a tombstone too', async () => {
  const disk = await fresh();
  await blobs.put('p1', 'BLOB');
  assert.equal((await blobs.get('p1')).blob, 'BLOB');
  await blobs.del('p1');
  assert.equal(await blobs.get('p1'), null);
  assert.equal((await blobs.all()).length, 0);
  assert.equal(disk.db.photoBlobs.get('p1').blob, undefined);
  assert.equal(disk.db.outbox.get('photoBlobs:p1').op, 'delete');
});
