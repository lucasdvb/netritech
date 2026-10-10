// Your days: a plan for each kind of day, a plan per weekday, any date on another plan or adjusted on
// its own, and everything following the plan of the date: Today's Your day, what's expected, the
// reminders and the weekly review. With only Every day, nothing changes.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';

async function at(clock, { scheme = 'light', hash = '#/today', before } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on('pageerror', (e) => errors.push(`${clock}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${clock}: console: ${m.text()}`); });
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + '#/today');
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.evaluate(() => window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }));
  if (before) await p.evaluate(before);
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
// A Short day on Tuesdays, waking at 07:30 and without prayer (made through the domain).
const SHORT = async () => {
  const P = await import('./js/domain/day-plans.js');
  const { id } = P.create('Short day');
  P.setWeekday(2, id);
  const list = P.blocksOf({ plan: id });
  P.edit({ plan: id }, list.find((b) => b.kind === 'wake').id, { time: '07:30' }, { carry: true });
  P.removeBlock({ plan: id }, list.find((b) => b.ref === 'h-prayer').id);
};

await step('with only Every day, Your plan and Today look as they always did', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { hash: '#/plan/playbook' });
  await p.waitForSelector('.days-week');
  const names = await p.locator('.dw-plan').allTextContents();
  if (names.length !== 7 || names.some((n) => n !== 'Every day')) throw new Error(names.join(','));
  await go(p, '#/today', '.dstrip');
  if (await p.locator('.ds-plan').count()) throw new Error('a plan name shows with only one plan');
  await ctx.close();
});

