// You › Set up your days: about five minutes of questions that build your days in one go (times,
// work, a weekend plan, training, the habits you train first, reminders). Nothing changes until the
// last step, and one tap undoes all of it. Everything it sets can be changed later in its own place.
import * as store from '../data/store.js';
import * as S from '../domain/setup.js';
import * as PG from '../domain/programmes.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { toggle } from '../ui/controls.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const STEPS = [
  ['start', 'Let’s set up your days'],
  ['day', 'What does a usual day look like?'],
  ['days', 'Are your days the same?'],
  ['training', 'How do you want to train?'],
  ['focus', 'Which habits do you want to build first?'],
  ['reminders', 'What should remind you?'],
  ['review', 'Here’s what will be set up'],
];
const DOW = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TRAIN_DAYS = [0, 2, 3, 4, 6];

const seg = (label, f, value, options) => html`<div class="seg seg--wrap" role="radiogroup" aria-label="${label}">${options.map(([v, text]) => html`<button type="button" role="radio" class="seg-btn" aria-checked="${value === v}" data-action="su-set" data-f="${f}" data-v="${String(v)}">${text}</button>`)}</div>`;
const time = (label, f, value) => html`<label class="field"><span class="field-label">${label}</span><input class="input" type="time" value="${value}" data-change="su" data-f="${f}" required></label>`;
const line = (label, hint, on, action, data = {}) => html`<div class="set-row set-row--plain"><span class="set-text"><span class="set-label">${label}</span>${hint ? html`<span class="set-hint">${hint}</span>` : ''}</span>${toggle(on, { action, data, label })}</div>`;

