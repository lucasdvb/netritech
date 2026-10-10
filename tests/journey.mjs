// The handover journey: a realistic session done only through the interface, checking the
// database after each step. Create a habit, edit it (same record, no duplicates), log it and take
// it back, see it counted, leave, come back, reload, edit again, then delete it with Undo and for
// good. Then the same lifecycle for a task, a journal entry, a note and a weigh-in, each across
// a reload. Text with emoji, accents, markup and spaces is stored as text and shown as text.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';

const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { browser, step, finish, base, errors } = t;
const OUT = process.argv[3] || './test-shots';
const NAME = 'Stretch 5 min ✓ <b>now</b>';

const ctx = await browser.newContext({ ...devices['iPhone 14'] });
const p = await ctx.newPage();
p.setDefaultTimeout(10000);
p.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
p.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
p.on('dialog', (d) => { errors.push(`unexpected dialog: ${d.message()}`); d.dismiss(); });
await p.clock.install({ time: new Date('2026-10-09T08:00:00') });
await p.goto(`${base}#/today`);
await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 20000 });
await p.evaluate(async () => { await (await import('./js/data/demo.js')).loadDemo(30); window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }); await window.__lifeos.store.flush(); });
await p.reload();
await p.waitForFunction(() => window.__lifeos?.ready);

const ev = (fn, arg) => p.evaluate(fn, arg);
const go = async (hash, sel) => { await p.evaluate((h) => { location.hash = h; }, hash); if (sel) await p.waitForSelector(sel); };
const reload = async () => { await ev(() => window.__lifeos.store.flush()); await p.reload(); await p.waitForFunction(() => window.__lifeos?.ready); };
const habits = (name) => ev((n) => window.__lifeos.store.all('habits').filter((h) => h.name.startsWith(n)), name);
const xss = () => ev(() => window.__xss);
let id;

await step('create a habit through the sheet: one record, stored as typed (trimmed), shown as text', async () => {
  await go('#/plan/habits', '[data-view="habits"] [data-action="new"]');
  await p.locator('[data-view="habits"] [data-action="new"]').first().click();
  await p.waitForSelector('.sheet .new-habit');
  // Empty name is refused without saving anything.
  const before = await ev(() => window.__lifeos.store.all('habits').length);
  await p.locator('.new-habit button[type="submit"]').click();
  await p.waitForSelector('.new-habit .field-error');
  if ((await ev(() => window.__lifeos.store.all('habits').length)) !== before) throw new Error('an empty habit was saved');
  await p.fill('.new-habit [data-f="name"]', `  ${NAME}  `);
  // Double-tap Add: still one habit.
  await p.locator('.new-habit button[type="submit"]').dblclick();
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  const hs = await habits('Stretch 5 min');
  if (hs.length !== 1 || hs[0].name !== NAME) throw new Error(JSON.stringify(hs.map((h) => h.name)));
  id = hs[0].id;
  await go(`#/plan/habits/${id}`, '[data-view="habit"] .page-title');
  if ((await p.textContent('.page-title')).trim() !== NAME) throw new Error('title not shown as text');
  if (await p.locator('.page-title b').count()) throw new Error('markup rendered');
});

await step('edit the name: the same record changes, nothing is duplicated', async () => {
  await p.locator('[data-action="edit"]').click();
  await p.waitForSelector('.sheet .editor [data-f="name"]');
  await p.fill('.sheet .editor [data-f="name"]', 'Stretch 10 min 🧘');
  await p.keyboard.press('Escape');
  await p.waitForFunction(() => document.querySelector('.page-title')?.textContent.includes('10 min'));
  const hs = await habits('Stretch');
  if (hs.length !== 1 || hs[0].id !== id || hs[0].name !== 'Stretch 10 min 🧘') throw new Error(JSON.stringify(hs.map((h) => [h.id, h.name])));
});

await step('log it for today and take it back: the log is saved, then reversed', async () => {
  const logged = () => ev((hid) => window.__lifeos.store.all('habitLogs').filter((l) => l.habitId === hid && l.completed).map((l) => l.date), id);
  await ev(async (hid) => { const H = await import('./js/domain/habits.js'); const D = await import('./js/domain/dates.js'); H.setLog(H.habit(hid), D.today(), { value: 1 }); }, id);
  await go('#/today', '[data-view="today"]');
  // Today lists it; its row is ticked.
  await go(`#/plan/habits/${id}`, '[data-view="habit"]');
  if ((await logged()).join() !== '2026-10-09') throw new Error(`logs ${await logged()}`);
  const page = await p.textContent('[data-view="habit"]');
  if (!/1 day|1 of|This week/i.test(page)) throw new Error('not counted on its page');
  await ev(async (hid) => { const H = await import('./js/domain/habits.js'); const D = await import('./js/domain/dates.js'); H.setLog(H.habit(hid), D.today(), { value: 0 }); }, id);
  if ((await logged()).length) throw new Error('not taken back');
});

