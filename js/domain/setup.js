// The 5-minute setup: a few answers about your days build them in one go (times, work, a weekend
// plan, the training week, the habits you train first and the reminders), through the same rules
// the app uses when you change each of these by hand, so everything stays linked. One undo puts it
// all back as it was.
import * as store from '../data/store.js';
import * as D from './day-blocks.js';
import * as PG from './programmes.js';
import { applyStates, suggestFocus } from './habit-system.js';
import { activeHabits, focusLimit, stateOf } from './habits.js';
import { parseHM, today } from './dates.js';

/** What the setup can change, kept whole for the undo. */
const TOUCHED = ['profile', 'settings', 'habits', 'routines', 'templates', 'exercises'];

const hm = (m) => { const x = ((m % 1440) + 1440) % 1440; return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; };
export const shiftTime = (t, d) => hm(parseHM(t) + d);
const valid = (t) => D.validTime(t);

/** The answers to start from: what you have now. */
export function current() {
  const p = store.profile() || {};
  const n = store.settings().notifications || {};
  const days = Object.values(p.plan || {}).filter((id) => id && store.get('templates', id)?.kind === 'strength').length;
  return {
    name: p.name || '',
    wake: p.wakeTime || '06:00', bed: p.bedTime || '22:00',
    work: (p.workDays || [1, 2, 3, 4, 5]).length > 0,
    workStart: p.workStart || '09:00', workEnd: p.workEnd || '17:00', workDays: [...(p.workDays || [1, 2, 3, 4, 5])],
    days: 'same', weekendWake: shiftTime(p.wakeTime || '06:00', 60), weekendBed: p.bedTime || '22:00',
    trainDays: [0, 2, 3, 4, 6].includes(days) ? days : 3, where: /gym/i.test(p.equipment || '') ? 'gym' : 'home',
    trainTime: p.trainTime || '06:30', training: PG.following() ? 'programme' : 'own',
    focus: activeHabits().filter((h) => stateOf(h) === 'focus').map((h) => h.id),
    reminders: { morning: !!n.morning?.on, evening: !!n.evening?.on, weekly: !!n.weeklyReview?.on, workout: !!n.workout?.on },
  };
}

/** The programme that fits how often and where you train (null: no training plan). */
export function recommend(days, where) {
  if (!days) return null;
  if (where === 'home') return { id: 'home-3', short: false };
  return { 2: { id: 'minimum-2' }, 3: { id: 'full-body-3' }, 4: { id: 'upper-lower-4' }, 6: { id: 'ppl-6' } }[days] || { id: 'full-body-3' };
}

/** Habits worth training first, for the focus step: what you train now, else the suggestion. */
export function focusChoices() {
  const now = activeHabits().filter((h) => stateOf(h) === 'focus');
  const pick = now.length ? now : suggestFocus();
  const rest = suggestFocus(12).filter((h) => !pick.some((x) => x.id === h.id));
  return { picked: pick.map((h) => h.id), options: [...pick, ...rest].slice(0, 9), limit: focusLimit() };
}

/** Everything the setup would change, in words, for the last step. */
export function summary(a) {
  const out = [`Up at ${a.wake}, lights out at ${a.bed}.`];
  out.push(a.work ? `Work ${a.workStart}–${a.workEnd} on ${dayList(a.workDays)}.` : 'No work block in your day.');
  if (a.days === 'weekend') out.push(`A Weekend plan for Saturday and Sunday: up at ${a.weekendWake}, lights out at ${a.weekendBed}${a.work && !a.workDays.some((d) => d >= 6) ? ', no work' : ''}.`);
  if (a.training === 'programme') {
    const r = recommend(a.trainDays, a.where);
    const p = r && PG.programme(r.id);
    if (p) out.push(`Training: ${p.name} at ${a.trainTime}.`);
  } else if (a.training === 'own') out.push(`Training: your own week, at ${a.trainTime}.`);
  else out.push('No training plan for now.');
  if (a.focus.length) out.push(`Training first: ${a.focus.map((id) => store.get('habits', id)?.name).filter(Boolean).join(', ')}.`);
  const rem = [a.reminders.morning && 'morning check-in', a.reminders.workout && 'training', a.reminders.evening && 'close the day', a.reminders.weekly && 'weekly review'].filter(Boolean);
  out.push(rem.length ? `Reminders: ${rem.join(', ')}.` : 'No reminders.');
  return out;
}
const DOW = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function dayList(days) {
  const s = [...days].sort();
  if (s.join() === '1,2,3,4,5') return 'weekdays';
  if (s.length === 7) return 'every day';
  return s.map((d) => DOW[d]).join(', ');
}

function snapshot() {
  return Object.fromEntries(TOUCHED.map((s) => [s, store.all(s).map((r) => ({ ...r }))]));
}
function restore(before) {
  const ops = [];
  for (const s of TOUCHED) {
    const was = new Set(before[s].map((r) => r.id));
    for (const r of before[s]) ops.push({ store: s, value: r });
    for (const r of store.all(s)) if (!was.has(r.id)) ops.push({ store: s, delete: r.id });
  }
  store.batch(ops);
}

