// Your days (day plans): your day isn't the same every day, so it can have more than one plan. The
// plan you have now is "Every day" (the base plan: its times live on the habits, routines and your
// profile, as they always have, see day-blocks.js). Other plans ("Long day", "Short day",
// "Saturday") keep their own block times. Each weekday has a plan, and any date can use another
// plan or be adjusted on its own.
//
// Everything asks the same question, "what's the plan for this date?" (`on(date)`), and gets that
// day's wake, training, work and lights-out times, each habit's time and reminder, and each
// routine's window. So Today, the Now card, the routines, the reminders, the calendar file and the
// score all follow the plan of the day. A habit that's in some plan but not in this date's plan
// isn't expected that day. With only "Every day", nothing changes from how it always worked.
//
// Stored on the profile, so backups and sync carry it: `dayPlans` [{ id, name, blocks }],
// `week` { 1–7: planId }, `planDates` { date: { plan, blocks? } }, `basePlanName`.
import * as store from '../data/store.js';
import * as D from './day-blocks.js';
import { LINKED } from './reminder-links.js';
import { register, inUse as coreInUse, BASE as CORE_BASE } from './day-plans-core.js';
import { today, addDays, weekday, parseHM, fmtHM } from './dates.js';

export const BASE = CORE_BASE;
const DAY = 1440;
const wrap = (m) => ((Math.round(m) % DAY) + DAY) % DAY;
const shift = (hm, mins) => fmtHM(wrap(parseHM(hm) + mins));
/** b − a in minutes, the short way round the clock (so 23:30 → 00:15 is +45, not −1395). */
const diff = (b, a) => { const d = wrap(parseHM(b) - parseHM(a)); return d > DAY / 2 ? d - DAY : d; };
const KEEP_DAYS = 45; // adjusted dates further back than this are tidied away

const profile = () => store.profile() || {};
const extra = () => (Array.isArray(profile().dayPlans) ? profile().dayPlans : []);
const habit = (id) => { const h = id && store.get('habits', id); return h && !h.archived ? h : null; };
const refsOf = (b) => [b.ref, ...(b.also || [])].filter(Boolean);
const HABIT_KINDS = new Set(['habit', 'wake', 'bed', 'train']);

/** Every plan: "Every day" first, then yours. [{ id, name, base? }] */
export function plans() {
  return [{ id: BASE, name: profile().basePlanName || 'Every day', base: true }, ...extra().map((p) => ({ id: p.id, name: p.name }))];
}
export const plan = (id) => plans().find((p) => p.id === id) || null;
export const nameOf = (id) => plan(id)?.name || plans()[0].name;
/** More than one plan, or any date adjusted: the days can differ. */
export const inUse = coreInUse;

/** The plan each weekday follows: { 1: id, …, 7: id }. */
export function week() {
  const w = profile().week || {};
  const ids = new Set(plans().map((p) => p.id));
  return Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((d) => [d, ids.has(w[d]) ? w[d] : BASE]));
}
const dated = (date) => profile().planDates?.[date] || null;
/** The plan a date follows (its own choice, or its weekday's). */
export function planIdFor(date) {
  const d = dated(date);
  if (d?.plan && plan(d.plan)) return d.plan;
  return week()[weekday(date)];
}
/** Whether a date has its own adjusted blocks. */
export const adjusted = (date) => Array.isArray(dated(date)?.blocks);

/** The stored blocks of a target: { plan } or { date }. For the base plan it's the live list. */
function storedOf(target) {
  if (target.date) {
    if (adjusted(target.date)) return dated(target.date).blocks;
    return storedOf({ plan: planIdFor(target.date) });
  }
  if (!target.plan || target.plan === BASE) return null;
  return extra().find((p) => p.id === target.plan)?.blocks || [];
}

/** The blocks of a plan or a date, in order, each with its time, length and title. */
export function blocksOf(target) {
  const s = storedOf(target);
  return s ? D.materialize(s) : D.blocks();
}
export const blocksOn = (date = today()) => blocksOf({ date });

/** A plan's blocks as stored, with every time written out (a copy of the base plan, or of another). */
const explicit = (list) => list.map((b) => {
  const out = { id: b.id, kind: b.kind, time: b.time, mins: b.mins };
  if (b.ref) out.ref = b.ref;
  if (b.also?.length) out.also = [...b.also];
  if (b.label) out.label = b.label;
  if (b.detail) out.detail = b.detail;
  return out;
});

/* ---------- what a date's plan means for everything else ---------- */

/**
 * A plan's times against the base plan's: { plan, profile, habit: Map(id → shift in minutes),
 * time: Map(id → its time), routine: Map(id → { from, to }), cat: { morning, evening, workout }
 * shifts, train, work }. `null` for the base plan itself (everything is as stored).
 */
