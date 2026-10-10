// Proven training programmes, optional: pick one and it sets up your workouts and your training
// week in one go, or keep your own. Following one changes only the training week and adds its
// workouts to your library (named after the programme); stopping puts your own week back. The
// workouts are ordinary workouts from then on: edit them, and gym mode, progression and records
// treat them like any other.
//
// The evidence the programmes are built on (summarised in each one's "why"):
// - Each muscle trained about twice a week grows more than once a week (Schoenfeld, Ogborn &
//   Krieger 2016, meta-analysis).
// - More weekly sets build more muscle up to around 10+ hard sets per muscle (Schoenfeld, Ogborn &
//   Krieger 2017, dose–response meta-analysis).
// - A low dose still builds strength: one to three hard sets per exercise, two or three times a
//   week (Androulakis-Korakakis et al. 2020, minimum dose review).
// - Progressive overload: double progression (reach the top of the rep range in every set, then add
//   load) for most lifts; simple linear progression for novices on the main barbell lifts.
import * as store from '../data/store.js';
import * as F from './fitness-core.js';

// Exercises the programmes use. The home ones are already in the library; the gym ones are added
// the first time a programme needs them (same id every time, so history stays together).
const X = {
  squat: { id: 'e-back-squat', name: 'Back squat', category: 'legs', defaultLoad: 20, cues: 'Brace, sit between the hips, knees track the toes.' },
  bench: { id: 'e-bench-press', name: 'Bench press', category: 'chest', defaultLoad: 20, cues: 'Shoulder blades back and down, bar to the lower chest.' },
  deadlift: { id: 'e-deadlift', name: 'Deadlift', category: 'back', defaultLoad: 40, cues: 'Bar over mid-foot, push the floor away, lock out with the glutes.' },
  ohp: { id: 'e-ohp', name: 'Overhead press', category: 'shoulders', defaultLoad: 20, cues: 'Ribs down, press straight up, head through at the top.' },
  row: { id: 'e-barbell-row', name: 'Barbell row', category: 'back', defaultLoad: 20, cues: 'Hinge to ~45°, pull to the lower ribs.' },
  rdl: { id: 'e-rdl', name: 'Romanian deadlift', category: 'glutes', defaultLoad: 30, cues: 'Soft knees, hips back, bar close to the legs.' },
  pulldown: { id: 'e-lat-pulldown', name: 'Lat pulldown', category: 'back', defaultLoad: 30, cues: 'Chest up, elbows down to the ribs.' },
  pullup: { id: 'e-pullup', name: 'Pull-up', category: 'back', cues: 'Full hang to chin over the bar. Use a band if needed.' },
  legpress: { id: 'e-leg-press', name: 'Leg press', category: 'legs', defaultLoad: 60, cues: 'Lower until the hips start to tuck, then press.' },
  inclinedb: { id: 'e-incline-db-press', name: 'Incline dumbbell press', category: 'chest', defaultLoad: 12, cues: 'Bench at ~30°.' },
  cablerow: { id: 'e-cable-row', name: 'Seated cable row', category: 'back', defaultLoad: 30, cues: 'Tall chest, pull to the belly button.' },
  lateral: { id: 'e-lateral-raise', name: 'Lateral raise', category: 'shoulders', defaultLoad: 6, cues: 'Lead with the elbows, stop at shoulder height.' },
  legcurl: { id: 'e-leg-curl', name: 'Leg curl', category: 'legs', defaultLoad: 25, cues: 'Slow on the way back.' },
  triceps: { id: 'e-triceps-pushdown', name: 'Triceps pushdown', category: 'arms', defaultLoad: 15, cues: 'Elbows pinned to the sides.' },
  curl: { id: 'e-db-curl', name: 'Dumbbell curl', category: 'arms', defaultLoad: 10, cues: 'No swinging.' },
  hangingraise: { id: 'e-hanging-leg-raise', name: 'Hanging leg raise', category: 'core', cues: 'Curl the pelvis up, no swing.' },
  // Already in your library (home training).
  pushup: { id: 'e-pushup' }, dbrow: { id: 'e-db-row' }, goblet: { id: 'e-goblet-squat' }, bss: { id: 'e-bss' }, slrdl: { id: 'e-sl-rdl' },
  floorpress: { id: 'e-floor-press' }, pike: { id: 'e-pike-pushup' }, bridge: { id: 'e-sl-bridge' }, plank: { id: 'e-plank' },
  deadbug: { id: 'e-dead-bug' }, calf: { id: 'e-calf-raise' }, slcalf: { id: 'e-sl-calf' }, hammer: { id: 'e-hammer-curl' },
  reversefly: { id: 'e-reverse-fly' }, sideplank: { id: 'e-side-plank' }, lunge: { id: 'e-lunge' },
};

