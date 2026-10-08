// Regenerates the precache list and version in sw.js from the files on disk.
// Run after changing any asset: node tools/build-sw.mjs
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
writeFileSync(swPath, sw.replace(/\/\/ BEGIN GENERATED[\s\S]*?\/\/ END GENERATED/, block));
console.log(`sw.js: ${assets.length} assets, version ${version}`);
