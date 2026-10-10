// The simpler structure: Today · Plan · + · Review in the tab bar (Review holds what Progress and
// Reflect were, at their old addresses too), Plan in five groups, search that goes to any screen or
// setting, Settings with the rarely used under Advanced, and a workout from Today that opens in gym
// mode, with a bar back to it from anywhere while it runs.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';

const ctx = await browser.newContext({ ...devices['iPhone 14'] });
const p = await ctx.newPage();
p.setDefaultTimeout(10000);
p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
p.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
await p.clock.install({ time: new Date('2026-10-07T06:20:00') });
await p.goto(`${base}#/today`);
await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
await p.evaluate(async () => { window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }); await window.__lifeos.store.flush(); });
const go = async (hash, sel) => { await p.evaluate((h) => { location.hash = h; }, hash); if (sel) await p.waitForSelector(sel); };
const hash = () => p.evaluate(() => location.hash);

await step('the tab bar is Today · Plan · + · Review, and the old homes land on Review', async () => {
  const tabs = await p.locator('#tabbar .tab:visible').evaluateAll((els) => els.map((e) => e.dataset.key));
  if (tabs.join() !== 'tab-today,tab-plan,tab-capture,tab-review') throw new Error(tabs.join());
  for (const old of ['#/progress', '#/reflect']) {
    await go(old, '[data-view="review"]');
    if ((await hash()) !== '#/review') throw new Error(`${old} → ${await hash()}`);
  }
  // Review: today's page, this week, the reviews, Body and the areas, all on one screen.
  for (const sel of ['.write-area', '.story', '[data-key="reviews"]', '[data-key="body-link"]', '[data-key="areas"]']) {
    if (!(await p.locator(`[data-view="review"] ${sel}`).count())) throw new Error(`Review lacks ${sel}`);
  }
  // A page further down still belongs to the Review tab.
  await go('#/progress/trends', '[data-view="trends"]');
  if ((await p.locator('#tabbar [data-key="tab-review"][aria-current="page"]').count()) !== 1) throw new Error('Review not current on trends');
  if (!(await p.textContent('[data-view="trends"] .back-btn')).includes('Review')) throw new Error('back label');
  await p.screenshot({ path: `${OUT}/structure-review.png` });
});

await step('Plan is five groups, one list each', async () => {
  await go('#/plan', '[data-view="plan"]');
  await p.waitForSelector('[data-key="life"] .list');
  const titles = await p.locator('[data-view="plan"] .plan-group .block-title').allTextContents();
  if (titles.join('|') !== 'Habits & routines|Goals|Training|Tasks & notes|Life') throw new Error(titles.join('|'));
  for (const to of ['plan/playbook', 'plan/commitments', 'plan/training', 'plan/notes', 'plan/money', 'plan/dates', 'plan/moodboard']) {
    if (!(await p.locator(`[data-view="plan"] a[data-to="${to}"]`).count())) throw new Error(`no link to ${to}`);
  }
  await p.screenshot({ path: `${OUT}/structure-plan.png`, fullPage: true });
});

await step('search goes to any screen and any setting (Advanced opens when the setting is in it)', async () => {
  const search = async (q) => {
    await p.locator('[data-view] [data-action="open-search"]').first().click();
    await p.waitForSelector('.sheet input[type="search"]');
    await p.fill('.sheet input[type="search"]', q);
  };
  await search('spending');
  await p.locator('.sheet [data-action="go"][data-to="plan/money"]').click();
  await p.waitForSelector('[data-view="money"]');
  await go('#/plan', '[data-view="plan"]');
  await search('theme');
  await p.locator('.sheet [data-action="go"][data-to^="you/settings?find="]').first().click();
  await p.waitForFunction(() => document.querySelector('[data-view="settings"] .is-found')?.textContent.includes('Theme'));
  // Advanced starts folded; a search for something in it opens it.
  await go('#/plan', '[data-view="plan"]');
  if (await p.locator('details.set-advanced[open]').count()) throw new Error('Advanced open on its own');
  await search('badge');
  await p.locator('.sheet [data-action="go"][data-to*="Badge"]').click();
  await p.waitForSelector('details.set-advanced[open] .is-found');
});

await step('a workout from Today opens in gym mode, and a bar leads back to it from anywhere', async () => {
  await go('#/today', '.dstrip');
  const start = p.locator('.ds-row[data-key="ds-b-mobility"] [data-action="habit"]');
  await start.click();
  await p.waitForFunction(() => /^#\/workout\/[^/]+\/gym$/.test(location.hash));
  await go('#/plan', '[data-view="plan"]');
  await p.waitForSelector('.wbar');
  if (!(await p.textContent('.wbar')).includes('Mobility')) throw new Error(await p.textContent('.wbar'));
  await p.screenshot({ path: `${OUT}/structure-wbar.png` });
  await p.locator('.wbar a').click();
  await p.waitForFunction(() => /\/gym$/.test(location.hash));
  await p.waitForSelector('[data-view="gym"]', { state: 'attached' });
  await p.waitForSelector('.wbar', { state: 'detached' });
});

await ctx.close();
await finish();
