import * as store from '../data/store.js';
import * as F from '../domain/fitness.js';
import * as H from '../domain/habits.js';
import * as M from '../domain/metrics.js';
import { trainingCall } from '../domain/coach.js';
import { today, startOfWeek, addDays, fmtDayShort, fmtMD, relativeDay, weekday, diffDays, lastNDays, cmp } from '../domain/dates.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { barChart } from '../ui/charts.js';
import { num } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import { startWorkout, openStartSheet } from './workout-actions.js';

const VERDICT = { improved: ['Improved', 'good'], maintained: ['Maintained', ''], declined: ['Declined', 'warn'] };

function weekStrip() {
  const start = startOfWeek(today());
  return html`<div class="week-strip" role="list">${Array.from({ length: 7 }, (_, i) => {
    const d = addDays(start, i);
    const tpl = F.plannedTemplate(d);
    const done = F.workoutsOn(d);
    const isToday = d === today();
    return html`<div class="${cx('ws-day', isToday && 'is-today', done.length && 'is-done', d > today() && 'is-future')}" role="listitem">
      <span class="ws-name">${fmtDayShort(d).slice(0, 2)}</span>
      <span class="ws-dot">${done.length ? icon('check', { size: 14, stroke: 2.4 }) : ''}</span>
      <span class="ws-plan">${tpl ? shortName(tpl) : 'Rest'}</span>
    </div>`;
  })}</div>`;
}
const shortName = (t) => ({ 't-upper': 'Upper', 't-lower': 'Lower', 't-recovery': 'Walk', 't-cardio': 'Cardio', 't-minimum': '20 min' }[t.id] || t.name.split(' ')[0]);

function calfCard() {
  const weeks = F.weeklySeries(8, (d) => F.weekStats(d));
  const w = weeks[weeks.length - 1];
  return html`<div class="card">
    <div class="card-head"><p class="section-label">Calves · priority</p><span class="badge">${w.calfSessions}/3 this week</span></div>
    <div class="comp-grid">
      <div><p class="stat-label">Sessions</p><p class="comp-val tnum">${w.calfSessions}</p></div>
      <div><p class="stat-label">Total reps</p><p class="comp-val tnum">${num(w.calfReps)}</p></div>
      <div><p class="stat-label">Loaded volume</p><p class="comp-val tnum">${num(w.calfVolume)}<small> kg</small></p></div>
    </div>
    ${weeks.some((x) => x.calfReps) ? barChart({ labels: weeks.map((x) => fmtMD(x.date).split(' ')[1] || fmtMD(x.date)), tipLabels: weeks.map((x) => `Week of ${fmtMD(x.date)}`), values: weeks.map((x) => x.calfReps || null), color: 'var(--c-body)', fmt: (v) => `${num(v)} reps`, height: 110 }) : html`<p class="muted small">Calf reps per week will chart here.</p>`}
    <p class="fine-print">Progression: standing → single-leg → slow eccentric → paused, then add the 10 kg dumbbell.</p>
  </div>`;
}

function coreCard() {
  const weeks = F.weeklySeries(8, (d) => F.weekStats(d));
  const w = weeks[weeks.length - 1];
  const pbs = F.personalBests().filter((p) => p.exercise.category === 'core');
  const plank = pbs.find((p) => p.exercise.id === 'e-plank');
  return html`<div class="card">
    <div class="card-head"><p class="section-label">Core</p><span class="badge">${w.coreSessions}/3 this week</span></div>
    ${weeks.some((x) => x.coreSessions) ? barChart({ labels: weeks.map((x) => fmtMD(x.date).split(' ')[1] || ''), tipLabels: weeks.map((x) => `Week of ${fmtMD(x.date)}`), values: weeks.map((x) => x.coreSessions || null), color: 'var(--c-body)', fmt: (v) => `${v} sessions`, height: 90, goal: { value: 3, label: '3' } }) : html`<p class="muted small">Core sessions per week will chart here.</p>`}
    ${pbs.length ? html`<ul class="pb-mini">${pbs.slice(0, 4).map((p) => html`<li><span>${p.exercise.name}</span><b class="tnum">${p.exercise.metric === 'time' ? `${p.seconds} s` : `${p.reps} reps`}</b></li>`)}</ul>` : ''}
    ${plank ? '' : html`<p class="fine-print">Plank, side plank, dead bug, hollow hold, reverse crunch, leg raise. A stable trunk, not endless ab work.</p>`}
  </div>`;
}

function postureCard() {
  const mob = H.habit('h-mobility');
  const brk = H.habit('h-breaks');
  const desk = H.habit('h-desk');
  const days = lastNDays(today(), diffDays(today(), startOfWeek(today())) + 1);
  const mobDays = mob ? days.filter((d) => H.isDone(mob, d)).length : 0;
  const breaks = days.map((d) => M.review(d)?.breaks || 0);
  const workdays = days.filter((d) => (store.profile().workDays || []).includes(weekday(d)));
  const avgBreaks = workdays.length ? workdays.reduce((a, d) => a + (M.review(d)?.breaks || 0), 0) / workdays.length : 0;
  return html`<div class="card">
    <div class="card-head"><p class="section-label">Posture · this week</p></div>
    <div class="comp-grid">
      <div><p class="stat-label">Mobility routine</p><p class="comp-val tnum">${mobDays}<small>/${days.length} days</small></p></div>
      <div><p class="stat-label">Breaks / workday</p><p class="comp-val tnum">${num(avgBreaks, 1)}<small>/8</small></p></div>
      <div><p class="stat-label">Desk check</p><p class="comp-val">${desk && H.periodDone(desk, today()) ? 'Done' : '—'}</p></div>
    </div>
    <p class="fine-print">Chin tucks, wall angels, thoracic extensions, external rotation, scapular work and chest stretching. Tracks consistency — it doesn’t diagnose or correct posture.</p>
  </div>`;
}

