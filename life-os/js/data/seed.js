// Initial database, converted from the Life OS workbook (Settings, Habit Library,
// Plan & Routines). Seeded once on first launch; never overwrites your data.
import * as store from './store.js';
import { today, addDays } from '../domain/dates.js';
import { firstDate } from '../domain/tasks.js';

import { SEED_VERSION } from './schema.js';
import { TINY_VERSIONS, BACKUPS } from './tiny-versions.js';
import { defaultRoutines } from '../domain/routines.js';
export { SEED_VERSION };

const WORKDAYS = [1, 2, 3, 4, 5];

export function profileSeed() {
  return {
    id: 'me',
    name: 'Lucas',
    sex: 'male',
    age: 35,
    heightCm: 180,
    startWeightKg: 76,
    startBodyFat: 25,
    goalBodyFat: 15,
    location: 'Mauritius',
    wakeTime: '06:00',
    trainTime: '06:30',
    workStart: '10:00',
    workEnd: '20:00',
    windDown: '21:00',
    bedTime: '22:00',
    dayEndsAt: '03:00',
    workDays: WORKDAYS,
    trackingStart: today(),
    equipment: 'Bodyweight · 1 × 10 kg dumbbell · 2 × 2 kg dumbbells',
    diet: 'No seafood, no pork. Simple, affordable, Mauritius-friendly food. Whey isolate available.',
    plan: { 1: 't-upper', 2: 't-lower', 3: 't-recovery', 4: 't-upper', 5: 't-lower', 6: 't-cardio', 7: null },
  };
}

export function settingsSeed() {
  return {
    id: 'app',
    theme: 'system',
    units: { weight: 'kg', length: 'cm' },
    targets: {
      proteinG: 150, proteinHitG: 135, proteinLateG: 120, proteinMvdG: 120,
      kcal: 1900, kcalMin: 1800, kcalMax: 2000, kcalFloor: 1600,
      fatMinG: 50, fatMaxG: 65,
      waterMl: 2800, waterHitMl: 2500, waterMvdMl: 2000,
      fruit: 2, veg: 2,
      sleepH: 7.5, sleepMinH: 7, sleepLowH: 6,
      stepsRamp: [7000, 8000, 9000], stepsAlert: 5000,
      movementBreaks: 8,
      lossMinKg: 0.4, lossMaxKg: 0.8, lossMaxPct: 1,
    },
    bands: { strong: 85, steady: 70, attention: 50 },
    notifications: {
      enabled: false,
      morning: { on: true, time: '06:05' },
      workout: { on: true, time: '06:25' },
      water: { on: true, every: 120 },
      movement: { on: true, every: 50 },
      eyes: { on: false, every: 20 },
      evening: { on: true, time: '21:00' },
      weeklyReview: { on: true, time: '19:00' },
      habits: { on: false },
    },
    installDismissed: false,
    welcomed: false,
  };
}

const MORNING_RESET = ['Out of bed at 06:00', 'Bathroom, then weigh in', '500–750 ml water', 'Make the bed', '5–15 min outdoor light',
  'No social media for 30 min'];

// Only if they apply to you (spec §21–22), so they start archived. Restore from Habits → Archived.
const OPTIONAL_HABITS = [
  { id: 'h-caffeine', name: 'Caffeine cutoff 14:00', section: 'body', category: 'health', icon: 'coffee', priority: 'high', archived: true,
    goalId: 'g-health', description: 'No coffee or tea after 14:00, to protect sleep. Only if you drink caffeine.' },
  { id: 'h-alcohol', name: 'Alcohol-free day', section: 'evening', category: 'health', icon: 'glass-water', priority: 'optional', optional: true,
    weekly: false, archived: true, goalId: 'g-health',
    description: 'Not a moral rule: alcohol makes calorie control, sleep and recovery harder. Only if it applies.' },
];

const h = (o) => ({
  description: '', type: 'binary', unit: '', target: 1, min: null, max: null, step: 1,
  schedule: { kind: 'daily' }, time: null, reminder: null, difficulty: 2,
  priority: 'high', goalId: null, affectsScore: false, showOnToday: true, optional: false,
  streaks: false, weekly: true, source: null, ramp: null, checklist: null,
  mvd: false, mvdMin: null, mvdLabel: null, color: null, archived: false,
  // Nothing starts in focus: you choose your first three on day one.
  state: o.priority === 'optional' ? 'queue' : 'autopilot', anchor: null,
  tiny: tinyFor(o),
  backup: BACKUPS[o.id] || null, why: null,
  ...o,
});

