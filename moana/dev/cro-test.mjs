// CRO features: delivery estimate, complete-your-routine, recently viewed. node dev/cro-test.mjs
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const B = 'http://localhost:4100';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
let pass = 0, fail = 0;
const ok = (c, m) => { c ? pass++ : fail++; console.log((c ? 'PASS ' : 'FAIL ') + m); };

await p.goto(B + '/products/anua-heartleaf-quercetinol-pore-deep-cleansing-foam', { waitUntil: 'networkidle' });
const eta = await p.textContent('.pdp__avail [data-eta]');
ok(/usually with you .+ to .+/.test(eta), 'PDP delivery estimate: ' + eta);
const next = await p.$('.pdp__next');
ok(!!next, 'PDP shows Complete your routine');
const nextStep = next && await p.textContent('.pdp__next-step');
ok(/Tone/.test(nextStep || ''), 'next step after Cleanse is Tone: ' + nextStep);
await p.click('.pdp__next-form button');
await p.waitForSelector('[data-cart-drawer].is-open', { timeout: 5000 }).catch(() => {});
ok(await p.$('[data-cart-drawer].is-open') !== null, 'next-step add opens the bag');
const deta = await p.textContent('[data-cart-drawer] [data-eta]').catch(() => '');
ok(/usually with you/.test(deta), 'bag shows delivery estimate: ' + deta);

await p.goto(B + '/products/round-lab-1025-dokdo-cleanser', { waitUntil: 'networkidle' });
const stored = await p.evaluate(() => JSON.parse(localStorage.getItem('moana:recent') || '[]'));
ok(stored[0] === 'round-lab-1025-dokdo-cleanser' && stored[1] === 'anua-heartleaf-quercetinol-pore-deep-cleansing-foam', 'recent list records views newest first');
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await p.waitForSelector('[data-recent]:not([hidden]) .card', { timeout: 5000 }).catch(() => {});
const rv = await p.$$eval('[data-recent] .card', (c) => c.length);
ok(rv === 1, 'recently viewed shows the other product only (' + rv + ')');

// weekend arithmetic: Friday -> Mon..Wed
const calc = await p.evaluate(() => {
  const RealDate = Date;
  function at(iso) { return new RealDate(iso); }
  const out = [];
  for (const iso of ['2026-10-09T08:00:00+04:00', '2026-10-10T08:00:00+04:00', '2026-10-12T08:00:00+04:00']) {
    window.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [at(iso)])); } static now() { return at(iso).getTime(); } };
    const el = document.createElement('span'); el.setAttribute('data-eta', ''); document.body.appendChild(el);
    window.MoanaEta(document.body); out.push(el.textContent); el.remove();
  }
  window.Date = RealDate; return out;
});
ok(/Mon 12 Oct to Wed 14 Oct/.test(calc[0]), 'Friday order: ' + calc[0]);
ok(/Mon 12 Oct to Wed 14 Oct/.test(calc[1]), 'Saturday order: ' + calc[1]);
ok(/Tue 13 Oct to Thu 15 Oct/.test(calc[2]), 'Monday order: ' + calc[2]);
ok(errors.length === 0, 'no console errors ' + errors.join(' | '));
console.log(`\n${pass} passed, ${fail} failed`);
await b.close();
process.exit(fail ? 1 : 0);
