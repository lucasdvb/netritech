// The Now card: one next action, chosen from the time of day, the routine that's open, your three,
// your Top 3, anything overdue and, last, one coach suggestion. Everything is a plain rule over
// your own data; nothing is guessed or sent anywhere.
import * as store from '../data/store.js';
import * as M from './metrics.js';
import * as H from './habits.js';
import * as R from './routines.js';
import * as T from './tasks.js';
import { dayScore, planHabits } from './scoring.js';
import { phase as phaseOf, isWorkday, trainingCall } from './day-plan.js';

// The coach's suggestions join in once coach.js has loaded (right after the first screen).
let coachTips = null;
export const useCoach = (guidance) => { coachTips = guidance; };
import { today, addDays, parseHM, minutesOfDay } from './dates.js';

const act = (label, name, data = {}) => ({ label, act: name, data });

/** How a habit step or focus habit is completed from the Now card. */
function habitAction(h, date) {
  if (h.id === 'h-training' || h.source?.startsWith('workout:')) {
    const call = trainingCall(date);
    return call.template ? act('Start', 'start-workout', { template: call.template.id }) : act('Open', 'habit', { id: h.id });
  }
  if (h.source === 'sleep') return act('Check in', 'open-checkin');
  if (h.source === 'shutdown') return act('Shut down', 'open-shutdown');
  if (h.source && H.isNumeric(h)) return act('Log', 'habit', { id: h.id });
  if (H.isNumeric(h)) return act('Log', 'habit', { id: h.id });
  return act('Done', 'toggle', { id: h.id });
}

const tinySub = (h) => (H.tinyOf(h)?.label ? `Tiny version: ${H.tinyOf(h).label}` : '');

