import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 412, height: 823 } });
await p.addInitScript(() => { window.__shifts = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__shifts.push({ v: e.value, t: Math.round(e.startTime), src: e.sources.map((s) => (s.node && (s.node.className || s.node.nodeName)) + ' ' + JSON.stringify(s.previousRect) + '→' + JSON.stringify(s.currentRect)) }); }).observe({ type: 'layout-shift', buffered: true }); });
await p.goto('http://localhost:4100' + process.argv[2], { waitUntil: 'networkidle' }); await p.waitForTimeout(2500);
console.log(JSON.stringify(await p.evaluate(() => window.__shifts), null, 1));
await b.close();
