// "Your plan": the workbook's Plan & Routines playbook, built from your live profile,
// habits, workout templates, targets and repeating tasks, so it stays true when you edit them.
import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import * as F from '../domain/fitness.js';
import * as T from '../domain/tasks.js';
import { parseHM, fmtHM } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { pageHead } from '../ui/components.js';
import { num } from '../ui/format.js';

const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PARTS = [['day', 'Day'], ['week', 'Week'], ['routines', 'Routines'], ['training', 'Training'], ['food', 'Food'], ['rules', 'Rules']];

const shift = (hm, mins) => fmtHM(parseHM(hm) + mins);
const sec = (id, title, body, link) => html`<section class="block plan-sec" id="plan-${id}" data-key="plan-${id}">
  <div class="block-head"><h2 class="block-title">${title}</h2>${link ? html`<button type="button" class="link-btn" data-action="nav" data-to="${link[0]}">${link[1]}</button>` : ''}</div>
  ${body}</section>`;
const kv = (rows) => html`<dl class="facts plan-facts">${rows.filter(Boolean).map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>`;
const notes = (rows) => html`<div class="card plan-notes">${rows.map(([k, v]) => html`<p><strong>${k}</strong> ${v}</p>`)}</div>`;

function daySchedule(p) {
  const habitTime = (id, fallback) => H.habit(id)?.time || fallback;
  return [
    [p.wakeTime, 'Wake · morning reset', 'Out of bed, water, make the bed, outdoor light, no social media for 30 minutes'],
    [habitTime('h-prayer', shift(p.wakeTime, 5)), 'Prayer & Scripture', '5–10 minutes'],
    [habitTime('h-mobility', shift(p.wakeTime, 15)), 'Mobility & posture', '10 minutes, one tick for the whole routine'],
    [p.trainTime, 'Training', 'The session from your weekly plan'],
    [shift(p.trainTime, 90), 'Breakfast & prep', 'Protein first: 30–40 g'],
    [p.workStart, 'Work', 'Top 3 before you start · 2–3 deep-work blocks · move every 45–60 min · 20-20-20 for the eyes'],
    [p.workEnd, 'Shutdown · then people', 'What’s done, what remains, tomorrow’s first priority. Then your fiancée and family'],
    [p.windDown || shift(p.bedTime, -60), 'Evening routine', 'Kit and clothes ready, tomorrow reviewed, hygiene, short prayer, gratitude'],
    [shift(p.bedTime, -30), 'Read / quiet', 'Screens down for the last 30 minutes'],
    [p.bedTime, 'Lights out', '7.5–8.5 hours before the alarm'],
  ];
}

function weekRows(p) {
  const habits = H.activeHabits();
  const tasks = T.open().filter((t) => t.repeat?.kind === 'weekly');
  return [1, 2, 3, 4, 5, 6, 7].map((d) => {
    const tpl = p.plan?.[d] ? F.template(p.plan[d]) : null;
    const extras = [
      ...habits.filter((h) => h.schedule?.kind === 'weekdays' && h.schedule.days?.length < 5 && h.schedule.days.includes(d)).map((h) => h.name),
      ...tasks.filter((t) => t.repeat.day === d).map((t) => t.title),
    ];
    return { d, name: DAY_NAMES[d], session: tpl?.name || (d === 7 ? 'Recovery' : 'Rest'), extras: [...new Set(extras)] };
  });
}

const steps = (h) => (h?.checklist?.length ? html`<ul class="plan-steps">${h.checklist.map((x) => html`<li>${x}</li>`)}</ul>` : '');

