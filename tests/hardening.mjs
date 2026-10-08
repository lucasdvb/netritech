// Phase 11: the performance budgets (plan section 16.2), proven on a phone-like profile: a year of
// data, and the CPU slowed 4× (Lighthouse's mid-tier mobile setting for a machine like the one the
// tests run on). Today must be usable in under 600 ms from a cold start, every screen must render
// in under 70 ms, a tap must be answered within 50 ms, and using a screen (taps, typing, the
// background work they set off) must never block the main thread for more than 50 ms.
// Run on its own, not beside other suites: it measures time.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;

const SLOW = 4;
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

const ctx = await browser.newContext({ ...devices['iPhone 14'] });
const p = await ctx.newPage();
p.setDefaultTimeout(15000);
p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
p.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
const ready = () => p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
await p.goto(`${base}#/today`);
await ready();
await p.evaluate(async () => { const D = await import('./js/data/demo.js'); await D.loadDemo(365); });
await p.reload();
await ready();
await p.waitForTimeout(3000); // the service worker caches everything, background summaries settle
const cdp = await ctx.newCDPSession(p);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: SLOW });

/** Long tasks and event timings from here on (the Event Timing API: input to the next paint). */
const watch = () => p.evaluate(() => {
  window.__long = [];
  window.__events = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push({ ms: Math.round(e.duration), at: location.hash }); }).observe({ type: 'longtask' });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'click' || e.name === 'keydown') window.__events.push({ name: e.name, ms: e.duration }); })
    .observe({ type: 'event', durationThreshold: 16 });
});
const longTasks = () => p.evaluate(() => window.__long.splice(0));
const events = () => p.evaluate(() => window.__events.splice(0));

await step('static budgets: JavaScript for the first screen and the offline precache', async () => {
  const out = execFileSync('node', ['tools/check-budgets.mjs'], { encoding: 'utf8' });
  for (const line of out.trim().split('\n')) console.log(`     ${line.trim()}`);
});

await step(`cold start: Today is interactive in under 600 ms (CPU ${SLOW}× slower, a year of data)`, async () => {
  const runs = [];
  for (let i = 0; i < 5; i++) {
    await p.reload();
    await ready();
    runs.push(await p.evaluate(() => ({ ready: window.__lifeos.readyAt, data: performance.getEntriesByName('lifeos:data')[0]?.startTime, render: window.__lifeos.renders[0]?.ms })));
    await p.waitForTimeout(1500);
  }
  const m = median(runs.map((r) => r.ready));
  console.log(`     ready ${runs.map((r) => Math.round(r.ready)).join(', ')} ms (median ${Math.round(m)}); data loaded at ${Math.round(median(runs.map((r) => r.data)))} ms; Today rendered in ${Math.round(median(runs.map((r) => r.render)))} ms`);
  if (m > 600) throw new Error(`Today interactive at ${Math.round(m)} ms`);
});

await step('every screen renders in under 70 ms, first time and after a change', async () => {
  const ids = await p.evaluate(() => {
    const s = window.__lifeos.store;
    const first = (name, fn = () => true) => s.all(name).find(fn)?.id;
    return { habit: first('habits', (h) => !h.archived), goal: first('goals'), exercise: first('exercises'), journal: first('journalEntries') };
  });
  const routes = ['plan', 'plan/habits', `plan/habits/${ids.habit}`, 'plan/tasks', 'plan/goals', `plan/goals/${ids.goal}`, 'plan/projects', 'plan/books',
    'plan/training', 'plan/training/exercises', `plan/training/exercises/${ids.exercise}`, 'plan/playbook', 'plan/commitments', 'plan/rewards',
    'progress', 'progress/trends', 'progress/trends/consistency', 'progress/calendar', 'progress/records', 'progress/season', 'progress/year',
    'progress/body', 'progress/body/weight', 'progress/body/nutrition', 'progress/body/measurements', 'progress/body/photos', 'progress/body/sleep',
    'progress/areas/mind', 'progress/areas/spirit', 'progress/areas/relationships', 'progress/areas/work', 'progress/areas/health',
    'reflect', 'reflect/journal', `reflect/journal/${ids.journal}`, 'reflect/insights', 'reflect/reviews', 'reflect/review/week', 'reflect/review/month',
    'you/settings', 'you/data', 'you/privacy', 'today'];
  const slow = [];
  const rows = [];
  for (const r of routes) {
    await p.evaluate(() => { window.__lifeos.renders.length = 0; });
    await p.evaluate((h) => { location.hash = `#/${h}`; }, r);
    await p.waitForFunction(() => window.__lifeos.renders.length > 0);
    await p.waitForTimeout(400);
    await p.evaluate(() => window.__lifeos.app.refresh());
    await p.waitForFunction(() => window.__lifeos.renders.length > 1);
    const [first, again] = await p.evaluate(() => window.__lifeos.renders.map((x) => x.ms));
    rows.push([r, first, again]);
    if (first > 70 || again > 70) slow.push(`${r} ${Math.round(first)}/${Math.round(again)} ms`);
  }
  rows.sort((a, b) => b[1] - a[1]);
  console.log(`     slowest: ${rows.slice(0, 5).map(([r, a, b]) => `${r} ${Math.round(a)}/${Math.round(b)}`).join(' · ')} ms (first/again)`);
  if (slow.length) throw new Error(`over 70 ms: ${slow.join(', ')}`);
});

