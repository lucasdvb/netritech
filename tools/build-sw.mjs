// Regenerates the precache list and version in sw.js from the files on disk.
// Run after changing any asset: node tools/build-sw.mjs (a unit test runs it with --check)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const include = ['index.html', 'manifest.webmanifest', 'css', 'js', 'assets'];
// Inter's latin-ext files load only for characters beyond basic Latin (unicode-range), so they
// stay out of the precache and are cached the first time a page needs them.
// Extended-Latin fonts load on demand; Bold (700) is declared for rare emphasis but not used, so it isn't cached up front.
const skip = /(\.txt|\.md|LICENSE.*|Inter-latin-ext-\d+\.woff2|Inter-latin-700\.woff2)$/;

const files = [];
const walk = (p) => {
  const st = statSync(p);
  if (st.isDirectory()) readdirSync(p).sort().forEach((f) => walk(join(p, f)));
  else if (!skip.test(p)) files.push(p);
};
include.forEach((p) => walk(join(root, p)));

const hash = createHash('sha256');
for (const f of files) hash.update(relative(root, f)).update(readFileSync(f));
const version = hash.digest('hex').slice(0, 10);
const assets = ['./', ...files.map((f) => `./${relative(root, f).split('\\').join('/')}`)];

const swPath = join(root, 'sw.js');
const sw = readFileSync(swPath, 'utf8');
const block = `// BEGIN GENERATED (node tools/build-sw.mjs)\nconst VERSION = '${version}';\nconst ASSETS = ${JSON.stringify(assets, null, 2)};\n// END GENERATED`;
const next = sw.replace(/\/\/ BEGIN GENERATED[\s\S]*?\/\/ END GENERATED/, block);
// --check: fail when sw.js is out of date, so a change can't ship that phones never download.
if (process.argv.includes('--check')) {
  if (next !== sw) {
    console.error(`sw.js is out of date (should be version ${version}). Run: node tools/build-sw.mjs`);
    process.exit(1);
  }
  console.log(`sw.js is up to date: version ${version}`);
} else {
  writeFileSync(swPath, next);
  console.log(`sw.js: ${assets.length} assets, version ${version}`);
}
