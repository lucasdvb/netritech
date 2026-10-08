// Sync (Phase 13): the server keeps the newest version of each record and only answers to its key;
// the encryption round-trips and can't be read with another key; and two devices, each with its
// own store, end up with the same data through the server, both ways, with no echo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../../server/worker.js';
import { d1 } from '../support/d1.mjs';
import { keysFrom, newKey, normalize, isKey } from '../../js/sync/crypto.js';

const post = (env, body) => worker.fetch(new Request('http://x/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }), env).then(async (r) => ({ status: r.status, body: await r.json() }));
const hex = (c) => c.repeat(64);

test('server: newest wins, changes are numbered, a device doesn’t get its own writes back, and the key is checked', async () => {
  const env = { DB: d1() };
  const health = await (await worker.fetch(new Request('http://x/health'), env)).json();
  assert.deepEqual([health.app, health.db], ['life-os-server', true]);
  const me = { space: hex('a'), auth: hex('b') };
  let r = await post(env, { ...me, dev: 'device-one-000000', since: 0, push: [{ k: 'record-one-000000', ts: '2026-10-08T10:00:00Z', d: 'v1' }] });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.items, [], 'its own write is left out');
  const after1 = r.body.seq;
  // An older copy never replaces a newer one; a newer one does, and gets a new number.
  r = await post(env, { ...me, dev: 'device-two-000000', since: 0, push: [{ k: 'record-one-000000', ts: '2026-10-08T09:00:00Z', d: 'old' }] });
  assert.deepEqual(r.body.items, [{ k: 'record-one-000000', d: 'v1' }]);
  r = await post(env, { ...me, dev: 'device-two-000000', since: r.body.seq, push: [{ k: 'record-one-000000', ts: '2026-10-08T11:00:00Z', d: 'v2' }] });
  r = await post(env, { ...me, dev: 'device-one-000000', since: after1, push: [] });
  assert.deepEqual(r.body.items, [{ k: 'record-one-000000', d: 'v2' }], 'device one learns of the newer copy');
  // The wrong password, or a second key on a server that has an owner, is turned away.
  assert.equal((await post(env, { space: hex('a'), auth: hex('c'), since: 0, push: [] })).status, 403);
  assert.equal((await post(env, { space: hex('d'), auth: hex('e'), since: 0, push: [] })).status, 403);
  assert.equal((await post({ ...env, OPEN: '1' }, { space: hex('d'), auth: hex('e'), since: 0, push: [] })).status, 200);
  assert.equal((await post(env, { space: 'nope', auth: hex('b'), since: 0 })).status, 400);
});

test('server: a device catching up gets everything, page by page', async () => {
  const env = { DB: d1() };
  const me = { space: hex('1'), auth: hex('2') };
  const push = Array.from({ length: 900 }, (_, i) => ({ k: `rec-${String(i).padStart(12, '0')}`, ts: '2026-10-08T10:00:00Z', d: `x${i}` }));
  await post(env, { ...me, dev: 'device-one-000000', since: 0, push: push.slice(0, 450) });
  await post(env, { ...me, dev: 'device-one-000000', since: 0, push: push.slice(450) });
  const seen = [];
  let since = 0;
  for (let more = true; more;) {
    const r = await post(env, { ...me, dev: 'device-new-000000', since, push: [] });
    seen.push(...r.body.items);
    since = r.body.seq;
    more = r.body.more;
  }
  assert.equal(seen.length, 900);
  assert.equal(new Set(seen.map((x) => x.k)).size, 900);
});

test('keys: a new key reads back, typos in O/I/L are forgiven, and records only open with the same key', async () => {
  const key = newKey();
  assert.match(key, /^[0-9A-Z]{5}(-[0-9A-Z]{5}){3}$/);
  assert.ok(isKey(key.toLowerCase().replace(/-/g, ' ')));
  assert.equal(normalize('abcde-fghij'), 'ABCDEFGH1J');
  const a = await keysFrom(key);
  const b = await keysFrom(key.toLowerCase());
  assert.equal(a.space, b.space);
  assert.equal(a.auth, b.auth);
  assert.notEqual(a.space, a.auth);
  assert.equal(await a.name('habits:h-1'), await b.name('habits:h-1'));
  assert.notEqual(await a.name('habits:h-1'), await a.name('habits:h-2'));
  const sealed = await a.seal({ s: 'habits', r: { id: 'h-1', name: 'Read' } });
  assert.ok(!sealed.includes('Read'));
  assert.deepEqual(await b.open(sealed), { s: 'habits', r: { id: 'h-1', name: 'Read' } });
  const other = await keysFrom(newKey());
  await assert.rejects(() => other.open(sealed));
  await assert.rejects(() => keysFrom('too short'));
});
