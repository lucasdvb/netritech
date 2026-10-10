// Motion check: scrolls to a selector, captures the viewport at three scroll offsets so the
// scroll-driven animations can be compared. node dev/motion-shot.mjs <path> <width> <selector> <prefix>
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [,, url = '/', width = '1440', sel = 'body', prefix = 'motion'] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(width), height: Number(width) < 700 ? 844 : 900 } });
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await p.goto('http://localhost:4100' + url, { waitUntil: 'networkidle' });
await p.evaluate(() => document.querySelectorAll('.reveal,.reveal-media,[data-lines]').forEach(e => e.classList.add('is-in')));
const top = await p.evaluate((s) => { const el = document.querySelector(s); return el.getBoundingClientRect().top + scrollY; }, sel);
let i = 0;
for (const off of [-600, -250, 100]) {
  await p.evaluate((y) => window.scrollTo(0, Math.max(0, y)), top + off);
  await p.waitForTimeout(700);
  await p.screenshot({ path: `dev/out/${prefix}-${i++}.png` });
}
const info = await p.evaluate((s) => [...document.querySelectorAll(s + ' *')].slice(0, 400).map(e => getComputedStyle(e).translate).filter(t => t !== 'none').slice(0, 6), sel);
console.log('translates:', info, errors.length ? 'ERRORS: ' + errors.join(' | ') : 'no errors');
await b.close();
