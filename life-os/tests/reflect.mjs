// Phase 8: Progress and Reflect. Progress as a story where every measure has a decision line;
// Reflect opens ready to write; an insight applied in one tap (with Undo); the weekly review as five
// short screens whose one change is applied to the plan; the monthly review; a calendar file with
// alerts; the app-icon badge.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';

async function at(clock, { scheme = 'light', hash = '#/reflect', init = null } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme, acceptDownloads: true });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on('pageerror', (e) => errors.push(`${clock}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${clock}: console: ${m.text()}`); });
  if (init) await p.addInitScript(init);
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + hash);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.waitForTimeout(400);
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const go = async (p, hash, sel) => { await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForSelector(sel); await p.waitForTimeout(300); };
const unlabeled = (p) => p.evaluate(() => [...document.querySelectorAll('button, [role="switch"]')]
  .filter((b) => b.offsetParent !== null && !b.textContent.trim() && !b.getAttribute('aria-label')).map((b) => b.outerHTML.slice(0, 80)));
// Six days of light protein and few steps: enough for two insights.
const seedGaps = (p, end) => ev(p, (e) => {
  const { store } = window.__lifeos;
  for (let n = 1; n <= 6; n++) {
    const d = new Date(`${e}T12:00:00`); d.setDate(d.getDate() - n);
    const iso = d.toISOString().slice(0, 10);
    store.put('nutritionLogs', { id: `t-${iso}`, date: iso, protein: 90, kcal: 1800, name: 'Test' });
    store.put('stepLogs', { id: iso, date: iso, steps: 3000 });
  }
}, end);

await step('Progress is a story: one sentence, the week against last week, every measure with a decision', async () => {
  const { ctx, p } = await at('2026-10-07T20:00:00', { hash: '#/progress' });
  await ev(p, async () => { const D = await import('./js/data/demo.js'); await D.loadDemo(42); });
  await go(p, '#/today', '.now');
  await go(p, '#/progress', '.story-sentence');
  const sentence = (await p.textContent('.story-sentence')).trim();
  if (!/\.$/.test(sentence) || sentence.length < 20) throw new Error('sentence ' + sentence);
  if ((await p.locator('.week-strip .wk-day').count()) !== 7) throw new Error('week strip');
  if (!/Last week by Wednesday/.test(await p.textContent('.story-ghost'))) throw new Error('ghost line');
  const ms = await p.$$eval('.measure', (els) => els.map((e) => [e.querySelector('.measure-label').textContent, e.querySelector('.measure-decision').textContent.trim()]));
  if (ms.length < 5) throw new Error('measures ' + ms.length);
  for (const [label, d] of ms) if (d.length < 12) throw new Error(`${label} has no decision line`);
  for (const todo of await p.$$eval('.move-row', (els) => els.map((e) => e.textContent))) if (!todo.includes('What to do')) throw new Error('moving without what to do');
  if ((await unlabeled(p)).length) throw new Error('unlabeled ' + (await unlabeled(p)).join(' '));
  await p.screenshot({ path: `${OUT}/p8-progress.png`, fullPage: true });
  // charts one level down
  await p.locator('.measure', { hasText: 'Consistency' }).click();
  await p.waitForSelector('[data-view="trends"] .chart-line');
  await go(p, '#/progress/trends', '[data-key="strength"]');
  await go(p, '#/progress/insights', '[data-view="insights"]');
  await ctx.close();
});

await step('Reflect opens ready to write: one tap, typing saves itself, mood is one tap', async () => {
  const { ctx, p } = await at('2026-10-07T21:00:00');
  await p.waitForSelector('.write-area');
  if (!/What did today teach you|grateful|differently tomorrow|went right/.test(await p.textContent('.write-prompt'))) throw new Error('evening prompt');
  await p.locator('.write-area').click();
  if (!(await ev(p, () => document.activeElement?.matches('.write-area')))) throw new Error('one tap should put the cursor in place');
  await p.keyboard.type('Long day, but the walk after lunch helped.');
  // leave straight away: nothing typed is lost
  await p.locator('.tab[data-key="tab-today"]').click();
  await p.waitForSelector('[data-view="today"]');
  const saved = await ev(p, () => window.__lifeos.store.onDate('journalEntries', '2026-10-07').find((j) => j.kind === 'free')?.text);
  if (saved !== 'Long day, but the walk after lunch helped.') throw new Error('saved ' + saved);
  await go(p, '#/reflect', '.write-area');
  if ((await p.inputValue('.write-area')) !== saved) throw new Error('not shown back');
  await p.locator('.mood-chip', { hasText: 'Good' }).click();
  await p.waitForFunction(() => window.__lifeos.store.onDate('journalEntries', '2026-10-07').find((j) => j.kind === 'free')?.mood === 4);
  await p.waitForSelector('.mood-chip.is-on');
  if ((await p.locator('[data-key="reviews"] .row').count()) !== 3) throw new Error('day, week and month reviews');
  await p.screenshot({ path: `${OUT}/p8-reflect.png`, fullPage: true });
  await ctx.close();
});

