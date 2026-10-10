// Screenshots for the owner's manual (the Life OS manual doc): real screens with sample data, numbered
// blue callouts that match the steps in each SOP, two phone screens side by side per image.
// Run after a change to any screen the manual shows, then upload the new images to the doc.
//
//   node tests/serve.mjs 4173 &   node tools/manual-shots.mjs [base] [out] [flow ...]
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '../tests/support/server.mjs';

const { chromium, devices } = createRequire(import.meta.url)('playwright');
const [base, out, ...only] = process.argv.slice(2);
const BASE = base || 'http://localhost:4173/';
const OUT = join(out || join(dirname(fileURLToPath(import.meta.url)), '..', 'manual-shots'), '/');
const RAW = join(OUT, 'raw', '/');
mkdirSync(RAW, { recursive: true });
const browser = await chromium.launch();
const PHONE = { ...devices['iPhone 14'], deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'reduce' };

async function at(clock, { demo = 120, before } = {}) {
  const ctx = await browser.newContext(PHONE);
  const p = await ctx.newPage();
  p.setDefaultTimeout(10000);
  p.on('pageerror', (e) => console.log(`  pageerror: ${e.message}`));
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(`${BASE}#/today`);
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
  if (demo) {
    await p.evaluate(async (n) => {
      await (await import('./js/data/demo.js')).loadDemo(n);
      const s = window.__lifeos.store;
      s.setSettings({ welcomed: true, installDismissed: true });
      // Three habits in focus, each tied to a moment you already have
      const pick = { 'h-prayer': 'After I wake up', 'h-mobility': 'After my coffee', 'h-lights-out': 'After I brush my teeth' };
      for (const [id, anchor] of Object.entries(pick)) s.put('habits', { ...s.get('habits', id), state: 'focus', focusSince: '2026-08-10', anchor });
    }, demo);
    if (before) await p.evaluate(before);
    await p.evaluate(() => window.__lifeos.store.flush());
    await p.reload();
    await p.waitForFunction(() => window.__lifeos?.ready);
    await p.evaluate(async () => {
      await window.__lifeos.store.complete();
      (await import('./js/domain/progression.js')).run();
      // the sample-data notice is for exploring; the manual shows the app as you'd use it
      window.__lifeos.store.setSettings({ demo: false });
      await window.__lifeos.store.flush();
    });
    await p.reload();
    await p.waitForFunction(() => window.__lifeos?.ready);
  }
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelectorAll('.moment, .install-hint, .toast').forEach((e) => e.remove()));
  return { ctx, p };
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const settle = (p, ms = 700) => p.waitForTimeout(ms);
const go = async (p, hash, sel) => { await p.evaluate((h) => { location.hash = h; }, hash); if (sel) await p.waitForSelector(sel); await settle(p); };

/**
 * Numbered callouts: a blue ring round each target and a numbered badge on its corner. The page
 * (or the sheet) is scrolled first so every target sits in view, clear of the tab bar.
 * marks: [{ sel, n, nth = 0, text, closest, at = 'tl' | 'tr' | 'l' | 'r' | 'bl' | 'br' | 't' | 'b', pad = 4, ring = true, fixed }]
 */
async function mark(p, marks) {
  await p.evaluate(async (marks) => {
    document.getElementById('__marks')?.remove();
    const find = (m) => {
      let els = [...document.querySelectorAll(m.sel)].filter((e) => e.getClientRects().length);
      if (m.text) els = els.filter((e) => e.textContent.includes(m.text));
      let el = els[m.nth || 0];
      if (el && m.closest) el = el.closest(m.closest);
      if (!el) throw new Error(`no ${m.sel}${m.text ? ` "${m.text}"` : ''}`);
      return el;
    };
    const els = marks.map(find);
    const movable = els.filter((_, i) => !marks[i].fixed);
    if (movable.length) {
      const scroller = (el) => { for (let e = el.parentElement; e; e = e.parentElement) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 1) return e; } return document.scrollingElement; };
      const sc = scroller(movable[0]);
      const doc = sc === document.scrollingElement;
      const area = doc ? { top: 0, bottom: innerHeight - 104 } : sc.getBoundingClientRect();
      const lim = { top: area.top + 20, bottom: area.bottom - 14 };
      const rs = movable.map((e) => e.getBoundingClientRect());
      const top = Math.min(...rs.map((r) => r.top)) - 10, bottom = Math.max(...rs.map((r) => r.bottom)) + 10;
      if (top < lim.top || bottom > lim.bottom) {
        const room = lim.bottom - lim.top, h = bottom - top;
        const want = h <= room ? lim.top + Math.min(60, (room - h) / 2) : lim.top;
        sc.scrollTop += top - want;
        await new Promise((r) => setTimeout(r, 400));
      }
    }
    const layer = document.createElement('div');
    layer.id = '__marks';
    layer.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none';
    const W = innerWidth, H = innerHeight, S = 26;
    marks.forEach((m, i) => {
      const r = els[i].getBoundingClientRect();
      const pad = m.pad ?? 4;
      const box = { l: r.left - pad, t: r.top - pad, w: r.width + pad * 2, h: r.height + pad * 2 };
      if (m.ring !== false) {
        const ring = document.createElement('div');
        ring.style.cssText = `position:absolute;left:${box.l}px;top:${box.t}px;width:${box.w}px;height:${box.h}px;border:2.5px solid #0071E3;border-radius:${m.radius ?? 14}px;box-shadow:0 0 0 2px rgba(255,255,255,.9)`;
        layer.append(ring);
      }
      const at = m.at || 'tl';
      let x = /l/.test(at) ? box.l - S / 2 : /r/.test(at) ? box.l + box.w - S / 2 : box.l + box.w / 2 - S / 2;
      let y = at[0] === 't' ? box.t - S / 2 : at[0] === 'b' ? box.t + box.h - S / 2 : box.t + box.h / 2 - S / 2;
      if (at === 'l') x = box.l - S - 3;
      if (at === 'r') x = box.l + box.w + 3;
      x = Math.max(3, Math.min(W - S - 3, x));
      y = Math.max(3, Math.min(H - S - 3, y));
      const b = document.createElement('div');
      b.textContent = m.n;
      b.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:${S}px;height:${S}px;border-radius:50%;background:#0071E3;color:#fff;font:700 14px/26px Inter,system-ui,sans-serif;text-align:center;box-shadow:0 0 0 2.5px #fff, 0 2px 6px rgba(0,0,0,.28)`;
      layer.append(b);
    });
    document.body.append(layer);
  }, marks);
}

