// Phase 12: text that fits a small phone, drag to reorder, workouts you build, a moodboard on
// Today, limits that became settings, and the new everyday tools (focus timer, lists, money, dates).
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';

async function at(clock, { scheme = 'light', demo = false, install = false, viewport } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme, reducedMotion: 'reduce', ...(viewport ? { viewport } : {}) });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on('pageerror', (e) => errors.push(`${clock}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${clock}: console: ${m.text()}`); });
  if (install) await p.clock.install({ time: new Date(clock) });
  else await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + '#/today');
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  if (demo) {
    await p.evaluate(async () => { const D = await import('./js/data/demo.js'); await D.loadDemo(60); });
    await p.reload();
    await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  }
  await p.waitForSelector('.today .now');
  return { ctx, p };
}
const go = (p, hash) => p.evaluate((h) => { location.hash = h; }, hash);
const ev = (p, fn, arg) => p.evaluate(fn, arg);
/** Drag a handle onto another element, in small steps like a finger. */
async function drag(p, handle, onto, { above = true } = {}) {
  const a = await handle.boundingBox();
  const b = await onto.boundingBox();
  const x = a.x + a.width / 2, y0 = a.y + a.height / 2;
  const y1 = above ? b.y + 6 : b.y + b.height - 6;
  await p.mouse.move(x, y0);
  await p.mouse.down();
  for (let k = 1; k <= 12; k++) await p.mouse.move(x, y0 + ((y1 - y0) * k) / 12);
  await p.mouse.up();
  await p.waitForTimeout(400);
}

await step('at 360 px the score line, the tiles and Other habits each sit on one line', async () => {
  const { ctx, p } = await at('2026-10-07T13:00:00', { demo: true, viewport: { width: 360, height: 740 } });
  await p.waitForSelector('.more-head');
  const m = await p.evaluate(() => {
    const lines = (el) => { const r = document.createRange(); r.selectNodeContents(el); return new Set([...r.getClientRects()].map((x) => Math.round(x.top))).size; };
    return {
      main: lines(document.querySelector('.now-meta-main')),
      week: document.querySelector('.now-week') ? lines(document.querySelector('.now-week')) : 1,
      more: lines(document.querySelector('.more-meta')) + lines(document.querySelector('.more-title')),
      pins: [...document.querySelectorAll('.pin-val, .pin-label')].filter((e) => e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent),
      wide: document.documentElement.scrollWidth - innerWidth,
    };
  });
  if (m.main !== 1 || m.week !== 1) throw new Error(`score line wraps: ${JSON.stringify(m)}`);
  if (m.more !== 2) throw new Error(`Other habits wraps: ${JSON.stringify(m)}`);
  if (m.pins.length) throw new Error('tiles clip: ' + m.pins);
  if (m.wide > 1) throw new Error(`page ${m.wide}px too wide`);
  await p.screenshot({ path: `${OUT}/p12-360-today.png` });
  await ctx.close();
});

