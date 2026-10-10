// Phase 11: the accessibility audit. axe-core's WCAG 2.2 A/AA rules and its best practices run on
// every screen (light and dark, a year of data and a fresh install), every sheet, the moments and
// ceremonies, and the wide two-pane layout; none may fail. Then a whole morning is done with the
// keyboard alone, and every control that takes focus must show where focus is.
// axe-core is a development dependency only (npm install); nothing of it ships with the app.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { setup } from './helpers.mjs';
const require = createRequire(import.meta.url);
const { devices } = require('playwright');
const AXE = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

async function open({ scheme = 'light', demo = 60, device = 'iPhone 14', viewport = null } = {}) {
  const ctx = await browser.newContext({ ...devices[device], ...(viewport ? { viewport } : {}), colorScheme: scheme, reducedMotion: 'reduce', bypassCSP: true }); // axe is injected as an inline script
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => errors.push(`${scheme}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${scheme}: console: ${m.text()}`); });
  await p.goto(`${base}#/today`);
  await p.waitForFunction(() => window.__lifeos?.ready);
  if (demo) {
    await p.evaluate(async (n) => { const D = await import('./js/data/demo.js'); await D.loadDemo(n); }, demo);
    await p.reload();
    await p.waitForFunction(() => window.__lifeos?.ready);
  }
  await p.waitForTimeout(800);
  return { ctx, p };
}

/** axe on what's on screen now. Returns the violations as short lines. */
const TRACE = Number(process.env.A11Y_TRACE || 0); // print audits slower than this many ms
async function audit(p, label) {
  const t0 = Date.now();
  if (!(await p.evaluate(() => !!window.axe))) await p.addScriptTag({ content: AXE });
  const found = await p.evaluate(async (tags) => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] });
    return r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 2).map((n) => `${n.target.join(' ')} ${n.failureSummary.split('\n')[1]?.trim() || ''}`).join(' · ')}`);
  }, TAGS);
  if (TRACE && Date.now() - t0 > TRACE) console.log(`     (${label}: ${Date.now() - t0} ms)`);
  return found.map((f) => `${label}: ${f.slice(0, 400)}`);
}

const ROUTES = (ids) => ['today', 'plan', 'plan/habits', `plan/habits/${ids.habit}`, 'plan/habits/sort', 'plan/tasks', 'plan/goals', `plan/goals/${ids.goal}`,
  'plan/projects', 'plan/books', 'plan/training', 'plan/training/exercises', `plan/training/exercises/${ids.exercise}`, 'plan/playbook', 'plan/commitments',
  'plan/rewards', 'plan/training/workouts/t-upper', 'plan/moodboard', 'plan/lists', 'plan/money', 'plan/dates', 'progress', 'progress/trends', 'progress/trends/consistency', 'progress/calendar', 'progress/records', 'progress/season', 'progress/year',
  'progress/body', 'progress/body/weight', 'progress/body/nutrition', 'progress/body/measurements', 'progress/body/photos', 'progress/body/sleep',
  'progress/areas/mind', 'progress/areas/spirit', 'progress/areas/relationships', 'progress/areas/work', 'progress/areas/health',
  'reflect', 'reflect/journal', `reflect/journal/${ids.journal}`, 'reflect/insights', 'reflect/reviews', 'reflect/review/week', 'reflect/review/month',
  'you/settings', 'you/data', 'you/privacy', `workout/${ids.workout}`];

const idsOf = (p) => p.evaluate(() => {
  const s = window.__lifeos.store;
  const first = (name, fn = () => true) => s.all(name).find(fn)?.id;
  return { habit: first('habits', (h) => !h.archived), goal: first('goals'), exercise: first('exercises'), journal: first('journalEntries'), workout: first('workouts', (w) => w.status === 'done') };
});

async function auditScreens(p, routes, label) {
  const found = [];
  for (const r of routes) {
    if (TRACE) console.log(`     ${label} → ${r}`);
    await p.evaluate((h) => { location.hash = `#/${h}`; }, r);
    await p.waitForTimeout(500);
    found.push(...await audit(p, `${label} ${r}`));
  }
  return found;
}

