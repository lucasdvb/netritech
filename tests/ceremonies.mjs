// Phase 10: moments and ceremonies. Each ceremony is timed frame by frame, skips with a tap and
// has a still version under reduced motion; moments draw a line around their card; the monthly
// film saves as a real video; the year's print is a real PNG and the same data makes the same
// picture.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';

async function at(clock, { scheme = 'light', hash = '#/today', reducedMotion = 'no-preference' } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme, reducedMotion, acceptDownloads: true });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => errors.push(`${clock}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${clock}: console: ${m.text()}`); });
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + hash);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await p.waitForTimeout(400);
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const go = async (p, hash, sel) => { await p.evaluate((h) => { location.hash = h; }, hash); await p.waitForSelector(sel); await p.waitForTimeout(300); };
async function holdTouch(p, sel, ms) {
  const box = await p.locator(sel).boundingBox();
  const cdp = await p.context().newCDPSession(p);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await p.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}
/** Frame times of the last ceremony: median and 95th percentile, in ms. */
async function frames(p) {
  const f = await ev(p, () => window.__lifeos.lastCeremony?.frames || []);
  if (f.length < 20) throw new Error(`only ${f.length} frames measured`);
  const s = [...f].sort((a, b) => a - b);
  return { n: s.length, median: s[Math.floor(s.length / 2)], p95: s[Math.floor(s.length * 0.95)] };
}
const smooth = (name, f) => { console.log(`     ${name}: ${f.n} frames, median ${f.median.toFixed(1)} ms, p95 ${f.p95.toFixed(1)} ms`); if (f.median > 17.5 || f.p95 > 20) throw new Error(`${name} below 60 fps: ${JSON.stringify(f)}`); };

await step('seal the day: the ceremony after the hold, smooth, then Undo', async () => {
  const { ctx, p } = await at('2026-10-07T21:00:00');
  await ev(p, async () => (await import('./js/screens/ritual.js')).openRitual('evening', '2026-10-07'));
  for (let i = 0; i < 8 && !(await p.locator('.sheet .hold-btn').count()); i++) { await p.locator('.sheet [data-action="r-skip"]').click(); await p.waitForTimeout(150); }
  await holdTouch(p, '.sheet .hold-btn', 1500);
  await p.waitForSelector('.stage[data-ceremony="seal"]');
  await p.waitForTimeout(1300);
  await p.screenshot({ path: `${OUT}/p10-seal.png` });
  await p.waitForSelector('.stage[data-ceremony="seal"]', { state: 'detached', timeout: 6000 });
  await p.waitForSelector('.toast:has-text("sealed") .toast-btn');
  if (!(await ev(p, () => window.__lifeos.store.get('dailyReviews', '2026-10-07')?.sealedAt))) throw new Error('not sealed');
  // a tap skips it
  ev(p, async () => (await import('./js/ceremony/seal.js')).sealCeremony('2026-10-07'));
  await p.waitForSelector('.stage[data-ceremony="seal"]');
  await p.waitForTimeout(400);
  await p.mouse.click(200, 300);
  await p.waitForSelector('.stage[data-ceremony="seal"]', { state: 'detached', timeout: 1500 });
  if (!(await ev(p, () => window.__lifeos.lastCeremony.skipped))) throw new Error('not marked skipped');
  await ctx.close();
});

await step('reduced motion: every ceremony is a still card with Close', async () => {
  const { ctx, p } = await at('2026-10-07T21:00:00', { reducedMotion: 'reduce' });
  await ev(p, () => window.__lifeos.store.put('dailyReviews', { id: '2026-10-07', date: '2026-10-07', sealedAt: new Date().toISOString(), win: 'Shipped the proposal' }));
  for (const [name, call] of [['seal', "(await import('./js/ceremony/seal.js')).sealCeremony('2026-10-07')"],
    ['film', "(await import('./js/ceremony/film.js')).playFilm((await import('./js/domain/film.js')).monthFilm('2026-10'))"],
    ['year', "(await import('./js/ceremony/year.js')).playYear((await import('./js/domain/film.js')).yearData(2026))"]]) {
    ev(p, (c) => eval(`(async () => { ${c}; })()`), call);
    await p.waitForSelector(`.stage[data-ceremony="${name}"] [data-stage-close]`);
    if (await p.locator('.stage .stage-skip').count()) throw new Error(`${name}: animated under reduced motion`);
    if (name === 'seal') await p.screenshot({ path: `${OUT}/p10-seal-still.png` });
    await p.locator('.stage [data-stage-close]').last().click();
    await p.waitForSelector('.stage', { state: 'detached' });
    if (!(await ev(p, () => window.__lifeos.lastCeremony.still))) throw new Error(`${name}: not the still version`);
  }
  await ctx.close();
});

