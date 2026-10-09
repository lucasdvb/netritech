// Interaction tests against the local preview server (node dev/e2e.mjs). Exits non-zero on any failure.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const BASE = 'http://localhost:4100';
const results = [];
const check = (name, ok, extra = '') => { results.push({ name, ok }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  · ' + extra : ''}`); };

const b = await chromium.launch();
async function page(width = 1440) {
  const ctx = await b.newContext({ viewport: { width, height: 900 }, hasTouch: width < 990 });
  const p = await ctx.newPage();
  p._errors = [];
  p.on('pageerror', (e) => p._errors.push(e.message));
  // a 422 from /cart/add.js is the expected answer to the deliberate over-stock test; anything else is a failure
  p.on('console', (m) => { if (m.type() === 'error' && !/status of 422/.test(m.text())) p._errors.push(m.text()); });
  return p;
}
await fetch(BASE + '/cart/clear');

/* 1. quick add from a product card opens the drawer with the item */
let p = await page(1440);
await p.goto(BASE + '/collections/skincare', { waitUntil: 'networkidle' });
const firstCard = p.locator('.card').first();
await firstCard.locator('.card__buy button').click();
await p.waitForSelector('#cart-drawer.is-open', { timeout: 4000 });
check('quick add opens the cart drawer', await p.locator('#cart-drawer.is-open').count() === 1);
check('drawer lists the added product', (await p.locator('#cart-drawer .cart-line').count()) === 1);
check('header count shows 1', (await p.locator('#cart-count').textContent()).trim() === '1' && await p.locator('#cart-count').isVisible());
const shipText = await p.locator('#cart-drawer .ship-bar').textContent();
check('free delivery bar shows the remaining amount (Rs 1,500 − Rs 900 = Rs 600)', /Rs 600/.test(shipText), shipText.trim().replace(/\s+/g, ' '));
check('focus moved into the drawer', await p.evaluate(() => document.getElementById('cart-drawer').contains(document.activeElement)));

/* 2. quantity up and remove inside the drawer */
await p.locator('#cart-drawer [data-line-change="2"]').click();
await p.waitForFunction(() => document.querySelector('#cart-drawer [data-line-input]')?.value === '2', null, { timeout: 4000 });
const subtotal = await p.locator('#cart-drawer .cart-summary__total').textContent();
check('quantity + updates the line and subtotal', subtotal.trim() === 'Rs 1,800', subtotal.trim());
check('free delivery unlocked above Rs 1,500', /free delivery|delivery is free/i.test(await p.locator('#cart-drawer .ship-bar').textContent()) && await p.locator('#cart-drawer .ship-bar.is-done').count() === 1);
await p.locator('#cart-drawer .cart-line__remove').click();
await p.waitForSelector('#cart-drawer .cart-empty', { timeout: 4000 });
check('remove empties the cart and shows the empty state', await p.locator('#cart-drawer .cart-empty').count() === 1);
check('header count hidden when empty', !(await p.locator('#cart-count').isVisible()));
await p.keyboard.press('Escape');
await p.waitForTimeout(400);
check('Escape closes the drawer', await p.locator('#cart-drawer.is-open').count() === 0);
check('no console errors on collection page', p._errors.length === 0, p._errors.join(' | '));

/* 3. filters and sort without reload */
await p.locator('.plp__filter-btn').click();
await p.waitForSelector('#filter-drawer.is-open');
await p.locator('#filter-drawer label:has(input[value="Anua"])').click();
await p.waitForFunction(() => location.search.includes('filter.p.vendor=Anua'), null, { timeout: 4000 });
await p.waitForTimeout(300);
check('brand filter narrows the grid to Anua (3 products)', await p.locator('.plp__grid .card').count() === 3);
check('filter keeps the drawer open for more choices', await p.locator('#filter-drawer.is-open').count() === 1);
await p.locator('#filter-drawer .filter-form__foot button[type="submit"]').click();
await p.waitForTimeout(400);
check('active filter chip shown', await p.locator('.plp__active .pill.is-active').count() >= 1);
await p.selectOption('[data-sort-select]', 'price-ascending');
await p.waitForFunction(() => location.search.includes('sort_by=price-ascending'), null, { timeout: 4000 });
await p.waitForTimeout(300);
const prices = await p.$$eval('.plp__grid .card__price', (els) => els.map((e) => Number(e.textContent.replace(/[^0-9]/g, ''))));
check('sort by price ascending orders the grid', prices.length === 3 && prices.every((v, i) => i === 0 || prices[i - 1] <= v), prices.join(','));
await p.locator('.plp__active a.link').click();
await p.waitForFunction(() => document.querySelectorAll('.plp__grid .card').length === 21, null, { timeout: 4000 }).catch(() => {});
check('clear all restores the 21 products', await p.locator('.plp__grid .card').count() === 21);
await p.goBack();
await p.waitForFunction(() => document.querySelectorAll('.plp__grid .card').length === 3, null, { timeout: 4000 }).catch(() => {});
check('browser back restores the previous filter state', await p.locator('.plp__grid .card').count() === 3);

/* 4. product page: stepper, add, stock cap */
await fetch(BASE + '/cart/clear');
p = await page(1440);
await p.goto(BASE + '/products/round-lab-1025-dokdo-toner', { waitUntil: 'networkidle' });
await p.locator('[data-qty-plus]').click();
await p.locator('[data-qty-plus]').click();
check('stepper raises quantity to 3', await p.inputValue('[data-qty-input]') === '3');
await p.locator('.pdp__add').click();
await p.waitForSelector('#cart-drawer.is-open');
check('PDP add puts 3 in the cart', await p.inputValue('#cart-drawer [data-line-input]') === '3');
await p.keyboard.press('Escape');
await p.fill('[data-qty-input]', '30');
await p.locator('[data-qty-input]').blur();
check('stepper caps at stock (25)', await p.inputValue('[data-qty-input]') === '25');
await p.locator('.pdp__add').click();
await p.waitForSelector('[data-form-error]:not([hidden])', { timeout: 4000 });
check('adding beyond stock shows a clear error', /can't add more/i.test(await p.locator('[data-form-error]').textContent()));
await p.evaluate(() => window.scrollTo(0, document.querySelector('.pdp__add').getBoundingClientRect().top + scrollY + 200));
const barShown = await p.waitForSelector('[data-buybar].is-visible', { timeout: 3000 }).then(() => true).catch(() => false);
check('sticky buy bar appears after scrolling past Add to cart', barShown);
await p.evaluate(() => window.scrollTo(0, 0));
const barHidden = await p.waitForSelector('[data-buybar]:not(.is-visible)', { timeout: 3000 }).then(() => true).catch(() => false);
check('sticky buy bar hides again back at the top', barHidden);
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
check('sticky buy bar steps aside for the footer', await p.waitForSelector('[data-buybar]:not(.is-visible)', { timeout: 3000 }).then(() => true).catch(() => false));
check('recommendations loaded', (await p.locator('.recs .card').count()) > 0);
check('no console errors on product page', p._errors.length === 0, p._errors.join(' | '));

/* 5. predictive search */
p = await page(1440);
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.locator('#header-search').click();
await p.waitForSelector('#search-modal.is-open');
await p.waitForTimeout(100);
check('search opens with the input focused', await p.evaluate(() => document.activeElement?.id === 'search-input'));
await p.keyboard.type('serum');
await p.waitForSelector('.predictive__product', { timeout: 4000 });
check('predictive results list products', (await p.locator('.predictive__product').count()) > 0);
await p.keyboard.press('ArrowDown');
check('arrow down moves into the results', await p.evaluate(() => document.activeElement?.getAttribute('role') === 'option'));
await p.keyboard.press('Escape'); await p.waitForTimeout(600);
check('Escape closes search and returns focus to the trigger', await p.evaluate(() => document.activeElement?.matches('[data-search-open], [data-search-trigger]')));

/* 6. mega menu by keyboard */
await p.locator('[data-mega-toggle]').focus();
await p.keyboard.press('Enter');
check('mega menu opens from the keyboard', await p.locator('.mega.is-open').count() === 1);
check('mega menu lists concerns with counts', (await p.locator('.mega.is-open .mega__col').nth(1).locator('a').count()) >= 8);
await p.keyboard.press('Escape');
check('Escape closes the mega menu', await p.locator('.mega.is-open').count() === 0);
check('skip link is the first focus stop', await (async () => { await p.goto(BASE + '/'); await p.keyboard.press('Tab'); return p.evaluate(() => document.activeElement?.classList.contains('skip-link')); })());
check('no console errors on home', p._errors.length === 0, p._errors.join(' | '));

/* 7. phone menu */
p = await page(390);
await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.locator('.header__burger').click();
await p.waitForSelector('#menu-drawer.is-open');
check('phone menu opens', true);
check('phone menu traps focus inside', await p.evaluate(() => document.getElementById('menu-drawer').contains(document.activeElement)));
await p.keyboard.press('Escape'); await p.waitForTimeout(500);
check('phone menu closes on Escape', await p.locator('#menu-drawer.is-open').count() === 0);
const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
check('no horizontal scroll at 390px', overflow <= 0, String(overflow));

/* 8. no-JS fallbacks: forms post to real Shopify routes */
check('card add button is a real form posting to /cart/add', await p.$eval('.card__form', (f) => f.getAttribute('action') === '/cart/add' && f.method === 'post'));

await b.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