function stepBody(step, a, ui) {
  if (step === 'start') {
    return html`<p>About five minutes. A few questions, and your days, training, the habits you start with and your reminders are set up together, all linked. Nothing changes until the last step, and one tap undoes it.</p>
      <label class="field"><span class="field-label">What should Life OS call you?</span><input class="input" type="text" maxlength="40" autocomplete="given-name" value="${a.name}" data-input="su" data-f="name" placeholder="Your first name"></label>
      <div class="card setup-move">${icon('download', { size: 18 })}<span class="row-main"><span class="row-title">Moving from another phone or address?</span>
        <span class="row-sub">Restore your backup first: your habits, history and settings come with it.</span></span>
        <button type="button" class="btn btn--soft btn--sm" data-action="nav" data-to="you/data">Restore</button></div>`;
  }
  if (step === 'day') {
    return html`<div class="grid-2">${time('Up at', 'wake', a.wake)}${time('Lights out', 'bed', a.bed)}</div>
      ${line('I work', 'A work block in your day, on your work days.', a.work, 'su-work')}
      ${a.work ? html`<div class="grid-2">${time('Work starts', 'workStart', a.workStart)}${time('Work ends', 'workEnd', a.workEnd)}</div>
        <div><p class="form-label">Work days</p><div class="seg seg--wrap setup-days" role="group" aria-label="Work days">${[1, 2, 3, 4, 5, 6, 7].map((d) => html`<button type="button" class="seg-btn" aria-pressed="${a.workDays.includes(d)}" data-action="su-wd" data-d="${d}">${DOW[d]}</button>`)}</div></div>` : ''}
      <p class="field-hint">Waking earlier or later moves your morning with it; lights out moves your evening.</p>`;
  }
  if (step === 'days') {
    return html`${seg('Your days', 'days', a.days, [['same', 'The same every day'], ['weekend', 'Weekends are different'], ['later', 'They change: I’ll set them out']])}
      ${a.days === 'weekend' ? html`<p>Saturday and Sunday get a Weekend plan${a.work && !a.workDays.some((d) => d >= 6) ? ', without work' : ''}.</p>
        <div class="grid-2">${time('Weekend: up at', 'weekendWake', a.weekendWake)}${time('Weekend: lights out', 'weekendBed', a.weekendBed)}</div>` : ''}
      ${a.days === 'later' ? html`<p>Make a plan for each kind of day (a long day, a short day, travel…) in Plan › Your plan › Your days, give each a weekday, and change any date ahead. Habits, reminders and Today follow the plan of the day.</p>` : ''}`;
  }
  if (step === 'training') {
    const rec = S.recommend(a.trainDays, a.where);
    const p = rec && PG.programme(rec.id);
    return html`<div><p class="form-label">Days a week</p>${seg('Days a week', 'trainDays', a.trainDays, TRAIN_DAYS.map((d) => [d, d ? String(d) : 'None']))}</div>
      ${a.trainDays ? html`<div><p class="form-label">Where</p>${seg('Where', 'where', a.where, [['gym', 'Gym'], ['home', 'Home, dumbbells']])}</div>
        ${time('Usually at', 'trainTime', a.trainTime)}
        <div class="seg-list" role="radiogroup" aria-label="Your training plan">
          ${p ? html`<button type="button" role="radio" class="${cx('card', 'setup-choice', a.training === 'programme' && 'is-on')}" aria-checked="${a.training === 'programme'}" data-action="su-set" data-f="training" data-v="programme">
            <span class="section-label">Recommended</span><span class="card-title">${p.name}</span><span class="row-sub">${p.summary} About ${p.minutes} min.</span></button>` : ''}
          <button type="button" role="radio" class="${cx('card', 'setup-choice', a.training === 'own' && 'is-on')}" aria-checked="${a.training === 'own'}" data-action="su-set" data-f="training" data-v="own">
            <span class="card-title">Keep my own workouts</span><span class="row-sub">Your workouts and training week stay as they are. Programmes are in Plan › Training any time.</span></button>
        </div>` : html`<p>No training plan for now. Add one any time in Plan › Training.</p>`}`;
  }
  if (step === 'focus') {
    const { options, limit } = ui.focus;
    return html`<p>Up to ${limit}. New habits stick best a few at a time; the rest run as they are, and these get the reminders and the attention until they’re automatic.</p>
      <div class="seg seg--wrap" role="group" aria-label="Habits to build first">${options.map((h) => html`<button type="button" class="seg-btn" aria-pressed="${a.focus.includes(h.id)}" data-action="su-focus" data-id="${h.id}">${h.name}</button>`)}</div>
      <p class="field-hint">${a.focus.length} of ${limit} chosen.</p>`;
  }
  if (step === 'reminders') {
    const r = a.reminders;
    return html`${line('Morning check-in', `At ${S.shiftTime(a.wake, 5)}, just after you wake.`, r.morning, 'su-rem', { k: 'morning' })}
      ${a.trainDays ? line('Training', `At ${S.shiftTime(a.trainTime, -5)} on training days.`, r.workout, 'su-rem', { k: 'workout' }) : ''}
      ${line('Close the day', `At ${S.shiftTime(a.bed, -60)}, an hour before lights out.`, r.evening, 'su-rem', { k: 'evening' })}
      ${line('Weekly review', 'Sunday evening.', r.weekly, 'su-rem', { k: 'weekly' })}
      <p class="field-hint">Each kind of day keeps its own times. Fine-tune them in You › Reminders.</p>`;
  }
  return html`<ul class="review-facts setup-summary">${S.summary(a).map((t) => html`<li>${icon('check', { size: 16 })}<span>${t}</span></li>`)}</ul>
    <p class="field-hint">Your habits, history and own workouts stay. One tap undoes all of this afterwards.</p>`;
}

function done(ui) {
  const n = store.settings().notifications || {};
  const want = ['morning', 'workout', 'evening', 'weeklyReview'].some((k) => n[k]?.on);
  const ask = want && !n.enabled && typeof Notification !== 'undefined';
  return html`<div class="guide setup-done" data-key="setup-done">
    <h2 class="guide-q" tabindex="-1">${icon('check', { size: 22 })} Your days are set up</h2>
    <ul class="review-facts setup-summary">${ui.lines.map((t) => html`<li>${icon('check', { size: 16 })}<span>${t}</span></li>`)}</ul>
    ${ask ? html`<button type="button" class="btn btn--soft btn--block" data-action="su-notify">Allow notifications</button>` : ''}
    <button type="button" class="btn btn--primary btn--block" data-action="nav" data-to="today">Go to Today</button>
    ${ui.undo ? html`<button type="button" class="link-btn block" data-action="su-undo">Undo the setup</button>` : ''}
  </div>`;
}

function go(ui, d) {
  ui.step = Math.max(0, Math.min(STEPS.length - 1, (ui.step || 0) + d));
  app.refresh();
  requestAnimationFrame(() => document.querySelector('.guide-q')?.focus({ preventScroll: true }));
}

