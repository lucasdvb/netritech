// Tasks, the preloaded setup, Your plan, and the seed migration.
import { readFileSync } from 'node:fs';
import { setup } from './helpers.mjs';
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { page, step, shot, go, a11y, finish } = t;

const ev = (fn, arg) => page.evaluate(fn, arg);
const taskBy = (title) => ev(async (s) => window.__lifeos.store.all('tasks').filter((x) => x.title === s), title);

await step('everything is preloaded on first launch', async () => {
  await go('#/today', '.today');
  const s = await ev(() => {
    const { store } = window.__lifeos;
    return { tasks: store.all('tasks').length, habits: store.all('habits').filter((h) => !h.archived).length, archived: store.all('habits').filter((h) => h.archived).map((h) => h.id),
      templates: store.all('templates').length, exercises: store.all('exercises').length, goals: store.all('goals').length, foods: store.all('foods').length,
      upper: store.get('templates', 't-upper').items.map((i) => i.exerciseId), reset: store.get('habits', 'h-morning-reset').checklist,
      mvd: store.all('habits').filter((h) => h.mvd && !h.archived).length };
  });
  const want = { tasks: 12, templates: 6, goals: 8, mvd: 8 }; // six workouts: Mobility & posture is one
  for (const [k, v] of Object.entries(want)) if (s[k] !== v) throw new Error(`${k}: ${s[k]} (want ${v})`);
  if (s.habits < 40 || s.exercises < 39 || s.foods < 17) throw new Error(JSON.stringify(s));
  if (!s.archived.includes('h-caffeine') || !s.archived.includes('h-alcohol')) throw new Error('optional habits missing');
  if (!s.upper.includes('e-calf-raise') || !s.upper.includes('e-plank')) throw new Error('upper finisher missing');
  if (!s.reset.some((x) => x.includes('weigh in'))) throw new Error('weigh-in missing');
  const card = await page.textContent('.prio');
  if (!card.includes('eye specialist') || !card.includes('orthodontic')) throw new Error('today card: ' + card);
  await shot('80-today-tasks');
  await a11y('today with tasks');
});

await step('quick add and tick a task on Today', async () => {
  await page.fill('.task-add-input', 'Call the accountant');
  await page.press('.task-add-input', 'Enter');
  await page.waitForSelector('.prio .trow:has-text("Call the accountant")');
  if (await page.inputValue('.task-add-input')) throw new Error('input not cleared');
  await page.locator('.prio .trow:has-text("Call the accountant") .check').click();
  await page.waitForSelector('.prio .trow.is-done:has-text("Call the accountant")');
  const [x] = await taskBy('Call the accountant');
  if (!x.done || !x.doneAt) throw new Error('not saved as done');
});

await step('overdue tasks surface on Today', async () => {
  await ev(async () => {
    const { addDays, today } = await import('./js/domain/dates.js');
    window.__lifeos.store.put('tasks', { id: 'late-1', title: 'Renew car insurance', area: 'life', date: addDays(today(), -2), done: false, repeat: null, order: 99 });
  });
  await page.waitForSelector('.prio .trow.is-late:has-text("Renew car insurance")');
  const meta = await page.textContent('.trow.is-late .trow-meta');
  if (!meta.includes('2 days ago')) throw new Error(meta);
});

await step('tasks screen groups and new repeating task', async () => {
  await go('#/plan/tasks', '[data-view="tasks"]');
  for (const g of ['Overdue', 'Today', 'Anytime']) if (!(await page.textContent('[data-view="tasks"]')).includes(g)) throw new Error('missing group ' + g);
  if (!(await page.textContent('[data-key="g-Anytime"]')).includes('caffeine')) throw new Error('anytime group');
  await shot('81-tasks');
  await page.locator('[data-action="new"]').first().click();
  await page.waitForSelector('.sheet .task-form');
  await page.fill('.sheet input[data-input="title"]', 'Pay the electricity bill');
  await page.locator('.sheet [data-action="when"]', { hasText: 'Tomorrow' }).click();
  await page.locator('.sheet [data-action="repeat"][data-value="monthly"]').click();
  await page.locator('.sheet [data-action="area"][data-id="life"]').click();
  await shot('82-task-sheet');
  await page.locator('.sheet [data-action="save"]').click();
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  const [x] = await taskBy('Pay the electricity bill');
  if (x?.repeat?.kind !== 'monthly' || !x.date) throw new Error(JSON.stringify(x));
});

await step('repeating chore: tick schedules the next, untick takes it back', async () => {
  const [l] = await taskBy('Laundry');
  const res = await ev(async (id) => {
    const T = await import('./js/domain/tasks.js');
    T.toggle(id);
    const done = T.task(id);
    const next = T.task(done.nextId);
    const out = { done: done.done, nextDate: next?.date, nextDay: next ? new Date(`${next.date}T12:00`).getDay() : null, count: T.all().filter((x) => x.title === 'Laundry').length };
    T.toggle(id);
    out.after = T.all().filter((x) => x.title === 'Laundry').length;
    out.undone = !T.task(id).done;
    return out;
  }, l.id);
  if (!res.done || res.nextDay !== 6 || res.nextDate <= l.date || res.count !== 2) throw new Error(JSON.stringify(res));
  if (res.after !== 1 || !res.undone) throw new Error('undo left a copy: ' + JSON.stringify(res));
});

