// Your own calendar inside Your day: read an .ics calendar (a subscription link from iCloud, Google
// or Outlook, or a file you export) and keep its events for the coming weeks as busy times. They
// show in Your day, they're left out of the free time a task can go into, and the morning briefing
// counts them. Events stay on this device (calendarEvents is never synced or backed up); each
// device reads the calendar itself.
//
// The reader covers what calendars actually send: folded lines, all-day and timed events, times in
// UTC, floating or in a named time zone, DURATION, RRULE (daily, weekly, monthly, yearly with
// INTERVAL, COUNT, UNTIL, BYDAY with ordinals like "first Monday", BYMONTHDAY and BYMONTH), EXDATE,
// moved and cancelled occurrences (RECURRENCE-ID), all stepped through in the event's own time zone.
import * as store from '../data/store.js';
import { today, addDays, toISO, fmtHM } from './dates.js';

const WINDOW_BACK = 1;
const WINDOW_AHEAD = 60;
const MAX_EVENTS = 3000;
const DAYS = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 };

/** Unfold and split into { name, params, value } lines. */
function lines(text) {
  const raw = String(text).replace(/\r\n?/g, '\n').replace(/\n[ \t]/g, '').split('\n');
  return raw.filter(Boolean).map((l) => {
    const i = l.search(/:(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const head = i < 0 ? l : l.slice(0, i);
    const value = i < 0 ? '' : l.slice(i + 1);
    const [name, ...ps] = head.split(';');
    const params = Object.fromEntries(ps.map((p) => { const [k, v = ''] = p.split('='); return [k.toUpperCase(), v.replace(/^"|"$/g, '')]; }));
    return { name: name.toUpperCase(), params, value };
  });
}

const unescape = (v) => v.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();

/** The wall time in a named zone → a Date (by asking Intl what that zone's offset is then). */
function zoned(y, mo, d, h, mi, tz) {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
    const offsetAt = (t) => {
      const p = Object.fromEntries(f.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
      return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - t;
    };
    let t = guess - offsetAt(guess);
    t = guess - offsetAt(t);
    return new Date(t);
  } catch {
    return new Date(y, mo - 1, d, h, mi);
  }
}

// Outlook names zones the Windows way; the common ones, as the IANA zones Intl knows.
const WINDOWS_TZ = {
  'GMT Standard Time': 'Europe/London', 'W. Europe Standard Time': 'Europe/Berlin', 'Romance Standard Time': 'Europe/Paris',
  'Central Europe Standard Time': 'Europe/Budapest', 'Central European Standard Time': 'Europe/Warsaw', 'E. Europe Standard Time': 'Europe/Bucharest',
  'GTB Standard Time': 'Europe/Athens', 'FLE Standard Time': 'Europe/Helsinki', 'Russian Standard Time': 'Europe/Moscow',
  'Eastern Standard Time': 'America/New_York', 'Central Standard Time': 'America/Chicago', 'Mountain Standard Time': 'America/Denver',
  'Pacific Standard Time': 'America/Los_Angeles', 'Atlantic Standard Time': 'America/Halifax', 'E. South America Standard Time': 'America/Sao_Paulo',
  'Arabian Standard Time': 'Asia/Dubai', 'Mauritius Standard Time': 'Indian/Mauritius', 'South Africa Standard Time': 'Africa/Johannesburg',
  'E. Africa Standard Time': 'Africa/Nairobi', 'Egypt Standard Time': 'Africa/Cairo', 'India Standard Time': 'Asia/Kolkata',
  'Singapore Standard Time': 'Asia/Singapore', 'China Standard Time': 'Asia/Shanghai', 'Tokyo Standard Time': 'Asia/Tokyo',
  'AUS Eastern Standard Time': 'Australia/Sydney', 'New Zealand Standard Time': 'Pacific/Auckland', UTC: 'UTC', 'Coordinated Universal Time': 'UTC',
};
/** A TZID as Intl knows it: IANA as is, Windows names mapped, prefixed paths ("/…/Europe/London") trimmed. */
function zoneOf(tzid) {
  const t = String(tzid || '').trim();
  if (!t) return null;
  if (WINDOWS_TZ[t]) return WINDOWS_TZ[t];
  const m = /([A-Za-z]+\/[A-Za-z_+-]+(?:\/[A-Za-z_+-]+)?)$/.exec(t);
  return m ? m[1] : t;
}

/** Wall-clock parts in a zone ('Z' for UTC, a zone name, or null for the device's own) → a Date. */
function toDate({ y, mo, d, h = 0, mi = 0 }, tz) {
  if (tz === 'Z') return new Date(Date.UTC(y, mo - 1, d, h, mi));
  if (tz) return zoned(y, mo, d, h, mi, tz);
  return new Date(y, mo - 1, d, h, mi);
}

/** A DTSTART-like value → { date: Date, allDay, wall: { y, mo, d, h, mi }, tz }. */
function when(value, params) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, , z] = m;
  if (h == null || params.VALUE === 'DATE') {
    const wall = { y: +y, mo: +mo, d: +d, h: 0, mi: 0 };
    return { date: toDate(wall, null), allDay: true, wall, tz: null };
  }
  const wall = { y: +y, mo: +mo, d: +d, h: +h, mi: +mi };
  const tz = z ? 'Z' : params.TZID ? zoneOf(params.TZID) : null;
  return { date: toDate(wall, tz), allDay: false, wall, tz };
}

