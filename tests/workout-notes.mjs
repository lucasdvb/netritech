// The owner's fixes in the browser: a set is logged by typing its reps (no box to tick), last
// time's numbers one tap away, warm-ups marked by their number; the session clock pauses when you
// leave the session and stops when you finish; the Gym mode button on one line; and the brain dump.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';

const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { browser, step, finish, base, errors } = t;
const OUT = process.argv[3] || './test-shots';

async function at(clock, scheme = 'light') {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme });
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await p.clock.install({ time: new Date(clock) });
  await p.goto(`${base}#/today`);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
  await p.evaluate(async () => { await (await import('./js/data/demo.js')).loadDemo(30); window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }); await window.__lifeos.store.flush(); });
  await p.reload();
  await p.waitForFunction(() => window.__lifeos?.ready);
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const sets = (p, id) => ev(p, (wid) => window.__lifeos.store.all('workoutSets').filter((s) => s.workoutId === wid).sort((a, b) => a.order - b.order || a.setIndex - b.setIndex), id);
// The clock runs on Playwright's clock, which also moves with real time: allow a few seconds.
const secs = (t) => t.split(':').map(Number).reduce((a, b) => a * 60 + b, 0);
const near = (p, sel, want) => p.waitForFunction(([q, w]) => { const t = document.querySelector(q)?.textContent; if (!t) return false; const v = t.split(':').map(Number).reduce((a, b) => a * 60 + b, 0); return v >= w && v <= w + 4; }, [sel, want]);
const workout = (p, id) => ev(p, (wid) => window.__lifeos.store.get('workouts', wid), id);

for (const scheme of ['light', 'dark']) {
  await step(`logging sets by typing, same as last time, warm-ups (${scheme})`, async () => {
    const { ctx, p } = await at('2026-10-09T06:30:00', scheme);
    const id = await ev(p, async () => (await import('./js/screens/workout-actions.js')).startWorkout('t-upper').id);
    await p.waitForSelector('.ex-card .set-in');
    // The Gym mode button sits on one line.
    const gb = await p.locator('[data-action="gym"]').boundingBox();
    if (gb.height > 44) throw new Error(`Gym mode button wraps: ${gb.height}px`);
    // No tick boxes; each field wide enough to read what you type.
    if (await p.locator('.wset-row .check').count()) throw new Error('tick boxes still there');
    const first = p.locator('.ex-card').first().locator('.wset-row:not(.wset-row--head)');
    const reps = first.nth(0).locator('.set-in').last();
    if ((await reps.boundingBox()).width < 60) throw new Error('reps field squashed');
    const aim = await reps.getAttribute('placeholder');
    if (!aim) throw new Error('no suggestion shown');
    if ((await sets(p, id))[0].completed) throw new Error('logged before typing');
    await reps.fill('11');
    await reps.press('Tab');
    await p.waitForFunction(() => document.querySelector('.wset-row.is-done'));
    let s = (await sets(p, id))[0];
    if (!s.completed || s.reps !== 11) throw new Error(`typed set ${JSON.stringify(s)}`);
    // The rest starts on its own.
    await p.waitForSelector('#wo-rest');
    // Clearing the reps takes the set back.
    await reps.fill('');
    await reps.press('Tab');
    await p.waitForFunction(() => !document.querySelector('.ex-card .wset-row.is-done'));
    // Last time, in one tap.
    await first.nth(1).locator('[data-action="use-prev"]').click();
    await p.waitForFunction(() => document.querySelector('.wset-row.is-done'));
    s = (await sets(p, id))[1];
    if (!s.completed || !s.reps) throw new Error(`same as last time ${JSON.stringify(s)}`);
    // The number marks a warm-up: shown as W; the working sets count from 1.
    await first.nth(0).locator('[data-action="set-kind"]').click();
    await p.waitForFunction(() => document.querySelector('.wset-row.is-warmup .set-num')?.textContent.trim() === 'W');
    const nums = await first.locator('.set-num').allTextContents();
    if (nums[0].trim() !== 'W' || nums[2].trim() !== '2') throw new Error(`numbers ${nums}`);
    if (!(await sets(p, id))[0].warmup) throw new Error('not a warm-up');
    await p.screenshot({ path: `${OUT}/wn-${scheme}-sets.png` });
    // Add a set (aim carried, nothing logged), then remove it.
    const before = (await sets(p, id)).length;
    const shownRows = await first.count();
    await p.locator('.ex-card').first().locator('[data-action="add-set"]').click();
    await p.waitForFunction((n) => document.querySelector('.ex-card').querySelectorAll('.wset-row:not(.wset-row--head)').length === n, shownRows + 1);
    if ((await sets(p, id)).length !== before + 1) throw new Error('set not added');
    await p.locator('.ex-card').first().locator('[data-action="del-set"]').click();
    await p.waitForFunction((n) => window.__lifeos.store.all('workoutSets').filter((x) => x.workoutId === n.id).length === n.before, { id, before });
    await ctx.close();
  });
}

