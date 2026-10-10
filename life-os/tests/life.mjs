// The owner's second list, end to end: your calendar in Your day and tasks into its free gaps,
// estimates that learn, energy check-ins, the morning briefing; bills paid into Money, savings and
// net worth, supplements with stock, the meal plan writing the grocery list, trips; takeaways in
// the morning check-in, the decision journal, the life wheel feeding a season, and the habit
// timeline. Each screen in light and dark.
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
const sheetGone = (p) => p.waitForSelector('.sheet-wrap', { state: 'detached' });
const ICS = ['BEGIN:VCALENDAR', 'VERSION:2.0',
  'BEGIN:VEVENT', 'UID:standup', 'SUMMARY:Team stand-up', 'DTSTART:20261013T110000', 'DTEND:20261013T113000', 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:lunch', 'SUMMARY:Lunch with Sam', 'DTSTART:20261013T130000', 'DTEND:20261013T140000', 'END:VEVENT',
  'BEGIN:VEVENT', 'UID:hol', 'SUMMARY:Public holiday', 'DTSTART;VALUE=DATE:20261013', 'DTEND;VALUE=DATE:20261014', 'END:VEVENT',
  'END:VCALENDAR', ''].join('\r\n');

await step('your calendar: an .ics file brings its events into Your day; a free gap takes a task at its time', async () => {
  const { ctx, p } = await at('2026-10-13T08:30:00', { hash: '#/plan/calendar' });
  await p.locator('[data-action="cal-add"]').first().click();
  await p.fill('.sheet [data-f="name"]', 'Work');
  await p.setInputFiles('.sheet input[type="file"]', { name: 'work.ics', mimeType: 'text/calendar', buffer: Buffer.from(ICS) });
  await sheetGone(p);
  await p.waitForSelector('[data-key="cals"] .row-title:has-text("Work")');
  await p.screenshot({ path: `${OUT}/life-calendar.png` });
  const n = await ev(p, () => window.__lifeos.store.all('calendarEvents').length);
  if (n < 10) throw new Error(`${n} events`);
  await ev(p, () => window.__lifeos.store.put('tasks', { id: 'tk1', title: 'Write the proposal', done: false, date: '2026-10-13', area: 'work', estimate: 45, order: 1 }));
  await go(p, '#/today', '.dstrip');
  await p.waitForSelector('.dstrip .ds-row.is-event:has-text("Team stand-up")');
  if (!(await p.textContent('.ds-allday')).includes('Public holiday')) throw new Error('no all-day line');
  await p.waitForSelector('.ds-gap');
  await p.locator('.ds-gap [data-action="gap-fill"]').first().click();
  await p.locator('.sheet [data-action="gap-pick"][data-id="tk1"]').click();
  await sheetGone(p);
  const tk = await ev(p, () => window.__lifeos.store.get('tasks', 'tk1'));
  if (!/^\d{2}:\d{2}$/.test(tk.time || '')) throw new Error(JSON.stringify(tk));
  await p.waitForSelector('.dstrip .ds-row.is-task:has-text("Write the proposal")');
  await p.screenshot({ path: `${OUT}/life-your-day.png`, fullPage: true });
  await ctx.close();
});

await step('estimates: the task sheet takes an estimate and what it took; four finished tasks teach the ratio', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { hash: '#/plan/tasks', before: () => {
    const s = window.__lifeos.store;
    [30, 60, 20, 40].forEach((e, i) => s.put('tasks', { id: `d${i}`, title: `Done ${i}`, done: true, doneAt: `2026-10-0${i + 1}T10:00:00Z`, estimate: e, spent: e * 2, area: 'work' }));
  } });
  await p.waitForSelector('[data-key="est-summary"]:has-text("100% longer")');
  await p.locator('[data-action="new"]').first().click();
  await p.fill('.sheet [data-input="title"]', 'Plan the offsite');
  await p.fill('.sheet [data-input="estimate"]', '30');
  await p.waitForSelector('.sheet [data-key="est-line"]:has-text("Likely 1 h")');
  await p.locator('.sheet [data-action="save"]').click();
  await sheetGone(p);
  const t1 = await ev(p, () => window.__lifeos.store.all('tasks').find((x) => x.title === 'Plan the offsite'));
  if (t1.estimate !== 30) throw new Error(JSON.stringify(t1));
  await ctx.close();
});