/** One phone screen, with its callouts. */
async function screen(p, name, marks = []) {
  await settle(p, 300);
  await p.evaluate(() => { document.activeElement?.blur(); document.querySelectorAll('.toast, .moment-plate').forEach((e) => e.remove()); });
  if (marks.length) await mark(p, marks);
  await p.screenshot({ path: `${RAW}${name}.png` });
  await p.evaluate(() => document.getElementById('__marks')?.remove());
  console.log(`  shot ${name}`);
  return `${RAW}${name}.png`;
}

// Two screens side by side on a light panel, the way the manual shows them.
const toolCtx = await browser.newContext({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 2 });
const tool = await toolCtx.newPage();
async function pair(name, files, labels = []) {
  const imgs = files.map((f) => `data:image/png;base64,${readFileSync(f).toString('base64')}`);
  await tool.setContent(`<!doctype html><html><head><style>
    body{margin:0;background:#fff;font-family:Inter,system-ui,sans-serif}
    .panel{display:inline-flex;gap:28px;padding:28px 28px 22px;background:#F2F3F5}
    figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:10px}
    img{width:390px;height:auto;border-radius:26px;box-shadow:0 0 0 1px rgba(13,20,31,.12),0 6px 18px rgba(13,20,31,.10);display:block}
    figcaption{font-size:14px;font-weight:600;color:#43617A;letter-spacing:.01em}
  </style></head><body><div class="panel">${imgs.map((src, i) => `<figure><img src="${src}">${labels[i] ? `<figcaption>${labels[i]}</figcaption>` : ''}</figure>`).join('')}</div></body></html>`);
  await tool.waitForFunction(() => [...document.images].every((i) => i.complete));
  await tool.locator('.panel').screenshot({ path: `${OUT}${name}.jpg`, type: 'jpeg', quality: 84 });
  console.log(`made ${name}.jpg`);
}

const FLOWS = {};
const flow = (name, fn) => { FLOWS[name] = fn; };

// SOP 1: install on the iPhone
flow('01-install', async () => {
  const { ctx, p } = await at('2026-10-07T10:30:00');
  await p.locator('.you-btn[data-action="you"]').click();
  await p.waitForSelector('.you'); await settle(p);
  const a = await screen(p, '01a', [{ sel: '.you .row', text: 'Add to Home Screen', n: 1, at: 'r', pad: 2 }]);
  await p.locator('.you .row', { hasText: 'Add to Home Screen' }).click();
  await p.waitForSelector('.steps--big'); await settle(p);
  const b = await screen(p, '01b', [
    { sel: '.steps--big li', nth: 0, n: 2, at: 'l', pad: 6 },
    { sel: '.steps--big li', nth: 1, n: 3, at: 'l', pad: 6 },
    { sel: '.steps--big li', nth: 2, n: 4, at: 'l', pad: 6 },
  ]);
  await pair('01-install', [a, b], ['You', 'Add to Home Screen']);
  await ctx.close();
});

