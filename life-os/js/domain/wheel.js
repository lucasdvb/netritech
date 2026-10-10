// The quarterly life wheel: once a quarter, rate eight areas of your life from 1 to 10. The radar
// shows the shape; the change since last quarter shows the direction; and the weakest area becomes
// the suggested focus of your next season, with the habits you already have in it. A short, regular
// whole-life check stops one area quietly sliding while others take all the attention, and turning
// the weakest score into one concrete focus is what makes the check useful (Locke & Latham 2002 on
// specific goals; the wheel of life as a coaching tool, Byrne 2005).
import * as store from '../data/store.js';
import { today, fromISO } from './dates.js';

export const AREAS = [
  { id: 'health', label: 'Health & body', cats: ['body', 'health', 'posture'] },
  { id: 'mind', label: 'Mind & growth', cats: ['mind'] },
  { id: 'spirit', label: 'Faith & meaning', cats: ['spirit'] },
  { id: 'relationships', label: 'Relationships', cats: ['relationships'] },
  { id: 'work', label: 'Work & career', cats: ['work'] },
  { id: 'money', label: 'Money', cats: [] },
  { id: 'fun', label: 'Fun & rest', cats: [] },
  { id: 'home', label: 'Home & life admin', cats: ['life'] },
];

/** "2026-Q4" for a date. */
export const quarterOf = (date = today()) => { const d = fromISO(date); return `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`; };
const prevQuarter = (q) => { const [y, n] = q.split('-Q').map(Number); return n === 1 ? `${y - 1}-Q4` : `${y}-Q${n - 1}`; };

export const all = () => store.all('wheelChecks').sort((a, b) => String(a.id).localeCompare(String(b.id)));
export const check = (q = quarterOf()) => store.get('wheelChecks', q) || null;
export const previous = (q = quarterOf()) => store.get('wheelChecks', prevQuarter(q)) || null;

/** Due: this quarter has no check yet (offered from its first day). */
export const due = (date = today()) => !check(quarterOf(date));

/** Rate one area (1–10) in this quarter's check. */
export function rate(area, score, date = today()) {
  const q = quarterOf(date);
  const cur = check(q) || { id: q, date, scores: {} };
  const v = Math.max(1, Math.min(10, Math.round(Number(score))));
  return store.put('wheelChecks', { ...cur, date: cur.date || date, scores: { ...cur.scores, [area]: v } });
}
export function note(text, date = today()) {
  const q = quarterOf(date);
  const cur = check(q) || { id: q, date, scores: {} };
  return store.put('wheelChecks', { ...cur, note: String(text || '').slice(0, 1000) });
}
export const complete = (c) => !!c && AREAS.every((a) => c.scores?.[a.id] != null);

/** The weakest area (lowest score; on a tie, the one that fell most since last quarter). */
export function weakest(q = quarterOf()) {
  const c = check(q);
  if (!complete(c)) return null;
  const p = previous(q);
  const rows = AREAS.map((a) => ({ ...a, score: c.scores[a.id], change: p?.scores?.[a.id] != null ? c.scores[a.id] - p.scores[a.id] : 0 }));
  return rows.sort((a, b) => a.score - b.score || a.change - b.change)[0];
}

/** Changes since last quarter: [{ area, from, to, change }] (only where both exist). */
export function changes(q = quarterOf()) {
  const c = check(q);
  const p = previous(q);
  if (!c || !p) return [];
  return AREAS.filter((a) => c.scores?.[a.id] != null && p.scores?.[a.id] != null)
    .map((a) => ({ area: a, from: p.scores[a.id], to: c.scores[a.id], change: c.scores[a.id] - p.scores[a.id] }));
}

/** A season built around the weakest area: { name, intention, habitIds } for the season wizard. */
export function seasonSuggestion(q = quarterOf()) {
  const w = weakest(q);
  if (!w) return null;
  const habits = store.all('habits').filter((h) => !h.archived && w.cats.includes(h.category)).slice(0, 3).map((h) => h.id);
  return { area: w, name: `${w.label.split(' ')[0]} season`, intention: `Lift ${w.label.toLowerCase()} from ${w.score} to ${Math.min(10, w.score + 2)}.`, habitIds: habits };
}

/** Points of the radar for scores (0–10) on a circle of radius r around (cx, cy). */
export function radar(scores, { r = 100, cx = 120, cy = 120 } = {}) {
  return AREAS.map((a, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / AREAS.length;
    const v = (scores?.[a.id] ?? 0) / 10;
    return { area: a, x: cx + Math.cos(ang) * r * v, y: cy + Math.sin(ang) * r * v, ax: cx + Math.cos(ang) * r, ay: cy + Math.sin(ang) * r, ang };
  });
}
