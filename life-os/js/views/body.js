import * as store from '../core/store.js';
import * as M from '../core/metrics.js';
import * as F from '../core/fitness.js';
import * as H from '../core/habits.js';
import { trainingCall } from '../core/coach.js';
import { today, lastNDays, fmtMD, relativeDay, durationHM, startOfWeek, addDays, diffDays } from '../core/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, ring } from '../ui/components.js';
import { sparkline } from '../ui/charts.js';
import { num, weight as fw, length as fl, signed, litres, kgOut, weightUnit, pct } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import { openWeight, openFood, addWater, openSteps } from './sheets.js';
import { openStartSheet } from './workout-actions.js';

export function weightCard() {
  const s = M.weightSummary();
  const days = lastNDays(today(), 30);
  const series = days.map((d) => M.weightAvg(d, 7)).map((v, i) => (M.weight(days[i]) != null || i === days.length - 1 ? v : null));
  if (!s.count) {
    return html`<button type="button" class="card card--action body-hero" data-action="log-weight">
      <p class="section-label">Weight</p>
      <p class="hero-empty-title">Give us a starting point.</p>
      <p class="muted">One morning weigh-in. The 7-day average does the rest.</p>
      <span class="btn btn--primary btn--sm">${icon('plus', { size: 16 })} Log weight</span></button>`;
  }
  return html`<div class="card card--ink body-hero">
    <div class="meridian" data-static="meridian" data-key="meridian" aria-hidden="true"></div>
    <div class="body-hero-top">
      <a class="body-hero-main" href="#/body/weight" data-action="nav" data-to="body/weight">
        <p class="section-label">Weight · 7-day average</p>
        <p class="big-num tnum">${s.avg7 != null ? num(kgOut(s.avg7), 1) : '—'}<span>${weightUnit()}</span></p>
        <p class="hero-meta">${s.weekChange != null ? html`<span class="${cx('delta', s.weekChange < -0.05 && 'is-down', s.weekChange > 0.05 && 'is-up')}">${signed(kgOut(s.weekChange), 1)} ${weightUnit()}</span> this week` : 'Change appears after a week'}
          ${s.sinceStart != null ? html` · ${signed(kgOut(s.sinceStart), 1)} since start` : ''}</p>
      </a>
      <div class="body-hero-spark">${sparkline(series, { color: 'var(--glow)', width: 104, height: 44 })}</div>
    </div>
    <div class="body-hero-foot">
      <span class="muted">${s.latest ? `Last weigh-in ${relativeDay(s.latest.date).toLowerCase()} · ${fw(s.latest.kg)}` : ''}</span>
      <button type="button" class="btn btn--soft btn--sm" data-action="log-weight">${icon('plus', { size: 16 })} Log</button>
    </div>
  </div>`;
}

function compositionCard() {
  const c = M.bodyComposition();
  const p = store.profile();
  const progress = c.bodyFat != null ? Math.max(0, Math.min(1, (p.startBodyFat - c.bodyFat) / (p.startBodyFat - p.goalBodyFat))) : 0;
  return html`<a class="card card--link" href="#/body/measurements" data-action="nav" data-to="body/measurements">
    <div class="card-head"><p class="section-label">Body composition · estimate</p>${icon('chevron-right', { size: 18, cls: 'muted' })}</div>
    <div class="comp-grid">
      <div><p class="stat-label">Body fat</p><p class="comp-val tnum">~${num(c.bodyFat, 1)}%</p></div>
      <div><p class="stat-label">Lean mass</p><p class="comp-val tnum">~${num(kgOut(c.leanMass), 1)}<small> ${weightUnit()}</small></p></div>
      <div><p class="stat-label">Fat mass</p><p class="comp-val tnum">~${num(kgOut(c.fatMass), 1)}<small> ${weightUnit()}</small></p></div>
    </div>
    <div class="comp-goal">
      <div class="comp-track"><span style="transform:scaleX(${progress.toFixed(3)})"></span></div>
      <p class="muted">${num(p.startBodyFat)}% → goal ~${num(p.goalBodyFat)}% · goal weight about ${fw(c.goalWeight)} if muscle is kept</p>
    </div>
    <p class="fine-print">${c.source}${c.sourceDate ? ` · ${fmtMD(c.sourceDate)}` : ''}. Estimates, not medical measurements.</p>
  </a>`;
}

