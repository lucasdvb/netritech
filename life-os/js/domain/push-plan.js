// What this device's reminders are, for the sender on your server (13c): each one's time, days,
// words and link, and which are already done today so they aren't sent. The same reminders, at the
// same times, as Settings › Reminders, and the same rules: a habit that feels automatic, or one
// that's paused or waiting, isn't reminded. Exactly this is what leaves the device.
import * as store from '../data/store.js';
import * as H from './habits-more.js';
import * as F from './fitness-core.js';
import { LINKED } from './reminder-rules.js';
import * as P from './day-plans.js';
import { ritualDone, sealedAt } from './rituals.js';
import { today, addDays, parseHM, startOfWeek, weekday } from './dates.js';
import * as SU from './supplements.js';
import { remindersPaused } from './trips.js';

const DAYS_AHEAD = 14;

/** { items: [{ id, at, days?, dates?, title, body, url }], done: { date, ids } } */
export function pushPlan(base, date = today()) {
  const nt = store.settings()?.notifications || {};
  const link = (path) => `${base}#/${path}`;
  const items = [];
  const add = (on, id, at, title, body, path, when = {}) => {
    if (on && parseHM(at) != null) items.push({ id, at, ...when, title, body, url: link(path) });
  };
  if (!nt.enabled) return { items, done: { date, ids: [] } };

  // With your days on different plans, a reminder follows each day's time: one item per time, sent
  // on the dates it's at that time (ids stay plain: "morning", "morning:t0645").
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(date, i));
  const planned = (on, id, usual, timeOn, title, body, path) => {
    if (!on || parseHM(usual) == null) return;
    if (!P.inUse()) { add(true, id, usual, title, body, path); return; }
    const by = new Map();
    for (const d of days) { const t = timeOn(d); if (parseHM(t) != null) by.set(t, [...(by.get(t) || []), d]); }
    for (const [t, dates] of by) add(true, t === usual ? id : `${id}:t${t.replace(':', '')}`, t, title, body, path, { dates });
  };
  planned(nt.morning?.on, 'morning', nt.morning?.time, (d) => P.on(d).cat('morning', nt.morning.time), 'Morning check-in', 'One minute: sleep, how you feel, your three.', 'today');
  planned(nt.evening?.on, 'evening', nt.evening?.time, (d) => P.on(d).cat('evening', nt.evening.time), 'Close the day', 'What’s left, one win, tomorrow’s first task. Then seal the day.', 'today');
  add(nt.weeklyReview?.on, 'week', nt.weeklyReview?.time, 'Weekly review', 'About three minutes. One change for next week.', 'reflect/review/week', { days: [7] });
  if (nt.workout?.on) {
    // One a day it's planned, named after that day's session.
    for (let i = 0; i < 7; i++) {
      const d = addDays(date, i);
      const tpl = F.plannedTemplate(d);
      const o = P.on(d);
      if (tpl && o.train) add(true, `train-${d}`, o.cat('workout', nt.workout.time) || o.profile.trainTime, `Training at ${o.profile.trainTime || nt.workout.time}`, `${tpl.name}${H.habit(LINKED.workout)?.bundle ? ` · with ${H.habit(LINKED.workout).bundle}` : ''}`, 'today', { dates: [d] });
    }
  }
  if (nt.habits?.on) {
    const linked = new Set(Object.values(LINKED));
    for (const h of H.activeHabits()) {
      if (!h.reminder || linked.has(h.id) || H.feelsAutomatic(h) || ['paused', 'queue'].includes(H.stateOf(h, date))) continue;
      const s = h.schedule || {};
      const tiny = H.tinyOf(h);
      const body = `${h.description || (tiny?.label ? `Even just: ${tiny.label}` : 'Still open for today.')}${h.bundle ? ` With ${h.bundle}.` : ''}`;
      // Daily and weekday habits repeat by weekday; anything else is sent on the days it's due.
      const when = s.kind === 'daily' || !s.kind ? {} : s.kind === 'weekdays' ? { days: s.days }
        : { dates: Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(date, i)).filter((d) => H.dueOn(h, d)) };
      if (P.inUse()) {
        // Your days: on the dates it's due, at its time that day.
        planned(true, `habit:${h.id}`, h.reminder, (d) => (H.dueOn(h, d) ? P.on(d).reminder(h) : null), h.name, body, `plan/habits/${h.id}`);
        continue;
      }
      add(true, `habit:${h.id}`, h.reminder, h.name, body, `plan/habits/${h.id}`, when);
    }
  }

  // Supplements and medication: one a day per time you take something.
  if (nt.supplements?.on !== false) {
    const byTime = new Map();
    for (const x of SU.all()) for (const t of x.times) byTime.set(t, [...(byTime.get(t) || []), x]);
    for (const [t, list] of byTime) {
      const med = list.some((x) => x.kind === 'medication');
      add(true, `supp:t${t.replace(':', '')}`, t, med ? 'Medication' : 'Supplements', list.map((x) => `${x.name}${x.dose ? ` (${x.dose})` : ''}`).join(', ').slice(0, 150), 'progress/body/supplements');
      if (med) items[items.length - 1].medication = true;
    }
  }

  // A trip that pauses reminders: everything but medication is sent only on the other days.
  const paused = days.filter((d) => remindersPaused(d));
  if (paused.length) {
    for (const it of items) {
      if (it.medication) continue;
      const base = it.dates || days.filter((d) => !it.days || it.days.includes(weekday(d)));
      it.dates = base.filter((d) => !paused.includes(d));
      delete it.days;
    }
  }
  for (const it of items) delete it.medication;

  // Done today, so not sent: the rituals, the training, the week's review and each habit.
  const done = [];
  const ids = (k) => items.filter((it) => it.id === k || it.id.startsWith(`${k}:t`)).map((it) => it.id);
  const morning = H.habit(LINKED.morning);
  if (ritualDone(date, 'morning') || (morning && H.isDone(morning, date))) done.push(...ids('morning'));
  if (ritualDone(date, 'evening') || sealedAt(date)) done.push(...ids('evening'));
  if (store.get('weeklyReviews', startOfWeek(date))?.completedAt) done.push('week');
  for (const it of items) if (it.id.startsWith('supp:t') && SU.dueAt(`${it.id.slice(6, 8)}:${it.id.slice(8, 10)}`, date).length === 0) done.push(it.id);
  const training = H.habit(LINKED.workout);
  if (training && H.isDone(training, date)) done.push(`train-${date}`);
  for (const it of items) if (it.id.startsWith('habit:') && H.isDone(H.habit(it.id.slice(6).split(':')[0]), date)) done.push(it.id);
  return { items, done: { date, ids: done } };
}
