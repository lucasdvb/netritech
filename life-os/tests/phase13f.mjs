// Phase 13f in the browser: next week's three with the obstacle to plan for, shown on Plan all
// week; and the yearly review in December, whose word then heads Plan.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';

const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { browser, step, finish, base, errors } = t;
const OUT = process.argv[3] || './test-shots';

async function at(clock, scheme = 'light') {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(`${base}#/today`);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
  await p.evaluate(async () => { await (await import('./js/data/demo.js')).loadDemo(60); window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }); await window.__lifeos.store.flush(); });
  await p.reload();
  await p.waitForFunction(() => window.__lifeos?.ready);
  return { ctx, p };
}
const to = async (p, hash, sel) => { await p.goto(`${base}${hash}`); await p.waitForFunction(() => window.__lifeos?.ready); if (sel) await p.waitForSelector(sel); };

await step('next week’s three with the obstacle and the plan for it; Plan shows them all week', async () => {
  const { ctx, p } = await at('2026-10-11T18:00:00'); // a Sunday
  await to(p, '#/reflect/review/week', '[data-action="rv-all"]');
  await p.locator('[data-action="rv-all"]').click();
  await p.waitForSelector('[data-key="next-week"] [data-i="0"]');
  const items = ['Ship the website', 'Three workouts', 'In bed by 22:30'];
  for (let i = 0; i < 3; i++) { await p.locator(`[data-key="next-week"] [data-i="${i}"]`).fill(items[i]); await p.locator(`[data-key="next-week"] [data-i="${i}"]`).press('Tab'); }
  await p.locator('[data-change="wk-ob"][data-f="obstacle"]').fill('a heavy week of client work');
  await p.locator('[data-change="wk-ob"][data-f="obstacle"]').press('Tab');
  await p.locator('[data-change="wk-ob"][data-f="ifThen"]').fill('Do the first one before email');
  await p.locator('[data-change="wk-ob"][data-f="ifThen"]').press('Tab');
  await p.locator('[data-key="next-week"]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/p13f-week-obstacle.png` });
  await p.clock.setFixedTime(new Date('2026-10-13T09:00:00'));
  await to(p, '#/plan', '.week-if');
  const line = await p.textContent('.week-if');
  if (!/If a heavy week of client work/.test(line) || !/Do the first one before email/.test(line)) throw new Error(line);
  await p.screenshot({ path: `${OUT}/p13f-plan-week.png` });
  await ctx.close();
});

await step('the yearly review in December: the year in numbers, three questions, one word that then heads Plan', async () => {
  const { ctx, p } = await at('2026-12-20T19:00:00');
  // Not offered in October...
  await to(p, '#/reflect', '[data-key="reviews"]');
  const row = p.locator('[data-key="reviews"] a', { hasText: 'Your 2026' });
  if (!(await row.count())) throw new Error('no yearly review on Reflect');
  await row.click();
  await p.waitForSelector('[data-key="numbers"] .facts');
  const nums = await p.textContent('[data-key="numbers"]');
  if (!/Days you showed up/.test(nums) || !/Workouts/.test(nums)) throw new Error(nums);
  await p.locator('[data-k="proud"]').fill('Training through the move');
  await p.locator('[data-k="next"]').fill('Getting strong and staying present');
  await p.locator('[data-input="yr-word"]').fill('Strength');
  await p.screenshot({ path: `${OUT}/p13f-year.png`, fullPage: true });
  await p.locator('[data-action="yr-done"]').click();
  await p.waitForSelector('.notice:has-text("Strength")');
  const r = await p.evaluate(() => window.__lifeos.store.get('yearlyReviews', '2026'));
  if (r.word !== 'Strength' || r.answers.proud !== 'Training through the move' || !r.completedAt) throw new Error(JSON.stringify(r));
  await to(p, '#/plan', '.theme-word');
  if (!/2027\s*Strength/.test(await p.textContent('.theme-word'))) throw new Error(await p.textContent('.theme-word'));
  await p.screenshot({ path: `${OUT}/p13f-plan-word.png` });
  // And in February it isn't offered any more, but the word stays.
  await p.clock.setFixedTime(new Date('2027-02-10T09:00:00'));
  await to(p, '#/reflect', '[data-key="reviews"]');
  if (await p.locator('[data-key="reviews"] a', { hasText: 'Your 2026' }).count()) throw new Error('still offered in February');
  await to(p, '#/plan', '.theme-word');
  await ctx.close();
});

await finish();