function tinyFor(o) {
  const t = TINY_VERSIONS[o.id];
  if (!t && !o.mvdLabel && o.mvdMin == null) return null;
  return { label: o.mvdLabel || t?.label || null, min: o.mvdMin ?? t?.min ?? null };
}

export function habitsSeed() {
  const list = [
    // MORNING
    h({ id: 'h-morning-reset', name: 'Morning reset', section: 'morning', category: 'health', icon: 'sunrise', priority: 'core', time: '06:00',
      description: 'One tick for the whole routine.', goalId: 'g-health',
      checklist: MORNING_RESET }),
    h({ id: 'h-sleep', name: 'Sleep', section: 'morning', category: 'health', icon: 'bed', type: 'duration', unit: 'h', target: 7.5, min: 7,
      source: 'sleep', priority: 'core', affectsScore: true, goalId: 'g-health',
      description: 'From your morning check-in. 7.5–8.5 hours is the target.' }),
    h({ id: 'h-prayer', name: 'Prayer', section: 'morning', category: 'spirit', icon: 'hand-heart', priority: 'core', affectsScore: true, mvd: true,
      time: '06:05', goalId: 'g-spirit',
      description: '5–10 minutes. One thing you’re grateful for, one thing you need God’s help with today.' }),
    h({ id: 'h-scripture', name: 'Scripture', section: 'morning', category: 'spirit', icon: 'book-heart', priority: 'core', time: '06:10', goalId: 'g-spirit',
      description: 'A short reading. Longer study happens weekly.' }),
    h({ id: 'h-mobility', name: 'Mobility & posture', section: 'morning', category: 'posture', icon: 'person-standing', priority: 'core', time: '06:15',
      mvd: true, mvdLabel: '5-minute mobility', goalId: 'g-posture',
      description: '10 minutes. Consistency, not perfection.',
      checklist: ['Chin tucks × 10', 'Wall angels × 10', 'Thoracic extensions × 8–10', 'External rotation (2 kg) × 12–15',
        'Scapular retractions × 12–15', 'Doorway chest stretch 2 × 30 s', 'Cat-cow × 8', 'Hip-flexor stretch 30 s / side'] }),
    h({ id: 'h-training', name: 'Training', section: 'morning', category: 'body', icon: 'activity', priority: 'core', affectsScore: true, mvd: true,
      mvdLabel: '10-minute walk', time: '06:30', source: 'workout:any', goalId: 'g-strength',
      description: 'Today’s session from the plan. A walk counts on recovery days.' }),

    // BODY
    h({ id: 'h-water', name: 'Water', section: 'body', category: 'health', icon: 'droplet', type: 'numeric', unit: 'ml', target: 2800, min: 2500,
      mvdMin: 2000, step: 500, source: 'water', priority: 'core', affectsScore: true, mvd: true, goalId: 'g-health',
      description: '2.5–3 L. More in heat or after sweaty sessions.' }),
    h({ id: 'h-protein', name: 'Protein', section: 'body', category: 'health', icon: 'beef', type: 'numeric', unit: 'g', target: 150, min: 135,
      mvdMin: 120, step: 25, source: 'protein', priority: 'core', affectsScore: true, mvd: true, goalId: 'g-body',
      description: 'Priority #1 nutrition habit. Protein in every main meal.' }),
    h({ id: 'h-steps', name: 'Steps', section: 'body', category: 'body', icon: 'footprints', type: 'quantity', unit: 'steps', target: 9000,
      ramp: [7000, 8000, 9000], step: 1000, source: 'steps', priority: 'core', affectsScore: true, goalId: 'g-health',
      description: 'Adaptive: 7,000 in week 1, 8,000 in week 2, then 9,000 toward a 9–10k average.' }),
    h({ id: 'h-strength', name: 'Strength session', section: 'body', category: 'body', icon: 'dumbbell', schedule: { kind: 'perWeek', count: 4 },
      source: 'workout:strength', goalId: 'g-strength', description: 'Mon/Thu upper + posture · Tue/Fri lower + calves + core.' }),
    h({ id: 'h-progression', name: 'Progression', section: 'body', category: 'body', icon: 'trending-up', schedule: { kind: 'perWeek', count: 4 },
      source: 'workout:progression', goalId: 'g-strength',
      description: 'Did I improve something? +1 rep, +1 set, slower, longer hold, harder variation, less rest, more range or heavier.' }),
    h({ id: 'h-core', name: 'Core', section: 'body', category: 'body', icon: 'circle-dot', schedule: { kind: 'perWeek', count: 3 },
      source: 'workout:core', goalId: 'g-strength', description: 'A strong, stable trunk. Not endless ab work.' }),
    h({ id: 'h-calves', name: 'Calves', section: 'body', category: 'body', icon: 'chevron-up', schedule: { kind: 'perWeek', count: 3 },
      source: 'workout:calves', goalId: 'g-calves', description: 'Standing → single-leg → slow eccentric → paused.' }),
    h({ id: 'h-cardio', name: 'Cardio', section: 'body', category: 'body', icon: 'bike', schedule: { kind: 'perWeek', count: 2 },
      source: 'workout:cardio', goalId: 'g-health', description: '20–30 min: brisk or incline walk, cycling, easy jog.' }),
    h({ id: 'h-produce', name: 'Fruit & veg', section: 'body', category: 'health', icon: 'apple', type: 'quantity', unit: 'servings',
      target: 4, min: 3, step: 1, source: 'produce', goalId: 'g-health', description: '2+ vegetables and 1–2 fruit.' }),
    h({ id: 'h-measure', name: 'Body measurements', section: 'body', category: 'body', icon: 'ruler', schedule: { kind: 'interval', every: 14 },
      source: 'measurements', goalId: 'g-body', description: 'Every two weeks: waist, chest, arms, thighs, calves (neck optional).' }),
    h({ id: 'h-photos', name: 'Progress photos', section: 'body', category: 'body', icon: 'camera', schedule: { kind: 'perMonth', count: 1 },
      source: 'photos', goalId: 'g-body', description: 'Same light, distance, pose and time. Front, side, back. Stays on this device.' }),

    // MIND
    h({ id: 'h-read', name: 'Read / learn', section: 'mind', category: 'mind', icon: 'book-open', type: 'duration', unit: 'min', target: 20, step: 10,
      source: 'mind', priority: 'core', affectsScore: true, goalId: 'g-mind',
      description: '20 minutes of reading or deliberate learning.' }),
    h({ id: 'h-meditation', name: 'Meditation', section: 'mind', category: 'mind', icon: 'leaf', type: 'duration', unit: 'min', target: 10, min: 5,
      step: 5, source: 'meditation', priority: 'optional', optional: true, weekly: false, goalId: 'g-mind',
      description: '5–10 minutes. Breath, contemplative prayer or silence.' }),
    h({ id: 'h-journal', name: 'Journal', section: 'mind', category: 'mind', icon: 'notebook-pen', source: 'journal', priority: 'optional',
      optional: true, weekly: false, goalId: 'g-mind', description: 'Three questions, morning or evening.' }),

    // SPIRIT
    h({ id: 'h-gratitude', name: 'Gratitude', section: 'spirit', category: 'spirit', icon: 'sparkle', goalId: 'g-spirit',
      description: 'Name one thing, specifically.' }),
    h({ id: 'h-church', name: 'Church / worship', section: 'spirit', category: 'spirit', icon: 'church', schedule: { kind: 'weekdays', days: [7] },
      goalId: 'g-spirit', description: 'Sunday worship or equivalent.' }),
    h({ id: 'h-study', name: 'Longer Scripture study', section: 'spirit', category: 'spirit', icon: 'scroll-text', schedule: { kind: 'perWeek', count: 1 },
      priority: 'optional', optional: true, weekly: false, goalId: 'g-spirit', description: 'A slower, deeper reading once a week.' }),

    // LIFE (work + relationships + admin)
    h({ id: 'h-top3', name: 'Top 3 priorities', section: 'life', category: 'work', icon: 'list-checks', schedule: { kind: 'weekdays', days: WORKDAYS },
      source: 'top3', priority: 'core', affectsScore: true, time: '09:30',
      description: 'Before work: the three things that make today a win.' }),
    h({ id: 'h-deep', name: 'Deep work', section: 'life', category: 'work', icon: 'focus', type: 'quantity', unit: 'blocks', target: 3, min: 2,
      step: 1, source: 'deepWork', schedule: { kind: 'weekdays', days: WORKDAYS }, description: '60–90 minute focus blocks, notifications off.' }),
    h({ id: 'h-breaks', name: 'Movement breaks', section: 'life', category: 'posture', icon: 'person-standing', type: 'quantity', unit: 'breaks',
      target: 8, min: 6, step: 1, source: 'breaks', schedule: { kind: 'weekdays', days: WORKDAYS }, goalId: 'g-posture',
      description: 'Every 45–60 min: stand, walk, roll shoulders, chin tuck. 1–2 minutes.' }),
    h({ id: 'h-eyes', name: 'Visual breaks', section: 'life', category: 'health', icon: 'scan-eye', type: 'quantity', unit: 'breaks', target: 6,
      min: 4, step: 1, source: 'eyeBreaks', schedule: { kind: 'weekdays', days: WORKDAYS }, priority: 'optional', optional: true, weekly: false,
      description: 'Look about 20 feet away for about 20 seconds. A comfort habit, not a treatment.' }),
    h({ id: 'h-son', name: 'Father–son time', section: 'life', category: 'relationships', icon: 'user-round', schedule: { kind: 'perWeek', count: 1 },
      source: 'rel:son', goalId: 'g-relationships', description: 'A conversation, a shared activity, guidance or encouragement. Connection, not policing.' }),
    h({ id: 'h-date', name: 'Couple time', section: 'life', category: 'relationships', icon: 'coffee', schedule: { kind: 'perWeek', count: 1 },
      source: 'rel:date', goalId: 'g-relationships', description: 'Dinner, a walk, coffee, a movie, a day trip, time just for the two of you.' }),
    h({ id: 'h-family', name: 'Family check-in', section: 'life', category: 'relationships', icon: 'message-circle', schedule: { kind: 'perWeek', count: 1 },
      source: 'rel:family', goalId: 'g-relationships', description: 'One meaningful conversation.' }),
    h({ id: 'h-mealprep', name: 'Meal prep', section: 'life', category: 'life', icon: 'chef-hat', schedule: { kind: 'weekdays', days: [7] },
      goalId: 'g-body', description: '30–60 min: a protein, a carb base, chopped veg, easy snacks. Make the healthy option the lazy option.' }),
    h({ id: 'h-weekly-review', name: 'Weekly review', section: 'life', category: 'life', icon: 'calendar-days', schedule: { kind: 'weekdays', days: [7] },
      source: 'weeklyReview', time: '19:00', description: 'About three minutes on Sunday evening. One change for next week.' }),
    h({ id: 'h-finance', name: 'Business & finance review', section: 'life', category: 'work', icon: 'wallet', schedule: { kind: 'perWeek', count: 1 },
      description: 'Revenue, pipeline, sales, delivery, marketing, cash flow, outstanding tasks, one strategic priority.' }),
    h({ id: 'h-monthly-review', name: 'Monthly review', section: 'life', category: 'life', icon: 'calendar', schedule: { kind: 'perMonth', count: 1 },
      source: 'monthlyReview', description: 'Stop, start, continue. One focus for next month.' }),
    h({ id: 'h-desk', name: 'Desk setup check', section: 'life', category: 'posture', icon: 'monitor', schedule: { kind: 'perWeek', count: 1 },
      priority: 'optional', optional: true, weekly: false, goalId: 'g-posture',
      description: 'Screen near eye level, feet supported, shoulders relaxed, alternate sitting and standing.' }),

    // EVENING
    h({ id: 'h-shutdown', name: 'Work shutdown', section: 'evening', category: 'work', icon: 'power', schedule: { kind: 'weekdays', days: WORKDAYS },
      source: 'shutdown', priority: 'core', time: '20:00',
      description: 'What did I complete? What remains? Tomorrow’s first priority? Then stop.' }),
    h({ id: 'h-fiancee', name: 'Time with your fiancée', section: 'evening', category: 'relationships', icon: 'heart', priority: 'core',
      affectsScore: true, mvd: true, mvdLabel: '10 minutes with your fiancée, phone away', time: '20:00', source: 'rel:fiancee', goalId: 'g-relationships',
      description: '10–20 minutes, phone away. “How are you really doing?”' }),
    h({ id: 'h-home', name: 'Home reset', section: 'evening', category: 'life', icon: 'house', schedule: { kind: 'perWeek', count: 5 },
      mvd: true, mvdLabel: '5-minute tidy', description: 'Five-minute tidy, dishes and kitchen reset.' }),
    h({ id: 'h-evening', name: 'Evening routine', section: 'evening', category: 'health', icon: 'moon', priority: 'core', time: '21:00', goalId: 'g-health',
      description: 'Wind down so 22:00 is easy.',
      checklist: ['Clothes and training kit ready', 'Tomorrow’s calendar reviewed', 'Hygiene and teeth', 'Screens down for the last 30 min', 'Short prayer'] }),
    h({ id: 'h-eye-care', name: 'Eye care check', section: 'evening', category: 'health', icon: 'eye', type: 'check', priority: 'optional',
      optional: true, weekly: false, description: 'Breaks taken, eyes not rubbed, prescribed correction worn. Healthy habits only — not a treatment.' }),
    h({ id: 'h-lights-out', name: 'Lights out by 22:00', section: 'evening', category: 'health', icon: 'moon-star', priority: 'core', mvd: true,
      mvdLabel: 'Sleep on time', time: '22:00', goalId: 'g-health', description: '7.5–8.5 hours before a 06:00 wake.' }),
    ...OPTIONAL_HABITS.map(h),
  ];
  return list.map((x, i) => ({ ...x, order: i }));
}

