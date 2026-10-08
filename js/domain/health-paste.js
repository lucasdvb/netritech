// Apple Health without typing (U10). A web app can't read Health, so a Shortcut copies today's
// numbers to the clipboard and one tap pastes them here. This reads what the Shortcut writes and
// the obvious variations (labels in any order, units, a JSON object), and never guesses: a value it
// can't place is left out and shown as such.
import { addDays } from './dates.js';

const num = (s) => Number(String(s).replace(/,(?=\d{3}\b)/g, '').replace(',', '.'));

/** Hours from "7.5", "7h 30m", "7:30", "450 min", or seconds over 1000. */
function hours(v) {
  const s = String(v).trim().toLowerCase();
  let m;
  if ((m = s.match(/^(\d+(?:[.,]\d+)?)\s*h(?:ours?|rs?)?\s*(?:(\d+)\s*m(?:in(?:utes?)?)?)?$/))) return num(m[1]) + (m[2] ? Number(m[2]) / 60 : 0);
  if ((m = s.match(/^(\d{1,2}):(\d{2})$/))) return Number(m[1]) + Number(m[2]) / 60;
  if ((m = s.match(/^(\d+(?:[.,]\d+)?)\s*m(?:in(?:utes?)?)?$/))) return num(m[1]) / 60;
  const n = num(s);
  if (!Number.isFinite(n)) return null;
  return n > 1000 ? n / 3600 : n > 24 ? n / 60 : n;
}

/** Kilograms from "76.4", "76.4 kg", "168 lb". */
function kilos(v) {
  const s = String(v).trim().toLowerCase();
  const n = num(s.replace(/[^\d.,]/g, ''));
  if (!Number.isFinite(n)) return null;
  return /lb|pound/.test(s) ? n / 2.20462 : n;
}

const KEYS = [
  [/^(?:steps?|step count|stappen|pas)$/, 'steps'],
  [/^(?:sleep|sleep analysis|asleep|time asleep|slept)$/, 'sleep'],
  [/^(?:weight|body ?mass|weigh-?in)$/, 'weight'],
  [/^(?:date|day)$/, 'date'],
];

/**
 * { date, steps, sleepHours, weightKg, unknown: [lines] } from the clipboard text, or null when
 * nothing in it is Health data. `today` decides the date when the text has none.
 */
export function parseHealth(text, today) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  let pairs = [];
  if (raw.startsWith('{')) {
    try { pairs = Object.entries(JSON.parse(raw)).map(([k, v]) => [String(k), String(v)]); } catch { /* fall through to lines */ }
  }
  if (!pairs.length) {
    pairs = raw.split(/\r?\n|;/).map((l) => l.trim()).filter(Boolean).map((l) => {
      const m = l.match(/^([A-Za-z][A-Za-z -]*?)\s*[:=]\s*(.+)$/) || l.match(/^([A-Za-z][A-Za-z -]*?)\s+(\d.*)$/);
      return m ? [m[1], m[2]] : [l, null];
    });
  }
  const out = { date: today, steps: null, sleepHours: null, weightKg: null, unknown: [] };
  for (const [k, v] of pairs) {
    const key = KEYS.find(([re]) => re.test(k.trim().toLowerCase()))?.[1];
    if (!key || v == null) { if (!/^life ?os/i.test(k)) out.unknown.push(v == null ? k : `${k}: ${v}`); continue; }
    if (key === 'steps') { const n = Math.round(num(String(v).replace(/[^\d.,]/g, ''))); if (n >= 0 && n <= 100000) out.steps = n; }
    if (key === 'sleep') { const h = hours(v); if (h != null && h > 0 && h <= 16) out.sleepHours = Math.round(h * 100) / 100; }
    if (key === 'weight') { const kg = kilos(v); if (kg != null && kg >= 20 && kg <= 400) out.weightKg = Math.round(kg * 100) / 100; }
    if (key === 'date') {
      const s = String(v).trim().toLowerCase();
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) out.date = s.slice(0, 10);
      else if (s === 'yesterday') out.date = addDays(today, -1);
    }
  }
  if (out.date > today) out.date = today;
  return out.steps == null && out.sleepHours == null && out.weightKg == null ? null : out;
}

/** The text the Shortcut writes (also shown in the recipe, so you can see the shape). */
export const SAMPLE = 'Life OS\nsteps: 8432\nsleep: 7.4\nweight: 76.4';
