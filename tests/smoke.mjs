// End-to-end smoke test in an iPhone-sized Chromium.
// NODE_PATH=$(npm root -g) node tests/smoke.mjs [baseUrl] [outDir]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
const { chromium, devices } = createRequire(import.meta.url)('playwright');

const base = process.argv[2] || 'http://localhost:4173/';
const out = process.argv[3] || './test-shots';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: process.env.SCHEME || 'light' });
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

const step = async (name, fn) => {
  try { await fn(); console.log(`ok   ${name}`); }
  catch (e) { await page.screenshot({ path: `${out}/fail-${name.replace(/\W+/g, '-')}.png` }).catch(() => {}); console.log(`FAIL ${name}: ${e.message.split('\n').slice(0, 30).join(' | ')}`); errors.push(`${name}: ${e.message.split('\n')[0]}`); }
};
const shot = async (n) => {
  await page.waitForTimeout(450);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  if (over > 1) errors.push(`${n}: page is ${over}px wider than the screen`);
  return page.screenshot({ path: `${out}/${n}.png`, fullPage: true }); };

await step('boot', async () => {
  await page.goto(base);
  await page.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await page.waitForSelector('.today');
  await shot('01-today');
});

await step('toggle prayer', async () => {
  const sec = page.locator('[data-key="sec-morning"]');
  if (!(await sec.getAttribute('class')).includes('is-open')) await sec.locator('.hsec-head').click();
  await page.locator('[data-key="h-prayer"] .check').click();
  await page.waitForSelector('[data-key="h-prayer"].is-done');
});

await step('add water', async () => {
  const sec = page.locator('[data-key="sec-body"]');
  if (!(await sec.getAttribute('class')).includes('is-open')) await sec.locator('.hsec-head').click();
  await page.locator('[data-key="tile-h-water"] .tile-add').click();
  await page.waitForFunction(() => document.querySelector('[data-key="tile-h-water"] .tile-val')?.textContent.startsWith('0.5'));
});

await step('persist after reload', async () => {
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForFunction(() => window.__lifeos?.ready);
  await page.waitForSelector('.today');
  const sec = page.locator('[data-key="sec-morning"]');
  if (!(await sec.getAttribute('class')).includes('is-open')) await sec.locator('.hsec-head').click();
  await page.waitForSelector('[data-key="h-prayer"].is-done', { timeout: 3000 });
  await shot('02-today-after-reload');
});

await step('check-in sheet', async () => {
  await page.evaluate(() => import('./js/views/sheets.js').then((m) => m.openCheckin()));
  await page.waitForSelector('.sheet-wrap.is-open');
  await page.locator('.sheet [data-field="energy"][data-value="7"]').click();
  await page.locator('.sheet [data-field="stress"][data-value="3"]').click();
  await page.locator('.sheet [data-field="mood"][data-value="8"]').click();
  await shot('03-checkin');
  await page.locator('.sheet [data-action="save"]').click();
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
});

await step('tabs render', async () => {
  for (const t of ['progress', 'habits', 'body', 'more', 'today']) {
    await page.locator(`a.tab[href="#/${t}"]`).click();
    await page.waitForSelector(`[data-view="${t}"]`);
  }
});

await step('habits list + detail', async () => {
  await page.goto(base + '#/habits');
  await page.waitForSelector('[data-view="habits"] .list');
  await shot('10-habits');
  await page.locator('a[href="#/habits/h-prayer"]').click();
  await page.waitForSelector('[data-view="habit"] .heat');
  await shot('11-habit-detail');
});

await step('create habit', async () => {
  await page.goto(base + '#/habits/new');
  await page.waitForSelector('.editor');
  await page.fill('.editor input[data-f="name"]', 'Evening walk');
  await page.selectOption('select[data-change="kind"]', 'perWeek');
  await page.locator('[data-action="count"][data-delta="1"]').click();
  await page.locator('.switch[data-f="streaks"]').click();
  await shot('12-editor');
  await page.locator('.editor button[type="submit"]').click();
  await page.waitForSelector('[data-view="habit"]');
  const title = await page.textContent('.page-title');
  if (title.trim() !== 'Evening walk') throw new Error('title ' + title);
  const sched = await page.textContent('.facts');
  if (!sched.includes('4× a week')) throw new Error('schedule not saved: ' + sched);
});

await step('edit + archive + restore', async () => {
  await page.locator('[data-action="edit"]').click();
  await page.waitForSelector('.editor');
  await page.fill('.editor input[data-f="name"]', 'Evening walk outside');
  await page.locator('.editor button[type="submit"]').click();
  await page.waitForFunction(() => document.querySelector('.page-title')?.textContent.includes('outside'));
  await page.locator('[data-action="archive"]').click();
  await page.waitForSelector('.notice');
  await page.locator('.notice [data-action="restore"]').click();
  await page.waitForSelector('.notice', { state: 'detached' });
});

await step('past day + minimum mode', async () => {
  await page.goto(base + '#/today');
  await page.waitForSelector('.today');
  await page.locator('[data-action="day"][data-delta="-1"]').click();
  await page.waitForSelector('.greet-sub .link-btn');
  await page.locator('[data-action="go-today"]').click();
  await page.waitForSelector('.today-head .tnum');
  await page.locator('[data-action="mode"]').click();
  await page.locator('.sheet [data-mode="minimum"]').click();
  await page.waitForSelector('.minday');
  await shot('13-minimum-day');
  const n = await page.locator('.minday .hrow, .minday .tile').count();
  if (n !== 7) throw new Error('minimum day shows ' + n + ' items');
  await page.locator('.minday [data-action="set-mode"]').click();
  await page.waitForSelector('.minday', { state: 'detached' });
});

await step('a11y: checkbox labels', async () => {
  const unlabeled = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => !b.textContent.trim() && !b.getAttribute('aria-label')).map((b) => b.outerHTML.slice(0, 120)));
  if (unlabeled.length) throw new Error('unlabeled buttons: ' + unlabeled.slice(0, 3).join(' | '));
});

console.log(errors.length ? `\nERRORS (${errors.length}):\n${errors.join('\n')}` : '\nno errors');
await browser.close();
process.exit(errors.length ? 1 : 0);