// SOP 2: sync, first device and then the key
flow('02-sync', async () => {
  const PORT = 8790 + Math.floor(Math.random() * 100);
  const srv = await serve(PORT);
  const { ctx, p } = await at('2026-10-07T10:30:00');
  await go(p, '#/you/sync', '[data-input="sy-url"]');
  await p.locator('[data-input="sy-url"]').fill('https://lifeos-sync.your-name.workers.dev');
  await p.locator('[data-input="sy-url"]').blur();
  const a = await screen(p, '02a', [
    { sel: '[data-input="sy-url"]', n: 1, at: 'tr' },
    { sel: '[data-action="sy-check"]', n: 2, at: 'r', pad: 2 },
    { sel: '[data-action="sy-start"]', n: 3, at: 'r', pad: 2 },
    { sel: '[data-input="sy-key"]', n: 4, at: 'r', pad: 2 },
  ]);
  await p.locator('[data-input="sy-url"]').fill(`http://localhost:${PORT}`);
  await p.locator('[data-action="sy-check"]').click();
  await p.waitForSelector('text=Your server is ready.');
  await p.locator('[data-action="sy-start"]').click();
  await p.waitForFunction(() => /Synced/.test(document.querySelector('.sync-state')?.textContent || ''), null, { timeout: 30000 });
  await p.evaluate(() => document.querySelectorAll('.toast').forEach((e) => e.remove()));
  await settle(p, 900);
  const b = await screen(p, '02b', [
    { sel: '.sync-state', n: 5, at: 'tr', pad: 6 },
    { sel: '.sync-key-val', n: 6, at: 'tr', pad: 6 },
    { sel: '[data-action="sy-copy-key"]', n: 7, at: 'tr', pad: 2 },
  ]);
  await pair('02-sync', [a, b], ['Before: You › Sync', 'After: sync is on']);
  await ev(p, async () => (await import('./js/sync/engine.js')).stop());
  await ctx.close();
  await srv.close();
});

// Mark the morning check-in as done, so Today shows the day's next step.
const CHECKED = async () => {
  const s = window.__lifeos.store;
  const d = new Date().toISOString().slice(0, 10);
  s.put('sleepEntries', { id: d, date: d, bedtime: '22:30', wake: '06:00', hours: 7.5, quality: 7 });
  s.put('moodEntries', { id: d, date: d, energy: 7, stress: 3, mood: 7 });
};
const focusIds = (p) => ev(p, async () => { const H = await import('./js/domain/habits-more.js'); return H.focusHabits().map((h) => ({ id: h.id, name: h.name, tiny: !!H.tinyOf(h) })); });

// SOP 3: choose your three, and shape each one
flow('03-habits', async () => {
  const { ctx, p } = await at('2026-10-07T10:30:00');
  await go(p, '#/plan/habits/sort', '.sort-slots');
  const a = await screen(p, '03a', [
    { sel: '.sort-slots', n: 1, at: 'tr', pad: 6 },
    { sel: '.sort-row .sort-pick', n: 2, at: 'tl', pad: 4 },
    { sel: '.sort-bar [data-action="save"]', n: 3, at: 'tr', pad: 3, radius: 28, fixed: true },
  ]);
  const [h] = await focusIds(p);
  await go(p, `#/plan/habits/${h.id}`, '[data-action="edit"]');
  await p.locator('[data-action="edit"]').first().click();
  await p.waitForSelector('[data-action="toggle-more"]'); await settle(p);
  const b = await screen(p, '03b', [
    { sel: '.chips[aria-label="Suggested moments"]', n: 4, at: 'tr', pad: 4 },
    { sel: '[data-input="tiny"][data-k="label"]', n: 5, at: 'tr', pad: 3 },
  ]);
  await pair('03-habits', [a, b], ['Plan › Habits › Choose your three', 'Edit a habit']);
  await ctx.close();
});

// SOP 4: the morning check-in
flow('04-checkin', async () => {
  const { ctx, p } = await at('2026-10-07T07:05:00');
  await p.waitForSelector('.now .btn--primary');
  const a = await screen(p, '04a', [{ sel: '.now .btn--primary', n: 1, at: 'tr', pad: 4 }]);
  await p.locator('.now .btn--primary').click();
  await p.waitForSelector('.ritual[data-step="sleep"]'); await settle(p);
  const b = await screen(p, '04b', [
    { sel: '.ci-times', n: 2, at: 'tl', pad: 6 },
    { sel: '[data-action="r-health"]', n: 3, at: 'r', pad: 4 },
    { sel: '[data-action="r-next"]', n: 4, at: 'tl', pad: 3 },
  ]);
  await pair('04-checkin', [a, b], ['Today, first thing', 'Check-in: sleep']);
  await ctx.close();
});


// Today at a glance: the top of the cockpit, then Your day.
flow('a-today', async () => {
  const { ctx, p } = await at('2026-10-07T13:00:00', { before: CHECKED });
  await p.waitForSelector('.dstrip');
  if (await p.locator('.catchup-foot button').count()) { await p.locator('.catchup-foot button').first().click(); await settle(p); }
  await ev(p, () => window.scrollTo(0, 0));
  const a = await screen(p, 'a-today-1', [
    { sel: '.logbar [data-action="capture"]', n: 1, at: 'tl', pad: 3, radius: 24 },
    { sel: '.now', n: 2, at: 'tr', pad: 4, radius: 26 },
    { sel: '.you-btn', n: 3, at: 'bl', pad: 3, radius: 24 },
  ]);
  const b = await screen(p, 'a-today-2', [
    { sel: '.pins--quick', n: 4, at: 'tr', pad: 4 },
    { sel: '.ds-row.is-current', n: 5, at: 'tr', pad: 4 },
    { sel: '.tab--capture', n: 6, at: 'tr', pad: 3, radius: 30, fixed: true },
  ]);
  await pair('a-today', [a, b], ['Today, top', 'Today: quick row and Your day']);
  await ctx.close();
});