function trainingCard() {
  const w = F.weekStats(today());
  const active = F.activeWorkout();
  const call = trainingCall(today());
  const mob = H.habit('h-mobility');
  const days = lastNDays(today(), diffDays(today(), startOfWeek(today())) + 1);
  const postureDays = mob ? days.filter((d) => H.isDone(mob, d)).length : 0;
  const items = [
    ['Strength', w.strength, 4, 'var(--c-body)'],
    ['Calves', w.calfSessions, 3, 'var(--c-body)'],
    ['Core', w.coreSessions, 3, 'var(--c-body)'],
    ['Posture', postureDays, 7, 'var(--c-posture)'],
    ['Cardio', w.cardio, 2, 'var(--c-health)'],
  ];
  return html`<div class="card">
    <a class="card-head" href="#/body/training" data-action="nav" data-to="body/training"><p class="section-label">Training · this week</p>${icon('chevron-right', { size: 18, cls: 'muted' })}</a>
    <div class="week-meters">${items.map(([label, v, t, c]) => html`<div class="meter">
      <div class="meter-top"><span>${label}</span><b class="tnum">${v}<small>/${t}</small></b></div>
      <div class="meter-track"><span style="transform:scaleX(${Math.min(1, v / t).toFixed(3)});background:${c}"></span></div></div>`)}</div>
    ${active ? html`<button type="button" class="btn btn--primary btn--block" data-action="nav" data-to="body/workout/${active.id}">${icon('play', { size: 16 })} Resume ${active.title}</button>`
      : html`<button type="button" class="btn btn--soft btn--block" data-action="start">${icon('play', { size: 16 })} ${call.kind === 'done' ? 'Log another session' : `Start · ${call.title}`}</button>`}
  </div>`;
}

export function nutritionRings(date = today()) {
  const n = M.nutrition(date);
  const t = M.targets();
  const water = M.waterMl(date);
  const rings = [
    { label: 'Protein', v: n.protein, t: t.proteinG, text: `${num(n.protein)}`, unit: `/ ${t.proteinG} g`, c: 'var(--c-health)', act: 'food' },
    { label: 'Calories', v: n.kcal, t: t.kcal, text: num(n.kcal), unit: `/ ${num(t.kcal)}`, c: 'var(--c-body)', act: 'food' },
    { label: 'Water', v: water, t: t.waterMl, text: num(water / 1000, 1), unit: `/ ${num(t.waterMl / 1000, 1)} L`, c: 'var(--c-posture)', act: 'water' },
    { label: 'Fruit & veg', v: n.fruit + n.veg, t: (t.fruit || 2) + (t.veg || 2), text: `${n.fruit + n.veg}`, unit: `/ ${(t.fruit || 2) + (t.veg || 2)}`, c: 'var(--c-life)', act: 'food' },
  ];
  return html`<div class="ring-grid">${rings.map((r) => html`<button type="button" class="ring-cell" data-action="${r.act}" aria-label="${r.label}: ${r.text} ${r.unit}">
    <span class="ring-wrap">${ring(r.v / r.t, { size: 64, stroke: 6, color: r.c })}${r.v >= r.t ? html`<span class="ring-check">${icon('check', { size: 16, stroke: 2.4 })}</span>` : ''}</span>
    <span class="ring-label">${r.label}</span><span class="ring-val tnum">${r.text}<small> ${r.unit}</small></span></button>`)}</div>`;
}

