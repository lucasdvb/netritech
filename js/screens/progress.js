import * as store from '../data/store.js';
import { areaList } from './area.js';
import * as M from '../domain/metrics.js';
import * as F from '../domain/fitness.js';
import * as H from '../domain/habits.js';
import { dayScore, rolling, band, categoryConsistency } from '../domain/scoring.js';
import { weeklyInsights } from '../domain/coach.js';
import { CATEGORIES, catColor } from '../domain/taxonomy.js';
import { today, lastNDays, addDays, fmtMD, fmtDayShort, fmtMonth, startOfMonth, endOfMonth, addMonths, range, weekday, startOfWeek, relativeDay, durationHM, fmtLong } from '../domain/dates.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, segmented, empty } from '../ui/components.js';
import { lineChart, barChart } from '../ui/charts.js';
import { num, pct, signed, kgOut, weightUnit, cmOut, lengthUnit, litres } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const SEGS = [{ id: 'overview', label: 'Trends' }, { id: 'calendar', label: 'Calendar' }, { id: 'insights', label: 'Insights' }];
const RANGES = [{ id: '30', label: '30d' }, { id: '60', label: '60d' }, { id: '90', label: '90d' }];
const pctFmt = (v) => `${Math.round(v * 100)}%`;
const axisPct = (v) => `${Math.round(v * 100)}`;

/* ---------- direction summary ---------- */
function trendRow(label, value, dir, good, note) {
  const arrow = dir > 0 ? 'trending-up' : dir < 0 ? 'trending-down' : 'move-right';
  const tone = good == null ? '' : good ? 'is-good' : 'is-watch';
  return html`<li class="dir-row"><span class="dir-label">${label}</span><span class="dir-val tnum">${value}</span>
    <span class="${cx('dir-arrow', tone)}" aria-label="${good == null ? 'no trend yet' : good ? 'moving the right way' : 'worth a look'}">${icon(arrow, { size: 16 })}</span>
    ${note ? html`<span class="dir-note">${note}</span>` : ''}</li>`;
}

function direction() {
  const t = M.targets();
  const end = today();
  const w = M.weightSummary(end);
  const avgOver = (fn, from, days) => M.averageOver(from, days, fn);
  const prot = avgOver((d) => M.nutrition(d).protein, addDays(end, -1), 7);
  const protPrev = avgOver((d) => M.nutrition(d).protein, addDays(end, -8), 7);
  const sleep = avgOver((d) => M.sleepHours(d), end, 7);
  const sleepPrev = avgOver((d) => M.sleepHours(d), addDays(end, -7), 7);
  const steps = avgOver((d) => M.steps(d), addDays(end, -1), 7);
  const stepsPrev = avgOver((d) => M.steps(d), addDays(end, -8), 7);
  const wk = F.weekStats(end);
  const r7 = rolling(end, 7), rPrev = rolling(addDays(end, -7), 7);
  const mind = lastNDays(end, 7).reduce((a, d) => a + M.mindMinutes(d), 0);
  const mindPrev = lastNDays(addDays(end, -7), 7).reduce((a, d) => a + M.mindMinutes(d), 0);
  const prayer = H.habit('h-prayer');
  const prayDays = prayer ? lastNDays(end, 7).filter((d) => H.isDone(prayer, d)).length : 0;
  const fiancee = H.habit('h-fiancee');
  const loveDays = fiancee ? lastNDays(end, 7).filter((d) => H.isDone(fiancee, d)).length : 0;
  const sign = (a, b) => (a == null || b == null ? 0 : a > b * 1.03 ? 1 : a < b * 0.97 ? -1 : 0);
  return html`<section class="card dir" data-key="dir">
    <div class="card-head"><p class="section-label">Direction · last 7 days</p><span class="muted small">arrows vs the week before</span></div>
    <ul class="dir-list">
      ${trendRow('Consistency', pct(r7.ratio), sign(r7.ratio, rPrev.ratio), r7.ratio == null || rPrev.ratio == null ? null : r7.ratio >= rPrev.ratio - 0.02)}
      ${trendRow('Weight (7-day avg)', w.avg7 != null ? `${num(kgOut(w.avg7), 1)} ${weightUnit()}` : '—', w.weekChange == null ? 0 : w.weekChange < -0.05 ? -1 : w.weekChange > 0.05 ? 1 : 0,
        w.weekChange == null ? null : w.weekChange <= 0.05, w.weekChange != null ? `${signed(kgOut(w.weekChange), 1)} ${weightUnit()}` : '')}
      ${trendRow('Training', `${wk.sessions} sessions`, 0, wk.sessions >= Math.min(4, weekday(end) * 4 / 7) - 1 ? true : null)}
      ${trendRow('Protein', prot.n ? `${num(prot.value)} g/day` : '—', sign(prot.value, protPrev.value), prot.n ? prot.value >= t.proteinHitG : null)}
      ${trendRow('Steps', steps.n ? num(steps.value) : '—', sign(steps.value, stepsPrev.value), steps.n ? steps.value >= M.stepsTarget(end) * 0.9 : null)}
      ${trendRow('Sleep', sleep.n ? `${num(sleep.value, 1)} h` : '—', sign(sleep.value, sleepPrev.value), sleep.n ? sleep.value >= t.sleepMinH : null)}
      ${trendRow('Reading & learning', `${num(mind)} min`, sign(mind, mindPrev), mind ? mind >= mindPrev * 0.8 : null)}
      ${trendRow('Prayer', `${prayDays} of 7 days`, 0, prayer ? prayDays >= 5 : null)}
      ${trendRow('Time with your fiancée', `${loveDays} of 7 days`, 0, fiancee ? loveDays >= 5 : null)}
    </ul>
  </section>`;
}

