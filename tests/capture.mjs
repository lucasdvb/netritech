// Phase 4: capture and logging. One line in the + sheet, read back before saving; hold and swipe
// on habit rows with real touch input; the number pad; Undo that restores exactly; every gesture
// with a visible, labelled alternative.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';
const DAY = '2026-10-07';

async function at(clock, { scheme = 'light', device = devices['iPhone 14'] } = {}) {
  const ctx = await browser.newContext({ ...device, colorScheme: scheme });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on('pageerror', (e) => errors.push(`${clock}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${clock}: console: ${m.text()}`); });
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + '#/today');
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.waitForSelector('.today .now');
  await p.waitForTimeout(400);
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const capture = async (p, text) => {
  await p.waitForSelector('.sheet-wrap.is-closing', { state: 'detached' });
  if (!(await p.locator('.cap-input').count())) { await p.locator('.tab--capture').click(); await p.waitForSelector('.cap-input'); }
  await p.locator('.cap-input').fill(text);
  await p.waitForSelector('.cap-preview');
};
const metric = (p, fn, arg) => ev(p, async ([f, a]) => (await import('./js/domain/metrics.js'))[f](a), [fn, arg]);

// Real touch input through CDP, so pointer events, touch-action and timing behave as on a phone.
async function touch(p, sel, { dx = 0, hold = 0 } = {}) {
  await p.locator(sel).first().evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(150);
  const box = await p.locator(sel).first().boundingBox();
  if (!box) throw new Error(`no ${sel}`);
  const cdp = await p.context().newCDPSession(p);
  const x = box.x + box.width * 0.6, y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  if (hold) await p.waitForTimeout(hold);
  const steps = 8;
  if (dx) for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (dx * i) / steps, y }] });
    await p.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

await step('a line is read back before saving, and Undo takes it away', async () => {
  const { ctx, p } = await at(`${DAY}T13:00:00`);
  await capture(p, 'water 750');
  const txt = await p.textContent('.cap-preview');
  if (!/Water/.test(txt) || !/750 ml/.test(txt)) throw new Error('preview ' + txt);
  if ((await metric(p, 'waterMl', DAY)) !== 0) throw new Error('saved before confirming');
  await p.screenshot({ path: `${OUT}/p4-capture-preview.png` });
  await p.locator('.cap-input').press('Enter');
  await p.waitForSelector('.toast-btn:has-text("Undo")');
  if ((await metric(p, 'waterMl', DAY)) !== 750) throw new Error('not saved');
  await p.locator('.toast-btn', { hasText: 'Undo' }).click();
  await p.waitForFunction(async () => (await import('./js/domain/metrics.js')).waterMl('2026-10-07') === 0);
  await ctx.close();
});

await step('tasks get their day, several logs go in one line, and ambiguity asks', async () => {
  const { ctx, p } = await at(`${DAY}T13:00:00`);
  await capture(p, 'call mum friday');
  if (!(await p.textContent('.cap-day')).includes('Fri 9 Oct')) throw new Error('day ' + await p.textContent('.cap-day'));
  await p.locator('.cap-input').press('Enter');
  await p.waitForSelector('.toast:has-text("Task added")');
  const task = await ev(p, () => window.__lifeos.store.all('tasks').find((x) => x.title === 'Call mum'));
  if (task?.date !== '2026-10-09') throw new Error('task ' + JSON.stringify(task));
  await capture(p, '2 fruit and 3 veg');
  if ((await p.locator('.cap-preview .cap-item').count()) !== 2) throw new Error('two items expected');
  await p.locator('.cap-actions .btn--primary').click();
  await p.waitForSelector('.toast:has-text("Logged 2 things")');
  const n = await metric(p, 'nutrition', DAY);
  if (n.fruit !== 2 || n.veg !== 3) throw new Error('produce ' + JSON.stringify(n));
  // "chicken" could be two foods: Enter saves nothing; a choice does.
  const protein = n.protein;
  await capture(p, 'chicken');
  await p.waitForSelector('.cap-item--pick');
  await p.locator('.cap-input').press('Enter');
  await p.waitForTimeout(200);
  if ((await metric(p, 'nutrition', DAY)).protein !== protein) throw new Error('an ambiguous line was saved');
  await p.screenshot({ path: `${OUT}/p4-capture-ask.png` });
  await p.locator('.cap-item--pick').first().click();
  await p.waitForFunction(async (before) => (await import('./js/domain/metrics.js')).nutrition('2026-10-07').protein === before + 46, protein);
  await ctx.close();
});

