// The 5-minute setup, the optional programmes and updating without losing data: a fresh install
// offers the setup; its answers build the days, a weekend plan, the training week, the habits in
// focus and the reminders, all linked, and one tap undoes it; a programme sets up its workouts and
// week and stopping puts your own back; You says how updates keep your data.
import { createRequire } from 'node:module';
import { setup } from './helpers.mjs';
const { devices } = createRequire(import.meta.url)('playwright');
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { step, finish, base, browser, errors } = t;
const OUT = process.argv[3] || './test-shots';

async function at(clock, { scheme = 'light', hash = '#/today', fresh = false, before } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 14'], colorScheme: scheme });
  const p = await ctx.newPage();
  p.setDefaultTimeout(8000);
  p.on('pageerror', (e) => errors.push(`${clock}: pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${clock}: console: ${m.text()}`); });
  await p.clock.setFixedTime(new Date(clock));
  await p.goto(base + '#/today');
  await p.waitForFunction(() => window.__lifeos?.ready, null, { timeout: 15000 });
  if (!fresh) await p.evaluate(() => window.__lifeos.store.setSettings({ welcomed: true, installDismissed: true }));
  if (before) await p.evaluate(before);
  if (hash !== '#/today') await go(p, hash);
  return { ctx, p };
}
async function go(p, hash, sel = '#main .view') {
  await p.evaluate((h) => { location.hash = h; }, hash);
  await p.waitForFunction((h) => location.hash === h, hash);
  await p.waitForSelector(sel);
}
const ev = (p, fn, arg) => p.evaluate(fn, arg);
const next = async (p, stepName) => {
  await p.locator('[data-action="su-next"]').click();
  await p.waitForSelector(`.guide[data-step="${stepName}"]`);
};

await step('a fresh install offers the setup on Today; Not now puts it away', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { fresh: true });
  await p.waitForSelector('[data-key="setup-card"]');
  await p.screenshot({ path: `${OUT}/setup-card.png` });
  await p.locator('[data-action="setup-later"]').click();
  await p.waitForSelector('[data-key="setup-card"]', { state: 'detached' });
  if (!(await ev(p, () => window.__lifeos.store.settings().welcomed))) throw new Error('not marked as welcomed');
  await ctx.close();
});

