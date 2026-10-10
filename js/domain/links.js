// What everything is linked to (50), and what deleting it would leave behind (51). A habit can carry
// goals, sit in a routine and in Your day, start a workout, have a reminder, a pledge or an
// experiment running; a goal is carried by habits; a workout is on days of your week and started by
// habits; a routine holds habits and has a place in Your day. Mentions in notes and the journal
// (mentions.js) are links too. Deleting something offers to move its links to another of the same
// kind, or to let them go; either way it's one change with one Undo.
import * as store from '../data/store.js';
import * as H from './habits.js';
import * as R from './routines.js';
import * as G from './goals.js';
import * as F from './fitness-core.js';
import * as D from './day-blocks.js';
import * as C from './commitments.js';
import { mentionsOf } from './mentions.js';
import { today } from './dates.js';

const WEEKDAYS = ['', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];
const storedDay = () => (Array.isArray(store.profile().day) ? store.profile().day : D.defaults());
const blockTitle = (b) => D.block(b.id)?.title || b.label || 'Block';
const blockTime = (b) => D.block(b.id)?.time || b.time || '';

/** Goals a habit carries: linked on the goal, counted by it, or named on the habit. */
const goalsOfHabit = (h) => G.goals().filter((g) => (g.habitIds || []).includes(h.id) || g.habitId === h.id || h.goalId === g.id);

/**
 * What an item is linked to: [{ group, label, sub, to, icon }] in the order they matter.
 * kind: 'habit' | 'goal' | 'workout' | 'routine' | 'project'.
 */
export function linksOf(kind, id) {
  const out = [];
  const add = (group, label, sub, to, icon) => out.push({ group, label, sub, to, icon });
  if (kind === 'habit') {
    const h = H.habit(id);
    if (!h) return [];
    for (const g of goalsOfHabit(h)) add('Goal', g.name, g.habitId === h.id ? 'Counts it' : 'Carries it', `plan/goals/${g.id}`, 'target');
    const r = R.routineOf(id);
    if (r) add('Routine', r.routine.name, `Step ${r.routine.steps.indexOf(r.step) + 1}`, 'plan/playbook', R.iconOf(r.routine));
    for (const b of storedDay()) if (b.ref === id || (b.also || []).includes(id)) add('Your day', blockTitle(b), blockTime(b), 'plan/playbook', 'clock');
    if (h.templateId && F.template(h.templateId)) add('Workout', F.template(h.templateId).name, 'Starts it', `plan/training/workouts/${h.templateId}`, 'dumbbell');
    if (h.reminder) add('Reminder', `At ${h.reminder}`, 'In your reminders', 'you/reminders', 'bell');
    for (const c of C.active()) if (c.habitId === id) add('Pledge', c.title, `${c.days} days`, 'plan/commitments', 'hand');
    for (const e of store.all('experiments')) if (e.habitId === id && e.status === 'running') add('Experiment', `${e.days}-day experiment`, 'Running', 'review', 'lightbulb');
    for (const s of store.all('seasons')) if ((s.habitIds || []).includes(id) && s.start <= today() && s.end >= today()) add('Season', s.name, 'In focus', 'progress/season', 'sparkles');
  } else if (kind === 'goal') {
    const g = store.get('goals', id);
    if (!g) return [];
    const ids = new Set([...(g.habitIds || []), g.habitId].filter(Boolean));
    for (const h of store.all('habits')) if (h.goalId === id) ids.add(h.id);
    for (const hid of ids) { const h = H.habit(hid); if (h) add('Habit', h.name, g.habitId === hid ? 'Counted by the goal' : 'Carries it', `plan/habits/${h.id}`, h.icon || 'repeat'); }
  } else if (kind === 'workout') {
    const t = F.template(id);
    if (!t) return [];
    const plan = store.profile().plan || {};
    const days = Object.entries(plan).filter(([, v]) => v === id).map(([d]) => Number(d)).sort();
    if (days.length) add('Your week', days.map((d) => WEEKDAYS[d]).join(', '), 'Planned', 'plan/training', 'calendar');
    for (const h of store.all('habits')) if (h.templateId === id && !h.archived) add('Habit', h.name, 'Starts it', `plan/habits/${h.id}`, h.icon || 'repeat');
  } else if (kind === 'routine') {
    const r = R.routine(id);
    if (!r) return [];
    for (const s of r.steps || []) { const h = s.habitId && H.habit(s.habitId); if (h) add('Habit', h.name, `Step ${r.steps.indexOf(s) + 1}`, `plan/habits/${h.id}`, h.icon || 'repeat'); }
    for (const b of storedDay()) if (b.kind === 'routine' && b.ref === id) add('Your day', blockTitle(b), blockTime(b), 'plan/playbook', 'clock');
  } else if (kind === 'project') {
    const n = store.all('tasks').filter((t) => t.projectId === id && !t.done).length;
    if (n) add('Tasks', `${n} open task${n === 1 ? '' : 's'}`, 'In this project', `plan/projects/${id}`, 'list-checks');
  }
  return out;
}