await step('suggestions complete what you type; things logged elsewhere open there', async () => {
  const { ctx, p } = await at(`${DAY}T13:00:00`);
  await p.locator('.tab--capture').click();
  await p.locator('.cap-input').fill('wa');
  await p.waitForSelector('.cap-sugs .chip');
  await p.locator('.cap-sugs .chip', { hasText: 'water 500 ml' }).click();
  if ((await p.inputValue('.cap-input')) !== 'water 500 ml') throw new Error('suggestion not filled');
  await capture(p, 'journal');
  await p.locator('.cap-actions .btn--primary').click();
  await p.waitForFunction(() => location.hash.includes('reflect/journal'));
  await ctx.close();
});

await step('swipe a habit left for "not today", Undo, and bring it back from the line', async () => {
  const { ctx, p } = await at(`${DAY}T07:05:00`);
  const row = '[data-key="r-r-morning"] .rstep[data-habit="h-prayer"]';
  await p.waitForSelector(row);
  await touch(p, row, { dx: -180 });
  await p.waitForSelector('.toast:has-text("Prayer: not today")');
  await p.waitForSelector(row, { state: 'detached' });
  await p.waitForSelector('.nottoday .chip:has-text("Prayer")');
  await p.locator('.toast-btn', { hasText: 'Undo' }).click();
  await p.waitForSelector(row, { state: 'attached' }).catch(() => { throw new Error('Undo did not bring the row back'); });
  if (await p.locator('.nottoday').count()) throw new Error('Undo left it set aside');
  // a short swipe springs back and changes nothing
  await touch(p, row, { dx: -50 });
  await p.waitForTimeout(400);
  if (!(await p.locator(row).count())) throw new Error('a short swipe removed the row');
  if (await p.locator('.nottoday').count()) throw new Error('a short swipe set it aside');
  // the chip brings it back
  await touch(p, row, { dx: -180 });
  await p.waitForSelector('.nottoday .chip');
  await p.screenshot({ path: `${OUT}/p4-not-today.png`, fullPage: true });
  await p.locator('.nottoday .chip', { hasText: 'Prayer' }).click();
  await p.waitForSelector(row, { state: 'attached' }).catch(() => { throw new Error('the chip did not bring it back'); });
  // scrolling vertically over a row never sets it aside
  await touch(p, row, { dx: 0 });
  await ctx.close();
});

await step('hold: the tiny version in one hold; numbers open the pad with the last value', async () => {
  const { ctx, p } = await at(`${DAY}T07:05:00`);
  const id = await ev(p, async () => { const H = await import('./js/domain/habits.js'); return (await import('./js/domain/routines.js')).progress((await import('./js/domain/routines.js')).routine('r-morning')).steps.find((s) => s.kind === 'habit' && H.tinyOf(s.habit) && !s.habit.source && s.habit.type !== 'check')?.habit.id; });
  if (!id) throw new Error('no habit with a tiny version in the morning');
  await touch(p, `.rstep[data-habit="${id}"]`, { hold: 650 });
  await p.waitForSelector('.toast:has-text("tiny version")');
  const lv = await ev(p, async (hid) => { const H = await import('./js/domain/habits.js'); return H.level(H.habit(hid), '2026-10-07'); }, id);
  if (lv !== 'tiny') throw new Error('level ' + lv);
  await p.locator('.toast-btn', { hasText: 'Undo' }).click();
  await p.waitForFunction(async (hid) => { const H = await import('./js/domain/habits.js'); return !H.level(H.habit(hid), '2026-10-07'); }, id);
  // a habit that counts something: the pad, prefilled with the last value
  await ev(p, () => {
    const { store } = window.__lifeos;
    store.put('habits', { id: 'h-pushups', name: 'Push-ups', type: 'quantity', unit: 'reps', target: 50, step: 5, section: 'life', category: 'body', icon: 'dumbbell', schedule: { kind: 'daily' }, state: 'focus', focusSince: '2026-09-01', order: 99 });
    store.put('habitLogs', { id: 'h-pushups:2026-10-06', habitId: 'h-pushups', date: '2026-10-06', value: 40 });
  });
  const row = '.hrow[data-habit="h-pushups"]';
  await p.waitForSelector(row);
  await touch(p, row, { hold: 650 });
  await p.waitForSelector('.numpad');
  if (!(await p.textContent('.numpad-value')).includes('40')) throw new Error('not prefilled: ' + await p.textContent('.numpad-value'));
  await p.screenshot({ path: `${OUT}/p4-numpad.png` });
  for (const k of ['4', '5']) await p.locator(`.numpad-key[data-k="${k}"]`).click();
  await p.locator('.numpad-step[data-dir="1"]').click();
  await p.locator('[data-action="np-save"]').click();
  await p.waitForSelector('.toast:has-text("Push-ups · 50 reps")');
  const v = await ev(p, () => window.__lifeos.store.get('habitLogs', 'h-pushups:2026-10-07')?.value);
  if (v !== 50) throw new Error('value ' + v);
  await p.locator('.toast-btn', { hasText: 'Undo' }).click();
  await p.waitForFunction(() => !window.__lifeos.store.get('habitLogs', 'h-pushups:2026-10-07'));
  await ctx.close();
});

