// Saving what the capture parser understood: every item in one write, with an Undo that puts each
// record back exactly as it was (or removes it if it's new).
import * as store from '../data/store.js';
import * as H from './habits.js';
import { describe } from './capture.js';
import * as B from './books.js';

const PEOPLE_KINDS = { fiancee: 'Conversation', date: 'Dinner', son: 'Conversation', family: 'Call' };
const FAITH_HABIT = { prayer: 'h-prayer', scripture: 'h-scripture', gratitude: 'h-gratitude', church: 'h-church', study: 'h-study' };
const SERVING = { fruit: { name: 'Fruit', protein: 0, kcal: 90 }, veg: { name: 'Vegetables', protein: 2, kcal: 30 } };

/** The habit log a habit needs to count as done (or to hold a number). */
function doneLog(prev, h, date, value) {
  const base = { ...(prev || { id: H.logId(h.id, date), habitId: h.id, date }), skip: false, tiny: false };
  if (H.isNumeric(h)) return { ...base, value, completed: !!prev?.completed };
  const checklist = h.checklist?.length ? Object.fromEntries(h.checklist.map((_, i) => [i, true])) : prev?.checklist;
  return { ...base, value: 1, completed: true, ...(checklist ? { checklist } : {}) };
}

/** The writes for one item. `get` sees earlier items in the same save. */
function opsFor(i, get, at) {
  const d = i.date;
  const put = (s, value) => ({ store: s, value });
  switch (i.kind) {
    case 'water': return [put('waterLogs', { id: store.uid(), date: d, ml: i.ml, at })];
    case 'weight': return [put('weightEntries', { ...(get('weightEntries', d) || {}), id: d, date: d, kg: i.kg })];
    case 'bodyfat': return [put('bodyFatEstimates', { id: store.uid(), date: d, percent: i.percent, method: 'Quick log' })];
    case 'steps': return [put('stepLogs', { ...(get('stepLogs', d) || {}), id: d, date: d, steps: i.steps })];
    case 'food': {
      const ops = [put('nutritionLogs', { id: store.uid(), date: d, name: i.name, protein: i.protein || 0, kcal: i.kcal || 0, fruit: i.fruit || 0, veg: i.veg || 0, ...(i.foodId ? { foodId: i.foodId } : {}), at })];
      const f = i.foodId && get('foods', i.foodId);
      if (f) ops.push(put('foods', { ...f, uses: (f.uses || 0) + 1 }));
      return ops;
    }
    case 'produce': return ['fruit', 'veg'].filter((k) => i[k]).map((k) => put('nutritionLogs', {
      id: store.uid(), date: d, name: SERVING[k].name, protein: SERVING[k].protein * i[k], kcal: SERVING[k].kcal * i[k], fruit: k === 'fruit' ? i[k] : 0, veg: k === 'veg' ? i[k] : 0, approx: true, at }));
    case 'sleep': {
      const prev = get('sleepEntries', d) || {};
      return [put('sleepEntries', { ...prev, id: d, date: d, ...(i.hours != null ? { hours: i.hours } : {}), ...(i.bedtime ? { bedtime: i.bedtime, wake: i.wake } : {}), ...(i.quality != null ? { quality: i.quality } : {}) })];
    }
    case 'reading': {
      // "read 20 pages" moves the book you're reading on (or the one you named).
      const b = (i.book && B.match(i.book)) || (!i.book && i.pages ? B.current() : null);
      if (b) return B.readingOps(get('books', b.id) || b, { pages: i.pages, minutes: i.minutes, date: d, notes: i.notes || '' });
      return [put('readingSessions', { id: store.uid(), date: d, minutes: i.minutes || 0, pages: i.pages ?? null, book: i.book || '', notes: i.notes || '', finished: false })];
    }
    case 'learning': return [put('learningSessions', { id: store.uid(), date: d, minutes: i.minutes || 0, topic: i.topic || '', notes: '' })];
    case 'meditation': return [put('meditationSessions', { id: store.uid(), date: d, minutes: i.minutes || 0, kind: i.type || 'breath', notes: '' })];
    case 'faith': {
      const ops = [put('spiritualSessions', { id: store.uid(), date: d, minutes: i.minutes || 0, kind: i.type, passage: '', notes: '' })];
      const h = H.habit(FAITH_HABIT[i.type]);
      if (h && !h.archived) ops.push(put('habitLogs', doneLog(get('habitLogs', H.logId(h.id, d)), h, d)));
      return ops;
    }
    case 'workout': return [put('workouts', { id: store.uid(), date: d, title: i.title, kind: i.type || 'cardio', templateId: i.templateId || null, status: 'done',
      startedAt: at, endedAt: at, minutes: i.minutes ?? null, km: i.km ?? null, notes: '', difficulty: null, rpe: null, quick: true })];
    case 'measure': {
      const prev = store.onDate('measurements', d)[0];
      return [put('measurements', { ...(prev || { id: store.uid(), date: d, note: '' }), ...i.fields })];
    }
    case 'mood': {
      const patch = Object.fromEntries(['energy', 'mood', 'stress'].filter((k) => i[k] != null).map((k) => [k, i[k]]));
      return [put('moodEntries', { ...(get('moodEntries', d) || {}), id: d, date: d, ...patch })];
    }
    case 'counter': {
      const r = get('dailyReviews', d) || { id: d, date: d };
      return [put('dailyReviews', { ...r, id: d, date: d, [i.field]: Math.max(0, (r[i.field] || 0) + i.delta) })];
    }
    case 'relation': return [put('relationshipEntries', { id: store.uid(), date: d, person: i.person, kind: i.type || PEOPLE_KINDS[i.person] || 'Conversation', minutes: i.minutes || 0, note: '' })];
    case 'habit': {
      const h = H.habit(i.habitId);
      return h ? [put('habitLogs', doneLog(get('habitLogs', H.logId(h.id, d)), h, d, i.value ?? null))] : [];
    }
    case 'skip': {
      const h = H.habit(i.habitId);
      if (!h) return [];
      const id = H.logId(h.id, d);
      return [put('habitLogs', { ...(get('habitLogs', id) || { id, habitId: h.id, date: d }), skip: true })];
    }
    case 'task': {
      const order = store.all('tasks').reduce((m, t) => Math.max(m, t.order ?? 0), 0) + 1;
      return [put('tasks', { id: store.uid(), title: i.title, notes: '', area: i.area || 'life', repeat: null, date: i.date || null, done: false, doneAt: null, order })];
    }
    case 'note': return [put('journalEntries', { id: store.uid(), date: d, kind: 'free', answers: {}, text: i.text })];
    case 'win': {
      const r = get('dailyReviews', d) || { id: d, date: d };
      return [put('dailyReviews', { ...r, id: d, date: d, win: i.text })];
    }
    default: return [];
  }
}

