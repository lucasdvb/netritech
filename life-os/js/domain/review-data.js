// Facts for weekly and monthly reviews, computed from the logs.
import * as store from '../data/store.js';
import { priorities } from './tasks.js';
import * as M from './metrics.js';
import * as F from './fitness.js';
import { habit, isDone, started, activeHabits, stateOf, consistency } from './habits.js';
import { dayScore } from './scoring.js';
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
  const pri = days.flatMap((d) => priorities(d));
  const priSet = pri.length;
  const priDone = pri.filter((t) => t.done).length;
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

/**
 * What went well and where it slipped in a week, computed from the logs: short lines of fact,
 * at most five of each. The weekly review shows these before asking anything.
 */
export function weekHighlights(weekStart) {
  const f = weekFacts(weekStart);
  const well = [], slip = [];
  if (!f.days) return { well, slip };
  const t = M.targets();
  const end = f.to;
  const hs = activeHabits().filter((h) => ['focus', 'autopilot'].includes(stateOf(h, end)) && h.weekly !== false && started(h, end));
  const rows = hs.map((h) => ({ h, c: consistency(h, end, f.days) })).filter((x) => x.c.ratio != null && x.c.expected >= 1);
  const said = (h, c) => (['daily', 'weekdays'].includes(h.schedule?.kind || 'daily') ? `${c.done} of ${Math.round(c.expected)} days` : `${c.done} this week`);
  for (const { h, c } of rows.filter((x) => x.c.ratio >= 0.85).sort((a, b) => b.c.ratio - a.c.ratio || (stateOf(a.h, end) === 'focus' ? -1 : 1)).slice(0, 3)) well.push({ ic: h.icon || 'check', text: `${h.name}: ${said(h, c)}` });
  for (const { h, c } of rows.filter((x) => x.c.ratio < 0.6 && stateOf(x.h, end) === 'focus').slice(0, 2)) slip.push({ ic: h.icon || 'circle', text: `${h.name}: ${said(h, c)}` });
  const planned = range(f.from, end).filter((d) => F.plannedTemplate(d)?.kind === 'strength').length;
  if (planned) (f.training.sessions >= planned ? well : slip).push({ ic: 'dumbbell', text: `${f.training.sessions} of ${planned} training sessions${f.training.improved ? `, ${f.training.improved} with progression` : ''}` });
  for (const p of F.personalBests()) {
    const d = [p.repsDate, p.loadDate, p.secondsDate].find((x) => x && x >= f.from && x <= end);
    if (d && well.length < 5) well.push({ ic: 'trophy', text: `New best: ${p.exercise.name}, ${p.exercise.metric === 'time' ? `${p.seconds} s` : `${p.reps} reps`}` });
  }
  if (f.sleep.avg != null) {
    if (f.sleep.short >= 3) slip.push({ ic: 'bed', text: `${f.sleep.short} nights under ${t.sleepMinH ?? 7} h` });
    else if (f.sleep.avg >= (t.sleepMinH ?? 7)) well.push({ ic: 'bed', text: `Sleep averaged ${Math.floor(f.sleep.avg)}h ${String(Math.round((f.sleep.avg % 1) * 60)).padStart(2, '0')}m` });
  }
  if (f.protein.logged >= 3) (f.protein.hitDays / f.protein.logged >= 0.7 ? well : slip).push({ ic: 'beef', text: `Protein on target ${f.protein.hitDays} of ${f.protein.logged} logged days` });
  if (f.weight.change != null && Math.abs(f.weight.change) >= 0.1) (f.weight.change < 0 ? well : slip).push({ ic: 'scale', text: `Weight ${f.weight.change < 0 ? 'down' : 'up'} ${Math.abs(f.weight.change).toFixed(1)} kg (7-day average)` });
  if (f.priorities.set >= 3) (f.priorities.done / f.priorities.set >= 0.7 ? well : slip).push({ ic: 'list-checks', text: `${f.priorities.done} of ${f.priorities.set} priorities done` });
  if (f.wins.length) well.push({ ic: 'star', text: `Your wins: ${f.wins.slice(0, 3).map((w) => w.text).join(' · ')}` });
  return { well: well.slice(0, 5), slip: slip.slice(0, 5) };
}
