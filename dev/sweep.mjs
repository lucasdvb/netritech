// Renders every page type at every QA width; reports horizontal overflow, console errors, missing alt text,
// images without dimensions, duplicate ids and heading-level skips. Saves full-page screenshots.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const B = 'http://localhost:4100';
const PAGES = ['/', '/collections/skincare', '/collections/skincare/hydration', '/collections/cleansers', '/collections/anua', '/collections/makeup',
  '/products/round-lab-1025-dokdo-cleanser', '/products/abib-collagen-eye-patch-jericho-rose-jelly', '/cart', '/search?q=serum', '/search?q=zzzz',
  '/pages/about', '/pages/contact', '/pages/delivery', '/pages/brands', '/pages/k-beauty', '/pages/faq', '/pages/routine-finder', '/pages/wishlist', '/pages/skin-diary', '/pages/rewards', '/collections', '/nope', '/password'];
const WIDTHS = (process.env.WIDTHS || '320,360,375,390,414,430,768,1024,1280,1440').split(',').map(Number);
const b = await chromium.launch();
let problems = 0;
await fetch(B + '/__seed-cart');
for (const w of WIDTHS) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  for (const path of PAGES) {
    errs.length = 0;
    const res = await p.goto(B + path, { waitUntil: 'networkidle' });
    const r = await p.evaluate(() => {
      const out = {};
      out.overflow = document.documentElement.scrollWidth - window.innerWidth;
      const wide = [...document.querySelectorAll('body *')].filter((e) => { const b = e.getBoundingClientRect(); return b.right > window.innerWidth + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('.pill-row,.cat-rail__list,.pdp__slides,[data-rail],.drawer,.search-modal,.mega,.buybar,.sr-only') && b.width > 0; });
      out.wide = wide.slice(0, 3).map((e) => e.tagName + '.' + [...e.classList].join('.'));
      out.noAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).length;
      out.noDims = [...document.querySelectorAll('img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).map((i) => i.src.slice(-40)).slice(0, 3);
      const ids = [...document.querySelectorAll('[id]')].map((e) => e.id); out.dupIds = ids.filter((x, i) => ids.indexOf(x) !== i).slice(0, 5);
      const hs = [...document.querySelectorAll('main h1, main h2, main h3, main h4')].map((h) => Number(h.tagName[1]));
      out.h1 = hs.filter((x) => x === 1).length;
      out.skips = hs.filter((x, i) => i > 0 && x - hs[i - 1] > 1).length;
      out.tooSmallTargets = [...document.querySelectorAll('main a, main button, header a, header button')].filter((e) => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && b.height < 24 && cs.display !== 'inline' && !e.closest('.breadcrumbs,.rte,p'); }).map((e) => e.className || e.tagName).slice(0, 3);
      return out;
    });
    const issues = [];
    if (r.overflow > 0) issues.push(`overflowX ${r.overflow}px ${r.wide.join(' ')}`);
    if (path === '/nope') errs.length = 0; // the 404 status itself is logged by the browser
    if (errs.length) issues.push('errors: ' + errs.join(' | '));
    if (r.noAlt) issues.push(`${r.noAlt} img without alt`);
    if (r.noDims.length) issues.push('img w/o dims: ' + r.noDims.join(','));
    if (r.dupIds.length) issues.push('dup ids: ' + r.dupIds.join(','));
    if (r.h1 !== 1 && path !== '/password') issues.push(`h1 count ${r.h1}`);
    if (r.skips) issues.push(`${r.skips} heading skips`);
    if (r.tooSmallTargets.length) issues.push('small targets: ' + r.tooSmallTargets.join(','));
    if (issues.length) { problems++; console.log(`${w}\t${path}\t${res.status()}\t${issues.join(' ; ')}`); }
    if (process.env.SHOTS && (w === 390 || w === 1440)) await p.screenshot({ path: `dev/out/sweep-${w}-${path.replace(/[^a-z0-9]+/gi, '_')}.png`, fullPage: true });
  }
  await p.close();
}
await fetch(B + '/cart/clear');
await b.close();
console.log(problems ? `\n${problems} page/width combinations with issues` : '\nall clean');