await step('energy: one tap logs it; the screen shows the curve', async () => {
  const { ctx, p } = await at('2026-10-13T10:15:00', { hash: '#/progress/energy' });
  await p.locator('.energy-btn[data-level="4"]').click();
  await p.waitForFunction(() => window.__lifeos.store.all('energyLogs').some((l) => l.level === 4 && l.time === '10:15'));
  await p.screenshot({ path: `${OUT}/life-energy.png` });
  await ctx.close();
});

await step('the morning briefing: on Today before noon, with what’s due; Got it puts it away for the day', async () => {
  const { ctx, p } = await at('2026-10-13T07:30:00', { before: () => {
    const s = window.__lifeos.store;
    s.put('bills', { id: 'b1', name: 'Electricity', amount: 2400, every: 'month', kind: 'bill', next: '2026-10-13', remindDays: 3 });
    s.put('supplements', { id: 's1', name: 'Vitamin D', kind: 'supplement', times: ['08:00'], perDose: 1, stock: 40, reorderDays: 7, order: 0 });
  } });
  await p.waitForSelector('[data-key="brief"]');
  const txt = await p.textContent('[data-key="brief"]');
  for (const x of ['Up at', 'Electricity due today', 'Vitamin D this morning']) if (!txt.includes(x)) throw new Error(`missing ${x}: ${txt}`);
  await p.screenshot({ path: `${OUT}/life-briefing.png` });
  await p.locator('[data-action="brief-done"]').click();
  await p.waitForSelector('[data-key="brief"]', { state: 'detached' });
  const r = await ev(p, async () => (await import('./js/domain/reminders.js')).candidates(new Date('2026-10-13T08:05:00')).find((c) => c.cat === 'supplements'));
  if (!r || !/Vitamin D/.test(r.body)) throw new Error(`no supplement reminder: ${JSON.stringify(r)}`);
  await ctx.close();
});

await step('bills: add one, mark it paid; the payment is in Money and the due date moves a month', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { hash: '#/plan/money/bills' });
  await p.locator('[data-action="bl-new"]').first().click();
  await p.fill('.sheet [data-f="name"]', 'Internet');
  await p.fill('.sheet [data-f="amount"]', '1500');
  await p.fill('.sheet [data-f="next"]', '2026-10-15');
  await p.locator('.sheet button[type="submit"]').click();
  await sheetGone(p);
  await p.locator('[data-action="bl-pay"]').first().click();
  const r = await ev(p, () => { const s = window.__lifeos.store; const b = s.all('bills')[0]; return { next: b.next, exp: s.all('expenses').find((e) => e.billId === b.id)?.amount }; });
  if (r.next !== '2026-11-15' || r.exp !== 1500) throw new Error(JSON.stringify(r));
  await p.screenshot({ path: `${OUT}/life-bills.png` });
  await ctx.close();
});

await step('net worth and a savings goal from their sheets', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { hash: '#/plan/money/worth' });
  await p.locator('[data-action="ac-new"]').first().click();
  await p.fill('.sheet [data-f="name"]', 'Current account');
  await p.fill('.sheet [data-f="amount"]', '85000');
  await p.locator('.sheet button[type="submit"]').click();
  await sheetGone(p);
  await p.locator('[data-action="sg-new"]').click();
  await p.fill('.sheet [data-f="name"]', 'Emergency fund');
  await p.fill('.sheet [data-f="target"]', '120000');
  await p.fill('.sheet [data-f="by"]', '2027-10-13');
  await p.locator('.sheet button[type="submit"]').click();
  await sheetGone(p);
  await p.waitForSelector('.money-total');
  if (!(await p.textContent('.savings-row')).includes('a month')) throw new Error('no monthly amount');
  await p.screenshot({ path: `${OUT}/life-worth.png`, fullPage: true });
  await ctx.close();
});