await step('moments: the last of your three draws a line around the Now card; a level engraves a plate', async () => {
  const { ctx, p } = await at('2026-10-07T12:00:00');
  // two binary habits in focus; nine earlier days of one of them
  await ev(p, async () => {
    const { store } = window.__lifeos;
    store.setProfile({ trackingStart: '2026-09-01' });
    const H = await import('./js/domain/habits.js');
    const ids = H.activeHabits().filter((h) => h.type === 'binary' && !h.source && !h.optional && (h.schedule?.kind || 'daily') === 'daily').slice(0, 2).map((h) => h.id);
    for (const h of H.activeHabits()) if (H.stateOf(h) === 'focus' && !ids.includes(h.id)) store.put('habits', { ...h, state: 'autopilot' });
    for (const id of ids) store.put('habits', { ...H.habit(id), state: 'focus', focusSince: '2026-09-01' });
    for (let n = 1; n <= 9; n++) { const d = new Date('2026-10-07T12:00:00'); d.setDate(d.getDate() - n); const iso = d.toISOString().slice(0, 10); store.put('habitLogs', { id: `${ids[0]}:${iso}`, habitId: ids[0], date: iso, value: 1 }); }
    window.__ids = ids;
  });
  await p.waitForTimeout(2500); // the history is engraved quietly
  await p.reload();
  await p.waitForFunction(() => window.__lifeos?.ready);
  await p.waitForTimeout(2500);
  await ev(p, async () => { const H = await import('./js/domain/habits.js'); const ids = H.focusHabits().map((h) => h.id); for (const id of ids) window.__lifeos.store.put('habitLogs', { id: `${id}:2026-10-07`, habitId: id, date: '2026-10-07', value: 1 }); });
  // one action, one moment: the tenth time wins over "your three are done"
  await p.waitForSelector('.moment-plate:has-text("Practised")', { timeout: 10000 });
  await p.screenshot({ path: `${OUT}/p10-moment.png` });
  await p.waitForFunction(() => window.__lifeos.store.get('meta', 'focusMoment')?.on === '2026-10-07');
  await ctx.close();
  // the same day, nothing else new: the three done is its own moment, with a line around the Now card
  const { ctx: c2, p: p2 } = await at('2026-10-08T12:00:00');
  await ev(p2, async () => {
    const { store } = window.__lifeos;
    const H = await import('./js/domain/habits.js');
    const h = H.activeHabits().find((x) => x.type === 'binary' && !x.source && !x.optional && (x.schedule?.kind || 'daily') === 'daily');
    for (const x of H.activeHabits()) if (H.stateOf(x) === 'focus' && x.id !== h.id) store.put('habits', { ...x, state: 'autopilot' });
    store.setProfile({ trackingStart: '2026-10-01' });
    store.put('habits', { ...h, state: 'focus', focusSince: '2026-10-01' });
    store.put('habitLogs', { id: `${h.id}:2026-10-06`, habitId: h.id, date: '2026-10-06', value: 1 }); // its first time was earlier
  });
  await p2.waitForTimeout(2500);
  await ev(p2, async () => { const H = await import('./js/domain/habits.js'); const h = H.focusHabits()[0]; window.__lifeos.store.put('habitLogs', { id: `${h.id}:2026-10-08`, habitId: h.id, date: '2026-10-08', value: 1 }); });
  await p2.waitForSelector('.moment-plate:has-text("Your three are done")', { timeout: 10000 });
  await p2.waitForSelector('.moment-outline');
  await c2.close();
});

await step('season finale: offered when the season ends, plays smoothly, ends on its summary', async () => {
  const { ctx, p } = await at('2026-10-07T19:00:00', { scheme: 'dark' });
  await ev(p, async () => { const S = await import('./js/domain/seasons.js'); S.create({ name: 'Foundations', intention: 'Strong mornings, calm evenings', habitIds: [], start: '2026-08-24' }); });
  await p.reload(); // a season that ended while the app was closed: its finale is offered on opening
  await p.waitForFunction(() => window.__lifeos?.ready);
  await p.waitForSelector('.moment-plate:has-text("Foundations is complete") [data-moment-act]', { timeout: 10000 });
  await p.locator('.moment-plate [data-moment-act]').click();
  await p.waitForSelector('.stage[data-ceremony="finale"]');
  await p.waitForSelector('.stage.is-ended', { timeout: 9000 });
  await p.screenshot({ path: `${OUT}/p10-finale.png` });
  await p.locator('.stage [data-stage-close]').click();
  await p.waitForSelector('.stage', { state: 'detached' });
  await ctx.close();
});

await step('the monthly film plays, skips to its end with a tap, and saves as a real video', async () => {
  const { ctx, p } = await at('2026-10-30T20:00:00', { hash: '#/reflect' });
  await ev(p, async () => { const D = await import('./js/data/demo.js'); await D.loadDemo(45); });
  await go(p, '#/today', '.now');
  await go(p, '#/reflect', '[data-key="films"] [data-action="film"]');
  await p.locator('[data-key="films"] [data-action="film"]').first().click();
  await p.waitForSelector('.stage[data-ceremony="film"] canvas');
  await p.waitForTimeout(3000);
  await p.screenshot({ path: `${OUT}/p10-film.png` });
  const lit = await ev(p, () => { const c = document.querySelector('.film-canvas'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4 * 97) if (d[i] > 200) n++; return n; });
  if (lit < 20) throw new Error('nothing drawn on the film');
  await p.mouse.click(200, 400);
  await p.waitForSelector('.stage.is-ended [data-film-save]');
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 45000 }), p.locator('[data-film-save]').click()]);
  const buf = readFileSync(await dl.path());
  const webm = buf.subarray(0, 4).toString('hex') === '1a45dfa3';
  const mp4 = buf.subarray(4, 8).toString() === 'ftyp';
  if (!(webm || mp4) || buf.length < 20000) throw new Error(`not a video: ${buf.length} bytes, ${buf.subarray(0, 8).toString('hex')}`);
  console.log(`     ${dl.suggestedFilename()}: ${(buf.length / 1024).toFixed(0)} KB`);
  await p.locator('.stage [data-stage-close]').click();
  await ctx.close();
});

