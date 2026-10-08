// Phase 13c: cues at the right moment. A task booked into the calendar with its own alert; iPhone
// cues matched to the moment a habit follows; and reminders while the app is closed: the plan this
// device sends, and the server sending each one, encrypted, at its time, once, and not when done.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { fresh, store } from './helpers.mjs';
import { today, addDays, setDayEnd, weekday } from '../../js/domain/dates.js';
import { profileSeed, settingsSeed } from '../../js/data/seed.js';
import { buildCalendar } from '../../js/domain/ics.js';
import * as C from '../../js/domain/cues.js';
import { pushPlan } from '../../js/domain/push-plan.js';
import * as H from '../../js/domain/habits-more.js';
import worker, { sendDue, localTime } from '../../server/worker.js';
import { d1 } from '../support/d1.mjs';

setDayEnd('00:00');
const T = today();
const d = (n) => addDays(T, n);
const simple = (id, o = {}) => ({ id, name: id, type: 'binary', schedule: { kind: 'daily' }, state: 'focus', focusSince: d(-90), order: 0, ...o });
async function world(habits, { notifications, ...extra } = {}) {
  const s = settingsSeed();
  await fresh({ profile: [{ ...profileSeed(), trackingStart: d(-90) }], settings: [{ ...s, notifications: { ...s.notifications, ...notifications } }], habits, ...extra });
}
const unfold = (ics) => ics.replace(/\r\n /g, '').split('\r\n');

test('a task in the calendar: once, at its time, for its length, with the alert you chose', () => {
  const lines = unfold(buildCalendar([{ uid: 't1@life-os', title: 'Call the bank', time: '14:30', start: '2026-10-09', minutes: 30, alarm: 10, note: 'Ask about the fee' }]));
  assert.ok(lines.includes('DTSTART:20261009T143000'));
  assert.ok(lines.includes('DURATION:PT30M'));
  assert.ok(lines.includes('TRIGGER:-PT10M'), 'ten minutes before');
  assert.ok(lines.includes('TRANSP:OPAQUE'), 'a booked task takes your time');
  assert.ok(!lines.some((l) => l.startsWith('RRULE')), 'it happens once');
  // The repeating reminders keep their alert at the start and don't block your calendar.
  const rem = unfold(buildCalendar([{ uid: 'r@life-os', title: 'Morning check-in', time: '06:15', start: '2026-10-09', rrule: 'FREQ=DAILY' }]));
  assert.ok(rem.includes('TRIGGER:PT0S') && rem.includes('TRANSP:TRANSPARENT'));
});

test('iPhone cues: the event that fits the moment, five steps, and the words to paste', async () => {
  const cue = (anchor, name = '', time = null) => C.cueFor({ anchor, name, time });
  assert.equal(cue('After I wake up').trigger, 'alarm');
  assert.deepEqual(cue('After I brush my teeth'), { trigger: 'nfc', place: 'on the bathroom mirror' });
  assert.equal(cue('After my coffee').trigger, 'nfc');
  assert.deepEqual(cue('', 'Stretch at the gym'), { trigger: 'arrive', place: 'your gym' });
  assert.deepEqual(cue('After work'), { trigger: 'leave', place: 'work' });
  assert.equal(cue('Before bed').trigger, 'sleep');
  assert.deepEqual(cue('After lunch'), { trigger: 'time', time: '12:30' });
  assert.deepEqual(cue('After dinner', '', '19:30'), { trigger: 'time', time: '19:30' });
  assert.deepEqual(cue('', 'Journal', '21:00'), { trigger: 'time', time: '21:00' }, 'no moment named: its own time');
  assert.equal(cue('', 'Journal').trigger, 'nfc', 'nothing at all: a sticker where you do it');
  const steps = C.steps({ trigger: 'arrive', place: 'your gym' });
  assert.equal(steps.length, 5);
  assert.match(steps[1], /Arrive.*\(your gym\)/);
  assert.match(C.steps({ trigger: 'time', time: '12:30' })[1], /12:30/);

  await world([simple('pray', { name: 'Prayer', anchor: 'After I wake up', tiny: { label: 'One sentence of thanks' } }),
    simple('coffee', { name: 'Coffee', type: 'limit', limit: 2, instead: 'Sparkling water' }), simple('later', { state: 'queue' })]);
  assert.equal(C.cueText(H.habit('pray')), 'Prayer now. Even just: One sentence of thanks.');
  assert.equal(C.cueText(H.habit('coffee')), 'Coffee: Sparkling water');
  const items = C.list().filter((x) => x.kind === 'habit');
  assert.deepEqual(items.map((x) => x.habitId).sort(), ['coffee', 'pray'], 'your focus habits, not the ones waiting');
});

