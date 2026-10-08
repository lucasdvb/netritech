// The app-icon badge (U6): how much of today's plan is still open, kept up to date as you log.
// Where the platform supports badges (iPhone needs notifications allowed); otherwise nothing.
import * as store from '../data/store.js';
import { dayScore } from '../domain/scoring.js';
import { isOff } from '../domain/habits.js';
import { today } from '../domain/dates.js';

export const supported = () => typeof navigator !== 'undefined' && 'setAppBadge' in navigator;
export const enabled = () => store.settings()?.badge !== false;

/** What's left of today's plan (nothing on a day off). */
export function openCount(date = today()) {
  const s = dayScore(date);
  return isOff(s.mode) ? 0 : Math.max(0, s.total - s.done);
}

let last = null;
export async function update() {
  if (!supported()) return;
  const n = enabled() ? openCount() : 0;
  if (n === last) return;
  last = n;
  try { n ? await navigator.setAppBadge(n) : await navigator.clearAppBadge(); } catch { /* not allowed yet: stays as it was */ }
}

let timer = 0;
export function start() {
  if (!supported()) return;
  const soon = () => { clearTimeout(timer); timer = setTimeout(update, 800); };
  store.subscribe(soon);
  document.addEventListener('visibilitychange', () => { if (document.hidden) update(); });
  update();
}
