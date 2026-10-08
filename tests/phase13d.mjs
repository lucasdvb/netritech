// Phase 13d in the browser: Same as yesterday on Body (once, with Undo), and the next step in a
// session: every set at the top of the range last time → heavier, shown in the list and in gym mode.
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
  await p.evaluate(async () => { await (await import('./js/data/demo.js')).loadDemo(30); window.__lifeos.store.setSettings({ welcomed: true }); await window.__lifeos.store.flush(); });
  await p.reload();
  await p.waitForFunction(() => window.__lifeos?.ready);
  await p.evaluate(() => window.__lifeos.store.complete());
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const todayFood = (p) => ev(p, async () => window.__lifeos.store.onDate('nutritionLogs', (await import('./js/domain/dates.js')).today()).length);

await step('same as yesterday: one tap logs yesterday’s food today, once, and Undo takes it back', async () => {
  const { ctx, p } = await at('2026-10-08T12:30:00');
  await p.goto(`${base}#/progress/body`);
  await p.waitForSelector('[data-action="same"]');
  const yesterday = await ev(p, async () => window.__lifeos.store.onDate('nutritionLogs', (await import('./js/domain/dates.js')).addDays((await import('./js/domain/dates.js')).today(), -1)).length);
  if (await todayFood(p)) throw new Error('food today already');
  await p.locator('[data-action="same"]').click();
  await p.waitForSelector('.toast:has-text("Same as yesterday")');
  if ((await todayFood(p)) !== yesterday) throw new Error(`${await todayFood(p)} of ${yesterday}`);
  await p.waitForSelector('[data-action="same"]', { state: 'detached' });
  await p.screenshot({ path: `${OUT}/p13d-same.png` });
  await p.locator('.toast button', { hasText: 'Undo' }).click();
  await p.waitForFunction(async () => window.__lifeos.store.onDate('nutritionLogs', (await import('./js/domain/dates.js')).today()).length === 0);
  // And from the food sheet.
  await p.goto(`${base}#/progress/body/nutrition`);
  await p.locator('[data-action="food"]').first().click();
  await p.locator('.sheet [data-action="same"]').click();
  await p.waitForSelector('.toast:has-text("Same as yesterday")');
  if ((await todayFood(p)) !== yesterday) throw new Error('from the sheet');
  await ctx.close();
});

await step('next step: last time every set reached the top, so this session starts heavier and says why', async () => {
  const { ctx, p } = await at('2026-10-08T06:30:00');
  // Last upper session: every dumbbell row set at 15 (the top of 8–15) with 10 kg.
  await ev(p, async () => {
    const s = window.__lifeos.store;
    const D = await import('./js/domain/dates.js');
    const d = D.addDays(D.today(), -1);
    const w = s.put('workouts', { date: d, templateId: 't-upper', title: 'Upper', kind: 'strength', status: 'done', startedAt: `${d}T06:30:00` });
    s.batch([0, 1, 2, 3].map((i) => ({ store: 'workoutSets', value: { workoutId: w.id, date: d, exerciseId: 'e-db-row', order: 2, setIndex: i, target: '8–15', reps: 15, load: 10, completed: true } })));
  });
  const id = await ev(p, async () => (await import('./js/screens/workout-actions.js')).startWorkout('t-upper').id);
  await p.waitForSelector('.ex-card');
  const rows = await ev(p, (wid) => window.__lifeos.store.all('workoutSets').filter((x) => x.workoutId === wid && x.exerciseId === 'e-db-row').map((x) => [x.reps, x.load]), id);
  if (!rows.length || rows.some(([r, l]) => r !== 8 || l !== 12.5)) throw new Error(JSON.stringify(rows));
  const card = p.locator('.ex-card', { hasText: 'row' }).first();
  const note = await card.locator('.ex-step').textContent();
  if (!/12\.5 kg × 8/.test(note) || !/Every set reached 15/.test(note)) throw new Error(note);
  await card.scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/p13d-step-list.png` });
  // Gym mode, at the row's first set.
  await ev(p, async (wid) => {
    const s = window.__lifeos.store;
    for (const x of s.all('workoutSets').filter((y) => y.workoutId === wid && y.order < 2)) s.put('workoutSets', { ...x, completed: true });
  }, id);
  await p.goto(`${base}#/workout/${id}/gym`);
  await p.waitForSelector('.gym-step-note');
  const g = await p.locator('.gym-step-note').textContent();
  if (!/12\.5 kg × 8/.test(g)) throw new Error(g);
  await p.screenshot({ path: `${OUT}/p13d-step-gym.png` });
  await ctx.close();
});

await finish();