function compare(list) {
  const p = profile();
  const base = D.blocks();
  const byId = new Map(base.map((b) => [b.id, b]));
  const twin = (b) => byId.get(b.id) || (b.kind !== 'plain' && base.find((x) => x.kind === b.kind && x.ref === b.ref)) || null;
  const out = { profile: { ...p }, habit: new Map(), time: new Map(), routine: new Map(), cat: { morning: 0, evening: 0, workout: 0 }, train: false, work: false };
  for (const b of D.materialize(list)) {
    const bb = twin(b);
    if (b.kind === 'wake') { out.profile.wakeTime = b.time; out.cat.morning = diff(b.time, p.wakeTime || '06:00'); }
    if (b.kind === 'bed') out.profile.bedTime = b.time;
    if (b.kind === 'train') { out.train = true; out.profile.trainTime = b.time; out.cat.workout = diff(b.time, p.trainTime || '06:30'); }
    if (b.kind === 'work') { out.work = true; out.profile.workStart = b.time; out.profile.workEnd = shift(b.time, b.mins); }
    if (b.kind === 'routine' && b.ref) out.routine.set(b.ref, { from: b.time, to: shift(b.time, b.mins || 30) });
    if (HABIT_KINDS.has(b.kind)) {
      const delta = bb ? diff(b.time, bb.time) : null;
      refsOf(b).forEach((id, i) => {
        const h = habit(id);
        if (!h) return;
        // The block's own habit starts with the block; one riding along moves by the same amount.
        const d = delta ?? (h.time ? diff(b.time, h.time) : 0);
        out.habit.set(id, d);
        out.time.set(id, i === 0 || !h.time ? b.time : shift(h.time, d));
      });
    }
  }
  if (!out.train) out.profile.trainTime = p.trainTime;
  out.cat.evening = out.habit.get(LINKED.evening) ?? 0;
  return out;
}

/** Habits that are in any plan (or any adjusted date). */
function plannedHabits() {
  return store.memo('plans-habits', ['profile', 'habits', 'routines'], () => {
    const set = new Set();
    const add = (list) => list.forEach((b) => { if (HABIT_KINDS.has(b.kind)) refsOf(b).forEach((id) => set.add(id)); });
    add(D.blocks());
    extra().forEach((p) => add(p.blocks || []));
    Object.values(profile().planDates || {}).forEach((d) => add(d.blocks || []));
    return set;
  });
}

/**
 * What the plan for a date means: { plan, name, base, profile, habitTime(h), reminder(h), window(r),
 * cat(key, time), out(habitId), train, work }. Cheap when nothing differs.
 */
export function on(date = today()) {
  return store.memo(`plan-on:${date}`, ['profile', 'habits', 'routines'], () => {
    const id = planIdFor(date);
    const name = adjusted(date) ? `${nameOf(id)} · adjusted` : nameOf(id);
    return judge(storedOf({ date }), id, name);
  });
}

/** The same for a plan on its own (any day that follows it, with no date of its own). */
export function onPlan(id) {
  return store.memo(`plan-of:${id}`, ['profile', 'habits', 'routines'], () => judge(storedOf({ plan: id }), id, nameOf(id)));
}

function judge(list, id, name) {
  if (!list) {
    // The base plan: times as stored. A habit only in other plans isn't expected that day.
    const mine = new Set(D.blocks().flatMap((b) => (HABIT_KINDS.has(b.kind) ? refsOf(b) : [])));
    const others = inUse() ? [...plannedHabits()].filter((h) => !mine.has(h)) : [];
    return view({ plan: id, name, base: true, profile: profile(), habit: new Map(), time: new Map(), routine: new Map(), cat: { morning: 0, evening: 0, workout: 0 }, train: true, work: true, others: new Set(others) });
  }
  const c = compare(list);
  const mine = new Set(c.habit.keys());
  return view({ ...c, plan: id, name, base: false, others: new Set([...plannedHabits()].filter((h) => !mine.has(h))) });
}

function view(o) {
  return {
    plan: o.plan, name: o.name, base: o.base, profile: o.profile, train: o.train, work: o.work,
    /** The habit's time that day (or its usual time when the plan doesn't place it). */
    habitTime: (h) => (h ? o.time.get(h.id) || (h.time && o.habit.has(h.id) ? shift(h.time, o.habit.get(h.id)) : h.time) || null : null),
    /** The habit's reminder that day: it moves with the habit. */
    reminder: (h) => (h?.reminder ? shift(h.reminder, o.habit.get(h.id) || 0) : null),
    /** A routine's window that day. */
    window: (r) => o.routine.get(r?.id) || r?.window || null,
    /** A ritual reminder's time that day (morning follows wake, workout training, evening its habit). */
    cat: (key, time) => (time && o.cat[key] ? shift(time, o.cat[key]) : time),
    /** True when this habit has its place in other plans but not in this day's. */
    out: (habitId) => o.others.has(habitId),
  };
}

