// Opt-in sample data for exploring the app. Every record carries demo: true and
// is removed in one step; your own entries are never touched.
import * as store from './store.js';
import { today, addDays, weekday, range, fromISO, toISO } from '../domain/dates.js';
import { habitsSeed } from './seed.js';

const DEMO_STORES = ['tasks', 'habitLogs', 'weightEntries', 'sleepEntries', 'moodEntries', 'nutritionLogs', 'waterLogs', 'stepLogs', 'dailyReviews',
  'workouts', 'workoutSets', 'measurements', 'readingSessions', 'learningSessions', 'meditationSessions', 'spiritualSessions',
  'relationshipEntries', 'journalEntries', 'bodyFatEstimates', 'lists', 'expenses', 'events', 'energyLogs', 'bills', 'accounts', 'balances',
  'savingsGoals', 'supplements', 'supplementLogs', 'recipes', 'mealPlan', 'trips', 'takeaways', 'decisions', 'wheelChecks'];

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
    prot.forEach(([name, p, k], i) => { if (i < 3 || pick(0.8)) put('nutritionLogs', { date: d, name, protein: p + Math.round((rnd() - 0.5) * 10), kcal: k + Math.round((rnd() - 0.5) * 120), fruit: i === 0 ? 1 : 0, veg: i >= 1 ? 1 : 0, at: `${d}T${String(8 + i * 4).padStart(2, '0')}:00:00` }); });
    for (let i = 0; i < 4 + Math.floor(rnd() * 3); i++) put('waterLogs', { date: d, ml: 500, at: `${d}T${String(7 + i * 2).padStart(2, '0')}:30:00` });
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
    if (days - n <= 21) for (const [time, base] of [['08:30', 3], ['10:40', 4.4], ['15:10', 2.4], ['19:20', 3]]) if (pick(0.8)) put('energyLogs', { id: `${d}:${time}`, date: d, time, level: Math.max(1, Math.min(5, Math.round(base + (rnd() - 0.5) * 1.4))) });
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
  // Life admin and reflection: a few bills, accounts, a savings goal, supplements, recipes on this
  // week's plan, a trip ahead, takeaways, a decision due for review and last quarter's life wheel.
  const dom = (offset) => fromISO(addDays(t, offset)).getDate();
  put('bills', { id: 'demo-rent', name: 'Rent', kind: 'bill', amount: 18000, every: 'month', next: addDays(t, 2), anchorDay: dom(2), remindDays: 3, autopay: false });
  put('bills', { id: 'demo-power', name: 'Electricity', kind: 'bill', amount: 1450, every: 'month', next: addDays(t, 9), anchorDay: dom(9), remindDays: 3, autopay: true });
  put('bills', { id: 'demo-stream', name: 'Streaming', kind: 'subscription', amount: 390, every: 'month', next: addDays(t, 16), anchorDay: dom(16), remindDays: 3, autopay: true });
  put('bills', { id: 'demo-domain', name: 'Domain renewal', kind: 'renewal', amount: 650, every: 'year', next: addDays(t, 48), anchorDay: dom(48), remindDays: 14, autopay: false });
  const accts = [['demo-current', 'Current account', 'cash', [42000, 38500, 45200]], ['demo-savings', 'Savings', 'savings', [120000, 131000, 142500]], ['demo-card', 'Credit card', 'card', [9800, 12400, 7600]]];
  accts.forEach(([id, name, kind, amounts], order) => {
    put('accounts', { id, name, kind, order });
    amounts.forEach((amount, i) => { const date = addDays(t, -60 + i * 30); put('balances', { id: `${id}:${date}`, accountId: id, date, amount }); });
  });
  put('savingsGoals', { id: 'demo-wedding-fund', name: 'Wedding fund', target: 250000, saved: 142500, by: addDays(t, 87), log: [] });
  put('supplements', { id: 'demo-vitd', name: 'Vitamin D3', kind: 'supplement', dose: '2000 IU', perDose: 1, times: ['08:00'], stock: 5, reorderDays: 7, order: 0 });
  put('supplements', { id: 'demo-creatine', name: 'Creatine', kind: 'supplement', dose: '5 g', perDose: 1, times: ['08:00'], stock: 48, reorderDays: 7, order: 1 });
  put('supplements', { id: 'demo-magnesium', name: 'Magnesium', kind: 'supplement', dose: '300 mg', perDose: 1, times: ['21:30'], stock: 40, reorderDays: 7, order: 2 });
  for (const d of range(addDays(t, -6), addDays(t, -1))) put('supplementLogs', { id: `${d}:demo-vitd:08:00`, supplementId: 'demo-vitd', date: d, time: '08:00' });
  put('recipes', { id: 'demo-curry', name: 'Chicken curry with rice', servings: 4, protein: 40, kcal: 650, ingredients: ['800 g chicken thighs', '2 onions', '400 g tin tomatoes', '300 g rice', 'curry paste'] });
  put('recipes', { id: 'demo-oats', name: 'Overnight oats', servings: 1, protein: 35, kcal: 420, ingredients: ['60 g oats', '1 scoop whey', '1 banana', '200 ml milk'] });
  put('recipes', { id: 'demo-traybake', name: 'Chicken and potato traybake', servings: 3, protein: 45, kcal: 560, ingredients: ['600 g chicken breast', '800 g potatoes', '2 peppers', 'olive oil'] });
  for (let i = 0; i < 5; i++) {
    const d = addDays(t, i - 1);
    put('mealPlan', { id: `${d}:breakfast`, date: d, slot: 'breakfast', recipeId: 'demo-oats', text: '', servings: 1 });
    put('mealPlan', { id: `${d}:dinner`, date: d, slot: 'dinner', recipeId: i % 2 ? 'demo-traybake' : 'demo-curry', text: '', servings: 2 });
  }
  put('trips', { id: 'demo-trip', name: 'Cape Town', where: 'Cape Town', from: addDays(t, 24), to: addDays(t, 28), mode: 'travel', pause: false, flags: ['train', 'work'], legs: [] });
  put('takeaways', { id: 'demo-tk-1', text: 'Make the cue obvious: lay the gym clothes out the night before.', source: '', sourceLabel: 'Atomic Habits', box: 1, due: t, seen: 1, retired: false });
  put('takeaways', { id: 'demo-tk-2', text: 'Never miss twice.', source: '', sourceLabel: 'Atomic Habits', box: 2, due: addDays(t, 5), seen: 2, retired: false });
  put('decisions', { id: 'demo-decision', date: addDays(t, -92), title: 'Move training to the morning', options: 'Mornings before work, or evenings after.', why: 'Evenings kept getting taken by work and family.', expect: 'Four sessions a week instead of two.', confidence: 4, area: 'health', reviewOn: addDays(t, -2) });
  const q0 = fromISO(t);
  const lastQ = toISO(new Date(q0.getFullYear(), Math.floor(q0.getMonth() / 3) * 3, 0));
  const lq = `${lastQ.slice(0, 4)}-Q${Math.floor((Number(lastQ.slice(5, 7)) - 1) / 3) + 1}`;
  put('wheelChecks', { id: lq, date: lastQ, scores: { health: 7, mind: 6, spirit: 8, relationships: 7, work: 6, money: 5, fun: 4, home: 6 } });
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