/** Every screen, then every sheet, a moment and a ceremony, in one colour scheme. */
async function auditTheme(scheme) {
  const found = [];
  const { ctx, p } = await open({ scheme });
  const ids = await idsOf(p);
  found.push(...await auditScreens(p, ROUTES(ids), scheme));
  // [label, module, function, arguments] — opened the way the app opens them.
  const sheets = [
    ['capture', './js/screens/capture.js', 'openCapture', ['walked 30 min']],
    ['you', './js/screens/you.js', 'openYou', []],
    ['search', './js/screens/search.js', 'openSearch', []],
    ['day mode', './js/screens/sheets.js', 'openMode', []],
    ['what counts today', './js/screens/sheets.js', 'openPlan', []],
    ['habit', './js/screens/sheets.js', 'openHabit', [ids.habit]],
    ['morning check-in', './js/screens/sheets.js', 'openCheckin', []],
    ['water', './js/screens/sheets.js', 'openWater', []],
    ['food', './js/screens/sheets.js', 'openFood', []],
    ['steps', './js/screens/sheets.js', 'openSteps', []],
    ['weight', './js/screens/sheets.js', 'openWeight', []],
    ['close the work day', './js/screens/sheets.js', 'openShutdown', []],
    ['reading session', './js/screens/sheets.js', 'openSession', ['reading']],
    ['morning ritual', './js/screens/ritual.js', 'openRitual', ['morning']],
    ['evening ritual', './js/screens/ritual.js', 'openRitual', ['evening']],
    ['new habit', './js/screens/habit-new.js', 'openNewHabit', []],
    ['edit habit', './js/screens/habit-edit.js', 'openHabitEditor', [ids.habit]],
    ['task', './js/screens/task-sheet.js', 'openTask', []],
    ['day picker', './js/screens/today/day-picker.js', 'openDayPicker', ['2026-10-01']],
    ['fresh start', './js/screens/fresh-start.js', 'openFreshStart', [{ from: '2026-09-28', to: '2026-10-02', days: 5 }]],
    ['edit Today', './js/screens/today/edit.js', 'openEditToday', []],
    ['tidy-up', './js/screens/tidy.js', 'openTidy', []],
    ['start a workout', './js/screens/workout-actions.js', 'openStartSheet', []],
    ['new season', './js/screens/season.js', 'openNewSeason', []],
    ['new pledge', './js/screens/commitments.js', 'openNewPledge', []],
    ['new reward', './js/screens/rewards.js', 'openNewReward', []],
    ['measurement', './js/screens/measurements.js', 'openMeasurement', []],
    ['calendar file', './js/screens/calendar-file.js', 'openCalendarFile', []],
    ['shortcuts', './js/ui/keys.js', 'openShortcuts', []],
    ['number pad', './js/ui/numpad.js', 'openNumpad', [{ title: 'Steps', unit: 'steps', value: 8000, quick: [{ label: '+1,000', value: 9000 }] }]],
  ];
  for (const [label, url, fn, args] of sheets) {
    if (TRACE) console.log(`     ${scheme} sheet → ${label}`);
    await p.evaluate(async ([u, f, a]) => { const m = await import(u); m[f](...a); }, [url, fn, args]);
    await p.waitForSelector('.sheet-wrap.is-open');
    await p.waitForTimeout(350);
    found.push(...await audit(p, `${scheme} sheet: ${label}`));
    for (let i = 0; i < 4 && await p.locator('.sheet-wrap').count(); i++) { await p.keyboard.press('Escape'); await p.waitForTimeout(250); }
  }
  // The confirm sheet, a toast with its button, a moment and a ceremony.
  await p.evaluate(() => { window.__lifeos.app.confirm({ title: 'Erase everything?', body: 'This can’t be undone.', confirm: 'Erase', tone: 'danger' }); });
  await p.waitForSelector('.sheet .confirm');
  found.push(...await audit(p, `${scheme} confirm`));
  await p.keyboard.press('Escape');
  await p.evaluate(() => window.__lifeos.app.toast('Saved', { action: { label: 'Undo', fn: () => {} } }));
  await p.evaluate(async () => { (await import('./js/ceremony/moments.js')).plate({ icon: 'medal', title: 'New record', sub: 'Push-ups: 42 reps' }); });
  await p.waitForTimeout(300);
  found.push(...await audit(p, `${scheme} toast and moment`));
  await p.evaluate(() => { import('./js/ceremony/seal.js').then((m) => { m.sealCeremony('2026-10-07'); }); });
  await p.waitForSelector('.stage');
  await p.waitForTimeout(400);
  found.push(...await audit(p, `${scheme} ceremony`));

  await ctx.close();
  return found;
}

await step('every screen, sheet, moment and ceremony passes, light and dark (two months of data)', async () => {
  const found = (await Promise.all(['light', 'dark'].map(auditTheme))).flat();
  if (found.length) throw new Error(found.join('\n'));
});

