// Rule-based guidance. Every item separates the observed fact (data) from the
// suggestion (advice), and nothing here diagnoses anything.
import * as store from '../data/store.js';
import * as M from './metrics.js';
import * as F from './fitness.js';
import { activeHabits, consistency, isDone, dueOn, dayMode, periodDone, isScheduledDay, started, habit, stateOf, focusHabits, runUnit, isOff } from './habits.js';
import { graduationDue } from './habit-system.js';
import { rolling, dayScore } from './scoring.js';
import { today, addDays, minutesOfDay, parseHM, startOfWeek, endOfWeek, diffDays, lastNDays, range } from './dates.js';
import { num, litres } from '../ui/format.js';
import { suggestions as reminderSuggestions } from './reminder-rules.js';

import { phase, isWorkday, trainingCall } from './day-plan.js';
export { phase, isWorkday, trainingCall };

const item = (o) => ({ tone: 'calm', kind: 'advice', priority: 50, ...o });

/** Today's guidance, most useful first. */
export function guidance(date = today(), now = new Date()) {
  if (date !== today()) return [];
  const out = [];
  const t = M.targets();
  const mode = dayMode(date);
  const ph = phase(now);
  const mins = minutesOfDay(now);
  const checkin = M.sleep(date) || M.mood(date);

  if (mode === 'sick') {
    out.push(item({ id: 'sick', tone: 'care', priority: 1, title: 'Rest is the plan today',
      body: 'Fluids, simple food, sleep. No hard training or calorie deficit. If you’re not improving, get medical advice.' }));
    return out;
  }

  if (!checkin && (ph === 'morning' || ph === 'night' || mins < parseHM('11:00'))) {
    out.push(item({ id: 'checkin', priority: 2, title: 'Start with a 30-second check-in',
      body: 'Sleep, energy, stress and mood shape today’s training call.', action: { label: 'Check in', act: 'open-checkin' } }));
  }

  const call = trainingCall(date);
  if (ph !== 'night' && call.kind !== 'done' && !isDone(habit('h-training') || {}, date)) {
    if (call.kind === 'recovery' || call.kind === 'lighter') {
      out.push(item({ id: 'train-call', tone: 'nudge', priority: 5, title: call.title, body: call.reason,
        fact: true, action: call.template ? { label: 'Open session', act: 'start-workout', data: { template: call.template.id } } : null }));
    } else if (ph === 'morning' && call.template) {
      out.push(item({ id: 'train-call', priority: 10, title: `Today: ${call.title}`, body: call.reason,
        action: { label: 'Start', act: 'start-workout', data: { template: call.template.id } } }));
    }
  }

  // Missed yesterday's planned strength session: don't reshuffle the week.
  const y = addDays(date, -1);
  const yTpl = F.plannedTemplate(y);
  if (ph !== 'night' && yTpl?.kind === 'strength' && started(habit('h-training') || {}, y) && dayMode(y) === 'normal'
      && !F.workoutsOn(y).length && !F.workoutsOn(date).length) {
    out.push(item({ id: 'missed-session', priority: 12, title: 'Yesterday’s session didn’t happen',
      body: 'No need to move the whole week. If you have 20 minutes, the minimum workout keeps the thread.',
      action: { label: '20-minute minimum', act: 'start-workout', data: { template: 't-minimum' } } }));
  }

  const steps = M.steps(date);
  if (mins >= parseHM('18:00') && ph !== 'night' && (steps ?? 0) < (t.stepsAlert ?? 5000)) {
    out.push(item({ id: 'steps-low', tone: 'nudge', priority: 8, fact: steps != null,
      title: 'A 20–30 minute walk would help', body: steps != null ? `${num(steps)} steps so far today.` : 'No steps logged yet today.',
      action: { label: steps != null ? 'Update steps' : 'Log steps', act: 'log-steps' } }));
  }

  const n = M.nutrition(date);
  if (mins >= parseHM('17:00') && ph !== 'night' && n.protein < (t.proteinLateG ?? 120)) {
    out.push(item({ id: 'protein-late', tone: 'nudge', priority: 9, fact: true,
      title: 'Make dinner protein-rich', body: `${num(n.protein)} g of ${t.proteinG} g so far. Chicken, eggs, lean beef or dholl — or a whey shake (25.5 g).`,
      action: { label: 'Log food', act: 'log-food' } }));
  }

  const water = M.waterMl(date);
  if (mins >= parseHM('15:00') && ph !== 'night' && water < 1200) {
    out.push(item({ id: 'water-low', priority: 20, fact: true, title: 'Water is behind',
      body: `${litres(water)} so far. A bottle now and one with dinner gets you close.`, action: { label: '+500 ml', act: 'add-water', data: { ml: 500 } } }));
  }

  // Adherence: simplify, never escalate.
  const r7 = rolling(date, 7);
  if (r7.days >= 5 && r7.ratio != null && r7.ratio < 0.6) {
    out.push(item({ id: 'simplify', tone: 'care', priority: 4, title: 'Simplify this week',
      body: `Last 7 days: ${Math.round(r7.ratio * 100)}%. That’s a signal the system is too heavy right now, not a failure. Run Minimum Days until it feels easy again, and add nothing new.`,
      action: { label: 'Use Minimum Day', act: 'set-mode', data: { mode: 'minimum' } } }));
  } else if (r7.days >= 7 && r7.ratio >= 0.9) {
    out.push(item({ id: 'steady', priority: 60, title: 'Keep the system exactly as it is',
      body: `Last 7 days: ${Math.round(r7.ratio * 100)}%. No need to add habits because it’s going well.` }));
  }

  // A focus habit that has become automatic frees its slot (you decide).
  for (const h of focusHabits(date)) {
    const g = graduationDue(h, date);
    if (!g) continue;
    out.push(item({ id: `grad-${h.id}`, priority: 30, fact: true, title: `${h.name} is ready for autopilot`,
      body: `Done on ${Math.round(g.ratio * 100)}% of ${runUnit(h) === 'day' ? 'days' : 'weeks'} for six weeks. Moving it to autopilot frees a slot for the next habit.`,
      action: { label: 'Review', act: 'nav', data: { to: `plan/habits/${h.id}` } } }));
  }

  for (const w of weightGuidance(date)) out.push(w);
  for (const r of recoveryGuidance(date)) out.push(r);

  for (const r of reminderSuggestions()) {
    out.push(item({ id: `rem-${r.cat}`, priority: 40, title: r.title, body: r.body, action: { label: 'Change time', act: 'nav', data: { to: 'you/settings' } } }));
  }

  if (ph === 'evening' && isWorkday(date) && !(M.review(date)?.shutdown?.done)) {
    out.push(item({ id: 'shutdown', priority: 3, title: 'Close the work day',
      body: 'Three questions, then work is done for today.', action: { label: 'Shut down', act: 'open-shutdown' } }));
  }

  return out.sort((a, b) => a.priority - b.priority);
}

