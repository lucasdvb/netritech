// Your plan › Your day, through the interface: each block is linked to what's behind it, so a
// change here is a change on Today and in the reminders. Change a time, carry the morning with
// wake, drag a block, add a plain block and a habit, remove one with Undo, and all of it across a
// reload. Light and dark screenshots.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';

const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { browser, step, finish, base, errors } = t;
const OUT = process.argv[3] || './test-shots';

const ctx = await browser.newContext({ ...devices['iPhone 14'] });
const p = await ctx.newPage();
p.setDefaultTimeout(10000);
p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
p.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
await p.clock.install({ time: new Date('2026-10-09T08:00:00') });
await p.goto(`${base}#/today`);
await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
await p.evaluate(async () => { window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }); await window.__lifeos.store.flush(); });

const ev = (fn, arg) => p.evaluate(fn, arg);
const go = async (hash, sel) => { await p.evaluate((h) => { location.hash = h; }, hash); if (sel) await p.waitForSelector(sel); };
const reload = async () => { await ev(() => window.__lifeos.store.flush()); await p.reload(); await p.waitForFunction(() => window.__lifeos?.ready); };
const habit = (id) => ev((x) => window.__lifeos.store.get('habits', x), id);
const prof = () => ev(() => window.__lifeos.store.profile());
const order = () => p.locator('.plan-day--edit > li').evaluateAll((els) => els.map((e) => e.dataset.key));
const timeOf = (id) => p.textContent(`.plan-day--edit > li[data-key="${id}"] .plan-time`);
const PLAN = '#/plan/playbook';
const KNOWN = ['b-wake', 'b-prayer', 'b-mobility', 'b-train', 'b-breakfast', 'b-work', 'b-shutdown', 'b-evening', 'b-quiet', 'b-bed'];
const openBlock = async (id) => { await p.locator(`[data-action="day-edit"][data-id="${id}"]`).click(); await p.waitForSelector('.sheet [data-submit="day-save"]'); };
const save = async () => { await p.locator('.sheet [data-submit="day-save"] button[type="submit"]').click(); await p.waitForSelector('.sheet-wrap', { state: 'detached' }); };

await step('your day starts as the workbook day, every block linked and in order', async () => {
  await go(PLAN, '.plan-day--edit');
  const ids = await order();
  if (ids.join() !== KNOWN.join()) throw new Error(ids.join());
  if (await p.locator('li[data-key="b-wake"] [data-drag]').count()) throw new Error('wake can be dragged');
  await p.screenshot({ path: `${OUT}/day-plan-light.png` });
});

await step('change the evening routine’s time: the habit, Today and the evening reminder follow; Undo puts it back', async () => {
  await openBlock('b-evening');
  if (!(await p.textContent('.sheet')).includes('Linked to Evening routine')) throw new Error('no link shown');
  await p.fill('.sheet [name="time"]', '21:30');
  await p.fill('.sheet [name="mins"]', '45');
  await save();
  if ((await habit('h-evening')).time !== '21:30') throw new Error('habit time not moved');
  const n = await ev(() => window.__lifeos.store.settings().notifications.evening.time);
  if (n !== '21:30') throw new Error(`evening reminder ${n}`);
  if ((await timeOf('b-evening')) !== '21:30') throw new Error('block not moved');
  // Undo from the toast.
  await p.locator('.toast button', { hasText: 'Undo' }).click();
  await p.waitForFunction(() => window.__lifeos.store.get('habits', 'h-evening').time === '21:00');
  await go(PLAN, '.plan-day--edit');
  // And once more, for real, to see it on Today.
  await openBlock('b-evening');
  await p.fill('.sheet [name="time"]', '21:30');
  await save();
  await go('#/today', '[data-view="today"]');
  await p.locator('[data-action="routine"][data-id="r-evening"]').click();
  await p.waitForSelector('[data-key="r-r-evening"] .rsteps');
  if (!(await p.textContent('[data-key="r-r-evening"] .rsteps')).includes('21:30')) throw new Error('Today doesn’t show the new time');
});

