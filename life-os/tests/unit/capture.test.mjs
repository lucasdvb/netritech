// The capture parser (U2) against a table of real phrasings. Acceptance: at least 95% read
// correctly, and nothing is ever logged as something else (a wrong guess must be a question).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parse, describe, takeDate, resolveDate, duration, sameWord } from '../../js/domain/capture.js';
import { habitsSeed, foodsSeed } from '../../js/data/seed.js';

// Wednesday 7 October 2026, weighing about 76 kg, with the seeded habits and foods.
const T = '2026-10-07';
const ctx = {
  today: T, weightUnit: 'kg', lengthUnit: 'cm', lastWeightKg: 76.2,
  habits: habitsSeed(), foods: foodsSeed(),
  planned: { id: 't-recovery', title: 'Walk + mobility', kind: 'recovery' },
};
const ASK = 'ask';
const d = (n) => { const x = new Date(`${T}T12:00:00`); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };

// [phrase, expected]: an intent (fields checked), a list of intents, or ASK.
const TABLE = [
  // water
  ['water 500', { kind: 'water', ml: 500, date: T }],
  ['500ml water', { kind: 'water', ml: 500 }],
  ['drank 2 glasses of water', { kind: 'water', ml: 500 }],
  ['1.5L water', { kind: 'water', ml: 1500 }],
  ['water 1l', { kind: 'water', ml: 1000 }],
  ['a bottle of water', { kind: 'water', ml: 500 }],
  ['750 ml', { kind: 'water', ml: 750 }],
  ['water', { kind: 'water', ml: 500 }],
  ['drank a glass of water', { kind: 'water', ml: 250 }],
  ['2l water yesterday', { kind: 'water', ml: 2000, date: d(-1) }],
  ['3 glasses water', { kind: 'water', ml: 750 }],
  ['250 ml water this morning', { kind: 'water', ml: 250, date: T }],
  // weight and body fat
  ['weight 76.4', { kind: 'weight', kg: 76.4 }],
  ['76.4 kg', { kind: 'weight', kg: 76.4 }],
  ['weighed 75.9 this morning', { kind: 'weight', kg: 75.9 }],
  ['76', { kind: 'weight', kg: 76 }],
  ['76.0', { kind: 'weight', kg: 76 }],
  ['168 lb', { kind: 'weight', kg: 76.2 }],
  ['weight 77,1', { kind: 'weight', kg: 77.1 }],
  ['weighed in at 75.5kg yesterday', { kind: 'weight', kg: 75.5, date: d(-1) }],
  ['body fat 18%', { kind: 'bodyfat', percent: 18 }],
  ['bf 17.5', { kind: 'bodyfat', percent: 17.5 }],
  // steps
  ['8000 steps', { kind: 'steps', steps: 8000 }],
  ['steps 10432', { kind: 'steps', steps: 10432 }],
  ['10k steps', { kind: 'steps', steps: 10000 }],
  ['walked 12,500 steps', { kind: 'steps', steps: 12500 }],
  ['steps: 6500', { kind: 'steps', steps: 6500 }],
  ['7.5k steps yesterday', { kind: 'steps', steps: 7500, date: d(-1) }],
  ['9000', ASK],
  ['steps 4,200', { kind: 'steps', steps: 4200 }],
  // food
  ['30g protein', { kind: 'food', protein: 30 }],
  ['protein 25', { kind: 'food', protein: 25 }],
  ['chicken salad 35g protein 520 kcal', { kind: 'food', name: 'Chicken salad', protein: 35, kcal: 520 }],
  ['lunch 40g protein', { kind: 'food', name: 'Lunch', protein: 40 }],
  ['had 3 eggs', { kind: 'food', foodId: 'f-eggs', protein: 19 }],
  ['6 eggs', { kind: 'food', foodId: 'f-eggs', protein: 38, name: '6 eggs' }],
  ['whey shake', { kind: 'food', foodId: 'f-whey' }],
  ['2 scoops of whey', { kind: 'food', foodId: 'f-whey', protein: 51 }],
  ['ate a banana', { kind: 'food', foodId: 'f-banana', fruit: 1 }],
  ['chicken', ASK],
  ['chicken breast', { kind: 'food', foodId: 'f-chicken' }],
  ['chicken curry for dinner', { kind: 'food', foodId: 'f-chicken-curry' }],
  ['dholl', { kind: 'food', foodId: 'f-dholl' }],
  ['greek yoghurt', { kind: 'food', foodId: 'f-yoghurt' }],
  ['500 kcal snack', { kind: 'food', name: 'Snack', kcal: 500 }],
  ['dinner 650 calories 38g protein', { kind: 'food', protein: 38, kcal: 650 }],
  // fruit and veg
  ['2 fruit', { kind: 'produce', fruit: 2 }],
  ['3 veg', { kind: 'produce', veg: 3 }],
  ['2 fruit and 3 veg', [{ kind: 'produce', fruit: 2 }, { kind: 'produce', veg: 3 }]],
  ['a mango', { kind: 'produce', fruit: 1 }],
  ['salad with lunch', { kind: 'produce', veg: 1 }],
  ['2 portions of vegetables', { kind: ['produce', 'food'], veg: 2 }],
  // sleep
  ['slept 7h', { kind: 'sleep', hours: 7, date: T }],
  ['slept 7.5 hours', { kind: 'sleep', hours: 7.5 }],
  ['slept 6h45', { kind: 'sleep', hours: 6.75 }],
  ['slept 11pm to 6:30', { kind: 'sleep', hours: 7.5, bedtime: '23:00', wake: '06:30' }],
  ['bed 22:30 woke 6', { kind: 'sleep', hours: 7.5, bedtime: '22:30', wake: '06:00' }],
  ['slept 7 hours last night', { kind: 'sleep', hours: 7, date: T }],
  ['sleep quality 8', { kind: 'sleep', quality: 8 }],
  ['slept 8h quality 7', { kind: 'sleep', hours: 8, quality: 7 }],
  ['slept 10:45-6:15', { kind: 'sleep', hours: 7.5, bedtime: '22:45', wake: '06:15' }],
  ['slept 3 hours', { kind: 'sleep', hours: 3 }],
  ['nap 20 min', ASK],
  // faith
  ['prayed', { kind: 'habit', habitId: 'h-prayer' }],
  ['prayed 15 min', { kind: 'faith', type: 'prayer', minutes: 15 }],
  ['scripture 10 min', { kind: 'faith', type: 'scripture', minutes: 10 }],
  ['read the bible 20 min', { kind: 'faith', type: 'scripture', minutes: 20 }],
  ['church', { kind: 'habit', habitId: 'h-church' }],
  ['bible study 45 min', { kind: 'faith', type: 'study', minutes: 45 }],
  ['gratitude', { kind: 'habit', habitId: 'h-gratitude' }],
  ['prayer', { kind: 'habit', habitId: 'h-prayer' }],
  // reading, learning, meditation
  ['read 20 pages', { kind: 'reading', pages: 20 }],
  ['read 30 min', { kind: 'reading', minutes: 30 }],
  ['read 20 pages of atomic habits', { kind: 'reading', pages: 20, book: 'Atomic habits' }],
  ['reading 45 minutes', { kind: 'reading', minutes: 45 }],
  ['read', ASK],
  ['meditated 10 min', { kind: 'meditation', minutes: 10 }],
  ['10 min meditation', { kind: 'meditation', minutes: 10 }],
  ['meditation', ASK],
  ['breathwork 5 min', { kind: 'meditation', minutes: 5 }],
  ['learned spanish 20 min', { kind: 'learning', minutes: 20, topic: 'Spanish' }],
  ['studied for 1 hour', { kind: 'learning', minutes: 60, topic: '' }],
  ['duolingo 15 min', { kind: 'learning', minutes: 15 }],
  // workouts
  ['walked 30 min', { kind: 'workout', title: 'Walk', minutes: 30, type: 'cardio' }],
  ['ran 5k', { kind: 'workout', title: 'Run', km: 5 }],
  ['ran 5 km in 28 min', { kind: 'workout', title: 'Run', km: 5, minutes: 28 }],
  ['went for a run', { kind: 'workout', title: 'Run' }],
  ['cycled 20 km', { kind: 'workout', title: 'Ride', km: 20 }],
  ['swam 30 minutes', { kind: 'workout', title: 'Swim', minutes: 30 }],
  ['yoga 20 min', { kind: 'workout', title: 'Yoga', minutes: 20, type: 'recovery' }],
  ['gym 45 min', { kind: 'workout', title: 'Workout', minutes: 45, type: 'strength' }],
  ['did my workout', { kind: 'workout', title: 'Walk + mobility', type: 'recovery' }],
  ['hiit 20 min', { kind: 'workout', title: 'Cardio', minutes: 20 }],
  ['walk 45 minutes yesterday', { kind: 'workout', title: 'Walk', minutes: 45, date: d(-1) }],
  ['run 5k tomorrow', { kind: 'task', title: 'Run 5k', date: d(1) }],
  ['walk the dog', { kind: 'task', title: 'Walk the dog' }],
  ['hiked 2 hours', { kind: 'workout', title: 'Hike', minutes: 120 }],
  ['walked with my fiancee 30 min', { kind: 'relation', person: 'fiancee', type: 'Walk', minutes: 30 }],
  // measurements
  ['waist 84 cm', { kind: 'measure', fields: { waist: 84 } }],
  ['waist 84', { kind: 'measure', fields: { waist: 84 } }],
  ['chest 102 arms 36', { kind: 'measure', fields: { chest: 102, arms: 36 } }],
  ['33 in waist', { kind: 'measure', fields: { waist: 83.8 } }],
  ['neck 39cm', { kind: 'measure', fields: { neck: 39 } }],
  // how you feel
  ['energy 7', { kind: 'mood', energy: 7 }],
  ['mood 8/10', { kind: 'mood', mood: 8 }],
  ['stress 3', { kind: 'mood', stress: 3 }],
  ['energy 6 mood 7 stress 4', { kind: 'mood', energy: 6, mood: 7, stress: 4 }],
  ['feeling 7/10', { kind: 'mood', mood: 7 }],
  // counters
  ['deep work block', { kind: 'counter', field: 'deepWork', delta: 1 }],
  ['2 deep work blocks', { kind: 'counter', field: 'deepWork', delta: 2 }],
  ['deep work 3', { kind: 'counter', field: 'deepWork', delta: 3 }],
  ['movement break', { kind: 'counter', field: 'breaks', delta: 1 }],
  ['eye break', { kind: 'counter', field: 'eyeBreaks', delta: 1 }],
  ['20-20-20', { kind: 'counter', field: 'eyeBreaks', delta: 1 }],
  // people
  ['called mum', { kind: 'relation', person: 'family', type: 'Call' }],
  ['called mum 20 min', { kind: 'relation', person: 'family', minutes: 20 }],
  ['date night', { kind: 'relation', person: 'date' }],
  ['played football with my son', { kind: 'relation', person: 'son', type: 'Shared activity' }],
  ['had dinner with my fiancée', { kind: 'relation', person: 'fiancee', type: 'Meal together' }],
  ['facetimed my sister', { kind: 'relation', person: 'family', type: 'Call' }],
  ['visited my parents', { kind: 'relation', person: 'family', type: 'Visit' }],
  ['father-son time', { kind: 'relation', person: 'son' }],
  // habits by name
  ['mobility', { kind: 'habit', habitId: 'h-mobility' }],
  ['stretched', { kind: 'habit', habitId: 'h-mobility' }],
  ['morning reset', { kind: 'habit', habitId: 'h-morning-reset' }],
  ['did my evening routine', { kind: 'habit', habitId: 'h-evening' }],
  ['lights out', { kind: 'habit', habitId: 'h-lights-out' }],
  ['in bed by 10', { kind: 'habit', habitId: 'h-lights-out' }],
  ['home reset', { kind: 'habit', habitId: 'h-home' }],
  ['meal prep', { kind: 'habit', habitId: 'h-mealprep' }],
  ['eye care', { kind: 'habit', habitId: 'h-eye-care' }],
  ['journal', { kind: 'open', habitId: 'h-journal' }],
  ['shutdown', { kind: 'open', habitId: 'h-shutdown' }],
  ['time with fiancée', { kind: 'relation', person: 'fiancee' }],
  ['weekly review', { kind: 'open', habitId: 'h-weekly-review' }],
  ['core', { kind: 'open', habitId: 'h-core' }],
  // not today
  ['skip prayer', { kind: 'skip', habitId: 'h-prayer' }],
  ['not today: mobility', { kind: 'skip', habitId: 'h-mobility' }],
  ['didn’t do mobility', { kind: 'skip', habitId: 'h-mobility' }],
  ['no church today', { kind: 'skip', habitId: 'h-church' }],
  ['didn’t drink water', ASK],
  ['missed my workout', ASK],
  // tasks
  ['call mum friday', { kind: 'task', title: 'Call mum', date: d(2), area: 'relationships' }],
  ['buy milk', { kind: 'task', title: 'Buy milk', date: T }],
  ['email the accountant tomorrow', { kind: 'task', title: 'Email the accountant', date: d(1), area: 'work' }],
  ['book dentist next week', { kind: 'task', title: 'Book dentist', date: d(5), area: 'health' }],
  ['pay rent on the 15th', { kind: 'task', title: 'Pay rent', date: '2026-10-15' }],
  ['remind me to renew car insurance', { kind: 'task', title: 'Renew car insurance' }],
  ['send the proposal by Friday', { kind: 'task', title: 'Send the proposal', date: d(2), area: 'work' }],
  ['call the bank on monday', { kind: 'task', title: 'Call the bank', date: d(5) }],
  ['pick up dry cleaning saturday', { kind: 'task', title: 'Pick up dry cleaning', date: d(3) }],
  ['todo: finish the deck', { kind: 'task', title: 'Finish the deck' }],
  ['task: Call Sarah', { kind: 'task', title: 'Call Sarah' }],
  ['renew passport 15 oct', { kind: 'task', title: 'Renew passport', date: '2026-10-15' }],
  ['dentist appointment tomorrow at 3pm', { kind: 'task', title: 'Dentist appointment at 3pm', date: d(1) }],
  ['need to fix the gate', { kind: 'task', title: 'Fix the gate' }],
  ['call mum', { kind: 'task', title: 'Call mum', date: T }],
  ['text john in 2 days', { kind: 'task', title: 'Text john', date: d(2) }],
  ['fiancée birthday gift', ASK],
  // notes and wins
  ['note: felt strong today', { kind: 'note', text: 'Felt strong today' }],
  ['win: shipped the proposal', { kind: 'win', text: 'Shipped the proposal' }],
  ['journal: long day but good', { kind: 'note', text: 'Long day but good' }],
  // could be several things: ask
  ['1500', ASK],
  ['120', ASK],
  ['2 coffees', ASK],
  ['hips 98', ASK],
  ['deadlift 100kg', ASK],
];

