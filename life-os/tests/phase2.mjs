// Phase 2: navigation and the spatial model. Old addresses land on their new homes, every screen
// is three levels or fewer from a place, keyboard-only use works, reduced motion is respected,
// focus and scroll survive navigation, wide screens show list and detail, deletes offer Undo.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
import { ROUTES, PLACES } from '../js/routes.js';
import { REDIRECTS, target } from '../js/redirects.js';
import { match } from '../js/ui/router.js';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { page, step, shot, go, a11y, finish, base, browser } = t;
const OUT = process.argv[3] || './test-shots';
const ev = (fn, arg) => page.evaluate(fn, arg);
const hash = () => ev(() => location.hash);
const SAMPLE = { id: 'h-prayer', date: '2026-10-05', month: '2026-09' };
const fill = (path) => path.split('/').map((s) => (s.startsWith(':') ? SAMPLE[s.replace(/^:|\?$/g, '')] : s)).join('/');

await step('every old address lands on its new home', async () => {
  await go('#/today', '.today');
  const bad = [];
  for (const r of REDIRECTS) {
    const from = fill(r.path).replace('h-prayer', r.path.includes('exercise') ? 'e-bss' : r.path.includes('goals') ? 'g-strength' : 'h-prayer');
    const params = match([{ path: r.path }], from.split('/')).params;
    const want = target(r.to, params);
    await ev((h) => { location.hash = h; }, `#/${from}`);
    await page.waitForFunction((w) => location.hash === `#/${w}` || location.hash.startsWith(`#/${w.split('?')[0]}`), want, { timeout: 4000 }).catch(() => {});
    const got = (await hash()).slice(2);
    if (got !== want && got !== want.split('?')[0]) bad.push(`${from} → ${got} (want ${want})`);
    const err = await ev(() => document.querySelector('#main .empty-title')?.textContent || '');
    if (err.includes('went wrong')) bad.push(`${from}: render error`);
  }
  if (bad.length) throw new Error(bad.join(' | '));
});

await step('every screen is three levels or fewer from a place', async () => {
  // A journal entry, so its page exists to be found.
  await ev(() => window.__lifeos.store.put('journalEntries', { id: 'j-test', date: '2026-10-06', kind: 'free', answers: {}, text: 'A line.' }));
  // A project, a book and a list too, for the same reason.
  await ev(() => { const { store } = window.__lifeos; store.put('projects', { id: 'p-test', name: 'Test project', outcome: '', area: 'work', status: 'active', order: 1 }); store.put('books', { id: 'b-test', title: 'Test book', pages: 100, currentPage: 0, status: 'reading', order: 1 }); store.put('lists', { id: 'l-test', name: 'Test list', order: 0, items: [] }); });
  const seen = new Map(); // route path -> depth
  let frontier = PLACES.map((p) => p.path).concat(['you/settings', 'you/data', 'you/privacy', 'you/sync']); // You is one tap from every place
  for (let depth = 0; depth <= 3 && frontier.length; depth++) {
    const next = [];
    for (const path of frontier) {
      const m = match(ROUTES, path.split('?')[0].split('/'));
      if (!m || seen.has(m.route.path)) continue;
      seen.set(m.route.path, depth);
      await go(`#/${path}`, '#main .view');
      await page.waitForTimeout(150);
      const links = await ev(() => [...document.querySelectorAll('#main a[href^="#/"], #main [data-to]')]
        .map((a) => a.dataset.to || a.getAttribute('href').slice(2)).filter(Boolean));
      next.push(...links);
    }
    frontier = [...new Set(next)];
  }
  // A workout page (and its gym mode) is opened by starting or reviewing a session, not by browsing.
  const missing = ROUTES.filter((r) => !seen.has(r.path) && !r.path.startsWith('workout/:id')).map((r) => r.path);
  if (missing.length) throw new Error('not reachable in 3 levels: ' + missing.join(', '));
});

await step('places switch from the keyboard, and focus lands on the new title', async () => {
  await go('#/today', '.today');
  for (const p of PLACES) {
    await page.keyboard.press(p.key);
    await page.waitForFunction((path) => location.hash === `#/${path}`, p.path);
    await page.waitForSelector(`[data-view="${p.id}"]`);
    await page.waitForFunction(() => document.activeElement?.tagName === 'H1');
  }
});

await step('J moves through items, Enter opens, back restores the exact scroll', async () => {
  await go('#/plan', '[data-view="plan"]');
  await page.evaluate(() => window.scrollTo(0, 260));
  await page.waitForTimeout(100);
  await page.keyboard.press('j');
  await page.waitForTimeout(100);
  const y = await ev(() => Math.round(scrollY));
  const focused = await ev(() => document.activeElement?.closest('li') ? document.activeElement.getAttribute('href') : null);
  if (!focused) throw new Error('J focused nothing');
  await page.keyboard.press('Enter');
  await page.waitForFunction((h) => location.hash === h, focused);
  await page.goBack();
  await page.waitForSelector('[data-view="plan"]');
  await page.waitForTimeout(400);
  const back = await ev(() => Math.round(scrollY));
  if (Math.abs(back - y) > 2) throw new Error(`scroll ${back}, was ${y}`);
});

