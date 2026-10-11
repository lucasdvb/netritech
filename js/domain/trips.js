// Trips: where, when, the travel plan, the packing list, and how your days run while you're away.
// A trip can be time off (its days are marked away, so nothing counts as missed and runs and scores
// skip them) or a working trip on a Travel day plan (habits carry on in their travel form). Its
// reminders can pause. Packing starts from a template that fits the trip (nights, training, work,
// beach, cold), and the travel legs and "pack" go on your tasks on their days. Planning a trip ahead,
// with a packing list, is the kind of "if-then" preparation that keeps habits alive on the road
// (Gollwitzer & Sheeran 2006).
import * as store from '../data/store.js';
import { today, addDays, diffDays, range } from './dates.js';
import * as L from './lists.js';

export const MODES = [
  { id: 'away', label: 'Time off', hint: 'The days are marked away: nothing counts as missed.' },
  { id: 'travel', label: 'Travel plan', hint: 'A Travel day plan on these dates; habits carry on, lighter.' },
  { id: 'normal', label: 'As usual', hint: 'Your days stay as they are.' },
];
export const FLAGS = [
  ['train', 'Training'], ['work', 'Work'], ['beach', 'Beach or pool'], ['cold', 'Cold weather'], ['formal', 'Something smart'],
];

export const all = () => store.memo('trips-sorted', ['trips'], () => store.all('trips').sort((a, b) => String(a.from).localeCompare(String(b.from))));
export const trip = (id) => store.get('trips', id) || null;
export const nights = (t) => Math.max(0, diffDays(t.to, t.from));
/** The trip on a date (the first, if two overlap). */
export const on = (date = today()) => all().find((t) => t.from <= date && date <= t.to) || null;
export const upcoming = (from = today()) => all().filter((t) => t.to >= from);
export const past = (from = today()) => all().filter((t) => t.to < from).reverse();

/** Are reminders paused on a date (a trip that pauses them)? */
export const remindersPaused = (date = today()) => !!on(date)?.pause;

/** The packing list a trip starts with. */
export function packingFor(t) {
  const n = Math.max(1, nights(t));
  const f = new Set(t.flags || []);
  const clothes = Math.min(n, 7);
  const items = [
    'Passport / ID', 'Tickets and bookings', 'Phone + charger', 'Wallet, cards, some cash',
    `${clothes} × underwear and socks`, `${Math.ceil(clothes / 2)} × tops`, `${Math.max(1, Math.ceil(clothes / 3))} × trousers or shorts`,
    'Sleepwear', 'Toothbrush, toothpaste', 'Deodorant, skincare', 'Medication and supplements (enough + 2 days)', 'Water bottle', 'Headphones',
  ];
  if (n > 3) items.push('Laundry bag');
  if (f.has('train')) items.push('Training shoes', 'Training clothes × 2', 'Resistance band');
  if (f.has('work')) items.push('Laptop + charger', 'Adapter', 'Notebook');
  if (f.has('beach')) items.push('Swimwear', 'Sunscreen', 'Sunglasses', 'Flip-flops');
  if (f.has('cold')) items.push('Warm jacket', 'Jumper', 'Scarf, gloves');
  if (f.has('formal')) items.push('Smart outfit', 'Smart shoes');
  return items;
}

/**
 * What an action changed, so its undo puts back exactly those records (and nothing written since by
 * anyone else). `note` before each write; the profile keeps only the date entries a trip touched.
 */
function journal() {
  const seen = new Map();
  const dates = new Map();
  const note = (s, id) => { const k = `${s}\u0000${id}`; if (!seen.has(k)) { const r = store.get(s, id); seen.set(k, { s, id, was: r ? { ...r } : null }); } };
  const noteDate = (d) => { if (!dates.has(d)) dates.set(d, store.profile().planDates?.[d]); };
  const undo = () => {
    const ops = [...seen.values()].map(({ s, id, was }) => (was ? { store: s, value: was } : { store: s, delete: id }));
    if (dates.size) {
      const p = store.profile();
      const pd = { ...(p.planDates || {}) };
      for (const [d, v] of dates) { if (v) pd[d] = v; else delete pd[d]; }
      ops.push({ store: 'profile', value: { ...p, planDates: pd } });
    }
    if (ops.length) store.batch(ops);
  };
  return { note, noteDate, undo };
}

/** A leg keeps its id when legs before it are removed, so its task (and whether it's done) stays with it. */
const legId = () => Math.random().toString(36).slice(2, 8);

/**
 * Save a trip and set it up: the packing list (first time), its days (away or a Travel plan), the
 * "pack" task and its travel legs as tasks. Returns { trip, undo }; the undo touches only what this did.
 */
export async function save(id, patch) {
  const cur = id ? trip(id) : null;
  const t = { mode: 'away', pause: false, flags: [], legs: [], ...cur, ...patch };
  t.name = String(t.name || t.where || 'Trip').trim().slice(0, 60) || 'Trip';
  if (!t.from) t.from = today();
  if (!t.to || t.to < t.from) t.to = t.from;
  t.legs = (t.legs || []).map((l) => ({ ...l, id: l.id || legId() }));
  t.id = t.id || store.uid();
  const j = journal();
  j.note('trips', t.id);
  const rec = store.put('trips', t);
  if (!rec.packingListId || !L.list(rec.packingListId)) {
    const l = L.create(`Packing · ${rec.name}`);
    j.note('lists', l.id);
    L.add(l.id, packingFor(rec).join('\n'));
    store.update('trips', rec.id, { packingListId: l.id });
  }
  await applyDays(trip(rec.id), cur, j);
  tasksFor(trip(rec.id), j);
  return { trip: trip(rec.id), undo: j.undo };
}

