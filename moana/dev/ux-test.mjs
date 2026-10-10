// UI/UX batch: dock, add-to-bag morph, quick view, card-to-product morph, full-screen gallery,
// island forecast (mocked weather), full-screen quiz, water ripple. node dev/ux-test.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const B = 'http://localhost:4100';
const PDP = '/products/anua-heartleaf-quercetinol-pore-deep-cleansing-foam';
const b = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader'] });
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const errors = [];
async function page(width) {
  const ctx = await b.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, hasTouch: width < 700 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/open-meteo/.test(m.text())) errors.push(m.text()); });
  // weather service mocked (the sandbox cannot reach it); the shape matches Open-Meteo's documented response
  await p.route('**/api.open-meteo.com/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' },
    body: JSON.stringify({ current: { temperature_2m: 28.4, relative_humidity_2m: 81 }, daily: { uv_index_max: [11.35] } }) }));
  return p;
}
await fetch(B + '/cart/clear');

/* 1. phone dock */
{
  const p = await page(390);
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  ok(await p.isVisible('[data-dock]'), 'dock shows on a phone');
  ok(await p.getAttribute('[data-dock] a[aria-current="page"]', 'href') === '/', 'dock marks Home as current');
  await p.evaluate(() => window.scrollTo(0, 600)); await p.waitForTimeout(150);
  await p.evaluate(() => window.scrollTo(0, 1600)); await p.waitForTimeout(500);
  ok(await p.evaluate(() => document.documentElement.classList.contains('dock-away')), 'dock slides away while scrolling down');
  await p.evaluate(() => window.scrollTo(0, 1300)); await p.waitForTimeout(500);
  ok(!(await p.evaluate(() => document.documentElement.classList.contains('dock-away'))), 'dock returns when scrolling up');
  await p.click('[data-dock] [data-cart-open]');
  await p.waitForSelector('[data-cart-drawer].is-open', { timeout: 3000 }).catch(() => {});
  ok(await p.$('[data-cart-drawer].is-open') !== null, 'dock Bag opens the bag drawer');
  const p2 = await page(1440);
  await p2.goto(B + '/', { waitUntil: 'networkidle' });
  ok(!(await p2.isVisible('[data-dock]')), 'dock hidden on desktop');
  await p.context().close(); await p2.context().close();
}

/* 2. add-to-bag morph, count roll, new line */
{
  const p = await page(1440);
  await p.goto(B + '/collections/skincare', { waitUntil: 'networkidle' });
  const btn = p.locator('.card .card__btn[type="submit"]').first();
  await btn.scrollIntoViewIfNeeded();
  await btn.click();
  await p.waitForSelector('.card__btn.is-added', { timeout: 3000 }).catch(() => {});
  ok(/Added/.test(await btn.textContent()), 'card button turns into "Added"');
  ok(await p.$('[data-cart-drawer] .cart-line.is-new') !== null, 'new line slides into the bag');
  ok(await p.$('.cart-count .count-roll, [data-cart-count] .count-roll') !== null, 'bag count rolls');
  await p.waitForTimeout(2000);
  ok(!/Added/.test(await btn.textContent()), 'button returns to Add to bag');
  await p.context().close();
}

/* 3. quick view */
{
  const p = await page(1440);
  await p.goto(B + '/collections/skincare', { waitUntil: 'networkidle' });
  const card = p.locator('.card').first();
  await card.scrollIntoViewIfNeeded();
  await card.hover();
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.card__quick')).opacity) === '1', 'Quick view pill appears on hover');
  await card.locator('.card__quick').click();
  await p.waitForSelector('.qv[open] .qv__title', { timeout: 4000 }).catch(() => {});
  const t = await p.textContent('.qv .qv__title').catch(() => '');
  ok(!!t, 'quick view opens with the product: ' + t);
  ok(await p.$('.qv .pill') !== null, 'quick view lists skin types');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  ok(!(await p.evaluate(() => document.querySelector('.qv').open)), 'Escape closes quick view');
  await card.hover(); await card.locator('.card__quick').click();
  await p.waitForSelector('.qv[open] .qv__form button', { timeout: 4000 });
  await p.click('.qv .qv__form button[type="submit"]');
  await p.waitForSelector('[data-cart-drawer].is-open', { timeout: 4000 }).catch(() => {});
  ok(!(await p.evaluate(() => document.querySelector('.qv').open)) && await p.$('[data-cart-drawer].is-open') !== null, 'adding from quick view closes it and opens the bag');
  await p.context().close();
}