function duration(v) {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(String(v).trim());
  if (!m) return null;
  const [, sign, w, d, h, mi, s] = m;
  const ms = ((+w || 0) * 7 * 86400 + (+d || 0) * 86400 + (+h || 0) * 3600 + (+mi || 0) * 60 + (+s || 0)) * 1000;
  return sign === '-' ? -ms : ms;
}

/**
 * The events in a calendar's text: [{ uid, title, start: Date, end: Date, allDay, wall, tz, rrule,
 * exdates, recurrenceId, cancelled }]. Alarms and other blocks inside an event are skipped, so their
 * SUMMARY or DURATION never overwrite the event's own. Cancelled moved occurrences are kept (they
 * cancel the occurrence they stand for); other cancelled or free ("transparent") events are left out.
 */
export function parse(text) {
  const out = [];
  let ev = null;
  let depth = 0;
  for (const l of lines(text)) {
    if (l.name === 'BEGIN' && l.value === 'VEVENT' && !ev) { ev = { exdates: [] }; depth = 0; continue; }
    if (!ev) continue;
    if (l.name === 'BEGIN') { depth++; continue; }
    if (l.name === 'END' && depth > 0) { depth--; continue; }
    if (l.name === 'END' && l.value === 'VEVENT') {
      const off = ev.status === 'CANCELLED' || ev.transp === 'TRANSPARENT';
      if (ev.start && (!off || ev.recurrenceId != null)) {
        if (!ev.end) ev.end = new Date(ev.start.getTime() + (ev.dur ?? (ev.allDay ? 86400000 : 0)));
        if (off) ev.cancelled = true;
        out.push(ev);
      }
      ev = null;
      continue;
    }
    if (depth > 0) continue;
    if (l.name === 'UID') ev.uid = l.value.trim();
    else if (l.name === 'SUMMARY') ev.title = unescape(l.value).slice(0, 80);
    else if (l.name === 'DTSTART') { const w = when(l.value, l.params); if (w) { ev.start = w.date; ev.allDay = w.allDay; ev.wall = w.wall; ev.tz = w.tz; } }
    else if (l.name === 'DTEND') { const w = when(l.value, l.params); if (w) ev.end = w.date; }
    else if (l.name === 'DURATION') ev.dur = duration(l.value);
    else if (l.name === 'RRULE') ev.rrule = Object.fromEntries(l.value.split(';').map((p) => p.split('=')).map(([k, v]) => [k.toUpperCase(), v]));
    else if (l.name === 'EXDATE') for (const v of l.value.split(',')) { const w = when(v, l.params); if (w) ev.exdates.push(w.date.getTime()); }
    else if (l.name === 'RECURRENCE-ID') { const w = when(l.value, l.params); if (w) ev.recurrenceId = w.date.getTime(); }
    else if (l.name === 'STATUS') ev.status = l.value.trim().toUpperCase();
    else if (l.name === 'TRANSP') ev.transp = l.value.trim().toUpperCase();
  }
  return out;
}

