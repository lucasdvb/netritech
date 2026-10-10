// Find my routine pop-up: off by default, ?quiz_popup=1 preview, clock from the first scroll, dismissal remembered,
// a saved routine keeps it away, the quiz works inside it, it waits for an open panel, phone bottom sheet.
// node dev/popup-test.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const B = 'http://localhost:4100';
const b = await chromium.launch();
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };
const errors = [];
async function page(width, { enabled = false } = {}) {
  const ctx = await b.newContext({ viewport: { width, height: width < 700 ? 844 : 900 }, hasTouch: width < 700, isMobile: width < 700 });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error' && !/open-meteo|ERR_TUNNEL|ERR_FAILED/.test(m.text())) errors.push(m.text()); });
  await p.route('**/api.open-meteo.com/**', (r) => r.abort());
  // "switched on in the theme settings": flip the rendered setting on page documents
  if (enabled) await p.route((u) => !/\.(js|css|svg|png|jpe?g|webp|woff2?)$/.test(u.pathname) && !u.search.includes('section_id'), async (r) => {
    if (r.request().resourceType() !== 'document') return r.continue();
    const res = await r.fetch();
    r.fulfill({ response: res, body: (await res.text()).replace('data-enabled="false"', 'data-enabled="true"') });
  });
  return p;
}
const isOpen = (p) => p.evaluate(() => !!document.querySelector('dialog.qp[open]'));
const scroll = (p) => p.mouse.wheel(0, 600);
await fetch(B + '/cart/clear');

/* off by default */
{
  const p = await page(1440);
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  ok(await p.evaluate(() => document.querySelector('[data-quiz-popup]').dataset.enabled === 'false'), 'setting is off by default');
  await scroll(p); await p.waitForTimeout(11500);
  ok(!(await isOpen(p)), 'nothing shows while it is off');
  await p.context().close();
}

/* preview: waits for the first scroll, then the delay; the quiz works inside */
{
  const p = await page(1440);
  await p.goto(B + '/?quiz_popup=1', { waitUntil: 'networkidle' });
  await p.waitForTimeout(11000);
  ok(!(await isOpen(p)), 'no scroll yet, no pop-up');
  await scroll(p); await p.waitForTimeout(6000);
  ok(!(await isOpen(p)), 'not before the delay');
  await p.waitForTimeout(5500);
  ok(await isOpen(p), 'opens 10 seconds after her first scroll');
  ok(await p.evaluate(() => document.querySelectorAll('h1').length === 1 && !!document.querySelector('.qp h2#rf-routine-finder')), 'quiz heading is an h2, one h1 on the page');
  ok(await p.evaluate(() => document.querySelector('.qp').getAttribute('aria-labelledby') === 'rf-routine-finder'), 'dialog is labelled by the heading');
  for (const n of [2, 1, 2]) { await p.click(`.qp .rf__step.is-current .rf__opt:nth-child(${n})`); await p.waitForTimeout(700); }
  await p.click('.qp [data-finder-next]'); await p.waitForTimeout(1200);
  ok(await p.isVisible('.qp [data-finder-result]'), 'quiz builds a routine inside the pop-up');
  ok(await p.evaluate(() => !!localStorage.getItem('moana:routine')), 'routine saved on the device');
  ok(await p.evaluate(() => !!document.querySelector('.qp canvas[data-wash]').dataset.washReady), 'wash started inside the pop-up');
  await p.click('.qp .rf__item form button'); await p.waitForTimeout(1500);
  ok(await isOpen(p), 'single add keeps her on her results');
  ok((await p.textContent('#cart-count')).trim() === '1', 'bag count updates');
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  ok(!(await isOpen(p)), 'Escape closes it');
  ok(await p.evaluate(() => +localStorage.getItem('moana:quiz-popup') > 0), 'closing is remembered');
  await p.context().close();
  await fetch(B + '/cart/clear');
}

/* switched on: shows once, then the days rule, then a saved routine */
{
  const p = await page(1440, { enabled: true });
  await p.goto(B + '/collections/skincare', { waitUntil: 'networkidle' });
  await scroll(p); await p.waitForTimeout(11500);
  ok(await isOpen(p), 'switched on: opens on a collection page');
  await p.click('.qp [data-qp-close]'); await p.waitForTimeout(500);
  ok(!(await isOpen(p)), 'close button closes it');
  await p.evaluate(() => sessionStorage.clear());
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await scroll(p); await p.waitForTimeout(11500);
  ok(!(await isOpen(p)), 'stays away for the set days after she closes it');
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); localStorage.setItem('moana:routine', '{}'); });
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await scroll(p); await p.waitForTimeout(11500);
  ok(!(await isOpen(p)), 'never shows to someone with a saved routine');
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  // the clock keeps running across pages
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await scroll(p); await p.waitForTimeout(6000);
  await p.goto(B + '/pages/about', { waitUntil: 'networkidle' });
  await p.waitForTimeout(5500);
  ok(await isOpen(p), 'clock carries over to the next page');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.context().close();
}

/* waits for an open panel; quiz page never offers it */
{
  const p = await page(1440, { enabled: true });
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await scroll(p); await p.waitForTimeout(3000);
  await p.click('[data-cart-open]'); await p.waitForTimeout(9000);
  ok(!(await isOpen(p)), 'never opens over the bag');
  await p.keyboard.press('Escape'); await p.waitForTimeout(2500);
  ok(await isOpen(p), 'opens once the bag is closed');
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await p.goto(B + '/pages/routine-finder', { waitUntil: 'networkidle' });
  ok(await p.evaluate(() => !document.querySelector('[data-quiz-popup]')), 'not on the quiz page');
  await p.context().close();
}

/* phone: bottom sheet */
{
  const p = await page(390);
  await p.goto(B + '/?quiz_popup=1', { waitUntil: 'networkidle' });
  await p.evaluate(() => window.scrollBy(0, 400)); await p.waitForTimeout(11500);
  ok(await isOpen(p), 'phone: opens');
  const r = await p.evaluate(() => { const b = document.querySelector('.qp__panel').getBoundingClientRect(); return { bottom: Math.round(b.bottom), w: Math.round(b.width), sw: document.querySelector('.qp__panel').scrollWidth }; });
  ok(r.bottom === 844 && r.w === 390 && r.sw <= 390, `phone: full-width bottom sheet, no sideways scroll (${JSON.stringify(r)})`);
  await p.screenshot({ path: 'dev/out/qp-phone.png' });
  await p.context().close();
}

ok(errors.length === 0, 'no console errors ' + errors.join(' | '));
console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
process.exit(fail ? 1 : 0);