/* ---------- overview ---------- */
function overview(ui) {
  const days = Number(ui.range || 30);
  const end = today();
  const span = lastNDays(end, days);
  const lab = span.map((d) => fmtMD(d));
  const t = M.targets();
  const started = (d) => d >= H.trackingStart();
  const scores = span.map((d) => (started(d) ? rolling(d, 7).ratio : null));
  const c7 = rolling(end, 7), c30 = rolling(end, 30), c90 = rolling(end, 90);
  const weights = span.map((d) => (store.all('weightEntries').some((e) => e.date <= d) && M.weightAvg(d, 7) != null ? kgOut(M.weightAvg(d, 7)) : null));
  const waist = store.all('measurements').filter((m) => m.waist != null).sort((a, b) => (a.date < b.date ? -1 : 1));
  const weeks = F.weeklySeries(Math.ceil(days / 7), (d) => F.weekStats(d));
  const exercisesWithHistory = F.exercises().map((e) => ({ e, n: F.exerciseHistory(e.id, 60).length })).filter((x) => x.n)
    .sort((a, b) => (['cardio', 'mobility'].includes(a.e.category) - ['cardio', 'mobility'].includes(b.e.category)) || b.n - a.n).map((x) => x.e);
  const exId = ui.ex && F.exercise(ui.ex) ? ui.ex : exercisesWithHistory[0]?.id;
  const exHist = exId ? F.exerciseHistory(exId, 30) : [];
  const ex = exId ? F.exercise(exId) : null;
  const barLabels = span.map((d) => (days <= 30 ? fmtDayShort(d).slice(0, 1) : ''));
  return html`
    ${direction()}
    <section class="block" data-key="cons">
      <div class="block-head"><h2 class="block-title">Consistency</h2>${segmented(RANGES, String(days), { action: 'range', name: 'Range', cls: 'seg--inline' })}</div>
      <div class="stat-row stat-row--3">
        <div class="stat"><p class="stat-label">7 days</p><p class="stat-value tnum">${pct(c7.ratio)}</p><p class="stat-sub band band--${band(c7.ratio).key}">${c7.days >= 3 ? band(c7.ratio).label : 'building'}</p></div>
        <div class="stat"><p class="stat-label">30 days</p><p class="stat-value tnum">${pct(c30.ratio)}</p><p class="stat-sub">${c30.days} days scored</p></div>
        <div class="stat"><p class="stat-label">90 days</p><p class="stat-value tnum">${pct(c90.ratio)}</p><p class="stat-sub">${c90.days} days scored</p></div>
      </div>
      <div class="card chart-card">${lineChart({ labels: lab, series: [{ values: scores, color: 'var(--chart-1)', fill: 'var(--accent)', area: true, label: 'Rolling 7-day' }], fmt: pctFmt, yFmt: axisPct, yMin: 0, yMax: 1, goal: { value: 0.85, label: 'strong' }, empty: 'Your rolling consistency appears after a few days.' })}</div>
      <div class="card block-tight">
        <p class="section-label">By area · 30 days</p>
        <ul class="area-bars">${CATEGORIES.map((c) => { const v = categoryConsistency(c.id, end, 30); return html`<li><span class="area-name">${c.label}</span>
          <span class="area-track"><span style="transform:scaleX(${(v || 0).toFixed(3)});background:${catColor(c.id)}"></span></span><span class="area-val tnum">${pct(v)}</span></li>`; })}</ul>
      </div>
    </section>

    <section class="block" data-key="weight"><div class="block-head"><h2 class="block-title">Weight · 7-day average</h2><a class="link-btn" href="#/progress/body/weight" data-action="nav" data-to="progress/body/weight">Details</a></div>
      <div class="card chart-card">${lineChart({ labels: lab, series: [{ values: weights, color: 'var(--chart-1)', fill: 'var(--accent)', area: true, label: '7-day avg' }], fmt: (v) => `${num(v, 1)} ${weightUnit()}`, empty: 'Weigh in a few mornings to see the trend.' })}</div></section>

    <section class="block" data-key="waist"><div class="block-head"><h2 class="block-title">Waist</h2><a class="link-btn" href="#/progress/body/measurements" data-action="nav" data-to="progress/body/measurements">Measurements</a></div>
      <div class="card chart-card">${lineChart({ labels: waist.map((m) => fmtMD(m.date)), series: [{ values: waist.map((m) => cmOut(m.waist)), color: 'var(--c-posture)', area: true, marks: true, label: 'Waist' }], fmt: (v) => `${num(v, 1)} ${lengthUnit()}`, empty: 'Measure every two weeks to see this.' })}</div></section>

    <section class="block" data-key="protein"><div class="block-head"><h2 class="block-title">Protein</h2><span class="block-meta">${avgLine(span, (d) => M.nutrition(d).protein, 'g')}</span></div>
      <div class="card chart-card">${barChart({ labels: barLabels, tipLabels: lab, values: span.map((d) => M.nutrition(d).protein || null), color: 'var(--c-health)', fmt: (v) => `${num(v)} g`, goal: { value: t.proteinG, label: `${t.proteinG}` }, highlightLast: false })}</div></section>

    <section class="block" data-key="kcal"><div class="block-head"><h2 class="block-title">Calories</h2><span class="block-meta">${avgLine(span, (d) => M.nutrition(d).kcal, 'kcal')}</span></div>
      <div class="card chart-card">${barChart({ labels: barLabels, tipLabels: lab, values: span.map((d) => M.nutrition(d).kcal || null), color: 'var(--c-body)', fmt: (v) => `${num(v)} kcal`, goal: { value: t.kcal, label: num(t.kcal) }, goalIsMin: false, highlightLast: false })}</div></section>

    <section class="block" data-key="steps"><div class="block-head"><h2 class="block-title">Steps</h2><span class="block-meta">${avgLine(span, (d) => M.steps(d), '')}</span></div>
      <div class="card chart-card">${barChart({ labels: barLabels, tipLabels: lab, values: span.map((d) => M.steps(d)), color: 'var(--c-life)', fmt: (v) => num(v), goal: { value: M.stepsTarget(end), label: `${num(M.stepsTarget(end) / 1000)}k` }, highlightLast: false })}</div></section>

    <section class="block" data-key="sleep"><div class="block-head"><h2 class="block-title">Sleep</h2><a class="link-btn" href="#/progress/body/sleep" data-action="nav" data-to="progress/body/sleep">Consistency</a></div>
      <div class="card chart-card">${barChart({ labels: barLabels, tipLabels: lab, values: span.map((d) => M.sleepHours(d)), color: 'var(--c-posture)', fmt: (v) => durationHM(v * 60), goal: { value: t.sleepH, label: `${t.sleepH}h` }, highlightLast: false })}</div></section>

    <section class="block" data-key="train"><div class="block-head"><h2 class="block-title">Training · sessions per week</h2></div>
      <div class="card chart-card">${barChart({ labels: weeks.map((w) => fmtMD(w.date)), tipLabels: weeks.map((w) => `Week of ${fmtMD(w.date)}`), values: weeks.map((w) => w.sessions), color: 'var(--c-body)', fmt: (v) => `${v} sessions`, goal: { value: 4, label: '4' }, height: 130 })}</div></section>

    <section class="block" data-key="strength"><div class="block-head"><h2 class="block-title">Strength</h2>
      ${exercisesWithHistory.length ? html`<select class="input input--inline" data-change="ex" aria-label="Exercise">${exercisesWithHistory.map((e) => html`<option value="${e.id}" ${raw(e.id === exId ? 'selected' : '')}>${e.name}</option>`)}</select>` : ''}</div>
      <div class="card chart-card">${ex ? lineChart({ labels: exHist.map((h) => fmtMD(h.workout.date)), series: [{ values: exHist.map((h) => (ex.metric === 'time' ? h.perf.topSeconds : ex.metric === 'minutes' ? h.perf.minutes : h.perf.totalReps)), color: 'var(--c-body)', area: true, marks: true, label: ex.metric === 'time' ? 'Best hold' : 'Total reps' }], fmt: (v) => (ex.metric === 'time' ? `${v} s` : `${v} ${ex.metric === 'minutes' ? 'min' : 'reps'}`), zero: true, empty: 'Log this exercise twice to see progression.' })
        : html`<div class="chart chart--empty" style="height:150px"><p>Strength progression appears after your first sessions.</p></div>`}</div></section>`;
}