/** Whether a habit isn't expected on a date because that day's plan leaves it out. */
export const outOfPlan = (habitId, date) => inUse() && on(date).out(habitId);

/** How much of a plan is free: awake time, what's planned, and what's left, in minutes. */
export function freeTime(target) {
  const list = blocksOf(target);
  const wake = list.find((b) => b.kind === 'wake');
  const bed = list.find((b) => b.kind === 'bed');
  if (!wake || !bed) return null;
  const awake = wrap(parseHM(bed.time) - parseHM(wake.time));
  // Count each minute once, however the blocks overlap.
  const used = new Set();
  for (const b of list) {
    if (b.kind === 'bed' || !b.mins) continue;
    const from = D.dayMinutes(b.time);
    for (let m = 0; m < b.mins; m++) used.add(from + m);
  }
  const start = D.dayMinutes(wake.time);
  const planned = [...used].filter((m) => m >= start && m < start + awake).length;
  return { awake, planned, free: Math.max(0, awake - planned) };
}

/* ---------- changes ---------- */

const snapshot = () => [{ store: 'profile', value: store.profile() }];
const undoTo = (before) => () => store.batch(before.map((op) => ({ ...op })));
/** Adjusted dates long gone are tidied on every change. */
function tidyDates(dates) {
  const from = addDays(today(), -KEEP_DAYS);
  return Object.fromEntries(Object.entries(dates || {}).filter(([d]) => d >= from));
}
function save(patch) {
  const p = profile();
  store.setProfile({ ...patch, planDates: tidyDates(patch.planDates ?? p.planDates) });
}

/** A new plan, copied from another (the base plan by default). Returns { id, undo }. */
export function create(name, from = BASE) {
  const before = snapshot();
  const id = `dp-${store.uid()}`;
  const blocks = explicit(blocksOf({ plan: from }));
  save({ dayPlans: [...extra(), { id, name: String(name || 'New plan').trim().slice(0, 40) || 'New plan', blocks }] });
  return { id, undo: undoTo(before) };
}

export function rename(id, name) {
  const n = String(name || '').trim().slice(0, 40);
  if (!n) return () => {};
  const before = snapshot();
  if (id === BASE) save({ basePlanName: n });
  else save({ dayPlans: extra().map((p) => (p.id === id ? { ...p, name: n } : p)) });
  return undoTo(before);
}

/** Delete a plan: the days that used it go back to Every day. Returns an undo. */
export function remove(id) {
  if (id === BASE) return () => {};
  const before = snapshot();
  const w = { ...(profile().week || {}) };
  for (const k of Object.keys(w)) if (w[k] === id) delete w[k];
  const dates = Object.fromEntries(Object.entries(profile().planDates || {}).filter(([, v]) => v.plan !== id));
  save({ dayPlans: extra().filter((p) => p.id !== id), week: w, planDates: dates });
  return undoTo(before);
}

/** The plan a weekday follows. */
export function setWeekday(wd, id) {
  const before = snapshot();
  save({ week: { ...(profile().week || {}), [wd]: plan(id) ? id : BASE } });
  return undoTo(before);
}

/** The plan one date follows (null: back to its weekday's). Adjustments for that date go. */
export function setDate(date, id) {
  const before = snapshot();
  const dates = { ...(profile().planDates || {}) };
  if (!id || id === week()[weekday(date)]) delete dates[date];
  else dates[date] = { plan: id };
  save({ planDates: dates });
  return undoTo(before);
}

/** Give a date its own copy of its plan, to change for that date only. */
export function adjust(date) {
  if (adjusted(date)) return () => {};
  const before = snapshot();
  const dates = { ...(profile().planDates || {}) };
  dates[date] = { plan: planIdFor(date), blocks: explicit(blocksOn(date)) };
  save({ planDates: dates });
  return undoTo(before);
}

/** Write a plan's or a date's blocks. */
function writeList(target, list) {
  if (target.date) {
    const dates = { ...(profile().planDates || {}) };
    dates[target.date] = { plan: planIdFor(target.date), blocks: explicit(list) };
    save({ planDates: dates });
    return;
  }
  save({ dayPlans: extra().map((p) => (p.id === target.plan ? { ...p, blocks: explicit(list) } : p)) });
}