await step('wake moves the morning with it: prayer, mobility, training and breakfast shift together', async () => {
  await go(PLAN, '.plan-day--edit');
  await openBlock('b-wake');
  const toggle = p.locator('.sheet [data-action="day-carry"]');
  if ((await toggle.getAttribute('aria-checked')) !== 'true') throw new Error('carry should start on');
  await p.fill('.sheet [name="time"]', '06:30');
  await save();
  const pr = await prof();
  if (pr.wakeTime !== '06:30' || pr.trainTime !== '07:00') throw new Error(JSON.stringify([pr.wakeTime, pr.trainTime]));
  if ((await habit('h-mobility')).time !== '06:45') throw new Error('mobility not moved');
  if ((await timeOf('b-breakfast')) !== '08:30') throw new Error('breakfast not moved');
  if (pr.workStart !== '10:00') throw new Error('work moved');
});

await step('drag a block with the keyboard: it lands after the one before it ends', async () => {
  const handle = p.locator('li[data-key="b-mobility"] [data-drag]');
  await handle.focus();
  await p.keyboard.press('ArrowDown');
  await p.keyboard.press('ArrowDown');
  await p.waitForFunction(() => window.__lifeos.store.get('habits', 'h-mobility').time !== '06:45');
  const ids = await order();
  const i = ids.indexOf('b-mobility');
  if (ids[i - 1] !== 'b-breakfast') throw new Error(ids.join());
  if ((await habit('h-mobility')).time !== '09:00') throw new Error(`mobility at ${(await habit('h-mobility')).time}`);
});

await step('add a plain block and a habit; remove one with Undo; all of it across a reload', async () => {
  await p.locator('[data-action="day-add"]').click();
  await p.waitForSelector('.sheet [data-submit="day-new"]');
  await p.fill('.sheet [name="label"]', 'Lunch');
  await p.fill('.sheet [name="time"]', '13:00');
  await p.locator('.sheet [data-submit="day-new"] button[type="submit"]').click();
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  let ids = await order();
  const lunch = ids.find((x) => !KNOWN.includes(x));
  if (!lunch || ids[ids.indexOf(lunch) - 1] !== 'b-work') throw new Error(ids.join());
  // A habit.
  await p.locator('[data-action="day-add"]').click();
  await p.waitForSelector('.sheet [data-submit="day-new"]');
  await p.locator('.sheet [data-action="day-kind"][data-value="habit"]').click();
  await p.selectOption('.sheet [name="ref"]', 'h-read');
  await p.fill('.sheet [name="time"]', '21:45');
  await p.locator('.sheet [data-submit="day-new"] button[type="submit"]').click();
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  if ((await habit('h-read')).time !== '21:45') throw new Error('habit time not set');
  // Remove Lunch, Undo, then remove it for good.
  await openBlock(lunch);
  await p.locator('.sheet [data-action="day-remove"]').click();
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  if ((await order()).includes(lunch)) throw new Error('not removed');
  await p.locator('.toast button', { hasText: 'Undo' }).click();
  await p.waitForSelector(`li[data-key="${lunch}"]`);
  await reload();
  await go(PLAN, '.plan-day--edit');
  ids = await order();
  if (!ids.includes(lunch) || !ids.some((x) => x !== lunch && !KNOWN.includes(x))) throw new Error(`after reload: ${ids.join()}`);
  if ((await prof()).wakeTime !== '06:30') throw new Error('wake lost');
});

await step('dark mode', async () => {
  await ev(() => window.__lifeos.store.setSettings({ theme: 'dark' }));
  await p.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
  await p.locator('#plan-day').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/day-plan-dark.png` });
  await openBlock('b-wake');
  await p.screenshot({ path: `${OUT}/day-plan-edit-dark.png` });
  await p.keyboard.press('Escape');
  await ev(() => window.__lifeos.store.setSettings({ theme: 'system' }));
});

await ctx.close();
await finish();