function matches(item, exp) {
  for (const [k, v] of Object.entries(exp)) {
    if (k === 'kind' && Array.isArray(v)) { if (!v.includes(item.kind)) return false; continue; }
    if (k === 'fields') { for (const [f, x] of Object.entries(v)) if (Math.abs((item.fields?.[f] ?? NaN) - x) > 0.05) return false; continue; }
    if (typeof v === 'number') { if (Math.abs((item[k] ?? NaN) - v) > 0.05) return false; continue; }
    if (item[k] !== v) return false;
  }
  return true;
}

function grade(phrase, exp) {
  const r = parse(phrase, ctx);
  if (exp === ASK) return r.status === 'ask' ? 'right' : r.status === 'ok' ? 'mislog' : 'wrong';
  const list = Array.isArray(exp) ? exp : [exp];
  if (r.status !== 'ok') return 'asked';
  const ok = r.items.length === list.length && list.every((e, i) => matches(r.items[i], e));
  return ok ? 'right' : 'mislog';
}

test("the table has at least 150 phrases", () => {
  
  assert.ok(TABLE.length >= 150, `${TABLE.length} phrases`);
});

test('at least 95% of the table is read right, and nothing is ever logged as something else', () => {
  const out = TABLE.map(([p, e]) => ({ p, e, g: grade(p, e) }));
  const right = out.filter((x) => x.g === 'right').length;
  const mislogs = out.filter((x) => x.g === 'mislog');
  const misses = out.filter((x) => x.g !== 'right');
  const show = (x) => `  ${JSON.stringify(x.p)} → ${x.g}: ${JSON.stringify(parse(x.p, ctx).items?.[0] || parse(x.p, ctx).options?.map((o) => o.kind))}`;
  assert.equal(mislogs.length, 0, `silent mislogs:\n${mislogs.map(show).join('\n')}`);
  assert.ok(right / TABLE.length >= 0.95, `${right}/${TABLE.length} right. Misses:\n${misses.map(show).join('\n')}`);
});