await step('drag to reorder: Top 3 by finger, Edit Today by keyboard (focus stays on the handle)', async () => {
  const { ctx, p } = await at('2026-10-07T13:00:00');
  const ins = p.locator('.top3-input');
  for (const [i, v] of ['Alpha', 'Bravo', 'Charlie'].entries()) { await ins.nth(i).fill(v); await ins.nth(i).press('Enter'); }
  await p.evaluate(() => { document.activeElement.blur(); document.querySelector('.prio').scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(300);
  await drag(p, p.locator('.top3-item [data-drag]').nth(2), p.locator('.top3-item').first());
  const titles = await ev(p, async () => { const T = await import('./js/domain/tasks.js'); return T.slots('2026-10-07').map((x) => x?.title).join(','); });
  if (titles !== 'Charlie,Alpha,Bravo') throw new Error('after drag: ' + titles);
  await p.locator('[data-action="edit-today"]').click();
  await p.waitForSelector('.sheet .edit-today');
  await p.locator('.sheet [data-key="et-more"] [data-drag]').focus();
  await p.keyboard.press('Home');
  await p.waitForFunction(() => document.querySelector('.sheet .et-list > :first-child')?.dataset.key === 'et-more');
  if (!(await p.evaluate(() => document.activeElement?.closest('[data-key="et-more"]')))) throw new Error('focus left the handle');
  const order = await ev(p, () => window.__lifeos.store.settings().todayLayout.order[0]);
  if (order !== 'more') throw new Error('layout ' + order);
  await ctx.close();
});

await step('a workout from scratch: name, exercises, order, sets and rest, then a session that follows it', async () => {
  const { ctx, p } = await at('2026-10-07T07:00:00');
  await go(p, '#/plan/training');
  await p.locator('.block-head [data-action="new-tpl"]').click();
  await p.waitForSelector('[data-change="name"]');
  await p.fill('[data-change="name"]', 'Push day');
  await p.press('[data-change="name"]', 'Enter');
  await p.locator('[data-action="add"]').click();
  await p.waitForSelector('.sheet [data-action="pick"]');
  for (const name of ['Push-up', 'Pike push-up', 'Plank']) await p.locator('.sheet [data-action="pick"]').filter({ has: p.locator('.food-name', { hasText: new RegExp(`^${name}$`) }) }).click();
  await p.locator('.sheet [data-action="done"]').click();
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  const names = () => p.$$eval('.sort-list .row-title', (a) => a.map((x) => x.textContent).join('|'));
  if ((await names()) !== 'Push-up|Pike push-up|Plank') throw new Error('items ' + await names());
  await drag(p, p.locator('.sort-list [data-drag]').nth(2), p.locator('.sort-list .sort-row').first());
  if ((await names()) !== 'Plank|Push-up|Pike push-up') throw new Error('after drag ' + await names());
  await p.locator('.sort-list [data-action="item"]').filter({ has: p.locator('.row-title', { hasText: /^Push-up$/ }) }).click();
  await p.locator('.sheet [data-action="sets"][data-d="1"]').click();
  await p.locator('.sheet [data-action="rest"][data-v="120"]').click();
  await p.keyboard.press('Escape');
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  await p.screenshot({ path: `${OUT}/p12-workout-editor.png`, fullPage: true });
  const id = await p.evaluate(() => location.hash.split('/').pop());
  await p.locator('.page-actions [data-action="start"]').click();
  await p.waitForSelector('.ex-card');
  await p.evaluate(() => document.querySelector('.ex-list').scrollIntoView({ block: 'start' }));
  const sets = await ev(p, async () => { const F = await import('./js/domain/fitness.js'); return F.setsOf(F.activeWorkout().id).map((s) => `${s.order}:${s.rest ?? '-'}`).join(','); });
  if (!sets.includes('1:120') || sets.split(',').filter((x) => x.startsWith('1:')).length !== 4) throw new Error('sets ' + sets);
  // Exercises reorder in the session too, and the session becomes a workout of its own.
  await drag(p, p.locator('.ex-card [data-drag]').nth(1), p.locator('.ex-card').first());
  const first = await p.textContent('.ex-card .ex-name');
  if (first !== 'Push-up') throw new Error('session order: ' + first);
  await p.locator('[data-action="menu"]').click();
  await p.locator('.sheet [data-action="as-template"]').click();
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  const count = await ev(p, async () => (await import('./js/domain/fitness.js')).templates().filter((x) => x.name === 'Push day').length);
  if (count !== 2) throw new Error('saved as workout: ' + count);
  // Delete with Undo; the plan days that used it are cleared and come back.
  await ev(p, (tid) => window.__lifeos.store.setProfile({ plan: { ...window.__lifeos.store.profile().plan, 2: tid } }), id);
  await go(p, `#/plan/training/workouts/${id}`);
  await p.locator('[data-action="delete"]').click();
  await p.waitForSelector('.toast [data-toast-action], .toast button');
  if ((await ev(p, () => window.__lifeos.store.profile().plan[2])) !== null) throw new Error('plan not cleared');
  await p.locator('.toast button', { hasText: 'Undo' }).click();
  if ((await ev(p, () => window.__lifeos.store.profile().plan[2])) !== id) throw new Error('undo did not restore the plan');
  await ctx.close();
});

await step('moodboard: five pictures at most, a collage on Today that survives redraws, in every backup', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00');
  // Six small test pictures drawn on a canvas in the page.
  const pngs = await p.evaluate(async () => Promise.all(['#1B2A38', '#43617A', '#22808A', '#DADDE0', '#0D141F', '#0071E3'].map(async (c, i) => {
    const cv = document.createElement('canvas'); cv.width = 400 + i * 40; cv.height = 300;
    const g = cv.getContext('2d'); g.fillStyle = c; g.fillRect(0, 0, cv.width, cv.height);
    const b = await new Promise((r) => cv.toBlob(r, 'image/png'));
    return [...new Uint8Array(await b.arrayBuffer())];
  })));
  await go(p, '#/plan/moodboard');
  await p.waitForSelector('input[data-change="mb-file"]', { state: 'attached' });
  await p.locator('input[data-change="mb-file"]').first().setInputFiles(pngs.map((b, i) => ({ name: `m${i}.png`, mimeType: 'image/png', buffer: Buffer.from(b) })));
  await p.waitForSelector('.toast:has-text("holds five")');
  const n = await ev(p, () => window.__lifeos.store.settings().moodboard.length);
  if (n !== 5) throw new Error(`${n} on the board`);
  await go(p, '#/today');
  await p.waitForSelector('.mb.mb--5 img[src]');
  await p.waitForFunction(() => [...document.querySelectorAll('.mb img')].every((i) => i.getAttribute('src')));
  await ev(p, () => window.__lifeos.store.setSettings({ touched: Date.now() }));
  await p.waitForTimeout(300);
  const kept = await p.$$eval('.mb img', (a) => a.filter((i) => i.getAttribute('src')).length);
  if (kept !== 5) throw new Error(`${kept} pictures after a redraw`);
  const blobs = await ev(p, async () => ((await (await import('./js/data/backup.js')).buildBackup({})).data.photoBlobs || []).filter((b) => b.id.startsWith('mb-')).length);
  if (blobs !== 5) throw new Error(`${blobs} pictures in the backup`);
  // Remove one with Undo, from Edit.
  await go(p, '#/plan/moodboard');
  await p.locator('[data-action="edit"]').click();
  await p.locator('[data-action="mb-remove"]').first().click();
  if ((await ev(p, () => window.__lifeos.store.settings().moodboard.length)) !== 4) throw new Error('remove');
  await p.locator('.toast button', { hasText: 'Undo' }).click();
  if ((await ev(p, () => window.__lifeos.store.settings().moodboard.length)) !== 5) throw new Error('undo');
  await ctx.close();
});

await step('focus timer: start 25 minutes, the pill follows you, and the block counts when time is up', async () => {
  const { ctx, p } = await at('2026-10-07T10:00:00', { install: true });
  await go(p, '#/progress/areas/work');
  await p.locator('[data-action="focus"]').click();
  await p.locator('.sheet [data-input="label"]').fill('Proposal');
  await p.locator('.sheet [data-action="start"]').click();
  await p.waitForSelector('.focus-bar .focus-bar-time');
  await go(p, '#/plan');
  await p.waitForTimeout(300);
  if (!(await p.locator('.focus-bar').count())) throw new Error('pill gone after navigating');
  await p.clock.fastForward('25:05');
  await p.waitForSelector('.toast:has-text("Focus block done")');
  const r = await ev(p, () => window.__lifeos.store.get('dailyReviews', '2026-10-07'));
  if (r?.deepWork !== 1 || r.focusMinutes !== 25) throw new Error('logged ' + JSON.stringify(r));
  if (await p.locator('.focus-bar').count()) throw new Error('pill still showing');
  await ctx.close();
});

await step('lists, money and dates: everyday tools in Plan, with Coming up on Today', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00');
  await go(p, '#/plan/lists');
  await p.locator('[data-action="starter"][data-name="Groceries"]').click();
  await p.waitForSelector('[data-change="add"]');
  // Paste three lines at once: three items.
  await p.locator('[data-change="add"]').focus();
  await p.evaluate(() => { const dt = new DataTransfer(); dt.setData('text/plain', 'Eggs\nMilk\nBread'); document.activeElement.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); });
  await p.waitForSelector('.li-row >> nth=2');
  await p.locator('.li-row [data-action="tick"]').first().click();
  await p.waitForSelector('.block-head:has-text("Ticked")');
  await p.locator('[data-action="clear"]').click();
  await p.waitForFunction(() => !document.querySelector('.li-row.is-done'));
  const left = await p.$$eval('.li-row .li-text', (a) => a.map((x) => x.value).join(','));
  if (left !== 'Milk,Bread') throw new Error('list ' + left);
  // Money: a budget, then one entry.
  await go(p, '#/plan/money');
  await p.locator('.money-hero [data-action="settings"]').click();
  await p.fill('.sheet [data-change="budget"]', '20000');
  await p.press('.sheet [data-change="budget"]', 'Tab');
  await p.fill('.sheet [data-change="currency"]', 'MUR');
  await p.press('.sheet [data-change="currency"]', 'Tab');
  await p.keyboard.press('Escape');
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  await p.locator('.page-actions [data-action="add"]').click();
  await p.fill('.sheet input[name="amount"]', '1250');
  await p.locator('.sheet [data-action="cat"][data-id="groceries"]').click();
  await p.fill('.sheet input[name="note"]', 'Weekly shop');
  await p.locator('.sheet button[type="submit"]').click();
  await p.waitForFunction(() => /1,250/.test(document.querySelector('.money-total')?.textContent || ''));
  const money = await p.textContent('.money-hero');
  if (!/1,250/.test(money) || !/18,750/.test(money)) throw new Error('money ' + money);
  await p.screenshot({ path: `${OUT}/p12-money.png` });
  // Dates: a birthday in five days, on Today.
  await go(p, '#/plan/dates');
  await p.locator('[data-action="new"]').first().click();
  await p.fill('.sheet input[name="title"]', 'Mum');
  await p.fill('.sheet input[name="date"]', '1965-10-12');
  await p.locator('.sheet button[type="submit"]').click();
  await p.waitForSelector('.row-title:has-text("Mum turns 61")');
  await go(p, '#/today');
  await p.waitForSelector('.soon-row:has-text("Mum turns 61")');
  await ctx.close();
});