/**
 * Save the items. Returns { undo, message, open } where open is a habit whose own place should
 * open (things like the journal that are logged where they live).
 */
export function save(items, ctx = {}) {
  const at = new Date().toISOString();
  const pending = new Map();
  const get = (s, id) => (pending.has(`${s}:${id}`) ? pending.get(`${s}:${id}`) : store.get(s, id));
  const ops = [];
  let open = null;
  for (const i of items) {
    if (i.kind === 'open') { open = i.habitId; continue; }
    for (const op of opsFor(i, get, at)) {
      pending.set(`${op.store}:${op.value.id}`, op.value);
      ops.push(op);
    }
  }
  // What each touched record was before, once per record, so Undo restores it exactly.
  const before = new Map();
  for (const op of ops) {
    const k = `${op.store}:${op.value.id}`;
    if (!before.has(k)) before.set(k, { store: op.store, id: op.value.id, value: store.get(op.store, op.value.id) || null });
  }
  if (ops.length) store.batch(ops);
  const undo = () => store.batch([...before.values()].map((b) => (b.value ? { store: b.store, value: b.value } : { store: b.store, delete: b.id })));
  return { undo, message: messageFor(items.filter((i) => i.kind !== 'open'), ctx), open, saved: ops.length };
}

function messageFor(items, ctx) {
  if (!items.length) return '';
  if (items.length > 1) return `Logged ${items.length} things`;
  const i = items[0];
  const dsc = describe(i, ctx);
  if (i.kind === 'task') return `Task added · ${i.title}`;
  if (i.kind === 'note') return 'Note saved';
  if (i.kind === 'win') return 'Win saved';
  if (i.kind === 'skip') return `${dsc.title}: not today`;
  return `${dsc.title} · ${dsc.value}`;
}