export function weightGuidance(date = today()) {
  const out = [];
  const entries14 = lastNDays(date, 21).filter((d) => M.weight(d) != null).length;
  const now7 = M.weightAvg(date, 7);
  const then7 = M.weightAvg(addDays(date, -14), 7);
  const then21 = M.weightAvg(addDays(date, -21), 7);
  if (entries14 >= 10 && now7 != null && then7 != null && now7 >= then7 - 0.1 && (then21 == null || now7 >= then21 - 0.2)) {
    out.push(item({ id: 'weight-stall', priority: 30, fact: true,
      title: 'Weight trend has been flat for about two weeks',
      body: `7-day average ${num(now7, 1)} kg vs ${num(then7, 1)} kg two weeks ago. Worth reviewing portions, calories, daily steps and how accurately meals are logged. One small change, not a crash diet.`,
      action: { label: 'Open nutrition', act: 'nav', data: { to: 'progress/body/nutrition' } } }));
  }
  const t = M.targets();
  const wk = M.weightAvg(addDays(date, -7), 7);
  const wk2 = M.weightAvg(addDays(date, -14), 7);
  if (now7 && wk && wk2) {
    const pct1 = ((wk - now7) / wk) * 100;
    const pct2 = ((wk2 - wk) / wk2) * 100;
    if (pct1 > (t.lossMaxPct ?? 1) && pct2 > (t.lossMaxPct ?? 1)) {
      const energy = M.averageOver(date, 7, (d) => M.mood(d)?.energy).value;
      out.push(item({ id: 'weight-fast', tone: 'care', priority: 15, fact: true,
        title: 'Weight is dropping quickly',
        body: `About ${num(pct1, 1)}% of bodyweight this week and ${num(pct2, 1)}% the week before${energy != null && energy < 5 ? `, with energy averaging ${num(energy, 1)}/10` : ''}. Consider adding 150–200 kcal to protect muscle and recovery.` }));
    }
  }
  return out;
}