function avgLine(span, fn, unit) {
  const vals = span.map(fn).filter((v) => v != null && v > 0);
  return vals.length ? `${num(M.avg(vals))}${unit ? ` ${unit}` : ''} avg · ${vals.length} days` : '';
}

/* ---------- calendar ---------- */
function calendar(ui) {
  const month = ui.month || startOfMonth(today());
  const first = startOfMonth(month), last = endOfMonth(month);
  const lead = weekday(first) - 1;
  const cells = [...Array(lead).fill(null), ...range(first, last)];
  return html`<section class="block" data-key="cal">
    <div class="cal-head">
      <button type="button" class="icon-btn" data-action="month" data-delta="-1" aria-label="Previous month">${icon('chevron-left', { size: 20 })}</button>
      <h2 class="block-title">${fmtMonth(first)}</h2>
      <button type="button" class="icon-btn" data-action="month" data-delta="1" aria-label="Next month" ${first >= startOfMonth(today()) ? 'disabled' : ''}>${icon('chevron-right', { size: 20 })}</button>
    </div>
    <div class="cal-grid" role="grid" aria-label="${fmtMonth(first)}">
      ${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => html`<span class="cal-dow" aria-hidden="true">${d}</span>`)}
      ${cells.map((d) => {
        if (!d) return html`<span class="cal-empty"></span>`;
        const s = d <= today() && d >= H.trackingStart() ? dayScore(d) : null;
        const hasWorkout = F.workoutsOn(d).length > 0;
        const hasJournal = store.onDate('journalEntries', d).length > 0;
        const fill = s?.ratio ?? 0;
        return html`<button type="button" class="${cx('cal-day', d === today() && 'is-today', d > today() && 'is-future', H.isOff(s?.mode) && 'is-sick')}" data-action="day" data-date="${d}" ${d > today() ? 'disabled' : ''}
          aria-label="${fmtLong(d)}${s?.ratio != null ? `, ${pct(s.ratio)}` : ''}${hasWorkout ? ', workout' : ''}">
          <span class="cal-num tnum">${Number(d.slice(8))}</span>
          <span class="cal-fill" style="opacity:${s?.ratio != null ? 0.12 + fill * 0.88 : 0}"></span>
          <span class="cal-marks">${hasWorkout ? html`<i class="m-w"></i>` : ''}${hasJournal ? html`<i class="m-j"></i>` : ''}</span>
        </button>`;
      })}
    </div>
    <div class="cal-legend"><span><i class="cal-swatch"></i>Daily score</span><span><i class="m-w"></i>Workout</span><span><i class="m-j"></i>Journal</span></div>
  </section>`;
}