/* 4. card to product morph */
{
  const p = await page(1440);
  await p.goto(B + '/collections/skincare', { waitUntil: 'networkidle' });
  ok(await p.evaluate(() => 'onpagereveal' in window), 'browser supports cross-document view transitions');
  const link = p.locator('.card__title a').first();
  const href = await link.getAttribute('href');
  await link.click({ noWaitAfter: true });
  await p.waitForURL('**' + href);
  await p.waitForLoadState('networkidle');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.pdp__slide:first-child img')).viewTransitionName) === 'pdp-media', 'product photo carries the shared name');
  ok(await p.evaluate(() => [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => /view-transition/.test(r.cssText)); } catch (e) { return false; } })), 'page opts into view transitions');
  await p.context().close();
}

/* 5. full-screen gallery */
{
  const p = await page(1440);
  await p.goto(B + PDP, { waitUntil: 'networkidle' });
  const n = await p.$$eval('[data-zoom]', (x) => x.length);
  await p.click('[data-zoom]');
  await p.waitForSelector('.viewer[open]', { timeout: 3000 }).catch(() => {});
  ok(await p.textContent('.viewer__count') === '1 / ' + n, 'gallery opens at photo 1 of ' + n);
  await p.keyboard.press('ArrowRight'); await p.waitForTimeout(500);
  ok(await p.textContent('.viewer__count') === '2 / ' + n, 'arrow key moves to the next photo');
  // mouse drag left = swipe
  const box = await p.locator('.viewer__stage').boundingBox();
  await p.mouse.move(box.x + box.width * .7, box.y + box.height / 2);
  await p.mouse.down(); await p.mouse.move(box.x + box.width * .2, box.y + box.height / 2, { steps: 8 }); await p.mouse.up();
  await p.waitForTimeout(500);
  ok(await p.textContent('.viewer__count') === '3 / ' + n, 'swipe moves to the next photo');
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(400);
  ok(await p.evaluate(() => document.querySelector('.viewer').classList.contains('is-zoomed')), 'click zooms in');
  await p.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await p.waitForTimeout(400);
  ok(!(await p.evaluate(() => document.querySelector('.viewer').classList.contains('is-zoomed'))), 'click again zooms out');
  await p.click('.viewer__thumbs [data-v-thumb="0"]'); await p.waitForTimeout(400);
  ok(await p.textContent('.viewer__count') === '1 / ' + n, 'thumbnail jumps to a photo');
  // drag down closes
  await p.mouse.move(box.x + box.width / 2, box.y + 200); await p.mouse.down();
  await p.mouse.move(box.x + box.width / 2, box.y + 420, { steps: 8 }); await p.mouse.up();
  await p.waitForTimeout(500);
  ok(!(await p.evaluate(() => document.querySelector('.viewer').open)), 'drag down closes the gallery');
  ok(await p.evaluate(() => document.activeElement && document.activeElement.hasAttribute('data-zoom')), 'focus returns to the photo');
  await p.context().close();
}

