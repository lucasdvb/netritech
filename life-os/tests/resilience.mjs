// Phase 11: data resilience. Nothing you log is ever lost or half-saved: a full disk rolls a write
// back and says so; a backup carries every store (the progression ones too) and restores exactly;
// a version 5 database with a year in it upgrades intact; odd or damaged records never break a
// screen; and with storage blocked the app explains instead of failing silently.
import { setup } from './helpers.mjs';
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { page, step, finish, base, errors, shot } = t;
const ev = (fn, arg) => page.evaluate(fn, arg);
const ready = () => page.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
const go = async (hash, sel) => { await page.goto(base + hash); await ready(); if (sel) await page.waitForSelector(sel); };

await go('#/today', '.today');
await ev(async () => { const D = await import('./js/data/demo.js'); await D.loadDemo(365); });
await go('#/today', '.today');

await step('a full disk: the write is rolled back and reported, and the next one saves', async () => {
  await ev(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...a) {
      if (window.__full) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      return put.apply(this, a);
    };
  });
  const before = await ev(() => window.__lifeos.store.all('waterLogs').length);
  await ev(() => { window.__full = true; });
  await page.locator('[data-action="add-water"]').first().click();
  await page.waitForSelector('.toast--danger');
  const msg = await page.locator('.toast').last().textContent();
  if (!/couldn’t save|safe/i.test(msg)) throw new Error(`message: ${msg}`);
  if (await ev(() => window.__lifeos.store.all('waterLogs').length) !== before) throw new Error('the failed entry is still shown');
  await shot('res-01-disk-full');
  await ev(() => { window.__full = false; });
  await page.locator('[data-action="add-water"]').first().click();
  await ev(() => window.__lifeos.store.flush());
  await go('#/today', '.today');
  const after = await ev(() => window.__lifeos.store.all('waterLogs').length);
  if (after !== before + 1) throw new Error(`${after - before} entries saved, expected exactly 1`);
});

let backup;
await step('a backup carries every store, the progression ones included, and restores exactly', async () => {
  // Give every progression store something to carry.
  await ev(async () => {
    const S = await import('./js/domain/seasons.js');
    const Rw = await import('./js/domain/rewards.js');
    const C = await import('./js/domain/commitments.js');
    const Q = await import('./js/domain/quests.js');
    const P = await import('./js/domain/progression.js');
    const H = await import('./js/domain/habits.js');
    S.create({ name: 'Autumn', habitIds: H.activeHabits().slice(0, 3).map((h) => h.id) });
    Rw.create({ kind: 'workouts', target: 10, title: 'New running shoes' });
    C.create({ habitId: H.activeHabits()[0].id, days: 30, stake: 'A coffee for a friend' });
    Q.offer();
    P.run();
    await window.__lifeos.store.flush();
  });
  const snap = () => ev(async () => {
    const { BACKUP_STORES } = await import('./js/data/schema.js');
    const { store } = window.__lifeos;
    const strip = ({ updatedAt, rev, ...r }) => r; // a restore may stamp these; the content must match
    return Object.fromEntries(BACKUP_STORES.filter((s) => s !== 'meta').map((s) => [s, JSON.stringify(store.all(s).map(strip).sort((a, b) => (a.id < b.id ? -1 : 1)))]));
  });
  const before = await snap();
  for (const s of ['seasons', 'records', 'levelEvents', 'rewards', 'commitments', 'quests']) if (before[s] === '[]') throw new Error(`nothing in ${s} to carry`);
  backup = await ev(async () => JSON.stringify(await (await import('./js/data/backup.js')).buildBackup()));
  await ev(async (json) => {
    const { restore } = await import('./js/data/backup.js');
    const empty = JSON.parse(json);
    for (const k of Object.keys(empty.data)) if (k !== 'meta') empty.data[k] = [];
    await restore(empty, 'replace');
    if (window.__lifeos.store.count('habitLogs')) throw new Error('not emptied');
    await restore(JSON.parse(json), 'replace');
  }, backup);
  await go('#/today', '.today');
  const after = await snap();
  const diff = Object.keys(before).filter((s) => before[s] !== after[s]);
  if (diff.length) throw new Error(`changed after the round trip: ${diff.join(', ')}`);
});

