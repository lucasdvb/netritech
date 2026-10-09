// Phase 13e in the browser, on Reflect: on this day; an experiment from start to verdict across a
// fortnight of clock; and What helps you as an insight whose one tap keeps a habit on Minimum days.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';

const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { browser, step, finish, base, errors } = t;
const OUT = process.argv[3] || './test-shots';
const DAY = '2026-10-08';

async function at(clock, { scheme = 'light', before } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(`${base}#/today`);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
  await p.evaluate(async (fn) => {
    window.__lifeos.store.setSettings({ welcomed: true });
    if (fn) await (0, eval)(`(${fn})`)();
    await window.__lifeos.store.flush();
  }, before ? before.toString() : null);
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const to = async (p, hash, sel) => { await p.goto(`${base}${hash}`); await p.waitForFunction(() => window.__lifeos?.ready); if (sel) await p.waitForSelector(sel); };

await step('on this day: last year’s entry at the top of Reflect, and it opens', async () => {
  const { ctx, p } = await at(`${DAY}T20:00:00`, { before: async () => {
    window.__lifeos.store.put('journalEntries', { id: 'old', date: '2025-10-08', kind: 'evening', answers: { 0: 'Started training again after the move' }, text: '' });
  } });
  await to(p, '#/reflect', '[data-key="memory"]');
  const txt = await p.locator('[data-key="memory"]').textContent();
  if (!/A year ago/.test(txt) || !/Started training again/.test(txt)) throw new Error(txt);
  await p.screenshot({ path: `${OUT}/p13e-memory.png` });
  await p.locator('[data-key="memory"] a').click();
  await p.waitForFunction(() => location.hash.includes('reflect/journal/old'));
  await ctx.close();
});

await step('an experiment: started from Reflect, followed day by day, and kept or dropped at the end with Undo', async () => {
  const { ctx, p } = await at(`${DAY}T20:00:00`, { before: async () => {
    const s = window.__lifeos.store;
    const D = await import('./js/domain/dates.js');
    for (let i = 1; i <= 14; i++) { const d = D.addDays('2026-10-08', -i); s.put('sleepEntries', { id: d, date: d, hours: 6.4 }); }
  } });
  await to(p, '#/reflect', '[data-action="exp-new"]');
  await p.locator('[data-action="exp-new"]').click();
  await p.waitForSelector('.exp-form');
  await p.locator('[data-input="exp-name"]').fill('No screens after 21:30');
  await p.locator('[data-action="exp-watch"][data-k="energy"]').click(); // leaves sleep on its own
  await p.screenshot({ path: `${OUT}/p13e-exp-start.png` });
  await p.locator('[data-action="exp-start"]').click();
  await p.waitForSelector('.exp-card');
  if (!/Day 1 of 14/.test(await p.locator('.exp-card').textContent())) throw new Error(await p.locator('.exp-card').textContent());
  // Two weeks pass: better sleep, the habit done on 11 of the 14 days.
  await ev(p, async () => {
    const s = window.__lifeos.store;
    const D = await import('./js/domain/dates.js');
    const H = await import('./js/domain/habits.js');
    const e = s.all('experiments')[0];
    for (let i = 0; i < 14; i++) {
      const d = D.addDays(e.start, i);
      s.put('sleepEntries', { id: d, date: d, hours: 7.6 });
      if (i % 5) H.setLog(H.habit(e.habitId), d, { value: 1 });
    }
    await s.flush();
  });
  await p.clock.setFixedTime(new Date('2026-10-22T19:00:00'));
  await to(p, '#/reflect', '[data-action="exp-keep"]');
  const card = await p.locator('.exp-card').textContent();
  if (!/Finished/.test(card) || !/Done 11 of 14 days/.test(card) || !/6\.4 h → 7\.6 h/.test(card) || !/Better/.test(card)) throw new Error(card);
  await p.screenshot({ path: `${OUT}/p13e-exp-end.png` });
  await p.locator('[data-action="exp-drop"]').click();
  await p.waitForSelector('.toast:has-text("Dropped")');
  if (!(await ev(p, () => window.__lifeos.store.all('habits').find((h) => h.name === 'No screens after 21:30')?.archived))) throw new Error('not archived');
  await p.locator('.toast button', { hasText: 'Undo' }).click();
  await p.waitForSelector('[data-action="exp-keep"]');
  await p.locator('[data-action="exp-keep"]').click();
  await p.waitForSelector('[data-action="exp-new"]');
  if (await ev(p, () => window.__lifeos.store.all('habits').find((h) => h.name === 'No screens after 21:30')?.archived)) throw new Error('kept but archived');
  await ctx.close();
});

await step('what helps you: an insight from 60 days of logs, with its one tap', async () => {
  const { ctx, p } = await at(`${DAY}T20:00:00`, { before: async () => {
    const s = window.__lifeos.store;
    const D = await import('./js/domain/dates.js');
    s.setProfile({ trackingStart: '2026-07-01' });
    s.put('habits', { ...s.get('habits', 'h-scripture'), state: 'focus', mvd: false, schedule: { kind: 'daily' } });
    for (let i = 2; i <= 41; i++) {
      const d = D.addDays('2026-10-08', -i);
      if (i % 2 === 0) s.put('habitLogs', { id: `h-scripture:${d}`, habitId: 'h-scripture', date: d, value: 1, completed: true });
      const n = D.addDays(d, 1);
      s.put('moodEntries', { id: n, date: n, energy: i % 2 === 0 ? 8 : 5, mood: 7, stress: 3 });
    }
  } });
  await to(p, '#/reflect/insights', '.insight-card');
  const card = p.locator('.insight-card', { hasText: 'Scripture' });
  if (!(await card.count())) throw new Error(`no insight: ${await p.locator('.insight-cards').textContent()}`);
  if (!/A pattern, not proof/.test(await card.textContent())) throw new Error('not worded as a pattern');
  await card.scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${OUT}/p13e-helps.png` });
  await card.locator('button.btn--primary').click();
  await p.waitForFunction(() => window.__lifeos.store.get('habits', 'h-scripture').mvd === true);
  await ctx.close();
});

await finish();