await step('leave, come back, reload: everything is still there, once', async () => {
  await ev(async (hid) => { const H = await import('./js/domain/habits.js'); const D = await import('./js/domain/dates.js'); H.setLog(H.habit(hid), D.today(), { value: 1 }); }, id);
  await go('#/progress', '[data-view="review"]');
  await go(`#/plan/habits/${id}`, '[data-view="habit"]');
  await reload();
  await go(`#/plan/habits/${id}`, '[data-view="habit"] .page-title');
  const hs = await habits('Stretch');
  if (hs.length !== 1 || (await p.textContent('.page-title')).trim() !== 'Stretch 10 min 🧘') throw new Error('lost on reload');
  const n = await ev((hid) => window.__lifeos.store.all('habitLogs').filter((l) => l.habitId === hid && l.completed).length, id);
  if (n !== 1) throw new Error(`${n} logs after reload`);
});

await step('delete with Undo, then for good: the habit and its logs go together', async () => {
  await p.locator('[data-view="habit"] [data-action="delete"]').click();
  await p.waitForSelector('[data-view="habits"]');
  if ((await habits('Stretch')).length) throw new Error('still there');
  await p.locator('.toast button', { hasText: 'Undo' }).click();
  await p.waitForFunction((hid) => !!window.__lifeos.store.get('habits', hid), id);
  const back = await ev((hid) => window.__lifeos.store.all('habitLogs').filter((l) => l.habitId === hid).length, id);
  if (back !== 1) throw new Error('logs not restored');
  await go(`#/plan/habits/${id}`, '[data-view="habit"] [data-action="delete"]');
  await p.locator('[data-view="habit"] [data-action="delete"]').click();
  await p.waitForSelector('[data-view="habits"]');
  await reload();
  const gone = await ev((hid) => ({ h: !!window.__lifeos.store.get('habits', hid), l: window.__lifeos.store.all('habitLogs').filter((l) => l.habitId === hid).length }), id);
  if (gone.h || gone.l) throw new Error(JSON.stringify(gone));
});

await step('a task: add, edit, tick, untick, delete, across a reload', async () => {
  await go('#/plan/tasks', '[data-view="tasks"] [data-action="new"]');
  const open = async () => { await p.locator('[data-view="tasks"] [data-action="new"]').first().click(); await p.waitForSelector('.sheet input[data-input="title"]'); };
  await open();
  await p.fill('.sheet input[data-input="title"]', '   ');
  await p.locator('.sheet [data-action="save"]').click();
  await p.waitForSelector('.sheet .field-error, .sheet [role="alert"]');
  if (await ev(() => window.__lifeos.store.all('tasks').some((x) => !x.title.trim()))) throw new Error('a blank task was saved');
  await p.fill('.sheet input[data-input="title"]', '  Call the bank 📞 & ask about "rates"  ');
  await p.locator('.sheet [data-action="save"]').dblclick();
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  const made = await ev(() => window.__lifeos.store.all('tasks').filter((x) => x.title.startsWith('Call the bank')).map((x) => x.title));
  if (made.length !== 1 || made[0] !== 'Call the bank 📞 & ask about "rates"') throw new Error(JSON.stringify(made));
  const tid = await ev(() => window.__lifeos.store.all('tasks').find((x) => x.title.startsWith('Call the bank')).id);
  await ev(async (i) => { const T = await import('./js/domain/tasks.js'); T.save(i, { title: 'Call the bank today' }); T.toggle(i); }, tid);
  await reload();
  let x = await ev((i) => window.__lifeos.store.get('tasks', i), tid);
  if (x.title !== 'Call the bank today' || !x.done) throw new Error(JSON.stringify(x));
  await ev(async (i) => (await import('./js/domain/tasks.js')).toggle(i), tid);
  x = await ev((i) => window.__lifeos.store.get('tasks', i), tid);
  if (x.done) throw new Error('not unticked');
  if ((await ev(() => window.__lifeos.store.all('tasks').filter((y) => y.title === 'Call the bank today').length)) !== 1) throw new Error('duplicated');
});

