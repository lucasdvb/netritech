// Phase 5: rituals and resilience, over simulated calendars. The evening ritual in about a minute
// with every step skippable; sealing the day as a real press and hold; the morning ritual; a
// five-day absence that brings a fresh start and no list of misses; catch-up once; backup plans and
// your why at the moment you'd skip; shrink and grow suggestions that don't repeat; the tidy-up.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';

async function at(clock, { scheme = 'light', device = devices['iPhone 14'], before } = {}) {
  const ctx = await browser.newContext({ ...device, colorScheme: scheme });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on('pageerror', (e) => errors.push(`${clock}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${clock}: console: ${m.text()}`); });
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + '#/today');
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  if (before) { await p.evaluate(before); await p.reload(); await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 }); }
  await p.waitForSelector('.today .now');
  await p.waitForTimeout(500);
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const ritual = (p, which) => ev(p, async (w) => (await import('./js/screens/ritual.js')).openRitual(w), which);
const stepName = (p) => p.getAttribute('.ritual', 'data-step');

async function holdTouch(p, sel, ms) {
  const box = await p.locator(sel).boundingBox();
  const cdp = await p.context().newCDPSession(p);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await p.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

await step('evening ritual: what applies, one question per screen, then a hold seals the day', async () => {
  const { ctx, p } = await at('2026-10-10T20:30:00');
  const ids = await ev(p, async () => (await import('./js/domain/next-action.js')).nextActions().map((a) => a.id));
  if (!ids.includes('ritual-evening')) throw new Error('no evening ritual on the Now card: ' + ids);
  const t0 = Date.now();
  await ritual(p, 'evening');
  await p.waitForSelector('.ritual');
  const seen = [];
  for (let i = 0; i < 8; i++) {
    const s = await stepName(p);
    seen.push(s);
    if (s === 'habits') { await p.locator('.ritual-habits [data-action="r-tick"]').first().click(); }
    if (s === 'win') await p.locator('.ritual textarea').fill('Walked with my fiancée');
    if (s === 'tomorrow') await p.locator('.ritual input').fill('Send the proposal');
    if (s === 'seal') break;
    await p.screenshot({ path: `${OUT}/p5-evening-${i}-${s}.png` });
    await p.locator('[data-action="r-next"]').click();
    await p.waitForFunction((prev) => document.querySelector('.ritual')?.dataset.step !== prev, s);
  }
  if (seen.join() !== 'habits,win,tasks,tomorrow,seal') throw new Error('steps ' + seen);
  await p.screenshot({ path: `${OUT}/p5-seal.png` });
  // a short press does nothing
  await holdTouch(p, '.hold-btn', 250);
  if (await ev(p, () => window.__lifeos.store.get('dailyReviews', '2026-10-10')?.sealedAt)) throw new Error('a tap sealed the day');
  await holdTouch(p, '.hold-btn', 1500);
  await p.waitForSelector('.toast:has-text("sealed")');
  const secs = (Date.now() - t0) / 1000;
  const r = await ev(p, () => window.__lifeos.store.get('dailyReviews', '2026-10-10'));
  if (!r.sealedAt || r.win !== 'Walked with my fiancée') throw new Error('day record ' + JSON.stringify(r));
  const moved = await ev(p, () => window.__lifeos.store.all('tasks').filter((x) => x.date === '2026-10-11' && !x.done).map((x) => x.title));
  if (!moved.includes('Send the proposal')) throw new Error('tomorrow ' + moved);
  console.log(`     evening ritual, automated: ${secs.toFixed(1)} s for ${seen.length} screens`);
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  const left = await ev(p, async () => (await import('./js/domain/next-action.js')).nextActions().map((a) => a.id));
  if (left.includes('ritual-evening')) throw new Error('the ritual is still offered after sealing');
  await ctx.close();
});

await step('every ritual step can be skipped, and skipping saves nothing', async () => {
  const { ctx, p } = await at('2026-10-10T20:30:00');
  await ritual(p, 'evening');
  await p.waitForSelector('.ritual');
  for (let i = 0; i < 6 && (await stepName(p)) !== 'seal'; i++) {
    const s = await stepName(p);
    if (s === 'win') await p.locator('.ritual textarea').fill('typed then skipped');
    await p.locator('[data-action="r-skip"]').click();
    await p.waitForFunction((prev) => document.querySelector('.ritual')?.dataset.step !== prev, s);
  }
  await p.locator('[data-action="r-close"]').click();
  const r = await ev(p, () => window.__lifeos.store.get('dailyReviews', '2026-10-10'));
  if (r?.sealedAt || r?.win) throw new Error('skipped steps saved something ' + JSON.stringify(r));
  await ctx.close();
});

await step('morning ritual from the Now card: sleep, how you feel, weight, your three', async () => {
  const { ctx, p } = await at('2026-10-07T07:00:00');
  if (!(await p.textContent('.now-body')).includes('check-in')) throw new Error('now');
  await p.locator('.now-go').click();
  await p.waitForSelector('.ritual[data-step="sleep"]');
  await p.locator('.ritual [data-f="quality"][data-value="8"]').click();
  await p.locator('[data-action="r-next"]').click();
  await p.waitForSelector('.ritual[data-step="feel"]');
  await p.locator('.ritual [data-f="energy"][data-value="7"]').click();
  await p.screenshot({ path: `${OUT}/p5-morning-feel.png` });
  await p.locator('[data-action="r-next"]').click();
  await p.locator('[data-action="r-skip"]').click();
  await p.waitForSelector('.ritual[data-step="three"]');
  await p.locator('.ritual-three input').first().fill('Send the proposal');
  await p.locator('.ritual-three input').first().press('Tab');
  await p.locator('[data-action="r-next"]').click();
  await p.waitForSelector('.ritual[data-step="start"]');
  await p.locator('[data-action="r-finish"]').click();
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  const got = await ev(p, () => ({ sleep: window.__lifeos.store.get('sleepEntries', '2026-10-07')?.quality, energy: window.__lifeos.store.get('moodEntries', '2026-10-07')?.energy,
    weight: window.__lifeos.store.get('weightEntries', '2026-10-07') || null, top: window.__lifeos.store.all('tasks').find((x) => x.rank === 1 && x.date === '2026-10-07')?.title }));
  if (got.sleep !== 8 || got.energy !== 7 || got.weight || got.top !== 'Send the proposal') throw new Error(JSON.stringify(got));
  if ((await p.textContent('.now-body')).includes('check-in')) throw new Error('the check-in is still the next action');
  await ctx.close();
});

// Logged every day until 1 October, then nothing: back on Wednesday 7 October.
const awayWorld = () => {
  const { store } = window.__lifeos;
  store.put('profile', { ...store.profile(), trackingStart: '2026-09-01' });
  for (const id of ['h-prayer', 'h-gratitude']) store.update('habits', id, { state: 'focus', focusSince: '2026-09-01' });
  for (let d = new Date('2026-09-01T12:00:00'); d <= new Date('2026-10-01T12:00:00'); d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    for (const id of ['h-prayer', 'h-gratitude']) store.put('habitLogs', { id: `${id}:${iso}`, habitId: id, date: iso, value: 1 });
  }
};

await step('after five days away: a fresh start, the gap marked away, and no list of misses', async () => {
  const { ctx, p } = await at('2026-10-07T08:00:00', { before: awayWorld });
  await p.waitForSelector('.sheet .fresh');
  await p.screenshot({ path: `${OUT}/p5-fresh-start.png` });
  const lead = await p.textContent('.fresh-lead');
  if (!lead.includes('5 days')) throw new Error('lead ' + lead);
  const away = await ev(p, async () => { const H = await import('./js/domain/habits.js'); return ['2026-10-02', '2026-10-04', '2026-10-06'].map((d) => H.dayMode(d)); });
  if (away.join() !== 'away,away,away') throw new Error('modes ' + away);
  await p.locator('.sheet [data-action="fs-go"]').click();
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  const text = await p.textContent('.today');
  if (/Don’t miss twice|Did any of these happen|missed/i.test(text)) throw new Error('Today talks about misses');
  if (await p.locator('.catchup').count()) throw new Error('catch-up after time away');
  const run = await ev(p, async () => { const H = await import('./js/domain/habits.js'); return H.runs(H.habit('h-prayer'), '2026-10-06').current; });
  if (run < 20) throw new Error('the run was lost: ' + run);
  // once per occasion: a reload doesn't bring it back
  await p.reload();
  await p.waitForFunction(() => window.__lifeos?.ready);
  await p.waitForTimeout(800);
  if (await p.locator('.sheet .fresh').count()) throw new Error('fresh start shown twice');
  await ctx.close();
});

await step('catch-up: yesterday’s unlogged habits as taps, once', async () => {
  const { ctx, p } = await at('2026-10-07T08:00:00', { before: () => {
    const { store } = window.__lifeos;
    store.put('profile', { ...store.profile(), trackingStart: '2026-09-20' });
    for (const id of ['h-prayer', 'h-gratitude']) store.update('habits', id, { state: 'focus', focusSince: '2026-09-20' });
    for (const d of ['2026-10-04', '2026-10-05', '2026-10-06']) store.put('habitLogs', { id: `h-prayer:${d}`, habitId: 'h-prayer', date: d, value: 1 });
  } });
  await p.waitForSelector('.catchup');
  const names = await p.locator('.catchup .hrow-name').allTextContents();
  if (!names.includes('Gratitude') || names.includes('Prayer')) throw new Error('catch-up ' + names);
  await p.screenshot({ path: `${OUT}/p5-catch-up.png` });
  await p.locator('.catchup [data-action="cu-tick"]').first().click();
  await p.waitForFunction(async () => { const H = await import('./js/domain/habits.js'); return H.isDone(H.habit('h-gratitude'), '2026-10-06'); });
  if (!(await p.locator('.catchup .hrow-name', { hasText: 'Gratitude' }).count())) throw new Error('the ticked row vanished');
  await p.locator('.catchup [data-action="cu-done"]').click();
  await p.waitForSelector('.catchup', { state: 'detached' });
  await p.reload();
  await p.waitForFunction(() => window.__lifeos?.ready);
  await p.waitForTimeout(800);
  if (await p.locator('.catchup').count()) throw new Error('catch-up came back');
  await ctx.close();
});

await step('swiping a habit with a backup plan offers it first; doing the backup counts', async () => {
  const { ctx, p } = await at('2026-10-07T06:40:00', { before: () => window.__lifeos.store.update('habits', 'h-training', { why: 'Strong for the people who rely on me' }) });
  const row = '.rstep[data-habit="h-training"]';
  await p.locator(row).evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(150);
  const box = await p.locator(row).boundingBox();
  const cdp = await ctx.newCDPSession(p);
  const x = box.x + box.width * 0.6, y = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 22 * i, y }] }); await p.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await p.waitForSelector('.sheet .backup-card');
  if (!(await p.textContent('.sheet .why-line')).includes('Strong for the people')) throw new Error('why missing');
  await p.screenshot({ path: `${OUT}/p5-before-skip.png` });
  await p.locator('.sheet [data-action="do-backup"]').click();
  await p.waitForSelector('.toast:has-text("backup done")');
  const done = await ev(p, async () => { const H = await import('./js/domain/habits.js'); return H.isDone(H.habit('h-training'), '2026-10-07'); });
  if (!done) throw new Error('backup did not count');
  await p.locator('.toast-btn', { hasText: 'Undo' }).click();
  await p.waitForFunction(async () => { const H = await import('./js/domain/habits.js'); return !H.isDone(H.habit('h-training'), '2026-10-07'); });
  await ctx.close();
});