/** One exercise in a programme's workout: [key, sets, target, rest seconds]. */
const x = (key, sets, reps, rest) => ({ key, sets, reps, rest });

export const PROGRAMMES = [
  {
    id: 'full-body-3', name: 'Full body, 3 days', level: 'Beginner to intermediate', equipment: 'Gym', minutes: 60,
    summary: 'Squat, press, pull and hinge three times a week. The simplest way to get strong.',
    why: 'Every muscle twice a week or more, which grows more than once a week; the big lifts get heavier every session while that still works.',
    progression: 'Main lifts: when every set reaches the top of the range, add 2.5 kg (upper body) or 5 kg (legs and deadlift) next time. Stuck three times in a row: take 10% off and build back.',
    days: { 1: 0, 3: 1, 5: 0 },
    workouts: [
      { name: 'Full body A', items: [x('squat', 3, '5–8', 180), x('bench', 3, '5–8', 180), x('row', 3, '6–10', 120), x('rdl', 2, '8–10', 120), x('plank', 2, '30–45 s', 45)] },
      { name: 'Full body B', items: [x('deadlift', 2, '5', 180), x('ohp', 3, '5–8', 180), x('pulldown', 3, '8–12', 90), x('legpress', 2, '10–12', 120), x('hangingraise', 2, '8–12', 45)] },
    ],
  },
  {
    id: 'upper-lower-4', name: 'Upper / lower, 4 days', level: 'Intermediate', equipment: 'Gym', minutes: 60,
    summary: 'Two upper and two lower days: one heavier, one higher-rep of each.',
    why: 'Each muscle twice a week with 10–16 hard sets, the range the dose–response research points to for growth, while heavy days keep building strength.',
    progression: 'Double progression: reach the top of the rep range in every set, then add the smallest load step.',
    days: { 1: 0, 2: 1, 4: 2, 5: 3 },
    workouts: [
      { name: 'Upper (heavy)', items: [x('bench', 4, '5–8', 180), x('row', 4, '6–8', 150), x('ohp', 3, '6–10', 120), x('pullup', 3, '6–10', 120), x('triceps', 2, '10–15', 60)] },
      { name: 'Lower (heavy)', items: [x('squat', 4, '5–8', 180), x('rdl', 3, '6–10', 150), x('legpress', 2, '10–12', 120), x('calf', 3, '10–15', 60), x('plank', 2, '30–45 s', 45)] },
      { name: 'Upper (volume)', items: [x('inclinedb', 3, '8–12', 120), x('cablerow', 3, '10–12', 90), x('lateral', 3, '12–20', 60), x('pulldown', 3, '10–12', 90), x('curl', 2, '10–15', 60)] },
      { name: 'Lower (volume)', items: [x('deadlift', 3, '5', 180), x('bss', 3, '8–12', 120), x('legcurl', 3, '10–15', 90), x('slcalf', 3, '10–15', 60), x('hangingraise', 2, '8–12', 45)] },
    ],
  },
  {
    id: 'ppl-6', name: 'Push / pull / legs', level: 'Intermediate to advanced', equipment: 'Gym', minutes: 60,
    summary: 'Push, pull and legs, each twice a week over six days. Or three days for once a week each.',
    why: 'Run twice a week, each muscle gets two sessions and plenty of weekly sets; the three-day version is easier to fit but trains each muscle once a week.',
    progression: 'Double progression on everything; add load once every set hits the top of the range.',
    days: { 1: 0, 2: 1, 3: 2, 4: 0, 5: 1, 6: 2 },
    short: { 1: 0, 3: 1, 5: 2 },
    workouts: [
      { name: 'Push', items: [x('bench', 4, '6–10', 150), x('ohp', 3, '6–10', 120), x('inclinedb', 3, '8–12', 90), x('lateral', 3, '12–20', 60), x('triceps', 3, '10–15', 60)] },
      { name: 'Pull', items: [x('row', 4, '6–10', 150), x('pulldown', 3, '8–12', 90), x('cablerow', 3, '10–12', 90), x('reversefly', 3, '15–20', 60), x('curl', 3, '10–15', 60)] },
      { name: 'Legs', items: [x('squat', 4, '6–10', 180), x('rdl', 3, '8–10', 150), x('legpress', 3, '10–15', 120), x('legcurl', 3, '10–15', 90), x('calf', 3, '10–15', 60)] },
    ],
  },
  {
    id: 'minimum-2', name: 'Minimum dose, 2 days', level: 'Any', equipment: 'Gym or dumbbells', minutes: 40,
    summary: 'Two short full-body sessions, two hard sets per exercise. For busy seasons.',
    why: 'Strength keeps rising on one to three hard sets per exercise, two or three times a week, as long as each set ends close to failure.',
    progression: 'Each set ends with 1–2 reps left in the tank. Add load once you beat the top of the range.',
    days: { 2: 0, 5: 1 },
    workouts: [
      { name: 'Minimum A', items: [x('squat', 2, '6–10', 150), x('bench', 2, '6–10', 150), x('row', 2, '8–12', 120), x('plank', 2, '30–45 s', 45)] },
      { name: 'Minimum B', items: [x('rdl', 2, '8–10', 150), x('ohp', 2, '6–10', 120), x('pulldown', 2, '8–12', 90), x('calf', 2, '10–15', 60)] },
    ],
  },
  {
    id: 'home-3', name: 'Home dumbbells, 3 days', level: 'Beginner to intermediate', equipment: 'Dumbbells and bodyweight', minutes: 45,
    summary: 'Full body at home with a pair of dumbbells, three times a week.',
    why: 'The same principles as the gym programmes: every muscle twice or more a week, close to failure, with harder variations when the reps get easy.',
    progression: 'Double progression; for bodyweight moves, take the next step in the family (incline push-up, push-up, decline…) when you reach the top of the range.',
    days: { 1: 0, 3: 1, 5: 0 },
    workouts: [
      { name: 'Home A', items: [x('goblet', 3, '10–15', 90), x('pushup', 3, '6–15', 90), x('dbrow', 3, '8–15', 90), x('bridge', 2, '10–15', 60), x('deadbug', 2, '8', 45)] },
      { name: 'Home B', items: [x('bss', 3, '8–12', 90), x('floorpress', 3, '8–12', 90), x('slrdl', 3, '8–12', 90), x('pike', 2, '5–10', 90), x('sideplank', 2, '30–45 s', 45)] },
    ],
  },
];

