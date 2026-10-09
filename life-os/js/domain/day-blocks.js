// Your day as blocks (Your plan › Your day): wake, prayer, mobility, training, work, the evening
// routine, lights out, and any plain block you add ("Breakfast"). A block is linked to the real thing
// behind it, and its time lives there: a habit's time, a routine's window, your profile's wake,
// training, work and bed times. So the plan, Today, the Now card and the reminders all read the same
// times. Changing a block writes to everything it's linked to, and the reminders that hang off
// those move by the same amount. Plain blocks keep their own time. The list is stored on the profile
// (`profile.day`); until you change it, it's built from your profile and habits.
import * as store from '../data/store.js';
import { parseHM, fmtHM } from './dates.js';
import { LINKED } from './reminder-rules.js';

const DAY = 1440;
const wrap = (m) => ((Math.round(m) % DAY) + DAY) % DAY;
const shift = (hm, mins) => fmtHM(wrap(parseHM(hm) + mins));
const HM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const validTime = (t) => HM.test(String(t || ''));
export const MAX_MINS = 16 * 60;
const cleanMins = (m, fallback = 15) => Math.max(0, Math.min(MAX_MINS, Math.round(Number.isFinite(Number(m)) && m !== '' && m != null ? Number(m) : fallback)));

const habit = (id) => { const h = id && store.get('habits', id); return h && !h.archived ? h : null; };
const routine = (id) => (id ? store.get('routines', id) || null : null);

/** The plan you start with: the workbook's day, linked to your own habits and times. */
export function defaults(p = store.profile()) {
  const wake = p.wakeTime || '06:00';
  const train = p.trainTime || '06:30';
  const bed = p.bedTime || '22:00';
  const list = [
    { id: 'b-wake', kind: 'wake', ref: 'h-morning-reset', label: 'Wake · morning reset', detail: 'Out of bed, water, make the bed, outdoor light, no social media for 30 minutes', mins: 15 },
    { id: 'b-prayer', kind: 'habit', ref: 'h-prayer', also: ['h-scripture'], label: 'Prayer & Scripture', detail: '5–10 minutes', time: shift(wake, 5), mins: 10 },
    { id: 'b-mobility', kind: 'habit', ref: 'h-mobility', label: 'Mobility & posture', detail: 'The mobility workout', time: shift(wake, 15), mins: 10 },
    { id: 'b-train', kind: 'train', ref: 'h-training', label: 'Training', detail: 'The session from your weekly plan', mins: 60 },
    { id: 'b-breakfast', kind: 'plain', label: 'Breakfast & prep', detail: 'Protein first: 30–40 g', time: shift(train, 90), mins: 30 },
    { id: 'b-work', kind: 'work', label: 'Work', detail: 'Top 3 before you start · 2–3 deep-work blocks · move every 45–60 min · 20-20-20 for the eyes' },
    { id: 'b-shutdown', kind: 'habit', ref: 'h-shutdown', also: ['h-fiancee'], label: 'Shutdown · then people', detail: 'What’s done, what remains, tomorrow’s first priority. Then your fiancée and family', time: p.workEnd || '20:00', mins: 15 },
    { id: 'b-evening', kind: 'habit', ref: 'h-evening', label: 'Evening routine', detail: 'Kit and clothes ready, tomorrow reviewed, hygiene, short prayer, gratitude', time: p.windDown || shift(bed, -60), mins: 30 },
    { id: 'b-quiet', kind: 'plain', label: 'Read / quiet', detail: 'Screens down for the last 30 minutes', time: shift(bed, -30), mins: 30 },
    { id: 'b-bed', kind: 'bed', ref: 'h-lights-out', label: 'Lights out', detail: '7.5–8.5 hours before the alarm', mins: 0 },
  ];
  // A habit block whose habit you've archived or deleted isn't part of your day.
  return list.filter((b) => b.kind !== 'habit' || habit(b.ref));
}

/** The stored list, or the starting one. */
const stored = () => (Array.isArray(store.profile().day) ? store.profile().day : defaults());

