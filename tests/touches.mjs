// Small things that make the app quicker to use: a message can be swiped away instead of waiting
// for it, Back stays at the top of the screen however far down a page you are, an exercise can carry
// a picture or GIF of the movement (picked or pasted when it's added) that shows large in gym mode,
// and Today has one field for logging, without a microphone button.
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';
const GIF = fileURLToPath(new URL('./fixtures/squat.gif', import.meta.url));

async function at(clock, { scheme = 'light', hash = '#/today', perms = [] } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme });
  if (perms.length) await ctx.grantPermissions(perms, { origin: new URL(base).origin });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on('pageerror', (e) => errors.push(`${clock}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${clock}: console: ${m.text()}`); });
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + hash);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.evaluate(() => window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }));
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);

/** Drag the first message by dx, dy with a finger-like pointer, in a few steps. */
async function drag(p, dx, dy) {
  const box = await p.locator('.toast').first().boundingBox();
  const x = box.x + 30, y = box.y + box.height / 2;
  await p.mouse.move(x, y);
  await p.mouse.down();
  for (let i = 1; i <= 6; i++) await p.mouse.move(x + (dx * i) / 6, y + (dy * i) / 6);
  await p.mouse.up();
}

await step('a message can be swiped away (sideways or down); a short drag springs back; the change stays undoable', async () => {
  const { ctx, p } = await at('2026-10-07T10:00:00');
  const undone = () => ev(p, () => window.__undone);
  await ev(p, () => window.__lifeos.app.toast('Water logged', { action: { label: 'Undo', fn: () => { window.__undone = true; } } }));
  await p.waitForSelector('.toast');
  // A short drag: it stays.
  await drag(p, 30, 0);
  await p.waitForTimeout(300);
  if (!(await p.locator('.toast').count())) throw new Error('a short drag cleared it');
  // A real swipe: gone at once, long before its six seconds.
  await drag(p, -160, 0);
  await p.waitForSelector('.toast', { state: 'detached', timeout: 1000 });
  if (await undone()) throw new Error('swiping it away undid the change');
  // Down works too.
  await ev(p, () => window.__lifeos.app.toast('Saved'));
  await p.waitForSelector('.toast');
  await drag(p, 0, 120);
  await p.waitForSelector('.toast', { state: 'detached', timeout: 1000 });
  // The swiped change is still in Recent changes.
  await ev(p, async () => (await import('./js/screens/recent.js')).openRecent());
  await p.waitForSelector('.sheet .recent-row');
  if (!(await p.textContent('.sheet')).includes('Water logged')) throw new Error('not in Recent changes');
  await ctx.close();
});

await step('Back stays at the top of the screen on a long page, and takes you back', async () => {
  const { ctx, p } = await at('2026-10-07T10:00:00', { hash: '#/plan' });
  await ev(p, () => { location.hash = '#/plan/habits/h-prayer'; });
  await p.waitForSelector('[data-key="linked"]');
  await ev(p, () => window.scrollTo(0, document.documentElement.scrollHeight));
  await p.waitForTimeout(300);
  const y = await ev(p, () => window.scrollY);
  if (y < 300) throw new Error(`the page didn't scroll (${y})`);
  const box = await p.locator('.back-btn').boundingBox();
  if (!box || box.y < 0 || box.y > 80) throw new Error(`Back is not at the top: ${JSON.stringify(box)}`);
  await p.screenshot({ path: `${OUT}/touches-sticky-back.png` });
  await p.locator('.back-btn').click();
  await p.waitForFunction(() => location.hash !== '#/plan/habits/h-prayer');
  await ctx.close();
});