await step('the session clock pauses when you leave, carries on when you come back, and stops at the finish', async () => {
  const { ctx, p } = await at('2026-10-09T06:30:00');
  const id = await ev(p, async () => (await import('./js/screens/workout-actions.js')).startWorkout('t-upper').id);
  await p.waitForSelector('#wo-timer');
  await p.clock.runFor(5 * 60_000);
  await near(p, '#wo-timer', 300);
  // Into gym mode and back: the clock keeps running.
  await p.locator('[data-action="gym"]').click();
  await p.waitForSelector('#gym-elapsed');
  await p.clock.runFor(60_000);
  await near(p, '#gym-elapsed', 360);
  if (!(await workout(p, id)).runningSince) throw new Error('paused going into gym mode');
  // Leave the session: it pauses.
  await p.goto(`${base}#/today`);
  await p.waitForFunction(async (wid) => !window.__lifeos.store.get('workouts', wid).runningSince, id);
  await p.clock.runFor(30 * 60_000);
  await p.goto(`${base}#/workout/${id}/gym`);
  await p.waitForSelector('#gym-elapsed');
  const back = secs(await p.locator('#gym-elapsed').textContent());
  if (back < 360 || back > 366) throw new Error(`after half an hour away: ${back} s`);
  // Tap the time to pause it by hand.
  await p.locator('[data-action="g-clock"]').click();
  await p.waitForSelector('.gym-meta.is-paused');
  const held = secs(await p.locator('#gym-elapsed').textContent());
  await p.clock.runFor(2 * 60_000);
  if (secs(await p.locator('#gym-elapsed').textContent()) !== held) throw new Error('ran while paused');
  await p.screenshot({ path: `${OUT}/wn-gym-paused.png` });
  await p.locator('[data-action="g-clock"]').click();
  await p.clock.runFor(4 * 60_000);
  await near(p, '#gym-elapsed', held + 240);
  // Log one set and finish: the session took 10 minutes, and the clock never moves again.
  await p.locator('.gym-go[data-action="g-done"]').click();
  await p.locator('[data-action="g-finish"]').click();
  await p.locator('.sheet [data-action="done"]').click();
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  const w = await workout(p, id);
  if (w.status !== 'done' || w.minutes !== Math.round((held + 240) / 60) || w.runningSince) throw new Error(`finished ${JSON.stringify({ s: w.status, m: w.minutes, r: w.runningSince })}`);
  await p.goto(`${base}#/workout/${id}`);
  await p.waitForSelector('#wo-timer');
  const t1 = await p.locator('#wo-timer').textContent();
  await p.clock.runFor(10 * 60_000);
  if ((await p.locator('#wo-timer').textContent()) !== t1) throw new Error('clock moved after the finish');
  await ctx.close();
});

