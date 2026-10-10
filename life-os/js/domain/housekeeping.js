// Small jobs that keep things current, run after the first screen and whenever the app comes back to
// the front: your own calendar refreshes (at most every three hours), and the tasks for bills coming
// due and supplements running low appear (each once). Nothing loads for a job with nothing to do.
import * as store from '../data/store.js';

let last = 0;
async function run() {
  if (Date.now() - last < 60_000) return;
  last = Date.now();
  const jobs = [];
  if ((store.settings().calendars || []).some((c) => c.url)) jobs.push(import('./ics-import.js').then((m) => m.refreshAll()));
  if (store.all('bills').length) jobs.push(import('./bills.js').then((m) => m.ensureTasks()));
  if (store.all('supplements').length) jobs.push(import('./supplements.js').then((m) => m.ensureTasks()));
  await Promise.allSettled(jobs);
}

export function start() {
  run().catch((err) => console.warn(err));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) run().catch((err) => console.warn(err)); });
}