/** Times on the base plan: wake and lights out carry their part of the day with them. */
function setBaseTimes(a) {
  const find = (kind) => D.blocks().find((b) => b.kind === kind);
  if (valid(a.wake) && find('wake')) D.edit(find('wake').id, { time: a.wake }, { carry: true });
  else if (valid(a.wake)) store.setProfile({ wakeTime: a.wake });
  if (valid(a.bed) && find('bed')) D.edit(find('bed').id, { time: a.bed }, { carry: true });
  else if (valid(a.bed)) store.setProfile({ bedTime: a.bed });
  if (a.work) {
    if (!find('work')) D.add({ kind: 'work', time: a.workStart });
    if (valid(a.workStart)) D.setTime('workStart', a.workStart);
    if (valid(a.workEnd)) D.setTime('workEnd', a.workEnd);
    store.setProfile({ workDays: [...new Set(a.workDays)].filter((d) => d >= 1 && d <= 7).sort() });
  } else {
    if (find('work')) D.remove(find('work').id);
    store.setProfile({ workDays: [] });
  }
}

/** Saturday and Sunday on a Weekend plan, copied from the base and changed where they differ. */
async function weekPlans(a) {
  const P = await import('./day-plans.js');
  if (a.days === 'same') {
    if (P.plans().length > 1) for (let wd = 1; wd <= 7; wd++) P.setWeekday(wd, P.BASE);
    return;
  }
  // Running the setup again changes the Weekend plan you have rather than making another.
  const id = P.plans().find((p) => p.id !== P.BASE && p.name === 'Weekend')?.id || P.create('Weekend').id;
  const t = { plan: id };
  const kind = (k) => P.blocksOf(t).find((b) => b.kind === k);
  if (valid(a.weekendWake) && kind('wake')) P.edit(t, kind('wake').id, { time: a.weekendWake }, { carry: true });
  if (valid(a.weekendBed) && kind('bed')) P.edit(t, kind('bed').id, { time: a.weekendBed }, { carry: true });
  const workWeekend = a.work && a.workDays.some((d) => d >= 6);
  if (!workWeekend && kind('work')) P.removeBlock(t, kind('work').id);
  P.setWeekday(6, id);
  P.setWeekday(7, id);
}

function training(a) {
  if (valid(a.trainTime)) D.setTime('trainTime', a.trainTime);
  if (a.training === 'programme') {
    const r = recommend(a.trainDays, a.where);
    if (r && PG.following()?.id !== r.id) PG.follow(r.id, { short: !!r.short });
  } else if (a.training === 'none') {
    if (PG.following()) PG.stop();
    store.setProfile({ plan: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null } });
    const b = D.blocks().find((x) => x.kind === 'train');
    if (b) D.remove(b.id);
  }
}

function focus(a) {
  const want = new Set(a.focus.slice(0, focusLimit()));
  const map = {};
  for (const h of activeHabits()) {
    const st = stateOf(h);
    if (want.has(h.id) && st !== 'focus') map[h.id] = 'focus';
    else if (!want.has(h.id) && st === 'focus') map[h.id] = 'queue';
  }
  // Out of focus first, so the limit holds at every step.
  const out = Object.fromEntries(Object.entries(map).filter(([, s]) => s === 'queue'));
  const inn = Object.fromEntries(Object.entries(map).filter(([, s]) => s === 'focus'));
  if (Object.keys(out).length) applyStates(out);
  if (Object.keys(inn).length) applyStates(inn);
}

function reminders(a) {
  const n = store.settings().notifications || {};
  const r = a.reminders;
  store.setSettings({ notifications: { ...n,
    morning: { ...(n.morning || {}), on: !!r.morning, time: shiftTime(a.wake, 5) },
    workout: { ...(n.workout || {}), on: !!r.workout && a.training !== 'none', time: shiftTime(a.trainTime, -5) },
    evening: { ...(n.evening || {}), on: !!r.evening, time: shiftTime(a.bed, -60) },
    weeklyReview: { ...(n.weeklyReview || {}), on: !!r.weekly, time: n.weeklyReview?.time || '19:00' },
  } });
}

/** Build your days from the answers. Returns an undo that puts everything back as it was. */
export async function apply(a) {
  const before = snapshot();
  try {
    const name = String(a.name || '').trim().slice(0, 40);
    if (name) store.setProfile({ name });
    setBaseTimes(a);
    if (a.days !== 'later') await weekPlans(a);
    training(a);
    focus(a);
    reminders(a);
    store.setSettings({ setupDone: today(), welcomed: true });
  } catch (err) {
    // Half a setup is worse than none: everything goes back as it was.
    restore(before);
    throw err;
  }
  return () => restore(before);
}
