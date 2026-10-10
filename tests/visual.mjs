// Phase 11: the visual baseline. Every screen, light and dark, and the main sheets, at a fixed
// moment with the same sample data, shrunk to 64 pixels wide and compared with the copy kept in
// tests/visual/. Small enough to keep in the repository, sharp enough to catch a missing section,
// a broken layout or a wrong colour. Text-level detail is the job of the other suites.
// After a deliberate change, refresh the copies:  UPDATE=1 node tests/visual.mjs
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';
const DIR = join(dirname(fileURLToPath(import.meta.url)), 'visual');
const UPDATE = !!process.env.UPDATE;
mkdirSync(DIR, { recursive: true });

const WIDTH = 64;           // baseline width in pixels
const MAX_SCREENS = 3;      // at most three screen heights of each page
const CHANGED = 48;         // a pixel counts as changed when a channel moves more than this
const ALLOWED = 0.015;      // share of changed pixels a page may have before it fails
const MOMENT = '2026-10-07T10:30:00'; // a Wednesday morning

// An empty page to shrink and compare images in.
const toolCtx = await browser.newContext();
const tool = await toolCtx.newPage();
const load = (b64, type = 'png') => `new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/${type};base64,${b64}'; })`;

/** Shrink a screenshot to the baseline size; returns JPEG base64 (a few KB). */
const shrink = (png) => tool.evaluate(async ([src, w, maxH]) => {
  const img = await eval(src);
  const scale = w / img.width;
  const h = Math.round(Math.min(img.height, maxH) * scale);
  const c = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const g = c.getContext('2d');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, 0, 0, img.width, Math.min(img.height, maxH), 0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.85).split(',')[1];
}, [load(png.toString('base64')), WIDTH, 844 * MAX_SCREENS]);

/** Share of pixels that differ between two baselines (a height change counts as difference). */
const compare = (a, b) => tool.evaluate(async ([sa, sb, limit]) => {
  const [ia, ib] = [await eval(sa), await eval(sb)];
  const w = ia.width, h = Math.min(ia.height, ib.height);
  const px = (img) => { const c = Object.assign(document.createElement('canvas'), { width: w, height: img.height }); const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, w, img.height).data; };
  const [da, db] = [px(ia), px(ib)];
  let changed = Math.abs(ia.height - ib.height) * w;
  for (let i = 0; i < w * h * 4; i += 4) if (Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])) > limit) changed++;
  return changed / (w * Math.max(ia.height, ib.height));
}, [load(a, 'jpeg'), load(b, 'jpeg'), CHANGED]);

async function open(scheme, demo = 60) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], deviceScaleFactor: 1, colorScheme: scheme, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => errors.push(`${scheme}: pageerror: ${e.message}`));
  await p.clock.setFixedTime(new Date(MOMENT));
  await p.goto(`${base}#/today`);
  await p.waitForFunction(() => window.__lifeos?.ready);
  if (demo) {
    await p.evaluate(async (n) => { const D = await import('./js/data/demo.js'); await D.loadDemo(n); }, demo);
    await p.reload();
    await p.waitForFunction(() => window.__lifeos?.ready);
  }
  // Let the background work settle (the rest of the data, records and levels), so every run
  // shows the same thing, and clear any moment it announced.
  await p.evaluate(async () => {
    await window.__lifeos.store.complete();
    (await import('./js/domain/progression.js')).run();
    await window.__lifeos.store.flush();
  });
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.fonts.ready);
  return { ctx, p };
}