await step('another window takes the data over: this one stops writing and asks to reload, once', async () => {
  await go('#/today', '.today');
  const before = errors.length;
  const other = await page.context().newPage();
  await other.goto(`${base}manifest.webmanifest`);
  // What an update opened in another window does: it upgrades (here, replaces) the database.
  await other.evaluate(() => new Promise((res) => { const r = indexedDB.deleteDatabase('life-os'); r.onsuccess = res; r.onerror = res; }));
  await page.waitForSelector('.toast--danger:has-text("another window") .toast-btn');
  const water = await ev(() => window.__lifeos.store.all('waterLogs').length);
  await page.locator('[data-action="add-water"]').first().click();
  await page.waitForTimeout(600);
  if (await ev(() => window.__lifeos.store.all('waterLogs').length) !== water) throw new Error('a write went ahead with the data closed');
  if (await page.locator('.toast--danger:has-text("another window")').count() !== 1) throw new Error('the reload message is missing or doubled');
  await shot('res-03-taken-over');
  if (errors.length > before) throw new Error(`errors after the takeover: ${errors.slice(before, before + 3).join(' | ')}`);
  await other.close();
});

await step('a version 5 database with a year in it upgrades with every record intact', async () => {
  const fixture = JSON.parse(backup);
  const V6 = ['seasons', 'records', 'levelEvents', 'rewards', 'commitments', 'quests'];
  for (const s of V6) delete fixture.data[s];
  await page.goto(`${base}manifest.webmanifest`);
  await ev(async (fx) => {
    const { STORES } = await import('./js/data/schema.js');
    const NEW = ['seasons', 'records', 'levelEvents', 'rewards', 'commitments', 'quests'];
    await new Promise((res, rej) => { const r = indexedDB.deleteDatabase('life-os'); r.onsuccess = res; r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked')); });
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('life-os', 5);
      r.onupgradeneeded = () => {
        for (const [name, def] of Object.entries(STORES)) {
          if (NEW.includes(name)) continue;
          const s = r.result.createObjectStore(name, { keyPath: 'id' });
          for (const i of def.indexes) s.createIndex(i, i, { unique: false });
        }
      };
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const names = Object.keys(fx.data).filter((n) => db.objectStoreNames.contains(n));
    const tx = db.transaction(names, 'readwrite');
    for (const n of names) for (const rec of fx.data[n]) tx.objectStore(n).put(rec);
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    db.close();
  }, fixture);
  await go('#/today', '.today');
  const s = await ev(async () => {
    const { BACKUP_STORES, DB_VERSION } = await import('./js/data/schema.js');
    const db = await new Promise((res) => { const r = indexedDB.open('life-os'); r.onsuccess = () => res(r.result); });
    const version = db.version;
    db.close();
    return { version, DB_VERSION, counts: Object.fromEntries(BACKUP_STORES.map((k) => [k, window.__lifeos.store.count(k)])) };
  });
  if (s.version !== s.DB_VERSION) throw new Error(`database at version ${s.version}`);
  for (const [k, recs] of Object.entries(fixture.data)) {
    if (k === 'meta' || !Array.isArray(recs)) continue;
    const live = recs.filter((r) => !r.deletedAt).length;
    if (s.counts[k] < live) throw new Error(`${k}: ${s.counts[k]} after the upgrade, ${live} before`);
  }
  await go('#/progress/records', '[data-view="records"]');
  await go('#/plan/rewards', '[data-view="rewards"]');
});

await step('odd and damaged records never break a screen', async () => {
  await go('#/today', '.today');
  await ev(() => {
    const { store } = window.__lifeos;
    const d = '2026-10-01';
    store.batch([
      { store: 'habitLogs', value: { id: 'h-water:2026-10-01', habitId: 'h-water', date: d, value: 'lots' } },
      { store: 'habitLogs', value: { id: 'ghost:2026-10-01', habitId: 'no-such-habit', date: d, value: 1 } },
      { store: 'waterLogs', value: { id: 'odd-water', date: d, ml: -250 } },
      { store: 'nutritionLogs', value: { id: 'odd-food', date: d, name: '', protein: 'NaN', kcal: null } },
      { store: 'sleepEntries', value: { id: '2026-10-02', date: '2026-10-02', hours: null, bedtime: '25:99', wake: '' } },
      { store: 'weightEntries', value: { id: '2026-10-03', date: '2026-10-03', kg: 0 } },
      { store: 'workouts', value: { id: 'odd-workout', date: d, status: 'done', title: '' } },
      { store: 'workoutSets', value: { id: 'odd-set', workoutId: 'odd-workout', exerciseId: 'no-such-exercise', date: d, completed: true, reps: 'ten' } },
      { store: 'tasks', value: { id: 'odd-task', title: '', date: 'not-a-date', done: false } },
      { store: 'journalEntries', value: { id: 'odd-journal', date: d, kind: 'unknown', text: 'x'.repeat(20000) } },
      { store: 'habits', value: { id: 'odd-habit', name: '', type: 'mystery', schedule: { kind: 'someday' }, state: 'focus' } },
      { store: 'goals', value: { id: 'odd-goal', title: 'Odd', metric: 'nothing', target: null } },
      { store: 'dailyReviews', value: { id: '2026-10-04', date: '2026-10-04', mode: 'holiday' } },
    ]);
  });
  const routes = ['today', 'today/2026-10-01', 'plan', 'plan/habits', 'plan/habits/odd-habit', 'plan/tasks', 'plan/goals', 'plan/goals/odd-goal', 'plan/training',
    'progress', 'progress/trends', 'progress/calendar', 'progress/records', 'progress/year', 'progress/body', 'progress/body/weight', 'progress/body/nutrition',
    'progress/body/sleep', 'reflect', 'reflect/journal', 'reflect/journal/odd-journal', 'reflect/review/week', 'reflect/review/month', 'workout/odd-workout'];
  const broken = [];
  for (const r of routes) {
    await page.evaluate((h) => { location.hash = `#/${h}`; }, r);
    await page.waitForTimeout(450);
    if (await page.locator('#main :text("Something went wrong on this screen")').count()) broken.push(r);
  }
  if (broken.length) throw new Error(`these screens broke: ${broken.join(', ')}`);
  // Clean up so the last check starts from sound data.
  await ev(() => window.__lifeos.store.batch(['habitLogs:h-water:2026-10-01', 'habitLogs:ghost:2026-10-01', 'waterLogs:odd-water', 'nutritionLogs:odd-food', 'sleepEntries:2026-10-02',
    'weightEntries:2026-10-03', 'workouts:odd-workout', 'workoutSets:odd-set', 'tasks:odd-task', 'journalEntries:odd-journal', 'habits:odd-habit', 'goals:odd-goal', 'dailyReviews:2026-10-04']
    .map((k) => { const i = k.indexOf(':'); return { store: k.slice(0, i), delete: k.slice(i + 1) }; })));
});

await step('with storage blocked, the app says so instead of failing silently', async () => {
  const ctx = page.context();
  const p = await ctx.newPage();
  await p.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { get: () => undefined }); });
  await p.goto(`${base}#/today`);
  await p.waitForSelector('text=can’t open its local storage');
  await p.screenshot({ path: `${process.argv[3] || './test-shots'}/res-02-no-storage.png` });
  await p.close();
});

// The page errors this suite provokes on purpose are expected; anything else still fails it.
for (let i = errors.length - 1; i >= 0; i--) if (/QuotaExceeded|quota has been exceeded|IndexedDB unavailable|local storage/i.test(errors[i])) errors.splice(i, 1);
await finish();