export default {
  id: 'playbook',
  title: 'Your plan',
  render() {
    const p = store.profile();
    const t = store.settings().targets;
    const bands = store.settings().bands;
    const habits = H.activeHabits();
    const mvd = habits.filter((h) => h.mvd);
    const three = H.focusHabits();
    const routines = ['h-morning-reset', 'h-mobility', 'h-evening'].map((id) => H.habit(id)).filter((h) => h && !h.archived);
    const tpls = F.templates();
    return html`
      ${pageHead({ title: 'Your plan', back: { to: 'plan', label: 'Plan' }, sub: 'The playbook behind the ticks. Edit any habit, template or target and this page follows.' })}
      <p class="plan-motto">Consistency over intensity · Progress over perfection · Systems over motivation · Health over extreme results</p>
      <nav class="chips plan-jump" aria-label="Jump to">${PARTS.map(([id, label]) => html`<button type="button" class="chip" data-action="jump" data-id="${id}">${label}</button>`)}</nav>

      ${sec('day', 'Your day', html`<ol class="card plan-day">${daySchedule(p).map(([time, what, detail]) => html`<li>
        <span class="plan-time tnum">${time}</span><span class="plan-what"><strong>${what}</strong><span>${detail}</span></span></li>`)}</ol>`, ['you/settings', 'Change times'])}

      ${sec('week', 'Your week', html`<ul class="card plan-week">${weekRows(p).map((r) => html`<li>
        <span class="plan-dow">${r.name.slice(0, 3)}</span>
        <span class="plan-what"><strong>${r.session}</strong>${r.extras.length ? html`<span>${r.extras.join(' · ')}</span>` : ''}</span></li>`)}</ul>
        <p class="fine-print">At least one lower-intensity day a week: walking, mobility, light cycling, family activity. Missed a session? Do the 20-minute minimum once, then carry on. Don’t move the whole week around.</p>`,
        ['plan/training', 'Edit plan'])}

      ${sec('routines', 'Routines', html`${routines.map((h) => html`<div class="card plan-routine">
          <div class="plan-routine-head"><strong>${h.name}</strong>${h.time ? html`<span class="muted tnum">${h.time}</span>` : ''}
            <button type="button" class="link-btn" data-action="nav" data-to="plan/habits/${h.id}?edit=1">Edit</button></div>
          ${steps(h)}<p class="muted small">One tick for the whole routine. Consistency, not administrative gymnastics.</p></div>`)}`)}

      ${sec('training', 'Training', html`${tpls.map((tp) => html`<div class="card plan-routine">
          <div class="plan-routine-head"><strong>${tp.name}</strong><span class="muted tnum">~${tp.minutes} min</span></div>
          <ul class="plan-steps">${(tp.items || []).map((it) => html`<li>${F.exercise(it.exerciseId)?.name || it.exerciseId} <span class="muted">${it.sets} × ${it.reps}${it.load ? ` · ${it.load} kg` : ''}</span></li>`)}</ul>
          ${tp.note ? html`<p class="muted small">${tp.note}</p>` : ''}</div>`)}
        ${notes([
          ['Progression.', 'Every session, ask: did I improve something? +1 rep, +1 set, better form, slower lowering, longer hold, harder variation, less rest, more range, or heavier.'],
          ['Calves.', 'Standing → single-leg → slow eccentric → paused. Priority muscle, 3–4 sessions a week.'],
          ['Core.', 'A strong, stable trunk, not endless ab work. 3–4 sessions a week.'],
          ['Cardio & steps.', `2–3 × 20–30 min of brisk or incline walking, cycling or an easy jog. Steps ramp ${(t.stepsRamp || []).map((s) => num(s)).join(' → ')} over the first weeks, then hold a 9–10k average.`],
        ])}`, ['plan/training/exercises', 'Exercises'])}

      ${sec('food', 'Food', html`${kv([
          ['Calories', `${num(t.kcalMin)}–${num(t.kcalMax)} kcal to start · adjusted on the 2–3 week weight trend, never below ${num(t.kcalFloor)}`],
          ['Protein', `${num(t.proteinG)} g a day · breakfast 30–40 · lunch 35–45 · snack 20–30 · dinner 40–50`],
          ['Whey isolate', '1 scoop ≈ 25.5 g protein · 113 kcal. Use it to fill gaps'],
          ['Fat', `${t.fatMinG || 50}–${t.fatMaxG || 65} g · portion awareness, not elimination`],
          ['Carbs', 'The rest of the calories. No carb phobia'],
          ['Water', `${num(t.waterMl / 1000, 1)} L a day, counted from ${num(t.waterHitMl / 1000, 1)} L · 500 ml × 5–6, more in heat or after sweaty sessions`],
          ['Fruit & veg', '2+ vegetables and 1–2 fruit a day'],
          ['Caffeine', 'If you drink coffee or tea: nothing after 14:00'],
        ])}
        ${notes([
          ['Protein.', 'Chicken · eggs · lean beef · dholl and lentils · beans · yoghurt · cheese · milk · whey. No seafood, no pork.'],
          ['Carbs.', 'Rice · potatoes · oats · bread · roti or farata (watch the portion) · fruit.'],
          ['Veg.', 'Brèdes · cabbage · pumpkin · chou chou · carrots · tomatoes · salad.'],
          ['Example day.', 'Oats + whey + banana (~35 g) · chicken curry, rice, salad (~40 g) · yoghurt or 2 eggs (~20 g) · grilled chicken or beef, potatoes, veg (~45 g).'],
          ['Meal prep, Sunday.', '30–60 minutes: cook a protein, a carb base, chop veg, boil eggs, portion snacks. Make the healthy option the lazy option.'],
        ])}`, ['progress/body/nutrition', 'Nutrition'])}

      ${sec('rules', 'Rules', html`
        <div class="card plan-routine"><div class="plan-routine-head"><strong>Minimum day</strong><span class="muted">${mvd.length} essentials</span></div>
          <ul class="plan-steps">${mvd.map((h) => html`<li>${H.tinyOf(h)?.label || h.name}</li>`)}</ul>
          <p class="muted small">When work explodes, you’re tired or travelling. Switch the day to Minimum from the Today header. That’s it. No guilt.</p></div>
        <div class="card plan-routine"><div class="plan-routine-head"><strong>Sick day</strong></div>
          <p class="small">No hard training, no aggressive deficit, no forced cardio. Rest, hydration, nutrition, sleep, and medical care when needed. The day is paused and doesn’t drag your averages down. Resume training gradually.</p></div>
        <div class="card plan-routine"><div class="plan-routine-head"><strong>Daily score</strong><span class="muted">${three.length} of ${H.focusLimit()} chosen</span>
            <button type="button" class="link-btn" data-action="nav" data-to="plan/habits/sort">${three.length ? 'Change' : 'Choose'}</button></div>
          <p class="small">${three.length ? `Your three: ${three.map((h) => h.name).join(' · ')}, plus today’s Top 3. Tiny versions count; autopilot habits never lower it.` : 'Choose your three habits to train. They and today’s Top 3 make the score; everything else runs on autopilot.'}</p>
          <p class="muted small">Rolling 7- and 30-day consistency, not streaks: strong ≥ ${bands.strong}% · steady ${bands.steady}–${bands.strong - 1}% · needs attention ${bands.attention}–${bands.steady - 1}% · below that, simplify. Missing three or more habits means “simplify this week”, never “add more”.</p></div>
        ${notes([
          ['Weigh-in.', 'Daily, after the bathroom, before food or drink. Decide on the 7-day average only.'],
          ['Measure.', 'Every two weeks: waist, chest, arms, thigh, calf (neck optional). Photos monthly: same light, distance, pose and time.'],
          ['Pace.', `${t.lossMinKg}–${t.lossMaxKg} kg a week. Flat for 14 days → trim calories a little or add steps. Faster than ${t.lossMaxPct}% of body weight a week, repeatedly → eat a bit more.`],
          ['Protect muscle.', 'Watch for strength falling, protein under target, short sleep, very low calories, too much cardio or constant fatigue.'],
          ['Eyes.', '20-20-20 at work, don’t rub your eyes, wear your prescribed correction, keep your specialist appointments. No exercises to “fix” keratoconus.'],
          ['Jaw.', 'Relax it rather than forcing it into position. If the concern persists, a dental or orthodontic assessment.'],
          ['Desk, weekly.', 'Screen near eye level, feet supported, shoulders relaxed, alternate sitting and standing.'],
        ])}
        <div class="card plan-routine plan-not"><div class="plan-routine-head"><strong>Deliberately not included</strong></div>
          <p class="small">Excessive skincare · jawline or facial exercises · eye exercises to “fix” keratoconus · excessive stretching · daily calorie-burn targets · punishment workouts · starvation targets · more than one weight metric a day · dozens of tiny habits · streaks that reward unhealthy behaviour.</p>
          <p class="muted small">The system should make life simpler, not turn you into the middle manager of your own existence.</p></div>
        <p class="fine-print">A personal planning tool, not medical advice. For eyes, jaw or anything persistent, see a professional.</p>`)}`;
  },
  actions: {
    jump: ({ data }) => {
      const el = document.getElementById(`plan-${data.id}`);
      if (!el) return;
      el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      el.querySelector('h2')?.setAttribute('tabindex', '-1');
      el.querySelector('h2')?.focus({ preventScroll: true });
    },
  },
};