await step('the setup builds the days, a weekend plan, a programme, focus and reminders; undo puts it all back', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { fresh: true });
  const was = await ev(p, () => { const s = window.__lifeos.store; return { wake: s.profile().wakeTime, name: s.profile().name, plan: s.profile().plan, templates: s.all('templates').length, exercises: s.all('exercises').length }; });
  await p.locator('[data-key="setup-card"] [data-to="you/setup"]').click();
  await p.waitForSelector('.guide[data-step="start"]');
  await p.fill('input[data-f="name"]', 'Sam');
  await next(p, 'day');
  await p.fill('input[data-f="wake"]', '07:00');
  await p.fill('input[data-f="bed"]', '23:00');
  await p.fill('input[data-f="workStart"]', '09:00');
  await p.fill('input[data-f="workEnd"]', '17:00');
  await p.screenshot({ path: `${OUT}/setup-day.png` });
  await next(p, 'days');
  await p.locator('[data-action="su-set"][data-v="weekend"]').click();
  await p.fill('input[data-f="weekendWake"]', '08:30');
  await next(p, 'training');
  await p.locator('[data-action="su-set"][data-f="trainDays"][data-v="4"]').click();
  await p.locator('[data-action="su-set"][data-f="where"][data-v="gym"]').click();
  await p.locator('[data-action="su-set"][data-f="training"][data-v="programme"]').click();
  await p.waitForSelector('.setup-choice.is-on:has-text("Upper / lower")', { timeout: 3000 }).catch(() => { throw new Error('4 gym days doesn’t recommend upper / lower'); });
  await p.screenshot({ path: `${OUT}/setup-training.png` });
  await next(p, 'focus');
  await next(p, 'reminders');
  const rem = await p.locator('.set-row', { hasText: 'Morning check-in' }).locator('[role="switch"]');
  if ((await rem.getAttribute('aria-checked')) !== 'true') await rem.click();
  await next(p, 'review');
  const summary = await p.textContent('.setup-summary');
  for (const s of ['07:00', '23:00', 'Weekend plan', 'Upper / lower', 'morning check-in']) if (!summary.includes(s)) throw new Error(`summary lacks ${s}: ${summary}`);
  await p.locator('[data-action="su-build"]').click();
  await p.waitForSelector('[data-key="setup-done"]');
  await p.screenshot({ path: `${OUT}/setup-done.png` });
  const r = await ev(p, async () => {
    const s = window.__lifeos.store;
    const P = await import('./js/domain/day-plans.js');
    const pr = s.profile();
    const wk = P.plans().find((x) => x.name === 'Weekend');
    return { name: pr.name, wake: pr.wakeTime, bed: pr.bedTime, workStart: pr.workStart, workEnd: pr.workEnd, programme: pr.programme?.id, mon: pr.plan[1],
      sat: wk && P.planIdFor('2026-10-17') === wk.id, satWake: P.on('2026-10-17').profile.wakeTime, satWork: P.on('2026-10-17').work, monWork: P.on('2026-10-12').work,
      morning: s.settings().notifications.morning, done: s.settings().setupDone, welcomed: s.settings().welcomed };
  });
  const bad = [r.name !== 'Sam' && 'name', r.wake !== '07:00' && 'wake', r.bed !== '23:00' && 'bed', r.workStart !== '09:00' && 'workStart', r.workEnd !== '17:00' && 'workEnd',
    r.programme !== 'upper-lower-4' && 'programme', r.mon !== 't-pg-upper-lower-4-0' && 'monday', !r.sat && 'weekend plan', r.satWake !== '08:30' && 'weekend wake',
    r.satWork && 'weekend work', !r.monWork && 'monday work', !(r.morning.on && r.morning.time === '07:05') && 'morning reminder', !r.done && 'setupDone', !r.welcomed && 'welcomed'].filter(Boolean);
  if (bad.length) throw new Error(`${bad.join(', ')}: ${JSON.stringify(r)}`);
  // Today follows it.
  await go(p, '#/today', '.today');
  if (!(await p.textContent('.greet')).includes('Sam')) throw new Error('Today doesn’t greet the new name');
  if (await p.locator('[data-key="setup-card"]').count()) throw new Error('setup card still on Today');
  await ctx.close();
  // Undo, in its own session: build, then undo from the done screen.
  const { ctx: c2, p: q } = await at('2026-10-13T09:00:00', { fresh: true, hash: '#/you/setup' });
  await q.waitForSelector('.guide[data-step="start"]');
  const before = await ev(q, () => { const s = window.__lifeos.store; return { wake: s.profile().wakeTime, plan: JSON.stringify(s.profile().plan), templates: s.all('templates').length, exercises: s.all('exercises').length, plans: (s.profile().dayPlans || []).length }; });
  for (const st of ['day', 'days', 'training']) await next(q, st);
  await q.locator('[data-action="su-set"][data-f="trainDays"][data-v="3"]').click();
  await q.locator('[data-action="su-set"][data-f="where"][data-v="gym"]').click();
  await q.locator('[data-action="su-set"][data-f="training"][data-v="programme"]').click();
  await q.waitForSelector('.setup-choice.is-on:has-text("Full body")');
  await q.locator('[data-action="su-back"]').click();
  await q.waitForSelector('.guide[data-step="days"]');
  await q.locator('[data-action="su-set"][data-v="weekend"]').click();
  for (const st of ['training', 'focus', 'reminders', 'review']) await next(q, st);
  await q.locator('[data-action="su-build"]').click();
  await q.waitForSelector('[data-key="setup-done"]');
  const mid = await ev(q, () => window.__lifeos.store.profile().programme?.id);
  if (mid !== 'full-body-3') throw new Error(`3 gym days built ${mid}`);
  await q.locator('[data-action="su-undo"]').click();
  await q.waitForSelector('.guide[data-step="start"]');
  const after = await ev(q, () => { const s = window.__lifeos.store; return { wake: s.profile().wakeTime, plan: JSON.stringify(s.profile().plan), templates: s.all('templates').length, exercises: s.all('exercises').length, plans: (s.profile().dayPlans || []).length, done: s.settings().setupDone || null, programme: s.profile().programme || null }; });
  if (JSON.stringify({ ...after, done: undefined, programme: undefined }) !== JSON.stringify(before) || after.done || after.programme) throw new Error(`undo left changes: ${JSON.stringify({ before, after })}`);
  if (was.templates !== before.templates) throw new Error('fresh installs differ');
  await c2.close();
});

