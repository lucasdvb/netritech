// Facts for weekly and monthly reviews, computed from the logs.
import * as store from '../data/store.js';
import * as M from './metrics.js';
import * as F from './fitness.js';
import { habit, isDone, started } from './habits.js';
import { dayScore, rolling } from './scoring.js';
import { range, today, addDays, endOfWeek, startOfMonth, endOfMonth } from './dates.js';

const avgOf = (vals) => { const v = vals.filter((x) => x != null && x > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
const daysDone = (id, days) => { const h = habit(id); return h ? days.filter((d) => started(h, d) && isDone(h, d)).length : 0; };
const sum = (storeName, days, f = (r) => r.minutes || 0) => { const set = new Set(days); return store.all(storeName).filter((r) => set.has(r.date)).reduce((a, r) => a + f(r), 0); };
const count = (storeName, days, pred = () => true) => { const set = new Set(days); return store.all(storeName).filter((r) => set.has(r.date) && pred(r)).length; };

export function periodFacts(from, to) {
  const end = to > today() ? today() : to;
  const days = end >= from ? range(from, end) : [];
  const t = M.targets();
  // Compare the 7-day average going into the period with the one at its end.
  // Without earlier weigh-ins, fall back to the first weigh-in inside the period.
  const wEnd = M.weightAvg(end, 7);
  const firstIn = days.map((d) => M.weight(d)).find((w) => w != null);
  const wStart = M.weightAvg(addDays(from, -1), 7) ?? (firstIn != null && days.filter((d) => M.weight(d) != null).length > 1 ? firstIn : null);
  const waists = store.all('measurements').filter((m) => m.waist && m.date <= end).sort((a, b) => (a.date < b.date ? -1 : 1));
  const waistIn = waists.filter((m) => m.date >= from);
  const waistBefore = waists.filter((m) => m.date < from).pop();
  const workouts = store.all('workouts').filter((w) => w.status === 'done' && w.date >= from && w.date <= end);
  const proteinDays = days.filter((d) => M.nutrition(d).protein > 0);
  const proteinHit = proteinDays.filter((d) => M.nutrition(d).protein >= t.proteinHitG).length;
  const scores = days.map((d) => dayScore(d).ratio).filter((r) => r != null);
  const reviews = days.map((d) => M.review(d)).filter(Boolean);
  const priSet = reviews.reduce((a, r) => a + (r.top3 || []).filter((p) => p.text).length, 0);
  const priDone = reviews.reduce((a, r) => a + (r.top3 || []).filter((p) => p.text && p.done).length, 0);
  const books = store.all('readingSessions').filter((r) => r.finished && r.date >= from && r.date <= end).map((r) => r.book).filter(Boolean);
  return {
    from, to: end, days: days.length,
    weight: { start: wStart, end: wEnd, change: wStart != null && wEnd != null ? wEnd - wStart : null },
    waist: { latest: waistIn[waistIn.length - 1]?.waist ?? null, change: waistIn.length && (waistBefore || waistIn.length > 1) ? waistIn[waistIn.length - 1].waist - (waistBefore || waistIn[0]).waist : null },
    training: { sessions: workouts.length, strength: workouts.filter((w) => w.kind === 'strength').length, improved: workouts.filter((w) => w.progression === 'improved').length },
    steps: avgOf(days.map((d) => M.steps(d))),
    protein: { avg: avgOf(days.map((d) => M.nutrition(d).protein)), hitDays: proteinHit, logged: proteinDays.length },
    kcal: avgOf(days.map((d) => M.nutrition(d).kcal)),
    sleep: { avg: avgOf(days.map((d) => M.sleepHours(d))), short: days.filter((d) => M.sleepHours(d) != null && M.sleepHours(d) < (t.sleepMinH ?? 7)).length },
    consistency: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    reading: sum('readingSessions', days), learning: sum('learningSessions', days), meditation: sum('meditationSessions', days), books,
    prayer: daysDone('h-prayer', days), scripture: daysDone('h-scripture', days), church: daysDone('h-church', days),
    fiancee: daysDone('h-fiancee', days), son: count('relationshipEntries', days, (r) => r.person === 'son') || daysDone('h-son', days),
    family: count('relationshipEntries', days, (r) => r.person === 'family') || daysDone('h-family', days),
    couple: count('relationshipEntries', days, (r) => r.person === 'date') || daysDone('h-date', days),
    priorities: { set: priSet, done: priDone }, deepWork: reviews.reduce((a, r) => a + (r.deepWork || 0), 0),
    wins: reviews.filter((r) => (r.win || '').trim()).map((r) => ({ date: r.date, text: r.win })),
  };
}

export const weekFacts = (weekStart) => periodFacts(weekStart, endOfWeek(weekStart));
export const monthFacts = (month) => periodFacts(startOfMonth(`${month}-01`), endOfMonth(`${month}-01`));