// Plan and Review: what you're building, and how it's going.
flow('a-places', async () => {
  const { ctx, p } = await at('2026-10-07T13:00:00', { before: CHECKED });
  await go(p, '#/plan', '[data-view="plan"] [data-key="habits"]');
  await p.waitForFunction(() => !document.querySelector('.block--later'));
  const a = await screen(p, 'a-places-1', [
    { sel: '[data-view="plan"] .plan-group[data-key="habits"] .block-title', n: 1, at: 'r', pad: 4 },
    { sel: '[data-view="plan"] .plan-group[data-key="habits"] .list', n: 2, at: 'tr', pad: 4 },
  ]);
  await go(p, '#/review', '.write-area');
  const b = await screen(p, 'a-places-2', [
    { sel: '.write-area', n: 3, at: 'tr', pad: 4 },
    { sel: '.story .story-sentence', n: 4, at: 'tr', pad: 4 },
  ]);
  await pair('a-places', [a, b], ['Plan', 'Review']);
  await ctx.close();
});

// Set up: your times, then Your day.
flow('s-day', async () => {
  const { ctx, p } = await at('2026-10-07T10:30:00');
  await go(p, '#/you/settings', '[data-k="wakeTime"]');
  const a = await screen(p, 's-day-1', [
    { sel: '[data-k="wakeTime"]', closest: '.set-list', n: 1, at: 'tr', pad: 4 },
  ]);
  await go(p, '#/plan/playbook', '.plan-day--edit');
  const b = await screen(p, 's-day-2', [
    { sel: '.plan-day--edit .plan-block-main', nth: 1, n: 2, at: 'tr', pad: 3 },
    { sel: '.plan-day--edit .drag-handle', nth: 1, n: 3, at: 'l', pad: 3 },
  ]);
  await pair('s-day', [a, b], ['You › Settings: Day', 'Plan › Your plan: Your day']);
  await ctx.close();
});

// Set up: a new habit, and a routine.
flow('s-habit', async () => {
  const { ctx, p } = await at('2026-10-07T10:30:00');
  await ev(p, async () => (await import('./js/screens/habit-new.js')).openNewHabit());
  await p.waitForSelector('.new-habit [data-f="name"]');
  await p.locator('.new-habit [data-f="name"]').fill('Read 10 pages');
  await p.locator('.new-habit [data-action="anchor"]').nth(2).click();
  await p.locator('.new-habit [data-f="tiny"]').fill('Read one page');
  await settle(p);
  const a = await screen(p, 's-habit-1', [
    { sel: '.new-habit [data-f="name"]', n: 1, at: 'tr', pad: 3 },
    { sel: '.new-habit .chips', n: 2, at: 'tr', pad: 4 },
    { sel: '.new-habit [data-f="tiny"]', n: 3, at: 'tr', pad: 3 },
    { sel: '.new-habit button[type="submit"]', n: 4, at: 'tl', pad: 3 },
  ]);
  await p.keyboard.press('Escape');
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  await ev(p, async () => (await import('./js/screens/routine-edit.js')).openRoutineEditor('r-morning'));
  await p.waitForSelector('.sheet .re-steps'); await settle(p);
  const last = (await p.locator('.sheet .re-step').count()) - 1;
  const b = await screen(p, 's-habit-2', [
    { sel: '.sheet .re-step', nth: last, n: 5, at: 'tr', pad: 3 },
    { sel: '.sheet [data-change="add-habit"]', n: 6, at: 'tr', pad: 3 },
  ]);
  await pair('s-habit', [a, b], ['Plan › Habits › +', 'A routine: Morning']);
  await ctx.close();
});

// Set up: a task (one-off or repeating), and the day's priorities.
flow('s-task', async () => {
  const { ctx, p } = await at('2026-10-07T10:30:00', { before: CHECKED });
  await p.waitForSelector('.prio');
  const a = await screen(p, 's-task-1', [{ sel: '.prio', n: 1, at: 'tr', pad: 4 }]);
  await ev(p, async () => (await import('./js/screens/task-sheet.js')).openTask());
  await p.waitForSelector('.task-form [data-input="title"]');
  await p.locator('.task-form [data-input="title"]').fill('Water the plants');
  await p.locator('.task-form [aria-label="Repeat"] .chip').nth(1).click().catch(() => {});
  await settle(p);
  const b = await screen(p, 's-task-2', [
    { sel: '.task-form [data-input="title"]', n: 2, at: 'tr', pad: 3 },
    { sel: '.task-form [aria-label="Repeat"]', n: 3, at: 'tr', pad: 4 },
  ]);
  await pair('s-task', [a, b], ['Today: priorities and tasks', 'A new task']);
  await ctx.close();
});

