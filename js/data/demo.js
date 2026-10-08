// Opt-in sample data for exploring the app. Every record carries demo: true and
// is removed in one step; your own entries are never touched.
import * as store from './store.js';
import { today, addDays, weekday, range } from '../domain/dates.js';
import { habitsSeed } from './seed.js';

const DEMO_STORES = ['tasks', 'habitLogs', 'weightEntries', 'sleepEntries', 'moodEntries', 'nutritionLogs', 'waterLogs', 'stepLogs', 'dailyReviews',
  'workouts', 'workoutSets', 'measurements', 'readingSessions', 'learningSessions', 'meditationSessions', 'spiritualSessions',
  'relationshipEntries', 'journalEntries', 'bodyFatEstimates', 'lists', 'expenses', 'events'];

export const hasDemo = () => !!store.settings()?.demo;

export async function loadDemo(days = 42) {
  if (hasDemo()) return;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const pick = (p) => rnd() < p;
  const t = today();
  const from = addDays(t, -days);
  const ops = [];
  // Never overwrite something you logged yourself.
  const put = (s, v) => { if (v.id && store.get(s, v.id)) return; ops.push({ store: s, value: { ...v, demo: true } }); };
  const habits = habitsSeed();
  const P = { 'h-morning-reset': 0.8, 'h-prayer': 0.85, 'h-scripture': 0.7, 'h-mobility': 0.75, 'h-gratitude': 0.6, 'h-fiancee': 0.8,
    'h-evening': 0.7, 'h-lights-out': 0.65, 'h-home': 0.6, 'h-eye-care': 0.5, 'h-church': 0.9, 'h-mealprep': 0.8, 'h-son': 0.5, 'h-family': 0.4, 'h-date': 0.5 };
  for (const d of range(from, addDays(t, -1))) {
    const wd = weekday(d);
    const n = Math.round((Date.parse(d) - Date.parse(from)) / 86400000);
    const sick = n === 17;
    if (sick) put('dailyReviews', { id: d, date: d, mode: 'sick' });
    // weight: gentle downward trend with daily noise
    put('weightEntries', { id: d, date: d, kg: +(76.3 - n * 0.07 + (rnd() - 0.5) * 0.9).toFixed(1) });
    const hours = +(6.2 + rnd() * 2.1).toFixed(2);
    put('sleepEntries', { id: d, date: d, bedtime: hours > 7.6 ? '22:05' : '22:50', wake: '06:00', hours, quality: 5 + Math.round(rnd() * 4) });
    put('moodEntries', { id: d, date: d, energy: 5 + Math.round(rnd() * 4), stress: 2 + Math.round(rnd() * 5), mood: 5 + Math.round(rnd() * 4), body: ['good', 'normal', 'great', 'tired'][Math.floor(rnd() * 4)] });
    if (sick) continue;
    put('stepLogs', { id: d, date: d, steps: Math.round(6500 + rnd() * 5200) });
    const prot = [['Oats + whey + banana', 35, 420], ['Chicken curry with rice', 40, 650], ['Yoghurt + 2 eggs', 19, 240], ['Grilled chicken, potatoes, veg', 45, 560]];
    prot.forEach(([name, p, k], i) => { if (i < 3 || pick(0.8)) put('nutritionLogs', { date: d, name, protein: p + Math.round((rnd() - 0.5) * 10), kcal: k + Math.round((rnd() - 0.5) * 120), fruit: i === 0 ? 1 : 0, veg: i >= 1 ? 1 : 0, at: `${d}T${8 + i * 4}:00:00` }); });
    for (let i = 0; i < 4 + Math.floor(rnd() * 3); i++) put('waterLogs', { date: d, ml: 500, at: `${d}T${7 + i * 2}:30:00` });
    if (wd <= 5) {
      put('dailyReviews', { id: d, date: d, deepWork: 1 + Math.floor(rnd() * 3), breaks: 3 + Math.floor(rnd() * 6), eyeBreaks: Math.floor(rnd() * 6),
        shutdown: pick(0.75) ? { done: true, at: `${d}T20:0${Math.floor(rnd() * 9)}:00`, completed: 'Proposal sent', remains: 'Invoices', first: 'Follow up with client' } : null,
        win: pick(0.3) ? ['Trained despite low motivation', 'Hit protein', 'Present at dinner', 'Closed a client deal'][Math.floor(rnd() * 4)] : '' });
      ['Client proposal', 'Pipeline follow-ups', 'Design review'].forEach((title, i) => {
        const done = pick(0.7);
        put('tasks', { id: `demo-t3-${d}-${i + 1}`, title, notes: '', area: 'work', repeat: null, date: d, rank: i + 1, done, doneAt: done ? `${d}T${11 + i * 2}:00:00` : null, order: 1000 + i });
      });
    }
    for (const h of habits) {
      const p = P[h.id];
      if (p == null) continue;
      const s = h.schedule;
      if (s.kind === 'weekdays' && !s.days.includes(wd)) continue;
      if (pick(p)) put('habitLogs', { id: `${h.id}:${d}`, habitId: h.id, date: d, value: 1, completed: true });
    }
    if (pick(0.75)) put('readingSessions', { date: d, book: n < 20 ? 'Atomic Habits' : 'The Good and the Beautiful', minutes: 15 + Math.round(rnd() * 20), finished: n === 19 });
    if (pick(0.3)) put('learningSessions', { date: d, topic: ['AI agents', 'Sales calls', 'Web design', 'Leadership'][Math.floor(rnd() * 4)], minutes: 20 });
    if (pick(0.3)) put('meditationSessions', { date: d, kind: 'contemplative', minutes: 10 });
    if (pick(0.8)) put('relationshipEntries', { date: d, person: 'fiancee', kind: 'Conversation', minutes: 20 });
    if (wd === 6 && pick(0.7)) put('relationshipEntries', { date: d, person: 'son', kind: 'Shared activity', minutes: 60 });
    // training per plan: Mon/Thu upper, Tue/Fri lower
    const tpl = { 1: 't-upper', 2: 't-lower', 4: 't-upper', 5: 't-lower', 3: 't-recovery' }[wd];
    if (tpl && pick(tpl === 't-recovery' ? 0.6 : 0.85)) {
      const T = store.get('templates', tpl);
      const id = store.uid();
      const wk = Math.floor(n / 7);
      put('workouts', { id, date: d, templateId: tpl, title: T.name, kind: T.kind, status: 'done', startedAt: `${d}T06:30:00`, endedAt: `${d}T07:25:00`, minutes: 50, difficulty: 3, progression: wk % 2 ? 'improved' : 'maintained' });
      T.items.forEach((it, order) => {
        const e = store.get('exercises', it.exerciseId);
        for (let i = 0; i < it.sets; i++) {
          put('workoutSets', { workoutId: id, date: d, exerciseId: it.exerciseId, order, setIndex: i, target: it.reps, completed: true,
            reps: e.metric === 'reps' ? 8 + wk + Math.floor(rnd() * 3) : null, seconds: e.metric === 'time' ? 25 + wk * 3 : null,
            minutes: e.metric === 'minutes' ? 25 : null, load: it.load ?? (e.defaultLoad || null) });
        }
      });
    }
    if (n % 14 === 0) put('measurements', { date: d, waist: +(91.5 - n * 0.05).toFixed(1), chest: 99, arms: 32.5, thighs: 56, calves: +(36.2 + n * 0.01).toFixed(1), neck: 38 });
    if (n % 3 === 0) put('journalEntries', { date: d, kind: 'evening', answers: { 0: 'Shipped the proposal', 1: 'Skipped the walk', 2: 'Walk after lunch' }, text: '' });
  }
  // A few lists, this month's spending and some dates, to show those pages working.
  const item = (text, done = false) => ({ id: store.uid(), text, done });
  put('lists', { id: 'demo-groceries', name: 'Groceries', order: 0, items: [item('Eggs'), item('Chicken breast'), item('Greek yoghurt'), item('Spinach'), item('Oats', true), item('Bananas', true)] });
  put('lists', { id: 'demo-packing', name: 'Packing', order: 1, items: [item('Passport'), item('Charger'), item('Gym shoes'), item('Resistance band')] });
  const CATS = ['food', 'groceries', 'transport', 'home', 'fun', 'groceries', 'food'];
  for (let n = 0; n < 24; n++) {
    const d = addDays(t, -Math.floor(n * 1.2));
    if (d.slice(0, 7) !== t.slice(0, 7)) break;
    put('expenses', { date: d, amount: Math.round(150 + rnd() * 1650), category: CATS[n % CATS.length], note: ['Lunch', 'Weekly shop', 'Fuel', 'Electricity', 'Cinema', 'Market', 'Coffee'][n % 7] });
  }
  const md = (offset) => { const x = addDays(t, offset); return `1965-${x.slice(5)}`; };
  put('events', { id: 'demo-mum', title: 'Mum', kind: 'birthday', date: md(5), countdown: false, noYear: false });
  put('events', { id: 'demo-wedding', title: 'Our wedding', kind: 'event', date: addDays(t, 87), countdown: true, noYear: false });
  put('events', { id: 'demo-son', title: 'Noah', kind: 'birthday', date: `2016-${addDays(t, 40).slice(5)}`, countdown: false, noYear: false });
  const p = store.profile();
  ops.push({ store: 'profile', value: { ...p, demoPrevStart: p.trackingStart, trackingStart: from < p.trackingStart ? from : p.trackingStart } });
  ops.push({ store: 'settings', value: { ...store.settings(), demo: true } });
  store.batch(ops);
  await store.flush();
}

export async function removeDemo() {
  const ops = [];
  for (const s of DEMO_STORES) for (const r of store.all(s)) if (r.demo) ops.push({ store: s, delete: r.id });
  const p = store.profile();
  ops.push({ store: 'profile', value: { ...p, trackingStart: p.demoPrevStart || p.trackingStart, demoPrevStart: undefined } });
  ops.push({ store: 'settings', value: { ...store.settings(), demo: false } });
  store.batch(ops);
  await store.flush();
}
