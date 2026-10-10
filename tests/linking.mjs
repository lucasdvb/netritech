// Linking (phase 3): every habit, goal, workout, routine and project says what it's linked to;
// deleting something linked offers to move its links, with one Undo; every number opens how it's
// worked out; every reminder sits on one timeline that moves with Your day; goals can be measured by
// anything; and #mentions / @mentions in notes and the journal link back.
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
  await p.goto(base + '#/today');
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.evaluate(() => window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }));
  if (hash !== '#/today') await go(p, hash);
  return { ctx, p };
}
async function go(p, hash, sel = '#main .view') {
  await p.evaluate((h) => { location.hash = h; }, hash);
  await p.waitForFunction((h) => location.hash === h, hash);
  await p.waitForSelector(sel);
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const sheetGone = (p) => p.waitForSelector('.sheet-wrap', { state: 'detached' });
const close = async (p) => { await p.keyboard.press('Escape'); await sheetGone(p); };

await step('a habit says what it is linked to, and every number on it explains itself', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/plan/habits/h-prayer' });
  await p.waitForSelector('[data-key="linked"]');
  const text = await p.textContent('[data-key="linked"]');
  if (!text.includes('Your day') || !text.includes('Goal')) throw new Error(`linked: ${text}`);
  // The run.
  await p.locator('.run-card .explain.run-val').click();
  await p.waitForSelector('.sheet .explain-sum');
  if (!(await p.textContent('.sheet')).includes('Two misses in a row')) throw new Error('run not explained');
  await close(p);
  // 30-day consistency: the sum with real numbers.
  await p.locator('[data-what="consistency"][data-days="30"]').click();
  await p.waitForSelector('.sheet .explain-days');
  const sum = await p.textContent('.sheet .explain-sum');
  if (!/done ÷ .* expected = /.test(sum) && !sum.includes('Not enough days')) throw new Error(sum);
  await p.screenshot({ path: `${OUT}/linking-explain.png` });
  await close(p);
  await p.locator('[data-key="linked"]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/linking-habit.png` });
  await ctx.close();
});

await step('deleting a linked habit: it says what is linked, can move the links, and one Undo brings everything back', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/plan/habits/h-prayer' });
  const before = await ev(p, () => ({ goal: window.__lifeos.store.get('goals', 'g-spirit').habitIds, day: window.__lifeos.store.profile().day }));
  await p.locator('.danger-zone [data-action="delete"]').click();
  await p.waitForSelector('.sheet .safe-delete');
  await p.selectOption('.sheet [data-change="sd-to"]', 'h-scripture');
  await p.screenshot({ path: `${OUT}/linking-safe-delete.png` });
  await p.locator('.sheet [data-action="sd-go"]').click();
  await p.waitForFunction(() => location.hash === '#/plan/habits');
  const after = await ev(p, async () => {
    const { store } = window.__lifeos;
    const D = await import('./js/domain/day-blocks.js');
    return { gone: !store.get('habits', 'h-prayer'), goal: store.get('goals', 'g-spirit').habitIds, block: D.block('b-prayer')?.ref };
  });
  if (!after.gone || after.goal.includes('h-prayer') || !after.goal.includes('h-scripture') || after.block !== 'h-scripture') throw new Error(JSON.stringify(after));
  await p.locator('.toast button', { hasText: 'Undo' }).click();
  await p.waitForFunction(() => !!window.__lifeos.store.get('habits', 'h-prayer'));
  const back = await ev(p, () => ({ goal: window.__lifeos.store.get('goals', 'g-spirit').habitIds, day: window.__lifeos.store.profile().day }));
  if (JSON.stringify(back.goal) !== JSON.stringify(before.goal) || JSON.stringify(back.day ?? null) !== JSON.stringify(before.day ?? null)) throw new Error('Undo did not put the links back');
  await ctx.close();
});

await step('deleting a workout on your week: its days and the habit that starts it are cleared, and Undo restores them', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00');
  const tid = await ev(p, async () => { const F = await import('./js/domain/fitness-core.js'); const t0 = F.templates()[0]; window.__lifeos.store.setProfile({ plan: { ...window.__lifeos.store.profile().plan, 2: t0.id } }); return t0.id; });
  await go(p, `#/plan/training/workouts/${tid}`, '[data-key="linked"]');
  if (!(await p.textContent('[data-key="linked"]')).includes('Tuesdays')) throw new Error('days not listed');
  await p.locator('[data-action="delete"]').click();
  await p.waitForSelector('.sheet .safe-delete');
  await p.locator('.sheet [data-action="sd-go"]').click();
  await p.waitForFunction((id) => !Object.values(window.__lifeos.store.profile().plan || {}).includes(id), tid);
  await p.locator('.toast button', { hasText: 'Undo' }).click();
  await p.waitForFunction((id) => window.__lifeos.store.profile().plan[2] === id && !!window.__lifeos.store.get('templates', id), tid);
  await ctx.close();
});

