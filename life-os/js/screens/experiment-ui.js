// Experiments on Review (13e): the one under way with how it's going, its verdict when it ends
// (keep or drop), and the sheet that starts one.
import * as X from '../domain/experiments.js';
import * as H from '../domain/habits.js';
import { onThisDay } from '../domain/memories.js';
import { today, addDays, dayInline, fmtMDY } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { kgOut, weightUnit, num } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const value = (k, v) => (v == null ? '—' : k === 'weight' ? `${num(kgOut(v), 1)} ${weightUnit()}` : X.fmt(k, v));
const VERDICT = { better: 'Better', worse: 'Worse', same: 'About the same', unclear: 'Not enough logged' };

/** A year (or a month) ago today, when you wrote something then. */
export function memoryCard() {
  const m = onThisDay(today());
  if (!m) return '';
  const body = html`<p class="memory-eyebrow">${icon('history', { size: 15 })} ${m.when} · ${fmtMDY(m.date)}</p><p class="memory-text">${m.text}</p>`;
  return html`<section class="block" data-key="memory">${m.id
    ? html`<a class="card card--link memory" href="#/reflect/journal/${m.id}" data-action="nav" data-to="reflect/journal/${m.id}">${body}</a>`
    : html`<div class="card memory">${body}<p class="memory-kind">Your win that day</p></div>`}</section>`;
}

function table(r) {
  if (!r.metrics.length) return '';
  return html`<dl class="facts facts--plain exp-facts">${r.metrics.map((m) => html`<div><dt>${m.label}</dt>
    <dd class="tnum">${value(m.key, m.before)} → ${value(m.key, m.during)}${r.ended ? html` · <b>${VERDICT[m.verdict]}</b>` : ''}</dd></div>`)}</dl>`;
}

export function experimentBlock() {
  const e = X.current();
  if (!e) {
    return html`<section class="block" data-key="experiment"><div class="block-head"><h2 class="block-title">Experiments</h2></div>
      <button type="button" class="row card" data-action="exp-new"><span class="row-ic">${icon('lightbulb', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Try something for two weeks</span><span class="row-sub">A habit, and up to two things to watch. At the end, before against during, and you decide.</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></button></section>`;
  }
  const r = X.result(e, today());
  const name = r.habit?.name || 'Your habit';
  return html`<section class="block" data-key="experiment"><div class="block-head"><h2 class="block-title">Experiment</h2>
      ${!r.ended ? html`<button type="button" class="link-btn" data-action="exp-stop">Stop early</button>` : ''}</div>
    <div class="card exp-card">
      <p class="section-label">${r.ended ? 'Finished' : `Day ${r.day} of ${e.days}`} · ${name}</p>
      <p class="exp-line">${r.due ? `Done ${r.done} of ${r.due} days` : 'Starting today'}${!r.ended ? ` · ${r.left} day${r.left === 1 ? '' : 's'} to go` : ''}</p>
      ${table(r)}
      ${r.ended ? html`<p class="field-hint">The ${e.days} days before against the ${e.days} days of the experiment. A pattern, not proof: how it felt counts too.</p>
        <div class="btn-row"><button type="button" class="btn btn--primary" data-action="exp-keep">Keep it</button>
          <button type="button" class="btn btn--soft" data-action="exp-drop">Drop it</button></div>` : ''}
    </div></section>`;
}