await step('make a plan, give it Tuesdays, change its wake time: Tuesday follows it, Monday doesn’t', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { hash: '#/plan/playbook' });
  await p.locator('[data-action="dp-new"]').click();
  await p.fill('.sheet input[name="name"]', 'Short day');
  await p.locator('.sheet button[type="submit"]').click();
  await sheetGone(p);
  await p.waitForSelector('.days-plans .chip.is-active:has-text("Short day")');
  // Tuesday follows it.
  await p.locator('.dw-day[data-wd="2"]').click();
  await p.locator('.sheet [data-action="dp-set-weekday"]', { hasText: 'Short day' }).click();
  await sheetGone(p);
  await p.waitForSelector('.dw-day[data-wd="2"] .dw-plan:has-text("Short day")');
  // Wake at 07:30 on Short days, the morning carried with it.
  await p.locator('.plan-block.is-anchor [data-action="day-edit"]').first().click();
  await p.waitForSelector('.sheet input[name="time"]');
  if (!(await p.textContent('.sheet .sheet-note')).includes('Short day')) throw new Error('the sheet doesn’t say which plan');
  await p.fill('.sheet input[name="time"]', '07:30');
  await p.locator('.sheet button[type="submit"]').click();
  await sheetGone(p);
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/day-plans-plan.png` });
  const r = await ev(p, async () => {
    const P = await import('./js/domain/day-plans.js');
    return { tue: P.on('2026-10-13').profile.wakeTime, mon: P.on('2026-10-12').profile.wakeTime, base: window.__lifeos.store.profile().wakeTime };
  });
  if (r.tue !== '07:30' || r.mon !== r.base || r.base === '07:30') throw new Error(JSON.stringify(r));
  // Today (a Tuesday) shows the Short day.
  await go(p, '#/today', '.dstrip');
  if (!(await p.textContent('.dstrip .block-title')).includes('Short day')) throw new Error('Today doesn’t say which plan');
  if (!(await p.textContent('.dstrip')).includes('07:30')) throw new Error('Today doesn’t show the Short day times');
  await ctx.close();
});

await step('a habit the day’s plan leaves out isn’t expected that day, and isn’t on Today’s plan', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { before: SHORT });
  const r = await ev(p, async () => {
    const H = await import('./js/domain/habits.js');
    const h = H.habit('h-prayer');
    return { tue: H.dueOn(h, '2026-10-13'), wed: H.dueOn(h, '2026-10-14') };
  });
  if (r.tue || !r.wed) throw new Error(JSON.stringify(r));
  await p.waitForSelector('.dstrip');
  if ((await p.textContent('.dstrip')).includes('Prayer')) throw new Error('prayer on the Short day');
  await ctx.close();
});

await step('opening the app with plans already made: Today follows the day’s plan from the start', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { before: SHORT });
  await p.reload();
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.waitForSelector('.dstrip .ds-plan');
  const txt = await p.textContent('.dstrip');
  if (!txt.includes('Short day') || !txt.includes('07:30') || txt.includes('Prayer')) throw new Error(txt.slice(0, 200));
  await ctx.close();
});

await step('one date: another plan, or adjusted on its own; the plan itself stays as it was', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { hash: '#/plan/playbook', before: SHORT });
  await p.waitForSelector('[data-key="da-2026-10-15"]');
  await p.locator('[data-key="da-2026-10-15"] .row').click();
  await p.locator('.sheet [data-action="dp-set-date"]', { hasText: 'Short day' }).click();
  await sheetGone(p);
  await p.waitForSelector('[data-key="da-2026-10-15"] .row-sub:has-text("Short day")');
  // Adjust Friday on its own.
  await p.locator('[data-key="da-2026-10-16"] .row').click();
  await p.locator('.sheet [data-action="dp-adjust"]').click();
  await sheetGone(p);
  await p.waitForSelector('.days-editing-what:has-text("this day only")');
  await p.locator('.plan-block.is-anchor [data-action="day-edit"]').first().click();
  await p.fill('.sheet input[name="time"]', '05:30');
  await p.locator('.sheet button[type="submit"]').click();
  await sheetGone(p);
  const r = await ev(p, async () => {
    const P = await import('./js/domain/day-plans.js');
    return { fri: P.on('2026-10-16').profile.wakeTime, nextFri: P.on('2026-10-23').profile.wakeTime, thu: P.planIdFor('2026-10-15'), short: P.plans()[1].id, adjusted: P.adjusted('2026-10-16') };
  });
  if (r.fri !== '05:30' || r.nextFri === '05:30' || r.thu !== r.short || !r.adjusted) throw new Error(JSON.stringify(r));
  await p.screenshot({ path: `${OUT}/day-plans-date.png` });
  await ctx.close();
});

await step('reminders show each plan’s times; the weekly review sets out next week’s days', async () => {
  const { ctx, p } = await at('2026-10-11T18:00:00', { hash: '#/you/reminders', before: async () => {
    const s = window.__lifeos.store;
    s.setSettings({ notifications: { ...s.settings().notifications, enabled: true, morning: { on: true, time: '06:15' } } });
    const P = await import('./js/domain/day-plans.js');
    const { id } = P.create('Short day');
    P.setWeekday(2, id);
    P.edit({ plan: id }, P.blocksOf({ plan: id }).find((b) => b.kind === 'wake').id, { time: '07:30' });
  } });
  await p.waitForSelector('.rem-plans');
  const morning = async () => p.inputValue('[data-key="rem-morning"] .rem-time');
  await p.locator('.rem-plans .seg-btn', { hasText: 'Every day' }).click();
  const base = await morning();
  await p.locator('.rem-plans .seg-btn', { hasText: 'Short day' }).click();
  await p.waitForFunction((b) => document.querySelector('[data-key="rem-morning"] .rem-time')?.value !== b, base);
  if ((await morning()) !== '07:45') throw new Error(`Short day check-in at ${await morning()}`);
  await p.screenshot({ path: `${OUT}/day-plans-reminders.png`, fullPage: true });
  // Sunday: the weekly review's last step lists next week's days.
  await go(p, '#/reflect/review/week', '.guide');
  for (let i = 0; i < 8 && !(await p.locator('.guide[data-step="next"]').count()); i++) {
    await p.locator('[data-action="rv-next"]').click();
    await p.waitForTimeout(300);
  }
  await p.waitForSelector('[data-key="days-review"]');
  const txt = await p.textContent('[data-key="days-review"]');
  if (!txt.includes('Short day') || !txt.includes('Every day')) throw new Error(txt);
  await ctx.close();
});

await step('the calendar file puts each reminder at its time on each kind of day', async () => {
  const { ctx, p } = await at('2026-10-11T18:00:00', { before: async () => {
    const P = await import('./js/domain/day-plans.js');
    const { id } = P.create('Short day');
    P.setWeekday(2, id);
    P.edit({ plan: id }, P.blocksOf({ plan: id }).find((b) => b.kind === 'wake').id, { time: '07:30' });
  } });
  const ics = await ev(p, async () => {
    const I = await import('./js/domain/ics.js');
    return I.buildCalendar(I.reminderOptions('https://example.app/').flatMap((o) => o.events || [o.event]));
  });
  if (!/RRULE:FREQ=WEEKLY;BYDAY=TU/.test(ics) || !/BYDAY=MO,WE,TH,FR,SA,SU/.test(ics)) throw new Error('no per-plan morning events');
  await ctx.close();
});

await step('dark mode: Your days and a plan being edited', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { scheme: 'dark', hash: '#/plan/playbook', before: SHORT });
  await p.waitForSelector('.days-week');
  await p.locator('.days-plans .chip', { hasText: 'Short day' }).click();
  await p.waitForSelector('.days-plans .chip.is-active:has-text("Short day")');
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/day-plans-dark.png` });
  await ctx.close();
});

await finish();