export function goalsSeed() {
  const m = (title) => ({ id: store.uid(), title, done: false, doneAt: null });
  return [
    { id: 'g-body', name: 'Body composition', category: 'body', type: 'numeric', metric: 'bodyFat', unit: '%', start: 25, target: 15,
      direction: 'down', deadline: null, status: 'active', order: 0,
      description: 'Toward roughly 15% body fat while keeping muscle. Body-fat figures are estimates.',
      habitIds: ['h-training', 'h-protein', 'h-steps', 'h-strength'], milestones: [] },
    { id: 'g-strength', name: 'Strength', category: 'body', type: 'milestones', status: 'active', order: 1, deadline: null,
      description: 'Progressive bodyweight and dumbbell strength.',
      habitIds: ['h-strength', 'h-progression', 'h-core'],
      milestones: [m('15 strict push-ups in one set'), m('Decline push-ups 3 × 10'), m('10 pike push-ups'),
        m('Bulgarian split squat 3 × 12 / leg with 10 kg'), m('Single-leg Romanian deadlift 3 × 12 / leg with 10 kg'), m('60-second plank')] },
    { id: 'g-calves', name: 'Calves', category: 'body', type: 'milestones', status: 'active', order: 2, deadline: null,
      description: 'Increase calf development. Track sessions, volume and calf measurement.',
      habitIds: ['h-calves'],
      milestones: [m('Single-leg calf raise 4 × 15 / side'), m('Paused calf raise with 10 kg 3 × 12 / side'), m('Three calf sessions a week for 8 weeks')] },
    { id: 'g-posture', name: 'Posture', category: 'posture', type: 'consistency', status: 'active', order: 3, deadline: null,
      description: 'Consistent mobility and movement. A consistency goal, not a diagnosis.',
      habitIds: ['h-mobility', 'h-breaks', 'h-desk'], milestones: [] },
    { id: 'g-health', name: 'Health', category: 'health', type: 'consistency', status: 'active', order: 4, deadline: null,
      description: 'Better sleep, hydration and daily movement.',
      habitIds: ['h-sleep', 'h-water', 'h-steps', 'h-lights-out'], milestones: [] },
    { id: 'g-mind', name: 'Mind', category: 'mind', type: 'consistency', status: 'active', order: 5, deadline: null,
      description: 'Consistent reading and deliberate learning.',
      habitIds: ['h-read', 'h-meditation'], milestones: [m('Finish one book this month')] },
    { id: 'g-spirit', name: 'Spirit', category: 'spirit', type: 'consistency', status: 'active', order: 6, deadline: null,
      description: 'Consistent prayer and Scripture. The app tracks practice, not faith.',
      habitIds: ['h-prayer', 'h-scripture', 'h-church', 'h-gratitude'], milestones: [] },
    { id: 'g-relationships', name: 'Relationships', category: 'relationships', type: 'consistency', status: 'active', order: 7, deadline: null,
      description: 'Intentional time with your fiancée, your son and family.',
      habitIds: ['h-fiancee', 'h-son', 'h-date', 'h-family'], milestones: [] },
  ];
}

