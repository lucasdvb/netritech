// What reminders have learned: which ones are no longer needed, and which are being ignored.
// Kept apart from delivery (reminders.js) so Today can show these notes without loading it.
import * as store from '../data/store.js';
import { habit, isDone, logId } from './habits.js';
import { today, dayAt, minutesOfDay, parseHM, lastNDays } from './dates.js';
import { LINKED } from './reminder-links.js';

export { LINKED };

export const logsFor = (key) => store.all('reminderLog').filter((r) => r.key === key).sort((a, b) => (a.at < b.at ? 1 : -1));

/** Done before the reminder time on most recent days → no longer needed. */
export function learned(habitId, time) {
  const h = habit(habitId);
  if (!h || !time) return false;
  const t = parseHM(time);
  const days = lastNDays(today(), 8).slice(0, 7);
  let early = 0;
  for (const d of days) {
    const l = store.get('habitLogs', logId(h.id, d));
    if (l && isDone(h, d) && dayAt(l.updatedAt) === d && minutesOfDay(new Date(l.updatedAt)) <= t) early++;
  }
  return early >= 5;
}

/** Ignored three times in a row (dismissed, or never acted on). */
// Changing a reminder's time or switching it back on gives it a fresh start.
export function ignoredStreak(key) {
  const since = store.settings()?.notifications?.[key]?.since || '';
  const recent = logsFor(key).filter((r) => r.outcome !== 'skipped' && r.at >= since).slice(0, 3);
  if (recent.length < 3) return false;
  return recent.every((r) => r.outcome === 'dismissed' || (r.outcome === 'shown' && r.habitId && !isDone(habit(r.habitId) || {}, r.date)));
}

/** Human notes for the settings screen. */
export function stats() {
  const s = store.settings();
  const nt = s?.notifications || {};
  const out = {};
  for (const [cat, hid] of Object.entries(LINKED)) {
    if (!nt[cat]?.on) continue;
    if (learned(hid, nt[cat].time)) out[cat] = { note: `Paused — you’ve been doing this before ${nt[cat].time} without a nudge.` };
    else if (ignoredStreak(cat)) out[cat] = { note: `Skipped 3 times in a row. Would a different time than ${nt[cat].time} suit you better?` };
  }
  return out;
}

/** Suggestions surfaced on Today when a reminder isn't working. */
export function suggestions() {
  const s = store.settings();
  if (!s?.notifications?.enabled) return [];
  const out = [];
  for (const cat of Object.keys(LINKED)) {
    if (s.notifications[cat]?.on && ignoredStreak(cat)) {
      out.push({ cat, time: s.notifications[cat].time, title: `The ${s.notifications[cat].time} ${cat === 'weeklyReview' ? 'review' : cat} reminder isn’t landing`,
        body: 'You’ve skipped it three times. Rather than nudging harder, try a time that fits your day better.' });
    }
  }
  return out;
}

