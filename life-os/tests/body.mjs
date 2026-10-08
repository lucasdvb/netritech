// Phase 7: Body. Gym mode under clock control (rest timer to the second across an app switch and a
// reload, next set prefilled, the screen kept awake or a clear warning, 56 px targets); Apple
// Health paste in one confirmation; the faster weigh-in on the Body page.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';

async function open(hash, { scheme = 'light', install = null, fixed = '2026-10-07T07:00:00', permissions = [] } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme, permissions });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  if (install) await p.clock.install({ time: new Date(install) });
  else await p.clock.setFixedTime(new Date(fixed));
  await p.goto(base + hash);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.waitForTimeout(300);
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const restText = (p) => p.textContent('#gym-rest');

await step('gym mode: one set at a time, rest timer to the second across an app switch and a reload', async () => {
  const { ctx, p } = await open('#/today', { install: '2026-10-07T07:00:00' });
  const id = await ev(p, async () => (await import('./js/screens/workout-actions.js')).startWorkout('t-upper', '2026-10-07').id);
  await p.waitForSelector('[data-action="gym"]');
  await p.locator('[data-action="gym"]').click();
  await p.waitForSelector('.gym-go');
  // Kept awake, or told plainly that it can't be.
  const lock = await p.locator('.gym-warn').count();
  const hasLock = await ev(p, () => 'wakeLock' in navigator);
  if (!hasLock && !lock) throw new Error('no wake lock and no warning');
  // Every control is at least 56 px.
  const small = await ev(p, () => [...document.querySelectorAll('.gym button')].filter((b) => b.offsetParent && (b.getBoundingClientRect().height < 56 || b.getBoundingClientRect().width < 56)).map((b) => b.textContent.trim() || b.getAttribute('aria-label')));
  if (small.length) throw new Error('small targets: ' + small.join(', '));
  await p.waitForTimeout(700); // the page transition runs on real time, not the test clock
  await p.screenshot({ path: `${OUT}/p7-gym.png` });
  // one more rep than suggested, then done
  const reps0 = Number((await p.locator('[data-key="ctl-reps"] .tnum').textContent()).trim());
  await p.locator('[data-key="ctl-reps"] [data-d="1"]').click();
  await p.locator('.gym-go').click();
  await p.waitForSelector('#gym-rest');
  const rest0 = await restText(p);
  if (!['1:30', '1:29'].includes(rest0)) throw new Error('rest ' + rest0);
  await p.clock.fastForward(30_000);
  await p.waitForFunction(() => ['1:00', '0:59'].includes(document.getElementById('gym-rest')?.textContent));
  // switch away for 45 s: the timer keeps time from its timestamp
  await ev(p, () => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.clock.fastForward(45_000);
  await ev(p, () => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForFunction(() => ['0:15', '0:14'].includes(document.getElementById('gym-rest')?.textContent));
  await p.screenshot({ path: `${OUT}/p7-gym-rest.png` });
  // a reload keeps the rest too
  await p.reload();
  await p.waitForFunction(() => window.__lifeos?.ready);
  await p.waitForSelector('#gym-rest');
  const after = await restText(p);
  if (!['0:15', '0:14', '0:13'].includes(after)) throw new Error('after reload ' + after);
  await p.clock.fastForward(16_000);
  await p.waitForSelector('.gym-go');
  // the next set is prefilled from the one just done
  const reps1 = Number((await p.locator('[data-key="ctl-reps"] .tnum').textContent()).trim());
  if (reps1 !== reps0 + 1) throw new Error(`next set ${reps1}, want ${reps0 + 1}`);
  const set1 = await ev(p, (wid) => window.__lifeos.store.all('workoutSets').filter((s) => s.workoutId === wid && s.completed).map((s) => s.reps), id);
  if (set1.join() !== String(reps0 + 1)) throw new Error('logged ' + set1);
  // the rest of the session, skipping rests, then finish
  for (let i = 0; i < 40 && await p.locator('.gym-go[data-action="g-done"]').count(); i++) {
    await p.locator('.gym-go[data-action="g-done"]').click();
    // after a set: the rest (skip it), or, after the last one, the done card
    await p.waitForSelector('[data-action="g-rest-skip"], .gym-card--done');
    if (await p.locator('[data-action="g-rest-skip"]').count()) {
      await p.locator('[data-action="g-rest-skip"]').click();
      await p.waitForSelector('.gym-go[data-action="g-done"], .gym-card--done');
    }
  }
  await p.waitForSelector('.gym-card--done');
  await p.locator('.gym-card--done [data-action="g-finish"]').click();
  await p.waitForSelector('.sheet [data-action="done"]');
  await p.locator('.sheet [data-action="done"]').click();
  await p.waitForFunction((wid) => window.__lifeos.store.get('workouts', wid)?.status === 'done', id);
  await ctx.close();
});

await step('Apple Health: one tap pastes steps, sleep and weight, one confirmation saves them', async () => {
  const { ctx, p } = await open('#/today?paste=1', { permissions: ['clipboard-read', 'clipboard-write'] });
  await p.waitForSelector('.sheet .health');
  await ev(p, () => navigator.clipboard.writeText('Life OS\nsteps: 8432\nsleep: 7.4\nweight: 76.4'));
  await p.locator('.sheet [data-action="hp-read"]').click();
  await p.waitForSelector('.sheet [data-action="hp-save"]');
  if ((await p.locator('.sheet .cap-item').count()) !== 3) throw new Error('rows');
  await p.screenshot({ path: `${OUT}/p7-health.png` });
  await p.locator('.sheet [data-action="hp-save"]').click();
  await p.waitForSelector('.toast:has-text("steps, sleep and weight")');
  const got = await ev(p, async () => { const M = await import('./js/domain/metrics.js'); return [M.steps('2026-10-07'), M.sleepHours('2026-10-07'), M.weight('2026-10-07')]; });
  if (got.join() !== '8432,7.4,76.4') throw new Error('saved ' + got);
  await p.locator('.toast-btn', { hasText: 'Undo' }).click();
  await p.waitForFunction(async () => (await import('./js/domain/metrics.js')).steps('2026-10-07') == null);
  // pasting by hand works when the clipboard can't be read
  await p.locator('.tab--capture').click();
  await p.locator('[data-action="run"][data-id="health"]').click();
  await p.waitForSelector('.sheet .health');
  await p.locator('.sheet summary').click();
  await p.locator('.sheet textarea').fill('steps: 5000');
  await p.waitForSelector('.sheet [data-action="hp-save"]');
  await ctx.close();
});

await step('Body: weight on the number pad from your last value; composition one level down', async () => {
  const { ctx, p } = await open('#/progress/body');
  await ev(p, () => window.__lifeos.store.put('weightEntries', { id: '2026-10-06', date: '2026-10-06', kg: 76.2 }));
  await p.waitForSelector('.comp-link');
  await p.locator('[data-action="log-weight"]').first().click();
  await p.waitForSelector('.numpad');
  if (!(await p.textContent('.numpad-value')).includes('76.2')) throw new Error('not prefilled');
  await p.locator('.numpad-step[data-dir="-1"]').click();
  await p.locator('[data-action="np-save"]').click();
  await p.waitForFunction(async () => (await import('./js/domain/metrics.js')).weight('2026-10-07') === 76.1);
  await p.screenshot({ path: `${OUT}/p7-body.png`, fullPage: true });
  await ctx.close();
});

await step('dark mode: Body, and gym mode stays high-contrast', async () => {
  const { ctx, p } = await open('#/progress/body', { scheme: 'dark' });
  await p.waitForSelector('.comp-link');
  await p.screenshot({ path: `${OUT}/p7-body-dark.png`, fullPage: true });
  const id = await ev(p, async () => (await import('./js/screens/workout-actions.js')).startWorkout('t-lower', '2026-10-07').id);
  await p.waitForSelector('[data-action="gym"]');
  await p.locator('[data-action="gym"]').click();
  await p.waitForSelector('.gym-go');
  const bg = await ev(p, () => getComputedStyle(document.querySelector('.gym')).backgroundColor);
  if (bg !== 'rgb(0, 0, 0)') throw new Error('gym background ' + bg);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/p7-gym-dark.png` });
  void id;
  await ctx.close();
});

await finish();