await step('your year: the same data makes the same picture, and the print is a 3600 × 4500 PNG', async () => {
  const { ctx, p } = await at('2026-10-07T20:00:00', { hash: '#/progress/year' });
  await ev(p, async () => { const D = await import('./js/data/demo.js'); await D.loadDemo(60); });
  await go(p, '#/today', '.now');
  await go(p, '#/progress/year', '.year-art');
  const same = await ev(p, async () => {
    const [Y, D] = await Promise.all([import('./js/ceremony/year.js'), import('./js/domain/film.js')]);
    const hash = (data) => { const c = document.createElement('canvas'); c.width = 600; c.height = 750; Y.drawPrint(c.getContext('2d'), data, { w: 600, h: 750 }); return c.toDataURL(); };
    const a = hash(D.yearData(2026)), b = hash(D.yearData(2026));
    const other = D.yearData(2026); other.days[200] = { ...other.days[200], ratio: 1, sealed: true };
    return [a === b, a !== hash(other)];
  });
  if (!same[0]) throw new Error('the same data drew a different picture');
  if (!same[1]) throw new Error('different data drew the same picture');
  await p.screenshot({ path: `${OUT}/p10-year.png`, fullPage: true });
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.locator('[data-action="yr-print"]').click()]);
  const buf = readFileSync(await dl.path());
  if (buf.subarray(1, 4).toString() !== 'PNG') throw new Error('not a PNG');
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  if (w !== 3600 || h !== 4500) throw new Error(`print is ${w} × ${h}`);
  await p.locator('[data-action="yr-play"]').click();
  await p.waitForSelector('.stage[data-ceremony="year"].is-ended', { timeout: 8000 });
  await p.locator('.stage [data-stage-close]').click().catch(() => p.mouse.click(200, 200));
  await p.waitForSelector('.stage', { state: 'detached' });
  await ctx.close();
});

// Playwright's test clock also fakes animation-frame times, so smoothness is measured on the real
// clock, with the CPU slowed four times to stand in for a mid-range phone.
await step('60 fps on a phone profile (4× slower CPU): seal, finale, film and year', async () => {
  const ctx = await browser.newContext({ ...devices['iPhone 14'] });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(`frames: pageerror: ${e.message}`));
  await p.goto(base + '#/today');
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  await ev(p, async () => { const D = await import('./js/data/demo.js'); await D.loadDemo(42); });
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const plays = {
    seal: async () => (await import('./js/ceremony/seal.js')).sealCeremony((await import('./js/domain/dates.js')).today()),
    finale: async () => { const S = await import('./js/domain/seasons.js'); const { season } = S.create({ name: 'Frames', habitIds: [], start: '2026-01-05' }); S.finalize(); return (await import('./js/ceremony/finale.js')).finale(season.id); },
    film: async () => { const D = await import('./js/domain/film.js'); return (await import('./js/ceremony/film.js')).playFilm(D.monthFilm(D.filmMonths(1)[0])); },
    year: async () => { const D = await import('./js/domain/film.js'); return (await import('./js/ceremony/year.js')).playYear(D.yearData()); },
  };
  for (const [name, fn] of Object.entries(plays)) {
    p.evaluate(`(${fn.toString()})()`);
    await p.waitForSelector(`.stage[data-ceremony="${name}"]`);
    await p.waitForSelector(`.stage[data-ceremony="${name}"].is-ended, .stage[data-ceremony="${name}"]:not(:has([data-stage-close]))`, { timeout: 20000 });
    await p.waitForTimeout(name === 'film' ? 500 : 300);
    if (await p.locator('.stage [data-stage-close]').count()) await p.locator('.stage [data-stage-close]').last().click();
    await p.waitForSelector('.stage', { state: 'detached', timeout: 8000 });
    smooth(name, await frames(p));
  }
  await cdp.detach();
  await ctx.close();
});

await step('the sound palette is off by default and switches on in Settings', async () => {
  const { ctx, p } = await at('2026-10-07T09:00:00', { hash: '#/you/settings' });
  if (await ev(p, () => window.__lifeos.store.settings().sound === true)) throw new Error('sound on by default');
  await p.locator('[data-key="sound"] [role="switch"]').click();
  await p.waitForFunction(() => window.__lifeos.store.settings().sound === true);
  await ctx.close();
});

await finish();
