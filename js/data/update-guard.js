// Your data through updates. An update replaces the app's code, never its data: the data lives in
// this address's database, and schema changes only ever add stores (with a safety copy before any
// data migration). This adds two more nets on top:
// - a weekly safety copy, so there is always a recent point to go back to (You › Data);
// - a check on the first open of each new version: if much of what was there before has gone, it
//   says so at once and points to the copy from before, instead of letting it pass unnoticed.
// The counts it compares are kept on this device (meta is never synced) and refreshed whenever the
// app goes to the background, so your own deletions don't look like a loss.
import * as store from './store.js';
import { BACKUP_STORES } from './schema.js';
import { safetyBackup, safetyBackups } from './migrations.js';

const ID = 'dataCheck';
const WEEK = 7 * 864e5;

/** Records per store, for everything a backup carries. */
export const counts = () => Object.fromEntries(BACKUP_STORES.filter((s) => s !== 'meta').map((s) => [s, store.count(s)]));

/** The version running now (the offline cache is named after it), or null without one. */
export async function currentVersion() {
  try { const k = (await caches.keys()).find((x) => x.startsWith('lifeos-')); return k ? k.slice('lifeos-'.length) : null; } catch { return null; }
}

/**
 * What looks lost between two counts: a store that had ten or more records and has none, or a
 * fifth or more of everything gone. [{ store, before, now }] ('all' for the total).
 */
export function missing(before = {}, now = counts()) {
  const out = [];
  let was = 0;
  let is = 0;
  for (const [s, n] of Object.entries(before)) {
    const m = now[s] ?? 0;
    was += n;
    is += m;
    if (n >= 10 && m === 0) out.push({ store: s, before: n, now: m });
  }
  if (!out.length && was >= 50 && is < was * 0.8) out.push({ store: 'all', before: was, now: is });
  return out;
}

/** Remember how much there is now (on leaving the app, and after each check). */
export function remember(version = store.get('meta', ID)?.version || null) {
  const prev = store.get('meta', ID);
  store.put('meta', { ...prev, id: ID, version, counts: counts(), at: new Date().toISOString() });
}

/**
 * Run once the whole history has loaded. `notify(lost)` is called when an update seems to have lost
 * data. Returns { version, lost, copied }.
 */
export async function check({ notify = () => {}, now = Date.now(), copy = true } = {}) {
  const version = await currentVersion();
  const prev = store.get('meta', ID);
  const lost = version && prev?.version && prev.version !== version ? missing(prev.counts) : [];
  if (lost.length) {
    // Keep what was counted before, and don't take a copy that would push a good one out.
    store.put('meta', { ...prev, id: ID, version, warned: version });
    notify(lost);
    return { version, lost, copied: false };
  }
  remember(version || prev?.version || null);
  const copied = copy ? await weekly(now) : false;
  return { version, lost, copied };
}

/** The weekly safety copy, when the newest copy is a week old. Returns whether it took one. */
export async function weekly(now = Date.now()) {
  const m = store.get('meta', ID);
  if (m?.warned && m.warned === m.version) return false;
  const copies = await safetyBackups().catch(() => []);
  const newest = copies[0] ? Date.parse(copies[0].id) : 0;
  if (!Object.values(counts()).some(Boolean) || now - newest <= WEEK) return false;
  await safetyBackup('Weekly copy');
  return true;
}

export function start({ notify } = {}) {
  // The check itself is light (counts); the copy writes everything, so it waits for a moment you
  // aren't using the app: when it goes to the background, or after five quiet minutes.
  check({ notify, copy: false }).catch((err) => console.warn(err));
  let copying = false;
  const copyNow = () => { if (copying) return; copying = true; weekly().catch((err) => console.warn(err)).finally(() => { copying = false; }); };
  setTimeout(() => (window.requestIdleCallback ? requestIdleCallback(copyNow, { timeout: 60000 }) : copyNow()), 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    // Not after a warning: the counts from before the update stay as they were until it's looked at.
    const m = store.get('meta', ID);
    if (m?.warned && m.warned === m.version) return;
    try { remember(); } catch { /* storage blocked */ }
    copyNow();
  });
}