await step('a programme: follow sets up its workouts and week; stop puts your own week back; undo removes what it added', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { hash: '#/plan/training' });
  await p.waitForSelector('[data-key="programme-card"]');
  const own = await ev(p, () => JSON.stringify(window.__lifeos.store.profile().plan));
  await p.locator('[data-key="programme-card"]').click();
  await p.waitForSelector('.programme-list');
  await p.screenshot({ path: `${OUT}/programmes.png` });
  await p.locator('[data-action="pg-open"][data-id="full-body-3"]').click();
  await p.waitForSelector('.programme-detail');
  if (!(await p.textContent('.programme-detail')).includes('Back squat')) throw new Error('the workouts aren’t listed');
  await p.locator('.sheet [data-action="pg-follow"]').click();
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  const f = await ev(p, () => { const s = window.__lifeos.store; const pr = s.profile(); return { id: pr.programme?.id, plan: pr.plan, t: s.get('templates', 't-pg-full-body-3-0')?.items.length, squat: !!s.get('exercises', 'e-back-squat') }; });
  if (f.id !== 'full-body-3' || f.plan[1] !== 't-pg-full-body-3-0' || f.plan[3] !== 't-pg-full-body-3-1' || !f.t || !f.squat) throw new Error(JSON.stringify(f));
  // Recovery and cardio days you had stay.
  if (f.plan[6] !== 't-cardio') throw new Error(`Saturday cardio went: ${f.plan[6]}`);
  // Today's planned workout is the programme's (Tuesday: nothing; check Monday through the domain).
  const mon = await ev(p, async () => (await import('./js/domain/fitness-core.js')).plannedTemplate('2026-10-12')?.name);
  if (mon !== 'Full body A') throw new Error(`Monday plans ${mon}`);
  // Undo: back to your own week, and the squat it added goes (never trained with).
  await p.locator('.toast [data-action], .toast button', { hasText: 'Undo' }).first().click();
  await p.waitForFunction(() => !window.__lifeos.store.profile().programme);
  const u = await ev(p, () => { const s = window.__lifeos.store; return { plan: JSON.stringify(s.profile().plan), squat: !!s.get('exercises', 'e-back-squat'), t: !!s.get('templates', 't-pg-full-body-3-0') }; });
  if (u.plan !== own || u.squat || u.t) throw new Error(`undo left ${JSON.stringify(u)}`);
  // Follow again, then stop: your week comes back, the workouts stay in your library.
  await ev(p, async () => (await import('./js/domain/programmes.js')).follow('ppl-6', { short: true }));
  const short = await ev(p, () => window.__lifeos.store.profile().plan);
  if (short[1] !== 't-pg-ppl-6-0' || short[2] || short[5] !== 't-pg-ppl-6-2') throw new Error(`three-day PPL ${JSON.stringify(short)}`);
  await go(p, '#/plan/training/programmes', '.programme-list');
  await p.locator('[data-action="pg-open"][data-id="ppl-6"]').click();
  await p.locator('.sheet [data-action="pg-stop"]').click();
  await p.waitForSelector('.sheet-wrap', { state: 'detached' });
  const s = await ev(p, () => { const st = window.__lifeos.store; return { plan: JSON.stringify(st.profile().plan), kept: !!st.get('templates', 't-pg-ppl-6-0'), f: st.profile().programme }; });
  if (s.plan !== own || !s.kept || s.f) throw new Error(JSON.stringify(s));
  await ctx.close();
});

await step('You says how updates keep your data, with the address and a backup', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { hash: '#/you/settings' });
  await p.locator('[data-action="updating"]').click();
  await p.waitForSelector('.updating');
  const txt = await p.textContent('.updating');
  if (!txt.includes('localhost:4173') || !txt.includes('Back up now')) throw new Error(txt.slice(0, 200));
  await p.screenshot({ path: `${OUT}/updating.png` });
  await ctx.close();
});

await step('dark mode: a setup step and a programme', async () => {
  const { ctx, p } = await at('2026-10-13T09:00:00', { scheme: 'dark', hash: '#/you/setup' });
  await p.waitForSelector('.guide[data-step="start"]');
  for (const st of ['day', 'days', 'training']) await next(p, st);
  await p.locator('[data-action="su-set"][data-f="trainDays"][data-v="3"]').click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${OUT}/setup-dark.png` });
  await go(p, '#/plan/training/programmes', '.programme-list');
  await p.locator('[data-action="pg-open"][data-id="upper-lower-4"]').click();
  await p.waitForSelector('.programme-detail');
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${OUT}/programme-dark.png` });
  await ctx.close();
});

await finish();
