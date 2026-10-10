// Ideas batch: skin diary (1), rewards (17), budget slider (26), Kreol touches (33), AM/PM switch (38),
// mega menu previews (41), celebration (43), long-press actions (44), pull to refresh (45).
// node dev/batch3-test.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const B = 'http://localhost:4100';
const b = await chromium.launch();
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const errors = [];
async function page(width, opts = {}) {
  const ctx = await b.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, hasTouch: width < 700, isMobile: width < 700, ...opts });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/open-meteo|ERR_TUNNEL|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  await p.route('**/api.open-meteo.com/**', (r) => r.abort());
  return p;
}
// freeze "now" at a Mauritius morning or evening
const at = (iso) => `(() => { const R = Date, T = new R('${iso}').getTime(), off = T - R.now();
  window.Date = class extends R { constructor(...a) { super(...(a.length ? a : [R.now() + off])); } static now() { return R.now() + off; } }; })();`;
await fetch(B + '/cart/clear');

/* 26. budget slider */
{
  const p = await page(1440);
  await p.goto(B + '/pages/routine-finder', { waitUntil: 'networkidle' });
  for (const n of [2, 1, 2]) { await p.click(`.rf__step.is-current .rf__opt:nth-child(${n})`); await p.waitForTimeout(700); }
  ok(await p.isVisible('[data-budget]'), 'fourth question is the budget slider');
  ok(/No limit/.test(await p.textContent('[data-budget-value]')), 'slider starts at no limit');
  const free = await p.textContent('[data-budget-estimate]');
  await p.fill('input[name="budget"]', '0'); await p.dispatchEvent('input[name="budget"]', 'input');
  ok(/Up to Rs 2,000/.test(await p.textContent('[data-budget-value]')), 'label follows the thumb');
  const tight = await p.textContent('[data-budget-estimate]');
  const num = (t) => Number((t.match(/Rs ([\d,]+)/) || [0, '0'])[1].replace(/,/g, ''));
  ok(num(tight) < num(free), `estimate drops with the budget (${num(free)} to ${num(tight)})`);
  await p.fill('input[name="budget"]', '2'); await p.dispatchEvent('input[name="budget"]', 'input');
  await p.click('[data-finder-next]'); await p.waitForTimeout(900);
  const total = await p.textContent('[data-finder-total]');
  ok(/Routine total: Rs/.test(total) && num(total) <= 4000, 'routine fits a Rs 4,000 budget: ' + total);
  ok(await p.evaluate(() => !!JSON.parse(localStorage.getItem('moana:routine')).picks.length), 'routine remembered on the device');
  await p.click('[data-finder-diary]');
  await p.waitForURL('**/pages/skin-diary');
  await p.waitForLoadState('networkidle');
  ok(await p.isVisible('[data-diary-main]'), 'Save to my skin diary opens the diary with the routine');
  await p.context().close();
}

