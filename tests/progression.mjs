// Phase 9: the progression layer. A mastery plate engraved from real logs; a record that only
// counts after three earlier data points; a season started in three answers with its halfway
// check-in; the ghost; a pledge sealed with a real hold and ended with a smaller one offered; a
// reward unlocked by real workouts; this week's side quest. Visible, but quiet.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';

async function at(clock, { scheme = 'light', hash = '#/today' } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme });
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
const go = async (p, hash, sel) => { await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForSelector(sel); await p.waitForTimeout(300); };
async function holdTouch(p, sel, ms) {
  const box = await p.locator(sel).boundingBox();
  const cdp = await p.context().newCDPSession(p);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await p.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}
const days = (end, n) => Array.from({ length: n }, (_, i) => { const d = new Date(`${end}T12:00:00`); d.setDate(d.getDate() - (n - i)); return d.toISOString().slice(0, 10); });

await step('mastery: the tenth time engraves Practised with today’s date, once', async () => {
  const { ctx, p } = await at('2026-10-07T20:00:00');
  await ev(p, ({ list }) => { const { store } = window.__lifeos; store.setProfile({ trackingStart: '2026-09-01' }); for (const d of list) store.put('habitLogs', { id: `h-prayer:${d}`, habitId: 'h-prayer', date: d, value: 1 }); }, { list: days('2026-10-07', 9) });
  await p.waitForTimeout(2500); // the nine days before: engraved quietly
  await ev(p, () => window.__lifeos.store.put('habitLogs', { id: 'h-prayer:2026-10-07', habitId: 'h-prayer', date: '2026-10-07', value: 1 }));
  await p.waitForSelector('.moment-plate:has-text("Prayer · Practised"):has-text("10 times")', { timeout: 10000 });
  const plates = await ev(p, () => window.__lifeos.store.all('levelEvents').filter((e) => e.habitId === 'h-prayer').map((e) => `${e.level}:${e.date}`));
  if (plates.join() !== `started:${days('2026-10-07', 9)[0]},practised:2026-10-07`) throw new Error('plates ' + plates);
  await go(p, '#/plan/habits/h-prayer', '[data-key="mastery"]');
  if (!/Practised/.test(await p.textContent('[data-key="mastery"]'))) throw new Error('habit page plate');
  await go(p, '#/progress/records', '[data-key="pl-h-prayer"]');
  await p.screenshot({ path: `${OUT}/p9-records.png`, fullPage: true });
  await ctx.close();
});

await step('records: nothing for the first three entries, then a new best is marked once', async () => {
  const { ctx, p } = await at('2026-10-07T20:00:00', { hash: '#/progress/records' });
  await ev(p, () => { const { store } = window.__lifeos; [['2026-10-03', 6000], ['2026-10-04', 7000], ['2026-10-05', 8000]].forEach(([d, s]) => store.put('stepLogs', { id: d, date: d, steps: s })); });
  await p.waitForTimeout(2500);
  if (await p.locator('.record').count()) throw new Error('a record from the first three entries');
  await ev(p, () => window.__lifeos.store.put('stepLogs', { id: '2026-10-07', date: '2026-10-07', steps: 11200 }));
  await p.waitForSelector('.moment-plate:has-text("New record"):has-text("Most steps in a day: 11,200")', { timeout: 10000 });
  await p.waitForSelector('.record:has-text("11,200")');
  if (!/before: 8,000/.test(await p.textContent('.record'))) throw new Error('previous best');
  await ctx.close();
});

await step('a season in three answers; Progress shows it; the halfway check-in in week 3', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/progress' });
  await p.locator('a[data-to="progress/season"]').click();
  await p.waitForSelector('[data-action="sn-new"]');
  await p.locator('[data-action="sn-new"]').click();
  await p.waitForSelector('.sheet .season-new');
  await p.locator('.sheet [data-input="sn-name"]').fill('Foundations');
  await p.locator('.sheet [data-input="sn-intent"]').fill('Strong mornings, calm evenings');
  const picked = await p.locator('.sheet .chip.is-active').count();
  if (picked < 1 || picked > 3) throw new Error('picked ' + picked);
  await p.screenshot({ path: `${OUT}/p9-season-new.png` });
  await p.locator('.sheet [data-action="sn-go"]').click();
  await p.waitForSelector('[data-key="season-now"]');
  const s = await ev(p, () => window.__lifeos.store.all('seasons')[0]);
  if (s.start !== '2026-10-05' || s.end !== '2026-11-15' || s.name !== 'Foundations') throw new Error('season ' + JSON.stringify(s));
  const focus = await ev(p, async (ids) => { const H = await import('./js/domain/habits.js'); return ids.every((id) => H.stateOf(H.habit(id)) === 'focus'); }, s.habitIds);
  if (!focus) throw new Error('season habits not in focus');
  await go(p, '#/progress', '.season-line');
  if (!/Foundations · week 1 of 6/.test(await p.textContent('.season-line'))) throw new Error('season line');
  await p.clock.setFixedTime(new Date('2026-10-21T09:00:00'));
  await go(p, '#/progress/season', '[data-key="checkin"]');
  await p.waitForTimeout(700); // the page transition, then the screenshot
  await p.screenshot({ path: `${OUT}/p9-season.png`, fullPage: true });
  await p.locator('[data-action="sn-keep"]').click();
  await p.waitForFunction(() => window.__lifeos.store.all('seasons')[0].checkIn?.keep === true);
  await ctx.close();
});

