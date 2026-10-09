import * as F from '../domain/fitness.js';
import { fmtMD, relativeDay } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { pageHead, empty } from '../ui/components.js';
import { lineChart } from '../ui/charts.js';
import { num, kgOut, weightUnit, loadText } from '../ui/format.js';
import { exerciseSheet } from './exercises.js';
import { mediaLine, mediaActions, mediaInputs, hydrateMedia, openMedia } from './exercise-media-ui.js';
import { icon } from '../ui/icons.js';

export default {
  id: 'exercise',
  title: ({ params }) => F.exercise(params.id)?.name || 'Exercise',
  render({ params }) {
    const e = F.exercise(params.id);
    if (!e) return html`${pageHead({ title: 'Exercise', back: { to: 'plan/training/exercises', label: 'Exercises' } })}${empty({ ic: 'dumbbell', title: 'Not found' })}`;
    const hist = F.exerciseHistory(e.id, 30);
    const pb = F.personalBests().find((p) => p.exercise.id === e.id);
    const family = e.family ? F.exercises().filter((x) => x.family === e.family).sort((a, b) => a.level - b.level) : [];
    const labels = hist.map((h) => fmtMD(h.workout.date));
    const isTime = e.metric === 'time', isMin = e.metric === 'minutes';
    const primary = hist.map((h) => (isTime ? h.perf.topSeconds : isMin ? h.perf.minutes : h.perf.totalReps));
    const load = hist.map((h) => (h.perf.topLoad ? kgOut(h.perf.topLoad) : null));
    return html`
      ${pageHead({ title: e.name, eyebrow: F.categoryLabel(e.category), back: { to: 'plan/training/exercises', label: 'Exercises' },
        actions: html`<button type="button" class="btn btn--soft btn--sm" data-action="edit">Edit</button>` })}
      ${e.cues ? html`<p class="lead">${e.cues}</p>` : ''}
      <section class="block" data-key="media"><div class="block-head"><h2 class="block-title">Your photos and note</h2>
        <button type="button" class="link-btn" data-action="media">${icon('image-plus', { size: 16 })} ${e.photos?.length || e.note ? 'Edit' : 'Add'}</button></div>
        ${mediaLine(e) || html`<p class="muted small">Up to two photos and a note, for the setup or the position you'd otherwise forget. They show in the workout and in gym mode.</p>`}</section>
      <div class="stat-row stat-row--3">
        <div class="stat"><p class="stat-label">Sessions</p><p class="stat-value tnum">${hist.length}</p></div>
        <div class="stat"><p class="stat-label">${isTime ? 'Longest hold' : isMin ? 'Longest' : 'Best set'}</p><p class="stat-value tnum">${pb ? (isTime ? `${pb.seconds}s` : isMin ? `${pb.minutes}m` : pb.reps) : '—'}</p></div>
        <div class="stat"><p class="stat-label">Heaviest</p><p class="stat-value tnum">${pb?.load ? loadText(pb.load).split(' ')[0] : '—'}<span class="stat-unit">${pb?.load ? weightUnit() : ''}</span></p></div>
      </div>
      <section class="block"><div class="block-head"><h2 class="block-title">${isTime ? 'Best hold per session' : isMin ? 'Minutes per session' : 'Total reps per session'}</h2></div>
        <div class="card">${lineChart({ labels, series: [{ values: primary, color: 'var(--chart-1)', fill: 'var(--accent)', area: true, label: isTime ? 'Hold' : isMin ? 'Minutes' : 'Reps', marks: true }], fmt: (v) => (isTime ? `${num(v)} s` : isMin ? `${num(v)} min` : `${num(v)} reps`), zero: true, empty: 'Log this exercise twice to see a trend.' })}</div>
      </section>
      ${load.some((x) => x) ? html`<section class="block"><div class="block-head"><h2 class="block-title">Load</h2></div>
        <div class="card">${lineChart({ labels, series: [{ values: load, color: 'var(--c-posture)', label: 'Top load', marks: true }], fmt: (v) => `${num(v, 1)} ${weightUnit()}`, zero: true })}</div></section>` : ''}
      ${family.length > 1 ? html`<section class="block"><div class="block-head"><h2 class="block-title">Progression path</h2></div>
        <ol class="ladder">${family.map((f) => html`<li class="${f.id === e.id ? 'is-current' : ''}"><span class="tnum">${f.level}</span>${f.name}</li>`)}</ol></section>` : ''}
      <section class="block"><div class="block-head"><h2 class="block-title">Sessions</h2></div>
        ${hist.length ? html`<ul class="list">${[...hist].reverse().map((h) => html`<li><a class="row" href="#/workout/${h.workout.id}" data-action="nav" data-to="workout/${h.workout.id}">
          <span class="row-main"><span class="row-title tnum">${isTime ? `${h.perf.sets} × best ${h.perf.topSeconds} s` : isMin ? `${h.perf.minutes} min` : `${h.perf.sets} sets · ${h.perf.totalReps} reps${h.perf.topLoad ? ` · ${loadText(h.perf.topLoad)}` : ''}`}</span>
          <span class="row-sub">${relativeDay(h.workout.date)} · ${h.workout.title}</span></span></a></li>`)}</ul>`
          : html`<p class="muted">Not logged yet.</p>`}
      </section>`;
  },
  mount(el) { hydrateMedia(el); },
  update(el) { hydrateMedia(el); },
  inputs: { ...mediaInputs },
  actions: { ...mediaActions, edit: ({ params }) => exerciseSheet(F.exercise(params.id)), media: ({ params }) => openMedia(params.id) },
};