// Set up: a goal in three questions, and what it then tells you.
flow('s-goal', async () => {
  const { ctx, p } = await at('2026-10-07T10:30:00');
  await ev(p, async () => (await import('./js/screens/goals.js')).newGoal());
  await p.waitForSelector('.sheet .goal-new');
  await p.fill('.sheet [data-f="name"]', 'Run 100 km by Christmas');
  await p.locator('.sheet [data-action="gn-next"]').click();
  await p.locator('.sheet [data-action="gn-next"]').click();
  await p.waitForSelector('.sheet [data-action="gn-how"]'); await settle(p);
  const a = await screen(p, 's-goal-1', [{ sel: '.sheet .goal-new .chips', n: 1, at: 'tr', pad: 4 }]);
  await p.keyboard.press('Escape');
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  await go(p, '#/plan/goals/g-body', '.goal-hero');
  const b = await screen(p, 's-goal-2', [
    { sel: '.goal-hero', n: 2, at: 'tr', pad: 4 },
    { sel: '.goal-projection', n: 3, at: 'tr', pad: 4 },
  ]);
  await pair('s-goal', [a, b], ['Plan › Goals › +: how you’ll know', 'A goal’s page']);
  await ctx.close();
});

// Set up: your training week and a workout.
flow('s-training', async () => {
  const { ctx, p } = await at('2026-10-07T10:30:00');
  await go(p, '#/plan/training', '.week-strip');
  const a = await screen(p, 's-training-1', [{ sel: '.week-strip', n: 1, at: 'tr', pad: 4 }]);
  const tid = await ev(p, async () => (await import('./js/domain/fitness-core.js')).templates()[0].id);
  await go(p, `#/plan/training/workouts/${tid}`, '[data-view="template"] .sort-list');
  const b = await screen(p, 's-training-2', [
    { sel: '[data-view="template"] .sort-list', n: 2, at: 'tr', pad: 4 },
    { sel: '[data-view="template"] [data-action="start"]', n: 3, at: 'bl', pad: 3, radius: 24 },
  ]);
  await pair('s-training', [a, b], ['Plan › Training', 'A workout']);
  await ctx.close();
});

// Set up: every reminder on one timeline.
flow('s-reminders', async () => {
  const { ctx, p } = await at('2026-10-07T10:30:00', { before: () => { const s = window.__lifeos.store; s.setSettings({ notifications: { ...s.settings().notifications, enabled: true } }); } });
  await p.locator('.you-btn[data-action="you"]').click();
  await p.waitForSelector('.you'); await settle(p);
  const a = await screen(p, 's-reminders-1', [{ sel: '.you .row', text: 'Reminders', n: 1, at: 'r', pad: 2 }]);
  await p.locator('.you .row', { hasText: 'Every reminder on one timeline' }).click();
  await p.waitForSelector('.rem-list'); await settle(p);
  const b = await screen(p, 's-reminders-2', [
    { sel: '.rem-row .rem-time', n: 2, at: 'tl', pad: 3, radius: 24 },
    { sel: '.rem-row .row-sub', n: 3, at: 'bl', pad: 3 },
    { sel: '.rem-row [role="switch"]', n: 4, at: 'br', pad: 3, radius: 20 },
  ]);
  await pair('s-reminders', [a, b], ['You', 'You › Reminders']);
  await ctx.close();
});

// Every day: the Now card, a tick, and the + button.
flow('d-day', async () => {
  const { ctx, p } = await at('2026-10-07T13:00:00', { before: CHECKED });
  await p.waitForSelector('.today .now');
  if (await p.locator('.catchup-foot button').count()) { await p.locator('.catchup-foot button').first().click(); await settle(p); }
  await ev(p, () => window.scrollTo(0, 0));
  const a = await screen(p, 'd-day-1', [
    { sel: '.now .now-body', n: 1, at: 'tr', pad: 6 },
    { sel: '.now .btn--primary', n: 2, at: 'bl', pad: 3, radius: 24 },
    { sel: '.now button', text: 'Tiny', n: 3, at: 'br', pad: 3, radius: 24 },
  ]);
  await p.locator('.tab--capture').click();
  await p.waitForSelector('.cap-input');
  await p.locator('.cap-input').fill('water 750');
  await p.waitForSelector('.cap-preview'); await settle(p);
  const b = await screen(p, 'd-day-2', [
    { sel: '.cap-input', n: 4, at: 'tr', pad: 4 },
    { sel: '.cap-preview', n: 5, at: 'tr', pad: 4 },
  ]);
  await pair('d-day', [a, b], ['Today', 'The + button']);
  await ctx.close();
});

// Every day: training in gym mode, and the bar that brings you back.
flow('d-gym', async () => {
  const { ctx, p } = await at('2026-10-07T06:40:00', { before: CHECKED });
  await ev(p, async () => {
    const F = await import('./js/domain/fitness-core.js');
    const d = (await import('./js/domain/dates.js')).today();
    const t = F.plannedTemplate(d) || F.templates()[0];
    (await import('./js/screens/workout-actions.js')).startWorkout(t.id, d, { gym: true });
  });
  await p.waitForSelector('.gym-card'); await settle(p, 900);
  // The test browser can't keep the screen awake; on the phone this note isn't there.
  await ev(p, () => document.querySelectorAll('.gym-warn').forEach((e) => e.remove()));
  const a = await screen(p, 'd-gym-1', [
    { sel: '.gym-card', n: 1, at: 'tr', pad: 4 },
    { sel: '[data-action="g-done"]', n: 2, at: 'tl', pad: 3, radius: 30 },
  ]);
  await go(p, '#/today', '.wbar');
  const b = await screen(p, 'd-gym-2', [{ sel: '.wbar', n: 3, at: 'tr', pad: 3, radius: 30, fixed: true }]);
  await pair('d-gym', [a, b], ['Gym mode', 'Left the workout: the bar back']);
  await ctx.close();
});

