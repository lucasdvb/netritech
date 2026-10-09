// Progress, life modules, goals, reviews, search, settings, backup/restore.
import { readFileSync } from 'node:fs';
import { setup } from './helpers.mjs';
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { page, step, shot, go, a11y, finish } = t;

await step('load sample data', async () => {
  await go('#/more/data', '[data-view="data"]');
  await page.locator('[data-action="demo-on"]').click();
  await page.waitForSelector('[data-action="demo-off"]', { timeout: 15000 });
  await go('#/you', '.sheet .you .notice--warn');
  await shot('40-you');
  await page.keyboard.press('Escape');
});

await step('progress trends', async () => {
  await go('#/progress', '[data-view="progress"] .story');
  await shot('41-progress');
  await a11y('progress');
  await go('#/progress/trends', '[data-view="trends"] .chart-line');
  await a11y('trends');
});

await step('calendar → day → edit', async () => {
  await go('#/progress/calendar', '.cal-grid');
  await shot('42-calendar');
  const days = page.locator('.cal-day:not([disabled])');
  await days.nth(Math.max(0, (await days.count()) - 3)).click();
  await page.waitForSelector('.sheet .facts');
  await page.locator('.sheet [data-action="open-day"]').click();
  await page.waitForSelector('.greet-sub .link-btn');
});

await step('insights', async () => {
  await go('#/progress/insights', '[data-view="insights"]');
  await shot('43-insights');
});

await step('today with history', async () => {
  await go('#/today', '.today');
  await shot('44-today-history');
});

await step('journal entry autosaves', async () => {
  await go('#/more/journal', '[data-view="journal"]');
  await page.locator('[data-action="new"][data-kind="morning"]').click();
  await page.waitForSelector('[data-view="journal-entry"] textarea');
  await page.locator('textarea[data-i="0"]').fill('Finish the client proposal');
  await page.waitForTimeout(600);
  await shot('45-journal-entry');
  await page.locator('.back-btn').click();
  await page.waitForSelector('.journal-row');
  const txt = await page.textContent('.list');
  if (!txt.includes('Finish the client proposal')) throw new Error('entry not saved');
});

await step('mind / faith / relationships / work', async () => {
  await go('#/more/mind', '[data-view="mind"]');
  await page.locator('[data-action="log"][data-kind="reading"]').click();
  await page.fill('.sheet input[data-field="book"]', 'Deep Work');
  await page.locator('.sheet [data-action="save"]').click();
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  await shot('46-mind');
  await go('#/more/faith', '[data-view="faith"] .practice');
  await page.locator('[data-action="mark"][data-id="h-gratitude"]').click();
  await shot('47-faith');
  await go('#/more/relationships', '[data-view="relationships"]');
  await page.locator('[data-action="log"][data-person="son"]').click();
  await page.locator('.sheet [data-action="save"]').click();
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  await shot('48-relationships');
  await go('#/more/work', '[data-view="work"]');
  await shot('49-work');
});

await step('goal milestone', async () => {
  await go('#/more/goals', '.goal-list');
  await shot('50-goals');
  await page.locator('a[href="#/plan/goals/g-strength"]').click();
  await page.waitForSelector('.milestone');
  await page.locator('.milestone .check').first().click();
  await page.waitForSelector('.milestone.is-done');
});

await step('weekly + monthly review', async () => {
  await go('#/more/review/week', '[data-view="review-week"] .guide');
  await page.locator('[data-action="rv-all"]').click();
  await page.locator('textarea[data-k="one"]').fill('Walk after lunch every workday');
  await page.locator('[data-action="biz"][data-k="Revenue"]').click();
  await page.locator('[data-action="complete"]').click();
  await page.waitForSelector('.notice');
  const toastText = await page.textContent('#toasts');
  if (!toastText.includes('Walk after lunch')) throw new Error('one change lost: ' + toastText);
  const kept = await page.inputValue('textarea[data-k="one"]');
  if (kept !== 'Walk after lunch every workday') throw new Error('textarea cleared: ' + kept);
  await shot('51-review-week');
  await go('#/more/review/month', '[data-view="review-month"] .report-grid');
  await page.locator('[data-action="rv-all"]').click();
  await page.locator('textarea[data-k="focus"]').fill('Sleep by 22:00');
  await page.locator('[data-action="complete"]').click();
  await page.waitForSelector('.notice');
  await shot('52-review-month');
});

await step('search', async () => {
  await go('#/plan', '[data-view="plan"]');
  await page.locator('[data-view="plan"] [data-action="open-search"]').click();
  await page.fill('.sheet input[type="search"]', 'atomic');
  await page.waitForSelector('.sheet .row');
  await shot('53-search');
  await page.keyboard.press('Escape');
});

await step('dark mode', async () => {
  await go('#/more/settings', '[data-view="settings"]');
  await page.locator('[data-action="theme"][data-value="dark"]').click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await go('#/today', '.today');
  await shot('54-today-dark');
  await go('#/progress', '.story');
  await shot('55-progress-dark');
  await go('#/more/settings', '[data-view="settings"]');
  await page.locator('[data-action="theme"][data-value="system"]').click();
});

await step('backup + merge restore', async () => {
  await go('#/more/data', '[data-view="data"]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-action="backup"]').click()]);
  const path = await dl.path();
  const json = JSON.parse(readFileSync(path, 'utf8'));
  if (json.app !== 'life-os' || !json.data.habits?.length || !json.data.weightEntries?.length) throw new Error('backup incomplete');
  await page.locator('input[data-change="restore-file"]').setInputFiles(path);
  await page.waitForSelector('.sheet [data-action="merge"]');
  await page.locator('.sheet [data-action="merge"]').click();
  await page.waitForSelector('[data-view="today"]');
});

await step('csv export', async () => {
  await go('#/more/data', '[data-view="data"]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-action="csv"][data-k="weight"]').click()]);
  const csv = readFileSync(await dl.path(), 'utf8').replace(/^\ufeff/, ''); // the byte-order mark is for spreadsheets
  if (!csv.startsWith('date,kg,note')) throw new Error('csv header ' + csv.slice(0, 30));
});

await step('remove sample data', async () => {
  await go('#/more/data', '[data-view="data"]');
  await page.locator('[data-action="demo-off"]').click();
  await page.waitForSelector('[data-action="demo-on"]');
  const left = await page.evaluate(() => window.__lifeos.store.all('weightEntries').filter((w) => w.demo).length);
  if (left) throw new Error(`${left} sample entries left`);
});

await finish();