export const programme = (id) => PROGRAMMES.find((p) => p.id === id) || null;
/** The programme you're following: { id, since, short, prevPlan } or null. */
export const following = () => store.profile()?.programme || null;
const tid = (p, i) => `t-pg-${p.id}-${i}`;

/** The weekday → workout mapping for a programme (`short`: its three-day version, when it has one). */
export function daysFor(p, { short = false } = {}) {
  return (short && p.short) || p.days;
}

/** Add the exercises a programme needs that aren't in the library yet (restoring archived ones). */
function exerciseOps(p) {
  const ops = [];
  const seen = new Set();
  for (const w of p.workouts) for (const it of w.items) {
    const def = X[it.key];
    if (!def || seen.has(def.id)) continue;
    seen.add(def.id);
    const e = F.exercise(def.id);
    if (e && !e.archived) continue;
    if (e) { ops.push({ store: 'exercises', value: { ...e, archived: false } }); continue; }
    if (!def.name) continue; // a home exercise that was deleted: its items are left out below
    ops.push({ store: 'exercises', value: { id: def.id, name: def.name, category: def.category, metric: 'reps', unilateral: false, family: null, level: 0,
      defaultLoad: def.defaultLoad || 0, cues: def.cues || '', archived: false } });
  }
  return ops;
}