// Going further: what a habit is linked to, and deleting it safely.
flow('f-linked', async () => {
  const { ctx, p } = await at('2026-10-07T10:30:00');
  await go(p, '#/plan/habits/h-prayer', '[data-key="linked"]');
  const a = await screen(p, 'f-linked-1', [{ sel: '[data-key="linked"] .list', n: 1, at: 'tr', pad: 4 }]);
  await p.locator('.danger-zone [data-action="delete"]').click();
  await p.waitForSelector('.sheet .safe-delete');
  await p.selectOption('.sheet [data-change="sd-to"]', 'h-scripture'); await settle(p);
  const b = await screen(p, 'f-linked-2', [
    { sel: '.sheet [data-change="sd-to"]', n: 2, at: 'tr', pad: 3 },
    { sel: '.sheet [data-action="sd-go"]', n: 3, at: 'tl', pad: 3, radius: 30 },
  ]);
  await pair('f-linked', [a, b], ['A habit: Linked to', 'Delete: move its links']);
  await ctx.close();
});

// Going further: tap any number to see how it's worked out.
flow('f-explain', async () => {
  const { ctx, p } = await at('2026-10-07T20:00:00', { before: CHECKED });
  await go(p, '#/plan/habits/h-prayer', '.run-card');
  const a = await screen(p, 'f-explain-1', [
    { sel: '.run-card .run-val', n: 1, at: 'tr', pad: 4 },
    { sel: '.run-card [data-what="strength"]', n: 2, at: 'tr', pad: 4 },
  ]);
  await p.locator('[data-what="consistency"][data-days="30"]').click();
  await p.waitForSelector('.sheet .explain-sum'); await settle(p);
  const b = await screen(p, 'f-explain-2', [
    { sel: '.sheet .explain-sum', n: 3, at: 'tr', pad: 4 },
    { sel: '.sheet .explain-days', n: 4, at: 'tr', pad: 4 },
  ]);
  await pair('f-explain', [a, b], ['A habit’s numbers', 'How 30 days is worked out']);
  await ctx.close();
});

// Going further: #mentions and @mentions.
flow('f-mentions', async () => {
  const { ctx, p } = await at('2026-10-07T10:30:00');
  await go(p, '#/plan/notes', '.dump-input');
  await p.locator('.dump-input').click();
  await p.keyboard.type('Prayed early with @Sarah, #pray', { delay: 15 });
  await p.waitForSelector('.mention-bar .mention-chip'); await settle(p);
  const a = await screen(p, 'f-mentions-1', [
    { sel: '.dump-input', n: 1, at: 'tr', pad: 4 },
    { sel: '.mention-bar', n: 2, at: 'tl', pad: 3, fixed: true },
  ]);
  await p.locator('.dump-input').focus();
  await p.keyboard.press('End');
  await p.keyboard.type('e');
  await p.waitForSelector('.mention-bar .mention-chip');
  await p.locator('.mention-bar .mention-chip').first().click();
  await p.locator('[data-action="save"]').click();
  await p.waitForSelector('.note-card .mention');
  await go(p, '#/plan/habits/h-prayer', '[data-key="linked"]');
  const b = await screen(p, 'f-mentions-2', [{ sel: '[data-key="linked"] .linked-label', n: 3, at: 'tr', pad: 4 }]);
  await pair('f-mentions', [a, b], ['Plan › Brain dump', 'The habit: Mentioned in']);
  await ctx.close();
});

// Going further: search, and undoing later.
flow('f-search', async () => {
  const { ctx, p } = await at('2026-10-07T10:30:00');
  await ev(p, () => window.__lifeos.app.search());
  await p.waitForSelector('.sheet [data-input="q"]');
  await p.locator('.sheet [data-input="q"]').fill('spending'); await settle(p);
  const a = await screen(p, 'f-search-1', [
    { sel: '.sheet [data-input="q"]', closest: '.search-field', n: 1, at: 'tr', pad: 3 },
    { sel: '.sheet .list', n: 2, at: 'tr', pad: 4 },
  ]);
  await p.keyboard.press('Escape');
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  await ev(p, async () => { const d = (await import('./js/domain/dates.js')).today(); (await import('./js/screens/sheets.js')).addWater(d, 500); });
  await settle(p);
  await ev(p, async () => (await import('./js/screens/recent.js')).openRecent());
  await p.waitForSelector('.sheet .recent-row'); await settle(p);
  const b = await screen(p, 'f-search-2', [{ sel: '.sheet [data-action="rc-undo"]', n: 3, at: 'tl', pad: 3, radius: 20 }]);
  await pair('f-search', [a, b], ['Search (pull down)', 'You › Recent changes']);
  await ctx.close();
});