const results = [];
/** Take, shrink and check (or store) one baseline. */
async function check(p, name) {
  await p.evaluate(() => { document.querySelectorAll('.moment-plate, .toast').forEach((e) => e.remove()); return document.fonts.ready; });
  await p.waitForTimeout(350);
  const small = await shrink(await p.screenshot({ fullPage: true, animations: 'disabled', caret: 'hide' }));
  const file = join(DIR, `${name}.jpg`);
  if (UPDATE || !existsSync(file)) { writeFileSync(file, Buffer.from(small, 'base64')); results.push([name, 'saved']); return; }
  const diff = await compare(readFileSync(file).toString('base64'), small);
  results.push([name, diff]);
  if (diff > ALLOWED) {
    writeFileSync(join(OUT, `visual-${name}.jpg`), Buffer.from(small, 'base64'));
    throw new Error(`${name}: ${(diff * 100).toFixed(1)}% changed (allowed ${ALLOWED * 100}%); the new copy is in ${OUT}/visual-${name}.jpg`);
  }
}

const ROUTES = ['today', 'plan', 'plan/habits', 'plan/habits/h-prayer', 'plan/tasks', 'plan/goals', 'plan/goals/g-body', 'plan/projects', 'plan/books',
  'plan/training', 'plan/training/exercises', 'plan/training/workouts/t-upper', 'plan/playbook', 'plan/commitments', 'plan/rewards',
  'plan/moodboard', 'plan/lists', 'plan/money', 'plan/dates',
  'review', 'progress/trends', 'progress/calendar', 'progress/records', 'progress/season', 'progress/year', 'progress/body', 'progress/body/weight',
  'progress/body/nutrition', 'progress/body/measurements', 'progress/body/sleep', 'progress/areas/mind', 'progress/areas/spirit',
  'progress/areas/relationships', 'progress/areas/work', 'progress/areas/health',
  'reflect/journal', 'reflect/insights', 'reflect/reviews', 'reflect/review/week', 'reflect/review/month',
  'you/settings', 'you/data', 'you/privacy'];
const SHEETS = [
  ['capture', './js/screens/capture.js', 'openCapture', ['walked 30 min']],
  ['you', './js/screens/you.js', 'openYou', []],
  ['morning', './js/screens/ritual.js', 'openRitual', ['morning']],
  ['mode', './js/screens/sheets.js', 'openMode', []],
];

for (const scheme of ['light', 'dark']) {
  await step(`every screen matches its baseline (${scheme})`, async () => {
    const { ctx, p } = await open(scheme);
    const failed = [];
    for (const r of ROUTES) {
      await p.evaluate((h) => { location.hash = `#/${h}`; }, r);
      await p.waitForFunction(() => !document.querySelector('.block--later'));
      try { await check(p, `${scheme}-${r.replace(/\//g, '_')}`); } catch (e) { failed.push(e.message); }
    }
    for (const [label, url, fn, args] of SHEETS) {
      await p.evaluate((h) => { location.hash = h; }, '#/today');
      await p.waitForTimeout(300);
      await p.evaluate(async ([u, f, a]) => { const m = await import(u); m[f](...a); }, [url, fn, args]);
      await p.waitForSelector('.sheet-wrap.is-open');
      try { await check(p, `${scheme}-sheet-${label}`); } catch (e) { failed.push(e.message); }
      for (let i = 0; i < 3 && await p.locator('.sheet-wrap').count(); i++) { await p.keyboard.press('Escape'); await p.waitForTimeout(200); }
    }
    await ctx.close();
    if (failed.length) throw new Error(failed.join('\n'));
  });
}

await step('a fresh install matches its baseline', async () => {
  const { ctx, p } = await open('light', 0);
  for (const r of ['today', 'plan', 'review']) {
    await p.evaluate((h) => { location.hash = `#/${h}`; }, r);
    await p.waitForTimeout(300);
    await check(p, `fresh-${r}`);
  }
  await ctx.close();
});

const worst = results.filter(([, d]) => typeof d === 'number').sort((a, b) => b[1] - a[1]).slice(0, 4);
console.log(`     ${results.length} pages; ${results.filter(([, d]) => d === 'saved').length} saved${worst.length ? `; most changed: ${worst.map(([n, d]) => `${n} ${(d * 100).toFixed(2)}%`).join(', ')}` : ''}`);
await toolCtx.close();
await finish();
