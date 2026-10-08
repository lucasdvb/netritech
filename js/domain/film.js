// The monthly recap film (G10) and the year (G6): what each one shows, worked out from your data.
// Cards are plain text; the ceremony draws them. Nothing here is invented: a card without data is
// left out.
import * as store from '../data/store.js';
import * as H from './habits.js';
import * as M from './metrics.js';
import * as F from './fitness.js';
import { dayScore } from './scoring.js';
import { setBetween } from './records.js';
import { today, startOfMonth, endOfMonth, addMonths, range, fmtMonth, monthKey, addDays } from './dates.js';
import { num, kgOut, weightUnit } from '../ui/format.js';

const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const monthName = (m) => fmtMonth(`${m}-01`).split(' ')[0];

/** Months that have anything logged, newest first (the current one included). */
export function filmMonths(limit = 12) {
  const first = H.trackingStart();
  const out = [];
  for (let m = monthKey(today()); m >= monthKey(first) && out.length < limit; m = monthKey(addMonths(`${m}-01`, -1))) {
    const days = range(`${m}-01`, endOfMonth(`${m}-01`) > today() ? today() : endOfMonth(`${m}-01`));
    if (days.some((d) => dayScore(d).done > 0 || store.get('dailyReviews', d)?.sealedAt)) out.push(m);
  }
  return out;
}

/**
 * A month's film: { month, title, cards: [{ eyebrow, big?, accent?, mid?, small? }] }. The first
 * card names the month, the last looks ahead; between them only what the data supports.
 */
export function monthFilm(month) {
  const from = startOfMonth(`${month}-01`);
  const end = endOfMonth(from) > today() ? today() : endOfMonth(from);
  const days = end >= from ? range(from, end) : [];
  const live = monthKey(today()) === month;
  const cards = [{ eyebrow: live ? 'Your month so far' : 'Your month', big: monthName(month), line: true }];
  const sealed = days.filter((d) => store.get('dailyReviews', d)?.sealedAt).length;
  if (sealed) cards.push({ eyebrow: 'Days sealed', big: String(sealed), accent: ` of ${days.length}` });
  const scores = days.map((d) => dayScore(d)).filter((s) => s.ratio != null && !H.isOff(s.mode)).map((s) => s.ratio);
  if (scores.length >= 3) cards.push({ eyebrow: 'Your plan, done', big: `${Math.round(mean(scores) * 100)}%`, small: `over ${scores.length} days` });
  const best = H.activeHabits().filter((h) => !h.optional && h.weekly !== false).map((h) => ({ h, c: H.consistency(h, end, days.length || 1) }))
    .filter((x) => x.c.ratio != null && x.c.expected >= 8).sort((a, b) => b.c.ratio - a.c.ratio || b.c.done - a.c.done)[0];
  if (best && best.c.ratio >= 0.5) cards.push({ eyebrow: 'Your strongest habit', mid: best.h.name, small: `${best.c.done} of ${Math.round(best.c.expected)} days.` });
  const rec = setBetween(from, end).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  if (rec) cards.push({ eyebrow: 'A new record', mid: rec.label.replace(/: .*/, ''), accent: rec.text });
  const sessions = F.allWorkouts().filter((w) => w.date >= from && w.date <= end).length;
  if (sessions) cards.push({ eyebrow: 'Training', big: String(sessions), small: sessions === 1 ? 'session' : 'sessions' });
  const w0 = M.weightAvg(addDays(from, -1), 7) ?? M.weightAvg(from, 7);
  const w1 = M.weightAvg(end, 7);
  if (w0 != null && w1 != null && Math.abs(w1 - w0) >= 0.2) cards.push({ eyebrow: 'Weight, 7-day average', big: `${w1 < w0 ? '−' : '+'}${num(Math.abs(kgOut(w1 - w0)), 1)} ${weightUnit()}`, small: `${num(kgOut(w0), 1)} → ${num(kgOut(w1), 1)}` });
  const wins = days.map((d) => store.get('dailyReviews', d)?.win).filter((w) => (w || '').trim());
  if (wins.length) cards.push({ eyebrow: 'One of your wins', mid: `“${wins.sort((a, b) => b.length - a.length || (a < b ? -1 : 1))[0].trim()}”` });
  cards.push({ eyebrow: live ? 'Still going' : 'Next', mid: live ? 'The rest of the month is yours.' : `Onward to ${monthName(monthKey(addMonths(from, 1)))}.` });
  return { month, title: fmtMonth(from), cards };
}

/** The year as data for the artwork: one entry per day, and the totals. Same data, same picture. */
export function yearData(year = Number(today().slice(0, 4))) {
  const t = today();
  const start = H.trackingStart();
  const days = range(`${year}-01-01`, `${year}-12-31`).map((d) => {
    const s = d <= t && d >= start ? dayScore(d) : null;
    return { date: d, ratio: s && !H.isOff(s.mode) ? s.ratio : null, off: !!s && H.isOff(s.mode), sealed: !!store.get('dailyReviews', d)?.sealedAt, future: d > t };
  });
  return { year, days, logged: days.filter((d) => d.ratio > 0).length, sealed: days.filter((d) => d.sealed).length, name: store.profile()?.name || '' };
}
