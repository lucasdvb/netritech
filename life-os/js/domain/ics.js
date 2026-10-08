// Private reminders through your own calendar (U6). An iPhone web app can't schedule
// notifications without a push server (which would see your data), but your calendar can: this
// builds an iCalendar file (RFC 5545) of repeating events, each with an alert at its time and a
// link back into Life OS. Times are "floating" (no time zone), so they follow the phone's clock.
import * as store from '../data/store.js';
import * as H from './habits-more.js';
import * as F from './fitness.js';
import { today, addDays, weekday, parseHM, fmtHM } from './dates.js';

const BYDAY = ['', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const pad = (n) => String(n).padStart(2, '0');

/** TEXT values escape backslashes, semicolons, commas and newlines. */
export const escapeText = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Lines longer than 75 octets fold onto continuation lines that start with a space. */
export function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let cur = '', size = 0, limit = 75;
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length;
    if (size + n > limit) { out.push(cur); cur = ''; size = 0; limit = 74; }
    cur += ch; size += n;
  }
  out.push(cur);
  return out.join('\r\n ');
}

const stamp = (d = new Date()) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
const local = (iso, hm) => `${iso.replace(/-/g, '')}T${hm.replace(':', '')}00`;

/**
 * The calendar file for a list of events:
 * { uid, title, time: 'HH:MM', start: 'YYYY-MM-DD', rrule, minutes, note, url, alarm }, where
 * `alarm` is how many minutes before the start the alert comes (0, at the start, by default) and
 * an event without `rrule` happens once. A once-off event takes your time (it's busy); a repeating
 * reminder doesn't.
 */
export function buildCalendar(events, { name = 'Life OS', now = new Date() } = {}) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Life OS//Reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`];
  for (const e of events) {
    const desc = [e.note, e.url ? `Open Life OS: ${e.url}` : ''].filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${stamp(now)}`, `DTSTART:${local(e.start, e.time)}`, `DURATION:PT${e.minutes || 5}M`);
    if (e.rrule) lines.push(`RRULE:${e.rrule}`);
    lines.push(`SUMMARY:${escapeText(e.title)}`);
    if (desc) lines.push(`DESCRIPTION:${escapeText(desc)}`);
    if (e.url) lines.push(`URL:${e.url}`);
    const before = Math.max(0, Math.round(e.alarm || 0));
    lines.push(`TRANSP:${e.rrule ? 'TRANSPARENT' : 'OPAQUE'}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(e.title)}`, `TRIGGER:${before ? `-PT${before}M` : 'PT0S'}`, 'END:VALARM', 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

/** The first date on or after `from` that falls on one of the weekdays (1 = Monday). */
function firstOn(days, from) {
  for (let i = 0; i < 7; i++) { const d = addDays(from, i); if (days.includes(weekday(d))) return d; }
  return from;
}

const rruleFor = (h) => {
  const s = h.schedule || {};
  if (s.kind === 'weekdays' && s.days?.length) return { rrule: `FREQ=WEEKLY;BYDAY=${s.days.map((d) => BYDAY[d]).join(',')}`, days: s.days };
  if (s.kind === 'interval' && s.every > 1) return { rrule: `FREQ=DAILY;INTERVAL=${s.every}` };
  return { rrule: 'FREQ=DAILY' };
};

/**
 * Everything Life OS can remind you about, each { key, label, hint, event, on } where `on` is the
 * sensible default. `base` is the app's address, for links back in.
 */
export function reminderOptions(base, date = today()) {
  const p = store.profile() || {};
  const nt = store.settings()?.notifications || {};
  const link = (path) => `${base}#/${path}`;
  const at = (hm, fallback) => (parseHM(hm) != null ? hm : fallback);
  const out = [];
  const wake = parseHM(p.wakeTime || '06:00');
  out.push({ key: 'morning', label: 'Morning check-in', hint: `Daily at ${at(nt.morning?.time, fmtHM(wake + 15))}`, on: true,
    event: { uid: 'lifeos-morning@life-os', title: 'Morning check-in', time: at(nt.morning?.time, fmtHM(wake + 15)), start: date, rrule: 'FREQ=DAILY',
      note: 'One minute: sleep, how you feel, your three.', url: link('today') } });
  const plan = p.plan || {};
  for (let w = 1; w <= 7; w++) {
    const tpl = plan[w] ? F.template(plan[w]) : null;
    if (!tpl || !['strength', 'cardio'].includes(tpl.kind)) continue;
    const time = at(nt.workout?.time || p.trainTime, '07:00');
    out.push({ key: `train-${w}`, label: `Training: ${tpl.name}`, hint: `${['', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'][w]} at ${time}`, on: true,
      event: { uid: `lifeos-train-${w}@life-os`, title: tpl.name, time, start: firstOn([w], date), rrule: `FREQ=WEEKLY;BYDAY=${BYDAY[w]}`, minutes: tpl.minutes || 45,
        note: 'Gym mode keeps the screen on and times your rests.', url: link('today') } });
  }
  out.push({ key: 'evening', label: 'Close the day', hint: `Daily at ${at(nt.evening?.time, '21:00')}`, on: true,
    event: { uid: 'lifeos-evening@life-os', title: 'Close the day', time: at(nt.evening?.time, '21:00'), start: date, rrule: 'FREQ=DAILY',
      note: 'What’s left, one win, tomorrow’s first task. Then seal the day.', url: link('today') } });
  out.push({ key: 'week', label: 'Weekly review', hint: `Sundays at ${at(nt.weeklyReview?.time, '18:00')}`, on: true,
    event: { uid: 'lifeos-weekly-review@life-os', title: 'Weekly review', time: at(nt.weeklyReview?.time, '18:00'), start: firstOn([7], date), rrule: 'FREQ=WEEKLY;BYDAY=SU', minutes: 15,
      note: 'About three minutes: the week in a sentence, one change, next week’s three.', url: link('reflect/review/week') } });
  out.push({ key: 'month', label: 'Monthly review', hint: 'The last day of each month at 18:30', on: false,
    event: { uid: 'lifeos-monthly-review@life-os', title: 'Monthly review', time: '18:30', start: date, rrule: 'FREQ=MONTHLY;BYMONTHDAY=-1', minutes: 20,
      note: 'Stop, start, continue, and one focus for next month.', url: link('reflect/review/month') } });
  for (const h of H.activeHabits()) {
    if (!h.reminder || parseHM(h.reminder) == null || ['paused', 'queue'].includes(H.stateOf(h, date))) continue;
    const r = rruleFor(h);
    out.push({ key: `habit-${h.id}`, label: h.name, hint: `${H.scheduleLabel(h)} at ${h.reminder}`, on: true,
      event: { uid: `lifeos-habit-${h.id}@life-os`, title: h.name, time: h.reminder, start: r.days ? firstOn(r.days, date) : date, rrule: r.rrule,
        note: h.tiny?.label ? `Tiny version: ${h.tiny.label}` : h.description || '', url: link(`plan/habits/${h.id}`) } });
  }
  return out;
}
