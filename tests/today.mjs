// Phase 3: Today answers "what now?" at any hour. The Now card, routines as sequences with
// "Did it all", priorities and tasks in one card, Edit Today, the day picker, minimum and sick
// days, and a year of data rendering quickly.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';

// A Wednesday (a workday), at a chosen hour, on a fresh device.
async function at(clock, { scheme = 'light', device = devices['iPhone 14'] } = {}) {
  const ctx = await browser.newContext({ ...device, colorScheme: scheme });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on('pageerror', (e) => errors.push(`${clock}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${clock}: console: ${m.text()}`); });
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + '#/today');
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.waitForSelector('.today .now');
  await p.waitForTimeout(500);
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const nowText = (p) => p.textContent('.now-body');
const blocks = (p) => p.evaluate(() => [...document.querySelectorAll('.today-grid .tblock')].filter((b) => b.getClientRects().length).length);
const checkIn = (p) => ev(p, async () => { const { today } = await import('./js/domain/dates.js'); window.__lifeos.store.put('sleepEntries', { id: today(), date: today(), hours: 7.5, quality: 7, bedtime: '22:30', wake: '06:00' }); });

await step('07:00: the check-in first, the morning routine open, the next action above the fold', async () => {
  const { ctx, p } = await at('2026-10-07T07:00:00');
  if (!(await nowText(p)).includes('check-in')) throw new Error('now: ' + await nowText(p));
  await p.waitForSelector('.routine.is-open[data-key="r-r-morning"]');
  const n = await blocks(p);
  if (n > 6) throw new Error(`${n} blocks on first load`);
  const fold = await p.evaluate(() => document.querySelector('.now-actions').getBoundingClientRect().bottom <= innerHeight);
  if (!fold) throw new Error('the next action is below the fold');
  await p.screenshot({ path: `${OUT}/t3-0700.png`, fullPage: true });
  // after the check-in, the routine's next step takes over
  await checkIn(p);
  await p.waitForFunction(() => document.querySelector('.now-eyebrow')?.textContent.startsWith('Morning'));
  await ctx.close();
});

await step('a six-step routine finishes in one tap, and Undo takes it back', async () => {
  const { ctx, p } = await at('2026-10-07T07:10:00');
  const total = await p.evaluate(async () => { const R = await import('./js/domain/routines.js'); return R.progress(R.routine('r-morning')).total; });
  if (total < 6) throw new Error(`morning routine has ${total} steps`);
  const before = await p.textContent('.now-meta--btn');
  await p.locator('[data-key="r-r-morning"] [data-action="did-it-all"]').click();
  await p.waitForSelector('[data-key="r-r-morning"].is-complete');
  const meta = await p.textContent('[data-key="r-r-morning"] .routine-meta');
  if (!meta.includes(`${total}/${total}`) || !meta.includes('Done')) throw new Error('meta ' + meta);
  if ((await p.textContent('.now-meta--btn')) === before) throw new Error('score did not move');
  await p.screenshot({ path: `${OUT}/t3-routine-done.png`, fullPage: true });
  await p.locator('.toast-btn', { hasText: 'Undo' }).click();
  await p.waitForFunction(() => !document.querySelector('[data-key="r-r-morning"].is-complete'));
  await ctx.close();
});

await step('13:00: priorities lead during work; routines are one line each', async () => {
  const { ctx, p } = await at('2026-10-07T13:00:00');
  await checkIn(p);
  await p.locator('.top3-input[data-i="0"]').fill('Send the proposal');
  await p.locator('.top3-input[data-i="0"]').press('Tab');
  await p.waitForFunction(() => document.querySelector('.now-title')?.textContent === 'Send the proposal');
  if (await p.locator('.routine.is-open').count()) throw new Error('a routine is open outside its window');
  await p.locator('.now-go').click();
  await p.waitForFunction(() => document.querySelector('.top3-item.is-done'));
  await p.screenshot({ path: `${OUT}/t3-1300.png`, fullPage: true });
  await ctx.close();
});

await step('21:00 on a workday: close the work day, with the evening routine open', async () => {
  const { ctx, p } = await at('2026-10-07T21:00:00', { scheme: 'dark' });
  await checkIn(p);
  await p.waitForFunction(() => document.querySelector('.now-title')?.textContent === 'Close the work day');
  await p.waitForSelector('.routine.is-open[data-key="r-r-evening"]');
  await p.screenshot({ path: `${OUT}/t3-2100-dark.png`, fullPage: true });
  await ctx.close();
});

await step('00:30 still belongs to yesterday, and Today winds down', async () => {
  const { ctx, p } = await at('2026-10-08T00:30:00', { scheme: 'dark' });
  const d = await p.evaluate(async () => (await import('./js/domain/dates.js')).today());
  if (d !== '2026-10-07') throw new Error('today is ' + d);
  if (!(await p.textContent('.now-eyebrow')).includes('Done for today')) throw new Error('now: ' + await nowText(p));
  if (!(await p.textContent('.greet')).startsWith('Good night')) throw new Error('greeting');
  await p.screenshot({ path: `${OUT}/t3-0030-dark.png`, fullPage: true });
  await ctx.close();
});