export function openDay(date) {
  app.sheet({
    title: fmtLong(date),
    render: () => {
      const s = dayScore(date);
      const hs = H.activeHabits().filter((h) => H.dueOn(h, date));
      const n = M.nutrition(date);
      const sl = M.sleep(date);
      const mood = M.mood(date);
      const ws = F.workoutsOn(date);
      const j = store.onDate('journalEntries', date);
      const r = M.review(date);
      const facts = [
        ['Score', s.ratio != null ? `${pct(s.ratio)} · ${s.done} of ${s.total}` : s.mode === 'sick' ? 'Sick day' : s.mode === 'away' ? 'Away' : '—'],
        ['Weight', M.weight(date) != null ? `${num(kgOut(M.weight(date)), 1)} ${weightUnit()}` : '—'],
        ['Workout', ws.length ? ws.map((w) => w.title).join(', ') : '—'],
        ['Nutrition', n.count ? `${num(n.protein)} g protein · ${num(n.kcal)} kcal` : '—'],
        ['Water', M.waterMl(date) ? litres(M.waterMl(date)) : '—'],
        ['Steps', M.steps(date) != null ? num(M.steps(date)) : '—'],
        ['Sleep', sl ? `${durationHM(sl.hours * 60)}${sl.quality ? ` · quality ${sl.quality}` : ''}` : '—'],
        ['Mood', mood ? `energy ${mood.energy ?? '—'} · stress ${mood.stress ?? '—'} · mood ${mood.mood ?? '—'}` : '—'],
        ['Prayer', H.habit('h-prayer') && H.isDone(H.habit('h-prayer'), date) ? 'Yes' : '—'],
        ['Journal', j.length ? `${j.length} entr${j.length === 1 ? 'y' : 'ies'}` : '—'],
        ['Win', r?.win || '—'],
      ];
      return html`<div class="form">
        <dl class="facts facts--plain">${facts.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}</dl>
        ${hs.length ? html`<div><p class="form-label">Habits</p><div class="weekly-chips">${hs.map((h) => html`<span class="${cx('wchip', H.isDone(h, date) && 'is-done')}" style="--ic:${catColor(h.color || h.category)}">${icon(H.isDone(h, date) ? 'check' : h.icon, { size: 14 })}<span>${h.name}</span></span>`)}</div></div>` : ''}
        <button type="button" class="btn btn--primary btn--block" data-action="open-day">${date === today() ? 'Open today' : 'Open and edit this day'}</button>
      </div>`;
    },
    actions: { 'open-day': ({ sheet }) => { app.closeSheet(sheet); app.go(date === today() ? 'today' : `today/${date}`); } },
  });
}

