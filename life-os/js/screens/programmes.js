// Plan › Training › Programmes: proven training programmes, optional. Each says who it suits, how
// long it takes, why it works and how it progresses; following one sets up its workouts and your
// training week, and stopping puts your own week back. Your own workouts stay yours either way.
import * as PG from '../domain/programmes.js';
import { fmtMD } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { toggle } from '../ui/controls.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const DOW = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const perWeek = (p, short) => Object.keys(PG.daysFor(p, { short })).length;

/** The programme you follow, or a pointer to the library, for the Training screen. */
export function programmeCard() {
  const f = PG.following();
  const p = f && PG.programme(f.id);
  if (p) {
    return html`<a class="card card--link programme-card" href="#/plan/training/programmes" data-action="nav" data-to="plan/training/programmes" data-key="programme-card">
      <span class="sort-cta-text"><span class="section-label">Programme</span><span class="card-title">${p.name}</span>
        <span class="row-sub">Since ${fmtMD(f.since)} · ${perWeek(p, f.short)} days a week · ${p.equipment}</span></span>
      ${icon('chevron-right', { size: 18 })}</a>`;
  }
  return html`<a class="card card--link programme-card" href="#/plan/training/programmes" data-action="nav" data-to="plan/training/programmes" data-key="programme-card">
    <span class="sort-cta-text"><span class="card-title">Proven programmes</span><span class="row-sub">Optional: one tap sets up your workouts and week. Or keep your own.</span></span>
    ${icon('chevron-right', { size: 18 })}</a>`;
}

function detail(id) {
  const p = PG.programme(id);
  if (!p) return;
  app.sheet({
    title: p.name,
    size: 'tall',
    ui: { short: !!(PG.following()?.id === id && PG.following()?.short) },
    render: (s) => {
      const f = PG.following();
      const mine = f?.id === id;
      const adds = PG.newExercises(id);
      return html`<div class="form programme-detail">
        <p class="programme-meta">${p.level} · ${perWeek(p, s.ui.short)} days a week · about ${p.minutes} min · ${p.equipment}</p>
        <p>${p.summary}</p>
        <div class="card programme-why"><p class="section-label">Why it works</p><p>${p.why}</p>
          <p class="section-label">How it progresses</p><p>${p.progression}</p></div>
        ${p.short ? html`<div class="set-row set-row--plain"><span class="set-text"><span class="set-label">Three days instead of six</span>
          <span class="set-hint">Each workout once a week.</span></span>${toggle(s.ui.short, { action: 'pg-short', label: 'Three days instead of six' })}</div>` : ''}
        <ol class="programme-week" aria-label="The week">${PG.weekOf(id, { short: s.ui.short }).map((d) => html`<li class="${cx(!d.workout && 'is-rest')}"><span class="tnum">${DOW[d.day]}</span><span>${d.workout || 'Rest or your own cardio'}</span></li>`)}</ol>
        ${p.workouts.map((w) => html`<div class="programme-workout" data-key="pw-${w.name}"><p class="card-title">${w.name}</p>
          <ul class="programme-items">${PG.itemsOf(w).map((it) => html`<li><span>${it.name}</span><span class="tnum">${it.sets} × ${it.reps}</span></li>`)}</ul></div>`)}
        ${adds.length ? html`<p class="field-hint">Adds to your exercises: ${adds.join(', ')}.</p>` : ''}
        ${mine ? html`<p class="notice">${icon('check', { size: 16 })} You’re following this since ${fmtMD(f.since)}.</p>
            <button type="button" class="btn btn--soft btn--block" data-action="pg-follow">${s.ui.short !== !!f.short ? 'Switch to this version' : 'Set it up again'}</button>
            <button type="button" class="btn btn--ghost btn--block" data-action="pg-stop">Stop and go back to my own week</button>`
          : html`<button type="button" class="btn btn--primary btn--block" data-action="pg-follow">${f ? 'Switch to this programme' : 'Follow this programme'}</button>
            <p class="sheet-note">Your training week follows it; your own workouts stay in your library. Stop any time to put your own week back.</p>`}
      </div>`;
    },
    actions: {
      'pg-short': ({ sheet }) => { sheet.ui.short = !sheet.ui.short; sheet.refresh(); },
      'pg-follow': ({ sheet }) => {
        const undo = PG.follow(id, { short: sheet.ui.short });
        hap.success();
        app.closeSheet(sheet);
        app.toast(`Following ${p.name}`, { action: { label: 'Undo', fn: undo } });
      },
      'pg-stop': ({ sheet }) => {
        const undo = PG.stop();
        hap.tap();
        app.closeSheet(sheet);
        app.toast('Back to your own week', { action: { label: 'Undo', fn: undo } });
      },
    },
  });
}

export default {
  id: 'programmes',
  title: 'Programmes',
  render() {
    const f = PG.following();
    return html`
      ${pageHead({ title: 'Programmes', back: { to: 'plan/training', label: 'Training' },
        info: 'Optional. A proven programme sets up your workouts and training week in one tap; your own workouts and week stay as they are until you choose one, and come back when you stop. Gym mode, progression and records work the same either way.' })}
      ${f ? html`<p class="lead">You’re following <strong>${PG.programme(f.id)?.name || 'a programme'}</strong>. Tap it to switch versions or stop.</p>`
        : html`<p class="lead">Your own workouts are your programme now. Pick one of these only if you want a proven plan.</p>`}
      <ul class="list programme-list">${PG.PROGRAMMES.map((p) => html`<li data-key="pg-${p.id}">
        <button type="button" class="${cx('row', f?.id === p.id && 'is-on')}" data-action="pg-open" data-id="${p.id}">
          <span class="row-ic">${icon(p.equipment.startsWith('Gym') ? 'dumbbell' : 'house', { size: 18 })}</span>
          <span class="row-main"><span class="row-title">${p.name}${f?.id === p.id ? ' · following' : ''}</span>
            <span class="row-sub">${p.level} · ~${p.minutes} min · ${p.equipment}</span></span>
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></button></li>`)}</ul>`;
  },
  actions: {
    'pg-open': ({ data }) => detail(data.id),
  },
};