/** Where a block's time and length come from, read live. */
function resolve(b, p) {
  const h = habit(b.ref);
  switch (b.kind) {
    case 'wake': return { time: p.wakeTime || '06:00', mins: b.mins ?? 15 };
    case 'bed': return { time: p.bedTime || '22:00', mins: b.mins ?? 0 };
    case 'train': return { time: p.trainTime || '06:30', mins: b.mins ?? 60 };
    case 'work': {
      const from = p.workStart || '10:00';
      return { time: from, mins: wrap(parseHM(p.workEnd || '20:00') - parseHM(from)) };
    }
    case 'routine': {
      const r = routine(b.ref);
      if (!r?.window?.from) return { time: b.time || '12:00', mins: b.mins ?? 30 };
      return { time: r.window.from, mins: r.window.to ? wrap(parseHM(r.window.to) - parseHM(r.window.from)) : b.mins ?? 30 };
    }
    case 'habit': return { time: h?.time || b.time || '12:00', mins: b.mins ?? 15 };
    default: return { time: b.time || '12:00', mins: b.mins ?? 15 };
  }
}

/** A block's name: what you called it, or the name of the thing it's linked to. */
function titleOf(b) {
  if (b.label) return b.label;
  if (b.kind === 'routine') return routine(b.ref)?.name || 'Routine';
  if (b.kind === 'habit') return habit(b.ref)?.name || 'Habit';
  return { wake: 'Wake', bed: 'Lights out', train: 'Training', work: 'Work' }[b.kind] || 'Block';
}

/** What a block is linked to, in words, for the editor ("your wake time and Morning reset"). */
export function linkedTo(b) {
  const h = habit(b.ref);
  const names = [h?.name, ...(b.also || []).map((id) => habit(id)?.name)].filter(Boolean);
  const and = (list) => (list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0] || '');
  switch (b.kind) {
    case 'wake': return and(['your wake time', ...names]);
    case 'bed': return and(['your lights-out time', ...names]);
    case 'train': return and(['your training time', ...names]);
    case 'work': return 'your work hours';
    case 'routine': return `the ${routine(b.ref)?.name || 'routine'} routine’s window`;
    case 'habit': return and(names);
    default: return '';
  }
}

/** Minutes since the start of your day (the hours before waking belong to the night before). */
function sortKey(time, wake) { const m = parseHM(time); return m < wake - 180 ? m + DAY : m; }

/** Your day, in order: [{ ...block, time, mins, end, title }]. */
export function blocks() {
  const p = store.profile();
  const wake = parseHM(p.wakeTime || '06:00');
  return stored()
    .filter((b) => b && typeof b.id === 'string')
    .filter((b) => b.kind === 'plain' || b.kind === 'wake' || b.kind === 'bed' || b.kind === 'train' || b.kind === 'work' || (b.kind === 'routine' ? routine(b.ref) : habit(b.ref)))
    .map((b) => {
      // A synced or restored list is checked like anything typed: a time that isn't one reads as noon.
      const r = resolve(b, p);
      const time = validTime(r.time) ? r.time : '12:00';
      const mins = cleanMins(r.mins, 15);
      return { ...b, time, mins, end: shift(time, mins), title: titleOf(b) };
    })
    .sort((a, b) => sortKey(a.time, wake) - sortKey(b.time, wake) || (a.kind === 'wake' ? -1 : b.kind === 'wake' ? 1 : 0));
}
export const block = (id) => blocks().find((b) => b.id === id) || null;

/* ---------- writes ---------- */

/** Everything a change can touch, as it is now, so one Undo puts it all back. */
function snapshot(extra = []) {
  const ids = new Set(extra.filter(Boolean));
  for (const b of stored()) { if (b.ref) ids.add(b.ref); (b.also || []).forEach((id) => ids.add(id)); }
  return [
    { store: 'profile', value: store.profile() },
    { store: 'settings', value: store.settings() },
    ...[...ids].map((id) => store.get('habits', id)).filter(Boolean).map((value) => ({ store: 'habits', value })),
    ...store.all('routines').map((value) => ({ store: 'routines', value })),
  ];
}
const undoTo = (before) => () => store.batch(before.map((op) => ({ ...op })));