/* 1. skin diary + 43 celebration + 33 Kreol greeting + 38 switch inside the diary */
{
  const p = await page(390);
  await p.addInitScript(at('2026-10-10T07:30:00+04:00'));
  await p.goto(B + '/pages/skin-diary', { waitUntil: 'networkidle' });
  ok(await p.isVisible('[data-diary-empty]'), 'empty diary shows set-up choices');
  ok(/Byenvini/.test(await p.textContent('[data-diary-empty]')), 'Kreol welcome (Byenvini)');
  await p.click('[data-diary-build]');
  await p.selectOption('[data-pick="Cleanse"]', { index: 1 });
  await p.selectOption('[data-pick="Moisturise"]', { index: 1 });
  await p.selectOption('[data-pick="Protect"]', { index: 1 });
  ok(await p.isVisible('[data-diary-main]'), 'building a routine opens the checklist');
  ok(await p.isVisible('[data-greet-am]') && /Bonzour/.test(await p.textContent('[data-greet-am]')), 'morning greeting: Bonzour');
  ok(await p.$$eval('[data-tick]', (x) => x.length) === 3, 'morning checklist has 3 steps');
  for (const t of await p.$$('[data-tick]')) { await t.click(); await p.waitForTimeout(120); }
  await p.waitForTimeout(200);
  ok(await p.isVisible('[data-diary-done]'), 'morning done message');
  ok(await p.$('.sparks') !== null || await p.$('[data-diary-done].is-celebrating') !== null, 'completion celebrates');
  ok(await p.textContent('[data-diary-streak]') === '1', 'streak is 1');
  await p.click('[data-feel="Calm"]');
  ok(await p.getAttribute('[data-feel="Calm"]', 'aria-pressed') === 'true', 'skin feeling logged');
  await p.click('[data-diary-main] [data-ampm-value="pm"]'); await p.waitForTimeout(400);
  ok(await p.$$eval('[data-tick]', (x) => x.length) === 2, 'evening checklist leaves out sunscreen');
  ok(await p.evaluate(() => document.querySelector('[data-diary]').classList.contains('is-evening')), 'diary dims to evening');
  ok(await p.isVisible('[data-greet-pm]'), 'evening greeting: Bonswar');
  // yesterday done too -> streak 2
  await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('moana:diary')); d.log['2026-10-09'] = { am: ['Cleanse', 'Moisturise', 'Protect'], pm: [], feel: [] }; localStorage.setItem('moana:diary', JSON.stringify(d)); });
  await p.reload({ waitUntil: 'networkidle' });
  ok(await p.textContent('[data-diary-streak]') === '2', 'streak counts consecutive days');
  ok(await p.$$eval('.sd__day.is-half, .sd__day.is-full', (x) => x.length) === 2, 'calendar marks both days');
  ok(await p.getAttribute('[data-dock] a[href*="skin-diary"]', 'href') !== null, 'dock Routine now opens the diary');
  await p.context().close();
  const q = await page(390);
  await q.addInitScript(at('2026-10-10T19:30:00+04:00'));
  await q.goto(B + '/pages/skin-diary', { waitUntil: 'networkidle' });
  await q.evaluate(() => localStorage.setItem('moana:diary', JSON.stringify({ v: 1, routine: { Cleanse: 'anua-heartleaf-quercetinol-pore-deep-cleansing-foam' }, log: {} })));
  await q.reload({ waitUntil: 'networkidle' });
  ok(await q.getAttribute('[data-diary-main] [data-ampm]', 'data-mode') === 'pm', 'diary opens on evening at 7:30pm');
  await q.context().close();
}

/* 38. AM/PM on the homepage routine */
{
  const p = await page(1440);
  await p.addInitScript(at('2026-10-10T09:00:00+04:00'));
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  const sec = '[data-routine-ampm]';
  ok(await p.$$eval(sec + ' .step:not([hidden])', (x) => x.length) === 5, 'morning shows five steps');
  await p.click(sec + ' [data-ampm-value="pm"]'); await p.waitForTimeout(800);
  ok(await p.$$eval(sec + ' .step:not([hidden])', (x) => x.length) === 4, 'evening hides sunscreen');
  ok(await p.evaluate((s) => document.querySelector(s).classList.contains('is-evening'), sec), 'section turns to dusk');
  ok(/Four steps tonight/.test(await p.textContent(sec + ' h2')), 'evening heading swapped in');
  ok(await p.$eval(sec + ' canvas[data-wash]', (c) => c.dataset.bg) === '#20271f', 'wash re-tinted to dusk');
  await p.context().close();
  const q = await page(1440);
  await q.addInitScript(at('2026-10-10T20:00:00+04:00'));
  await q.goto(B + '/', { waitUntil: 'networkidle' });
  ok(await q.getAttribute(sec + ' [data-ampm]', 'data-mode') === 'pm', 'homepage opens on evening at 8pm');
  await q.context().close();
}

/* 41. mega menu previews */
{
  const p = await page(1440);
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await p.hover('[data-mega] [data-mega-toggle]'); await p.waitForTimeout(400);
  await p.hover('[data-mega-panel] a[href="/collections/skincare/hydration"]'); await p.waitForTimeout(700);
  ok(await p.evaluate(() => document.querySelector('[data-mega-feature]').classList.contains('is-previewing')), 'hovering a concern shows its preview');
  ok(await p.textContent('[data-pv-title]') === 'Hydration' && /products/.test(await p.textContent('[data-pv-text]')), 'preview names it and counts products');
  ok(await p.evaluate(() => !!document.querySelector('.mega-preview__img img.is-on')), 'preview photo fades in');
  await p.hover('[data-mega-panel] a[href="/collections/cleansers"]'); await p.waitForTimeout(600);
  ok(await p.textContent('[data-pv-title]') === 'Cleansers', 'moving to a category swaps the preview');
  await p.context().close();
}

