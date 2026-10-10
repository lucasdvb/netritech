// Effort, autoregulation, the automatic deload and temptation bundling: reps left in the tank are
// one tap in gym mode and move the next set; a lighter week is suggested when lifts stall, started
// in one tap, and the sessions follow it; the pairing you keep for training shows in gym mode and
// rides with the reminder.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';

async function at(clock, { scheme = 'light', hash = '#/today', before, arg } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on('pageerror', (e) => errors.push(`${clock}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${clock}: console: ${m.text()}`); });
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + '#/today');
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.evaluate(() => window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }));
  if (before) await p.evaluate(before, arg);
  if (hash !== '#/today') await go(p, hash);
  return { ctx, p };
}
async function go(p, hash, sel = '#main .view') {
  await p.evaluate((h) => { location.hash = h; }, hash);
  await p.waitForFunction((h) => location.hash === h, hash);
  await p.waitForSelector(sel);
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);

// A one-exercise workout (dumbbell row, 3 × 8–12) with three past sessions at 20 kg.
const HISTORY = async ({ stall } = {}) => {
  const s = window.__lifeos.store;
  s.put('templates', { id: 't-row', name: 'Row day', kind: 'strength', minutes: 30, order: 9, items: [{ exerciseId: 'e-db-row', sets: 3, reps: '8–12', load: 20 }] });
  const days = ['2026-09-21', '2026-09-28', '2026-10-05', '2026-10-09'];
  days.forEach((d, n) => {
    const w = s.put('workouts', { id: `hw${n}`, date: d, title: 'Row day', templateId: 't-row', kind: 'strength', status: 'done', startedAt: `${d}T07:00:00` });
    const reps = stall ? 9 : 8 + n;
    const ops = [0, 1, 2].map((i) => ({ store: 'workoutSets', value: { workoutId: w.id, date: d, exerciseId: 'e-db-row', order: 0, setIndex: i, reps, load: 20, completed: true } }));
    if (stall) ops.push(...[0, 1].map((i) => ({ store: 'workoutSets', value: { workoutId: w.id, date: d, exerciseId: 'e-goblet-squat', order: 1, setIndex: i, reps: 12, load: 16, completed: true } })));
    s.batch(ops);
  });
};

await step('reps left in the tank: one tap per set in gym mode, and four or more moves the next set a step heavier', async () => {
  const { ctx, p } = await at('2026-10-13T07:00:00', { before: HISTORY });
  const id = await ev(p, async () => (await import('./js/screens/workout-actions.js')).startWorkout('t-row', '2026-10-13', { gym: true }).id);
  await p.waitForSelector('.gym-effort');
  await p.locator('.gym-rir', { hasText: '4+' }).click();
  await p.waitForSelector('.gym-rir[aria-checked="true"]:has-text("4+")');
  await p.screenshot({ path: `${OUT}/effort-gym.png` });
  await p.locator('.gym-go[data-action="g-done"]').click();
  await p.locator('[data-action="g-rest-skip"]').click();
  await p.waitForSelector('.gym-step-note:has-text("Adjusted")');
  const sets = await ev(p, (wid) => window.__lifeos.store.all('workoutSets').filter((s) => s.workoutId === wid).sort((a, b) => a.setIndex - b.setIndex), id);
  if (sets[0].rir !== 4 || !sets[0].completed) throw new Error(`first set ${JSON.stringify(sets[0])}`);
  const shown = await p.textContent('[data-key="ctl-load"] .gym-val .tnum');
  if (Number(shown) !== Number(sets[0].load) + 2.5) throw new Error(`next set at ${shown}, first was ${sets[0].load}`);
  // Clearing it again is a second tap.
  await p.locator('.gym-rir', { hasText: '2' }).click();
  await p.locator('.gym-rir', { hasText: '2' }).click();
  await p.waitForFunction(() => !document.querySelector('.gym-rir[aria-checked="true"]'));
  await ctx.close();
});

await step('the next session autoregulates: every set at the top with lots to spare is a bigger step', async () => {
  const { ctx, p } = await at('2026-10-13T07:00:00', { before: async () => {
    const s = window.__lifeos.store;
    s.put('templates', { id: 't-row', name: 'Row day', kind: 'strength', minutes: 30, order: 9, items: [{ exerciseId: 'e-db-row', sets: 2, reps: '8–12', load: 20 }] });
    const w = s.put('workouts', { id: 'hw', date: '2026-10-10', title: 'Row day', templateId: 't-row', kind: 'strength', status: 'done', startedAt: '2026-10-10T07:00:00' });
    s.batch([0, 1].map((i) => ({ store: 'workoutSets', value: { workoutId: w.id, date: w.date, exerciseId: 'e-db-row', order: 0, setIndex: i, reps: 12, load: 20, rir: 3, completed: true } })));
  } });
  const step = await ev(p, async () => (await import('./js/domain/next-step.js')).nextStep('e-db-row', '8–12', { before: '2026-10-13' }));
  if (step.kind !== 'load' || step.load !== 25 || !/spare/.test(step.why)) throw new Error(JSON.stringify(step));
  await ctx.close();
});

