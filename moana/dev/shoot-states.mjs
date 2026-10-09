// Captures interactive states: cart drawer, search panel, mega menu, phone menu, filter drawer (desktop + phone).
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const B = 'http://localhost:4100';
const b = await chromium.launch();
for (const w of [1440, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w > 700 ? 900 : 844 }, hasTouch: w < 990 });
  const p = await ctx.newPage();
  await fetch(B + '/cart/clear'); await fetch(B + '/__seed-cart');
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await p.locator('[data-cart-open]').click(); await p.waitForTimeout(900);
  await p.screenshot({ path: `dev/out/state-cart-${w}.png` });
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  await p.locator('[data-search-open]').click(); await p.waitForTimeout(700);
  await p.screenshot({ path: `dev/out/state-search-${w}.png` });
  await p.keyboard.type('hyal'); await p.waitForTimeout(900);
  await p.screenshot({ path: `dev/out/state-search-typed-${w}.png` });
  await p.keyboard.press('Escape'); await p.waitForTimeout(600);
  if (w > 990) { await p.locator('[data-mega-toggle]').click(); await p.waitForTimeout(500); await p.screenshot({ path: `dev/out/state-mega-${w}.png` }); await p.keyboard.press('Escape'); }
  else { await p.locator('.header__burger').click(); await p.waitForTimeout(900); await p.screenshot({ path: `dev/out/state-menu-${w}.png` }); await p.keyboard.press('Escape'); }
  await p.goto(B + '/collections/skincare', { waitUntil: 'networkidle' });
  await p.locator('.plp__filter-btn').click(); await p.waitForTimeout(900);
  await p.screenshot({ path: `dev/out/state-filter-${w}.png` });
  await ctx.close();
}
await fetch(B + '/cart/clear');
await b.close();
console.log('ok');