// SOP 6: not today, and the help that fits the reason
flow('06-skip', async () => {
  const { ctx, p } = await at('2026-10-07T18:00:00', { before: CHECKED });
  await p.waitForSelector('.today .now');
  const id = await ev(p, async () => {
    const H = await import('./js/domain/habits-more.js');
    const d = new Date().toISOString().slice(0, 10);
    const h = H.focusHabits().find((x) => H.tinyOf(x) && !H.isDone(x, d)) || H.focusHabits()[0];
    (await import('./js/screens/pads.js')).notToday(h, d);
    return h.id;
  });
  await p.waitForSelector('.skip-sheet [data-action="reason"]'); await settle(p);
  const a = await screen(p, '06a', [
    { sel: '.skip-sheet .chips', n: 1, at: 'tl', pad: 6 },
    { sel: '.skip-sheet .field-hint', n: 2, at: 'tl', pad: 4 },
    { sel: '[data-action="skip-anyway"]', n: 3, at: 'tl', pad: 3 },
  ]);
  await p.locator('[data-action="reason"][data-v="busy"]').click();
  await p.waitForSelector('.skip-done'); await settle(p);
  await p.evaluate(() => document.querySelectorAll('.toast').forEach((e) => e.remove()));
  const b = await screen(p, '06b', [
    { sel: '.skip-done', n: 4, at: 'tl', pad: 6 },
    { sel: '.skip-sheet .btn--primary', n: 5, at: 'tl', pad: 3 },
  ]);
  console.log(`  habit ${id}`);
  await pair('06-skip', [a, b], ['Not today', 'After choosing “Busy”']);
  await ctx.close();
});

// SOP 7: close the day and seal it
flow('07-evening', async () => {
  const { ctx, p } = await at('2026-10-07T20:30:00', { before: CHECKED });
  await ev(p, async () => (await import('./js/screens/ritual.js')).openRitual('evening'));
  await p.waitForSelector('.ritual[data-step="habits"]'); await settle(p);
  const a = await screen(p, '07a', [
    { sel: '.ritual-habits [data-action="r-tick"]', n: 1, at: 'l', pad: 3, radius: 22 },
    { sel: '[data-action="r-skip-habit"]', n: 2, at: 'tr', pad: 3 },
    { sel: '[data-action="r-next"]', n: 3, at: 'tl', pad: 3 },
  ]);
  for (let i = 0; i < 6; i++) {
    const s = await p.getAttribute('.ritual', 'data-step');
    if (s === 'seal') break;
    if (s === 'win') await p.locator('.ritual textarea').fill('Trained at lunch despite a full day');
    if (s === 'tomorrow') await p.locator('.ritual input').fill('Send the proposal');
    await p.locator('[data-action="r-next"]').click();
    await p.waitForFunction((prev) => document.querySelector('.ritual')?.dataset.step !== prev, s);
  }
  await settle(p);
  const b = await screen(p, '07b', [{ sel: '.hold-btn', n: 4, at: 'tr', pad: 6, radius: 40 }]);
  await pair('07-evening', [a, b], ['Close your day: habits', 'The last step: seal']);
  await ctx.close();
});

// SOP 8: the weekly review on Sunday
flow('08-weekly', async () => {
  const { ctx, p } = await at('2026-10-11T18:00:00', { before: CHECKED });
  await go(p, '#/reflect/review/week', '.guide');
  const a = await screen(p, '08a', [
    { sel: '.guide .ritual-progress', n: 1, at: 'tr', pad: 8 },
    { sel: '.guide .review-sentence', n: 2, at: 'tr', pad: 6 },
  ]);
  for (let i = 0; i < 8 && !(await p.locator('.guide[data-step="next"]').count()); i++) {
    await p.locator('[data-action="rv-next"]').click();
    await settle(p, 350);
  }
  const items = ['Ship the website', 'Three workouts', 'In bed by 22:30'];
  for (let i = 0; i < 3; i++) { await p.locator(`[data-key="next-week"] [data-i="${i}"]`).fill(items[i]); await p.locator(`[data-key="next-week"] [data-i="${i}"]`).press('Tab'); }
  await settle(p);
  const b = await screen(p, '08b', [
    { sel: '[data-key="next-week"] ol', n: 3, at: 'tr', pad: 6 },
    { sel: '[data-action="complete"]', n: 4, at: 'tl', pad: 3 },
  ]);
  await pair('08-weekly', [a, b], ['Review › Review the week', 'The last step: next week’s three']);
  await ctx.close();
});