await step('an insight ends in one tap that changes the plan, with Undo; Not now sets it aside', async () => {
  const { ctx, p } = await at('2026-10-07T12:00:00');
  await seedGaps(p, '2026-10-07');
  await go(p, '#/today', '.now');
  await go(p, '#/reflect', '.insight-card[data-insight="protein-gap"]');
  await p.locator('.insight-card[data-insight="protein-gap"] [data-action="ins-apply"]').click();
  await p.waitForSelector('.toast:has-text("protein at breakfast")');
  const steps = () => ev(p, () => window.__lifeos.store.get('routines', 'r-morning').steps.filter((s) => s.label === 'Protein at breakfast').length);
  if ((await steps()) !== 1) throw new Error('not added to Morning');
  await p.waitForSelector('.insight-card[data-insight="protein-gap"]', { state: 'detached' });
  await p.locator('.toast-btn', { hasText: 'Undo' }).click();
  await p.waitForFunction(() => !window.__lifeos.store.get('routines', 'r-morning').steps.some((s) => s.label === 'Protein at breakfast'));
  await p.waitForSelector('.insight-card[data-insight="protein-gap"]');
  await go(p, '#/reflect/insights', '.insight-card[data-insight="steps-gap"]');
  await p.screenshot({ path: `${OUT}/p8-insights.png`, fullPage: true });
  await p.locator('.insight-card[data-insight="steps-gap"] [data-action="ins-later"]').click();
  await p.waitForSelector('.insight-card[data-insight="steps-gap"]', { state: 'detached' });
  await p.waitForSelector('[data-key="past"] .row:has-text("Set aside")');
  await ctx.close();
});

await step('the weekly review: five short screens, and the one change is applied to the plan', async () => {
  const { ctx, p } = await at('2026-10-11T18:00:00');
  await seedGaps(p, '2026-10-11');
  const ids = await ev(p, async () => (await import('./js/domain/next-action.js')).nextActions().map((a) => a.id));
  if (!ids.includes('weekly-review')) throw new Error('Today should offer the review on Sunday evening: ' + ids.join());
  await go(p, '#/reflect', '[data-key="reviews"]');
  await p.locator('[data-key="reviews"] a[data-to^="reflect/review/week"]').click();
  await p.waitForSelector('.guide[data-step="week"] .review-sentence');
  if ((await p.getAttribute('.guide .ritual-progress', 'aria-valuemax')) !== '5') throw new Error('five steps');
  await p.locator('[data-action="rv-next"]').click();
  await p.waitForSelector('.guide[data-step="well"]');
  await p.locator('textarea[data-k="worked"]').fill('Walking after lunch');
  await p.locator('[data-action="rv-next"]').click();
  await p.waitForSelector('.guide[data-step="slipped"] .review-facts, .guide[data-step="slipped"] .quiet-line');
  await p.locator('[data-action="rv-next"]').click();
  await p.waitForSelector('.guide[data-step="change"] .pick[data-id="protein-gap"]');
  await p.locator('.pick[data-id="protein-gap"]').click();
  await p.waitForSelector('[data-action="rv-next"]:has-text("Apply and continue")');
  await p.screenshot({ path: `${OUT}/p8-review-change.png`, fullPage: true });
  await p.locator('[data-action="rv-next"]').click();
  await p.waitForSelector('.guide[data-step="next"]');
  const r = await ev(p, () => window.__lifeos.store.get('weeklyReviews', '2026-10-05'));
  if (r.applied?.id !== 'protein-gap' || !/Protein at breakfast/.test(r.answers.one) || r.answers.worked !== 'Walking after lunch') throw new Error('review ' + JSON.stringify(r));
  if (!(await ev(p, () => window.__lifeos.store.get('routines', 'r-morning').steps.some((s) => s.label === 'Protein at breakfast')))) throw new Error('change not applied');
  const items = ['Ship the website', 'Three workouts', 'Call the bank'];
  for (let i = 0; i < 3; i++) { await p.locator(`[data-key="next-week"] [data-i="${i}"]`).fill(items[i]); await p.locator(`[data-key="next-week"] [data-i="${i}"]`).press('Tab'); }
  await p.locator('[data-action="complete"]').click();
  await p.waitForSelector('.toast:has-text("Next week’s one change")');
  await p.waitForSelector('.notice:has-text("Completed")');
  const done = await ev(p, () => ({ r: window.__lifeos.store.get('weeklyReviews', '2026-10-05'), next: window.__lifeos.store.get('weeklyReviews', '2026-10-12') }));
  if (!done.r.completedAt || done.next.plan.join() !== items.join()) throw new Error('not completed ' + JSON.stringify(done));
  await ctx.close();
});