/** Every candidate for the Now card, most useful first. */
export function nextActions(date = today(), now = new Date()) {
  if (date !== today()) return [];
  const out = [];
  const add = (rank, c) => out.push({ rank, ...c });
  const mode = H.dayMode(date);
  const ph = phaseOf(now);
  const mins = minutesOfDay(now);
  const work = isWorkday(date);
  // Late at night only the evening routine and your three's tiny versions are worth a nudge.
  const night = ph === 'night';

  if (mode === 'sick') {
    add(1, { id: 'sick', kind: 'care', eyebrow: 'Sick day', title: 'Rest is the plan', sub: 'Fluids, simple food, sleep. Nothing else is asked of you today.',
      primary: act('+500 ml water', 'add-water', { ml: 500 }) });
    return out;
  }

  // Start the day with the check-in that shapes the training call.
  const checked = M.sleep(date) || M.mood(date);
  if (!checked && (ph === 'morning' || mins < parseHM('11:00')) && ph !== 'night') {
    add(10, { id: 'checkin', kind: 'start', eyebrow: 'Start here', title: '30-second check-in', sub: 'Sleep, energy, stress and mood shape today’s training call.',
      primary: act('Check in', 'open-checkin') });
  }

  // Close the work day in the evening.
  if (work && ph === 'evening' && !M.review(date)?.shutdown?.done) {
    add(15, { id: 'shutdown', kind: 'work', eyebrow: 'Work', title: 'Close the work day', sub: 'Three questions, then the evening is yours.',
      primary: act('Shut down', 'open-shutdown') });
  }

  // The routine that's open: its next step, or all of it at once.
  const cur = mode === 'normal' || mode === 'rest' ? R.current(date, now) : null;
  if (cur?.next) {
    const s = cur.next;
    add(20, { id: `step-${cur.routine.id}-${s.id}`, kind: 'routine', eyebrow: `${cur.routine.name} · ${cur.done + 1} of ${cur.total}`,
      title: s.kind === 'habit' ? s.habit.name : s.label, sub: s.kind === 'habit' ? tinySub(s.habit) || s.habit.time || '' : '',
      primary: s.kind === 'habit' ? habitAction(s.habit, date) : act('Done', 'step-label', { r: cur.routine.id, s: s.id }),
      secondary: cur.total - cur.done > 1 ? act('Did it all', 'did-it-all', { r: cur.routine.id }) : null,
      routine: cur.routine.id, habitId: s.habitId || null });
  }

  // Training, around its time, when it isn't a routine step already shown.
  const call = trainingCall(date);
  const train = parseHM(store.profile()?.trainTime || '06:30');
  if (call.template && ['planned', 'lighter', 'recovery'].includes(call.kind) && mins >= train - 60 && mins <= train + 180
      && !(cur?.next?.habitId === 'h-training')) {
    add(25, { id: 'training', kind: 'training', eyebrow: 'Training', title: call.title, sub: call.reason, primary: act('Start', 'start-workout', { template: call.template.id }) });
  }

  // Your three (and, on a minimum day, the essentials), by their time.
  const plan = planHabits(date, mode).filter((h) => !H.counts(h, date, mode) && h.source !== 'top3')
    .sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  for (const h of plan) {
    if (cur?.next?.habitId === h.id) continue;
    const late = h.time && mins >= parseHM(h.time);
    add(late ? 22 : 32, { id: `habit-${h.id}`, kind: 'focus', eyebrow: mode === 'minimum' ? 'Minimum day' : 'Your three',
      title: mode === 'minimum' && H.tinyOf(h)?.label && !h.source ? H.tinyOf(h).label : h.name, sub: mode === 'minimum' ? '' : tinySub(h),
      primary: habitAction(h, date), secondary: mode !== 'minimum' && H.tinyOf(h) && !h.source && h.type !== 'check' ? act('Tiny', 'tiny', { id: h.id }) : null, habitId: h.id });
  }

  // Priorities: during work on a workday they come first; otherwise after your three.
  if ((mode === 'normal' || mode === 'rest') && !night) {
    for (const t of T.priorities(date).filter((x) => !x.done)) {
      add(work && ph === 'work' ? 18 + t.rank / 10 : 34 + t.rank / 10, { id: `pri-${t.id}`, kind: 'priority', eyebrow: `Priority ${t.rank}`, title: t.title,
        primary: act('Done', 'task-check', { id: t.id }), taskId: t.id });
    }
  }

  // Anything overdue, oldest first.
  for (const t of night ? [] : T.overdue(date).slice(0, 3)) {
    add(50, { id: `overdue-${t.id}`, kind: 'overdue', eyebrow: 'Overdue', title: t.title, sub: T.dueLabel(t.date),
      primary: act('Done', 'task-check', { id: t.id }), secondary: act('Move to today', 'task-today', { id: t.id }), taskId: t.id });
  }

  // One suggestion from the coach, when nothing above needs you.
  const seen = new Set(['checkin', 'train-call', 'shutdown', 'sick', 'missed-session']);
  const tip = night || !coachTips ? null : coachTips(date, now).find((c) => !seen.has(c.id));
  if (tip) add(tip.tone === 'care' ? 33 : 60, { id: `coach-${tip.id}`, kind: 'suggestion', eyebrow: tip.fact ? 'From your data' : 'Suggestion', title: tip.title, sub: tip.body, primary: tip.action ? act(tip.action.label, tip.action.act, tip.action.data || {}) : null });

  return out.sort((a, b) => a.rank - b.rank);
}

/** The state to show when there's nothing left to do: done for today, or time to wind down. */
export function doneState(date = today(), now = new Date()) {
  const ph = phaseOf(now);
  const s = dayScore(date);
  const tm = addDays(date, 1);
  const first = T.priorities(tm)[0]?.title || null;
  return {
    id: 'done', kind: 'done', eyebrow: 'Done for today',
    title: ph === 'night' ? 'Time to wind down' : s.total && s.done === s.total ? 'Everything you planned is done' : 'Nothing needs you right now',
    sub: first ? `Tomorrow starts with: ${first}` : ph === 'night' ? `Lights out by ${store.profile()?.bedTime || '22:00'}.` : 'Enjoy the space.',
  };
}

/** The Now card's action, or the done state. */
export const nextAction = (date = today(), now = new Date()) => nextActions(date, now)[0] || doneState(date, now);