/* Calendar days as plain numbers (days since 1970 in UTC), so stepping through dates never meets a
   clock change; each occurrence becomes a real time only at the end, in the event's own zone. */
const dayNum = (y, mo, d) => Math.floor(Date.UTC(y, mo - 1, d) / 86400000);
const civil = (n) => { const t = new Date(n * 86400000); return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const wdOf = (n) => ((new Date(n * 86400000).getUTCDay() + 6) % 7) + 1;
const monthLen = (y, mo) => new Date(Date.UTC(y, mo, 0)).getUTCDate();
const nums = (v) => (v ? String(v).split(',').map(Number).filter((x) => Number.isFinite(x) && x !== 0) : null);

/** The days of a month that a BYDAY / BYMONTHDAY rule picks ("1MO", "-1FR", "MO", 15, -1). */
function monthDays(y, mo, byday, bymonthday, fallbackDay) {
  const len = monthLen(y, mo);
  const first = dayNum(y, mo, 1);
  let days = [];
  if (bymonthday) days = bymonthday.map((x) => (x > 0 ? x : len + 1 + x)).filter((x) => x >= 1 && x <= len);
  else if (byday) {
    for (const { n, wd } of byday) {
      const all = [];
      for (let d = 1; d <= len; d++) if (wdOf(first + d - 1) === wd) all.push(d);
      if (!n) days.push(...all);
      else { const pick = n > 0 ? all[n - 1] : all[all.length + n]; if (pick) days.push(pick); }
    }
  } else if (fallbackDay <= len) days = [fallbackDay]; // the 31st in a short month is skipped, as calendars do
  if (bymonthday && byday) days = days.filter((d) => byday.some((b) => b.wd === wdOf(first + d - 1)));
  return [...new Set(days)].sort((a, b) => a - b).map((d) => first + d - 1);
}

/** The start times of an event's occurrences between two Dates. */
function occurrences(ev, from, to) {
  if (!ev.rrule) return ev.start < to && ev.end > from ? [ev.start] : [];
  const r = ev.rrule;
  const freq = r.FREQ;
  const every = Math.max(1, Number(r.INTERVAL) || 1);
  const count = Number(r.COUNT) || Infinity;
  // A date-only UNTIL includes that whole day.
  const u = r.UNTIL ? when(r.UNTIL, {}) : null;
  const until = u ? (u.allDay ? toDate({ ...u.wall, h: 23, mi: 59 }, ev.tz) : u.date) : null;
  const byday = r.BYDAY ? r.BYDAY.split(',').map((x) => ({ n: Number(x.slice(0, -2)) || 0, wd: DAYS[x.slice(-2).toUpperCase()] })).filter((x) => x.wd) : null;
  const bymonthday = nums(r.BYMONTHDAY);
  const bymonth = nums(r.BYMONTH);
  const w = ev.wall || { y: ev.start.getFullYear(), mo: ev.start.getMonth() + 1, d: ev.start.getDate(), h: ev.start.getHours(), mi: ev.start.getMinutes() };
  const start = dayNum(w.y, w.mo, w.d);
  const len = ev.end - ev.start;
  const at = (n) => toDate({ ...civil(n), h: w.h, mi: w.mi }, ev.allDay ? null : ev.tz);
  const out = [];
  let k = 0;
  // Each period's candidate days, in order: a day for DAILY, a week, a month or a year.
  const period = (i) => {
    if (freq === 'DAILY') {
      const n = start + i * every;
      if (byday && !byday.some((b) => b.wd === wdOf(n))) return [];
      if (bymonth && !bymonth.includes(civil(n).mo)) return [];
      if (bymonthday && !monthDays(civil(n).y, civil(n).mo, null, bymonthday).includes(n)) return [];
      return [n];
    }
    if (freq === 'WEEKLY') {
      const monday = start - (wdOf(start) - 1) + i * 7 * every;
      const wds = byday ? byday.map((b) => b.wd) : [wdOf(start)];
      return [...new Set(wds)].sort((a, b) => a - b).map((wd) => monday + wd - 1).filter((n) => !bymonth || bymonth.includes(civil(n).mo));
    }
    if (freq === 'MONTHLY') {
      const m0 = (w.y * 12 + (w.mo - 1)) + i * every;
      const y = Math.floor(m0 / 12);
      const mo = (m0 % 12) + 1;
      if (bymonth && !bymonth.includes(mo)) return [];
      return monthDays(y, mo, byday, bymonthday, w.d);
    }
    if (freq === 'YEARLY') {
      const y = w.y + i * every;
      return (bymonth || [w.mo]).flatMap((mo) => monthDays(y, mo, byday, bymonthday, byday || bymonthday ? null : w.d));
    }
    return null;
  };
  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(freq)) return ev.start < to && ev.end > from ? [ev.start] : [];
  // Without a COUNT nothing before the window matters: jump to a little before it.
  const fromDay = Math.floor(from.getTime() / 86400000) - 2;
  const per = { DAILY: every, WEEKLY: 7 * every, MONTHLY: 31 * every, YEARLY: 366 * every }[freq]; // never more periods than there are
  const first = count === Infinity ? Math.max(0, Math.floor((fromDay - start) / per) - 1) : 0;
  for (let i = first; i < first + 40000; i++) {
    const days = period(i);
    let past = false;
    for (const n of days) {
      if (n < start) continue;
      const t = at(n);
      if (until && t > until) { past = true; break; }
      if (++k > count) { past = true; break; }
      if (t >= to) { past = true; break; }
      if (t.getTime() + len > from.getTime() && !ev.exdates.includes(t.getTime())) out.push(t);
    }
    if (past || out.length > 400) break;
  }
  return out;
}