/** The programme's workouts as your workouts, with stable ids (following it again refreshes them). */
function templateValues(p, haveExercise) {
  const base = Math.max(-1, ...F.templates().filter((t) => !String(t.id).startsWith(`t-pg-${p.id}-`)).map((t) => t.order ?? 0)) + 1;
  return p.workouts.map((w, i) => ({
    ...(F.template(tid(p, i)) || {}),
    id: tid(p, i), name: w.name, kind: 'strength', minutes: p.minutes, order: base + i, programme: p.id,
    note: `${p.name}. ${p.progression}`,
    items: w.items.filter((it) => haveExercise(X[it.key]?.id)).map((it, j) => ({ id: `${tid(p, i)}-${j}`, exerciseId: X[it.key].id, sets: it.sets, reps: it.reps, load: null, rest: it.rest })),
  }));
}

/**
 * Follow a programme: its workouts go into your library and your training week follows it.
 * Days without a programme workout keep a recovery or cardio session you had on them. Returns an undo.
 */
export function follow(id, { short = false } = {}) {
  const p = programme(id);
  if (!p) return () => {};
  const profile = store.profile();
  const exOps = exerciseOps(p);
  // What undo puts back: the profile, this programme's workouts as they were, and any exercise
  // this brought back from the archive.
  const before = [{ store: 'profile', value: profile },
    ...F.templates().filter((t) => String(t.id).startsWith(`t-pg-${p.id}-`)).map((value) => ({ store: 'templates', value })),
    ...exOps.map((o) => F.exercise(o.value.id)).filter(Boolean).map((value) => ({ store: 'exercises', value }))];
  const created = p.workouts.map((_, i) => tid(p, i)).filter((t) => !F.template(t));
  const madeExercises = exOps.map((o) => o.value.id).filter((e) => !F.exercise(e));
  const newIds = new Set(exOps.map((o) => o.value.id));
  const have = (eid) => !!eid && (newIds.has(eid) || (F.exercise(eid) && !F.exercise(eid).archived));
  const tpls = templateValues(p, have);
  const days = daysFor(p, { short });
  // Your own week is kept to put back when you stop (only the first time: switching programmes keeps it).
  const prevPlan = following()?.prevPlan ?? (profile.plan || {});
  const plan = {};
  for (let d = 1; d <= 7; d++) {
    if (days[d] != null) plan[d] = tpls[days[d]].id;
    else {
      const keep = prevPlan[d] && F.template(prevPlan[d]);
      plan[d] = keep && ['recovery', 'cardio'].includes(keep.kind) ? prevPlan[d] : null;
    }
  }
  store.batch([
    ...exOps,
    ...tpls.map((value) => ({ store: 'templates', value })),
    { store: 'profile', value: { ...profile, plan, programme: { id: p.id, since: new Date().toISOString().slice(0, 10), short: !!(short && p.short), prevPlan } } },
  ]);
  return () => {
    // Everything as it was; the workouts and exercises this added go again unless you've trained with them.
    const usedTemplates = new Set(store.all('workouts').map((w) => w.templateId));
    const trainedWith = new Set(store.all('workoutSets').map((s) => s.exerciseId));
    store.batch([
      ...before,
      ...created.filter((t) => !usedTemplates.has(t)).map((t) => ({ store: 'templates', delete: t })),
      ...madeExercises.filter((e) => !trainedWith.has(e)).map((e) => ({ store: 'exercises', delete: e })),
    ]);
  };
}

/** Stop following: your own training week comes back; the programme's workouts stay in your library. */
export function stop() {
  const f = following();
  if (!f) return () => {};
  const profile = store.profile();
  store.setProfile({ plan: f.prevPlan || {}, programme: null });
  return () => store.put('profile', profile);
}

/** Exercises a programme would add to your library (names), for the sheet before you follow it. */
export function newExercises(id) {
  const p = programme(id);
  if (!p) return [];
  return exerciseOps(p).filter((o) => !F.exercise(o.value.id)).map((o) => o.value.name);
}

/** A workout's exercises in words: [{ name, sets, reps }]. */
export function itemsOf(workout) {
  return workout.items.map((it) => ({ name: X[it.key]?.name || F.exercise(X[it.key]?.id)?.name || it.key, sets: it.sets, reps: it.reps })).filter((x) => x.name);
}

/** The programme's week in words: [{ day: 1–7, workout name | null }]. */
export function weekOf(id, { short = false } = {}) {
  const p = programme(id);
  if (!p) return [];
  const days = daysFor(p, { short });
  return [1, 2, 3, 4, 5, 6, 7].map((d) => ({ day: d, workout: days[d] != null ? p.workouts[days[d]].name : null }));
}
