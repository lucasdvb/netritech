// Your own calendar inside Your day: read an .ics calendar (a subscription link from iCloud, Google
// or Outlook, or a file you export) and keep its events for the coming weeks as busy times. They
// show in Your day, they're left out of the free time a task can go into, and the morning briefing
// counts them. Events stay on this device (calendarEvents is never synced or backed up); each
// device reads the calendar itself.
//
// The reader covers what calendars actually send: folded lines, all-day and timed events, times in
// UTC, floating or in a named time zone, DURATION, RRULE (daily, weekly, monthly, yearly with
// INTERVAL, COUNT, UNTIL and BYDAY), EXDATE, and moved occurrences (RECURRENCE-ID).
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

/** A DTSTART-like value → { date: Date, allDay }. */
function when(value, params) {
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h, mi, , z] = m;
  if (h == null || params.VALUE === 'DATE') return { date: new Date(+y, +mo - 1, +d), allDay: true };
  if (z) return { date: new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi)), allDay: false };
  if (params.TZID) return { date: zoned(+y, +mo, +d, +h, +mi, params.TZID), allDay: false };
  return { date: new Date(+y, +mo - 1, +d, +h, +mi), allDay: false };
}

function duration(v) {
  const m = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(String(v).trim());
  if (!m) return null;
  const [, sign, w, d, h, mi, s] = m;
  const ms = ((+w || 0) * 7 * 86400 + (+d || 0) * 86400 + (+h || 0) * 3600 + (+mi || 0) * 60 + (+s || 0)) * 1000;
  return sign === '-' ? -ms : ms;
}

/** The events in a calendar's text: [{ uid, title, start: Date, end: Date, allDay, rrule, exdates, recurrenceId }]. */
export function parse(text) {
  const out = [];
  let ev = null;
  for (const l of lines(text)) {
    if (l.name === 'BEGIN' && l.value === 'VEVENT') { ev = { exdates: [] }; continue; }
    if (l.name === 'END' && l.value === 'VEVENT') {
      if (ev?.start && ev.status !== 'CANCELLED' && ev.transp !== 'TRANSPARENT') {
        if (!ev.end) ev.end = new Date(ev.start.getTime() + (ev.dur ?? (ev.allDay ? 86400000 : 0)));
        out.push(ev);
      }
      ev = null;
      continue;
    }
    if (!ev) continue;
    if (l.name === 'UID') ev.uid = l.value.trim();
    else if (l.name === 'SUMMARY') ev.title = unescape(l.value).slice(0, 80);
    else if (l.name === 'DTSTART') { const w = when(l.value, l.params); if (w) { ev.start = w.date; ev.allDay = w.allDay; } }
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

const isoWeekday = (dt) => ((dt.getDay() + 6) % 7) + 1;

/** The start times of an event's occurrences between two Dates. */
function occurrences(ev, from, to) {
  if (!ev.rrule) return ev.start < to && ev.end > from ? [ev.start] : [];
  const r = ev.rrule;
  const freq = r.FREQ;
  const every = Math.max(1, Number(r.INTERVAL) || 1);
  const count = Number(r.COUNT) || Infinity;
  const until = r.UNTIL ? when(r.UNTIL, {})?.date : null;
  const byday = r.BYDAY ? r.BYDAY.split(',').map((x) => DAYS[x.slice(-2)]).filter(Boolean) : null;
  const len = ev.end - ev.start;
  const out = [];
  let n = 0;
  const h = ev.start.getHours();
  const mi = ev.start.getMinutes();
  const at = (day) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, mi);
  const take = (t) => {
    if (t < ev.start) return true;
    if (until && t > until) return false;
    if (++n > count) return false;
    if (t.getTime() + len > from.getTime() && t < to && !ev.exdates.includes(t.getTime())) out.push(t);
    return t < to;
  };
  if (freq === 'DAILY' || (freq === 'WEEKLY')) {
    // Walk day by day from the first occurrence; weekly with BYDAY picks those weekdays in every n-th week.
    const startDay = new Date(ev.start.getFullYear(), ev.start.getMonth(), ev.start.getDate());
    const weekStart = new Date(startDay);
    weekStart.setDate(weekStart.getDate() - (isoWeekday(startDay) - 1));
    const days = byday || [isoWeekday(startDay)];
    // Without a COUNT nothing before the window matters: start a little before it.
    let skip = count === Infinity ? Math.max(0, Math.floor((from - startDay) / 86400000) - 8) : 0;
    if (freq === 'DAILY') skip -= skip % every;
    for (let i = skip; i < skip + 3700; i++) {
      const day = new Date(startDay);
      day.setDate(day.getDate() + i);
      if (freq === 'DAILY') {
        if (i % every) continue;
      } else {
        const weeks = Math.floor((day - weekStart) / (7 * 86400000) + 0.01);
        if (weeks % every || !days.includes(isoWeekday(day))) continue;
      }
      if (!take(at(day))) break;
      if (out.length > 400) break;
    }
  } else if (freq === 'MONTHLY' || freq === 'YEARLY') {
    for (let i = 0; i < 400; i++) {
      const t = new Date(ev.start);
      if (freq === 'MONTHLY') t.setMonth(t.getMonth() + i * every); else t.setFullYear(t.getFullYear() + i * every);
      if (t.getDate() !== ev.start.getDate()) continue; // the 31st in a short month: skipped, as calendars do
      if (!take(t)) break;
    }
  } else if (ev.start < to && ev.end > from) out.push(ev.start);
  return out;
}

/** A calendar's text → the events to keep for one source: [{ id, date, start, end, allDay, title, source }]. */
export function expand(text, source, now = new Date()) {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - WINDOW_BACK);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + WINDOW_AHEAD);
  const events = parse(text);
  // A moved occurrence replaces the one it moved from.
  const moved = new Map();
  for (const e of events) if (e.recurrenceId != null && e.uid) moved.set(`${e.uid}@${e.recurrenceId}`, e);
  const out = [];
  for (const e of events) {
    if (e.recurrenceId != null) continue;
    const len = e.end - e.start;
    for (const t of occurrences(e, from, to)) {
      const repl = moved.get(`${e.uid}@${t.getTime()}`);
      const s = repl ? repl.start : t;
      const en = repl ? repl.end : new Date(t.getTime() + len);
      out.push(...rows(repl || e, s, en, source));
    }
  }
  for (const e of moved.values()) if (!events.some((x) => x.uid === e.uid && x.recurrenceId == null)) out.push(...rows(e, e.start, e.end, source));
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

/** Busy intervals on a date in minutes: [[from, to]] (timed events only). */
export function busy(date) {
  return on(date).filter((e) => !e.allDay).map((e) => [toMin(e.start), e.end === '24:00' ? 1440 : toMin(e.end)]).filter(([a, b]) => b > a);
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
