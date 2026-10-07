// Phase 0: data safety (migrations, safety copies, tombstones, outbox, reloads mid-write),
// the day boundary, background day summaries, and text that scales from 85% to 200%.
import { setup } from './helpers.mjs';
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { page, browser, step, shot, go, finish, base, errors } = t;

const ev = (fn, arg) => page.evaluate(fn, arg);
const ready = () => page.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });

await step('a fresh install starts up to date, with no safety copy needed', async () => {
  await go('#/today', '.today');
  const s = await ev(async () => {
    const { store } = window.__lifeos;
    const { MIGRATIONS } = await import('./js/data/migrations.js');
    return { applied: store.get('meta', 'migrations')?.applied, all: MIGRATIONS.map((m) => m.id), dayEndsAt: store.profile().dayEndsAt, copies: (await store.disk().getAll('localBackups')).length };
  });
  if (JSON.stringify(s.applied) !== JSON.stringify(s.all)) throw new Error(`applied ${s.applied}`);
  if (s.dayEndsAt !== '03:00') throw new Error(`dayEndsAt ${s.dayEndsAt}`);
  if (s.copies !== 0) throw new Error(`${s.copies} safety copies on a fresh install`);
});

let fixture;
await step('upgrading a version 2 database keeps every record and takes a safety copy first', async () => {
  // Build a realistic version 2 database: sample data, minus everything version 3 adds.
  fixture = await ev(async () => {
    const { loadDemo } = await import('./js/data/demo.js');
    await loadDemo(60);
    const { buildBackup } = await import('./js/data/backup.js');
    const b = await buildBackup();
    b.schema = 2;
    for (const recs of Object.values(b.data)) for (const r of recs) { delete r.rev; delete r.tz; }
    b.data.profile = b.data.profile.map(({ dayEndsAt, ...p }) => p);
    b.data.meta = b.data.meta.filter((m) => m.id === 'seed');
    return b;
  });
  await page.goto(`${base}manifest.webmanifest`);
  await ev(async (fx) => {
    const { STORES } = await import('./js/data/schema.js');
    const NEW = ['daySnapshots', 'outbox', 'localBackups'];
    await new Promise((res, rej) => { const r = indexedDB.deleteDatabase('life-os'); r.onsuccess = res; r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked')); });
    const db = await new Promise((res, rej) => {
      const r = indexedDB.open('life-os', 2);
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
    const names = Object.keys(fx.data);
    const tx = db.transaction(names, 'readwrite');
    for (const n of names) for (const rec of fx.data[n]) tx.objectStore(n).put(rec);
    await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    db.close();
  }, fixture);
  await page.goto(`${base}#/today`);
  await ready();
  const s = await ev(async () => {
    const { store } = window.__lifeos;
    const { BACKUP_STORES } = await import('./js/data/schema.js');
    const counts = Object.fromEntries(BACKUP_STORES.map((k) => [k, store.count(k)]));
    const copies = await store.disk().getAll('localBackups');
    return { counts, dayEndsAt: store.profile().dayEndsAt, copies: copies.map((c) => ({ reason: c.reason, counts: c.counts })) };
  });
  for (const [k, n] of Object.entries(fixture.counts)) {
    if (k === 'meta') continue;
    if (s.counts[k] !== n) throw new Error(`${k}: ${s.counts[k]} after upgrade, ${n} before`);
  }
  if (s.dayEndsAt !== '03:00') throw new Error(`dayEndsAt ${s.dayEndsAt}`);
  if (s.copies.length !== 1) throw new Error(`${s.copies.length} safety copies`);
  if (s.copies[0].counts.habitLogs !== fixture.counts.habitLogs) throw new Error('the safety copy is incomplete');
  await go('#/more/data', '[data-action="copy-restore"]');
  await shot('01-safety-copy');
});

await step('a backup file from version 2 restores and catches up', async () => {
  const s = await ev(async (fx) => {
    const { restore } = await import('./js/data/backup.js');
    await restore(fx, 'replace');
    const { store } = window.__lifeos;
    return { dayEndsAt: store.profile().dayEndsAt, logs: store.count('habitLogs') };
  }, fixture);
  if (s.dayEndsAt !== '03:00') throw new Error(`dayEndsAt ${s.dayEndsAt}`);
  if (s.logs !== fixture.counts.habitLogs) throw new Error(`habitLogs ${s.logs}`);
});

await step('reloading in the middle of a big write loses nothing', async () => {
  await go('#/today', '.today');
  await page.evaluate(() => {
    const { store } = window.__lifeos;
    const ops = [];
    for (let i = 0; i < 400; i++) {
      const d = new Date(2020, 0, 1 + i);
      const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      ops.push({ store: 'stepLogs', value: { id, date: id, steps: 4242 } });
    }
    store.batch(ops);
    location.reload();
  }).catch(() => {});
  await page.waitForLoadState('load');
  await ready();
  const n = await ev(() => window.__lifeos.store.where('stepLogs', (r) => r.steps === 4242).length);
  if (n !== 400) throw new Error(`${n} of 400 records survived the reload`);
});

await step('deleting leaves a tombstone and an outbox entry on disk', async () => {
  const s = await ev(async () => {
    const { store } = window.__lifeos;
    const t = store.put('tasks', { title: 'Tombstone test', date: null });
    store.remove('tasks', t.id);
    await store.flush();
    const disk = store.disk();
    return { tomb: await disk.get('tasks', t.id), out: await disk.get('outbox', `tasks:${t.id}`), live: store.get('tasks', t.id) };
  });
  if (!s.tomb?.deletedAt || s.tomb.title) throw new Error(`tombstone ${JSON.stringify(s.tomb)}`);
  if (s.out?.op !== 'delete') throw new Error(`outbox ${JSON.stringify(s.out)}`);
  if (s.live) throw new Error('still visible');
});

await step('day summaries build in the background and follow edits', async () => {
  await page.waitForFunction(async () => {
    const { store } = window.__lifeos;
    const { range, addDays, today } = await import('./js/domain/dates.js');
    const days = range(store.profile().trackingStart, addDays(today(), -1)).length;
    return store.count('daySnapshots') >= days;
  }, null, { timeout: 20000, polling: 500 });
  const date = await ev(async () => {
    const { addDays, today } = await import('./js/domain/dates.js');
    const d = addDays(today(), -3);
    window.__lifeos.store.put('stepLogs', { id: d, date: d, steps: 31337 });
    return d;
  });
  await page.waitForFunction((d) => window.__lifeos.store.get('daySnapshots', d)?.steps === 31337, date, { timeout: 15000, polling: 250 });
});

await step('the day ends at 03:00 unless you change it', async () => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Indian/Mauritius' });
  const p = await ctx.newPage();
  await p.clock.setFixedTime(new Date('2026-10-08T01:30:00+04:00'));
  await p.goto(`${base}#/today`);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  const late = await p.evaluate(async () => (await import('./js/domain/dates.js')).today());
  if (late !== '2026-10-07') throw new Error(`at 01:30 today is ${late}`);
  await p.goto(`${base}#/more/settings`);
  await p.selectOption('select[data-k="dayEndsAt"]', '00:00');
  await p.waitForFunction(() => window.__lifeos.store.profile().dayEndsAt === '00:00');
  const after = await p.evaluate(async () => (await import('./js/domain/dates.js')).today());
  if (after !== '2026-10-08') throw new Error(`with a midnight boundary today is ${after}`);
  await ctx.close();
});

// Visible text cut off by its box (screen-reader-only text and deliberate ellipses aside).
const clipped = () => page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('.view *, .sheet-content *')) {
    if (!el.getClientRects().length || el.clientWidth <= 1) continue;
    if (el.matches('.swipe')) continue; // swipe rows hide their actions until you swipe
    if (el.tagName === 'INPUT') {
      if (!['checkbox', 'radio', 'range', 'file', 'hidden'].includes(el.type) && el.scrollWidth > el.clientWidth + 2) out.push(`input ${el.type} "${el.value}"`);
      continue;
    }
    const cs = getComputedStyle(el);
    if (cs.textOverflow === 'ellipsis') continue;
    if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip') && el.scrollWidth > el.clientWidth + 2 && el.textContent.trim()) {
      out.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} "${el.textContent.trim().slice(0, 30)}"`);
    }
  }
  return out;
});

// Every main screen, with the text at 85% and at 200% of the default size.
const SCREENS = [
  ['#/today', '.today'], ['#/progress', '[data-view="progress"]'], ['#/habits', '[data-view="habits"]'], ['#/habits/h-protein', '[data-view="habit"]'],
  ['#/body', '[data-view="body"]'], ['#/body/training', '[data-view="training"]'], ['#/body/weight', '[data-view="weight"]'],
  ['#/more', '[data-view="more"]'], ['#/more/tasks', '[data-view="tasks"]'], ['#/more/journal', '[data-view="journal"]'],
  ['#/more/goals', '[data-view="goals"]'], ['#/more/settings', '[data-view="settings"]'], ['#/more/data', '[data-view="data"]'],
];
for (const [label, size] of [['85', '90.3125%'], ['200', '212.5%']]) {
  await step(`text at ${label}% fits every screen`, async () => {
    await go('#/today', '.today');
    await ev((s) => { document.documentElement.style.fontSize = s; }, size);
    for (const [hash, sel] of SCREENS) {
      await page.evaluate((h) => { location.hash = h; }, hash);
      await page.waitForSelector(sel);
      await shot(`text${label}-${hash.slice(2).replace(/\//g, '-')}`);
      const cut = await clipped();
      if (cut.length) errors.push(`${hash} at ${label}%: text cut off: ${cut.slice(0, 3).join(' | ')}`);
    }
    await page.evaluate(() => import('./js/screens/sheets.js').then((m) => m.openCheckin()));
    await page.waitForSelector('.sheet-wrap.is-open');
    await shot(`text${label}-sheet-checkin`);
    const cut = await clipped();
    if (cut.length) errors.push(`check-in at ${label}%: text cut off: ${cut.slice(0, 3).join(' | ')}`);
    await page.keyboard.press('Escape');
    await ev(() => { document.documentElement.style.fontSize = ''; });
  });
}

if (errors.length) console.log(errors.join('\n'));
await finish();