await step('edit, delete and undo', async () => {
  await go('#/plan/tasks', '[data-view="tasks"]');
  await page.locator('.trow-main:has-text("Book a dental")').click();
  await page.waitForSelector('.sheet .task-form');
  await page.fill('.sheet input[data-input="title"]', 'Book a dental / orthodontic assessment (jaw)');
  await page.locator('.sheet [data-action="save"]').click();
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  if (!(await taskBy('Book a dental / orthodontic assessment (jaw)')).length) throw new Error('rename failed');
  await page.locator('.trow-main:has-text("Renew car insurance")').click();
  await page.locator('.sheet [data-action="delete"]').click();
  await page.waitForSelector('.toast');
  if ((await taskBy('Renew car insurance')).length) throw new Error('not deleted');
  await page.locator('.toast button', { hasText: 'Undo' }).click();
  await page.waitForFunction(() => window.__lifeos.store.get('tasks', 'late-1'));
});

await step('shutdown moves unfinished tasks to tomorrow', async () => {
  await go('#/today', '.today');
  await ev(async () => {
    const S = await import('./js/screens/sheets.js');
    const { today } = await import('./js/domain/dates.js');
    S.openShutdown(today());
  });
  await page.waitForSelector('.sheet [data-action="move"][aria-checked="true"]');
  await shot('83-shutdown-move');
  await page.locator('.sheet [data-action="done"]').click();
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  const left = await ev(async () => {
    const T = await import('./js/domain/tasks.js');
    const { today, addDays } = await import('./js/domain/dates.js');
    return { overdueOrToday: T.open().filter((x) => x.date && x.date <= today()).length, tomorrow: T.onDay(addDays(today(), 1)).filter((x) => x.title.includes('eye specialist')).length };
  });
  if (left.overdueOrToday || !left.tomorrow) throw new Error(JSON.stringify(left));
});

await step('your plan page', async () => {
  await go('#/plan/playbook', '[data-view="playbook"]');
  const txt = await page.textContent('[data-view="playbook"]');
  for (const s of ['Your day', 'Your week', 'Routines', 'Training', 'Food', 'Rules', 'Upper body + posture', 'Laundry', 'Church', 'Deliberately not included', '150 g'])
    if (!txt.includes(s)) throw new Error('plan missing ' + s);
  const sat = await page.textContent('.plan-week li:nth-child(6)');
  if (!sat.includes('Cardio') || !sat.includes('Laundry')) throw new Error('saturday: ' + sat);
  const mvdItems = await page.locator('#plan-rules .plan-routine').first().locator('li').count();
  if (mvdItems !== 8) throw new Error('minimum day items ' + mvdItems);
  await shot('84-plan');
  await page.locator('[data-action="jump"][data-id="food"]').click();
  await page.waitForFunction(() => { const y = document.getElementById('plan-food').getBoundingClientRect().top; return y > -5 && y < 200; }, null, { timeout: 4000 });
  await a11y('plan');
});

await step('search finds tasks; csv and backup include them', async () => {
  await go('#/plan', '[data-view="plan"]');
  if (!(await page.textContent('[data-view="plan"]')).includes('Tasks')) throw new Error('plan has no tasks link');
  await page.locator('[data-view="plan"] [data-action="open-search"]').click();
  await page.fill('.sheet input[type="search"]', 'laundry');
  await page.waitForSelector('.sheet .section-label:has-text("Tasks")');
  await page.keyboard.press('Escape');
  await go('#/you/data', '[data-view="data"]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-action="csv"][data-k="tasks"]').click()]);
  const csv = readFileSync(await dl.path(), 'utf8').replace(/^\ufeff/, ''); // the byte-order mark is for spreadsheets
  if (!csv.startsWith('date,title,area,repeat,done') || !csv.includes('Laundry')) throw new Error(csv.slice(0, 80));
  const [b] = await Promise.all([page.waitForEvent('download'), page.locator('[data-action="backup"]').click()]);
  const json = JSON.parse(readFileSync(await b.path(), 'utf8'));
  if ((json.data.tasks || []).length < 12) throw new Error('backup tasks ' + json.data.tasks?.length);
});

await step('older install is brought up to date without overwriting edits', async () => {
  await ev(async () => {
    const { store } = window.__lifeos;
    store.put('templates', { ...store.get('templates', 't-upper'), name: 'My upper day' });
    store.batch([
      ...store.all('tasks').map((x) => ({ store: 'tasks', delete: x.id })),
      { store: 'habits', delete: 'h-caffeine' }, { store: 'habits', delete: 'h-alcohol' },
      { store: 'meta', value: { ...store.get('meta', 'seed'), version: 1 } },
    ]);
    await store.flush();
  });
  await page.reload();
  await page.waitForFunction(() => window.__lifeos?.ready);
  const s = await ev(() => {
    const { store } = window.__lifeos;
    return { v: store.get('meta', 'seed').version, tasks: store.all('tasks').length, caf: !!store.get('habits', 'h-caffeine')?.archived, upper: store.get('templates', 't-upper').name };
  });
  if (s.v !== 2 || s.tasks !== 12 || !s.caf || s.upper !== 'My upper day') throw new Error(JSON.stringify(s));
});

await step('dark mode tasks + plan', async () => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await go('#/plan/tasks', '[data-view="tasks"]');
  await shot('85-tasks-dark');
  await go('#/plan/playbook', '[data-view="playbook"]');
  await shot('86-plan-dark');
  await page.emulateMedia({ colorScheme: 'light' });
});

await finish();
