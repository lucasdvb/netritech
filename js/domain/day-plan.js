// The shape of a day: which part of it you're in, whether it's a workday, and today's
// training call from sleep, energy and stress. Small and needed for the first screen.
import * as store from '../data/store.js';
import * as M from './metrics-core.js';
import * as F from './fitness-core.js';
import { dayMode } from './habits.js';
import { on as planOn } from './day-plans-core.js';
import { today, minutesOfDay, parseHM, weekday } from './dates.js';
import { num } from '../ui/format.js';

export function phase(now = new Date()) {
  const p = planOn(today()).profile || {};
  const m = minutesOfDay(now);
  const wake = parseHM(p.wakeTime || '06:00');
  const work = parseHM(p.workStart || '10:00');
  const end = parseHM(p.workEnd || '20:00');
  const bed = parseHM(p.bedTime || '22:00');
  // Lights out can be after midnight (00:30): night then runs from it to two hours before waking.
  if (bed > wake ? m >= bed || m < wake - 120 : m >= bed && m < wake - 120) return 'night';
  if (m < work) return 'morning';
  if (m < end) return 'work';
  return 'evening';
}

/** A workday: on Every day, one of your work days; on another plan, a day whose plan has work in it. */
export function isWorkday(date) {
  const o = planOn(date);
  if (!o.base) return o.work;
  return (store.profile()?.workDays || [1, 2, 3, 4, 5]).includes(weekday(date));
}

/** What training makes sense today, from the plan and this morning's check-in. */
export function trainingCall(date = today()) {
  const tpl = F.plannedTemplate(date);
  const mode = dayMode(date);
  const sleep = M.sleepHours(date);
  const mood = M.mood(date);
  const t = M.targets();
  const hard = F.hardSessions(date, 4);
  const done = F.workoutsOn(date);
  if (done.length) return { kind: 'done', template: tpl, title: done[0].title || tpl?.name || 'Session done', reason: 'Logged today.' };
  if (mode === 'sick') return { kind: 'rest', template: null, title: 'Rest', reason: 'Sick day: no hard training. Resume gradually.' };
  if (mode === 'minimum') return { kind: 'minimum', template: F.template('t-recovery'), title: '10-minute walk', reason: 'Minimum day: basic movement is enough.' };
  if (!tpl) return { kind: 'rest', template: F.template('t-recovery'), title: 'Recovery', reason: 'Rest day in your plan. A walk or mobility is ideal.' };
  if (tpl.kind !== 'strength') return { kind: 'planned', template: tpl, title: tpl.name, reason: 'From your weekly plan.' };
  if (sleep != null && sleep < (t.sleepLowH ?? 6)) {
    return { kind: 'recovery', template: F.template('t-recovery'), title: 'Recovery or a lighter session', reason: `Slept ${num(sleep, 1)} h. A walk and mobility, or two easy sets per move.` };
  }
  if (mood?.energy != null && mood.energy <= 4) {
    return { kind: 'lighter', template: tpl, title: `${tpl.name} · lighter`, reason: `Energy ${mood.energy}/10. Keep the session, drop a set and stop well short of failure.` };
  }
  if (mood?.stress != null && mood.stress >= 8 && hard >= 2) {
    return { kind: 'recovery', template: F.template('t-recovery'), title: 'Recovery session', reason: `High stress and ${hard} hard sessions in 4 days. Recovery today, train tomorrow.` };
  }
  return { kind: 'planned', template: tpl, title: tpl.name, reason: sleep != null && mood?.energy >= 6 ? 'Sleep and energy look good. Train as planned.' : 'From your weekly plan.' };
}
