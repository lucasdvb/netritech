// Phase 13c in the browser: a task booked into the calendar (the file it hands over, and the task
// moved to that day); iPhone cues from Settings and the habit page; and reminders while the app is
// closed, end to end: turned on from Settings through a sync server, sent by the server's
// once-a-minute run to a push service that decrypts them, skipped once done, and turned off again.
// The browser's push subscription is a stand-in (headless browsers have no push service); the
// encryption, signing and sending are the real ones.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { setup } from './helpers.mjs';
import { serve } from './support/server.mjs';
import { sendDue } from '../server/worker.js';

const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { browser, step, finish, base, errors } = t;
const OUT = process.argv[3] || './test-shots';
const MOMENT = '2026-10-08T07:50:00+04:00'; // Thursday morning in Mauritius

async function at({ phone = true, scheme = 'light', demo = true, perms = [], init = null } = {}) {
  const ctx = await browser.newContext({ ...(phone ? devices['iPhone 14'] : { viewport: { width: 1280, height: 860 } }), colorScheme: scheme, timezoneId: 'Indian/Mauritius', permissions: perms });
  if (init) await ctx.addInitScript(init.fn, init.arg);
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`console: ${m.text()}`); });
  await p.clock.setFixedTime(new Date(MOMENT));
  await p.goto(`${base}#/today`);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
  if (demo) {
    await p.evaluate(async () => {
      const s = window.__lifeos.store;
      s.setSettings({ welcomed: true, installDismissed: true });
      for (const [id, anchor] of [['h-prayer', 'After I wake up'], ['h-mobility', 'After my coffee'], ['h-lights-out', 'After I brush my teeth']]) s.put('habits', { ...s.get('habits', id), state: 'focus', focusSince: '2026-09-01', anchor });
      await s.flush();
    });
    await p.reload();
    await p.waitForFunction(() => window.__lifeos?.ready);
  }
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const sheetGone = (p) => p.waitForSelector('.sheet-wrap.is-closing', { state: 'detached' }).catch(() => {});

await step('a task goes into the calendar at a time, for a length, with an alert, and moves to that day', async () => {
  const { ctx, p } = await at();
  const id = await ev(p, async () => (await import('./js/domain/tasks.js')).add({ title: 'Call the bank', date: null }).id);
  await ev(p, async (tid) => (await import('./js/screens/task-sheet.js')).openTask(tid), id);
  await p.locator('[data-action="to-calendar"]').click();
  await sheetGone(p);
  await p.waitForSelector('.task-cal');
  await p.locator('[data-change="tc-date"]').fill('2026-10-09');
  await p.locator('[data-change="tc-date"]').dispatchEvent('change');
  await p.locator('[data-change="tc-time"]').fill('14:30');
  await p.locator('[data-change="tc-time"]').dispatchEvent('change');
  await p.locator('[data-action="tc-len"][data-v="60"]').click();
  await p.locator('[data-action="tc-alarm"][data-v="30"]').click();
  await p.screenshot({ path: `${OUT}/p13c-task-calendar.png` });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('[data-action="tc-add"]').click()]);
  const ics = (await (await dl.createReadStream()).toArray()).join('');
  for (const line of ['SUMMARY:Call the bank', 'DTSTART:20261009T143000', 'DURATION:PT60M', 'TRIGGER:-PT30M', 'TRANSP:OPAQUE']) if (!ics.includes(line)) throw new Error(`missing ${line}`);
  const task = await ev(p, (tid) => window.__lifeos.store.get('tasks', tid), id);
  if (task.date !== '2026-10-09' || task.calendar?.time !== '14:30') throw new Error(JSON.stringify(task));
  await sheetGone(p);
  await ev(p, async (tid) => (await import('./js/screens/task-sheet.js')).openTask(tid), id);
  const label = await p.locator('[data-action="to-calendar"]').textContent();
  if (!/In your calendar · 14:30, 60 min/.test(label)) throw new Error(label);
  await ctx.close();
});