await step('a fresh install passes too: empty states and first-run screens', async () => {
  const { ctx, p } = await open({ demo: 0 });
  const found = await auditScreens(p, ['today', 'plan', 'plan/habits', 'plan/tasks', 'plan/goals', 'plan/projects', 'plan/books', 'plan/training',
    'progress', 'progress/trends', 'progress/records', 'progress/season', 'progress/body', 'progress/body/weight', 'progress/body/sleep',
    'reflect', 'reflect/journal', 'reflect/insights', 'reflect/reviews'], 'fresh');
  await ctx.close();
  if (found.length) throw new Error(found.join('\n'));
});

await step('the wide layout passes: lists beside their details', async () => {
  const { ctx, p } = await open({ viewport: { width: 1280, height: 860 }, device: 'Desktop Chrome' });
  const ids = await idsOf(p);
  const found = await auditScreens(p, ['today', `plan/habits/${ids.habit}`, `plan/goals/${ids.goal}`, `reflect/journal/${ids.journal}`, 'progress', 'progress/trends'], 'wide');
  await p.screenshot({ path: `${OUT}/a11y-wide.png` });
  await ctx.close();
  if (found.length) throw new Error(found.join('\n'));
});

await step('a morning with the keyboard alone, with focus always visible', async () => {
  const { ctx, p } = await open({ device: 'Desktop Chrome', viewport: { width: 1100, height: 860 } });
  const where = () => p.evaluate(async () => {
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); // rings fade in over a frame
    const a = document.activeElement;
    if (!a || a === document.body) return { none: true };
    // A screen's title takes focus when the screen opens (tabindex -1); it's not a control, so no ring.
    if (a.tabIndex < 0 && a.matches('h1, h2')) return { title: true, ring: true };
    const cs = getComputedStyle(a);
    const after = getComputedStyle(a, '::after');
    // An outline, a shadow ring, or the drawn ring of the round icon buttons (::after, --ring).
    const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none')
      || (after.content !== 'none' && after.getPropertyValue('--ring').trim() === '360deg');
    return { tag: a.tagName, name: a.getAttribute('aria-label') || a.textContent.trim().slice(0, 40), ring, cls: a.className };
  });
  const unseen = [];
  const tab = async (n = 1, shift = false) => {
    for (let i = 0; i < n; i++) {
      await p.keyboard.press(shift ? 'Shift+Tab' : 'Tab');
      const w = await where();
      if (!w.none && !w.ring) unseen.push(`${w.tag}.${w.cls} "${w.name}"`);
    }
  };
  // The first Tab reaches the skip link, which takes you straight to the screen.
  await p.evaluate(() => document.activeElement?.blur());
  await tab();
  if (!(await p.evaluate(() => document.activeElement?.matches('.skip-link')))) throw new Error('first Tab is not the skip link');
  await p.keyboard.press('Enter');
  await tab(12);
  // N logs something: type it, Enter saves it, and focus comes back.
  await p.keyboard.press('Escape');
  await p.keyboard.press('n');
  await p.waitForSelector('.sheet .capture input, .sheet .capture textarea');
  await p.keyboard.type('drank 500 ml water');
  await p.waitForTimeout(250);
  const before = await p.evaluate(() => window.__lifeos.store.all('waterLogs').length);
  await p.keyboard.press('Enter');
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  if (await p.evaluate(() => window.__lifeos.store.all('waterLogs').length) !== before + 1) throw new Error('capture by keyboard did not log the water');
  // J moves to the first item, X completes it, X again undoes it.
  await p.keyboard.press('j');
  const item = await where();
  if (item.none) throw new Error('J did not move to an item');
  const checked = () => p.evaluate(() => document.activeElement?.closest('.hrow, .tile, .counter, .trow, .top3-item, .list > li')?.querySelector('[role="checkbox"]')?.getAttribute('aria-checked'));
  const was = await checked();
  await p.keyboard.press('x');
  await p.waitForTimeout(250);
  if ((await checked()) === was) throw new Error('X did not complete the item');
  await p.keyboard.press('x');
  await p.waitForTimeout(250);
  // A sheet opened from the keyboard keeps focus inside until Escape, then gives it back.
  await p.locator('.mode-chip').focus();
  await p.keyboard.press('Enter');
  await p.waitForSelector('.sheet-wrap.is-open');
  for (let i = 0; i < 14; i++) {
    await tab();
    if (!(await p.evaluate(() => !!document.activeElement?.closest('.sheet-wrap')))) throw new Error('focus left the open sheet');
  }
  await p.keyboard.press('Escape');
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  if (!(await p.evaluate(() => document.activeElement?.matches('.mode-chip')))) throw new Error('focus did not return to the day mode');
  // Places by number, then into a habit and back, with Enter only.
  await p.keyboard.press('2');
  await p.waitForSelector('[data-view="plan"]');
  const link = p.locator('[data-view="plan"] a[href="#/plan/habits"]').first();
  await link.focus();
  await p.keyboard.press('Enter');
  await p.waitForSelector('[data-view="habits"] a[href^="#/plan/habits/h-"]');
  await p.locator('[data-view="habits"] a[href^="#/plan/habits/h-"]').first().focus();
  await p.keyboard.press('Enter');
  await p.waitForSelector('[data-view="habit"] h1');
  if (!(await p.evaluate(() => document.activeElement?.tagName === 'H1'))) throw new Error('focus did not land on the habit’s title');
  await tab(10);
  await p.keyboard.press('3');
  await p.waitForSelector('[data-view="review"]');
  await tab(10);
  await p.keyboard.press('4');
  await p.waitForSelector('[data-view="review"]');
  await p.locator('.write-area').focus();
  await p.keyboard.type('Written without a mouse.');
  await p.keyboard.press('Shift+Tab');
  await p.waitForTimeout(500);
  if (!(await p.evaluate(() => window.__lifeos.store.all('journalEntries').some((j) => (j.text || '').includes('without a mouse'))))) throw new Error('the journal page was not saved');
  await tab(8);
  await p.screenshot({ path: `${OUT}/a11y-keyboard.png` });
  await ctx.close();
  if (unseen.length) throw new Error(`no visible focus on: ${[...new Set(unseen)].slice(0, 8).join(' | ')}`);
});

