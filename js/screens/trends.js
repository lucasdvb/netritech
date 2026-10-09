// All trends: the charts, one level below Progress. Opened from a measure or "what's moving", it
// shows that one first; "All trends" shows every chart, then personal bests and recent wins.
import * as store from '../data/store.js';
import * as M from '../domain/metrics.js';
import * as F from '../domain/fitness.js';
import * as H from '../domain/habits.js';
import { rolling, band, categoryConsistency } from '../domain/scoring.js';
import { CATEGORIES, catColor } from '../domain/taxonomy.js';
import { today, lastNDays, addDays, fmtMD, fmtDayShort, range, startOfWeek, relativeDay, durationHM } from '../domain/dates.js';
import { html, raw } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, segmented } from '../ui/components.js';
import { lineChart, barChart } from '../ui/charts.js';
import { num, pct, kgOut, weightUnit, cmOut, lengthUnit } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import { later } from '../ui/later.js';

// What the charts read: every logged store, weigh-ins included.
const TREND_READS = [...H.DATA_STORES, 'weightEntries', 'bodyFatEstimates', 'moodEntries'];
const RANGES = [{ id: '30', label: '30d' }, { id: '60', label: '60d' }, { id: '90', label: '90d' }];
const pctFmt = (v) => `${Math.round(v * 100)}%`;
const axisPct = (v) => `${Math.round(v * 100)}`;
// A metric opened from Progress, and the charts that belong to it.
const FOCUS = { consistency: { title: 'Consistency', keys: ['cons'] }, steps: { title: 'Steps', keys: ['steps'] }, training: { title: 'Training', keys: ['train', 'strength'] } };

function avgLine(span, fn, unit) {
  const vals = span.map(fn).filter((v) => v != null && v > 0);
  return vals.length ? `${num(M.avg(vals))}${unit ? ` ${unit}` : ''} avg · ${vals.length} days` : '';
}