test('every reading describes itself before it is saved', () => {
  for (const [p] of TABLE) {
    const r = parse(p, ctx);
    for (const i of [...r.items, ...r.options]) {
      const dsc = describe(i, ctx);
      assert.ok(dsc.title && dsc.icon, `${p}: ${JSON.stringify(i)}`);
    }
  }
});

test('dates: logs look back, tasks look ahead', () => {
  const fri = takeDate('call mum friday').when;
  assert.equal(resolveDate(fri, T, 'task'), d(2));
  assert.equal(resolveDate(fri, T, 'log'), d(-5));
  assert.equal(resolveDate(takeDate('on monday').when, T, 'log'), d(-2));
  assert.equal(resolveDate(takeDate('next friday').when, T, 'task'), d(9));
  assert.equal(resolveDate(takeDate('the 3rd of november').when, T, 'task'), '2026-11-03');
  assert.equal(resolveDate(takeDate('on the 2nd').when, T, 'task'), '2026-11-02');
  assert.equal(resolveDate(takeDate('on the 2nd').when, T, 'log'), '2026-10-02');
  assert.equal(takeDate('sat in the sun').when, null, 'short day names need a cue');
});

test('amounts and words', () => {
  assert.equal(duration('1h30'), 90);
  assert.equal(duration('half an hour'), 30);
  assert.equal(duration('1 hour 20 minutes'), 80);
  assert.ok(sameWord('prayed', 'prayer'));
  assert.ok(sameWord('meditated', 'meditation'));
  assert.ok(!sameWord('car', 'cardio'));
  assert.ok(!sameWord('call', 'calves'));
});

test('ambiguous lines offer their readings, and a fallback offers a note', () => {
  const r = parse('1500', ctx);
  assert.deepEqual(r.options.map((o) => o.kind).sort(), ['steps', 'water']);
  const f = parse('coffee with Tom', ctx);
  assert.equal(f.status, 'ok');
  assert.equal(f.items[0].kind, 'task');
  assert.equal(f.options[0].kind, 'note');
  assert.equal(parse('   ', ctx).status, 'empty');
});

test('report', () => {
  const g = TABLE.map(([p, e]) => grade(p, e));
  console.log(`capture table: ${g.filter((x) => x === 'right').length}/${TABLE.length} right, ${g.filter((x) => x === 'mislog').length} mislogged`);
});
