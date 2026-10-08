// What this device's reminders are, for the sender on your server (13c): each one's time, days,
// words and link, and which are already done today so they aren't sent. The same reminders, at the
// same times, as Settings › Reminders, and the same rules: a habit that feels automatic, or one
// that's paused or waiting, isn't reminded. Exactly this is what leaves the device.
import * as store from '../data/store.js';
import * as H from './habits-more.js';
import * as F from './fitness-core.js';
import { LINKED } from './reminder-rules.js';
import { ritualDone, sealedAt } from './rituals.js';
import { today, addDays, parseHM, startOfWeek } from './dates.js';

const DAYS_AHEAD = 14;

/** { items: [{ id, at, days?, dates?, title, body, url }], done: { date, ids } } */
export function pushPlan(base, date = today()) {
  const nt = store.settings()?.notifications || {};
  const p = store.profile() || {};
  const link = (path) => `${base}#/${path}`;
  const items = [];
  const add = (on, id, at, title, body, path, when = {}) => {
    if (on && parseHM(at) != null) items.push({ id, at, ...when, title, body, url: link(path) });
  };
  if (!nt.enabled) return { items, done: { date, ids: [] } };

  add(nt.morning?.on, 'morning', nt.morning?.time, 'Morning check-in', 'One minute: sleep, how you feel, your three.', 'today');
  add(nt.evening?.on, 'evening', nt.evening?.time, 'Close the day', 'What’s left, one win, tomorrow’s first task. Then seal the day.', 'today');
  add(nt.weeklyReview?.on, 'week', nt.weeklyReview?.time, 'Weekly review', 'About three minutes. One change for next week.', 'reflect/review/week', { days: [7] });
  if (nt.workout?.on) {
    // One a day it's planned, named after that day's session.
    for (let i = 0; i < 7; i++) {
      const d = addDays(date, i);
      const tpl = F.plannedTemplate(d);
      if (tpl) add(true, `train-${d}`, nt.workout.time || p.trainTime, `Training at ${p.trainTime || nt.workout.time}`, tpl.name, 'today', { dates: [d] });
    }
  }
  if (nt.habits?.on) {
    const linked = new Set(Object.values(LINKED));
    for (const h of H.activeHabits()) {
      if (!h.reminder || linked.has(h.id) || H.feelsAutomatic(h) || ['paused', 'queue'].includes(H.stateOf(h, date))) continue;
      const s = h.schedule || {};
      const tiny = H.tinyOf(h);
      const body = h.description || (tiny?.label ? `Even just: ${tiny.label}` : 'Still open for today.');
      // Daily and weekday habits repeat by weekday; anything else is sent on the days it's due.
      const when = s.kind === 'daily' || !s.kind ? {} : s.kind === 'weekdays' ? { days: s.days }
        : { dates: Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(date, i)).filter((d) => H.dueOn(h, d)) };
      add(true, `habit:${h.id}`, h.reminder, h.name, body, `plan/habits/${h.id}`, when);
    }
  }

  // Done today, so not sent: the rituals, the training, the week's review and each habit.
  const done = [];
  const morning = H.habit(LINKED.morning);
  if (ritualDone(date, 'morning') || (morning && H.isDone(morning, date))) done.push('morning');
  if (ritualDone(date, 'evening') || sealedAt(date)) done.push('evening');
  if (store.get('weeklyReviews', startOfWeek(date))?.completedAt) done.push('week');
  const training = H.habit(LINKED.workout);
  if (training && H.isDone(training, date)) done.push(`train-${date}`);
  for (const it of items) if (it.id.startsWith('habit:') && H.isDone(H.habit(it.id.slice(6)), date)) done.push(it.id);
  return { items, done: { date, ids: done } };
}