function charts(ui) {
  const days = Number(ui.range || 30);
  const end = today();
  const span = lastNDays(end, days);
  const lab = span.map((d) => fmtMD(d));
  const t = M.targets();
  const started = (d) => d >= H.trackingStart();
  const c7 = rolling(end, 7), c30 = rolling(end, 30), c90 = rolling(end, 90);
  const barLabels = span.map((d) => (days <= 30 ? fmtDayShort(d).slice(0, 1) : ''));
  const exercisesWithHistory = () => F.exercises().map((e) => ({ e, n: F.sessionsPerExercise().get(e.id) || 0 })).filter((x) => x.n)
    .sort((a, b) => (['cardio', 'mobility'].includes(a.e.category) - ['cardio', 'mobility'].includes(b.e.category)) || b.n - a.n).map((x) => x.e);
  return {
    cons: () => html`<section class="block" data-key="cons">
      <div class="block-head"><h2 class="block-title">Consistency</h2>${segmented(RANGES, String(days), { action: 'range', name: 'Range', cls: 'seg--inline' })}</div>
      <div class="stat-row stat-row--3">
        <div class="stat"><p class="stat-label">7 days</p><p class="stat-value tnum">${pct(c7.ratio)}</p><p class="stat-sub band band--${band(c7.ratio).key}">${c7.days >= 3 ? band(c7.ratio).label : 'building'}</p></div>
        <div class="stat"><p class="stat-label">30 days</p><p class="stat-value tnum">${pct(c30.ratio)}</p><p class="stat-sub">${c30.days} days scored</p></div>
        <div class="stat"><p class="stat-label">90 days</p><p class="stat-value tnum">${pct(c90.ratio)}</p><p class="stat-sub">${c90.days} days scored</p></div>
      </div>
      <div class="card chart-card">${lineChart({ labels: lab, series: [{ values: span.map((d) => (started(d) ? rolling(d, 7).ratio : null)), color: 'var(--chart-1)', fill: 'var(--accent)', area: true, label: 'Rolling 7-day' }], fmt: pctFmt, yFmt: axisPct, yMin: 0, yMax: 1, goal: { value: 0.85, label: 'strong' }, empty: 'Your rolling consistency appears after a few days.' })}</div>
      <div class="card block-tight">
        <p class="section-label">By area · 30 days</p>
        <ul class="area-bars">${CATEGORIES.map((c) => { const v = categoryConsistency(c.id, end, 30); return html`<li><span class="area-name">${c.label}</span>
          <span class="area-track"><span style="transform:scaleX(${(v || 0).toFixed(3)});background:${catColor(c.id)}"></span></span><span class="area-val tnum">${pct(v)}</span></li>`; })}</ul>
      </div>
    </section>`,
    weight: () => html`<section class="block" data-key="weight"><div class="block-head"><h2 class="block-title">Weight · 7-day average</h2><a class="link-btn" href="#/progress/body/weight" data-action="nav" data-to="progress/body/weight">Details</a></div>
      <div class="card chart-card">${lineChart({ labels: lab, series: [{ values: span.map((d) => (store.all('weightEntries').some((e) => e.date <= d) && M.weightAvg(d, 7) != null ? kgOut(M.weightAvg(d, 7)) : null)), color: 'var(--chart-1)', fill: 'var(--accent)', area: true, label: '7-day avg' }], fmt: (v) => `${num(v, 1)} ${weightUnit()}`, empty: 'Weigh in a few mornings to see the trend.' })}</div></section>`,
    waist: () => {
      const waist = store.all('measurements').filter((m) => m.waist != null).sort((a, b) => (a.date < b.date ? -1 : 1));
      return html`<section class="block" data-key="waist"><div class="block-head"><h2 class="block-title">Waist</h2><a class="link-btn" href="#/progress/body/measurements" data-action="nav" data-to="progress/body/measurements">Measurements</a></div>
        <div class="card chart-card">${lineChart({ labels: waist.map((m) => fmtMD(m.date)), series: [{ values: waist.map((m) => cmOut(m.waist)), color: 'var(--c-posture)', area: true, marks: true, label: 'Waist' }], fmt: (v) => `${num(v, 1)} ${lengthUnit()}`, empty: 'Measure every two weeks to see this.' })}</div></section>`;
    },
    protein: () => html`<section class="block" data-key="protein"><div class="block-head"><h2 class="block-title">Protein</h2><span class="block-meta">${avgLine(span, (d) => M.nutrition(d).protein, 'g')}</span></div>
      <div class="card chart-card">${barChart({ labels: barLabels, tipLabels: lab, values: span.map((d) => M.nutrition(d).protein || null), color: 'var(--c-health)', fmt: (v) => `${num(v)} g`, goal: { value: t.proteinG, label: `${t.proteinG}` }, highlightLast: false })}</div></section>`,
    kcal: () => html`<section class="block" data-key="kcal"><div class="block-head"><h2 class="block-title">Calories</h2><span class="block-meta">${avgLine(span, (d) => M.nutrition(d).kcal, 'kcal')}</span></div>
      <div class="card chart-card">${barChart({ labels: barLabels, tipLabels: lab, values: span.map((d) => M.nutrition(d).kcal || null), color: 'var(--c-body)', fmt: (v) => `${num(v)} kcal`, goal: { value: t.kcal, label: num(t.kcal) }, goalIsMin: false, highlightLast: false })}</div></section>`,
    steps: () => html`<section class="block" data-key="steps"><div class="block-head"><h2 class="block-title">Steps</h2><span class="block-meta">${avgLine(span, (d) => M.steps(d), '')}</span></div>
      <div class="card chart-card">${barChart({ labels: barLabels, tipLabels: lab, values: span.map((d) => M.steps(d)), color: 'var(--c-life)', fmt: (v) => num(v), goal: { value: M.stepsTarget(end), label: `${num(M.stepsTarget(end) / 1000)}k` }, highlightLast: false })}</div></section>`,
    sleep: () => html`<section class="block" data-key="sleep"><div class="block-head"><h2 class="block-title">Sleep</h2><a class="link-btn" href="#/progress/body/sleep" data-action="nav" data-to="progress/body/sleep">Consistency</a></div>
      <div class="card chart-card">${barChart({ labels: barLabels, tipLabels: lab, values: span.map((d) => M.sleepHours(d)), color: 'var(--c-posture)', fmt: (v) => durationHM(v * 60), goal: { value: t.sleepH, label: `${t.sleepH}h` }, highlightLast: false })}</div></section>`,
    train: () => {
      const weeks = F.weeklySeries(Math.ceil(days / 7), (d) => F.weekStats(d));
      return html`<section class="block" data-key="train"><div class="block-head"><h2 class="block-title">Training · sessions per week</h2></div>
        <div class="card chart-card">${barChart({ labels: weeks.map((w) => fmtMD(w.date)), tipLabels: weeks.map((w) => `Week of ${fmtMD(w.date)}`), values: weeks.map((w) => w.sessions), color: 'var(--c-body)', fmt: (v) => `${v} sessions`, goal: { value: 4, label: '4' }, height: 130 })}</div></section>`;
    },
    strength: () => {
      const list = exercisesWithHistory();
      const exId = ui.ex && F.exercise(ui.ex) ? ui.ex : list[0]?.id;
      const ex = exId ? F.exercise(exId) : null;
      const hist = exId ? F.exerciseHistory(exId, 30) : [];
      return html`<section class="block" data-key="strength"><div class="block-head"><h2 class="block-title">Strength</h2>
        ${list.length ? html`<select class="input input--inline" data-change="ex" aria-label="Exercise">${list.map((e) => html`<option value="${e.id}" ${raw(e.id === exId ? 'selected' : '')}>${e.name}</option>`)}</select>` : ''}</div>
        <div class="card chart-card">${ex ? lineChart({ labels: hist.map((h) => fmtMD(h.workout.date)), series: [{ values: hist.map((h) => (ex.metric === 'time' ? h.perf.topSeconds : ex.metric === 'minutes' ? h.perf.minutes : h.perf.totalReps)), color: 'var(--c-body)', area: true, marks: true, label: ex.metric === 'time' ? 'Best hold' : 'Total reps' }], fmt: (v) => (ex.metric === 'time' ? `${v} s` : `${v} ${ex.metric === 'minutes' ? 'min' : 'reps'}`), zero: true, empty: 'Log this exercise twice to see progression.' })
          : html`<div class="chart chart--empty" style="height:150px"><p>Strength progression appears after your first sessions.</p></div>`}</div></section>`;
    },
  };
}