await step('the ghost: a quiet marker for your past self, chosen in Settings', async () => {
  const { ctx, p } = await at('2026-10-07T20:00:00', { hash: '#/you/settings' });
  await ev(p, async () => { const D = await import('./js/data/demo.js'); await D.loadDemo(42); });
  await go(p, '#/you/settings', '[data-key="ghost"]');
  await p.locator('[data-key="ghost"] [data-value="best"]').click();
  await p.waitForFunction(() => window.__lifeos.store.settings().ghost === 'best');
  await go(p, '#/progress', '.ghost-mark');
  if (!/Your best week \(week of/.test(await p.textContent('.story-ghost'))) throw new Error('ghost label');
  if (!/your best week/.test(await p.textContent('.story-sentence'))) throw new Error('sentence');
  await p.screenshot({ path: `${OUT}/p9-progress.png` });
  await ctx.close();
});

await step('a pledge sealed with a hold; ending early offers a smaller one', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/plan' });
  await p.locator('[data-key="goals"] a[data-to="plan/commitments"]').click();
  await p.waitForSelector('[data-view="commitments"] [data-action="pg-new"]');
  await p.locator('[data-view="commitments"] .page-head [data-action="pg-new"]').click();
  await p.waitForSelector('.sheet .pledge-new');
  await p.locator('.sheet [data-change="pg-habit"]').selectOption('h-prayer');
  await p.locator('.sheet [data-action="pg-days"][data-value="14"]').click();
  await p.locator('.sheet [data-input="pg-stake"]').fill('Coffee for the team');
  await holdTouch(p, '.sheet .hold-btn', 300);
  if (await ev(p, () => window.__lifeos.store.all('commitments').length)) throw new Error('a short press sealed it');
  await holdTouch(p, '.sheet .hold-btn', 1500);
  await p.waitForSelector('.toast:has-text("Sealed")');
  await p.waitForSelector('.pledge:has-text("Day 1 of 14")');
  await p.screenshot({ path: `${OUT}/p9-pledge.png`, fullPage: true });
  await p.locator('.pledge [data-action="pg-end"]').click();
  await p.waitForSelector('.sheet [data-input="pe-why"]');
  await p.locator('.sheet [data-input="pe-why"]').fill('Travelling');
  await p.locator('.sheet [data-action="pe-smaller"]').click();
  await p.waitForSelector('.sheet .pledge-new .seg-btn[aria-selected="true"]:has-text("7 days")');
  const ended = await ev(p, () => window.__lifeos.store.all('commitments')[0]);
  if (ended.status !== 'ended' || ended.reason !== 'Travelling') throw new Error('ended ' + JSON.stringify(ended));
  await ctx.close();
});

await step('a reward unlocks only from real workouts, once; then it’s enjoyed', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/plan/rewards' });
  await p.locator('.page-head [data-action="rw-new"]').click();
  await p.waitForSelector('.sheet .reward-new');
  await p.locator('.sheet [data-input="rw-title"]').fill('New running shoes');
  await p.locator('.sheet [data-input="rw-target"]').fill('2');
  await p.locator('.sheet [data-action="rw-save"]').click();
  await p.waitForSelector('.reward:has-text("0 of 2")');
  await ev(p, () => { const { store } = window.__lifeos; store.put('workouts', { id: 'w1', date: '2026-10-07', status: 'done', title: 'Upper' }); store.put('workouts', { id: 'w2', date: '2026-10-07', status: 'active', title: 'Lower' }); });
  await p.waitForSelector('.reward:has-text("1 of 2")');
  await ev(p, () => window.__lifeos.store.put('workouts', { id: 'w2', date: '2026-10-07', status: 'done', title: 'Lower' }));
  await p.waitForSelector('.moment-plate:has-text("Unlocked: New running shoes")', { timeout: 10000 });
  await p.locator('[data-action="rw-claim"]').click();
  await p.waitForSelector('[data-key="claimed"] .reward');
  await ctx.close();
});

await step('this week’s side quest: one, optional, and it becomes a task', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/plan' });
  await p.waitForSelector('[data-key="quest"] .quest-title');
  const title = (await p.textContent('[data-key="quest"] .quest-title')).trim();
  await p.locator('[data-action="quest-yes"]').click();
  await p.waitForSelector('[data-key="quest"]:has-text("In your tasks")');
  const task = await ev(p, () => window.__lifeos.store.all('tasks').find((x) => x.questId));
  if (task?.title !== title || task.date !== '2026-10-10') throw new Error('task ' + JSON.stringify(task));
  await p.screenshot({ path: `${OUT}/p9-plan.png`, fullPage: true });
  await ctx.close();
});

await step('dark mode: records, season, pledges and rewards', async () => {
  const { ctx, p } = await at('2026-10-07T20:00:00', { scheme: 'dark', hash: '#/plan' });
  await ev(p, async () => { const D = await import('./js/data/demo.js'); await D.loadDemo(42); const S = await import('./js/domain/seasons.js'); S.create({ name: 'Foundations', intention: 'Strong mornings', habitIds: ['h-prayer', 'h-read', 'h-mobility'], start: '2026-09-28' });
    const C = await import('./js/domain/commitments.js'); C.create({ habitId: 'h-prayer', days: 14, stake: 'Coffee for the team', start: '2026-10-01' });
    const R = await import('./js/domain/rewards.js'); R.create({ title: 'New running shoes', kind: 'workouts', target: 12 }); });
  await go(p, '#/progress/records', '[data-key="mastery"]');
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/p9-records-dark.png`, fullPage: true });
  await go(p, '#/progress/season', '[data-key="season-now"]');
  await p.screenshot({ path: `${OUT}/p9-season-dark.png`, fullPage: true });
  await go(p, '#/plan/commitments', '.pledge');
  await p.screenshot({ path: `${OUT}/p9-pledge-dark.png`, fullPage: true });
  await go(p, '#/plan/rewards', '.reward');
  await p.screenshot({ path: `${OUT}/p9-rewards-dark.png`, fullPage: true });
  await ctx.close();
});

await finish();