await step('Tab reaches every control on Today, in order, without traps', async () => {
  await go('#/today', '.today');
  await page.waitForTimeout(400);
  const want = await ev(() => [...document.querySelectorAll('#main button:not([disabled]), #main a[href], #main input, #main select, #main textarea, .tabbar a, .tabbar button')]
    .filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden' && e.tabIndex >= 0).length);
  await ev(() => document.activeElement?.blur());
  const reached = new Set();
  for (let i = 0; i < want + 12; i++) {
    await page.keyboard.press('Tab');
    const id = await ev(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      a.dataset.tabSeen ||= String(Math.random()).slice(2);
      return a.dataset.tabSeen;
    });
    if (id) reached.add(id);
  }
  if (reached.size < want) throw new Error(`Tab reached ${reached.size} of ${want} controls`);
});

await step('N opens capture; Escape closes it and returns focus; ? lists the shortcuts', async () => {
  await go('#/plan', '[data-view="plan"]');
  await page.locator('[data-view="plan"] [data-action="open-search"]').focus();
  await page.keyboard.press('n');
  await page.waitForSelector('.sheet .capture');
  await a11y('capture');
  await shot('p2-01-capture');
  await page.keyboard.press('Escape');
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  if (!(await ev(() => document.activeElement?.matches('[data-view="plan"] [data-action="open-search"]')))) throw new Error('focus not returned to where it was');
  await page.keyboard.press('?');
  await page.waitForSelector('.sheet .keys');
  await shot('p2-02-shortcuts');
  await page.keyboard.press('Escape');
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
});

await step('pinned capture: Log weight and Start workout are one tap from +', async () => {
  await go('#/reflect', '[data-view="reflect"]');
  await page.locator('.tab--capture').click();
  await page.locator('.capture-big', { hasText: 'Log weight' }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('.sheet-wrap.is-open .sheet-title')].some((t) => /weight|weigh/i.test(t.textContent)));
  await page.keyboard.press('Escape');
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  if (!(await hash()).startsWith('#/reflect')) throw new Error('capture moved you away');
});

await step('You opens from Today and leads to settings, data and privacy', async () => {
  await go('#/today', '.today');
  await page.locator('.today-tools .you-btn').click();
  await page.waitForSelector('.sheet .you');
  await a11y('you');
  await shot('p2-03-you');
  await page.locator('.sheet .you [data-action="data"]').click();
  await page.waitForSelector('[data-view="data"]');
});

await step('a dragged sheet springs back a little, and closes when pulled far', async () => {
  await go('#/plan', '[data-view="plan"]');
  await page.locator('.tab--capture').click();
  await page.waitForSelector('.sheet-wrap.is-open .sheet');
  await page.waitForTimeout(450);
  const grab = await page.locator('.sheet-grab').boundingBox();
  const x = grab.x + grab.width / 2, y = grab.y + grab.height / 2;
  // a slow, short pull
  await page.mouse.move(x, y); await page.mouse.down();
  for (let d = 5; d <= 40; d += 5) { await page.mouse.move(x, y + d); await page.waitForTimeout(30); }
  await page.mouse.up();
  await page.waitForTimeout(500);
  if (!(await page.locator('.sheet-wrap.is-open').count())) throw new Error('a small pull closed the sheet');
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x, y + 420, { steps: 12 }); await page.mouse.up();
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
});

await step('pulling down at the top of a place opens search', async () => {
  await go('#/plan', '[data-view="plan"]');
  await page.evaluate(() => window.scrollTo(0, 0));
  await ev(async () => {
    const el = document.querySelector('.page-title');
    const touch = (y) => new Touch({ identifier: 1, target: el, clientX: 200, clientY: y });
    el.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(120)], bubbles: true }));
    for (let y = 130; y <= 240; y += 20) el.dispatchEvent(new TouchEvent('touchmove', { touches: [touch(y)], bubbles: true }));
    el.dispatchEvent(new TouchEvent('touchend', { touches: [], bubbles: true }));
  });
  await page.waitForSelector('.sheet input[type="search"]');
  await page.keyboard.press('Escape');
});

await step('deleting a goal offers Undo, and Undo brings it back', async () => {
  await go('#/plan/goals/g-strength', '[data-view="goal"]');
  await page.locator('[data-action="delete"]').click();
  await page.waitForSelector('[data-view="goals"]');
  if (await ev(() => !!window.__lifeos.store.get('goals', 'g-strength'))) throw new Error('not deleted');
  await page.locator('.toast-btn', { hasText: 'Undo' }).click();
  await page.waitForFunction(() => !!window.__lifeos.store.get('goals', 'g-strength'));
});