/** The trip's days: marked away, or on the Travel plan; a changed trip lets go of its old days first. */
async function applyDays(t, prev, j) {
  if (prev) await releaseDays(prev, t, j);
  const days = range(t.from, t.to);
  if (t.mode === 'away') {
    const ops = [];
    for (const d of days) {
      const r = store.get('dailyReviews', d);
      if (r?.tripId === t.id) continue;
      // A day you've set yourself (sick, minimum, away, or back to normal during the trip) or another
      // trip's day stays as it is.
      if (prev?.mode === 'away' && prev.from <= d && d <= prev.to) continue;
      if (r?.mode && r.mode !== 'normal') continue;
      j.note('dailyReviews', d);
      ops.push({ store: 'dailyReviews', value: { ...(r || { id: d, date: d }), mode: 'away', tripId: t.id, prevMode: r?.mode ?? null } });
    }
    if (ops.length) store.batch(ops);
  } else if (t.mode === 'travel') {
    const P = await import('./day-plans.js');
    const id = P.plans().find((p) => p.name === 'Travel' && p.id !== P.BASE)?.id || P.create('Travel').id;
    const prevDates = { ...(trip(t.id)?.prevDates || {}) };
    for (const d of days) {
      if (P.planIdFor(d) === id) continue;
      j.noteDate(d);
      if (!(d in prevDates)) prevDates[d] = store.profile().planDates?.[d] ?? null;
      P.setDate(d, id);
    }
    j.note('trips', t.id);
    store.update('trips', t.id, { prevDates });
  }
}

/** Undo what a trip did to its days (only days it set itself): each goes back to what it was before. */
async function releaseDays(t, next = null, j) {
  const keep = next && next.mode === t.mode ? new Set(range(next.from, next.to)) : new Set();
  const days = range(t.from, t.to).filter((d) => !keep.has(d));
  if (t.mode === 'away') {
    const ops = [];
    for (const d of days) {
      const r = store.get('dailyReviews', d);
      if (r?.tripId !== t.id) continue;
      j.note('dailyReviews', d);
      const { tripId, prevMode, ...rest } = r;
      // Another time-off trip on the same day takes it over.
      const other = all().find((x) => x.id !== t.id && x.mode === 'away' && x.from <= d && d <= x.to);
      ops.push({ store: 'dailyReviews', value: other ? { ...r, tripId: other.id } : { ...rest, mode: prevMode ?? null } });
    }
    if (ops.length) store.batch(ops);
  } else if (t.mode === 'travel') {
    const P = await import('./day-plans.js');
    const travel = P.plans().find((p) => p.name === 'Travel' && p.id !== P.BASE)?.id;
    const prevDates = { ...(t.prevDates || {}) };
    const p = store.profile();
    const pd = { ...(p.planDates || {}) };
    let changed = false;
    for (const d of days) {
      if (!travel || P.planIdFor(d) !== travel) continue;
      if (all().some((x) => x.id !== t.id && x.mode === 'travel' && x.from <= d && d <= x.to)) continue;
      j.noteDate(d);
      const was = prevDates[d];
      if (was) pd[d] = was; else delete pd[d];
      delete prevDates[d];
      changed = true;
    }
    if (changed) store.put('profile', { ...p, planDates: pd });
    if (store.get('trips', t.id)) { j.note('trips', t.id); store.update('trips', t.id, { prevDates }); }
  }
}

/** "Pack" the day before, and each travel leg on its day (stable ids, kept in step with the trip). */
function tasksFor(t, j) {
  const ops = [];
  let order = store.all('tasks').reduce((m, x) => Math.max(m, x.order ?? 0), 0);
  const base = { done: false, doneAt: null, area: 'life', repeat: null, source: `trip:${t.id}` };
  const want = new Map();
  if (t.from > today()) want.set(`t-trip-${t.id}-pack`, { ...base, title: `Pack for ${t.name}`, notes: 'The packing list is in Lists.', date: addDays(t.from, -1) });
  (t.legs || []).forEach((leg, i) => {
    if (!leg?.date || !leg?.what) return;
    want.set(`t-trip-${t.id}-leg-${leg.id || i}`, { ...base, title: `${leg.time ? `${leg.time} · ` : ''}${String(leg.what).slice(0, 80)}`, notes: t.name, date: leg.date });
  });
  for (const r of store.all('tasks')) if (r.source === `trip:${t.id}` && !want.has(r.id) && !r.done) { j.note('tasks', r.id); ops.push({ store: 'tasks', delete: r.id }); }
  for (const [id, v] of want) {
    const cur = store.get('tasks', id);
    j.note('tasks', id);
    ops.push({ store: 'tasks', value: { ...v, ...(cur ? { done: cur.done, doneAt: cur.doneAt, order: cur.order } : { order: ++order }), id } });
  }
  if (ops.length) store.batch(ops);
}

/** Delete a trip: its days go back to what they were and its open tasks go (the packing list stays). Returns an undo. */
export async function remove(id) {
  const t = trip(id);
  if (!t) return () => {};
  const j = journal();
  j.note('trips', id);
  store.remove('trips', id);
  await releaseDays(t, null, j);
  const ops = [];
  for (const r of store.all('tasks')) if (r.source === `trip:${t.id}` && !r.done) { j.note('tasks', r.id); ops.push({ store: 'tasks', delete: r.id }); }
  if (ops.length) store.batch(ops);
  return j.undo;
}
