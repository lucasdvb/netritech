// Phase 6: Plan. Tomorrow and this week; a goal in three questions with a projection from real
// data; flat projects; books that move with "read 20 pages"; next week planned in the review.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';

async function at(clock, { scheme = 'light', device = devices['iPhone 14'], hash = '#/plan' } = {}) {
  const ctx = await browser.newContext({ ...device, colorScheme: scheme });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on('pageerror', (e) => errors.push(`${clock}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${clock}: console: ${m.text()}`); });
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + hash);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.waitForTimeout(400);
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const go = async (p, hash, sel) => { await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForSelector(sel); await p.waitForTimeout(250); };

await step('Plan home: tomorrow’s three are written here; this week shows seven days', async () => {
  const { ctx, p } = await at('2026-10-07T18:00:00');
  await p.waitForSelector('.plan-three-input');
  await p.locator('.plan-three-input[data-i="0"]').fill('Send the proposal');
  await p.locator('.plan-three-input[data-i="0"]').press('Tab');
  const t1 = await ev(p, () => window.__lifeos.store.all('tasks').find((x) => x.rank === 1 && x.date === '2026-10-08')?.title);
  if (t1 !== 'Send the proposal') throw new Error('tomorrow ' + t1);
  if ((await p.locator('.week-days .row').count()) !== 7) throw new Error('week rows');
  await p.screenshot({ path: `${OUT}/p6-plan.png`, fullPage: true });
  await ctx.close();
});

await step('a goal in three questions, then a projection from your weigh-ins', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/plan/goals' });
  await p.waitForSelector('[data-action="new"]');
  await p.locator('.page-head [data-action="new"], [data-action="new"]').first().click();
  await p.waitForSelector('.goal-new');
  const questions = [];
  questions.push(await p.textContent('.goal-new .ritual-q'));
  await p.locator('.goal-new input').fill('Get to 74 kg');
  await p.locator('[data-action="gn-next"]').click();
  questions.push(await p.textContent('.goal-new .ritual-q'));
  await p.locator('[data-action="gn-when"]', { hasText: 'In 3 months' }).click();
  await p.locator('[data-action="gn-next"]').click();
  questions.push(await p.textContent('.goal-new .ritual-q'));
  await p.locator('[data-action="gn-how"]', { hasText: 'Your weight' }).click();
  await p.locator('.goal-new [data-f="start"]').fill('76.2');
  await p.locator('.goal-new [data-f="target"]').fill('74');
  await p.screenshot({ path: `${OUT}/p6-goal-new.png` });
  await p.locator('[data-action="gn-save"]').click();
  if (questions.join(' | ') !== 'What outcome? | By when? | How will you know?') throw new Error('questions ' + questions);
  await p.waitForSelector('.goal-projection');
  const needs = await p.textContent('.goal-projection');
  if (!/3 times over a week/.test(needs)) throw new Error('needs: ' + needs);
  // two weeks of weigh-ins going down 0.05 kg a day
  await ev(p, () => {
    const { store } = window.__lifeos;
    for (let i = 14; i >= 0; i -= 2) { const d = new Date('2026-10-07T12:00:00'); d.setDate(d.getDate() - i); const iso = d.toISOString().slice(0, 10); store.put('weightEntries', { id: iso, date: iso, kg: 76.2 + i * 0.05 }); }
  });
  await p.waitForFunction(() => /On pace for 74/.test(document.querySelector('.goal-projection')?.textContent || ''));
  await p.screenshot({ path: `${OUT}/p6-goal.png`, fullPage: true });
  await ctx.close();
});

await step('every goal says where it’s heading or what it needs', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/plan/goals' });
  await p.waitForSelector('.goal-card');
  const subs = await p.locator('.goal-card .row-sub').allTextContents();
  if (!subs.length || subs.some((s) => s.trim().length < 8)) throw new Error('subs ' + subs);
  await ctx.close();
});