/* ---------- insights ---------- */
function insights() {
  const thisWeek = weeklyInsights(startOfWeek(today()));
  const lastWeek = weeklyInsights(addDays(startOfWeek(today()), -7));
  const wins = store.all('dailyReviews').filter((r) => (r.win || '').trim()).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 8);
  const pbs = F.personalBests().filter((p) => p.reps || p.seconds).slice(0, 6);
  const best7 = bestWeek();
  const readDays = longestRun((d) => M.mindMinutes(d) > 0);
  const medLongest = Math.max(0, ...store.all('meditationSessions').map((m) => m.minutes || 0));
  const list = (items) => items.length ? html`<ul class="insight-list">${items.map((i) => html`<li><span class="insight-area">${i.area}</span><span>${i.text}</span></li>`)}</ul>` : html`<p class="muted">Insights appear once there’s a few days of data. They only ever state what your logs show.</p>`;
  return html`
    <section class="block" data-key="iw"><div class="block-head"><h2 class="block-title">This week so far</h2></div><div class="card">${list(thisWeek)}</div></section>
    <section class="block" data-key="il"><div class="block-head"><h2 class="block-title">Last week</h2></div><div class="card">${list(lastWeek)}</div></section>
    <section class="block" data-key="pb"><div class="block-head"><h2 class="block-title">Personal bests</h2></div>
      <dl class="facts">
        ${pbs.map((p) => html`<div><dt>${p.exercise.name}</dt><dd>${p.exercise.metric === 'time' ? `${p.seconds} s` : `${p.reps} reps`}${p.load ? ` · ${num(p.load, 1)} kg` : ''}</dd></div>`)}
        <div><dt>Best weekly consistency</dt><dd>${best7 ? `${pct(best7.ratio)} · week of ${fmtMD(best7.date)}` : '—'}</dd></div>
        <div><dt>Longest reading run</dt><dd>${readDays ? `${readDays} days` : '—'}</dd></div>
        <div><dt>Longest meditation</dt><dd>${medLongest ? `${medLongest} min` : '—'}</dd></div>
      </dl>
    </section>
    <section class="block" data-key="wins"><div class="block-head"><h2 class="block-title">Recent wins</h2></div>
      ${wins.length ? html`<ul class="list">${wins.map((w) => html`<li class="row"><span class="row-ic" style="--ic:var(--c-spirit)">${icon('star', { size: 16 })}</span><span class="row-main"><span class="row-title">${w.win}</span><span class="row-sub">${relativeDay(w.date)}</span></span></li>`)}</ul>`
        : html`<p class="muted">Record one win a day on Today. They collect here.</p>`}
    </section>`;
}

