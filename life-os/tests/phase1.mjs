// Phase 1: the habit system. Choose your three, tiny versions, runs with grace, the score
// that explains itself, three-question creation, pausing and graduation.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const OUT = process.argv[3] || './test-shots';
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { page, step, shot, go, a11y, finish, base, browser } = t;

const ev = (fn, arg) => page.evaluate(fn, arg);
const state = () => ev(() => {
  const { store } = window.__lifeos;
  const hs = store.all('habits').filter((h) => !h.archived);
  return { habits: store.all('habits').length, logs: store.all('habitLogs').length,
    focus: hs.filter((h) => h.state === 'focus').map((h) => h.id), queue: hs.filter((h) => h.state === 'queue').map((h) => h.id) };
});
const todayISO = () => ev(async () => (await import('./js/domain/dates.js')).today());

await step('a fresh start asks you to choose your three, and nothing is counted yet', async () => {
  await go('#/today', '.today');
  await page.waitForSelector('.choose3');
  const hero = await page.textContent('.hero-big');
  if (!hero.includes('Nothing planned yet')) throw new Error('hero: ' + hero);
  if ((await state()).focus.length) throw new Error('habits in focus before choosing');
  await shot('p1-01-today-choose');
});

let before;
await step('the sort suggests three, saves them, and loses nothing', async () => {
  before = await state();
  await page.locator('.choose3 [data-to="plan/habits/sort"]').click();
  await page.waitForSelector('[data-view="habit-sort"] .sort-slot');
  const filled = await page.locator('.sort-slot:not(.is-empty)').count();
  if (filled !== 3) throw new Error(`${filled} suggestions`);
  await a11y('sort');
  await shot('p1-02-sort');
  // a fourth focus is refused, kindly
  const extra = page.locator('.sort-row .sort-opt[data-state="focus"]:not(.is-on)').first();
  await extra.click();
  await page.waitForSelector('.toast');
  if ((await page.locator('.sort-slot:not(.is-empty)').count()) !== 3) throw new Error('a fourth habit got in');
  // send one optional habit to Later, then save
  await page.locator('.sort-row[data-key="h-desk"] .sort-opt[data-state="queue"]').click();
  await page.locator('[data-action="save"]').click();
  await page.waitForSelector('.today .focus3');
  const after = await state();
  if (after.habits !== before.habits || after.logs !== before.logs) throw new Error(`counts ${JSON.stringify(before)} → ${JSON.stringify(after)}`);
  if (after.focus.length !== 3) throw new Error('focus ' + after.focus);
  if (!after.queue.includes('h-desk')) throw new Error('queue ' + after.queue);
});

await step('Today shows at most three focus habits, and none of them twice', async () => {
  const s = await state();
  const inFocus = await page.locator('.focus3 [data-key^="h-"], .focus3 [data-key^="tile-h-"]').count();
  if (inFocus > 3) throw new Error(`${inFocus} habits in Your three`);
  for (const id of s.focus) {
    if (await page.locator(`.hsec [data-key="${id}"], .hsec [data-key="tile-${id}"]`).count()) throw new Error(`${id} also in a group`);
  }
  if (await page.locator('.hsec [data-key="h-desk"]').count()) throw new Error('a habit waiting in Later is on Today');
  await shot('p1-03-today-three');
});

await step('a tiny version counts, and the score says so', async () => {
  const tiny = page.locator('.focus3 .tiny-btn').first();
  if (!(await tiny.count())) throw new Error('no tiny button');
  const id = await tiny.getAttribute('data-id');
  await tiny.click();
  await page.waitForSelector(`.focus3 [data-key="${id}"] .check--tiny`);
  const hero = await page.textContent('.hero-big');
  if (!/1\s*tiny/.test(hero)) throw new Error('hero: ' + hero);
  if (!(await page.textContent(`.focus3 [data-key="${id}"] .hrow-sub`)).includes('Tiny version')) throw new Error('row sub');
});