await step('shrink and grow: suggested once, accepted with Undo, never repeated within 14 days', async () => {
  const seed = () => {
    const { store } = window.__lifeos;
    store.put('profile', { ...store.profile(), trackingStart: '2026-09-01' });
    store.put('habits', { id: 'h-push', name: 'Push-ups', type: 'quantity', unit: 'reps', target: 50, step: 5, section: 'life', category: 'body', icon: 'dumbbell', schedule: { kind: 'daily' }, state: 'focus', focusSince: '2026-09-01', order: 99 });
    for (const d of ['2026-10-06', '2026-10-04', '2026-10-02', '2026-09-30', '2026-09-29']) store.put('habitLogs', { id: `h-push:${d}`, habitId: 'h-push', date: d, value: 50 });
  };
  const { ctx, p } = await at('2026-10-07T12:00:00', { before: seed });
  const sug = () => ev(p, async () => (await import('./js/domain/next-action.js')).nextActions().find((a) => a.id === 'adapt-h-push') || null);
  await p.waitForFunction(async () => !!(await import('./js/domain/next-action.js')).nextActions().find((a) => a.id === 'adapt-h-push'));
  const s = await sug();
  if (!/30 reps/.test(s.title + s.sub)) throw new Error('suggestion ' + JSON.stringify(s));
  // Accept from the Now card's action, as a tap would.
  await ev(p, () => window.__lifeos.app.current().view.actions['adapt-yes']({ data: { id: 'h-push' } }));
  await p.waitForSelector('.toast:has-text("Smaller for two weeks")');
  const th = await ev(p, async () => { const H = await import('./js/domain/habits.js'); return H.threshold(H.habit('h-push'), '2026-10-07'); });
  if (th !== 30) throw new Error('threshold ' + th);
  await p.locator('.toast-btn', { hasText: 'Undo' }).click();
  await p.waitForFunction(async () => { const H = await import('./js/domain/habits.js'); return H.threshold(H.habit('h-push'), '2026-10-07') === 50; });
  if (await sug()) throw new Error('suggested again right after');
  for (const day of ['2026-10-12', '2026-10-21']) {
    await p.clock.setFixedTime(new Date(`${day}T12:00:00`));
    const again = await ev(p, async (d) => (await import('./js/domain/adapt.js')).recentlySuggested('h-push', d), day);
    if (again !== (day === '2026-10-12')) throw new Error(`${day}: recently suggested = ${again}`);
  }
  await ctx.close();
});

