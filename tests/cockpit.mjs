// Today as the cockpit: the quick row learns what you log at each hour (and water is one tap, a
// weigh-in two), Your day shows the plan with a line at now and the block you're in open, sections
// you haven't used in two weeks fold, after midnight it says whose day it still is, logging is one
// field (no microphone button: the keyboard has one), and every change with an Undo can be undone later from Recent changes.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';
const DAY = 86400000;

/** A fresh device at a chosen time. `usage` seeds the usage meter. */
async function at(clock, { scheme = 'light', usage = null } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on('pageerror', (e) => errors.push(`${clock}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${clock}: console: ${m.text()}`); });
  await p.addInitScript((u) => { if (u) localStorage.setItem('lifeos.usage', JSON.stringify(u)); }, usage);
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + '#/today');
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.waitForSelector('.today .now');
  await p.evaluate(() => window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }));
  await p.waitForSelector('.dstrip');
  return { ctx, p };
}
const hourCounts = (h, n) => Array.from({ length: 24 }, (_, i) => (i === h ? n : 0));

await step('the quick row: learned from what you log at this hour; water in one tap, a weigh-in in two', async () => {
  const now = new Date('2026-10-07T13:00:00').getTime();
  const usage = { v: 1, since: now - 40 * DAY, k: { 'q:reading': { n: 9, last: now - DAY, h: hourCounts(13, 9) }, 'q:money': { n: 4, last: now - DAY, h: hourCounts(13, 4) }, 'q:weight': { n: 3, last: now - DAY, h: hourCounts(13, 3) } } };
  const { ctx, p } = await at('2026-10-07T13:00:00', { usage });
  const keys = await p.locator('.pins .pin').evaluateAll((els) => els.map((e) => e.dataset.q));
  if (keys.join() !== 'reading,money,weight,water') throw new Error(`learned row: ${keys}`);
  // Water: one tap.
  const before = await p.evaluate(async () => (await import('./js/domain/metrics-core.js')).waterMl((await import('./js/domain/dates.js')).today()));
  await p.locator('.pin[data-q="water"]').click();
  await p.waitForFunction((b) => import('./js/domain/metrics-core.js').then(async (M) => M.waterMl((await import('./js/domain/dates.js')).today()) === b + 500), before);
  // A weigh-in: tap Weight, type it, Save.
  await p.locator('.pin[data-q="weight"]').click();
  await p.waitForSelector('.sheet .numpad');
  for (const k of ['8', '0', '.', '4']) await p.locator(`.sheet [data-action="np-key"][data-k="${k}"]`).click();
  await p.locator('.sheet [data-action="np-save"]').click();
  await p.waitForFunction(() => import('./js/domain/metrics-core.js').then(async (M) => M.weight((await import('./js/domain/dates.js')).today()) === 80.4));
  // Taps count toward what it learns.
  const n = await p.evaluate(() => JSON.parse(localStorage.getItem('lifeos.usage') || '{}').k?.['q:water']?.n);
  if (n !== 1) throw new Error(`water taps counted: ${n}`);
  await p.screenshot({ path: `${OUT}/cockpit-1300.png` });
  await ctx.close();
});

await step('Your day: the plan in order, a line at now, the block you are in open with its action', async () => {
  const { ctx, p } = await at('2026-10-07T06:07:00');
  const ids = await p.locator('.ds-list .ds-row').evaluateAll((els) => els.map((e) => e.dataset.key));
  if (ids[0] !== 'ds-b-wake' || !ids.includes('ds-b-bed')) throw new Error(ids.join());
  if ((await p.locator('.ds-row.is-current').getAttribute('data-key')) !== 'ds-b-prayer') throw new Error('prayer should be current at 06:07');
  if (!(await p.locator('.ds-now').count())) throw new Error('no line at now');
  // Done from the strip: it's the habit itself that's done.
  await p.locator('.ds-row.is-current [data-action="toggle"]').click();
  await p.waitForFunction(() => import('./js/domain/habits.js').then(async (H) => H.isDone(H.habit('h-prayer'), (await import('./js/domain/dates.js')).today())));
  await p.waitForSelector('.ds-row[data-key="ds-b-prayer"].is-done');
  // Edit goes to the plan.
  await p.locator('.dstrip [data-action="nav"][data-to="plan/playbook"]').click();
  await p.waitForSelector('.plan-day--edit');
  await ctx.close();
});

