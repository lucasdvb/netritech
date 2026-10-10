// The usage meter: which screens you open and which buttons you use, counted on this device only
// (never synced, never sent). It learns the quick row on Today (what you log at each hour), folds
// sections you don't use, and lists in Settings what you haven't touched in 30 days.
// Stored in localStorage, written a moment after the last change.
const KEY = 'lifeos.usage';
const DAY = 86400000;
let data = null;
let timer = null;

function load() {
  if (data) return data;
  try { data = JSON.parse(localStorage.getItem(KEY)) || null; } catch { data = null; }
  if (!data || data.v !== 1 || typeof data.k !== 'object') data = { v: 1, since: Date.now(), k: {} };
  return data;
}
function save() {
  clearTimeout(timer);
  timer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage full or blocked */ } }, 1500);
}

/** Count one use: "r:plan/goals" (a screen), "a:add-water" (an action), "b:pinned" (a Today section). */
export function track(key, at = new Date()) {
  if (!key) return;
  const d = load();
  const k = d.k[key] || (d.k[key] = { n: 0, last: 0, h: Array(24).fill(0) });
  k.n += 1;
  k.last = at.getTime();
  k.h[at.getHours()] += 1;
  save();
}

/** One key's counts: { n, last, h: uses per hour of the day }, or null. */
export const get = (key) => load().k[key] || null;
/** Since when the meter has been counting (ms). */
export const since = () => load().since;
/** Whole days the meter has been counting. */
export const days = (now = Date.now()) => Math.floor((now - since()) / DAY);
/** Used within the last n days. */
export const usedWithin = (key, n, now = Date.now()) => { const k = get(key); return !!k && now - k.last < n * DAY; };

/** How often a key is used around an hour (the hour itself counts double, its neighbours once). */
export function aroundHour(key, hour) {
  const k = get(key);
  if (!k) return 0;
  return 2 * k.h[hour] + k.h[(hour + 23) % 24] + k.h[(hour + 1) % 24];
}

/** All keys with a prefix, most used first: [{ key, n, last }]. */
export function list(prefix) {
  return Object.entries(load().k).filter(([key]) => key.startsWith(prefix))
    .map(([key, v]) => ({ key, n: v.n, last: v.last })).sort((a, b) => b.n - a.n);
}

/** Start again from nothing. */
export function reset() {
  data = { v: 1, since: Date.now(), k: {} };
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* storage full or blocked */ }
}