await step('dark mode: Back over a scrolled page', async () => {
  const { ctx, p } = await at('2026-10-07T10:00:00', { scheme: 'dark', hash: '#/plan/habits/h-prayer' });
  await p.waitForSelector('[data-key="linked"]');
  await ev(p, () => window.scrollTo(0, 600));
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/touches-sticky-back-dark.png` });
  await ctx.close();
});

await step('a new exercise with a GIF of the movement: kept as it is, and large in gym mode', async () => {
  const { ctx, p } = await at('2026-10-09T06:30:00', { hash: '#/plan/training/exercises' });
  await p.waitForSelector('[data-action="new"]');
  await p.locator('[data-action="new"]').click();
  await p.waitForSelector('.sheet input[name="name"]');
  await p.fill('.sheet input[name="name"]', 'Cossack squat');
  await p.locator('.sheet [data-change="pp-add"]').setInputFiles(GIF);
  await p.waitForSelector('.sheet [data-key^="pp-"] img');
  // What was typed is still there after the picture went in.
  if ((await p.inputValue('.sheet input[name="name"]')) !== 'Cossack squat') throw new Error('the name was lost');
  await p.screenshot({ path: `${OUT}/touches-new-exercise.png` });
  await p.locator('.sheet button[type="submit"]').click();
  await p.waitForFunction(() => window.__lifeos.store.all('exercises').find((x) => x.name === 'Cossack squat')?.photos?.length === 1);
  const ex = await ev(p, async () => {
    const e = window.__lifeos.store.all('exercises').find((x) => x.name === 'Cossack squat');
    const b = await (await import('./js/data/blobs.js')).blobs.get(e.photos[0].id);
    return { id: e.id, gif: e.photos[0].gif, type: b?.blob?.type, w: e.photos[0].w };
  });
  if (!ex.gif || ex.type !== 'image/gif' || ex.w !== 240) throw new Error(JSON.stringify(ex));
  // In a session: the first exercise of the upper-body workout carries the same picture, then gym mode.
  const wid = await ev(p, async (eid) => {
    const { store } = window.__lifeos;
    const w = (await import('./js/screens/workout-actions.js')).startWorkout('t-upper');
    const F = await import('./js/domain/fitness.js');
    const first = F.setsOf(w.id)[0].exerciseId;
    store.update('exercises', first, { photos: store.get('exercises', eid).photos });
    return w.id;
  }, ex.id);
  await p.goto(`${base}#/workout/${wid}/gym`);
  await p.waitForSelector('.exm-line--gym img[src]');
  const img = await p.locator('.exm-line--gym .exm-thumb').first().boundingBox();
  if (img.width < 180) throw new Error(`picture too small in gym mode: ${img.width}px`);
  await p.screenshot({ path: `${OUT}/touches-gym-picture.png` });
  await ctx.close();
});

await step('paste a copied picture onto an exercise', async () => {
  const { ctx, p } = await at('2026-10-09T06:30:00', { hash: '#/plan/training/exercises', perms: ['clipboard-read', 'clipboard-write'] });
  const eid = await ev(p, () => window.__lifeos.store.all('exercises').find((x) => !x.archived && !x.photos?.length).id);
  await ev(p, async () => {
    const c = document.createElement('canvas'); c.width = 120; c.height = 80;
    c.getContext('2d').fillRect(10, 10, 60, 40);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  });
  await ev(p, async (id) => (await import('./js/screens/exercise-media-ui.js')).openMedia(id), eid);
  await p.waitForSelector('.sheet [data-action="exm-paste"]');
  await p.locator('.sheet [data-action="exm-paste"]').click();
  await p.waitForFunction((id) => (window.__lifeos.store.get('exercises', id).photos || []).length === 1, eid);
  await p.waitForSelector('.sheet .exm-thumbs--edit img[src]');
  await ctx.close();
});

await step('Today: one field to log anything, no microphone button', async () => {
  const { ctx, p } = await at('2026-10-07T10:00:00');
  await p.waitForSelector('.logbar-field');
  if (await p.locator('.logbar-mic, [data-action="capture-listen"]').count()) throw new Error('microphone still on Today');
  const w = await p.locator('.logbar-field').boundingBox();
  const bar = await p.locator('.logbar').boundingBox();
  if (w.width < bar.width - 2) throw new Error('the field doesn’t take the full width');
  await ctx.close();
});

await finish();