const ex = (id, name, category, o = {}) => ({ id, name, category, metric: 'reps', unilateral: false, family: null, level: 0,
  defaultLoad: 0, cues: '', archived: false, ...o });

export function exercisesSeed() {
  return [
    ex('e-pushup-incline', 'Incline push-up', 'chest', { family: 'push-up', level: 1, cues: 'Hands on a bench or table. Body in one line.' }),
    ex('e-pushup', 'Push-up', 'chest', { family: 'push-up', level: 2, cues: 'Elbows ~45°. Full range, chest to fist height.' }),
    ex('e-pushup-decline', 'Decline push-up', 'chest', { family: 'push-up', level: 3, cues: 'Feet raised. Keep the ribs down.' }),
    ex('e-pushup-deficit', 'Deficit push-up', 'chest', { family: 'push-up', level: 4, cues: 'Hands on books for extra depth.' }),
    ex('e-floor-press', 'Dumbbell floor press', 'chest', { unilateral: true, defaultLoad: 10 }),
    ex('e-db-row', 'One-arm dumbbell row', 'back', { unilateral: true, defaultLoad: 10, cues: 'Pause at the top. Shoulder away from the ear.' }),
    ex('e-scap-pushup', 'Scapular push-up', 'back', { cues: 'Arms straight. Move only the shoulder blades.' }),
    ex('e-pike-pushup', 'Pike push-up', 'shoulders', { cues: 'Hips high, head toward the floor between the hands.' }),
    ex('e-reverse-fly', 'Reverse fly', 'shoulders', { defaultLoad: 2 }),
    ex('e-y-raise', 'Y-raise', 'shoulders', { defaultLoad: 2 }),
    ex('e-ext-rotation', 'External rotation', 'shoulders', { defaultLoad: 2, unilateral: true }),
    ex('e-hammer-curl', 'Hammer curl', 'arms', { defaultLoad: 10, unilateral: true }),
    ex('e-chair-dip', 'Chair dip', 'arms'),
    ex('e-bss', 'Bulgarian split squat', 'legs', { unilateral: true, defaultLoad: 10, cues: 'Rear foot on a chair. Control the descent.' }),
    ex('e-goblet-squat', 'Goblet squat', 'legs', { defaultLoad: 10, cues: '3-second lowering.' }),
    ex('e-lunge', 'Reverse lunge', 'legs', { unilateral: true }),
    ex('e-sl-rdl', 'Single-leg Romanian deadlift', 'glutes', { unilateral: true, defaultLoad: 10 }),
    ex('e-sl-bridge', 'Single-leg glute bridge', 'glutes', { unilateral: true }),
    ex('e-calf-raise', 'Standing calf raise', 'calves', { family: 'calf', level: 1, cues: 'Full range. Stretch at the bottom.' }),
    ex('e-sl-calf', 'Single-leg calf raise', 'calves', { family: 'calf', level: 2, unilateral: true, cues: 'Off a step. 3 s down, 1 s pause at the bottom.' }),
    ex('e-eccentric-calf', 'Slow eccentric calf raise', 'calves', { family: 'calf', level: 3, unilateral: true, cues: '5-second lowering.' }),
    ex('e-paused-calf', 'Paused calf raise', 'calves', { family: 'calf', level: 4, unilateral: true, defaultLoad: 10, cues: '2-second pause top and bottom.' }),
    ex('e-plank', 'Plank', 'core', { metric: 'time' }),
    ex('e-side-plank', 'Side plank', 'core', { metric: 'time', unilateral: true }),
    ex('e-dead-bug', 'Dead bug', 'core', { unilateral: true }),
    ex('e-hollow', 'Hollow hold', 'core', { metric: 'time' }),
    ex('e-reverse-crunch', 'Reverse crunch', 'core'),
    ex('e-leg-raise', 'Lying leg raise', 'core'),
    ex('e-chin-tuck', 'Chin tuck', 'mobility'),
    ex('e-wall-angel', 'Wall angel', 'mobility'),
    ex('e-thoracic', 'Thoracic extension', 'mobility'),
    ex('e-scap-retraction', 'Scapular retraction', 'mobility'),
    ex('e-doorway', 'Doorway chest stretch', 'mobility', { metric: 'time' }),
    ex('e-cat-cow', 'Cat-cow', 'mobility'),
    ex('e-hip-flexor', 'Hip-flexor stretch', 'mobility', { metric: 'time', unilateral: true }),
    ex('e-walk', 'Brisk walk', 'cardio', { metric: 'minutes' }),
    ex('e-incline-walk', 'Incline walk', 'cardio', { metric: 'minutes' }),
    ex('e-cycle', 'Cycling', 'cardio', { metric: 'minutes' }),
    ex('e-jog', 'Easy jog', 'cardio', { metric: 'minutes' }),
  ];
}