export default {
  id: 'training',
  title: 'Training',
  render() {
    const call = trainingCall(today());
    const active = F.activeWorkout();
    const history = F.allWorkouts().slice(0, 12);
    const pbs = F.personalBests().filter((p) => p.reps || p.seconds || p.load).sort((a, b) => cmp(b.repsDate || b.secondsDate || '', a.repsDate || a.secondsDate || '')).slice(0, 8);
    const w = F.weekStats(today());
    return html`
      ${pageHead({ title: 'Training', back: { to: 'plan', label: 'Plan' },
        actions: html`<button type="button" class="btn btn--soft btn--sm" data-action="nav" data-to="plan/training/exercises">Exercises</button>` })}
      ${active ? html`<button type="button" class="resume-card" data-action="nav" data-to="workout/${active.id}">
          <span class="resume-pulse" aria-hidden="true"></span><span><span class="resume-title">${active.title}</span><span class="resume-sub">In progress · tap to resume</span></span>${icon('chevron-right', { size: 18 })}</button>`
        : html`<div class="card call-card">
          <p class="section-label">Today</p>
          <p class="call-title">${call.title}</p>
          <p class="muted">${call.reason}</p>
          <div class="btn-row">
            <button type="button" class="btn btn--soft" data-action="choose">Other session</button>
            ${call.template && call.kind !== 'done' ? html`<button type="button" class="btn btn--primary" data-action="start" data-id="${call.template.id}">${icon('play', { size: 16 })} Start</button>` : ''}
          </div></div>`}
      <section class="block"><div class="block-head"><h2 class="block-title">This week</h2><button type="button" class="link-btn" data-action="plan">Edit plan</button></div>
        ${weekStrip()}
        <p class="quiet-line">${w.sessions} session${w.sessions === 1 ? '' : 's'} · ${w.strength}/4 strength · ${w.cardio}/2 cardio · ${num(w.minutes)} min</p>
      </section>
      <section class="block stack">${calfCard()}${coreCard()}${postureCard()}</section>
      <section class="block"><div class="block-head"><h2 class="block-title">Personal bests</h2></div>
        ${pbs.length ? html`<ul class="list">${pbs.map((p) => html`<li><a class="row" href="#/plan/training/exercises/${p.exercise.id}" data-action="nav" data-to="plan/training/exercises/${p.exercise.id}">
          <span class="row-main"><span class="row-title">${p.exercise.name}</span><span class="row-sub">${[p.reps ? `${p.reps} reps` : '', p.seconds ? `${p.seconds} s hold` : '', p.load ? `${num(p.load, p.load % 1 ? 1 : 0)} kg` : ''].filter(Boolean).join(' · ')}</span></span>
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`)}</ul>`
          : html`<p class="muted">Bests appear quietly as you log sessions.</p>`}
      </section>
      <section class="block"><div class="block-head"><h2 class="block-title">History</h2></div>
        ${history.length ? html`<ul class="list">${history.map((x) => html`<li><a class="row" href="#/workout/${x.id}" data-action="nav" data-to="workout/${x.id}">
          <span class="row-main"><span class="row-title">${x.title}</span><span class="row-sub">${relativeDay(x.date)}${x.minutes ? ` · ${x.minutes} min` : ''}${x.difficulty ? ` · ${['', 'easy', 'light', 'solid', 'hard', 'max'][x.difficulty]}` : ''}</span></span>
          ${x.progression && VERDICT[x.progression] ? html`<span class="badge badge--${VERDICT[x.progression][1]}">${VERDICT[x.progression][0]}</span>` : ''}
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`)}</ul>`
          : empty({ ic: 'dumbbell', title: 'Your first session starts here.', body: 'Pick today’s plan and log as you go. Sets pre-fill from last time.', cta: 'Start a session', action: 'choose' })}
      </section>`;
  },
  actions: {
    start: ({ data }) => startWorkout(data.id, today()),
    choose: () => openStartSheet(today()),
    plan: () => planSheet(),
  },
};

function planSheet() {
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  app.sheet({
    title: 'Weekly plan',
    render: () => {
      const plan = store.profile().plan || {};
      return html`<div class="form">
        <p class="sheet-note">Four strength days, one easy walk day, optional cardio and a recovery day. Training happens at ${store.profile().trainTime}.</p>
        <div class="set-list">${DAYS.map((d, i) => html`<div class="set-row"><span class="set-label">${d}</span><div class="set-ctl">
          <select class="input" data-change="plan" data-day="${i + 1}" aria-label="${d}">
            <option value="">Rest / recovery</option>
            ${F.templates().map((t) => html`<option value="${t.id}" ${raw(plan[i + 1] === t.id ? 'selected' : '')}>${t.name}</option>`)}
          </select></div></div>`)}</div>
        <label class="field"><span class="field-label">Training time</span><input class="input" type="time" value="${store.profile().trainTime}" data-change="time"></label>
      </div>`;
    },
    inputs: {
      plan: ({ el, value }) => store.setProfile({ plan: { ...store.profile().plan, [el.dataset.day]: value || null } }),
      time: ({ value }) => value && store.setProfile({ trainTime: value }),
    },
  });
}
