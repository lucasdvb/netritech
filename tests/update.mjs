// A phone that already has Life OS gets the new version: the old one opens from the cache, the new
// one downloads, and it's applied the next time the app opens, even when it finished downloading
// in a session that's already closed. Mid-session it's offered with Update instead.
// Serves a copy of the app from a temporary folder so a "new release" can be published.
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, cp, writeFile, rm, mkdtemp } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { setup } from './helpers.mjs';

const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { browser, step, finish, errors } = t;

const src = join(dirname(fileURLToPath(import.meta.url)), '..');
const root = await mkdtemp(join(tmpdir(), 'lifeos-update-'));
for (const p of ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets']) await cp(join(src, p), join(root, p), { recursive: true });
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = join(root, path.endsWith('/') ? `${path}index.html` : path);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

/** Publish a new release: a visible change in the app, and a new worker version. */
async function release(label) {
  const sw = await readFile(join(root, 'sw.js'), 'utf8');
  await writeFile(join(root, 'sw.js'), sw.replace(/const VERSION = '[^']*'/, `const VERSION = '${label}'`));
  const html = await readFile(join(src, 'index.html'), 'utf8');
  await writeFile(join(root, 'index.html'), html.replace('<body', `<body data-release="${label}"`));
}

const ctx = await browser.newContext({ ...devices['iPhone 14'] });
ctx.on('page', (pg) => pg.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`)));
const open = async () => {
  const p = await ctx.newPage();
  await p.goto(`${base}#/today`);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
  return p;
};
const controlled = (p) => p.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 });
const version = (p) => p.evaluate(async () => (await caches.keys()).filter((k) => k.startsWith('lifeos-')).join());

await step('first visit installs the app for offline use', async () => {
  const p = await open();
  await controlled(p);
  await p.evaluate(() => window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }));
  await p.close();
});

await step('a release that finished downloading in a closed session is applied on the next open', async () => {
  await release('r2');
  // Open, let the new version download, and close before doing anything with it.
  let p = await open();
  await p.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration())?.waiting
    || (await caches.keys()).includes('lifeos-r2'), null, { timeout: 20000 });
  await p.close();
  // Next open: the waiting version takes over and the page shows it.
  p = await open();
  await p.waitForFunction(() => document.body.dataset.release === 'r2', null, { timeout: 20000 });
  if (!(await version(p)).includes('lifeos-r2')) throw new Error(await version(p));
  await p.close();
});

await step('mid-session, a new release is offered with Update, and Update switches to it', async () => {
  const p = await open();
  await p.waitForFunction(() => document.body.dataset.release === 'r2');
  await p.waitForTimeout(8500); // past the first moments after opening
  await p.locator('[data-view="today"]').click({ position: { x: 5, y: 5 } }).catch(() => {});
  await release('r3');
  await p.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  const btn = p.locator('.toast button', { hasText: 'Update' });
  await btn.waitFor({ timeout: 20000 });
  await btn.click();
  await p.waitForFunction(() => document.body.dataset.release === 'r3', null, { timeout: 20000 });
  await p.close();
});

await ctx.close();
server.close();
await rm(root, { recursive: true, force: true });
await finish();