await step('minimum and sick days change the plan and the Now card', async () => {
  const { ctx, p } = await at('2026-10-07T13:00:00');
  await checkIn(p);
  await p.locator('[data-action="mode"]').click();
  await p.locator('.sheet [data-mode="minimum"]').click();
  await p.waitForSelector('.minday');
  if (await p.locator('.routine').count()) throw new Error('routines on a minimum day');
  if (!(await p.textContent('.now-eyebrow')).includes('Minimum day')) throw new Error('now: ' + await nowText(p));
  await p.screenshot({ path: `${OUT}/t3-minimum.png`, fullPage: true });
  await p.locator('[data-action="mode"]').click();
  await p.locator('.sheet [data-mode="sick"]').click();
  await p.waitForSelector('.minday--sick');
  if (!(await nowText(p)).includes('Rest is the plan')) throw new Error('now: ' + await nowText(p));
  if (await p.locator('.prio').count()) throw new Error('priorities on a sick day');
  await ctx.close();
});

await step('Edit Today: hide a block, move one up, pin weight', async () => {
  const { ctx, p } = await at('2026-10-07T13:00:00');
  await p.locator('[data-action="edit-today"]').click();
  await p.waitForSelector('.sheet .edit-today');
  await p.locator('.sheet [data-action="et-show"][data-id="more"]').click();
  await p.locator('.sheet [data-action="et-move"][data-id="priorities"][data-delta="-1"]').click();
  await p.locator('.sheet [data-action="et-pin"][data-k="weight"]').click();
  await p.screenshot({ path: `${OUT}/t3-edit-today.png` });
  await p.keyboard.press('Escape');
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  if (await p.locator('.more-today').count()) throw new Error('Everything else still shown');
  if (!(await p.locator('.pin[data-key="pin-weight"]').count())) throw new Error('weight not pinned');
  if (await p.locator('.pin[data-key="pin-water"]').count()) throw new Error('a fourth pin was kept');
  const order = await p.evaluate(() => ['priorities', 'three'].map((id) => Number(getComputedStyle(document.querySelector(`[data-key="b-${id}"]`) || document.body).order)));
  if (!(order[0] < (order[1] || 99))) throw new Error('order ' + order);
  await ctx.close();
});

await step('the date opens a day picker; swiping the header changes the day', async () => {
  const { ctx, p } = await at('2026-10-07T13:00:00');
  await p.locator('.date-btn').click();
  await p.waitForSelector('.sheet .dpick-grid');
  if (!(await p.locator('.dpick-day[data-d="2026-10-08"][disabled]').count())) throw new Error('a future day is selectable');
  await p.locator('.dpick-day[data-d="2026-10-05"]').click();
  await p.waitForFunction(() => location.hash === '#/today/2026-10-05');
  await p.waitForFunction(() => document.querySelector('.greet-sub .link-btn') && !document.documentElement.dataset.nav);
  await p.evaluate(() => {
    const el = document.querySelector('.today-head');
    const touch = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 100 });
    el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(300)], changedTouches: [touch(300)], bubbles: true }));
    el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch(160)], bubbles: true }));
  });
  await p.waitForFunction(() => location.hash === '#/today/2026-10-06');
  await ctx.close();
});

await step('a routine can be edited from Today: add a plain step, then tick it', async () => {
  const { ctx, p } = await at('2026-10-07T07:00:00');
  await p.locator('[data-key="r-r-morning"] [data-action="edit-routine"]').click();
  await p.waitForSelector('.sheet .routine-edit');
  await p.locator('.sheet [data-change="add-label"]').fill('Make the bed');
  await p.locator('.sheet [data-change="add-label"]').press('Enter');
  await p.waitForSelector('.sheet .re-step input[value="Make the bed"]');
  await p.keyboard.press('Escape');
  await p.waitForSelector('.toast-btn:has-text("Undo")');
  const step = p.locator('[data-key="r-r-morning"] .rstep', { hasText: 'Make the bed' });
  await step.locator('.check').click();
  await p.waitForFunction(() => [...document.querySelectorAll('[data-key="r-r-morning"] .rstep.is-done')].some((li) => li.textContent.includes('Make the bed')));
  await ctx.close();
});

await step('a year of data: Today renders in under 70 ms', async () => {
  const { ctx, p } = await at('2026-10-07T13:00:00');
  await p.evaluate(async () => {
    const D = await import('./js/data/demo.js');
    await D.loadDemo(365);
    // three habits in focus, so Today also works out their runs over the whole year
    const { store } = window.__lifeos;
    for (const id of ['h-prayer', 'h-read', 'h-meditation']) store.update('habits', id, { state: 'focus', focusSince: '2025-10-01' });
  });
  await p.waitForTimeout(500);
  const ms = await p.evaluate(() => {
    const { app, store } = window.__lifeos;
    const c = app.current();
    const times = [];
    for (let i = 0; i < 5; i++) {
      // a real write (as a tap would make) clears every cached number Today depends on
      store.put('waterLogs', { id: `bench-${i}`, date: '2026-10-07', ml: 1 });
      const t0 = performance.now();
      String(c.view.render({ params: c.params, query: c.query, ui: c.ui, route: c.route, path: c.path }));
      times.push(performance.now() - t0);
    }
    return times.sort((a, b) => a - b)[2];
  });
  console.log(`     Today with a year of data: ${ms.toFixed(1)} ms`);
  if (ms > 70) throw new Error(`${ms.toFixed(0)} ms`);
  await ctx.close();
});

await step('desktop and tablet: two columns, nothing wider than the screen', async () => {
  for (const [w, h, tag] of [[1280, 860, 'desktop'], [820, 1180, 'tablet']]) {
    for (const scheme of ['light', 'dark']) {
      const { ctx, p } = await at('2026-10-07T07:30:00', { scheme, device: { viewport: { width: w, height: h } } });
      const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 1) throw new Error(`${tag} ${scheme}: ${over}px overflow`);
      await p.screenshot({ path: `${OUT}/t3-${tag}-${scheme}.png`, fullPage: true });
      await ctx.close();
    }
  }
});

await finish();