/* 43. free-delivery celebration */
{
  const p = await page(1440);
  await fetch(B + '/cart/clear');
  await p.goto(B + '/products/beauty-of-joseon-relief-sun-rice-niacinamide', { waitUntil: 'networkidle' });
  await p.click('[data-add-button]');
  await p.waitForSelector('[data-cart-drawer].is-open', { timeout: 4000 });
  await p.waitForTimeout(300);
  const first = await p.$('.ship-bar.is-done');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  await p.click('[data-add-button]');
  await p.waitForSelector('.ship-bar.is-done', { timeout: 4000 });
  await p.waitForTimeout(600);
  ok(!first && await p.evaluate(() => !!document.querySelector('.ship-bar.is-celebrating') || !!document.querySelector('.ship-bar .sparks')), 'crossing free delivery celebrates');
  await p.context().close();
  await fetch(B + '/cart/clear');
}

/* 17. rewards */
{
  const p = await page(1440);
  await p.goto(B + '/pages/rewards', { waitUntil: 'networkidle' });
  ok(/Sign in to see your points/.test(await p.textContent('.rw__card')), 'guest sees how to join');
  ok(/10 points for every Rs 100/.test(await p.textContent('.rw__steps')), 'earning rule from settings');
  await p.goto(B + '/pages/rewards?dev_customer=1&dev_points=640', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1800);
  ok(await p.textContent('[data-rw-num]') === '640', 'signed-in balance counts up to 640');
  ok(/reward waiting/.test(await p.textContent('[data-rw-next]')), 'reward ready message');
  ok(await p.$('.header__points') !== null, 'header shows the points chip');
  await p.goto(B + '/products/anua-heartleaf-quercetinol-pore-deep-cleansing-foam', { waitUntil: 'networkidle' });
  ok(/Earn 90 Moana points/.test(await p.textContent('.points-line')), 'product page: Rs 900 earns 90 points');
  await p.context().close();
}

/* 44. long-press quick actions (phone) */
{
  const p = await page(390);
  await p.goto(B + '/collections/skincare', { waitUntil: 'networkidle' });
  const card = p.locator('.card').first();
  await card.scrollIntoViewIfNeeded();
  const bx = await card.locator('.card__media').boundingBox();
  const cdp = await p.context().newCDPSession(p);
  const pt = { x: bx.x + bx.width / 2, y: bx.y + bx.height / 2 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
  await p.waitForTimeout(650);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(400);
  ok(await p.evaluate(() => !!document.querySelector('.lp[open]')), 'holding a card opens quick actions');
  ok(await p.$$eval('.lp__btn', (x) => x.length) === 3, 'save, quick view and add to bag offered');
  ok(p.url().endsWith('/collections/skincare'), 'the long-press did not open the product');
  await p.click('.lp__btn:nth-child(1)'); await p.waitForTimeout(500);
  ok(await card.locator('[data-wishlist-toggle]').getAttribute('aria-pressed') === 'true', 'Save adds it to the wishlist');
  await p.context().close();
}

/* 45. pull to refresh (phone) */
{
  const p = await page(390);
  await p.goto(B + '/collections/skincare', { waitUntil: 'networkidle' });
  await p.evaluate(() => { window.__marker = 1; });
  const cdp = await p.context().newCDPSession(p);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 300 }] });
  for (let y = 300; y <= 520; y += 20) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y }] }); await p.waitForTimeout(16); }
  ok(await p.evaluate(() => document.querySelector('.ptr')?.classList.contains('is-armed')), 'pulling past the line arms the refresh');
  const nav = p.waitForNavigation({ timeout: 4000 }).then(() => true).catch(() => false);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  ok(await nav && await p.evaluate(() => window.__marker === undefined), 'letting go reloads the page');
  // a short pull springs back
  const cdp2 = await p.context().newCDPSession(p);
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 300 }] });
  for (let y = 300; y <= 380; y += 20) await cdp2.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y }] });
  await cdp2.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.querySelector('.ptr').classList.contains('is-back')), 'a short pull springs back without reloading');
  await p.context().close();
}

/* 33. Kreol in the bag */
{
  const p = await page(1440);
  await fetch(B + '/cart/clear');
  await p.goto(B + '/cart', { waitUntil: 'networkidle' });
  ok(/Pa bizin traka/.test(await p.textContent('main')), 'empty bag says Pa bizin traka');
  await p.context().close();
}

ok(errors.length === 0, 'no console errors ' + errors.join(' | '));
console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
process.exit(fail ? 1 : 0);