await step('a lighter week: suggested when lifts stall, started in one tap, and the session follows it', async () => {
  const { ctx, p } = await at('2026-10-13T07:00:00', { hash: '#/plan/training', before: HISTORY, arg: { stall: true } });
  await p.waitForSelector('[data-key="deload"]');
  const txt = await p.textContent('[data-key="deload"]');
  if (!/haven’t gone up in three sessions/.test(txt)) throw new Error(txt);
  await p.screenshot({ path: `${OUT}/deload-suggested.png` });
  await p.locator('[data-action="dl-start"]').click();
  await p.waitForSelector('[data-key="deload"]:has-text("Deload week")');
  const call = await ev(p, async () => (await import('./js/domain/day-plan.js')).trainingCall('2026-10-13'));
  if (call.kind !== 'rest' && !/deload/.test(call.title)) throw new Error(`Today says ${call.title}`);
  const id = await ev(p, async () => (await import('./js/screens/workout-actions.js')).startWorkout('t-row', '2026-10-13').id);
  const sets = await ev(p, (wid) => window.__lifeos.store.all('workoutSets').filter((s) => s.workoutId === wid), id);
  const w = await ev(p, (wid) => window.__lifeos.store.get('workouts', wid), id);
  if (sets.length !== 2 || sets.some((s) => s.load !== 18) || !/Deload week/.test(w.adjusted || '')) throw new Error(`${sets.length} sets at ${sets.map((s) => s.load)}; ${w.adjusted}`);
  await ctx.close();
});

await step('temptation bundling: the pairing is a field on the habit, shows in gym mode and rides with the reminder', async () => {
  const { ctx, p } = await at('2026-10-13T06:20:00', { hash: '#/plan/habits/h-training', before: HISTORY });
  await p.waitForSelector('#main .view');
  await ev(p, () => window.__lifeos.store.update('habits', 'h-training', { bundle: 'the Huberman podcast' }));
  const body = await ev(p, async () => {
    const s = window.__lifeos.store;
    s.setSettings({ notifications: { ...s.settings().notifications, enabled: true, workout: { on: true, time: '06:25' } } });
    s.setProfile({ plan: { ...s.profile().plan, 2: 't-row' } });
    const R = await import('./js/domain/reminders.js');
    return R.candidates(new Date('2026-10-13T06:30:00')).find((c) => c.cat === 'workout')?.body;
  });
  if (!/with the Huberman podcast/.test(body || '')) throw new Error(`reminder: ${body}`);
  await ev(p, async () => (await import('./js/screens/workout-actions.js')).startWorkout('t-row', '2026-10-13', { gym: true }));
  await p.waitForSelector('.gym-bundle:has-text("the Huberman podcast")');
  await ctx.close();
});

await step('the habit editor has the pairing field', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { hash: '#/plan/habits/h-read' });
  await p.waitForSelector('#main .view');
  await ev(p, async () => (await import('./js/screens/habit-edit.js')).openHabitEditor('h-read', { focus: 'backup' }));
  await p.waitForSelector('.sheet [data-f="bundle"]');
  await p.fill('.sheet [data-f="bundle"]', 'a good playlist');
  await p.waitForFunction(() => window.__lifeos.store.get('habits', 'h-read').bundle === 'a good playlist', null, { timeout: 4000 });
  await ctx.close();
});

await step('dark mode: gym mode with effort and the pairing', async () => {
  const { ctx, p } = await at('2026-10-13T07:00:00', { scheme: 'dark', before: HISTORY });
  await ev(p, () => window.__lifeos.store.update('habits', 'h-training', { bundle: 'your audiobook' }));
  await ev(p, async () => (await import('./js/screens/workout-actions.js')).startWorkout('t-row', '2026-10-13', { gym: true }));
  await p.waitForSelector('.gym-effort');
  await p.locator('.gym-rir', { hasText: '2' }).click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/effort-gym-dark.png` });
  await ctx.close();
});

await finish();
