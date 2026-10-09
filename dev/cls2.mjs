import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 412, height: 823 } });
await p.addInitScript(() => { const snap = (tag) => { const o = {}; ['.usp', '.announce', '.site-header', '.rf', '.rf__intro', '.t-h1', '#shopify-section-header-group__announcement', 'main'].forEach((s) => { const e = document.querySelector(s); if (e) o[s] = Math.round(e.getBoundingClientRect().top) + '/' + Math.round(e.getBoundingClientRect().height); }); (window.__snaps = window.__snaps || []).push([tag, Math.round(performance.now()), o]); };
  document.addEventListener('DOMContentLoaded', () => snap('dcl')); [100, 250, 350, 450, 800].forEach((t) => setTimeout(() => snap('t' + t), t)); });
await p.goto('http://localhost:4100' + process.argv[2], { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
console.log((await p.evaluate(() => window.__snaps)).map((x) => JSON.stringify(x)).join('\n'));
await b.close();