await step('numbers on goals, Review and weight explain themselves', async () => {
  const { ctx, p } = await at('2026-10-07T20:00:00', { hash: '#/plan/goals/g-spirit' });
  await p.locator('.goal-pct.explain').click();
  await p.waitForSelector('.sheet .explain-sum');
  await close(p);
  await go(p, '#/review', '.story-pct.explain');
  await p.locator('.story-pct.explain').click();
  await p.waitForSelector('.sheet >> text=how much of that day’s plan you did');
  await close(p);
  await ev(p, () => window.__lifeos.store.put('weightEntries', { id: '2026-10-07', date: '2026-10-07', kg: 80 }));
  await go(p, '#/progress/body/weight', '.big-num.explain');
  await p.locator('.big-num.explain').click();
  await p.waitForSelector('.sheet >> text=7-day average');
  await ctx.close();
});

await step('every reminder on one timeline; changing one linked to Your day moves the block too, and Undo puts it back', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00');
  await ev(p, () => { const s = window.__lifeos.store; const nt = s.settings().notifications; s.setSettings({ notifications: { ...nt, enabled: true, evening: { ...(nt.evening || {}), on: true, time: '21:00' } } }); });
  await go(p, '#/you/reminders', '.rem-list');
  const times = await p.locator('.rem-row .rem-time').evaluateAll((els) => els.map((e) => e.value));
  if (!times.length) throw new Error('no reminders listed');
  const row = p.locator('[data-key="rem-evening"]');
  if (!(await row.textContent()).includes('Your day ·')) throw new Error('evening not linked to Your day');
  const blockBefore = await ev(p, async () => (await import('./js/domain/day-blocks.js')).block('b-evening').time);
  await row.locator('.rem-time').fill('21:30');
  await row.locator('.rem-time').press('Tab');
  await p.waitForFunction(() => window.__lifeos.store.settings().notifications.evening.time === '21:30');
  const blockAfter = await ev(p, async () => (await import('./js/domain/day-blocks.js')).block('b-evening').time);
  if (blockAfter === blockBefore) throw new Error('the block did not move');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/linking-reminders.png`, fullPage: true });
  await p.locator('.toast button', { hasText: 'Undo' }).click();
  await p.waitForFunction(() => window.__lifeos.store.settings().notifications.evening.time === '21:00');
  // Reachable from Settings.
  await go(p, '#/you/settings', '[data-view="settings"]');
  await p.locator('a[data-to="you/reminders"]').click();
  await p.waitForSelector('[data-view="reminders"]');
  await ctx.close();
});

await step('a goal measured by anything: a body measurement, with its start read from your last one', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/plan/goals' });
  await ev(p, () => window.__lifeos.store.put('measurements', { id: 'm-x', date: '2026-10-01', waist: 88 }));
  await ev(p, async () => (await import('./js/screens/goals.js')).newGoal());
  await p.waitForSelector('.sheet .goal-new');
  await p.fill('.sheet [data-f="name"]', 'Waist to 80');
  await p.locator('.sheet [data-action="gn-next"]').click();
  await p.locator('.sheet [data-action="gn-next"]').click();
  await p.locator('.sheet [data-action="gn-how"][data-id="measurement"]').click();
  if ((await p.inputValue('.sheet [data-f="start"]')) !== '88') throw new Error('start not read from the last measurement');
  await p.fill('.sheet [data-f="target"]', '80');
  await p.locator('.sheet [data-action="gn-next"]').click();
  await p.locator('.sheet [data-action="gn-save"]').click();
  await p.waitForSelector('[data-view="goal"] .goal-hero');
  const g = await ev(p, () => window.__lifeos.store.all('goals').find((x) => x.name === 'Waist to 80'));
  if (g.measure !== 'measurement' || g.field !== 'waist' || g.target !== 80) throw new Error(JSON.stringify(g));
  if (!(await p.textContent('.goal-hero')).includes('88.0 cm → 80.0 cm')) throw new Error(await p.textContent('.goal-hero'));
  await ctx.close();
});

await step('#mentions and @mentions: suggested as you type, linked from the habit, and collected per person', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/plan/notes' });
  await p.locator('.dump-input').click();
  await p.keyboard.type('Prayed early with @Sarah, #pray', { delay: 20 });
  await p.waitForSelector('.mention-bar .mention-chip');
  await p.locator('.mention-bar .mention-chip', { hasText: '#Prayer' }).first().click();
  const v = await p.inputValue('.dump-input');
  if (!v.includes('#Prayer ')) throw new Error(v);
  await p.screenshot({ path: `${OUT}/linking-mention-typing.png` });
  await p.locator('[data-action="save"]').click();
  await p.waitForSelector('.note-card .mention');
  await go(p, '#/plan/habits/h-prayer', '[data-key="linked"]');
  if (!(await p.textContent('[data-key="linked"]')).includes('Prayed early')) throw new Error('mention not on the habit');
  await go(p, '#/progress/areas/relationships', '[data-key="people-mentioned"]');
  await p.locator('[data-key="people-mentioned"] [data-action="person"]').first().click();
  await p.waitForSelector('.sheet >> text=Prayed early');
  await ctx.close();
});

await step('dark mode: a habit linked up, and the reminders timeline', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { scheme: 'dark', hash: '#/plan/habits/h-prayer' });
  await p.waitForSelector('[data-key="linked"]');
  await p.locator('[data-key="linked"]').scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/linking-habit-dark.png` });
  await go(p, '#/you/reminders', '.rem-list');
  await p.waitForTimeout(500); // the screen change settles
  await p.screenshot({ path: `${OUT}/linking-reminders-dark.png`, fullPage: true });
  await ctx.close();
});

await finish();
