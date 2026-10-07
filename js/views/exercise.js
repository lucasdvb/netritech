import * as F from '../core/fitness.js';
import { fmtMD, relativeDay } from '../core/dates.js';
import { html } from '../ui/dom.js';
import { pageHead, empty } from '../ui/components.js';
import { lineChart } from '../ui/charts.js';
import { num } from '../ui/format.js';
import { exerciseSheet } from './exercises.js';

export default {
  id: 'exercise',
  title: ({ params }) => F.exercise(params.id)?.name || 'Exercise',
  render({ params }) {
    const e = F.exercise(params.id);
    if (!e) return html`${pageHead({ title: 'Exercise', back: { to: 'body/exercises', label: 'Exercises' } })}${empty({ ic: 'dumbbell', title: 'Not found' })}`;
    const hist = F.exerciseHistory(e.id, 30);
    const pb = F.personalBests().find((p) => p.exercise.id === e.id);
    const family = e.family ? F.exercises().filter((x) => x.family === e.family).sort((a, b) => a.level - b.level) : [];
    const labels = hist.map((h) => fmtMD(h.workout.date));
    const isTime = e.metric === 'time', isMin = e.metric === 'minutes';
    const primary = hist.map((h) => (isTime ? h.perf.topSeconds : isMin ? h.perf.minutes : h.perf.totalReps));
    const load = hist.map((h) => h.perf.topLoad || null);
    return html`
      ${pageHead({ title: e.name, eyebrow: F.categoryLabel(e.category), back: { to: 'body/exercises', label: 'Exercises' },
        actions: html`<button type="button" class="btn btn--soft btn--sm" data-action="edit">Edit</button>` })}
      ${e.cues ? html`<p class="lead">${e.cues}</p>` : ''}
      <div class="stat-row stat-row--3">
        <div class="stat"><p class="stat-label">Sessions</p><p class="stat-value tnum">${hist.length}</p></div>
        <div class="stat"><p class="stat-label">${isTime ? 'Longest hold' : isMin ? 'Longest' : 'Best set'}</p><p class="stat-value tnum">${pb ? (isTime ? `${pb.seconds}s` : isMin ? `${pb.minutes}m` : pb.reps) : '—'}</p></div>
        <div class="stat"><p class="stat-label">Heaviest</p><p class="stat-value tnum">${pb?.load ? `${num(pb.load, pb.load % 1 ? 1 : 0)}` : '—'}<span class="stat-unit">${pb?.load ? 'kg' : ''}</span></p></div>
      </div>
      <section class="block"><div class="block-head"><h2 class="block-title">${isTime ? 'Best hold per session' : isMin ? 'Minutes per session' : 'Total reps per session'}</h2></div>
        <div class="card">${lineChart({ labels, series: [{ values: primary, color: 'var(--chart-1)', fill: 'var(--lime)', area: true, label: isTime ? 'Hold' : isMin ? 'Minutes' : 'Reps', marks: true }], fmt: (v) => (isTime ? `${num(v)} s` : isMin ? `${num(v)} min` : `${num(v)} reps`), zero: true, empty: 'Log this exercise twice to see a trend.' })}</div>
      </section>
      ${load.some((x) => x) ? html`<section class="block"><div class="block-head"><h2 class="block-title">Load</h2></div>
        <div class="card">${lineChart({ labels, series: [{ values: load, color: 'var(--c-posture)', label: 'Top load', marks: true }], fmt: (v) => `${num(v, 1)} kg`, zero: true })}</div></section>` : ''}
      ${family.length > 1 ? html`<section class="block"><div class="block-head"><h2 class="block-title">Progression path</h2></div>
        <ol class="ladder">${family.map((f) => html`<li class="${f.id === e.id ? 'is-current' : ''}"><span class="tnum">${f.level}</span>${f.name}</li>`)}</ol></section>` : ''}
      <section class="block"><div class="block-head"><h2 class="block-title">Sessions</h2></div>
        ${hist.length ? html`<ul class="list">${[...hist].reverse().map((h) => html`<li><a class="row" href="#/body/workout/${h.workout.id}" data-action="nav" data-to="body/workout/${h.workout.id}">
          <span class="row-main"><span class="row-title tnum">${isTime ? `${h.perf.sets} × best ${h.perf.topSeconds} s` : isMin ? `${h.perf.minutes} min` : `${h.perf.sets} sets · ${h.perf.totalReps} reps${h.perf.topLoad ? ` · ${num(h.perf.topLoad, 1)} kg` : ''}`}</span>
          <span class="row-sub">${relativeDay(h.workout.date)} · ${h.workout.title}</span></span></a></li>`)}</ul>`
          : html`<p class="muted">Not logged yet.</p>`}
      </section>`;
  },
  actions: { edit: ({ params }) => exerciseSheet(F.exercise(params.id)) },
};
