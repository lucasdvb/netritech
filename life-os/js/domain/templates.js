// Your workouts (the `templates` store): create, rename, duplicate and delete them, and edit their
// exercises (sets, a target, a starting load, rest) in any order. The weekly plan points at them
// by id, so deleting one clears its days and Undo puts both back.
import * as store from '../data/store.js';
import * as F from './fitness-core.js';

export const KINDS = [{ id: 'strength', label: 'Strength' }, { id: 'cardio', label: 'Cardio' }, { id: 'recovery', label: 'Recovery' }, { id: 'mobility', label: 'Mobility' }];
/** Rest between sets when a workout doesn't set its own (seconds), by exercise category. */
export const REST_BY_CATEGORY = { core: 45, calves: 60, mobility: 30, posture: 30, cardio: 0 };
export const restDefault = (e) => (e && REST_BY_CATEGORY[e.category] != null ? REST_BY_CATEGORY[e.category] : 90);
export const REST_CHOICES = [0, 30, 45, 60, 90, 120, 180];

const DEFAULT_TARGET = { reps: '8–12', time: '30–45 s', minutes: '20 min' };

/** A stable key for an item, for lists that reorder: its id, or its exercise and which copy it is. */
export function itemKeys(items) {
  const seen = new Map();
  return items.map((it) => {
    if (it.id) return it.id;
    const n = (seen.get(it.exerciseId) || 0) + 1;
    seen.set(it.exerciseId, n);
    return `${it.exerciseId}:${n}`;
  });
}

const withIds = (items) => items.map((it) => (it.id ? it : { ...it, id: store.uid() }));
const nextOrder = () => Math.max(-1, ...F.templates().map((t) => t.order ?? 0)) + 1;

export function create({ name = 'New workout', kind = 'strength', items = [], minutes = 45, note = '' } = {}) {
  return store.put('templates', { name, kind, minutes, order: nextOrder(), note, items: withIds(items) });
}

export const update = (id, patch) => store.update('templates', id, patch);

export function duplicate(id) {
  const t = F.template(id);
  if (!t) return null;
  const copy = create({ name: `${t.name} (copy)`.slice(0, 60), kind: t.kind, minutes: t.minutes, note: t.note || '', items: t.items.map(({ id: _id, ...it }) => it) });
  return copy;
}

/** Delete a workout and clear it from the weekly plan. Returns a function that undoes both. */
export function remove(id) {
  const t = F.template(id);
  if (!t) return () => {};
  const plan = { ...(store.profile().plan || {}) };
  const cleared = Object.fromEntries(Object.entries(plan).map(([d, v]) => [d, v === id ? null : v]));
  store.remove('templates', id);
  store.setProfile({ plan: cleared });
  return () => { store.put('templates', t); store.setProfile({ plan }); };
}

/** Reorder the workouts themselves. */
export function move(from, to) {
  const list = F.templates();
  const [t] = list.splice(from, 1);
  if (!t) return;
  list.splice(to, 0, t);
  store.batch(list.map((x, i) => (x.order === i ? null : { store: 'templates', value: { ...x, order: i } })).filter(Boolean));
}

const setItems = (id, fn) => {
  const t = F.template(id);
  if (!t) return null;
  return store.put('templates', { ...t, items: withIds(fn(t.items.map((it) => ({ ...it })))) });
};

export function addItem(id, exerciseId) {
  const e = F.exercise(exerciseId);
  return setItems(id, (items) => [...items, { exerciseId, sets: e?.metric === 'minutes' ? 1 : 3, reps: DEFAULT_TARGET[e?.metric] || DEFAULT_TARGET.reps, load: e?.defaultLoad ?? null, rest: null }]);
}
export const updateItem = (id, i, patch) => setItems(id, (items) => items.map((it, k) => (k === i ? { ...it, ...patch } : it)));
export const removeItem = (id, i) => setItems(id, (items) => items.filter((_, k) => k !== i));
export function moveItem(id, from, to) {
  return setItems(id, (items) => {
    const [it] = items.splice(from, 1);
    items.splice(to, 0, it);
    return items;
  });
}

/** A rough length: each set about 45 s of work plus its rest; minute-based exercises count their minutes. */
export function estimateMinutes(items) {
  let s = 0;
  for (const it of items) {
    const e = F.exercise(it.exerciseId);
    if (e?.metric === 'minutes') { s += (Number(String(it.reps).match(/\d+/)?.[0]) || 20) * 60; continue; }
    const rest = it.rest ?? restDefault(e);
    s += (it.sets || 1) * 45 + Math.max(0, (it.sets || 1) - 1) * rest + 60;
  }
  return Math.max(5, Math.round(s / 300) * 5);
}

/** A workout from what you did in a session: its exercises, set counts, reps and top loads. */
export function fromWorkout(workoutId, name) {
  const w = store.get('workouts', workoutId);
  const groups = new Map();
  for (const s of F.setsOf(workoutId)) {
    if (!groups.has(s.order)) groups.set(s.order, []);
    groups.get(s.order).push(s);
  }
  const items = [...groups.entries()].sort((a, b) => a[0] - b[0]).map(([, sets]) => {
    const e = F.exercise(sets[0].exerciseId);
    const field = e?.metric === 'time' ? 'seconds' : e?.metric === 'minutes' ? 'minutes' : 'reps';
    const vals = sets.map((s) => s[field]).filter((v) => v != null);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const unit = field === 'seconds' ? ' s' : field === 'minutes' ? ' min' : '';
    const target = vals.length ? (lo === hi ? `${lo}${unit}` : `${lo}–${hi}${unit}`) : sets[0].target || DEFAULT_TARGET[e?.metric] || '';
    const loads = sets.map((s) => s.load).filter((v) => v != null);
    return { exerciseId: sets[0].exerciseId, sets: sets.length, reps: target, load: loads.length ? Math.max(...loads) : null, rest: null };
  });
  return create({ name: (name || w?.title || 'My workout').slice(0, 60), kind: w?.kind || 'strength', items, minutes: w?.minutes || estimateMinutes(items) });
}

/** How many sessions of each kind the weekly plan asks for. */
export function planTargets() {
  const plan = store.profile().plan || {};
  const out = { strength: 0, cardio: 0, recovery: 0 };
  for (const id of Object.values(plan)) { const t = id && F.template(id); if (t) out[t.kind] = (out[t.kind] || 0) + 1; }
  return out;
}