await step('weekly tidy-up: untouched habits, keep / smaller / pause / archive, with Undo', async () => {
  const { ctx, p } = await at('2026-10-11T10:00:00', { before: () => {
    const { store } = window.__lifeos;
    store.put('profile', { ...store.profile(), trackingStart: '2026-09-01' });
    // Everything except one habit was touched recently; that one runs on autopilot.
    store.update('habits', 'h-desk', { state: 'autopilot' });
    const recent = store.all('habits').filter((h) => h.id !== 'h-desk' && !h.source);
    for (const h of recent) store.put('habitLogs', { id: `${h.id}:2026-10-09`, habitId: h.id, date: '2026-10-09', value: 1 });
  } });
  await p.waitForSelector('.tidy-card');
  await p.locator('.tidy-card [data-action="tidy"]').click();
  await p.waitForSelector('.sheet .tidy-list');
  await p.screenshot({ path: `${OUT}/p5-tidy.png` });
  const items = await p.locator('.tidy-name').allTextContents();
  if (items.length !== 1 || !items[0].includes('Desk')) throw new Error('tidy ' + items);
  await p.locator('.sheet .seg-btn', { hasText: 'Pause' }).click();
  await p.locator('.sheet [data-action="td-done"]').click();
  await p.waitForSelector('.toast:has-text("Tidied")');
  const st = await ev(p, async () => { const H = await import('./js/domain/habits.js'); return [H.stateOf(H.habit('h-desk'), '2026-10-11'), H.habit('h-desk').pausedUntil]; });
  if (st[0] !== 'paused' || st[1] !== '2026-10-25') throw new Error('state ' + st);
  if (await p.waitForSelector('.tidy-card', { state: 'detached', timeout: 2000 }).then(() => false, () => true)) throw new Error('tidy card still showing this week');
  await p.locator('.toast-btn', { hasText: 'Undo' }).click();
  await p.waitForFunction(async () => { const H = await import('./js/domain/habits.js'); return H.stateOf(H.habit('h-desk'), '2026-10-11') !== 'paused'; });
  await ctx.close();
});

