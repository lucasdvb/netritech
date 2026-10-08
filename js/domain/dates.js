// All dates are local calendar dates stored as 'YYYY-MM-DD'.
const pad = (n) => String(n).padStart(2, '0');

export const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s) => new Date(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10), 12);
// The day you're living doesn't end at midnight: until `dayEndsAt` (03:00 by default)
// it is still the previous day, so late-night logging lands where you expect.
let dayEnd = 180;
export const setDayEnd = (hm) => {
  const m = parseHM(hm);
  dayEnd = m == null ? 0 : Math.max(0, Math.min(m, 360));
};
export const dayEndMinutes = () => dayEnd;
/** The calendar day a moment belongs to. */
export const dayOf = (date = new Date()) => {
  const iso = toISO(date);
  return minutesOfDay(date) < dayEnd ? addDays(iso, -1) : iso;
};
export const today = () => dayOf(new Date());
/** The day a stored timestamp (createdAt, doneAt…) belongs to here: its UTC date can be a day out. */
export const dayAt = (stamp) => {
  if (!stamp) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(stamp)) return stamp;
  const t = new Date(stamp);
  return Number.isNaN(t.getTime()) ? null : dayOf(t);
};
export const addDays = (iso, n) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
export const diffDays = (a, b) => Math.round((fromISO(a) - fromISO(b)) / 86400000);
/** 1 = Monday … 7 = Sunday */
export const weekday = (iso) => ((fromISO(iso).getDay() + 6) % 7) + 1;
export const startOfWeek = (iso) => addDays(iso, 1 - weekday(iso));
export const endOfWeek = (iso) => addDays(startOfWeek(iso), 6);
export const monthKey = (iso) => iso.slice(0, 7);
export const startOfMonth = (iso) => `${iso.slice(0, 7)}-01`;
export const endOfMonth = (iso) => {
  const d = fromISO(startOfMonth(iso));
  d.setMonth(d.getMonth() + 1, 0);
  return toISO(d);
};
export const addMonths = (iso, n) => {
  const d = fromISO(startOfMonth(iso));
  d.setMonth(d.getMonth() + n);
  return toISO(d);
};
export const range = (from, to) => {
  const out = [];
  if (from > to) return out;
  const d = fromISO(from);
  for (let iso = from; iso <= to; d.setDate(d.getDate() + 1), iso = toISO(d)) out.push(iso);
  return out;
};
export const lastNDays = (end, n) => range(addDays(end, -(n - 1)), end);

export const minutesOfDay = (date = new Date()) => date.getHours() * 60 + date.getMinutes();
export const parseHM = (hm) => {
  if (!hm) return null;
  const [h, m] = hm.split(':').map(Number);
  return h * 60 + (m || 0);
};
export const fmtHM = (mins) => `${pad(Math.floor(((mins % 1440) + 1440) % 1440 / 60))}:${pad(((mins % 60) + 60) % 60)}`;

const LOCALE = undefined;
const cache = new Map();
const fmt = (opts) => {
  const k = JSON.stringify(opts);
  if (!cache.has(k)) cache.set(k, new Intl.DateTimeFormat(LOCALE, opts));
  return cache.get(k);
};

export const fmtLong = (iso) => fmt({ weekday: 'long', month: 'long', day: 'numeric' }).format(fromISO(iso));
// A date's label never changes, so each is formatted once (charts label hundreds of days).
const byDate = (opts) => {
  const seen = new Map();
  return (iso) => {
    let s = seen.get(iso);
    if (s === undefined) { s = fmt(opts).format(fromISO(iso)); if (seen.size > 4000) seen.clear(); seen.set(iso, s); }
    return s;
  };
};
export const fmtShortDate = byDate({ weekday: 'short', month: 'short', day: 'numeric' });
export const fmtDay = byDate({ weekday: 'long' });
export const fmtDayShort = byDate({ weekday: 'short' });
export const fmtDayLetter = byDate({ weekday: 'narrow' });
export const fmtMD = byDate({ month: 'short', day: 'numeric' });
export const fmtMDY = byDate({ month: 'short', day: 'numeric', year: 'numeric' });
export const fmtMonth = byDate({ month: 'long', year: 'numeric' });
export const fmtTime = (date = new Date()) => fmt({ hour: '2-digit', minute: '2-digit', hour12: false }).format(date);

export function relativeDay(iso, ref = today()) {
  const d = diffDays(iso, ref);
  if (d === 0) return 'Today';
  if (d === -1) return 'Yesterday';
  if (d === 1) return 'Tomorrow';
  if (d > -7 && d < 0) return fmtDay(iso);
  return fmtMD(iso);
}

export const durationHM = (minutes) => {
  if (minutes == null || !Number.isFinite(minutes)) return '—';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return h ? `${h}h ${pad(m)}m` : `${m}m`;
};
/** Order two ISO dates or times: their text order is their time order (and faster than localeCompare). */
export const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