await step('iPhone cues: one per focus habit and routine, the right event for each, and the words to copy', async () => {
  const { ctx, p } = await at();
  await p.goto(`${base}#/you/settings`);
  await p.locator('[data-action="cues"]').click();
  await p.waitForSelector('.cues .row');
  const rows = await p.locator('.cues .row').allTextContents();
  const prayer = rows.find((r) => r.includes('Prayer'));
  if (!prayer || !/alarm stops/.test(prayer)) throw new Error(`prayer: ${prayer}`);
  if (!rows.some((r) => /Lights out/.test(r) && /sticker on the bathroom mirror/.test(r))) throw new Error('lights out: ' + rows.join(' | '));
  if (!rows.some((r) => /Morning/.test(r))) throw new Error('no routine');
  await p.screenshot({ path: `${OUT}/p13c-cues.png` });
  await p.locator('.cues .row', { hasText: 'Prayer' }).click();
  await sheetGone(p);
  await p.waitForSelector('.cue .recipe-steps li');
  await p.waitForTimeout(700); // the sheet finishes opening
  if ((await p.locator('.cue .recipe-steps li').count()) !== 5) throw new Error('steps');
  await p.screenshot({ path: `${OUT}/p13c-cue.png` });
  await ev(p, () => { navigator.clipboard.writeText = async (text) => { window.__copied = text; }; });
  await p.locator('[data-action="cue-copy"]').click();
  const copied = await ev(p, () => window.__copied || '(nothing copied)');
  if (!/^Prayer now\./.test(copied)) throw new Error(copied);
  await p.locator('[data-action="cue-done"]').click();
  if (!(await ev(p, () => window.__lifeos.store.get('habits', 'h-prayer').cueSetAt))) throw new Error('not marked');
  await p.goto(`${base}#/plan/habits/h-prayer`);
  await p.waitForSelector('[data-action="cue"]');
  if (!(await p.locator('.facts', { hasText: 'iPhone cue' }).count())) throw new Error('no fact');
  await ctx.close();
});

/* ---------- reminders while the app is closed ---------- */

const subtle = globalThis.crypto.subtle;
const hkdf = async (salt, ikm, info, n) => new Uint8Array(await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, await subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']), n * 8));
async function phoneKeys() {
  const kp = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const pub = new Uint8Array(await subtle.exportKey('raw', kp.publicKey));
  const auth = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const te = new TextEncoder();
  return {
    keys: { p256dh: Buffer.from(pub).toString('base64url'), auth: Buffer.from(auth).toString('base64url') },
    async read(body) {
      const salt = body.subarray(0, 16), asPub = body.subarray(21, 86);
      const shared = new Uint8Array(await subtle.deriveBits({ name: 'ECDH', public: await subtle.importKey('raw', asPub, { name: 'ECDH', namedCurve: 'P-256' }, false, []) }, kp.privateKey, 256));
      const ikm = await hkdf(auth, shared, new Uint8Array([...te.encode('WebPush: info\0'), ...pub, ...asPub]), 32);
      const cek = await subtle.importKey('raw', await hkdf(salt, ikm, te.encode('Content-Encoding: aes128gcm\0'), 16), 'AES-GCM', false, ['decrypt']);
      const plain = new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: await hkdf(salt, ikm, te.encode('Content-Encoding: nonce\0'), 12) }, cek, body.subarray(86)));
      return JSON.parse(new TextDecoder().decode(plain.subarray(0, -1)));
    },
  };
}
const got = [];
const pushSvc = createServer((req, res) => { const c = []; req.on('data', (x) => c.push(x)); req.on('end', () => { got.push(new Uint8Array(Buffer.concat(c))); res.writeHead(201); res.end(); }); });
await new Promise((r) => pushSvc.listen(0, r));
const PUSH = `http://localhost:${pushSvc.address().port}`;
const PORT = 8890 + Math.floor(Math.random() * 100);
const srv = await serve(PORT);