await step('every net can be turned off for good in Settings', async () => {
  const { ctx, p } = await at('2026-10-07T08:00:00');
  await p.goto(base + '#/you/settings');
  // The nets live under Advanced, closed until you open it.
  await p.locator('details.set-advanced > summary').click();
  await p.waitForSelector('[data-key="net-catchUp"]');
  await p.locator('[data-key="net-catchUp"] [data-action="net"]').click();
  const off = await ev(p, () => window.__lifeos.store.settings().nets?.catchUp);
  if (off !== false) throw new Error('not turned off');
  await ctx.close();
});

await step('dark mode: the seal and the fresh start', async () => {
  const { ctx, p } = await at('2026-10-10T20:30:00', { scheme: 'dark' });
  await ritual(p, 'evening');
  await p.waitForSelector('.ritual');
  while ((await stepName(p)) !== 'seal') {
    const s = await stepName(p);
    await p.locator('[data-action="r-skip"]').click();
    await p.waitForFunction((prev) => document.querySelector('.ritual')?.dataset.step !== prev, s);
  }
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/p5-seal-dark.png` });
  await ctx.close();
  const b = await at('2026-10-07T08:00:00', { scheme: 'dark', before: awayWorld });
  await b.p.waitForSelector('.sheet .fresh');
  await b.p.waitForTimeout(400);
  await b.p.screenshot({ path: `${OUT}/p5-fresh-start-dark.png` });
  await b.ctx.close();
});

await finish();