/** A calendar's text → the events to keep for one source: [{ id, date, start, end, allDay, title, source }]. */
export function expand(text, source, now = new Date()) {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - WINDOW_BACK);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + WINDOW_AHEAD);
  const events = parse(text);
  // A moved (or cancelled) occurrence replaces the one it stands for.
  const moved = new Map();
  for (const e of events) if (e.recurrenceId != null && e.uid) moved.set(`${e.uid}@${e.recurrenceId}`, e);
  const used = new Set();
  const out = [];
  for (const e of events) {
    if (e.recurrenceId != null) continue;
    const len = e.end - e.start;
    for (const t of occurrences(e, from, to)) {
      const key = `${e.uid}@${t.getTime()}`;
      const repl = moved.get(key);
      if (repl) used.add(key);
      if (repl?.cancelled) continue;
      const s = repl ? repl.start : t;
      const en = repl ? repl.end : new Date(t.getTime() + len);
      if (s < to && en > from) out.push(...rows(repl || e, s, en, source));
    }
  }
  // Moved ones whose original time is outside the window (or whose series isn't here) still count.
  for (const [key, e] of moved) if (!used.has(key) && !e.cancelled && e.start < to && e.end > from) out.push(...rows(e, e.start, e.end, source));
  const seen = new Set();
  return out.filter((r) => (seen.has(r.id) ? false : seen.add(r.id))).slice(0, MAX_EVENTS);
}

/** One row per day an event touches (an all-day event, or one that runs past midnight). */
function rows(e, s, en, source) {
  const out = [];
  const first = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  for (let day = first, i = 0; day < en && i < 31; i++) {
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    const date = toISO(day);
    const a = s > day ? s : day;
    const b = en < next ? en : next;
    const start = e.allDay ? null : fmtHM(a.getHours() * 60 + a.getMinutes());
    const end = e.allDay ? null : b >= next ? '24:00' : fmtHM(b.getHours() * 60 + b.getMinutes());
    if (e.allDay || start !== end) out.push({ id: `${source}:${(e.uid || e.title || 'event').slice(0, 80)}:${date}:${start || 'day'}`, date, start, end, allDay: !!e.allDay, title: e.title || 'Busy', source });
    day = next;
  }
  return out;
}

/* ---------- your calendars ---------- */

/** Your calendars: [{ id, name, url?, at, count, error? }] (kept in this device's settings). */
export const calendars = () => store.settings().calendars || [];

/** Replace one source's events. */
export function save(source, events) {
  const ops = store.all('calendarEvents').filter((e) => e.source === source).map((e) => ({ store: 'calendarEvents', delete: e.id }));
  for (const value of events) ops.push({ store: 'calendarEvents', value });
  if (ops.length) store.batch(ops);
}