const it = (exerciseId, sets, reps, o = {}) => ({ exerciseId, sets, reps, load: null, ...o });
// Mon/Thu finisher so calves and core each get 4 sessions a week (spec: calves 2–4, core 3–4).
const UPPER_FINISHER = [it('e-calf-raise', 3, '15–20'), it('e-plank', 2, '30–45 s')];

export function templatesSeed() {
  return [
    { id: 't-upper', name: 'Upper body + posture', kind: 'strength', minutes: 55, order: 0,
      note: 'Ends with a short calf and core finisher, so both get 4 sessions a week.', items: [
      it('e-pushup', 4, '6–15'), it('e-pike-pushup', 3, '5–10'), it('e-db-row', 4, '8–15', { load: 10 }),
      it('e-floor-press', 3, '8–12', { load: 10 }), it('e-reverse-fly', 3, '15–20', { load: 2 }), it('e-y-raise', 2, '12–15', { load: 2 }),
      it('e-scap-pushup', 2, '10–12'), ...UPPER_FINISHER] },
    { id: 't-lower', name: 'Lower body + calves + core', kind: 'strength', minutes: 55, order: 1, items: [
      it('e-bss', 3, '8–12', { load: 10 }), it('e-goblet-squat', 3, '12–20', { load: 10 }), it('e-sl-rdl', 3, '8–12', { load: 10 }),
      it('e-sl-bridge', 3, '10–15'), it('e-sl-calf', 4, '8–15'), it('e-dead-bug', 3, '8'), it('e-side-plank', 3, '30–45 s'),
      it('e-hollow', 3, '20–40 s'), it('e-reverse-crunch', 3, '10–15')] },
    { id: 't-recovery', name: 'Walk + mobility', kind: 'recovery', minutes: 35, order: 2, items: [
      it('e-walk', 1, '20–30 min'), it('e-thoracic', 2, '8–10'), it('e-wall-angel', 2, '10'), it('e-doorway', 2, '30 s'), it('e-hip-flexor', 2, '30 s')] },
    { id: 't-cardio', name: 'Cardio', kind: 'cardio', minutes: 30, order: 3, items: [it('e-incline-walk', 1, '20–30 min')] },
    { id: 't-minimum', name: '20-minute minimum', kind: 'strength', minutes: 20, order: 4,
      note: 'For a missed session. Four rounds, then carry on with the week as planned.', items: [
        it('e-pushup', 4, '10'), it('e-goblet-squat', 4, '12', { load: 10 }), it('e-db-row', 4, '10', { load: 10 }),
        it('e-plank', 4, '30 s'), it('e-calf-raise', 4, '15')] },
  ];
}