/** Collects the writes of one change, so they land together. */
function writer() {
  const profile = { ...store.profile() };
  const settings = { ...store.settings(), notifications: { ...(store.settings().notifications || {}) } };
  const habits = new Map();
  const routines = new Map();
  const h = (id) => { if (!habits.has(id)) { const x = habit(id); if (x) habits.set(id, { ...x }); } return habits.get(id); };
  const r = (id) => { if (!routines.has(id)) { const x = routine(id); if (x) routines.set(id, { ...x, window: { ...(x.window || {}) }, steps: [...(x.steps || [])] }); } return routines.get(id); };
  /** Move a habit by a number of minutes: its time, its reminder, its named reminder, and the old time in its words. */
  const moveHabit = (id, delta) => {
    const x = h(id);
    if (!x || !delta) return;
    const from = x.time;
    if (x.time) x.time = shift(x.time, delta);
    if (x.reminder) x.reminder = shift(x.reminder, delta);
    if (from && x.time && from !== x.time) {
      // "Lights out by 22:00", "Out of bed at 06:00": the old time in its words moves with it.
      x.name = x.name.replaceAll(from, x.time);
      if (Array.isArray(x.checklist)) x.checklist = x.checklist.map((s) => (typeof s === 'string' ? s.replaceAll(from, x.time) : s));
      if (x.description) x.description = x.description.replaceAll(from, x.time);
    }
    for (const [cat, hid] of Object.entries(LINKED)) {
      const n = settings.notifications[cat];
      if (hid === id && n?.time) settings.notifications[cat] = { ...n, time: shift(n.time, delta) };
    }
  };
  /**
   * Routines follow the day: a moved habit that now falls outside its routine's window joins the
   * routine whose window it falls in, and a routine's habit steps run in time order (a plain step
   * stays after the step it followed).
   */
  const arrange = () => {
    const moved = [...habits.values()].filter((x) => x.time && x.time !== habit(x.id)?.time).map((x) => x.id);
    if (!moved.length) return;
    const timeOf = (id) => (habits.get(id) || habit(id))?.time;
    const win = (rt) => (routines.get(rt.id) || rt).window || {};
    const inside = (rt, t) => {
      const { from, to } = win(rt);
      if (!from || !to) return false;
      const [a, b, m] = [parseHM(from), parseHM(to), parseHM(t)];
      return a <= b ? m >= a && m <= b : m >= a || m <= b;
    };
    const live = store.all('routines').filter((rt) => !rt.archived);
    for (const id of moved) {
      const home = live.find((rt) => ((routines.get(rt.id) || rt).steps || []).some((st) => st.habitId === id));
      if (!home || inside(home, timeOf(id))) continue;
      const to = live.find((rt) => rt.id !== home.id && inside(rt, timeOf(id)));
      if (!to) continue;
      const from = r(home.id);
      const step = from.steps.find((st) => st.habitId === id);
      from.steps = from.steps.filter((st) => st !== step);
      const dest = r(to.id);
      dest.steps = [...(dest.steps || []), step];
    }
    const wake = parseHM(profile.wakeTime || '06:00');
    for (const rt of live) {
      if (!((routines.get(rt.id) || rt).steps || []).some((st) => moved.includes(st.habitId))) continue;
      const steps = r(rt.id).steps;
      let key = -1;
      const keyed = steps.map((st, i) => {
        const t = st.habitId && timeOf(st.habitId);
        if (t && validTime(t)) key = sortKey(t, wake);
        return { st, key, i };
      });
      r(rt.id).steps = keyed.sort((a, b) => a.key - b.key || a.i - b.i).map((x, i) => ({ ...x.st, order: i }));
    }
  };
  return {
    profile, settings, h, r, moveHabit,
    commit(day) {
      arrange();
      store.batch([
        { store: 'profile', value: { ...profile, day } },
        { store: 'settings', value: settings },
        ...[...habits.values()].map((value) => ({ store: 'habits', value })),
        ...[...routines.values()].map((value) => ({ store: 'routines', value })),
      ]);
    },
  };
}