// SOP 9: the monthly review asks whether a habit feels automatic
flow('09-monthly', async () => {
  const { ctx, p } = await at('2026-10-30T19:00:00', {
  });
  await go(p, '#/reflect/review/month', '.guide[data-step="numbers"]');
  await p.locator('[data-action="rv-next"]').click();
  await p.waitForSelector('.guide[data-step="auto"]'); await settle(p);
  const a = await screen(p, '09a', [{ sel: '.guide[data-step="auto"] [data-action="auto-check"]', n: 1, at: 'tl', pad: 3 }]);
  await p.locator('.guide[data-step="auto"] [data-action="auto-check"]').first().click();
  await p.waitForSelector('.auto-opt');
  for (const [i, v] of [[0, 4], [1, 5], [2, 4], [3, 3]]) await p.locator(`.auto-opt[data-i="${i}"][data-v="${v}"]`).click();
  await settle(p);
  const b = await screen(p, '09b', [
    { sel: '.auto-scale', n: 2, at: 'tl', pad: 4 },
    { sel: '[data-action="ac-save"]', n: 3, at: 'tl', pad: 3 },
  ]);
  await pair('09-monthly', [a, b], ['Review › Review the month', 'Does it feel automatic?']);
  await ctx.close();
});

// SOP 10: a habit to cut down or quit
flow('10-less', async () => {
  const { ctx, p } = await at('2026-10-07T15:00:00', {
    before: async () => {
      const HS = await import('./js/domain/habit-system.js');
      const h = HS.newHabit({ id: 'h-coffee', name: 'Coffee', type: 'limit', limit: 2, unit: 'coffees', icon: 'coffee', instead: 'Sparkling water and a short walk', state: 'autopilot', section: 'life' });
      window.__lifeos.store.put('habits', h);
    },
  });
  const open = () => ev(p, async () => {
    const H = await import('./js/domain/habits-more.js');
    (await import('./js/screens/less.js')).openLess(H.habit('h-coffee'));
  });
  await ev(p, async () => { const H = await import('./js/domain/habits-more.js'); H.addCount(H.habit('h-coffee'), new Date().toISOString().slice(0, 10), 1); });
  await open();
  await p.waitForSelector('.less-sheet [data-action="ls-resisted"]'); await settle(p);
  const a = await screen(p, '10a', [
    { sel: '.less-count', n: 1, at: 'tl', pad: 6 },
    { sel: '[data-action="ls-resisted"]', n: 2, at: 'tl', pad: 3 },
    { sel: '[data-action="ls-slipped"]', n: 3, at: 'tl', pad: 3 },
  ]);
  await p.locator('[data-action="ls-resisted"]').click();
  await p.waitForSelector('[data-action="ls-tag"]'); await settle(p);
  await p.locator('[data-action="ls-tag"][data-k="where"][data-v="work"]').click();
  await p.locator('[data-action="ls-tag"][data-k="feeling"][data-v="tired"]').click();
  await p.evaluate(() => document.querySelectorAll('.toast').forEach((e) => e.remove()));
  await settle(p);
  const b = await screen(p, '10b', [
    { sel: '[data-action="ls-tag"]', n: 4, closest: '.field', at: 'tl', pad: 4 },
    { sel: '[data-action="ls-tag"][data-k="feeling"]', n: 5, closest: '.field', at: 'tl', pad: 4 },
    { sel: '.less-sheet .backup-card', n: 6, at: 'tl', pad: 4 },
  ]);
  await pair('10-less', [a, b], ['Tap the habit on Today', 'After an urge']);
  await ctx.close();
});

// SOP 11: weight, food and training on Body
flow('11-body', async () => {
  const { ctx, p } = await at('2026-10-07T13:00:00', { before: CHECKED });
  await go(p, '#/progress/body', '[data-action="log-weight"]');
  const a = await screen(p, '11a', [{ sel: '.btn[data-action="log-weight"]', n: 1, at: 'tr', pad: 4 }]);
  const b = await screen(p, '11b', [
    { sel: '.btn[data-action="start"]', n: 2, at: 'tl', pad: 3 },
    { sel: '.btn[data-action="food"]', n: 3, at: 'tl', pad: 3 },
  ]);
  await pair('11-body', [a, b], ['Review › Body', 'Further down: food and training']);
  await ctx.close();
});

// SOP 12: a backup to keep
flow('12-backup', async () => {
  const { ctx, p } = await at('2026-10-07T10:30:00', { before: CHECKED });
  await p.locator('.you-btn[data-action="you"]').click();
  await p.waitForSelector('.you'); await settle(p);
  const a = await screen(p, '12a', [{ sel: '.you .row', text: 'Data & backup', n: 1, at: 'r', pad: 2 }]);
  await p.locator('.you .row', { hasText: 'Data & backup' }).click();
  await p.waitForSelector('[data-action="backup"]'); await settle(p, 900);
  const b = await screen(p, '12b', [
    { sel: '[data-action="backup"]', n: 2, at: 'tl', pad: 3 },
    { sel: '.file-btn', n: 3, at: 'tl', pad: 3 },
  ]);
  await pair('12-backup', [a, b], ['You', 'Data & backup']);
  await ctx.close();
});

const all = only.length ? only : Object.keys(FLOWS);
for (const n of all) {
  console.log(n);
  try { await FLOWS[n](); } catch (e) { console.log(`FAIL ${n}: ${e.message.split('\n')[0]}`); }
}
await browser.close();