await step('reminders when the app is closed: turned on from Settings, sent at their time, skipped once done, turned off', async () => {
  const phone = await phoneKeys();
  // The browser's push subscription, standing in for the real one.
  const fake = ({ endpoint, keys }) => {
    let sub = null;
    const make = (opts) => ({ endpoint, options: opts, toJSON: () => ({ endpoint, expirationTime: null, keys }), unsubscribe: async () => { sub = null; return true; } });
    PushManager.prototype.subscribe = async function subscribe(opts) { sub = make(opts); return sub; };
    PushManager.prototype.getSubscription = async function getSubscription() { return sub; };
  };
  const { ctx, p } = await at({ phone: false, perms: ['notifications'], init: { fn: fake, arg: { endpoint: `${PUSH}/send/phone`, keys: phone.keys } } });
  // Reminders as they would be set: on, the morning check-in at 08:00 and Prayer at 08:00.
  await ev(p, async () => {
    const s = window.__lifeos.store;
    const nt = s.settings().notifications;
    s.setSettings({ notifications: { ...nt, enabled: true, morning: { on: true, time: '08:00' }, workout: { on: false }, habits: { on: true } } });
    s.put('habits', { ...s.get('habits', 'h-prayer'), reminder: '08:00' });
    s.put('habits', { ...s.get('habits', 'h-mobility'), reminder: '08:10' });
  });
  // Sync first: the sheet says so.
  await p.goto(`${base}#/you/settings`);
  await p.locator('[data-action="push"]').click();
  await p.waitForSelector('[data-action="ps-sync"]');
  await sheetGone(p);
  await p.keyboard.press('Escape');
  await p.goto(`${base}#/you/sync`);
  await p.locator('[data-input="sy-url"]').fill(`http://localhost:${PORT}`);
  await p.locator('[data-action="sy-check"]').click();
  await p.waitForSelector('text=Your server is ready.');
  await p.locator('[data-action="sy-start"]').click();
  await p.waitForFunction(() => /Synced/.test(document.querySelector('.sync-state')?.textContent || ''), null, { timeout: 30000 });
  await p.goto(`${base}#/you/settings`);
  await p.locator('[data-action="push"]').click();
  await p.waitForSelector('.push-sheet .push-list');
  const list = await p.locator('.push-list').textContent();
  if (!/Morning check-in/.test(list) || !/Prayer/.test(list) || !/Close the day/.test(list)) throw new Error(`list: ${list}`);
  await p.screenshot({ path: `${OUT}/p13c-push.png` });
  await p.locator('[data-action="ps-on"]').click();
  await p.waitForSelector('.push-sheet .sync-state');
  const row = srv.env.DB.raw.prepare('SELECT plan FROM push').get();
  if (!row) throw new Error('nothing on the server');
  const plan = JSON.parse(row.plan);
  if (plan.tz !== 'Indian/Mauritius' || !plan.items.some((i) => i.id === 'habit:h-prayer')) throw new Error(row.plan);
  // 08:00 in Mauritius: both are sent, encrypted for this phone.
  const sent = await sendDue(srv.env, new Date('2026-10-08T04:00:30Z'));
  if (sent !== 2) throw new Error(`sent ${sent}`);
  const titles = (await Promise.all(got.map((b) => phone.read(b)))).map((m) => m.title).sort();
  if (titles.join() !== 'Morning check-in,Prayer') throw new Error(titles.join());
  // Mobility done in the app before its 08:10 reminder: the server hears of it and doesn't send it.
  await ev(p, async () => {
    const H = await import('./js/domain/habits.js');
    H.setLog(H.habit('h-mobility'), (await import('./js/domain/dates.js')).today(), { value: 1 });
  });
  await new Promise((r) => setTimeout(r, 4000));
  const plan2 = JSON.parse(srv.env.DB.raw.prepare('SELECT plan FROM push').get().plan);
  if (!plan2.done.ids.includes('habit:h-mobility')) throw new Error(`done: ${JSON.stringify(plan2.done)}`);
  const before = got.length;
  await sendDue(srv.env, new Date('2026-10-08T04:10:30Z'));
  if (got.length !== before) throw new Error('a done habit was reminded');
  // Off: the server forgets this device.
  await p.locator('[data-action="ps-off"]').click();
  await p.waitForSelector('[data-action="ps-on"]');
  if (srv.env.DB.raw.prepare('SELECT COUNT(*) AS n FROM push').get().n) throw new Error('still on the server');
  await ctx.close();
});

await step('on an iPhone in Safari, reminders point to the Home Screen app', async () => {
  const { ctx, p } = await at({ demo: false });
  await p.goto(`${base}#/you/settings`);
  await p.locator('[data-action="push"]').click();
  await p.waitForSelector('text=reach only the Life OS on your Home Screen');
  await ctx.close();
});

await srv.close();
await new Promise((r) => pushSvc.close(r));
await finish();
