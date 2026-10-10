// What the first screen needs to know about Your days, kept tiny: whether any day differs from
// Every day, and the plan of a date. Until you make a second plan (or adjust a date) every answer is
// "as stored", and nothing more loads. Once you have, the full rules (day-plans.js) load and the
// screen draws again with them; they register themselves here when they arrive.
import * as store from '../data/store.js';
import { today } from './dates.js';

export const BASE = 'base';
const profile = () => store.profile() || {};

/** More than one plan, or any date adjusted: the days can differ. */
let seen = null;
let using = false;
export function inUse() {
  // Asked for every habit on every day a score looks at: worked out once per change of profile.
  const p = profile();
  if (p !== seen) { seen = p; using = (Array.isArray(p.dayPlans) && p.dayPlans.length > 0) || Object.keys(p.planDates || {}).length > 0; }
  return using;
}

/** A date on Every day: every time as stored. */
const asStored = () => ({
  plan: BASE, name: profile().basePlanName || 'Every day', base: true, profile: profile(), train: true, work: true,
  habitTime: (h) => h?.time || null,
  reminder: (h) => h?.reminder || null,
  window: (r) => r?.window || null,
  cat: (key, time) => time,
  out: () => false,
});

let full = null;
let loading = null;
const ready = [];
/** Run `fn` when the full rules have arrived (to draw the screen again). */
export const whenReady = (fn) => { ready.push(fn); };
/** The full rules call this when they load. */
export function register(mod) {
  if (full) return;
  full = mod;
  ready.forEach((fn) => fn());
}
function load() { loading ||= import('./day-plans.js').catch(() => { loading = null; }); }

/** The plan for a date (see day-plans.js `on`). */
export function on(date = today()) {
  if (!inUse()) return asStored();
  if (!full) { load(); return asStored(); }
  return full.on(date);
}

/** Whether a habit isn't expected on a date because that day's plan leaves it out. */
export const outOfPlan = (habitId, date) => inUse() && !!full && full.on(date).out(habitId);