await step('sections you have not used in two weeks fold to one line, and open with a tap', async () => {
  const now = new Date('2026-10-07T13:00:00').getTime();
  const usage = { v: 1, since: now - 30 * DAY, k: { 'b:priorities': { n: 5, last: now - DAY, h: hourCounts(9, 5) } } };
  const { ctx, p } = await at('2026-10-07T13:00:00', { usage });
  if (await p.locator('.tblock[data-key="b-priorities"] .tfold').count()) throw new Error('a section in use folded');
  const folded = await p.locator('.tfold').count();
  if (!folded) throw new Error('nothing folded');
  if (await p.locator('.tblock[data-key="b-pinned"] .tfold, .tblock[data-key="b-day"] .tfold').count()) throw new Error('the quick row or your day folded');
  const first = p.locator('.tfold').first();
  const id = await first.getAttribute('data-id');
  await first.click();
  await p.waitForFunction((x) => !document.querySelector(`.tblock[data-key="b-${x}"] .tfold`), id);
  // Turned off in Edit Today, nothing folds.
  await p.evaluate(() => window.__lifeos.store.setSettings({ foldUnused: false }));
  await p.waitForFunction(() => !document.querySelector('.tfold'));
  await ctx.close();
});

await step('after midnight, before the day ends, Today says whose day it still is', async () => {
  const { ctx, p } = await at('2026-10-08T00:40:00');
  await p.evaluate(() => window.__lifeos.store.setProfile({ dayEndsAt: '03:00' }));
  await p.waitForSelector('.still-day');
  const txt = await p.textContent('.still-day');
  if (!txt.includes('Still Wednesday') || !txt.includes('03:00')) throw new Error(txt);
  await ctx.close();
});

await step('log anything: one field on Today (no microphone; the keyboard has one), typed and saved', async () => {
  const { ctx, p } = await at('2026-10-07T13:00:00');
  if (await p.locator('.logbar-mic, .cap-mic').count()) throw new Error('a microphone button is still on Today');
  await p.locator('.logbar-field').click();
  await p.locator('.sheet .cap-input').fill('water 500');
  if (await p.locator('.sheet .cap-mic').count()) throw new Error('a microphone button is still in the capture sheet');
  await p.waitForSelector('.sheet .cap-live .cap-prev, .sheet .cap-live [data-action="save"], .sheet .cap-live button');
  await p.screenshot({ path: `${OUT}/cockpit-log.png` });
  const before = await p.evaluate(async () => (await import('./js/domain/metrics-core.js')).waterMl((await import('./js/domain/dates.js')).today()));
  await p.locator('.sheet .cap-input').press('Enter');
  await p.waitForFunction((b) => import('./js/domain/metrics-core.js').then(async (M) => M.waterMl((await import('./js/domain/dates.js')).today()) === b + 500), before);
  await ctx.close();
});

await step('Recent changes: a change with an Undo can still be undone after its message has gone', async () => {
  const { ctx, p } = await at('2026-10-07T07:10:00');
  const water = () => p.evaluate(async () => (await import('./js/domain/metrics-core.js')).waterMl((await import('./js/domain/dates.js')).today()));
  // "Did it all" on the morning routine offers Undo.
  await p.waitForSelector('[data-action="did-it-all"]');
  await p.locator('[data-action="did-it-all"]').first().click();
  await p.waitForSelector('.toast');
  await p.evaluate(() => document.querySelectorAll('.toast').forEach((t) => t.remove()));
  const doneBefore = await p.evaluate(async () => (await import('./js/domain/routines.js')).progress((await import('./js/domain/routines.js')).routine('r-morning')).complete);
  if (!doneBefore) throw new Error('routine not done');
  await p.locator('.you-btn').click();
  await p.locator('.sheet [data-action="recent"]').click();
  await p.waitForSelector('.sheet .recent-row');
  await p.locator('.sheet [data-action="rc-undo"]').first().click();
  await p.waitForFunction(() => import('./js/domain/routines.js').then((R) => !R.progress(R.routine('r-morning')).complete));
  await p.waitForSelector('.sheet .recent-row.is-used');
  if (typeof (await water()) !== 'number') throw new Error('metrics unreadable');
  // Your usage opens, and says what it counts.
  await p.keyboard.press('Escape');
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  await p.locator('.you-btn').click();
  await p.locator('.sheet [data-action="usage"]').click();
  await p.waitForSelector('.sheet >> text=Most opened');
  await ctx.close();
});

await step('dark mode', async () => {
  const { ctx, p } = await at('2026-10-07T06:07:00', { scheme: 'dark' });
  await p.screenshot({ path: `${OUT}/cockpit-dark.png`, fullPage: true });
  await ctx.close();
});

await finish();