await step('a screen reader can seal the day: its activate holds for you', async () => {
  const { ctx, p } = await open();
  const day = await p.evaluate(async () => (await import('./js/domain/dates.js')).today());
  await p.evaluate(async () => (await import('./js/screens/ritual.js')).openRitual('evening'));
  for (let i = 0; i < 8 && !(await p.locator('.sheet .hold-btn').count()); i++) { await p.locator('.sheet [data-action="r-skip"]').click(); await p.waitForTimeout(150); }
  const label = await p.locator('.sheet .hold-btn').getAttribute('aria-label');
  if (!/hold/i.test(label)) throw new Error(`the hold button says "${label}"`);
  // VoiceOver's double-tap and a switch control both arrive as a click with no press before it.
  await p.evaluate(() => document.querySelector('.sheet .hold-btn').click());
  await p.waitForFunction((d) => !!window.__lifeos.store.get('dailyReviews', d)?.sealedAt, day, { timeout: 5000 });
  await ctx.close();
});

await step('screens read in order: one title each, landmarks, and a live region for news', async () => {
  const { ctx, p } = await open();
  const ids = await idsOf(p);
  const bad = [];
  for (const r of ROUTES(ids)) {
    await p.evaluate((h) => { location.hash = `#/${h}`; }, r);
    await p.waitForTimeout(400);
    const s = await p.evaluate(() => ({
      h1: [...document.querySelectorAll('#main h1')].filter((h) => h.getClientRects().length).length,
      main: !!document.querySelector('main#main, [role="main"]#main'),
      nav: !!document.querySelector('nav[aria-label]'),
      skipped: (() => { const hs = [...document.querySelectorAll('#main h1, #main h2, #main h3, #main h4')].filter((h) => h.getClientRects().length).map((h) => Number(h.tagName[1])); return hs.some((n, i) => i && n - hs[i - 1] > 1); })(),
      title: document.title,
    }));
    if (s.h1 !== 1) bad.push(`${r}: ${s.h1} titles`);
    if (!s.main || !s.nav) bad.push(`${r}: missing landmarks`);
    if (s.skipped) bad.push(`${r}: a heading level is skipped`);
    if (!/Life OS/.test(s.title) || s.title === 'Life OS' && r !== 'today') bad.push(`${r}: page title "${s.title}"`);
  }
  // Toasts and moments are announced without taking focus.
  await p.evaluate(() => window.__lifeos.app.toast('Saved'));
  const live = await p.evaluate(() => { const t = document.querySelector('.toast'); return t && (t.closest('[aria-live]') || t.getAttribute('role') === 'status' || t.closest('[role="status"]')) ? true : false; });
  if (!live) bad.push('toasts are not in a live region');
  await ctx.close();
  if (bad.length) throw new Error(bad.join('\n'));
});

await finish();
