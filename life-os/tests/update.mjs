// A phone that already has Life OS gets the new version: the old one opens from the cache, the new
// one downloads and takes over, and the page reloads into it, unless you're typing, when Reload is
// offered instead. Also from a release older than this update code (the worker does it alone).
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

await step('mid-session: idle, the app reloads into the new release by itself', async () => {
  const p = await open();
  await p.waitForFunction(() => document.body.dataset.release === 'r2');
  await release('r3');
  await p.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await p.waitForFunction(() => document.body.dataset.release === 'r3', null, { timeout: 20000 });
  await p.close();
});

await step('mid-session while typing: nothing reloads under you; Reload is offered and switches', async () => {
  const p = await open();
  await p.waitForFunction(() => document.body.dataset.release === 'r3');
  await p.evaluate(() => { const i = document.createElement('input'); i.id = 'typing'; i.setAttribute('aria-label', 'typing'); document.body.append(i); i.focus(); });
  await p.keyboard.type('half a thought');
  await release('r4');
  await p.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  const btn = p.locator('.toast button', { hasText: 'Reload' });
  await btn.waitFor({ timeout: 20000 });
  if ((await p.inputValue('#typing')) !== 'half a thought') throw new Error('reloaded while typing');
  await btn.click();
  await p.waitForFunction(() => document.body.dataset.release === 'r4', null, { timeout: 20000 });
  await p.close();
});

await ctx.close();

// A phone still on a release from before this fix: its own page code can't switch versions, so the
// new worker must take over by itself, and the old page reloads into the new version.
await step('a phone on an older release (a8485f38) gets the current one without tapping anything', async () => {
  const { execSync } = await import('node:child_process');
  await rm(root, { recursive: true, force: true });
  const old = await mkdtemp(join(tmpdir(), 'lifeos-old-'));
  execSync(`git -C "${src}" archive a8485f38 . | tar -x -C "${old}"`);
  for (const p of ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets']) await cp(join(old, p), join(root, p), { recursive: true });
  await rm(old, { recursive: true, force: true });
  const c = await browser.newContext({ ...devices['iPhone 14'] });
  c.on('page', (pg) => pg.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`)));
  const openIn = async () => {
    const p = await c.newPage();
    await p.goto(`${base}#/plan/tasks`);
    await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
    return p;
  };
  let p = await openIn();
  await p.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 });
  await p.evaluate(() => window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }));
  if (await p.locator('.info-btn').count()) throw new Error('the old release already has the ⓘ');
  // Deploy the current release over it, as a Netlify drop does.
  for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets']) await rm(join(root, f), { recursive: true, force: true });
  for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'js', 'assets']) await cp(join(src, f), join(root, f), { recursive: true });
  // The app stays open (as it does on a phone); it's brought back to the front, which checks for updates.
  await p.reload();
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
  // The new worker takes over and the page reloads into the new version: the ⓘ is there.
  await p.waitForSelector('[data-view="tasks"] .info-btn', { timeout: 30000 });
  const sw = await readFile(join(src, 'sw.js'), 'utf8');
  const want = `lifeos-${sw.match(/const VERSION = '([^']*)'/)[1]}`;
  const keys = await p.evaluate(async () => caches.keys());
  if (!keys.includes(want)) throw new Error(keys.join());
  // Settings › About names the version running, so you can tell which one you have.
  await p.evaluate(() => { location.hash = '#/you/settings'; });
  await p.waitForFunction((v) => document.querySelector('[data-key="sw-version"]')?.textContent === v, want.slice(7), { timeout: 10000 });
  await c.close();
});

server.close();
await rm(root, { recursive: true, force: true });
await finish();