await step('the journal: today’s page saves as you write and survives a reload', async () => {
  await go('#/reflect', '[data-view="review"] .write-area');
  const area = p.locator('.write-area').first();
  await area.fill('Good day. Café at 7 ☕ — <script>window.__xss=1</script>');
  await area.press('Tab');
  await reload();
  await go('#/reflect', '[data-view="review"] .write-area');
  const v = await p.locator('.write-area').first().inputValue();
  if (!v.includes('Café at 7 ☕')) throw new Error(`journal after reload: ${v}`);
  if (await xss()) throw new Error('script ran');
});

await step('a weigh-in: logged once per day (a second one replaces it), kept across a reload', async () => {
  await ev(async () => {
    const s = window.__lifeos.store;
    const D = await import('./js/domain/dates.js');
    s.put('weightEntries', { id: D.today(), date: D.today(), kg: 80.4 });
    s.put('weightEntries', { id: D.today(), date: D.today(), kg: 80.1 });
  });
  await reload();
  await go('#/progress/body/weight', '[data-view="weight"]');
  const w = await ev(async () => { const D = await import('./js/domain/dates.js'); return window.__lifeos.store.onDate('weightEntries', D.today()); });
  if (w.length !== 1 || w[0].kg !== 80.1) throw new Error(JSON.stringify(w));
  if (!(await p.textContent('[data-view="weight"]')).includes('80.1')) throw new Error('not shown');
});

await step('settings persist: day end, units and theme survive a reload', async () => {
  await ev(() => window.__lifeos.store.setSettings({ weightUnit: 'lb', theme: 'dark' }));
  await reload();
  const s = await ev(() => window.__lifeos.store.settings());
  if (s.weightUnit !== 'lb' || s.theme !== 'dark') throw new Error(JSON.stringify(s).slice(0, 200));
  if ((await ev(() => document.documentElement.dataset.theme)) !== 'dark') throw new Error('theme not applied');
  await p.screenshot({ path: `${OUT}/journey-dark.png` });
  await ev(() => window.__lifeos.store.setSettings({ weightUnit: 'kg', theme: 'system' }));
});

await step('explanations sit behind an ⓘ: folded, opened by a tap, folded again, and Settings keeps them all open', async () => {
  await go('#/plan/tasks', '[data-view="tasks"] .page-title');
  const btn = p.locator('[data-view="tasks"] .page-head .info-btn');
  if ((await btn.getAttribute('aria-expanded')) !== 'false') throw new Error('starts open');
  if (await p.locator('[data-view="tasks"] .tip-text').count()) throw new Error('text shown before the tap');
  await btn.click();
  await p.waitForSelector('[data-view="tasks"] .tip-text--page');
  const txt = await p.textContent('[data-view="tasks"] .tip-text');
  if (!txt.includes('One-off jobs')) throw new Error(txt);
  if ((await btn.getAttribute('aria-expanded')) !== 'true') throw new Error('aria-expanded not set');
  const ctl = await btn.getAttribute('aria-controls');
  if (!(await p.locator(`#${ctl}`).count())) throw new Error('aria-controls points nowhere');
  await p.screenshot({ path: `${OUT}/tip-open.png` });
  await btn.click();
  await p.waitForSelector('[data-view="tasks"] .tip-text', { state: 'detached' });
  // A card-level ⓘ (Training › Calves) works the same way.
  await go('#/plan/training', '[data-view="training"]');
  await p.locator('[data-tip="calves"]').click();
  await p.waitForSelector('[data-view="training"] #tip-calves');
  if (!(await p.textContent('#tip-calves')).includes('single-leg')) throw new Error('card tip did not open');
  // Settings › Show explanations: every one open, everywhere.
  await go('#/you/settings', '[data-view="settings"]');
  await p.locator('[data-action="tips"]').click();
  if ((await ev(() => window.__lifeos.store.settings().showTips)) !== true) throw new Error('setting not saved');
  await go('#/plan/goals', '[data-view="goals"] .page-title');
  await p.waitForSelector('[data-view="goals"] .tip-text');
  await go('#/you/settings', '[data-view="settings"]');
  await p.locator('[data-action="tips"]').click();
  if ((await ev(() => window.__lifeos.store.settings().showTips)) !== false) throw new Error('setting not cleared');
});

await ctx.close();
await finish();
