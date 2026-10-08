// Reminders, full restore, offline, keyboard, large dataset, desktop layout, reset.
import { readFileSync } from 'node:fs';
import { setup } from './helpers.mjs';
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { page, ctx, step, shot, go, finish, base } = t;
const out = process.argv[3];
const timings = [];

await step('reminder banner shows and records outcome', async () => {
  await go('#/today', '.today');
  await page.evaluate(async () => {
    const { store } = window.__lifeos;
    await store.setProfile({ workStart: '00:00', workEnd: '23:59', workDays: [1, 2, 3, 4, 5, 6, 7] });
    const nt = store.settings().notifications;
    await store.setSettings({ notifications: { ...nt, enabled: true, eyes: { ...nt.eyes, on: true } } });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForSelector('.reminder.is-open');
  await shot('60-reminder');
  await page.locator('.reminder [data-r="no"]').click();
  await page.waitForSelector('.reminder', { state: 'detached' });
  const outcome = await page.evaluate(() => window.__lifeos.store.all('reminderLog').at(-1)?.outcome);
  if (outcome !== 'dismissed') throw new Error('outcome ' + outcome);
});

await step('ignored three times → suggestion, new time → fresh start', async () => {
  const titles = () => page.evaluate(async () => {
    const C = await import('./js/domain/coach.js');
    const { today } = await import('./js/domain/dates.js');
    return C.guidance(today()).map((g) => g.title).join(' | ');
  });
  await page.evaluate(async () => {
    const { store } = window.__lifeos;
    const nt = store.settings().notifications;
    await store.setSettings({ notifications: { ...nt, evening: { ...nt.evening, on: true, since: '' } } });
    for (let i = 1; i <= 3; i++) {
      const d = new Date(Date.now() - i * 864e5);
      await store.put('reminderLog', { date: d.toISOString().slice(0, 10), key: 'evening', slot: 'evening', cat: 'evening', at: d.toISOString(), outcome: 'dismissed' });
    }
  });
  if (!(await titles()).includes('isn’t landing')) throw new Error('no suggestion: ' + (await titles()));
  await go('#/more/settings', '[data-view="settings"]');
  if (!(await page.textContent('[data-key="n-evening"]')).includes('Skipped 3 times')) throw new Error('settings note missing');
  await page.locator('input[data-k="evening"]').fill('20:30');
  await page.locator('input[data-k="evening"]').dispatchEvent('change');
  await page.waitForFunction(() => window.__lifeos.store.settings().notifications.evening.time === '20:30');
  if ((await titles()).includes('isn’t landing')) throw new Error('suggestion still shown after changing the time');
});

await step('backup → replace restore → data swapped back', async () => {
  await go('#/more/data', '[data-view="data"]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-action="backup"]').click()]);
  const path = await dl.path();
  const before = JSON.parse(readFileSync(path, 'utf8')).data.habits.length;
  await page.evaluate(() => window.__lifeos.store.put('weightEntries', { id: '2001-01-01', date: '2001-01-01', kg: 99.9 }));
  await page.locator('input[data-change="restore-file"]').setInputFiles(path);
  await page.locator('.sheet [data-action="replace"]').click();
  await page.waitForSelector('.sheet .confirm');
  await shot('61-replace-confirm');
  await page.locator('.sheet [data-action="yes"]').click();
  await page.waitForSelector('[data-view="today"]');
  const state = await page.evaluate(() => ({ stray: window.__lifeos.store.get('weightEntries', '2001-01-01'), habits: window.__lifeos.store.all('habits').length }));
  if (state.stray) throw new Error('replace kept a record that was not in the backup');
  if (state.habits !== before) throw new Error(`habits ${state.habits} vs ${before}`);
});

await step('bad backup file is rejected without changes', async () => {
  await go('#/more/data', '[data-view="data"]');
  await page.locator('input[data-change="restore-file"]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"app":"other"}') });
  await page.waitForSelector('.toast');
  const msg = await page.textContent('#toasts');
  if (!msg.includes('Nothing was changed')) throw new Error(msg);
});

await step('keyboard: toggle with Space, sheet focus trap, Escape returns focus', async () => {
  await go('#/today', '.today');
  // Outside a routine's window every routine starts folded; open one so there is a habit to reach.
  if (!(await page.locator('.rstep .check >> visible=true').count())) await page.locator('.routine-head').first().click();
  const first = page.locator('.rstep .check >> visible=true').first();
  await first.focus();
  const id = (await first.getAttribute('data-s')).replace(/^s-/, '');
  const doneNow = () => page.evaluate(async (hid) => { const H = await import('./js/domain/habits.js'); const { today } = await import('./js/domain/dates.js'); return H.counts(H.habit(hid), today()); }, id);
  const was = await doneNow();
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  if ((await doneNow()) === was) throw new Error('Space did not toggle ' + id);
  if (!(await page.evaluate(() => document.activeElement?.matches('.routine-head, .check')))) throw new Error('focus lost after toggle');
  const bad = await page.evaluate(() => [...document.querySelectorAll('[aria-pressed], [aria-expanded], [aria-selected], [aria-checked]')]
    .filter((e) => !['true', 'false', 'mixed'].includes(e.getAttribute(e.getAttributeNames().find((n) => /^aria-(pressed|expanded|selected|checked)$/.test(n))))).length);
  if (bad) throw new Error(`${bad} controls with an empty aria state`);
  await go('#/plan', '[data-view="plan"]');
  await page.locator('[data-view="plan"] [data-action="open-search"]').focus();
  await page.keyboard.press('Enter');
  await page.waitForSelector('.sheet input[type="search"]');
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  const inside = await page.evaluate(() => !!document.activeElement.closest('.sheet'));
  if (!inside) throw new Error('focus escaped the sheet');
  await page.keyboard.press('Escape');
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  const back = await page.evaluate(() => document.activeElement?.dataset.action);
  if (back !== 'open-search') throw new Error('focus not restored: ' + back);
});

