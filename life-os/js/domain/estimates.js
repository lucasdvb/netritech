// Estimates that correct themselves: a task can carry how long you think it takes; the time you
// actually spend (focus blocks started for it, or what you note when you finish) is kept with it.
// Your own ratio of actual to estimated time, over your recent finished tasks, then adjusts every
// new estimate. People underestimate their own tasks even knowing past ones overran (the planning
// fallacy, Buehler, Griffin & Ross 1994); correcting with your own track record ("reference class"
// data, Kahneman & Tversky 1979; Flyvbjerg 2006) is what reliably fixes it.
import * as store from '../data/store.js';

const RECENT = 20;      // finished tasks the ratio is learned from
const MIN_TASKS = 3;    // before it's applied
const CLAMP = [0.5, 3];

/** Minutes, cleaned: a whole number from 1 to 16 hours, or null. */
export const cleanMinutes = (v) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) && n > 0 ? Math.min(960, n) : null;
};

/** Finished tasks with both an estimate and the time it took, newest first. */
function history() {
  return store.memo('estimates:history', ['tasks'], () => store.all('tasks')
    .filter((t) => t.done && cleanMinutes(t.estimate) && cleanMinutes(t.spent))
    .sort((a, b) => String(b.doneAt || '').localeCompare(String(a.doneAt || '')))
    .slice(0, RECENT));
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** How your estimates run: { ratio, n } (ratio 1.4 = tasks take 40% longer than you plan), or null with too few. */
export function calibration() {
  const h = history();
  if (h.length < MIN_TASKS) return null;
  const ratio = Math.min(CLAMP[1], Math.max(CLAMP[0], median(h.map((t) => t.spent / t.estimate))));
  return { ratio: Math.round(ratio * 100) / 100, n: h.length };
}

/** An estimate as it's likely to turn out (minutes), with your ratio applied. */
export function realistic(estimate, c = calibration()) {
  const e = cleanMinutes(estimate);
  if (!e) return null;
  if (!c) return e;
  // Rounded to 5 minutes: the precision an estimate has.
  return Math.max(5, Math.round((e * c.ratio) / 5) * 5);
}

/** The words for it: "Usually takes you about 35 min" or null when it matches the estimate. */
export function realisticLine(estimate, c = calibration()) {
  const e = cleanMinutes(estimate);
  const r = realistic(e, c);
  if (!e || !c || Math.abs(r - e) < 5) return null;
  return `Likely ${fmtMin(r)}: your tasks take ${c.ratio > 1 ? `${Math.round((c.ratio - 1) * 100)}% longer` : `${Math.round((1 - c.ratio) * 100)}% less`} than you estimate (last ${c.n}).`;
}

/** Minutes in words: 45 min, 1 h 30. */
export const fmtMin = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ''}`);

/** Add time spent on a task (from a focus block). */
export function addSpent(taskId, minutes) {
  const t = store.get('tasks', taskId);
  const m = cleanMinutes(minutes);
  if (!t || !m) return;
  store.update('tasks', taskId, { spent: (cleanMinutes(t.spent) || 0) + m });
}

/** The calibration in a sentence, for the Tasks screen. */
export function summaryLine(c = calibration()) {
  if (!c) return null;
  if (Math.abs(c.ratio - 1) < 0.1) return `Your estimates are spot on (last ${c.n} tasks).`;
  return `Your tasks take ${c.ratio > 1 ? `${Math.round((c.ratio - 1) * 100)}% longer` : `${Math.round((1 - c.ratio) * 100)}% less time`} than you estimate (last ${c.n}). New estimates are adjusted for it.`;
}
