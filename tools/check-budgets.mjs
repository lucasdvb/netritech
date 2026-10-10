// Performance budgets from docs/product-architecture.md (section 16.2): the offline
// precache, and the JavaScript needed to show Today (app.js plus the static imports of
// it and of the Today screen). Each has a target, which warns, and a hard limit, which
// fails. Run: node tools/check-budgets.mjs   (exits 1 when a hard limit is broken)
import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const KB = 1024;
const BUDGETS = {
  // What a phone downloads once per version: the precache compressed (as hosts serve it). See the plan, section 16.2.
  precache: { target: 896 * KB, limit: 1024 * KB },
  firstRenderJs: { target: 200 * KB, limit: 240 * KB },
};

const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const assets = JSON.parse(/const ASSETS = (\[[\s\S]*?\]);/.exec(sw)[1]).filter((a) => a !== './');
const precacheRaw = assets.reduce((sum, a) => sum + statSync(join(root, a)).size, 0);
// Fonts and images are already compressed; text files are gzipped the way a host serves them.
const precache = assets.reduce((sum, a) => sum + (/\.(woff2|png|jpe?g|gif|webp)$/.test(a) ? statSync(join(root, a)).size : gzipSync(readFileSync(join(root, a)), { level: 6 }).length), 0);

// Follow static imports only: screens other than Today load on demand.
const seen = new Set();
function walk(file) {
  if (seen.has(file)) return;
  seen.add(file);
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/^\s*import\s+(?:[\s\S]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/gm)) walk(resolve(dirname(file), m[1]));
}
walk(join(root, 'js/app.js'));
walk(join(root, 'js/screens/today.js'));
const firstRenderJs = [...seen].reduce((sum, f) => sum + statSync(f).size, 0);

const rows = [
  [`Precache download (works offline; ${(precacheRaw / KB).toFixed(0)} KB uncompressed)`, precache, BUDGETS.precache],
  [`JS for first render (${seen.size} files)`, firstRenderJs, BUDGETS.firstRenderJs],
];
let ok = true;
const kb = (n) => `${(n / KB).toFixed(0)} KB`;
for (const [label, size, { target, limit }] of rows) {
  const status = size > limit ? 'FAIL' : size > target ? 'warn' : 'ok  ';
  if (size > limit) ok = false;
  console.log(`${status} ${label}: ${kb(size)} (target ${kb(target)}, limit ${kb(limit)})`);
}
process.exit(ok ? 0 : 1);