await step('projects: create, add tasks in a line, tick one, delete with Undo (tasks stay)', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/plan/projects' });
  await p.waitForSelector('[data-action="new"]');
  await p.locator('[data-action="new"]').first().click();
  await p.locator('.sheet [data-f="name"]').fill('Launch the website');
  await p.locator('.sheet [data-f="outcome"]').fill('Live with three case studies');
  await p.locator('.sheet [data-action="pf-save"]').click();
  await p.waitForSelector('.task-add-input');
  for (const title of ['Write the copy', 'Choose photos']) {
    await p.locator('.task-add-input').fill(title);
    await p.locator('.task-add-input').press('Enter');
    await p.waitForSelector(`.trow:has-text("${title}")`);
  }
  await p.locator('.trow:has-text("Choose photos") [data-action="task-check"]').click();
  await p.waitForFunction(() => document.querySelector('.goal-hero .muted')?.textContent.includes('1 of 2'));
  await p.screenshot({ path: `${OUT}/p6-project.png`, fullPage: true });
  // the task sheet knows its project
  await p.locator('.trow:has-text("Write the copy") .trow-main').click();
  await p.waitForSelector('.sheet [data-action="project"].is-active:has-text("Launch the website")');
  await p.keyboard.press('Escape');
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  await p.locator('[data-action="p-delete"]').click();
  await p.waitForFunction(() => location.hash === '#/plan/projects');
  const kept = await ev(p, () => window.__lifeos.store.all('tasks').filter((x) => ['Write the copy', 'Choose photos'].includes(x.title)).map((x) => x.projectId ?? null));
  if (kept.length !== 2 || kept.some(Boolean)) throw new Error('tasks after delete ' + kept);
  await p.locator('.toast-btn', { hasText: 'Undo' }).click();
  await p.waitForSelector('.row-title:has-text("Launch the website")');
  const back = await ev(p, () => window.__lifeos.store.all('tasks').filter((x) => x.projectId).length);
  if (back !== 2) throw new Error('Undo did not relink the tasks: ' + back);
  await ctx.close();
});

await step('books: add one, log pages on the pad, "read 20 pages" moves it, finish it', async () => {
  const { ctx, p } = await at('2026-10-07T21:00:00', { hash: '#/plan/books' });
  await p.waitForSelector('[data-action="new"]');
  await p.locator('[data-action="new"]').first().click();
  await p.locator('.sheet [data-f="title"]').fill('Atomic Habits');
  await p.locator('.sheet [data-f="pages"]').fill('320');
  await p.locator('.sheet [data-action="bf-save"]').click();
  await p.waitForSelector('[data-action="log-pages"]');
  await p.locator('[data-action="log-pages"]').click();
  await p.waitForSelector('.numpad');
  for (const k of ['2', '5']) await p.locator(`.numpad-key[data-k="${k}"]`).click();
  await p.locator('[data-action="np-save"]').click();
  await p.waitForSelector('.toast:has-text("page 25")');
  // from the capture line
  await p.locator('.tab--capture').click();
  await p.locator('.cap-input').fill('read 20 pages');
  await p.locator('.cap-input').press('Enter');
  await p.waitForFunction(() => window.__lifeos.store.all('books')[0]?.currentPage === 45);
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  await p.waitForFunction(() => document.querySelector('.goal-hero .card-title')?.textContent.includes('Page 45 of 320'));
  await p.screenshot({ path: `${OUT}/p6-book.png`, fullPage: true });
  await p.locator('[data-action="finish"]').click();
  const st = await ev(p, () => window.__lifeos.store.all('books')[0].status);
  if (st !== 'finished') throw new Error('status ' + st);
  await ctx.close();
});

await step('the weekly review plans next week; Plan shows it all week', async () => {
  const { ctx, p } = await at('2026-10-11T18:00:00', { hash: '#/reflect/review/week' });
  await p.waitForSelector('[data-key="next-week"] .plan-three-input');
  const items = ['Ship the website', 'Three workouts', 'Call the bank'];
  for (let i = 0; i < 3; i++) { await p.locator(`[data-key="next-week"] [data-i="${i}"]`).fill(items[i]); await p.locator(`[data-key="next-week"] [data-i="${i}"]`).press('Tab'); }
  await p.locator('[data-action="wk-monday"]').click();
  await p.waitForSelector('.toast:has-text("Monday starts with")');
  const mon = await ev(p, () => window.__lifeos.store.all('tasks').find((x) => x.date === '2026-10-12' && x.rank === 1)?.title);
  if (mon !== 'Ship the website') throw new Error('monday ' + mon);
  await p.clock.setFixedTime(new Date('2026-10-13T09:00:00'));
  await go(p, '#/plan', '.week-plan');
  const plan = await p.textContent('.week-plan');
  if (!items.every((x) => plan.includes(x))) throw new Error('plan ' + plan);
  await ctx.close();
});

await step('dark mode: Plan and a goal', async () => {
  const { ctx, p } = await at('2026-10-07T18:00:00', { scheme: 'dark' });
  await p.waitForSelector('.plan-three');
  await p.screenshot({ path: `${OUT}/p6-plan-dark.png`, fullPage: true });
  await go(p, '#/plan/goals/g-body', '.goal-projection');
  await p.screenshot({ path: `${OUT}/p6-goal-dark.png`, fullPage: true });
  await ctx.close();
});

await finish();