await step('limits became settings: four in focus, your own steps target, lb for lifts, any pledge length', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00');
  await go(p, '#/you/settings');
  await p.locator('[data-action="focus-limit"][data-value="4"]').click();
  await p.fill('[data-change="steps"]', '10000');
  await p.press('[data-change="steps"]', 'Tab');
  await p.locator('[data-action="unit"][data-value="lb"]').click();
  const s = await ev(p, () => ({ limit: window.__lifeos.store.settings().focusLimit, steps: window.__lifeos.store.get('habits', 'h-steps') }));
  if (s.limit !== 4 || s.steps.target !== 10000 || s.steps.ramp) throw new Error(JSON.stringify(s).slice(0, 200));
  await go(p, '#/plan/habits/sort');
  await p.waitForSelector('.page-title:has-text("Choose your four")');
  await go(p, '#/plan/commitments');
  await p.locator('[data-action="pg-new"]').first().click();
  await p.locator('.sheet [data-action="pg-days"][data-value="custom"]').click();
  await p.fill('.sheet [data-change="pg-n"]', '21');
  await p.press('.sheet [data-change="pg-n"]', 'Tab');
  await p.waitForSelector('.sheet .field-hint:has-text("Oct 27")');
  await p.keyboard.press('Escape');
  // A session shows loads in lb.
  await ev(p, async () => (await import('./js/screens/workout-actions.js')).startWorkout('t-upper', '2026-10-07'));
  await p.waitForSelector('.ex-card');
  // The weight column is headed in lb (or +lb for bodyweight work).
  if (!(await p.locator('.wset-row--head span', { hasText: /^\+?lb$/ }).count())) throw new Error('loads not in lb');
  await ctx.close();
});

await step('dark mode: the new screens', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { scheme: 'dark', demo: true });
  for (const [hash, name] of [['#/plan/lists/demo-groceries', 'list'], ['#/plan/money', 'money'], ['#/plan/dates', 'dates'], ['#/plan/training', 'training']]) {
    await go(p, hash);
    await p.waitForTimeout(700);
    await t.a11y(`dark ${name}`);
    await p.screenshot({ path: `${OUT}/p12-dark-${name}.png` });
  }
  await ctx.close();
});

await finish();