/** Events on a date (busy times), timed ones in order, all-day ones first. */
export function on(date) {
  return store.onDate('calendarEvents', date).slice().sort((a, b) => Number(b.allDay) - Number(a.allDay) || String(a.start).localeCompare(String(b.start)));
}

/**
 * The timed events of your day: from three hours before you wake to the same time next morning, so
 * 00:30 tonight belongs to today (and comes last) while 00:30 this morning was last night's.
 */
export function dayEvents(date) {
  const p = store.profile() || {};
  const [h, m] = String(p.wakeTime || '06:00').split(':').map(Number);
  const cut = Math.max(0, h * 60 + (m || 0) - 180);
  const timed = (d) => on(d).filter((e) => !e.allDay);
  return [...timed(date).filter((e) => toMin(e.start) >= cut), ...timed(addDays(date, 1)).filter((e) => toMin(e.start) < cut)];
}

/** Busy intervals of your day in minutes: [[from, to]] (timed events only; after midnight they run past 1440). */
export function busy(date) {
  return dayEvents(date).map((e) => [toMin(e.start), e.end === '24:00' ? 1440 : toMin(e.end)]).filter(([a, b]) => b > a);
}
const toMin = (hm) => { const [h, m] = String(hm).split(':').map(Number); return h * 60 + (m || 0); };

/** Fetch a subscription: straight from the calendar, or through your own sync server when the calendar doesn't allow that. */
export async function fetchCalendar(url) {
  const u = String(url).trim().replace(/^webcal:/i, 'https:');
  if (!/^https:\/\//i.test(u)) throw new Error('A calendar link starts with https:// or webcal://');
  try {
    const res = await fetch(u, { cache: 'no-store' });
    if (res.ok) { const t = await res.text(); if (/BEGIN:VCALENDAR/.test(t)) return t; }
  } catch { /* most calendars don't allow a web page to read them directly: try the server */ }
  const { credentials } = await import('../sync/engine.js');
  const c = await credentials().catch(() => null);
  if (!c) throw new Error('This calendar can only be read through your own sync server. Turn on Sync (You › Sync), or import a calendar file instead.');
  const res = await fetch(`${String(c.url).replace(/\/+$/, '')}/calendar`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ space: c.space, auth: c.auth, url: u }) });
  const out = await res.json().catch(() => ({}));
  if (!res.ok || !out.ics) throw new Error(out.error || 'Couldn’t read that calendar.');
  return out.ics;
}

/** Add or refresh a calendar. { name, url } or { name, text } (a file). Returns its record. */
export async function addCalendar({ name, url, text }) {
  const list = calendars();
  const existing = url ? list.find((c) => c.url === url) : null;
  const id = existing?.id || `cal-${store.uid()}`;
  const body = text ?? await fetchCalendar(url);
  if (!/BEGIN:VCALENDAR/.test(body)) throw new Error('That isn’t a calendar file (.ics).');
  const events = expand(body, id);
  save(id, events);
  const rec = { id, name: String(name || existing?.name || 'Calendar').trim().slice(0, 40) || 'Calendar', ...(url ? { url } : {}), at: new Date().toISOString(), count: events.length, error: null };
  store.setSettings({ calendars: [...list.filter((c) => c.id !== id), rec] });
  return rec;
}

/** Refresh every subscribed calendar (on opening the app, at most every few hours). */
export async function refreshAll({ force = false, minHours = 3 } = {}) {
  const due = calendars().filter((c) => c.url && (force || !c.at || Date.now() - Date.parse(c.at) > minHours * 3600000));
  for (const c of due) {
    try { await addCalendar({ name: c.name, url: c.url }); }
    catch (err) { store.setSettings({ calendars: calendars().map((x) => (x.id === c.id ? { ...x, error: String(err.message || err).slice(0, 160), at: new Date().toISOString() } : x)) }); }
  }
  return due.length;
}

/** Remove a calendar and its events. */
export function removeCalendar(id) {
  save(id, []);
  store.setSettings({ calendars: calendars().filter((c) => c.id !== id) });
}

/** Events in the next days, for the morning briefing and Your day. */
export const ahead = (days = 1, from = today()) => Array.from({ length: days }, (_, i) => on(addDays(from, i))).flat();