await step('the habit editor is a sheet that saves as you go, with Undo', async () => {
  await go('#/plan/habits/h-prayer', '[data-view="habit"]');
  await page.keyboard.press('e');
  await page.waitForSelector('.sheet .editor');
  await shot('p2-04-editor-sheet');
  await page.fill('.sheet .editor [data-f="anchor"]', 'After my coffee');
  await page.waitForFunction(() => window.__lifeos.store.get('habits', 'h-prayer').anchor === 'After my coffee', null, { timeout: 3000 });
  await page.keyboard.press('Escape');
  await page.locator('.toast-btn', { hasText: 'Undo' }).click();
  await page.waitForFunction(() => window.__lifeos.store.get('habits', 'h-prayer').anchor == null);
});

await step('screens change with a View Transition, and the tapped title morphs', async () => {
  await go('#/plan/habits', '[data-view="habits"] .list');
  await ev(() => {
    window.__vt = { n: 0, morph: false };
    const orig = document.startViewTransition.bind(document);
    document.startViewTransition = (cb) => { window.__vt.n++; window.__vt.morph = !!document.querySelector('[style*="view-transition-name"]'); return orig(cb); };
  });
  const frames = ev(() => new Promise((res) => { const ts = []; const f = (t) => { ts.push(t); if (ts.length < 40) requestAnimationFrame(f); else res(ts); }; requestAnimationFrame(f); }));
  await page.locator('a[href="#/plan/habits/h-prayer"]').click();
  await page.waitForSelector('[data-view="habit"]');
  const vt = await ev(() => window.__vt);
  if (!vt.n || !vt.morph) throw new Error('transition ' + JSON.stringify(vt));
  const ts = await frames;
  const slow = ts.slice(1).map((x, i) => x - ts[i]).filter((d) => d > 34).length;
  if (slow > 3) throw new Error(`${slow} dropped frames during the transition`);
});

await step('reduced motion: no transitions, screens simply appear', async () => {
  const c = await browser.newContext({ ...devices['iPhone 14'], reducedMotion: 'reduce' });
  const p = await c.newPage();
  await p.goto(base + '#/today');
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.evaluate(() => { window.__vtn = 0; const o = document.startViewTransition?.bind(document); if (o) document.startViewTransition = (cb) => { window.__vtn++; return o(cb); }; });
  await p.locator('a.tab[href="#/plan"]').click();
  await p.waitForSelector('[data-view="plan"]');
  const s = await p.evaluate(() => ({ n: window.__vtn, anim: getComputedStyle(document.querySelector('#main .view')).animationName }));
  if (s.n) throw new Error('a View Transition ran with reduced motion');
  if (s.anim !== 'fade-in' && s.anim !== 'none') throw new Error('animation ' + s.anim);
  await c.close();
});

await step('wide screens: list and detail side by side, the list keeps its place', async () => {
  for (const scheme of ['light', 'dark']) {
    const c = await browser.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: scheme });
    const p = await c.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(base + '#/plan/habits');
    await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
    await p.waitForSelector('.split .split-list [data-key="g-autopilot"]');
    await p.waitForSelector('.split .split-empty');
    // Click without scrolling the list, then check the list stayed where it was.
    await p.evaluate(() => { const l = document.querySelector('.split-list'); l.scrollTop = 300; l.querySelector('a[href="#/plan/habits/h-water"]').click(); });
    await p.waitForSelector('.split-detail .run-card');
    const st = await p.evaluate(() => ({ top: document.querySelector('.split-list').scrollTop, cur: document.querySelector('.split-list a[aria-current="page"]')?.getAttribute('href') }));
    if (st.top < 290) throw new Error('list lost its scroll: ' + st.top);
    if (st.cur !== '#/plan/habits/h-water') throw new Error('selected ' + st.cur);
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/p2-desktop-split-${scheme}.png` });
    for (const [h, n] of [['#/plan', 'plan'], ['#/reflect', 'reflect'], ['#/progress', 'progress'], ['#/today', 'today']]) {
      await p.goto(base + h);
      await p.waitForSelector(`[data-view="${n}"]`);
      await p.waitForTimeout(600);
      const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 1) throw new Error(`${n} ${scheme}: ${over}px overflow`);
      await p.screenshot({ path: `${OUT}/p2-desktop-${n}-${scheme}.png` });
    }
    if (errs.length) throw new Error(errs.join(' | '));
    await c.close();
  }
});

await step('tablet rail and phone screenshots, light and dark', async () => {
  for (const scheme of ['light', 'dark']) {
    for (const [ctxOpts, tag] of [[{ viewport: { width: 820, height: 1180 } }, 'tablet'], [devices['iPhone 14'], 'phone']]) {
      const c = await browser.newContext({ ...ctxOpts, colorScheme: scheme });
      const p = await c.newPage();
      for (const [h, n] of [['#/plan', 'plan'], ['#/reflect', 'reflect'], ['#/progress/areas/mind', 'mind']]) {
        await p.goto(base + h);
        await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
        await p.waitForSelector(`[data-view="${n}"]`);
        await p.waitForTimeout(700);
        const over = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        if (over > 1) throw new Error(`${tag} ${n} ${scheme}: ${over}px overflow`);
        await p.screenshot({ path: `${OUT}/p2-${tag}-${n}-${scheme}.png`, fullPage: tag === 'phone' });
      }
      await c.close();
    }
  }
});

await finish();
