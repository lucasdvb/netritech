// Evaluate a JS expression on a page: node dev/probe.mjs <path> <width> "<expr>"
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const [,, url, width, expr] = process.argv;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(width), height: 900 } });
await p.goto('http://localhost:4100' + url, { waitUntil: 'networkidle' });
console.log(JSON.stringify(await p.evaluate(expr), null, 1));
await b.close();