await step('offline: reload with the network off', async () => {
  await go('#/today', '.today');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15000 });
  await ctx.setOffline(true);
  await page.reload();
  await page.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await page.goto(base + '#/progress');
  await page.waitForSelector('[data-view="progress"]');
  await shot('62-offline-progress');
  // the self-hosted font must work with the network off
  await page.goto(base + '#/today');
  await page.waitForSelector('.now');
  const font = await page.evaluate(async () => { await document.fonts.ready; return document.fonts.check('600 16px Inter'); });
  if (!font) throw new Error('Inter not available offline');
  await shot('63-offline-today');
  await ctx.setOffline(false);
});

await step('a year of data stays fast', async () => {
  await go('#/today', '.today');
  await page.evaluate(async () => { const D = await import('./js/data/demo.js'); await D.loadDemo(365); });
  const time = async (hash, sel) => page.evaluate(async ([h, s]) => {
    const t0 = performance.now();
    location.hash = h;
    await new Promise((res) => { const f = () => (document.querySelector(s) ? res() : requestAnimationFrame(f)); f(); });
    return Math.round(performance.now() - t0);
  }, [hash, sel]);
  for (const [h, s] of [['#/today', '[data-view="today"] .now'], ['#/progress', '[data-view="progress"] .story'], ['#/progress/trends', '[data-view="trends"] .chart-line'], ['#/progress/calendar', '.cal-grid'], ['#/habits', '[data-view="habits"] .row'], ['#/body/weight', '[data-view="weight"] .chart-line'], ['#/more/review/week', '[data-view="review-week"] .guide, [data-view="review-week"] .review-grid']]) {
    await time('#/plan', '[data-view="plan"]');
    timings.push([h, await time(h, s)]);
  }
  const counts = await page.evaluate(() => ({ logs: window.__lifeos.store.all('habitLogs').length, sets: window.__lifeos.store.all('workoutSets').length }));
  console.log(`     ${counts.logs} habit logs, ${counts.sets} sets · ${timings.map(([h, ms]) => `${h} ${ms}ms`).join(' · ')}`);
  const slow = timings.filter(([, ms]) => ms > 1500);
  if (slow.length) throw new Error('slow views: ' + slow.map((s) => s.join(' ')).join(', '));
});

await step('weekly review shows a real weight change', async () => {
  const change = await page.evaluate(async () => {
    const { weekFacts } = await import('./js/domain/review-data.js');
    const { startOfWeek, today, addDays } = await import('./js/domain/dates.js');
    return weekFacts(addDays(startOfWeek(today()), -7)).weight.change;
  });
  if (change == null || change === 0) throw new Error('weight change ' + change);
});

await step('erase everything → fresh start', async () => {
  await go('#/more/data', '[data-view="data"]');
  await page.locator('[data-action="reset"]').click();
  await page.locator('.sheet [data-action="yes"]').click();
  await page.locator('.sheet-wrap.is-open:has-text("Last check") [data-action="yes"]').click();
  await page.waitForFunction(() => window.__lifeos?.ready && window.__lifeos.store.all('habitLogs').length === 0, null, { timeout: 15000 });
  const n = await page.evaluate(() => ({ w: window.__lifeos.store.all('weightEntries').length, h: window.__lifeos.store.all('habits').length }));
  if (n.w !== 0 || n.h < 30) throw new Error(JSON.stringify(n));
});

// Desktop layout, light and dark, with sample data for realism.
const { chromium } = (await import('node:module')).createRequire(import.meta.url)('playwright');
await step('desktop layout', async () => {
  const b = await chromium.launch();
  for (const scheme of ['light', 'dark']) {
    const c = await b.newContext({ viewport: { width: 1360, height: 900 }, colorScheme: scheme });
    const p = await c.newPage();
    await p.goto(base + '#/more/data');
    await p.waitForFunction(() => window.__lifeos?.ready);
    await p.evaluate(async () => { const D = await import('./js/data/demo.js'); await D.loadDemo(60); });
    for (const [h, s, n] of [['#/today', '.today', 'today'], ['#/progress', '.story', 'progress'], ['#/progress/trends', '.chart-line', 'trends'], ['#/body', '[data-view="body"]', 'body'], ['#/habits', '[data-view="habits"]', 'habits']]) {
      await p.goto(base + h);
      await p.waitForSelector(s);
      await p.waitForTimeout(500);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 1) throw new Error(`${n} ${scheme}: ${over}px overflow`);
      await p.screenshot({ path: `${out}/7x-desktop-${n}-${scheme}.png` });
    }
    await c.close();
  }
  await b.close();
});

await finish();