export function recoveryGuidance(date = today()) {
  const out = [];
  const t = M.targets();
  const sleep7 = M.averageOver(addDays(date, -1), 7, (d) => M.sleepHours(d));
  if (sleep7.n >= 4 && sleep7.value < (t.sleepMinH ?? 7)) {
    out.push(item({ id: 'sleep-avg', priority: 25, fact: true, title: 'Protect 22:00 lights out this week',
      body: `Sleep has averaged ${num(sleep7.value, 1)} h over your last ${sleep7.n} logged nights.` }));
  }
  const prot7 = M.averageOver(addDays(date, -1), 7, (d) => M.nutrition(d).protein);
  if (prot7.n >= 4 && prot7.value < (t.proteinHitG ?? 135)) {
    out.push(item({ id: 'protein-avg', priority: 26, fact: true, title: 'Protein is running below target',
      body: `${num(prot7.value)} g a day on average (target ${t.proteinG} g). Low protein makes keeping muscle harder while losing fat. One whey serving closes most of the gap.` }));
  }
  const energy = M.averageOver(addDays(date, -1), 7, (d) => M.mood(d)?.energy);
  if (energy.n >= 4 && energy.value <= 4) {
    out.push(item({ id: 'energy-low', tone: 'care', priority: 14, fact: true, title: 'Energy has been low all week',
      body: `Averaging ${num(energy.value, 1)}/10. Treat this as a lighter week. If it keeps happening, it’s worth talking to a doctor.` }));
  }
  return out;
}

/** Gentle "Needs attention": only meaningful, recent misses. */
export function needsAttention(date = today()) {
  if (date !== today()) return [];
  const mode = dayMode(date);
  if (mode === 'sick' || mode === 'minimum') return [];
  const out = [];
  for (const h of activeHabits()) {
    if (stateOf(h, date) !== 'focus' || !started(h, addDays(date, -1))) continue;
    const s = h.schedule || {};
    if (s.kind === 'daily' || s.kind === 'weekdays') {
      const days = lastNDays(addDays(date, -1), 7).filter((d) => started(h, d) && isScheduledDay(h, d) && !isOff(dayMode(d)));
      const missed = days.filter((d) => !isDone(h, d)).length;
      if (days.length >= 3 && missed >= 2 && missed / days.length >= 0.4) {
        const verb = h.source && ['water', 'protein', 'steps', 'sleep'].includes(h.source) ? 'below target' : 'missed';
        out.push({ habit: h, text: `${verb} ${missed} of the last ${days.length} days`, weight: missed / days.length });
      }
    } else if (s.kind === 'perWeek') {
      const elapsed = diffDays(date, startOfWeek(date)) + 1;
      const doneN = periodDone(h, date);
      const left = 7 - elapsed;
      const behind = s.count - doneN - left;
      if (behind >= 1 && elapsed >= 3) out.push({ habit: h, text: `${doneN} of ${s.count} this week`, weight: behind / s.count });
    }
  }
  return out.sort((a, b) => b.weight - a.weight).slice(0, 3);
}