/** Move one block by `delta` minutes inside a change: everything it's linked to moves with it. */
function moveBlock(w, day, b, delta) {
  if (!delta) return;
  const p = w.profile;
  const moveKey = (key, fallback) => { p[key] = shift(p[key] || fallback, delta); };
  switch (b.kind) {
    case 'wake': moveKey('wakeTime', '06:00'); break;
    case 'bed': moveKey('bedTime', '22:00'); break;
    case 'train': moveKey('trainTime', '06:30'); break;
    case 'work': moveKey('workStart', '10:00'); moveKey('workEnd', '20:00'); break;
    case 'routine': {
      const r = w.r(b.ref);
      if (r?.window?.from) { r.window.from = shift(r.window.from, delta); if (r.window.to) r.window.to = shift(r.window.to, delta); }
      break;
    }
    default: break;
  }
  if (b.kind !== 'routine' && b.kind !== 'plain' && b.kind !== 'work') {
    const x = w.h(b.ref);
    // A habit without a time gets this block's time; one with a time moves by the same amount.
    if (x && !x.time) x.time = shift(b.time, delta);
    else w.moveHabit(b.ref, delta);
    (b.also || []).forEach((id) => w.moveHabit(id, delta));
  }
  const i = day.findIndex((x) => x.id === b.id);
  if (i >= 0 && (b.kind === 'plain' || (b.kind === 'habit' && !w.h(b.ref)))) day[i] = { ...day[i], time: shift(b.time, delta) };
  if (b.kind === 'wake' || b.kind === 'train') {
    const cat = b.kind === 'wake' ? 'morning' : 'workout';
    // The morning check-in and the training reminder follow wake and training even when no habit is linked.
    if (!w.h(b.ref) || LINKED[cat] !== b.ref) {
      const n = w.settings.notifications[cat];
      if (n?.time) w.settings.notifications[cat] = { ...n, time: shift(n.time, delta) };
    }
  }
}

/** The blocks that belong to the morning (after waking, before work) or the evening (after work, before bed). */
export function partOf(which, list = blocks()) {
  const p = store.profile();
  const workStart = parseHM(p.workStart || '10:00');
  const workEnd = parseHM(p.workEnd || '20:00');
  const wake = parseHM(p.wakeTime || '06:00');
  return list.filter((b) => {
    if (b.kind === 'wake' || b.kind === 'bed' || b.kind === 'work') return false;
    const k = sortKey(b.time, wake);
    return which === 'morning' ? k >= wake && k < workStart : k >= workEnd && k < sortKey(p.bedTime || '22:00', wake) + 1;
  });
}

/**
 * Change a block's time and/or length. With `carry`, moving wake carries the morning with it and
 * moving lights out carries the evening. Returns an undo.
 */
export function edit(id, { time, mins, label, detail } = {}, { carry = false } = {}) {
  const b = block(id);
  if (!b) return () => {};
  const before = snapshot();
  const w = writer();
  const day = stored().map((x) => ({ ...x }));
  const at = day.findIndex((x) => x.id === id);
  if (at < 0) return () => {};
  const delta = validTime(time) ? parseHM(time) - parseHM(b.time) : 0;
  const carried = carry && delta && (b.kind === 'wake' || b.kind === 'bed') ? partOf(b.kind === 'wake' ? 'morning' : 'evening') : [];
  moveBlock(w, day, b, delta);
  for (const c of carried) moveBlock(w, day, c, delta);
  if (carry && delta) {
    // The routines of that part of the day open and close with it.
    const p = store.profile();
    const workStart = parseHM(p.workStart || '10:00');
    const workEnd = parseHM(p.workEnd || '20:00');
    for (const r of store.all('routines')) {
      if (!r.window?.from || day.some((x) => x.kind === 'routine' && x.ref === r.id && carried.some((c) => c.id === x.id))) continue;
      const from = parseHM(r.window.from);
      const morning = from < workStart;
      if ((b.kind === 'wake' && morning) || (b.kind === 'bed' && from >= workEnd)) {
        const x = w.r(r.id);
        x.window.from = shift(x.window.from, delta);
        if (x.window.to) x.window.to = shift(x.window.to, delta);
      }
    }
  }
  if (mins != null && mins !== '') {
    const m = cleanMins(mins, b.mins);
    if (b.kind === 'work') w.profile.workEnd = shift(w.profile.workStart, m);
    else if (b.kind === 'routine') { const r = w.r(b.ref); if (r?.window?.from) r.window.to = shift(r.window.from, m); }
    day[at] = { ...day[at], mins: m };
  }
  if (label != null) day[at] = { ...day[at], label: String(label).trim().slice(0, 60) || (b.kind === 'plain' ? 'Block' : '') };
  if (detail != null) day[at] = { ...day[at], detail: String(detail).trim().slice(0, 200) };
  w.commit(day.map(strip));
  return undoTo(before);
}

/** Only what's stored: live times come from what a block is linked to. */
function strip(b) {
  const out = { id: b.id, kind: b.kind };
  if (b.ref) out.ref = b.ref;
  if (b.also?.length) out.also = b.also;
  if (b.label) out.label = b.label;
  if (b.detail) out.detail = b.detail;
  if (b.mins != null && b.kind !== 'work' && b.kind !== 'routine') out.mins = b.mins;
  if (b.kind === 'plain' || b.kind === 'habit' || b.kind === 'routine') { if (b.time) out.time = b.time; }
  return out;
}