for (const scheme of ['light', 'dark']) {
  await step(`brain dump: write, file, filter, search, edit, pin, delete with Undo (${scheme})`, async () => {
    const { ctx, p } = await at('2026-10-09T10:30:00', scheme);
    await p.goto(`${base}#/plan`);
    await p.locator('[data-to="plan/notes"]').click();
    await p.waitForSelector('.dump-add');
    await p.screenshot({ path: `${OUT}/wn-${scheme}-notes-empty.png` });
    const add = async (text, cat) => {
      await p.fill('.dump-input', text);
      await p.locator(`.dump-add [data-action="file"][data-c="${cat}"]`).click();
      await p.locator('[data-action="save"]').click();
      await p.waitForFunction((t) => [...document.querySelectorAll('.note-text')].some((x) => x.textContent === t), text);
    };
    await add('Coaching offer for small gyms', 'Ideas');
    await add('Ask the bank about the fixed rate', 'To think about');
    await add('Standing desk?', '');
    if (await p.inputValue('.dump-input')) throw new Error('draft not cleared');
    // A category of your own, from the New chip.
    await p.locator('.dump-add [data-action="cat-new"]').click();
    await p.fill('.sheet input[name="name"]', 'Wedding');
    await p.locator('.sheet button[type="submit"]').click();
    await p.waitForSelector('.dump-add [data-action="file"][data-c="Wedding"].is-active');
    await add('First dance: Perfect or At Last', 'Wedding');
    // Filter by category.
    await p.locator('[data-key="filter"] [data-action="show"][data-c="Ideas"]').click();
    await p.waitForFunction(() => document.querySelectorAll('.note-card').length === 1);
    await p.locator('[data-key="filter"] [data-action="show"][data-c="all"]').click();
    await p.waitForFunction(() => document.querySelectorAll('.note-card').length === 4);
    await p.screenshot({ path: `${OUT}/wn-${scheme}-notes.png`, fullPage: true });
    // Edit, move and pin from the note.
    await p.locator('.note-card', { hasText: 'Standing desk' }).click();
    await p.waitForSelector('.note-edit');
    await p.fill('.note-edit', 'Standing desk: check the IKEA one');
    await p.locator('.sheet [data-action="move"][data-c="Personal"]').click();
    await p.locator('.sheet [data-action="pin"]').click();
    await p.screenshot({ path: `${OUT}/wn-${scheme}-note.png` });
    await p.keyboard.press('Escape');
    await p.waitForSelector('.sheet-wrap', { state: 'detached' });
    const top = await p.locator('.note-card').first().textContent();
    if (!/Standing desk: check the IKEA one/.test(top) || !/Personal/.test(top)) throw new Error(`pinned first: ${top}`);
    // Make one a task.
    await p.locator('.note-card', { hasText: 'bank' }).click();
    await p.locator('.sheet [data-action="to-task"]').click();
    await p.waitForSelector('.toast:has-text("Added to your tasks")');
    if (!(await ev(p, () => window.__lifeos.store.all('tasks').some((x) => x.title === 'Ask the bank about the fixed rate')))) throw new Error('no task');
    // Delete, and Undo.
    await p.locator('.note-card', { hasText: 'Coaching' }).click();
    await p.locator('.sheet [data-action="delete"]').click();
    await p.waitForFunction(() => document.querySelectorAll('.note-card').length === 2);
    await p.locator('.toast button', { hasText: 'Undo' }).last().click();
    await p.waitForFunction(() => document.querySelectorAll('.note-card').length === 3);
    // Everything survives a reload, and global search finds a note and opens it.
    await p.reload();
    await p.waitForFunction(() => window.__lifeos?.ready);
    await p.waitForFunction(() => document.querySelectorAll('.note-card').length === 3);
    await ev(p, async () => (await import('./js/screens/search.js')).openSearch());
    await p.fill('.sheet input[type="search"]', 'first dance');
    await p.locator('.sheet [data-action="go"]', { hasText: 'First dance' }).click();
    await p.waitForSelector('.note-edit');
    if (!/First dance/.test(await p.inputValue('.note-edit'))) throw new Error('search did not open the note');
    await ctx.close();
  });
}

await step('categories: rename moves notes, delete sends them to Unsorted', async () => {
  const { ctx, p } = await at('2026-10-09T10:30:00');
  await ev(p, async () => { const N = await import('./js/domain/notes.js'); N.create('Idea one', 'Ideas'); N.create('Idea two', 'Ideas'); await window.__lifeos.store.flush(); });
  await p.goto(`${base}#/plan/notes`);
  await p.locator('[data-action="cats"]').click();
  await p.waitForSelector('.cat-list');
  await p.fill('.cat-row input[data-c="Ideas"]', 'Business ideas');
  await p.locator('.cat-row input[data-c="Ideas"]').press('Enter');
  await p.waitForFunction(() => window.__lifeos.store.all('notes').every((n) => n.category === 'Business ideas'));
  await p.locator('.cat-row [data-action="cat-del"][data-c="Business ideas"]').click();
  await p.waitForSelector('.toast:has-text("2 notes moved to Unsorted")');
  if (!(await ev(p, () => window.__lifeos.store.all('notes').every((n) => n.category === '')))) throw new Error('not unsorted');
  await ctx.close();
});

await finish();