function bestWeek() {
  let best = null;
  for (let i = 0; i < 52; i++) {
    const end = addDays(startOfWeek(today()), -7 * i + 6);
    if (end < H.trackingStart()) break;
    const r = rolling(end > today() ? today() : end, 7);
    if (r.days >= 5 && (!best || r.ratio > best.ratio)) best = { ratio: r.ratio, date: startOfWeek(end) };
  }
  return best;
}

function longestRun(fn) {
  let best = 0, cur = 0;
  for (const d of range(H.trackingStart(), today())) { if (fn(d)) { cur++; best = Math.max(best, cur); } else cur = 0; }
  return best;
}

export default {
  id: 'progress',
  title: 'Progress',
  render({ params, ui }) {
    const seg = params.seg || ui.seg || 'overview';
    return html`
      ${pageHead({ title: 'Progress', sub: 'Where things are heading — quietly.',
        actions: html`<button type="button" class="icon-btn" data-action="open-search" aria-label="Search">${icon('search', { size: 20 })}</button>` })}
      ${segmented(SEGS, seg, { action: 'seg', name: 'Progress views' })}
      <div class="seg-body">${seg === 'calendar' ? calendar(ui) : seg === 'insights' ? insights() : overview(ui)}</div>
      ${seg === 'overview' ? html`<section class="block" data-key="body-link">
        <div class="block-head"><h2 class="block-title">Body</h2></div>
        <a class="card card--link sort-cta" href="#/progress/body" data-action="nav" data-to="progress/body">
          <span class="sort-cta-text"><span class="card-title">Weight, food, sleep and training</span><span class="row-sub">Trends, composition, measurements and photos</span></span>
          ${icon('chevron-right', { size: 18 })}</a></section>
      <section class="block" data-key="areas"><div class="block-head"><h2 class="block-title">Areas</h2></div>${areaList()}</section>` : ''}`;
  },
  actions: {
    seg: ({ data, ui }) => { ui.seg = data.value; hap.tap(); app.replace(`progress/${data.value}`); },
    range: ({ data, ui }) => { ui.range = data.value; app.refresh(); },
    month: ({ data, ui }) => {
      const cur = ui.month || startOfMonth(today());
      const next = addMonths(cur, Number(data.delta));
      if (next > startOfMonth(today())) return;
      ui.month = next;
      app.refresh();
    },
    day: ({ data }) => openDay(data.date),
  },
  inputs: { ex: ({ value, ui }) => { ui.ex = value; app.refresh(); } },
};