/* 6. island forecast */
{
  const p = await page(1440);
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await p.evaluate(() => sessionStorage.clear());
  await p.locator('[data-forecast]').scrollIntoViewIfNeeded();
  await p.waitForSelector('[data-forecast].is-live', { timeout: 4000 }).catch(() => {});
  await p.waitForTimeout(1300);
  ok(await p.textContent('[data-fc-uv]') === '11', 'UV counts up to the live value: ' + await p.textContent('[data-fc-uv]'));
  ok(await p.textContent('[data-fc-level]') === 'Extreme', 'UV level named');
  const tip = await p.textContent('[data-fc-tip]');
  ok(/extreme/.test(tip) && /81% humid/.test(tip), 'tip uses UV and humidity: ' + tip);
  await p.context().close();
  const before = errors.length;
  const q = await page(1440);
  await q.unroute('**/api.open-meteo.com/**');
  await q.route('**/api.open-meteo.com/**', (r) => r.abort());
  await q.goto(B + '/', { waitUntil: 'networkidle' });
  await q.locator('[data-forecast]').scrollIntoViewIfNeeded(); await q.waitForTimeout(800);
  ok(/strong all year/.test(await q.textContent('[data-fc-tip]')), 'offline: default tip stays');
  errors.splice(before).filter((e) => !/ERR_FAILED/.test(e)).forEach((e) => errors.push(e)); // the blocked call is expected
  await q.context().close();
}

/* 7. full-screen quiz */
{
  const p = await page(390);
  await p.goto(B + '/pages/routine-finder', { waitUntil: 'networkidle' });
  ok(await p.$$eval('.rf__step.is-current .rf__opt small', (x) => x.length) > 3, 'answer tiles carry a description');
  const h = await p.evaluate(() => document.querySelector('.rf').getBoundingClientRect().height);
  ok(h >= 700, 'quiz fills the screen (' + Math.round(h) + 'px)');
  await p.click('.rf__step.is-current .rf__opt:nth-child(2)'); await p.waitForTimeout(700);
  ok(await p.evaluate(() => document.querySelector('[data-finder-stage]').classList.contains('is-started')), 'intro steps aside once she starts');
  ok(await p.evaluate(() => document.querySelector('.rf canvas[data-wash]').dataset.bg) === '#f8f6f0', 'wash re-tinted for the answer (Dry skin: linen)');
  await p.click('.rf__step.is-current .rf__opt:nth-child(1)'); await p.waitForTimeout(700);
  await p.click('.rf__step.is-current .rf__opt:nth-child(2)'); await p.waitForTimeout(900);
  ok(await p.isVisible('[data-finder-result]'), 'result shows after three taps');
  ok(await p.$$eval('.rf__item', (x) => x.length) === 5, 'five-step routine built');
  await p.context().close();
}

/* 8. water ripple */
{
  const p = await page(1440);
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  const media = p.locator('.iwt__media[data-ripple]');
  await media.scrollIntoViewIfNeeded();
  await p.evaluate(() => document.querySelectorAll('.reveal-media').forEach((e) => e.classList.add('is-in')));
  const box = await media.boundingBox();
  for (let i = 0; i < 8; i++) { await p.mouse.move(box.x + 100 + i * 40, box.y + 200 + i * 20); await p.waitForTimeout(60); }
  await p.waitForTimeout(300);
  ok(await p.$('.iwt__media canvas.ripple') !== null, 'ripple canvas built on first hover');
  ok(await p.evaluate(() => document.querySelector('.iwt__media canvas.ripple')?.classList.contains('is-on')), 'ripple is running under the cursor');
  await p.screenshot({ path: 'dev/out/ux-ripple.png', clip: { x: box.x, y: Math.max(0, box.y), width: box.width, height: Math.min(box.height, 900) } });
  await p.waitForTimeout(3200);
  ok(!(await p.evaluate(() => document.querySelector('.iwt__media canvas.ripple').classList.contains('is-on'))), 'ripple fades out when still');
  await p.context().close();
  const r = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const rp = await r.newPage();
  await rp.goto(B + '/', { waitUntil: 'networkidle' });
  const m2 = rp.locator('.iwt__media[data-ripple]'); await m2.scrollIntoViewIfNeeded();
  const bx = await m2.boundingBox(); await rp.mouse.move(bx.x + 50, bx.y + 50); await rp.mouse.move(bx.x + 200, bx.y + 200); await rp.waitForTimeout(400);
  ok(await rp.$('canvas.ripple') === null, 'no ripple under reduced motion');
  await r.close();
}

ok(errors.length === 0, 'no console errors ' + errors.join(' | '));
await fetch(B + '/cart/clear');
console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
process.exit(fail ? 1 : 0);