function openStart() {
  const habits = H.activeHabits().filter((h) => !H.isLimit(h)).sort((a, b) => a.name.localeCompare(b.name));
  app.sheet({
    title: 'Try it for a while',
    ui: { habitId: '', name: '', days: 14, watch: ['sleep', 'energy'], error: '' },
    render: (s) => {
      const u = s.ui;
      return html`<div class="form exp-form">
        <p class="sheet-note">One change, a fixed number of days, and a fair comparison at the end: the same number of days before against the days of the experiment.</p>
        <label class="field"><span class="field-label">The habit</span>
          <select class="input" data-change="exp-habit"><option value="" ${u.habitId ? '' : 'selected'}>Something new…</option>${habits.map((h) => html`<option value="${h.id}" ${u.habitId === h.id ? 'selected' : ''}>${h.name}</option>`)}</select></label>
        ${!u.habitId ? html`<label class="field"><span class="field-label">Name it</span><input class="input" data-input="exp-name" value="${u.name}" placeholder="e.g. No screens after 21:30" maxlength="60" enterkeyhint="done"></label>` : ''}
        <div class="field"><span class="field-label">For</span>
          <div class="chips" role="group" aria-label="How long">${X.LENGTHS.map((d) => html`<button type="button" class="${cx('chip', u.days === d && 'is-active')}" aria-pressed="${u.days === d}" data-action="exp-days" data-v="${d}">${d} days</button>`)}</div></div>
        <div class="field"><span class="field-label">Watch <small>up to two</small></span>
          <div class="chips" role="group" aria-label="What to watch">${Object.entries(X.METRICS).map(([k, m]) => html`<button type="button" class="${cx('chip', u.watch.includes(k) && 'is-active')}" aria-pressed="${u.watch.includes(k)}" data-action="exp-watch" data-k="${k}">${m.label}</button>`)}</div></div>
        ${u.error ? html`<p class="field-error" role="alert">${u.error}</p>` : ''}
        <button type="button" class="btn btn--primary btn--block" data-action="exp-start">Start · ends ${dayInline(endDate(u.days))}</button>
      </div>`;
    },
    inputs: { 'exp-name': ({ sheet, value: v }) => { sheet.ui.name = v; }, 'exp-habit': ({ sheet, value: v }) => { sheet.ui.habitId = v; sheet.refresh(); } },
    actions: {
      'exp-days': ({ sheet, data }) => { sheet.ui.days = Number(data.v); hap.tap(); sheet.refresh(); },
      'exp-watch': ({ sheet, data }) => {
        const w = sheet.ui.watch;
        sheet.ui.watch = w.includes(data.k) ? w.filter((k) => k !== data.k) : [...w, data.k].slice(-2);
        hap.tap(); sheet.refresh();
      },
      'exp-start': ({ sheet }) => {
        const u = sheet.ui;
        const name = (sheet.el.querySelector('[data-input="exp-name"]')?.value ?? u.name).trim();
        try { X.start({ habitId: u.habitId || null, name, days: u.days, watch: u.watch }); } catch (err) { u.error = err.message; sheet.refresh(); return; }
        hap.success();
        app.closeSheet(sheet);
        app.toast(`Experiment started: ${u.days} days`, { icon: 'check' });
      },
    },
  });
}
const endDate = (days) => addDays(today(), days - 1);

export const experimentActions = {
  'exp-new': () => openStart(),
  'exp-stop': () => {
    const e = X.current();
    if (!e) return;
    app.sheet({
      title: 'Stop the experiment?',
      render: () => html`<div class="form"><p class="sheet-note">It ends now without a verdict. The habit stays as it is.</p>
        <button type="button" class="btn btn--primary btn--block" data-action="exp-stop-yes">Stop it</button></div>`,
      actions: { 'exp-stop-yes': ({ sheet }) => { X.cancel(e); app.closeSheet(sheet); app.toast('Experiment stopped.'); } },
    });
  },
  'exp-keep': () => { const e = X.current(); if (!e) return; const undo = X.finish(e, true); hap.success(); app.toast(`Kept: ${H.habit(e.habitId)?.name || 'the habit'}`, { icon: 'check', action: { label: 'Undo', fn: undo } }); },
  'exp-drop': () => { const e = X.current(); if (!e) return; const undo = X.finish(e, false); app.toast(e.created ? 'Dropped, and archived. Its history stays.' : 'Dropped. The habit stays as it was.', { action: { label: 'Undo', fn: undo } }); },
};