export default {
  id: 'setup',
  title: 'Set up your days',
  render({ ui }) {
    ui.a ||= S.current();
    ui.focus ||= S.focusChoices();
    const head = pageHead({ title: 'Set up your days', back: { to: 'today', label: 'Today' } });
    if (ui.lines) return html`${head}${done(ui)}`;
    const i = Math.min(ui.step || 0, STEPS.length - 1);
    const [step, q] = STEPS[i];
    const last = i === STEPS.length - 1;
    return html`${head}
      <div class="guide setup" data-key="setup-${step}" data-step="${step}">
        <div class="ritual-progress" role="progressbar" aria-valuemin="1" aria-valuemax="${STEPS.length}" aria-valuenow="${i + 1}" aria-label="Step ${i + 1} of ${STEPS.length}">
          ${STEPS.map((x, j) => html`<span class="${cx(j < i && 'is-done', j === i && 'is-now')}"></span>`)}</div>
        <h2 class="guide-q" tabindex="-1">${q}</h2>
        <div class="guide-body form">${stepBody(step, ui.a, ui)}</div>
        <div class="ritual-foot guide-foot">
          ${i > 0 ? html`<button type="button" class="link-btn" data-action="su-back">Back</button>` : html`<button type="button" class="link-btn" data-action="su-later">Not now</button>`}
          <span class="ritual-go"><button type="button" class="btn btn--primary" data-action="${last ? 'su-build' : 'su-next'}" ${ui.building ? 'disabled' : ''}>${last ? 'Set up my days' : i === 0 ? 'Start' : 'Next'}</button></span>
        </div>
      </div>`;
  },
  inputs: {
    su: ({ el, value, ui }) => {
      const f = el.dataset.f;
      if (f === 'name') { ui.a.name = value; return; }
      if (!/^\d{2}:\d{2}$/.test(value)) return;
      ui.a[f] = value;
      app.refresh();
    },
  },
  actions: {
    'su-set': ({ data, ui }) => {
      const v = data.f === 'trainDays' ? Number(data.v) : data.v;
      ui.a[data.f] = v;
      // Training days or place changed: the programme that fits changes with them.
      if (data.f === 'trainDays' && !v) ui.a.training = 'none';
      if (data.f === 'trainDays' && v && ui.a.training === 'none') ui.a.training = 'programme';
      hap.tap();
      app.refresh();
    },
    'su-work': ({ ui }) => { ui.a.work = !ui.a.work; hap.tap(); app.refresh(); },
    'su-wd': ({ data, ui }) => {
      const d = Number(data.d);
      const s = new Set(ui.a.workDays);
      if (s.has(d)) s.delete(d); else s.add(d);
      ui.a.workDays = [...s].sort();
      hap.tap();
      app.refresh();
    },
    'su-focus': ({ data, ui }) => {
      const f = ui.a.focus;
      if (f.includes(data.id)) ui.a.focus = f.filter((x) => x !== data.id);
      else if (f.length < ui.focus.limit) ui.a.focus = [...f, data.id];
      else { app.toast(`Up to ${ui.focus.limit}. Take one off first.`); return; }
      hap.tap();
      app.refresh();
    },
    'su-rem': ({ data, ui }) => { ui.a.reminders[data.k] = !ui.a.reminders[data.k]; hap.tap(); app.refresh(); },
    'su-next': ({ ui }) => { hap.tap(); go(ui, 1); },
    'su-back': ({ ui }) => { go(ui, -1); },
    'su-later': () => {
      store.setSettings({ welcomed: true });
      app.toast('Set up your days any time from You.');
      app.go('today');
    },
    'su-build': async ({ ui }) => {
      if (ui.building) return;
      ui.building = true;
      app.refresh();
      try {
        ui.lines = S.summary(ui.a);
        ui.undo = await S.apply(ui.a);
        hap.success();
      } catch (err) {
        console.error(err);
        ui.lines = null;
        app.toast('Couldn’t finish the setup. Nothing was lost. Try again.', { tone: 'danger' });
      }
      ui.building = false;
      app.refresh();
      requestAnimationFrame(() => document.querySelector('.guide-q')?.focus({ preventScroll: true }));
    },
    'su-undo': ({ ui }) => {
      ui.undo?.();
      Object.assign(ui, { undo: null, lines: null, step: 0, a: null, focus: null });
      hap.tap();
      app.toast('Setup undone. Everything is as it was.');
      app.refresh();
    },
    'su-notify': async () => {
      const { requestPermission } = await import('../domain/reminders.js');
      await requestPermission();
      store.setSettings({ notifications: { ...store.settings().notifications, enabled: true } });
      app.refresh();
    },
  },
};