await step('weight on the number pad: last value prefilled, keyboard works, Undo restores', async () => {
  const { ctx, p } = await at(`${DAY}T07:05:00`, { device: { viewport: { width: 1280, height: 860 } } });
  await ev(p, () => window.__lifeos.store.put('weightEntries', { id: '2026-10-06', date: '2026-10-06', kg: 76.2 }));
  await p.keyboard.press('n');
  await p.waitForSelector('.cap-input');
  await p.locator('[data-action="weight"]').click();
  await p.waitForSelector('.numpad');
  if (!(await p.textContent('.numpad-value')).includes('76.2')) throw new Error('weight not prefilled');
  await p.keyboard.type('75.8');
  await p.keyboard.press('Enter');
  await p.waitForSelector('.toast:has-text("Weight · 75.8 kg")');
  if ((await metric(p, 'weight', DAY)) !== 75.8) throw new Error('weight not saved');
  await p.locator('.toast-btn', { hasText: 'Undo' }).click();
  await p.waitForFunction(async () => (await import('./js/domain/metrics.js')).weight('2026-10-07') == null);
  await ctx.close();
});

await step('every gesture has a visible, labelled alternative in the habit sheet', async () => {
  const { ctx, p } = await at(`${DAY}T07:05:00`);
  await p.locator('.rstep[data-habit="h-prayer"] .rstep-main').click();
  await p.waitForSelector('.sheet [data-action="skip"]');
  await p.locator('.sheet [data-action="skip"]').click();
  await p.waitForSelector('.toast:has-text("Prayer: not today")');
  await p.waitForSelector('.nottoday .chip[aria-label="Bring back Prayer"]');
  // labels for everything you can press in the capture sheet and the pad
  await p.locator('.tab--capture').click();
  await p.waitForSelector('.cap-input');
  const label = await p.getAttribute('.cap-input', 'aria-label');
  if (!label) throw new Error('capture field has no label');
  const live = await p.getAttribute('#cap-live', 'aria-live');
  if (live !== 'polite') throw new Error('what was understood is not announced');
  await p.locator('.cap-input').fill('slept 7h');
  await p.waitForSelector('.cap-preview');
  const unlabeled = await p.evaluate(() => [...document.querySelectorAll('.sheet button')].filter((b) => !b.textContent.trim() && !b.getAttribute('aria-label')).length);
  if (unlabeled) throw new Error(`${unlabeled} unlabeled buttons in the capture sheet`);
  await ctx.close();
});

await step('dark mode: capture, the pad and "not today"', async () => {
  const { ctx, p } = await at(`${DAY}T07:05:00`, { scheme: 'dark' });
  await capture(p, 'ran 5k in 28 min');
  await p.screenshot({ path: `${OUT}/p4-capture-dark.png` });
  await p.keyboard.press('Escape');
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  await touch(p, '.rstep[data-habit="h-prayer"]', { dx: -180 });
  await p.waitForSelector('.nottoday');
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/p4-today-dark.png`, fullPage: true });
  await ctx.close();
});

await finish();