const food = (id, name, protein, kcal, o = {}) => ({ id, name, protein, kcal, fruit: 0, veg: 0, approx: true, ...o });

export function foodsSeed() {
  return [
    food('f-whey', 'Whey isolate · 1 scoop', 25.5, 113, { approx: false }),
    food('f-eggs', '3 eggs', 19, 215),
    food('f-chicken', 'Chicken breast · 150 g cooked', 46, 250),
    food('f-chicken-curry', 'Chicken curry with rice · plate', 38, 650),
    food('f-beef', 'Lean beef · 150 g cooked', 39, 300),
    food('f-dholl', 'Dholl / lentils · 1 cup cooked', 18, 230),
    food('f-yoghurt', 'Plain yoghurt · 150 g', 6, 95),
    food('f-milk', 'Milk · 250 ml', 8, 125),
    food('f-cheese', 'Cheese · 30 g', 7, 110),
    food('f-oats', 'Oats · 50 g', 6, 190),
    food('f-rice', 'Rice · 1 cup cooked', 4, 205),
    food('f-bread', 'Bread · 2 slices', 7, 160),
    food('f-farata', 'Farata / roti · 1', 6, 280),
    food('f-potato', 'Potatoes · 200 g', 4, 170),
    food('f-banana', 'Banana', 1, 105, { fruit: 1 }),
    food('f-apple', 'Apple', 0, 95, { fruit: 1 }),
    food('f-veg', 'Vegetables / brèdes · 1 serving', 2, 30, { veg: 1 }),
  ].map((f, i) => ({ ...f, order: i }));
}