test('the reminder plan: the reminders you switched on, their days, and what is done today', async () => {
  const mon = Array.from({ length: 7 }, (_, i) => d(i)).find((x) => weekday(x) === 1);
  await world([
    simple('read', { name: 'Read', reminder: '21:00', tiny: { label: 'One page' } }),
    simple('gym', { name: 'Stretch', reminder: '07:30', schedule: { kind: 'weekdays', days: [1, 3, 5] } }),
    simple('plants', { name: 'Water the plants', reminder: '09:00', schedule: { kind: 'interval', every: 3 }, startDate: mon }),
    simple('auto', { name: 'Floss', reminder: '22:00', auto: [{ date: d(-1), answers: [5, 5, 5, 5], score: 5 }] }),
    simple('quiet', { name: 'No reminder' }),
  ], { notifications: { enabled: true, morning: { on: true, time: '06:30' }, evening: { on: false, time: '21:00' }, habits: { on: true } } });
  const p = pushPlan('https://app.example/', T);
  const ids = p.items.map((x) => x.id);
  assert.ok(ids.includes('morning') && !ids.includes('evening'), 'only what is switched on');
  assert.ok(ids.includes('habit:read') && ids.includes('habit:gym') && ids.includes('habit:plants'));
  assert.ok(!ids.includes('habit:auto'), 'a habit that feels automatic isn’t reminded');
  assert.ok(!ids.includes('habit:quiet'));
  const read = p.items.find((x) => x.id === 'habit:read');
  assert.deepEqual([read.at, read.days, read.dates, read.body, read.url], ['21:00', undefined, undefined, 'Even just: One page', 'https://app.example/#/plan/habits/read']);
  assert.deepEqual(p.items.find((x) => x.id === 'habit:gym').days, [1, 3, 5]);
  const plants = p.items.find((x) => x.id === 'habit:plants').dates;
  assert.ok(plants.length >= 4 && plants.every((x) => H.dueOn(H.habit('plants'), x)), 'an every-few-days habit lists the days it’s due');
  assert.deepEqual(p.done, { date: T, ids: [] });
  store.put('habitLogs', { id: H.logId('read', T), habitId: 'read', date: T, value: 1, completed: true });
  assert.deepEqual(pushPlan('https://app.example/', T).done.ids, ['habit:read'], 'done today: not sent');
  // Reminders switched off: nothing leaves the device.
  store.setSettings({ notifications: { ...store.settings().notifications, enabled: false } });
  assert.deepEqual(pushPlan('https://app.example/', T).items, []);
});

/* ---------- the server's sender, against a fake push service that decrypts what it gets ---------- */

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const unb64u = (s) => new Uint8Array(Buffer.from(s, 'base64url'));
const subtle = globalThis.crypto.subtle;
const hkdf = async (salt, ikm, info, bytes) => new Uint8Array(await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, await subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']), bytes * 8));

/** A browser's side of a push subscription: its keys, and how it reads a message (RFC 8291). */
async function browser() {
  const kp = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const pub = new Uint8Array(await subtle.exportKey('raw', kp.publicKey));
  const auth = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return {
    keys: { p256dh: b64u(pub), auth: b64u(auth) },
    async read(body) {
      const salt = body.subarray(0, 16), idlen = body[20], asPub = body.subarray(21, 21 + idlen), ct = body.subarray(21 + idlen);
      assert.equal(new DataView(body.buffer, body.byteOffset).getUint32(16), 4096);
      const theirs = await subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
      const shared = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: theirs }, kp.privateKey, 256));
      const te = new TextEncoder();
      const ikm = await hkdf(auth, shared, new Uint8Array([...te.encode('WebPush: info\0'), ...pub, ...asPub]), 32);
      const cek = await subtle.importKey('raw', await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16), 'AES-GCM', false, ['decrypt']);
      const nonce = await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12);
      const plain = new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: nonce }, cek, ct));
      assert.equal(plain[plain.length - 1], 2, 'the last-record delimiter');
      return JSON.parse(new TextDecoder().decode(plain.subarray(0, -1)));
    },
  };
}

/** A push service: records what arrives; answers 201, or 410 once the subscription is gone. */
function pushService() {
  const got = [];
  let status = 201;
  const server = createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => { got.push({ path: req.url, headers: req.headers, body: new Uint8Array(Buffer.concat(chunks)) }); res.writeHead(status); res.end(); });
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ got, url: `http://localhost:${server.address().port}`, gone: () => { status = 410; }, close: () => new Promise((r) => server.close(r)) })));
}

const call = (env, method, path, body) => worker.fetch(new Request(`http://x${path}`, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) }), env)
  .then(async (r) => ({ status: r.status, body: await r.json() }));