/** The base plan is the linked day (day-blocks.js); a target that isn't goes through here. */
const isBase = (target) => !target.date && (!target.plan || target.plan === BASE);

/** Change a block's time, length, name or note in a plan or on a date. Returns an undo. */
export function edit(target, id, patch = {}, opts = {}) {
  if (isBase(target)) return D.edit(id, patch, opts);
  if (target.date && !adjusted(target.date)) adjust(target.date);
  const list = blocksOf(target).map((b) => ({ ...b }));
  const b = list.find((x) => x.id === id);
  if (!b) return () => {};
  const before = snapshot();
  if (D.validTime(patch.time)) {
    const delta = diff(patch.time, b.time);
    b.time = patch.time;
    // Waking earlier or later carries the morning with it (and lights out the evening), if asked.
    if (opts.carry && delta && (b.kind === 'wake' || b.kind === 'bed')) {
      const part = new Set(D.partOf(b.kind === 'wake' ? 'morning' : 'evening', blocksOf(target)).map((x) => x.id));
      list.forEach((x) => { if (part.has(x.id)) x.time = shift(x.time, delta); });
    }
  }
  if (patch.mins != null && patch.mins !== '') b.mins = Math.max(0, Math.min(D.MAX_MINS, Math.round(Number(patch.mins) || 0)));
  if (patch.label != null) b.label = String(patch.label).trim().slice(0, 60) || (b.kind === 'plain' ? 'Block' : '');
  if (patch.detail != null) b.detail = String(patch.detail).trim().slice(0, 200);
  writeList(target, list);
  return undoTo(before);
}

/** Drag a block to a new place: it starts when the one before it ends. */
export function move(target, from, to) {
  if (isBase(target)) return D.move(from, to);
  const list = blocksOf(target);
  const b = list[from];
  if (!b || from === to || to < 0 || to >= list.length) return () => {};
  const rest = list.filter((_, i) => i !== from);
  const prev = rest[to - 1];
  const next = rest[to];
  const time = prev ? prev.end : next ? shift(next.time, -(b.mins || 15)) : b.time;
  return edit(target, b.id, { time });
}

/** Add a block to a plan or a date. Returns { id, undo }. */
export function add(target, { kind, ref, label, time, mins }) {
  if (isBase(target)) return D.add({ kind, ref, label, time, mins });
  if (target.date && !adjusted(target.date)) adjust(target.date);
  const before = snapshot();
  const KINDS = ['habit', 'routine', 'plain', 'train', 'work'];
  if (!KINDS.includes(kind)) kind = 'plain';
  if (kind === 'train' && !ref && habit(LINKED.workout)) ref = LINKED.workout;
  const id = `b-${store.uid()}`;
  const b = { id, kind, time: D.validTime(time) ? time : '12:00', mins: Math.max(0, Math.min(D.MAX_MINS, Math.round(Number(mins) || 15))) };
  if (ref) b.ref = ref;
  if (label && kind === 'plain') b.label = String(label).trim().slice(0, 60);
  writeList(target, [...blocksOf(target), b]);
  return { id, undo: undoTo(before) };
}

/** Take a block out of a plan or a date (wake and lights out stay). Returns an undo. */
export function removeBlock(target, id) {
  if (isBase(target)) return D.remove(id);
  const list = blocksOf(target);
  const b = list.find((x) => x.id === id);
  if (!b || b.kind === 'wake' || b.kind === 'bed') return () => {};
  if (target.date && !adjusted(target.date)) adjust(target.date);
  const before = snapshot();
  writeList(target, blocksOf(target).filter((x) => x.id !== id));
  return undoTo(before);
}

/** What can still be added to a plan or a date. */
export function addable(target) {
  if (isBase(target)) return D.addable();
  const list = blocksOf(target);
  const used = new Set(list.flatMap(refsOf));
  const kinds = new Set(list.map((b) => b.kind));
  return {
    habits: store.all('habits').filter((h) => !h.archived && !used.has(h.id)).sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || a.name.localeCompare(b.name)),
    routines: store.all('routines').filter((r) => !r.archived && !list.some((b) => b.kind === 'routine' && b.ref === r.id)),
    train: !kinds.has('train'),
    work: !kinds.has('work'),
  };
}

/** The next `n` days from a date: [{ date, plan, name, adjusted, chosen }]. */
export function ahead(from = today(), n = 14) {
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(from, i);
    const id = planIdFor(date);
    return { date, plan: id, name: nameOf(id), adjusted: adjusted(date), chosen: !!dated(date)?.plan && dated(date).plan !== week()[weekday(date)] };
  });
}

// The first screen's core (day-plans-core.js) answers with these rules from now on.
register({ on });
