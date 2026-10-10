// Sync between two devices (Phase 13): a phone starts sync, a computer joins with the key and takes
// the phone's data (pictures included), then changes travel both ways, deletions too; a device's
// own settings stay put, and a second key can't use a server that already has an owner.
// The server is server/worker.js running in Node over SQLite (tests/support/server.mjs).
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
import { serve } from './support/server.mjs';

const { devices } = createRequire(import.meta.url)('playwright');

const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { browser, step, finish, base, errors } = t;
const PORT = 8790 + Math.floor(Math.random() * 100);
const SERVER = `http://localhost:${PORT}`;
const srv = await serve(PORT);

async function device(kind) {
  const opts = kind === 'phone' ? { ...devices['iPhone 14'] } : { viewport: { width: 1280, height: 860 } };
  const ctx = await browser.newContext(opts);
  const p = await ctx.newPage();
  p.setDefaultTimeout(15000);
  p.on('pageerror', (e) => errors.push(`${kind}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(`${kind}: console: ${m.text()}`); });
  await p.goto(`${base}#/today`);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const synced = (p) => p.waitForFunction(() => /Synced/.test(document.querySelector('.sync-state')?.textContent || ''), null, { timeout: 20000 });
const syncNow = (p) => ev(p, async () => (await import('./js/sync/engine.js')).syncNow());
const tasks = (p) => ev(p, () => window.__lifeos.store.all('tasks').map((x) => x.title));

let phone, desk, key;

await step('a phone starts sync: the server checks out, a key is made, and everything goes up', async () => {
  phone = await device('phone');
  await ev(phone.p, async () => {
    const T = await import('./js/domain/tasks.js');
    T.add({ title: 'Call the bank (from the phone)' });
    window.__lifeos.store.setSettings({ focusLimit: 4, theme: 'light' });
    // a moodboard picture, drawn here
    const c = new OffscreenCanvas(64, 48);
    const g = c.getContext('2d');
    g.fillStyle = '#0071E3'; g.fillRect(0, 0, 64, 48);
    const blob = await c.convertToBlob({ type: 'image/png' });
    await (await import('./js/domain/moodboard.js')).add([new File([blob], 'blue.png', { type: 'image/png' })]);
  });
  await phone.p.goto(`${base}#/you/sync`);
  await phone.p.locator('[data-input="sy-url"]').fill(SERVER);
  await phone.p.locator('[data-action="sy-check"]').click();
  await phone.p.waitForSelector('text=Your server is ready.');
  await phone.p.locator('[data-action="sy-start"]').click();
  await synced(phone.p);
  key = await ev(phone.p, () => JSON.parse(localStorage.getItem('lifeos.sync')).key);
  if (!/^[0-9A-Z]{20}$/.test(key)) throw new Error(`key ${key}`);
  if (!(await phone.p.locator('.sync-key-val').textContent()).includes(key.slice(0, 5))) throw new Error('the new key is not shown');
  const rows = srv.env.DB.raw.prepare('SELECT COUNT(*) AS n FROM items').get().n;
  if (rows < 50) throw new Error(`only ${rows} records on the server`);
  // Sealed data is base64, which never holds a quote mark; any JSON that slipped through would. (A word
  // like "bank" can turn up in random base64 by chance, so it isn't a fair test.)
  const plain = srv.env.DB.raw.prepare("SELECT COUNT(*) AS n FROM items WHERE data LIKE '%\"%' OR k LIKE '%tasks%'").get().n;
  if (plain) throw new Error('something reached the server unencrypted');
});

await step('a computer joins with the key: the phone’s data replaces its own, picture included, and a safety copy is kept', async () => {
  desk = await device('desktop');
  await ev(desk.p, async () => (await import('./js/domain/tasks.js')).add({ title: 'Only on the computer before joining' }));
  await desk.p.goto(`${base}#/you/sync`);
  await desk.p.locator('[data-input="sy-url"]').fill(SERVER);
  await desk.p.locator('[data-action="sy-check"]').click();
  await desk.p.waitForSelector('text=Your server is ready.');
  await desk.p.locator('[data-input="sy-key"]').fill(`${key.slice(0, 5).toLowerCase()} ${key.slice(5)}`);
  await desk.p.locator('[data-action="sy-join"]').click();
  await desk.p.locator('.sheet [data-action="sy-take"]').click();
  await synced(desk.p);
  const list = await tasks(desk.p);
  if (!list.includes('Call the bank (from the phone)')) throw new Error('the phone’s task did not arrive');
  if (list.includes('Only on the computer before joining')) throw new Error('the computer’s own data was kept instead of replaced');
  if ((await ev(desk.p, () => window.__lifeos.store.settings().focusLimit)) !== 4) throw new Error('settings did not arrive');
  const pics = await ev(desk.p, async () => (await (await import('./js/data/blobs.js')).blobs.all()).filter((b) => b.id.startsWith('mb-')).length);
  if (pics !== 1) throw new Error(`${pics} moodboard pictures on the computer`);
  const copies = await ev(desk.p, async () => (await (await import('./js/data/migrations.js')).safetyBackups()).map((c) => c.reason));
  if (!copies.some((r) => /joining sync/i.test(r))) throw new Error(`no safety copy: ${copies.join(', ')}`);
});

await step('changes travel both ways, deletions too, and a device’s own settings stay with it', async () => {
  await ev(desk.p, async () => {
    (await import('./js/domain/tasks.js')).add({ title: 'Booked on the computer' });
    window.__lifeos.store.setSettings({ theme: 'dark', focusLimit: 5 });
  });
  await syncNow(desk.p);
  await syncNow(phone.p);
  if (!(await tasks(phone.p)).includes('Booked on the computer')) throw new Error('the computer’s task did not reach the phone');
  const s = await ev(phone.p, () => window.__lifeos.store.settings());
  if (s.focusLimit !== 5) throw new Error(`focus limit ${s.focusLimit} on the phone`);
  if (s.theme !== 'light') throw new Error('the computer’s theme changed the phone’s');
  // delete on the phone; the computer loses it too
  await ev(phone.p, () => { const t2 = window.__lifeos.store.all('tasks').find((x) => x.title === 'Booked on the computer'); window.__lifeos.store.remove('tasks', t2.id); });
  await syncNow(phone.p);
  await syncNow(desk.p);
  if ((await tasks(desk.p)).includes('Booked on the computer')) throw new Error('the deletion did not reach the computer');
  // nothing echoes: a sync with nothing new changes nothing
  const before = srv.env.DB.raw.prepare('SELECT MAX(seq) AS m FROM items').get().m;
  await syncNow(phone.p);
  await syncNow(desk.p);
  const after = srv.env.DB.raw.prepare('SELECT MAX(seq) AS m FROM items').get().m;
  if (after !== before) throw new Error(`quiet syncs wrote ${after - before} records`);
});

await step('a second key can’t use a server that has an owner; turning sync off keeps the data', async () => {
  const other = await device('desktop');
  await other.p.goto(`${base}#/you/sync`);
  await other.p.locator('[data-input="sy-url"]').fill(SERVER);
  await other.p.locator('[data-action="sy-check"]').click();
  await other.p.waitForSelector('text=Your server is ready.');
  await other.p.locator('[data-action="sy-start"]').click();
  await other.p.waitForSelector('text=already belongs to another sync key');
  await other.ctx.close();
  await desk.p.locator('[data-action="sy-off"]').click();
  await desk.p.locator('.sheet [data-action="sy-stop"]').click();
  await desk.p.waitForSelector('[data-action="sy-check"]');
  if (!(await tasks(desk.p)).includes('Call the bank (from the phone)')) throw new Error('turning off lost data');
});

await phone?.ctx.close();
await desk?.ctx.close();
await srv.close();
await finish();