/* ---------- weekly insight engine (facts only) ---------- */
export function weeklyInsights(weekStart = startOfWeek(today())) {
  const from = weekStart;
  const to = endOfWeek(weekStart);
  const end = to > today() ? today() : to;
  const prevFrom = addDays(from, -7);
  const prevTo = addDays(from, -1);
  const days = range(from, end);
  const t = M.targets();
  const out = [];
  const daysWith = (fn) => days.filter((d) => fn(d) != null && fn(d) > 0);

  const w = F.weekStats(from);
  const wPrev = F.weekStats(prevFrom);
  if (w.sessions || wPrev.sessions) {
    const diff = w.sessions - wPrev.sessions;
    out.push({ id: 'training', area: 'Body', text: `${w.sessions} training session${w.sessions === 1 ? '' : 's'} this week${diff ? ` (${diff > 0 ? '+' : ''}${diff} vs last week)` : ', same as last week'}.` });
  }
  if (w.calfSessions) out.push({ id: 'calves', area: 'Body', text: `Calves trained ${w.calfSessions}× · ${num(w.calfReps)} total reps.` });

  const prot = daysWith((d) => M.nutrition(d).protein);
  if (prot.length >= 2) {
    const a = M.avg(prot.map((d) => M.nutrition(d).protein));
    const gap = a - t.proteinG;
    out.push({ id: 'protein', area: 'Body', text: `Average protein ${num(a)} g on ${prot.length} logged days${Math.abs(gap) <= 5 ? ', right on target' : gap < 0 ? `, ${num(-gap)} g below your ${t.proteinG} g target` : `, above your ${t.proteinG} g target`}.` });
  }

  const trend = M.weightTrend(end, 21);
  if (trend && trend.points >= 6) {
    const pw = trend.perWeek;
    out.push({ id: 'weight', area: 'Body', text: Math.abs(pw) < 0.1
      ? 'Weight trend is roughly flat.'
      : `Weight trend is moving ${pw < 0 ? 'down' : 'up'} about ${num(Math.abs(pw), 1)} kg a week (7-day average, last 3 weeks).` });
  }

  const sleeps = days.map((d) => M.sleepHours(d)).filter((x) => x != null);
  if (sleeps.length >= 3) {
    const short = sleeps.filter((x) => x < (t.sleepMinH ?? 7)).length;
    out.push({ id: 'sleep', area: 'Health', text: `Sleep averaged ${num(M.avg(sleeps), 1)} h${short ? `; under 7 hours on ${short} night${short === 1 ? '' : 's'}` : ''}.` });
  }
  const stepDays = daysWith((d) => M.steps(d));
  if (stepDays.length >= 3) out.push({ id: 'steps', area: 'Health', text: `Steps averaged ${num(M.avg(stepDays.map((d) => M.steps(d))))} a day.` });

  const mob = habit('h-mobility');
  if (mob) {
    const n = days.filter((d) => isDone(mob, d)).length;
    if (days.length) out.push({ id: 'posture', area: 'Posture', text: `Posture routine done ${n} of ${days.length} days.` });
  }
  const mind = days.reduce((a, d) => a + M.mindMinutes(d), 0);
  if (mind) out.push({ id: 'mind', area: 'Mind', text: `${num(mind)} minutes of reading and learning logged.` });
  const prayer = habit('h-prayer');
  if (prayer) {
    const n = days.filter((d) => isDone(prayer, d)).length;
    if (n) out.push({ id: 'prayer', area: 'Spirit', text: `Prayer on ${n} of ${days.length} days.` });
  }
  const cur = rolling(end, 7).ratio;
  const prev = rolling(prevTo, 7).ratio;
  if (cur != null && prev != null) {
    const d = Math.round((cur - prev) * 100);
    out.push({ id: 'consistency', area: 'System', text: `Foundation consistency ${Math.round(cur * 100)}%${d ? ` (${d > 0 ? 'up' : 'down'} ${Math.abs(d)} points on last week)` : ', unchanged'}.` });
  }
  return out;
}