await step('supplements: a dose taken counts the stock down; running low makes a reorder task', async () => {
  const { ctx, p } = await at('2026-10-13T08:10:00', { hash: '#/progress/body/supplements', before: () => {
    window.__lifeos.store.put('supplements', { id: 's1', name: 'Creatine', kind: 'supplement', times: ['08:00'], perDose: 1, stock: 8, reorderDays: 7, order: 0 });
  } });
  await p.locator('[data-action="su-take"]').first().click();
  await p.waitForFunction(() => window.__lifeos.store.get('supplements', 's1').stock === 7);
  await p.waitForFunction(() => window.__lifeos.store.all('tasks').some((t) => t.source === 'supplement:s1'));
  await p.screenshot({ path: `${OUT}/life-supplements.png` });
  await ctx.close();
});

await step('meals: a recipe planned twice writes one grocery list with the amounts added up', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { hash: '#/plan/meals', before: () => {
    window.__lifeos.store.put('recipes', { id: 'r1', name: 'Chicken rice', servings: 2, protein: 45, ingredients: ['400 g chicken', '150 g rice'] });
  } });
  await p.locator('[data-action="mp-slot"][data-date="2026-10-13"][data-slot="lunch"]').click();
  await p.locator('.sheet [data-action="ms-pick"][data-id="r1"]').click();
  await sheetGone(p);
  await p.locator('[data-action="mp-slot"][data-date="2026-10-14"][data-slot="dinner"]').click();
  await p.locator('.sheet [data-action="ms-pick"][data-id="r1"]').click();
  await sheetGone(p);
  await p.locator('[data-action="mp-list"]').click();
  const items = await ev(p, () => window.__lifeos.store.get('lists', 'l-groceries-2026-10-12')?.items.map((i) => i.text));
  if (JSON.stringify(items) !== JSON.stringify(['chicken · 400 g', 'rice · 150 g'])) throw new Error(JSON.stringify(items));
  await p.screenshot({ path: `${OUT}/life-meals.png`, fullPage: true });
  await ctx.close();
});

await step('a trip: time off marks its days away, makes the packing list and the pack task', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { hash: '#/plan/trips' });
  await p.locator('[data-action="tr-new"]').first().click();
  await p.fill('.sheet [data-f="name"]', 'Paris');
  await p.fill('.sheet [data-f="from"]', '2026-10-20');
  await p.fill('.sheet [data-f="to"]', '2026-10-23');
  await p.locator('.sheet [data-action="tr-flag"][data-k="train"]').click();
  await p.locator('.sheet button[type="submit"]').click();
  await sheetGone(p);
  const r = await ev(p, () => { const s = window.__lifeos.store; const t = s.all('trips')[0]; return { mode: s.get('dailyReviews', '2026-10-21')?.mode, list: s.get('lists', t.packingListId)?.items.length, pack: s.all('tasks').find((x) => x.source === `trip:${t.id}`)?.date }; });
  if (r.mode !== 'away' || !(r.list > 10) || r.pack !== '2026-10-19') throw new Error(JSON.stringify(r));
  await p.screenshot({ path: `${OUT}/life-trips.png` });
  await ctx.close();
});

await step('a takeaway comes back in the morning check-in; answering it moves it out and on', async () => {
  const { ctx, p } = await at('2026-10-13T06:30:00', { before: () => {
    window.__lifeos.store.put('takeaways', { id: 'tk', text: 'Make it obvious', source: '', box: 0, due: '2026-10-13', seen: 0, retired: false });
  } });
  await ev(p, async () => (await import('./js/screens/ritual.js')).openRitual?.('morning'));
  if (!(await p.locator('.sheet .ritual').count())) {
    await p.locator('[data-action="ritual"][data-which="morning"]').first().click();
  }
  for (let i = 0; i < 6 && !(await p.locator('.ritual[data-step="recall"]').count()); i++) await p.locator('[data-action="r-skip"]').click();
  await p.waitForSelector('.ritual[data-step="recall"] .takeaway-text:has-text("Make it obvious")');
  await p.locator('.ritual [data-action="tk-answer"][data-how="used"]').click();
  await p.waitForSelector('.ritual[data-step="start"]');
  const tk = await ev(p, () => window.__lifeos.store.get('takeaways', 'tk'));
  if (tk.box !== 2 || tk.due !== '2026-10-20') throw new Error(JSON.stringify(tk));
  await ctx.close();
});