// The workbook's Week Plan tasks and the one-off jobs from the spec. Dates are relative to day one.
export function tasksSeed(start = today()) {
  const t = (title, area, o = {}) => ({ id: store.uid(), title, area, notes: '', date: null, repeat: null, done: false, doneAt: null, ...o });
  const weekly = (day) => ({ repeat: { kind: 'weekly', day }, date: firstDate({ kind: 'weekly', day }, start) });
  const list = [
    // one-off setup
    t('Book a follow-up with your eye specialist', 'health', { date: start,
      notes: 'Keratoconus check-ups are medical appointments, not exercises. Ask how often they want to see you, then make this a repeating task.' }),
    t('Book a dental / orthodontic assessment', 'health', { date: start,
      notes: 'For the jaw alignment concern. Relax the jaw rather than forcing it into position; let a professional assess it.' }),
    t('Set up the desk for posture', 'posture', { date: addDays(start, 1),
      notes: 'Screen near eye level, feet supported, shoulders relaxed, elbows comfortable. Plan to alternate sitting and standing.' }),
    t('Turn on reminders', 'life', { date: addDays(start, 1),
      notes: 'More → Settings → Reminders: morning reset 06:05, training 06:25, water, movement breaks, evening routine 21:00, Sunday review 19:00.' }),
    t('Coffee or tea? Decide on a 14:00 caffeine cutoff', 'health', {
      notes: 'If you drink caffeine, restore “Caffeine cutoff 14:00” from Habits → Archived. If you don’t, just tick this off.' }),
    t('Alcohol: decide whether to track alcohol-free days', 'health', {
      notes: 'Only if it applies. Restore “Alcohol-free day” from Habits → Archived, or tick this off.' }),
    // weekly chores (Home & life admin)
    t('Laundry', 'life', weekly(6)),
    t('Clean your room', 'life', weekly(6)),
    t('Clean the bathroom', 'life', weekly(6)),
    t('Plan the week’s groceries', 'life', { ...weekly(7),
      notes: 'Before meal prep. Chicken, eggs, lean beef, dholl, yoghurt, milk, oats, rice, potatoes, brèdes and veg, fruit, whey.' }),
    t('Review next week’s calendar', 'work', { ...weekly(7), notes: 'Block training at 06:30, deep work, couple time and family time first.' }),
    // monthly
    t('Back up Life OS', 'life', { repeat: { kind: 'monthly', day: 1 }, date: firstDate({ kind: 'monthly', day: 1 }, addDays(start, 1)),
      notes: 'More → Data → Download backup, then save it to Files or iCloud Drive. Your data lives only on this phone.' }),
  ];
  return list.map((x, i) => ({ ...x, order: i }));
}