function sleepStepsCard() {
  const sl = M.sleep(today());
  const s7 = M.averageOver(today(), 7, (d) => M.sleepHours(d));
  const st = M.steps(today());
  const st7 = M.averageOver(addDays(today(), -1), 7, (d) => M.steps(d));
  return html`<div class="duo">
    <a class="card card--link duo-cell" href="#/body/sleep" data-action="nav" data-to="body/sleep">
      <p class="section-label">${icon('bed', { size: 13 })} Sleep</p>
      <p class="duo-val tnum">${sl ? durationHM(sl.hours * 60) : '—'}</p>
      <p class="muted">${s7.n ? `7-day avg ${num(s7.value, 1)} h` : 'Log it in the check-in'}</p>
    </a>
    <button type="button" class="card card--link duo-cell" data-action="steps">
      <p class="section-label">${icon('footprints', { size: 13 })} Steps</p>
      <p class="duo-val tnum">${st != null ? num(st) : '—'}</p>
      <p class="muted">${st7.n ? `7-day avg ${num(st7.value)}` : `Target ${num(M.stepsTarget(today()))}`}</p>
    </button>
  </div>`;
}

function measureCard() {
  const waist = M.latestMeasurement('waist');
  const first = store.all('measurements').filter((m) => m.waist).sort((a, b) => (a.date < b.date ? -1 : 1))[0];
  const photos = store.all('photos').sort((a, b) => (a.date < b.date ? 1 : -1));
  const mDue = H.habit('h-measure') ? H.periodLabel(H.habit('h-measure'), today()) : '';
  return html`<div class="duo">
    <a class="card card--link duo-cell" href="#/body/measurements" data-action="nav" data-to="body/measurements">
      <p class="section-label">${icon('ruler', { size: 13 })} Waist</p>
      <p class="duo-val tnum">${waist ? fl(Number(waist.waist)) : '—'}</p>
      <p class="muted">${waist && first && first.id !== waist.id ? `${signed(waist.waist - first.waist, 1)} cm since first` : mDue || 'Every two weeks'}</p>
    </a>
    <a class="card card--link duo-cell" href="#/body/photos" data-action="nav" data-to="body/photos">
      <p class="section-label">${icon('camera', { size: 13 })} Photos</p>
      <p class="duo-val">${photos.length ? relativeDay(photos[0].date) : 'None yet'}</p>
      <p class="muted">Monthly · private to this device</p>
    </a>
  </div>`;
}

export default {
  id: 'body',
  title: 'Body',
  render() {
    return html`
      ${pageHead({ title: 'Body', sub: 'Lose fat, keep the muscle, feel good doing it.',
        actions: html`<button type="button" class="icon-btn" data-action="open-search" aria-label="Search">${icon('search', { size: 20 })}</button>` })}
      <div class="body-grid">
        <div class="stack">${weightCard()}${compositionCard()}${measureCard()}</div>
        <div class="stack">
          ${trainingCard()}
          <div class="card">
            <a class="card-head" href="#/body/nutrition" data-action="nav" data-to="body/nutrition"><p class="section-label">Nutrition · today</p>${icon('chevron-right', { size: 18, cls: 'muted' })}</a>
            ${nutritionRings()}
            <div class="quick-row">
              <button type="button" class="btn btn--soft btn--sm" data-action="food">${icon('plus', { size: 16 })} Food</button>
              <button type="button" class="btn btn--soft btn--sm" data-action="whey">Whey · 25.5 g</button>
              <button type="button" class="btn btn--soft btn--sm" data-action="water-500">${icon('droplet', { size: 15 })} +500 ml</button>
            </div>
          </div>
          ${sleepStepsCard()}
        </div>
      </div>`;
  },
  actions: {
    'log-weight': () => openWeight(today()),
    start: () => openStartSheet(today()),
    food: () => openFood(today()),
    water: () => addWater(today(), 500),
    'water-500': () => addWater(today(), 500),
    steps: () => openSteps(today()),
    whey: () => {
      const f = store.get('foods', 'f-whey');
      store.batch([{ store: 'nutritionLogs', value: { date: today(), name: f.name, protein: f.protein, kcal: f.kcal, fruit: 0, veg: 0, foodId: f.id, at: new Date().toISOString() } },
        { store: 'foods', value: { ...f, uses: (f.uses || 0) + 1 } }]);
      app.toast('Whey added · 25.5 g protein', { icon: 'check' });
    },
  },
};