await step('tapping the score shows exactly what counts', async () => {
  await page.locator('button.hero-big').click();
  await page.waitForSelector('.sheet-wrap.is-open .counts-list');
  const kinds = await page.locator('.counts-kind').allTextContents();
  if (!kinds.some((k) => k.includes('tiny version'))) throw new Error('kinds ' + kinds);
  if (kinds.some((k) => k.startsWith('Autopilot'))) throw new Error('autopilot counted');
  const total = await page.textContent('.counts-total');
  if (!/1 tiny/.test(total)) throw new Error('total ' + total);
  await a11y('what counts');
  await shot('p1-04-what-counts');
  await page.keyboard.press('Escape');
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
});

await step('a new habit takes three answers, and waits in Later when your three are full', async () => {
  await go('#/plan/habits', '[data-view="habits"] .sort-cta');
  const t0 = Date.now();
  await page.locator('[data-action="new"]').first().click();
  await page.waitForSelector('.sheet .new-habit');
  await page.fill('.new-habit [data-f="name"]', 'Read 10 pages');
  await page.locator('.new-habit [data-action="anchor"]', { hasText: 'Before bed' }).click();
  await page.fill('.new-habit [data-f="tiny"]', 'Read one page');
  const where = await page.textContent('.new-habit-where');
  if (!where.includes('Later')) throw new Error('where: ' + where);
  await a11y('new habit');
  await shot('p1-05-new-habit');
  await page.locator('.new-habit button[type="submit"]').click();
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  if (Date.now() - t0 > 30000) throw new Error('slower than 30 seconds');
  const h = await ev(() => window.__lifeos.store.all('habits').find((x) => x.name === 'Read 10 pages'));
  if (!h) throw new Error('not saved');
  if (h.state !== 'queue' || h.anchor !== 'Before bed' || h.tiny?.label !== 'Read one page' || h.category !== 'mind' || h.section !== 'evening') throw new Error(JSON.stringify(h));
  await page.waitForSelector('[data-key="g-queue"] [data-key="' + h.id + '"]');
});

await step('“More options” carries the three answers into the full editor', async () => {
  await page.locator('[data-action="new"]').first().click();
  await page.waitForSelector('.sheet .new-habit');
  await page.fill('.new-habit [data-f="name"]', 'Stretch hamstrings');
  await page.fill('.new-habit [data-f="tiny"]', 'One stretch');
  await page.locator('.new-habit [data-action="more"]').click();
  await page.waitForSelector('.sheet .editor .ed-more[open]');
  if ((await page.inputValue('.sheet .editor [data-f="name"]')) !== 'Stretch hamstrings') throw new Error('name lost');
  if ((await page.inputValue('.sheet .editor [data-k="label"]')) !== 'One stretch') throw new Error('tiny lost');
  await shot('p1-06-editor-more');
  await page.keyboard.press('Escape');
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  if (await ev(() => window.__lifeos.store.all('habits').some((x) => x.name === 'Stretch hamstrings'))) throw new Error('a draft was saved without Create');
});