/** The bests worth a line, worked out once until your data changes. */
const bestFacts = () => store.memo(`trend-bests:${today()}`, H.DATA_STORES, () => {
  const wins = store.all('dailyReviews').filter((r) => (r.win || '').trim()).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  const pbs = F.personalBests().filter((p) => p.reps || p.seconds).slice(0, 6);
  let best7 = null;
  for (let i = 0; i < 52; i++) {
    const end = addDays(startOfWeek(today()), -7 * i + 6);
    if (end < H.trackingStart()) break;
    const r = rolling(end > today() ? today() : end, 7);
    if (r.days >= 5 && (!best7 || r.ratio > best7.ratio)) best7 = { ratio: r.ratio, date: startOfWeek(end) };
  }
  let readDays = 0, cur = 0;
  for (const d of range(H.trackingStart(), today())) { if (M.mindMinutes(d) > 0) { cur++; readDays = Math.max(readDays, cur); } else cur = 0; }
  const medLongest = Math.max(0, ...store.all('meditationSessions').map((m) => m.minutes || 0));
  return { wins, pbs, best7, readDays, medLongest };
});

function bests() {
  const { wins, pbs, best7, readDays, medLongest } = bestFacts();
  return html`<section class="block" data-key="pb"><div class="block-head"><h2 class="block-title">Personal bests</h2></div>
      <dl class="facts">
        ${pbs.map((p) => html`<div><dt>${p.exercise.name}</dt><dd>${p.exercise.metric === 'time' ? `${p.seconds} s` : `${p.reps} reps`}${p.load ? ` · ${num(p.load, 1)} kg` : ''}</dd></div>`)}
        <div><dt>Best weekly consistency</dt><dd>${best7 ? `${pct(best7.ratio)} · week of ${fmtMD(best7.date)}` : '—'}</dd></div>
        <div><dt>Longest reading run</dt><dd>${readDays ? `${readDays} days` : '—'}</dd></div>
        <div><dt>Longest meditation</dt><dd>${medLongest ? `${medLongest} min` : '—'}</dd></div>
      </dl></section>
    <section class="block" data-key="wins"><div class="block-head"><h2 class="block-title">Recent wins</h2></div>
      ${wins.length ? html`<ul class="list">${wins.map((w) => html`<li class="row"><span class="row-ic">${icon('star', { size: 16 })}</span><span class="row-main"><span class="row-title">${w.win}</span><span class="row-sub">${relativeDay(w.date)}</span></span></li>`)}</ul>`
        : html`<p class="quiet-line">Name one win when you close the day. They collect here.</p>`}
    </section>`;
}

export default {
  id: 'trends',
  title: 'Trends',
  render({ params, ui }) {
    const focus = FOCUS[params.metric];
    const all = charts(ui);
    const keys = focus ? focus.keys : Object.keys(all);
    // A chart is redrawn only when your data or its range changes, not on every redraw of the page
    // (background work such as records and levels redraws the screen it is on).
    const chart = (k) => () => raw(store.memo(`trends:${k}:${ui.range || 30}:${ui.ex || ''}`, TREND_READS, () => String(all[k]())));
    return html`
      ${pageHead({ title: focus ? focus.title : 'All trends', morph: focus ? `metric-${params.metric}` : null, back: { to: 'progress', label: 'Progress' } })}
      ${keys.map((k, i) => (focus || i < 2 ? chart(k)() : later(k, chart(k))))}
      ${focus ? html`<a class="btn btn--soft btn--block block" href="#/progress/trends" data-action="nav" data-to="progress/trends">All trends</a>` : later('pb', bests, 560)}`;
  },
  actions: { range: ({ data, ui }) => { ui.range = data.value; app.refresh(); } },
  inputs: { ex: ({ value, ui }) => { ui.ex = value; app.refresh(); } },
};