const me = { space: 'a'.repeat(64), auth: 'b'.repeat(64), dev: 'phone-0000000000' };

test('the server sends each reminder at its time, encrypted for that phone and signed, once, and not when done', async () => {
  const env = { DB: d1() };
  const svc = await pushService();
  const ua = await browser();
  try {
    const key = (await call(env, 'GET', '/push/key')).body.key;
    assert.equal(unb64u(key).length, 65, 'an uncompressed P-256 key');
    assert.equal((await call(env, 'GET', '/push/key')).body.key, key, 'made once, then kept');
    const plan = {
      tz: 'Indian/Mauritius', origin: 'https://lucashabittracker.netlify.app',
      items: [
        { id: 'morning', at: '06:30', title: 'Morning check-in', body: 'One minute.', url: 'https://lucashabittracker.netlify.app/#/today' },
        { id: 'week', at: '06:30', days: [7], title: 'Weekly review' },
        { id: 'habit:read', at: '06:32', title: 'Read', body: 'Even just: One page' },
      ],
      done: { date: '2026-10-08', ids: ['habit:read'] },
    };
    const sub = { endpoint: `${svc.url}/send/abc`, keys: ua.keys };
    assert.deepEqual((await call(env, 'POST', '/push', { ...me, sub, plan })).body, { ok: true, on: true, count: 3 });
    assert.equal((await call(env, 'POST', '/push', { ...me, auth: 'c'.repeat(64), sub, plan })).status, 403, 'only with your sync key');
    assert.equal((await call(env, 'POST', '/push', { ...me, sub: { endpoint: 'http://evil.example/x', keys: ua.keys }, plan })).status, 400, 'push addresses are https');
    assert.equal((await call(env, 'POST', '/push', { ...me, sub, plan: { ...plan, items: [{ id: 'x', at: '25:00' }] } })).status, 400);

    // 06:33 in Mauritius (UTC+4) on Thursday 8 October: the check-in is due; Read is done; the review is Sundays.
    assert.deepEqual(localTime(new Date('2026-10-08T02:33:00Z'), 'Indian/Mauritius'), { date: '2026-10-08', min: 393, wd: 4 });
    assert.equal(await sendDue(env, new Date('2026-10-08T02:33:00Z')), 1);
    assert.equal(svc.got.length, 1);
    const [msg] = svc.got;
    assert.equal(msg.path, '/send/abc');
    assert.equal(msg.headers['content-encoding'], 'aes128gcm');
    assert.equal(msg.headers.ttl, '3600');
    assert.deepEqual(await ua.read(msg.body), { title: 'Morning check-in', body: 'One minute.', url: 'https://lucashabittracker.netlify.app/#/today', tag: 'morning' });
    // The VAPID signature checks out against the server's key, for this push service.
    const [, t, k] = /^vapid t=([^,]+), k=(.+)$/.exec(msg.headers.authorization);
    assert.equal(k, key);
    const [h64, c64, s64] = t.split('.');
    const pub = await subtle.importKey('raw', unb64u(key), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    assert.ok(await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, pub, unb64u(s64), new TextEncoder().encode(`${h64}.${c64}`)));
    const claims = JSON.parse(Buffer.from(c64, 'base64url'));
    assert.equal(claims.aud, svc.url);
    assert.equal(claims.sub, 'https://lucashabittracker.netlify.app');
    assert.ok(claims.exp > Date.now() / 1000 && claims.exp < Date.now() / 1000 + 24 * 3600);

    // Once: a later run in the same window sends nothing more; past the window, nothing late.
    assert.equal(await sendDue(env, new Date('2026-10-08T02:38:00Z')), 0);
    assert.equal(await sendDue(env, new Date('2026-10-08T02:50:00Z')), 0);
    // The next day it's due again (Read too: the done mark was for yesterday).
    assert.equal(await sendDue(env, new Date('2026-10-09T02:33:00Z')), 2);
    // Sunday brings the review.
    const sent = svc.got.length;
    await sendDue(env, new Date('2026-10-11T02:31:00Z'));
    assert.deepEqual((await Promise.all(svc.got.slice(sent).map((m) => ua.read(m.body)))).map((m) => m.tag).sort(), ['morning', 'week']);

    // A phone that unsubscribed (410) is forgotten.
    svc.gone();
    await sendDue(env, new Date('2026-10-12T02:33:00Z'));
    assert.equal(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM push').get().n, 0);
    // Turning it off from the app forgets it too.
    await call(env, 'POST', '/push', { ...me, sub, plan });
    assert.deepEqual((await call(env, 'POST', '/push', { ...me, sub: null })).body, { ok: true, on: false });
    assert.equal(env.DB.raw.prepare('SELECT COUNT(*) AS n FROM push').get().n, 0);
  } finally { await svc.close(); }
});