await step('one miss keeps the run going; a comeback is counted', async () => {
  const T = await todayISO();
  await ev((T) => {
    const { store } = window.__lifeos;
    const add = (n) => { const d = new Date(T); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    store.update('profile', 'me', { trackingStart: add(-60) });
    store.put('habits', { id: 'h-test-run', name: 'Test run', type: 'binary', schedule: { kind: 'daily' }, section: 'life', category: 'life', icon: 'circle',
      state: 'autopilot', startDate: add(-10), order: 99, tiny: { label: 'One minute' } });
    for (const n of [-6, -5, -3, -2]) store.put('habitLogs', { id: `h-test-run:${add(n)}`, habitId: 'h-test-run', date: add(n), value: 1, completed: true });
  }, T);
  await go('#/habits/h-test-run', '[data-view="habit"] .run-card');
  const run = await page.textContent('.run-val');
  if (!run.trim().startsWith('4')) throw new Error('run ' + run);
  const facts = await page.textContent('.run-facts');
  if (!/Comebacks\s*1|1\s*Comebacks/.test(facts.replace(/\s+/g, ' '))) throw new Error('facts ' + facts);
  if (!(await page.textContent('.run-note')).includes('don’t miss twice')) throw new Error('no “don’t miss twice” after yesterday’s miss');
  await a11y('habit page');
  await shot('p1-07-habit-run');
});

await step('state changes on the habit page: full three are refused, Later works, pause has an end date', async () => {
  await page.locator('[data-action="state"][data-value="focus"]').click();
  await page.waitForSelector('.toast');
  if ((await ev(() => window.__lifeos.store.get('habits', 'h-test-run').state)) !== 'autopilot') throw new Error('took a fourth focus slot');
  await page.locator('[data-action="state"][data-value="queue"]').click();
  await page.waitForFunction(() => window.__lifeos.store.get('habits', 'h-test-run').state === 'queue');
  await page.locator('[data-action="state"][data-value="paused"]').click();
  await page.waitForSelector('.sheet [data-action="pick"]');
  await page.locator('.sheet [data-action="pick"]', { hasText: 'Two weeks' }).click();
  await page.locator('.sheet [data-action="pause"]').click();
  const T = await todayISO();
  const h = await ev(() => window.__lifeos.store.get('habits', 'h-test-run'));
  const want = await ev(async (T) => (await import('./js/domain/dates.js')).addDays(T, 14), T);
  if (h.state !== 'paused' || h.pausedUntil !== want || h.stateBeforePause !== 'queue') throw new Error(JSON.stringify(h));
  await page.waitForFunction(() => document.querySelector('.page-head .eyebrow')?.textContent.startsWith('Paused'));
});

await step('six steady weeks suggest autopilot, and the next habit takes the slot', async () => {
  const T = await todayISO();
  const id = (await state()).focus[0];
  await ev(({ T, id }) => {
    const { store } = window.__lifeos;
    const add = (n) => { const d = new Date(T); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    store.update('profile', 'me', { trackingStart: add(-60) });
    store.update('habits', id, { startDate: add(-60), schedule: { kind: 'daily' }, source: null, type: 'binary', focusSince: add(-60) });
    for (let n = -50; n <= -1; n++) store.put('habitLogs', { id: `${id}:${add(n)}`, habitId: id, date: add(n), value: 1, completed: true });
  }, { T, id });
  await go(`#/habits/${id}`, '[data-view="habit"] .grad');
  await shot('p1-08-graduation');
  await page.locator('[data-action="graduate"]').click();
  await page.waitForSelector('.grad', { state: 'detached' });
  const s = await state();
  if (s.focus.includes(id)) throw new Error('still in focus');
  if (s.focus.length !== 3) throw new Error('the free slot was not filled: ' + s.focus);
});

await step('a minimum day keeps your three in their tiny form', async () => {
  await go('#/today', '.today');
  await page.locator('[data-action="mode"]').click();
  await page.locator('.sheet [data-mode="minimum"]').click();
  await page.waitForSelector('.minday');
  const focus = (await state()).focus;
  const shown = await ev((ids) => ids.filter((id) => document.querySelector(`.minday [data-key="${id}"], .minday [data-key="tile-${id}"]`)).length, focus);
  if (!shown) throw new Error('none of your three on the minimum day');
  await shot('p1-09-minimum');
  await page.locator('.minday [data-action="set-mode"]').click();
  await page.waitForSelector('.minday', { state: 'detached' });
});

await step('dark mode and desktop screenshots', async () => {
  for (const scheme of ['dark', 'light']) {
    const c = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
    const p = await c.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    for (const [h, s, n] of [['#/today', '.today', 'today'], ['#/habits/sort', '.sort-slot', 'sort'], ['#/habits/h-prayer', '.run-card', 'habit'], ['#/habits', '[data-view="habits"] .list', 'habits']]) {
      await p.goto(base + h);
      await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
      await p.waitForSelector(s);
      await p.waitForTimeout(600);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 1) throw new Error(`${n} ${scheme}: ${over}px overflow`);
      await p.screenshot({ path: `${OUT}/p1-desktop-${n}-${scheme}.png` });
    }
    if (errs.length) throw new Error(errs.join(' | '));
    await c.close();
  }
  const c = await browser.newContext({ ...devices['iPhone 14'], colorScheme: 'dark' });
  const p = await c.newPage();
  for (const [h, s, n] of [['#/today', '.today', 'today'], ['#/habits/sort', '.sort-slot', 'sort'], ['#/habits/h-prayer', '.run-card', 'habit']]) {
    await p.goto(base + h);
    await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
    await p.waitForSelector(s);
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}/p1-phone-${n}-dark.png`, fullPage: true });
  }
  await c.close();
});

await finish();