/**
 * A block dragged to a new place in the list. It starts when the block now before it ends (or ends
 * when the one after it starts, at the top), and everything it's linked to moves with it.
 */
export function move(from, to) {
  const list = blocks();
  const b = list[from];
  if (!b || from === to || to < 0 || to >= list.length) return () => {};
  const rest = list.filter((_, i) => i !== from);
  const prev = rest[to - 1];
  const next = rest[to];
  const time = prev ? prev.end : next ? shift(next.time, -(b.mins || 15)) : b.time;
  return edit(b.id, { time });
}

/**
 * Add a block: { kind: 'habit' | 'routine' | 'plain' | 'train' | 'work', ref?, label?, time, mins }.
 * A habit, routine, training or work is put at the time chosen, and what it's linked to moves there.
 * Returns { id, undo }.
 */
export function add({ kind, ref, label, time, mins }) {
  const KINDS = ['habit', 'routine', 'plain', 'train', 'work'];
  if (!KINDS.includes(kind)) kind = 'plain';
  if (kind === 'train' && !ref && habit(LINKED.workout)) ref = LINKED.workout;
  const before = snapshot([ref]);
  const day = stored().map((x) => ({ ...x }));
  const id = `b-${store.uid()}`;
  const b = { id, kind, mins: cleanMins(mins, 15) };
  if (ref) b.ref = ref;
  if (label && kind === 'plain') b.label = String(label).trim().slice(0, 60);
  if (kind === 'plain' || kind === 'habit' || kind === 'routine') b.time = validTime(time) ? time : '12:00';
  day.push(b);
  store.setProfile({ day: day.map(strip) });
  if (kind !== 'plain' && validTime(time)) {
    // A habit without a time takes the block's; one with a time, and the rest, move to it.
    if (kind === 'habit' && habit(ref) && !habit(ref).time) store.update('habits', ref, { time });
    if (kind === 'routine') {
      const r = routine(ref);
      if (r && !r.window?.from) store.put('routines', { ...r, window: { from: time, to: shift(time, b.mins || 30) } });
    }
    edit(id, { time, mins });
  }
  return { id, undo: undoTo(before) };
}

/** Take a block out of your day (the habit or routine itself stays). Wake and lights out stay. Returns an undo. */
export function remove(id) {
  const b = stored().find((x) => x.id === id) || block(id);
  if (!b || b.kind === 'wake' || b.kind === 'bed') return () => {};
  const before = snapshot();
  const w = writer();
  w.commit(stored().filter((x) => x.id !== id).map(strip));
  return undoTo(before);
}

/**
 * One of your profile times changed from Settings or Training: it moves what it's linked to, the
 * same as changing its block. Returns an undo.
 */
export function setTime(key, value) {
  if (!validTime(value)) return () => {};
  const KIND = { wakeTime: 'wake', trainTime: 'train', bedTime: 'bed', workStart: 'work', workEnd: 'work' };
  const b = blocks().find((x) => x.kind === KIND[key]);
  if (!b) { const before = snapshot(); store.setProfile({ [key]: value }); return undoTo(before); }
  if (key === 'workEnd') return edit(b.id, { mins: wrap(parseHM(value) - parseHM(b.time)) });
  return edit(b.id, { time: value });
}

/** Back to the day you started with (your times stay as they are). */
export function reset() {
  const before = snapshot();
  store.setProfile({ day: null });
  return undoTo(before);
}

/** What can still be added: active habits and routines not in your day yet, and the anchors you removed. */
export function addable() {
  const list = stored();
  const used = new Set(list.flatMap((b) => [b.ref, ...(b.also || [])]).filter(Boolean));
  const kinds = new Set(list.map((b) => b.kind));
  return {
    habits: store.all('habits').filter((h) => !h.archived && !used.has(h.id)).sort((a, b) => (a.time || '99').localeCompare(b.time || '99') || a.name.localeCompare(b.name)),
    routines: store.all('routines').filter((r) => !r.archived && !list.some((b) => b.kind === 'routine' && b.ref === r.id)),
    train: !kinds.has('train'),
    work: !kinds.has('work'),
  };
}
