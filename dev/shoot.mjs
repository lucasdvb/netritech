// Screenshots: node dev/shoot.mjs <path> <width> [full=1] [out]
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [,, url = '/', width = '1440', full = '1', out] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(width), height: Number(width) < 700 ? 844 : 900 }, deviceScaleFactor: 1 });
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await p.goto('http://localhost:4100' + url, { waitUntil: 'networkidle' });
// reveal everything for a static full-page capture (the reveal is scroll-triggered)
await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); document.querySelectorAll('.reveal,.reveal-media').forEach(e => e.classList.add('is-in')); });
await p.waitForTimeout(900);
const file = out || `dev/out/${url.replace(/[^a-z0-9]+/gi, '_') || 'home'}-${width}.png`;
await p.screenshot({ path: file, fullPage: full === '1' });
const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
console.log(file, 'h=' + await p.evaluate(() => document.body.scrollHeight), 'overflowX=' + overflow, errors.length ? 'ERRORS: ' + errors.join(' | ') : '');
await b.close();
