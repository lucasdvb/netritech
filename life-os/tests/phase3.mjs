// Body, training, nutrition, measurements and photos.
import { setup } from './helpers.mjs';
const t = await setup({ base: process.argv[2], out: process.argv[3] });
const { page, step, shot, go, a11y, finish } = t;

await step('weight: seed history and log today', async () => {
  await go('#/body', '[data-view="body"]');
  await page.evaluate(() => {
    const { store } = window.__lifeos;
    const d = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
    for (let i = 20; i >= 1; i--) store.put('weightEntries', { id: d(i), date: d(i), kg: +(76.4 - i * -0.04 - (20 - i) * 0.07).toFixed(1) });
  });
  await page.locator('[data-action="log-weight"]').first().click();
  await page.fill('.sheet input[name="w"]', '75.1');
  await page.locator('.sheet button[type="submit"]').click();
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  await shot('30-body');
  await go('#/body/weight', '[data-view="weight"] .chart');
  await shot('31-weight');
  const avg = await page.textContent('.metric-top .big-num');
  if (!/7\d\.\d/.test(avg)) throw new Error('7-day avg missing: ' + avg);
  await a11y('weight');
});

await step('nutrition: quick foods + whey', async () => {
  await go('#/body/nutrition', '[data-view="nutrition"]');
  await page.locator('[data-action="whey"]').click();
  await page.locator('[data-action="food"]').first().click();
  await page.locator('.sheet [data-action="quick"][data-id="f-chicken"]').click();
  await page.locator('.sheet [data-sheet-close]').first().click();
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  const txt = await page.textContent('.block .block-meta');
  if (!txt.includes('71.5 g')) throw new Error('protein total wrong: ' + txt);
  await shot('32-nutrition');
});

await step('training: start, log, finish', async () => {
  await go('#/body/training', '[data-view="training"]');
  await shot('33-training');
  await page.locator('[data-action="choose"]').first().click();
  await page.locator('.sheet [data-action="start"][data-id="t-lower"]').click();
  await page.waitForSelector('[data-view="workout"] .ex-card');
  const checks = page.locator('.wset-row .check');
  const n = await checks.count();
  for (let i = 0; i < n; i++) await checks.nth(i).click();
  await page.fill('.ex-card >> nth=0 >> .wset-row:not(.wset-row--head) >> nth=0 >> input[data-f="reps"]', '12');
  await page.keyboard.press('Tab');
  await shot('34-workout');
  await page.locator('[data-action="finish"]').click();
  await page.locator('.sheet [data-action="diff"][data-value="4"]').click();
  await page.locator('.sheet [data-action="done"]').click();
  await page.waitForSelector('.sheet-wrap', { state: 'detached' });
  await page.waitForSelector('.wo-actions [data-action="finish-edit"]');
  const facts = await page.evaluate(async () => (await import('./js/domain/fitness.js')).workoutFacts(new Date().toISOString().slice(0, 10)));
  if (!facts.strength || !facts.calves || !facts.core) throw new Error('facts ' + JSON.stringify(facts));
  await shot('35-workout-done');
  await a11y('workout');
});

await step('second session shows progression vs last time', async () => {
  const verdict = await page.evaluate(async () => {
    const F = await import('./js/domain/fitness.js');
    const { store } = window.__lifeos;
    const w = F.allWorkouts()[0];
    // Pretend the first session was a week ago, then log a better one today.
    const d = new Date(); d.setDate(d.getDate() - 7); const past = d.toISOString().slice(0, 10);
    store.put('workouts', { ...w, date: past });
    for (const s of F.setsOf(w.id)) store.put('workoutSets', { ...s, date: past });
    const { startWorkout } = await import('./js/screens/workout-actions.js');
    const nw = startWorkout('t-lower');
    for (const s of F.setsOf(nw.id)) store.put('workoutSets', { ...s, reps: (s.reps || 10) + 2, completed: s.order < 2 });
    store.put('workouts', { ...store.get('workouts', nw.id), status: 'done', endedAt: new Date().toISOString() });
    return F.workoutProgress(store.get('workouts', nw.id)).verdict;
  });
  if (verdict !== 'improved') throw new Error('verdict ' + verdict);
});

await step('exercise library + detail', async () => {
  await go('#/body/exercises', '[data-view="exercises"] .list');
  await page.locator('a[href="#/body/exercise/e-bss"]').click();
  await page.waitForSelector('[data-view="exercise"]');
  await shot('36-exercise');
});

await step('measurements', async () => {
  await go('#/body/measurements', '[data-view="measurements"]');
  await page.locator('[data-action="add"]').first().click();
  await page.fill('.sheet input[name="waist"]', '88.5');
  await page.fill('.sheet input[name="calves"]', '36.8');
  await page.fill('.sheet input[name="neck"]', '38');
  await page.locator('.sheet button[type="submit"]').click();
  await page.waitForSelector('.measure-grid');
  await shot('37-measurements');
});

await step('photos: upload two and compare', async () => {
  await go('#/body/photos', '[data-view="photos"]');
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAADCAYAAAC56t6BAAAAEklEQVR4nGNgYGD4z8DAwMDAAAAMAAGIOdSkAAAAAElFTkSuQmCC', 'base64');
  const input = page.locator('input[data-pose="front"]');
  await input.setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: png });
  await page.waitForSelector('.photo img[src]');
  await input.setInputFiles({ name: 'b.png', mimeType: 'image/png', buffer: png });
  await page.waitForSelector('.compare');
  await page.locator('.compare-range').fill('30');
  await shot('38-photos');
});

await step('sleep view after check-in', async () => {
  await page.evaluate(async () => (await import('./js/screens/sheets.js')).openCheckin());
  await page.locator('.sheet [data-action="save"]').click();
  await go('#/body/sleep', '[data-view="sleep"] .chart');
  await shot('39-sleep');
});

await finish();