await step('decisions: written down, then due for review three months on from Review', async () => {
  const { ctx, p } = await at('2026-10-13T20:00:00', { hash: '#/reflect/decisions', before: () => {
    window.__lifeos.store.put('decisions', { id: 'dc1', date: '2026-07-01', title: 'Take the new role', why: 'Growth', expect: 'More scope', confidence: 4, reviewOn: '2026-09-29' });
  } });
  await p.locator('[data-action="dc-review"][data-id="dc1"]').first().click();
  await p.locator('.sheet [data-action="dr-out"][data-v="better"]').click();
  await p.locator('.sheet [data-action="dr-q"][data-v="good"]').click();
  await p.locator('.sheet [data-action="dr-save"]').click();
  await sheetGone(p);
  if ((await ev(p, () => window.__lifeos.store.get('decisions', 'dc1').review?.outcome)) !== 'better') throw new Error('not reviewed');
  await p.locator('[data-action="dc-new"]').first().click();
  await p.fill('.sheet [data-f="title"]', 'Move to the coast');
  await p.locator('.sheet button[type="submit"]').click();
  await sheetGone(p);
  const d = await ev(p, () => window.__lifeos.store.all('decisions').find((x) => x.title === 'Move to the coast'));
  if (d.reviewOn !== '2027-01-11') throw new Error(d.reviewOn);
  await ctx.close();
});

await step('the life wheel: eight ratings, the weakest becomes the next season’s focus', async () => {
  const { ctx, p } = await at('2026-10-13T20:00:00', { hash: '#/reflect/wheel' });
  const areas = ['health', 'mind', 'spirit', 'relationships', 'work', 'money', 'fun', 'home'];
  for (const a of areas) await p.locator(`[data-action="wh-rate"][data-a="${a}"][data-n="${a === 'fun' ? 3 : 7}"]`).click();
  await p.waitForSelector('[data-key="wheel-focus"]:has-text("Fun & rest · 3 of 10")');
  await p.screenshot({ path: `${OUT}/life-wheel.png`, fullPage: true });
  await p.locator('[data-action="wh-season"]').click();
  await p.waitForSelector('.sheet .season-new');
  if (!(await p.inputValue('.sheet [data-input="sn-name"]')).startsWith('Fun')) throw new Error('season not prefilled');
  await ctx.close();
});

await step('the habit timeline: a habit in focus says the day it’s on, against the usual 66', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { hash: '#/plan/habits/h-prayer', before: () => {
    const s = window.__lifeos.store;
    s.update('habits', 'h-prayer', { state: 'focus', focusSince: '2026-09-21' });
  } });
  await p.waitForSelector('[data-key="timeline"]:has-text("Day 23 of about 66")');
  await ctx.close();
});

await step('dark mode: Your day with the calendar, the briefing, the wheel and the meals', async () => {
  const { ctx, p } = await at('2026-10-13T08:30:00', { scheme: 'dark', before: async (ics) => {
    const I = await import('./js/domain/ics-import.js');
    await I.addCalendar({ name: 'Work', text: ics });
    const s = window.__lifeos.store;
    s.put('bills', { id: 'b1', name: 'Electricity', amount: 2400, every: 'month', kind: 'bill', next: '2026-10-13', remindDays: 3 });
  }, arg: ICS });
  await p.waitForSelector('[data-key="brief"]');
  await p.waitForSelector('.dstrip .ds-row.is-event');
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/life-dark-today.png`, fullPage: true });
  await go(p, '#/plan/meals', '.meal-week');
  await p.screenshot({ path: `${OUT}/life-dark-meals.png` });
  await ctx.close();
});

await finish();