/** Links plus mentions, for the "Linked to" section: { links, mentions }. */
export const everything = (kind, id) => ({ links: linksOf(kind, id), mentions: mentionsOf(kind, id) });

/** What else of the same kind its links could move to: [{ id, name }]. */
export function others(kind, id) {
  const list = kind === 'habit' ? H.activeHabits() : kind === 'goal' ? G.goals().filter((g) => g.status !== 'done')
    : kind === 'workout' ? F.templates() : kind === 'routine' ? R.routines().filter((r) => !r.archived) : [];
  return list.filter((x) => x.id !== id).map((x) => ({ id: x.id, name: x.name }));
}

/**
 * The writes that take an item's links away (to = null) or move them to another item of the same
 * kind (to = its id), as store.batch ops. The item itself isn't deleted here.
 */
export function relink(kind, id, to = null) {
  const ops = [];
  const put = (s, value) => ops.push({ store: s, value });
  const swap = (list) => {
    const next = (list || []).flatMap((x) => (x === id ? (to ? [to] : []) : [x]));
    return [...new Set(next)];
  };
  if (kind === 'habit') {
    for (const g of store.all('goals')) {
      const touches = (g.habitIds || []).includes(id) || g.habitId === id;
      if (touches) put('goals', { ...g, habitIds: swap(g.habitIds), habitId: g.habitId === id ? to : g.habitId });
    }
    for (const r of store.all('routines')) {
      if (!(r.steps || []).some((s) => s.habitId === id)) continue;
      const steps = to && !(r.steps || []).some((s) => s.habitId === to)
        ? r.steps.map((s) => (s.habitId === id ? { ...s, habitId: to } : s))
        : r.steps.filter((s) => s.habitId !== id);
      put('routines', { ...r, steps });
    }
    const day = storedDay();
    if (day.some((b) => b.ref === id || (b.also || []).includes(id))) {
      const next = day.flatMap((b) => {
        const also = swap(b.also).filter((x) => x !== (b.ref === id ? to : b.ref));
        if (b.ref !== id) return [{ ...b, ...(b.also ? { also } : {}) }];
        if (to) return [{ ...b, ref: to, ...(b.also ? { also } : {}) }];
        // A block that was the habit goes; wake, training and bed only lose the link.
        if (b.kind === 'habit') return also.length ? [{ ...b, ref: also[0], also: also.slice(1) }] : [];
        const { ref: _gone, ...rest } = b;
        return [{ ...rest, ...(b.also ? { also } : {}) }];
      });
      put('profile', { ...store.profile(), day: next });
    }
    if (to) {
      for (const c of store.all('commitments')) if (c.habitId === id && c.status === 'active') put('commitments', { ...c, habitId: to });
      for (const e of store.all('experiments')) if (e.habitId === id && e.status === 'running') put('experiments', { ...e, habitId: to });
    }
  } else if (kind === 'goal') {
    const g = store.get('goals', id);
    for (const h of store.all('habits')) if (h.goalId === id) put('habits', { ...h, goalId: to });
    if (to && g) {
      const target = store.get('goals', to);
      if (target) put('goals', { ...target, habitIds: [...new Set([...(target.habitIds || []), ...(g.habitIds || [])])] });
    }
  } else if (kind === 'workout') {
    const plan = store.profile().plan || {};
    if (Object.values(plan).includes(id)) {
      const base = ops.find((o) => o.store === 'profile')?.value || store.profile();
      put('profile', { ...base, plan: Object.fromEntries(Object.entries(plan).map(([d, v]) => [d, v === id ? to : v])) });
    }
    for (const h of store.all('habits')) if (h.templateId === id) put('habits', { ...h, templateId: to });
  } else if (kind === 'routine') {
    const day = storedDay();
    if (day.some((b) => b.kind === 'routine' && b.ref === id)) {
      const next = to ? day.map((b) => (b.kind === 'routine' && b.ref === id ? { ...b, ref: to } : b)) : day.filter((b) => !(b.kind === 'routine' && b.ref === id));
      put('profile', { ...store.profile(), day: next });
    }
  }
  return ops;
}