await step('a tap is answered within 50 ms, and using Today never blocks for more than 50 ms', async () => {
  await p.evaluate(() => { location.hash = '#/today'; });
  await p.waitForSelector('[data-view="today"] .prio');
  await p.waitForTimeout(2500);
  await watch();
  const taps = [
    ['tick a priority', '.prio .top3-item .check'],
    ['untick it', '.prio .top3-item .check'],
    ['add water', '[data-action="add-water"]'],
    ['tick a task', '.prio .trow .check'],
    ['open the day mode', '.mode-chip'],
  ];
  const results = [];
  for (const [name, sel] of taps) {
    await p.locator(sel).first().click();
    await p.waitForTimeout(400);
    const ev = (await events()).filter((e) => e.name === 'click');
    results.push([name, ev.length ? Math.max(...ev.map((e) => e.ms)) : 0]);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(2600); // the background work a change sets off (records, levels, summaries)
  }
  // Typing a line into capture, then closing it.
  await p.locator('[data-action="capture"]').first().click();
  await p.waitForSelector('.sheet input, .sheet textarea');
  await p.keyboard.type('walked 30 min', { delay: 60 });
  const typed = await events();
  results.push(['type into capture', typed.length ? Math.max(...typed.map((e) => e.ms)) : 0]);
  await p.keyboard.press('Escape');
  await p.waitForTimeout(1500);
  console.log(`     input to next paint: ${results.map(([n, ms]) => `${n} ${ms ? `${ms} ms` : '<16 ms'}`).join(' · ')}`);
  const slow = results.filter(([, ms]) => ms > 50);
  if (slow.length) throw new Error(`slow: ${slow.map(([n, ms]) => `${n} ${ms} ms`).join(', ')}`);
  const long = await longTasks();
  if (long.length) throw new Error(`long tasks: ${JSON.stringify(long)}`);
});

await step('using a list never blocks: ticking tasks and writing the journal', async () => {
  await p.evaluate(() => { location.hash = '#/plan/tasks'; });
  await p.waitForSelector('[data-view="tasks"] .trow .check');
  await p.waitForTimeout(2500);
  await watch();
  await p.locator('[data-view="tasks"] .trow .check').first().click();
  await p.waitForTimeout(2600);
  await p.evaluate(() => { location.hash = '#/reflect'; });
  await p.waitForSelector('.write-area');
  await p.waitForTimeout(1500);
  await longTasks(); // opening the screen is measured by the render budget above
  await p.locator('.write-area').click();
  await p.keyboard.type('A calm day. Training felt easy.', { delay: 40 });
  await p.waitForTimeout(2000);
  const ev = await events();
  const worst = ev.length ? Math.max(...ev.map((e) => e.ms)) : 0;
  console.log(`     slowest input: ${worst ? `${worst} ms` : 'under 16 ms'}`);
  if (worst > 50) throw new Error(`input took ${worst} ms`);
  const long = await longTasks();
  if (long.length) throw new Error(`long tasks: ${JSON.stringify(long)}`);
});

await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await finish();