const untouched = (r) => r && r.updatedAt === r.createdAt;

/** Bring an earlier seed up to date without touching anything you've changed. */
function migrate(from) {
  const ops = [];
  if (from < 2) {
    if (!store.count('tasks')) ops.push(...tasksSeed().map((value) => ({ store: 'tasks', value })));
    const all = habitsSeed();
    for (const id of ['h-caffeine', 'h-alcohol']) {
      if (!store.get('habits', id)) ops.push({ store: 'habits', value: all.find((x) => x.id === id) });
    }
    const reset = store.get('habits', 'h-morning-reset');
    if (untouched(reset)) ops.push({ store: 'habits', value: { ...reset, checklist: MORNING_RESET } });
    const home = store.get('habits', 'h-home');
    if (untouched(home)) ops.push({ store: 'habits', value: { ...home, mvd: true, mvdLabel: '5-minute tidy' } });
    const upper = store.get('templates', 't-upper');
    if (untouched(upper)) ops.push({ store: 'templates', value: templatesSeed().find((x) => x.id === 't-upper') });
    const fiancee = store.get('habits', 'h-fiancee');
    if (untouched(fiancee)) ops.push({ store: 'habits', value: { ...fiancee, mvdLabel: '10 minutes with your fiancée, phone away' } });
    const health = store.get('goals', 'g-health');
    if (untouched(health)) ops.push({ store: 'goals', value: { ...health, milestones: [] } });
  }
  ops.push({ store: 'meta', value: { ...store.get('meta', 'seed'), version: SEED_VERSION, migratedAt: new Date().toISOString() } });
  store.batch(ops);
}

export async function seedIfNeeded() {
  const meta = store.get('meta', 'seed');
  if (meta) {
    if ((meta.version || 1) < SEED_VERSION) { migrate(meta.version || 1); await store.flush(); }
    return false;
  }
  const ops = [
    { store: 'profile', value: profileSeed() },
    { store: 'settings', value: settingsSeed() },
    ...habitsSeed().map((value) => ({ store: 'habits', value })),
    ...goalsSeed().map((value) => ({ store: 'goals', value })),
    ...exercisesSeed().map((value) => ({ store: 'exercises', value })),
    ...templatesSeed().map((value) => ({ store: 'templates', value })),
    ...foodsSeed().map((value) => ({ store: 'foods', value })),
    ...tasksSeed().map((value) => ({ store: 'tasks', value })),
    ...defaultRoutines(habitsSeed(), profileSeed()).map((value) => ({ store: 'routines', value })),
    { store: 'meta', value: { id: 'seed', version: SEED_VERSION, source: 'Life OS workbook', at: new Date().toISOString() } },
  ];
  store.batch(ops);
  await store.flush();
  return true;
}