await step('the monthly review, one question per screen', async () => {
  const { ctx, p } = await at('2026-10-30T19:00:00', { hash: '#/reflect/review/month' });
  await p.waitForSelector('.guide[data-step="numbers"] .report-grid');
  await p.locator('[data-action="rv-next"]').click();
  await p.locator('textarea[data-k="win"]').fill('Shipped the proposal');
  for (const s of ['ssc', 'spirit', 'business', 'focus']) { await p.locator('[data-action="rv-next"]').click(); await p.waitForSelector(`.guide[data-step="${s}"]`); }
  await p.locator('textarea[data-k="focus"]').fill('Sleep by 22:00');
  await p.locator('[data-action="complete"]').click();
  await p.waitForSelector('.notice:has-text("Completed")');
  const m = await ev(p, () => window.__lifeos.store.get('monthlyReviews', '2026-10'));
  if (m.answers.win !== 'Shipped the proposal' || m.answers.focus !== 'Sleep by 22:00' || !m.completedAt) throw new Error('month ' + JSON.stringify(m.answers));
  await ctx.close();
});

await step('reminders in your calendar: one file, an alert on every event', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/you/settings' });
  await p.locator('[data-action="calendar-file"]').click();
  await p.waitForSelector('.sheet .cal-file');
  await p.screenshot({ path: `${OUT}/p8-calendar-file.png` });
  const [dl] = await Promise.all([p.waitForEvent('download'), p.locator('.sheet [data-action="cf-add"]').click()]);
  if (dl.suggestedFilename() !== 'life-os-reminders.ics') throw new Error('file ' + dl.suggestedFilename());
  const ics = readFileSync(await dl.path(), 'utf8');
  const lines = ics.replace(/\r\n /g, '').split('\r\n');
  if (lines[0] !== 'BEGIN:VCALENDAR' || !lines.includes('END:VCALENDAR')) throw new Error('not a calendar');
  const events = lines.filter((l) => l === 'BEGIN:VEVENT').length;
  if (events < 5 || lines.filter((l) => l === 'BEGIN:VALARM').length !== events) throw new Error(`${events} events, alarms differ`);
  if (!lines.includes('RRULE:FREQ=WEEKLY;BYDAY=SU')) throw new Error('weekly review missing');
  if (!lines.some((l) => l.startsWith('URL:http://localhost:4173/#/reflect/review/week'))) throw new Error('no link back');
  await p.waitForSelector('.toast:has-text("ready for your calendar")');
  await ctx.close();
});

await step('the app-icon badge counts what is left of today, and follows as you log', async () => {
  const init = () => { window.__badge = null; navigator.setAppBadge = (n) => { window.__badge = n; return Promise.resolve(); }; navigator.clearAppBadge = () => { window.__badge = 0; return Promise.resolve(); }; };
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/today', init });
  await p.waitForFunction(() => window.__badge != null);
  const [n, want] = await ev(p, async () => [window.__badge, (await import('./js/ui/badge.js')).openCount()]);
  if (!n || n !== want) throw new Error(`badge ${n}, want ${want}`);
  // a new priority adds one; ticking it off takes it away again
  await ev(p, async () => (await import('./js/domain/tasks.js')).setPriority('2026-10-07', 0, 'Send the proposal'));
  await p.waitForFunction((was) => window.__badge === was + 1, n);
  await ev(p, async () => { const T = await import('./js/domain/tasks.js'); T.toggle(T.priorities('2026-10-07')[0].id); });
  await p.waitForFunction((was) => window.__badge === was, n);
  await go(p, '#/you/settings', '[data-key="n-badge"]');
  await p.locator('[data-key="n-badge"] [role="switch"]').click();
  await p.waitForFunction(() => window.__badge === 0);
  await ctx.close();
});

await step('dark mode: Progress, Reflect, the weekly review and insights', async () => {
  const { ctx, p } = await at('2026-10-11T18:00:00', { scheme: 'dark', hash: '#/progress' });
  await seedGaps(p, '2026-10-11');
  await ev(p, async () => { const D = await import('./js/data/demo.js'); await D.loadDemo(28); });
  await go(p, '#/today', '.now');
  await go(p, '#/progress', '.story-sentence');
  await p.screenshot({ path: `${OUT}/p8-progress-dark.png`, fullPage: true });
  await go(p, '#/reflect', '.write-area');
  await p.screenshot({ path: `${OUT}/p8-reflect-dark.png`, fullPage: true });
  await go(p, '#/reflect/review/week', '.guide[data-step="week"]');
  await p.screenshot({ path: `${OUT}/p8-review-dark.png`, fullPage: true });
  await go(p, '#/reflect/insights', '[data-view="insights"]');
  await p.screenshot({ path: `${OUT}/p8-insights-dark.png`, fullPage: true });
  await ctx.close();
});

await finish();
