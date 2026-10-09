import * as store from '../data/store.js';
import * as M from '../domain/metrics.js';
import { today, lastNDays, fmtMD, fmtDayShort, relativeDay, addDays, fmtTime } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, infoBtn, tipText } from '../ui/components.js';
import { barChart } from '../ui/charts.js';
import { num, litres } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { attachSwipe } from '../ui/swipe.js';
import { nutritionRings } from './body.js';
import { openFood, openWater, addServing, removeWithUndo, repeatYesterday } from './sheets.js';
import { canRepeat } from '../domain/meals.js';

function adaptiveCard() {
  const a = M.adaptiveCalories();
  const t = M.targets();
  if (!a.ready) {
    return html`<div class="card">
      <p class="section-label">Adaptive calories${infoBtn('adaptive', 'adaptive calories')}</p>
      ${tipText('adaptive', 'Once both are there, Life OS estimates your maintenance from intake vs weight change.')}
      <p class="card-lead">Your target starts at ${num(t.kcalMin)}–${num(t.kcalMax)} kcal and adjusts from your real trend, not a formula.</p>
      <div class="progress-steps">
        <p><span class="tnum">${Math.min(a.loggedDays, a.needDays)}/${a.needDays}</span> days with calories logged</p>
        <p><span class="tnum">${Math.min(a.weighIns, a.needWeighIns)}/${a.needWeighIns}</span> weigh-ins in the last 3 weeks</p>
      </div>
    </div>`;
  }
  const status = {
    'on-track': ['Inside the target pace', 'good'],
    stalled: ['Weight trend is flat', 'warn'],
    fast: ['Losing faster than planned', 'warn'],
  }[a.status];
  return html`<div class="card">
    <div class="card-head"><p class="section-label">Adaptive calories · estimate</p><span class="badge badge--${status[1]}">${status[0]}</span></div>
    <div class="comp-grid">
      <div><p class="stat-label">Average intake</p><p class="comp-val tnum">${num(a.avgKcal)}</p></div>
      <div><p class="stat-label">Est. maintenance</p><p class="comp-val tnum">~${num(Math.round(a.maintenance / 50) * 50)}</p></div>
      <div><p class="stat-label">Trend</p><p class="comp-val tnum">${a.lossPerWeek >= 0 ? '−' : '+'}${num(Math.abs(a.lossPerWeek), 2)}<small> kg/wk</small></p></div>
    </div>
    ${a.status === 'stalled' ? html`<p class="card-lead">Before changing anything, check portions and how completely meals are logged. If that’s accurate, a small step makes sense.</p>` : ''}
    ${a.status === 'fast' ? html`<p class="card-lead">Fast loss can cost muscle and recovery. Eating a little more is reasonable, especially if training feels harder.</p>` : ''}
    <div class="adapt-foot">
      <p>Suggested target <strong class="tnum">${num(a.suggested)} kcal</strong> <span class="muted">· current ${num(t.kcal)}</span></p>
      ${Math.abs(a.suggested - t.kcal) >= 50 ? html`<button type="button" class="btn btn--soft btn--sm" data-action="use-target" data-v="${a.suggested}">Use ${num(a.suggested)}</button>` : ''}
    </div>
    <p class="fine-print">Based on ${a.loggedDays} logged days and ${a.weighIns} weigh-ins. Rough by design (±200 kcal). Never below ${num(t.kcalFloor)} kcal.</p>
  </div>`;
}

export default {
  id: 'nutrition',
  title: 'Nutrition',
  render({ params, ui }) {
    const date = params.date && params.date <= today() ? params.date : today();
    const n = M.nutrition(date);
    const t = M.targets();
    const days = lastNDays(date, 14);
    const prot = days.map((d) => M.nutrition(d).protein || null);
    const kcal = days.map((d) => M.nutrition(d).kcal || null);
    const prot7 = M.averageOver(date, 7, (d) => M.nutrition(d).protein);
    const kcal7 = M.averageOver(date, 7, (d) => M.nutrition(d).kcal);
    const logs = [...n.logs].sort((a, b) => (a.at < b.at ? 1 : -1));
    const waters = store.onDate('waterLogs', date);
    return html`
      ${pageHead({ title: 'Nutrition', back: { to: 'progress/body', label: 'Body' } })}
      <div class="date-switch">
        <button type="button" class="icon-btn icon-btn--sm" data-action="day" data-delta="-1" aria-label="Previous day">${icon('chevron-left', { size: 18 })}</button>
        <p class="date-switch-label">${relativeDay(date)}</p>
        <button type="button" class="icon-btn icon-btn--sm" data-action="day" data-delta="1" aria-label="Next day" ${date >= today() ? 'disabled' : ''}>${icon('chevron-right', { size: 18 })}</button>
      </div>
      <div class="card">${nutritionRings(date)}
        <div class="quick-row">
          <button type="button" class="btn btn--primary btn--sm" data-action="food">${icon('plus', { size: 16 })} Log food</button>
          ${canRepeat(date) ? html`<button type="button" class="btn btn--soft btn--sm" data-action="same">${icon('repeat', { size: 15 })} Same as yesterday</button>` : ''}
          <button type="button" class="btn btn--soft btn--sm" data-action="whey">Whey</button>
          <button type="button" class="btn btn--soft btn--sm" data-action="serving" data-kind="fruit">+ Fruit</button>
          <button type="button" class="btn btn--soft btn--sm" data-action="serving" data-kind="veg">+ Veg</button>
          <button type="button" class="btn btn--soft btn--sm" data-action="water">${icon('droplet', { size: 15 })} Water</button>
        </div>
      </div>

      <section class="block">
        <div class="block-head"><h2 class="block-title">${date === today() ? 'Today' : relativeDay(date)}</h2><span class="block-meta tnum">${num(n.protein, n.protein % 1 ? 1 : 0)} g · ${num(n.kcal)} kcal</span></div>
        ${logs.length ? html`<ul class="list">${logs.map((l) => html`<li class="swipe" data-key="${l.id}" data-swipe>
          <div class="swipe-actions"><button type="button" class="swipe-btn swipe-btn--danger" data-action="del" data-id="${l.id}">${icon('trash-2', { size: 18 })}<span>Delete</span></button></div>
          <div class="row swipe-content"><span class="row-main"><span class="row-title">${l.name || 'Food'}</span><span class="row-sub">${l.at ? fmtTime(new Date(l.at)) : ''}${l.approx ? ' · approx.' : ''}</span></span>
            <span class="row-right tnum">${num(l.protein, l.protein % 1 ? 1 : 0)} g<br><span class="muted">${num(l.kcal)} kcal</span></span>
            <button type="button" class="icon-btn icon-btn--sm" data-action="del" data-id="${l.id}" aria-label="Delete ${l.name}">${icon('x', { size: 16 })}</button></div></li>`)}</ul>`
          : empty({ ic: 'utensils', title: 'Log your first meal of the day', body: 'Quick foods are one tap. Protein first; calories when you can.', cta: 'Log food', action: 'food' })}
        ${waters.length ? html`<p class="quiet-line">${icon('droplet', { size: 15 })} ${litres(M.waterMl(date))} water from ${waters.length} entr${waters.length === 1 ? 'y' : 'ies'} <button type="button" class="link-btn" data-action="water">Edit</button></p>` : ''}
      </section>

      <section class="block">
        <div class="block-head"><h2 class="block-title">Protein · 14 days</h2><span class="block-meta tnum">${prot7.n ? `${num(prot7.value)} g avg` : ''}</span></div>
        <div class="card">${barChart({ labels: days.map((d) => fmtDayShort(d).slice(0, 1)), tipLabels: days.map(fmtMD), values: prot, color: 'var(--c-health)', fmt: (v) => `${num(v)} g`, goal: { value: t.proteinG, label: `${t.proteinG} g` } })}</div>
      </section>
      <section class="block">
        <div class="block-head"><h2 class="block-title">Calories · 14 days</h2><span class="block-meta tnum">${kcal7.n ? `${num(kcal7.value)} avg` : ''}</span></div>
        <div class="card">${barChart({ labels: days.map((d) => fmtDayShort(d).slice(0, 1)), tipLabels: days.map(fmtMD), values: kcal, color: 'var(--c-body)', fmt: (v) => `${num(v)} kcal`, goal: { value: t.kcal, label: num(t.kcal) }, goalIsMin: false })}</div>
      </section>
      <section class="block">${adaptiveCard()}</section>

      <section class="block">
        <div class="block-head"><h2 class="block-title">Targets</h2><button type="button" class="link-btn" data-action="nav" data-to="you/settings">Edit</button></div>
        <dl class="facts">
          <div><dt>Protein</dt><dd>${t.proteinG} g · breakfast 30–40 · lunch 35–45 · snack 20–30 · dinner 40–50</dd></div>
          <div><dt>Calories</dt><dd>${num(t.kcal)} kcal (start ${num(t.kcalMin)}–${num(t.kcalMax)})</dd></div>
          <div><dt>Fat</dt><dd>${t.fatMinG}–${t.fatMaxG} g · portion awareness</dd></div>
          <div><dt>Carbs</dt><dd>The rest · rice, potatoes, oats, bread, lentils, fruit</dd></div>
          <div><dt>Water</dt><dd>${litres(t.waterHitMl)}–${litres(t.waterMl)}</dd></div>
          <div><dt>Fruit · veg</dt><dd>1–2 fruit · 2+ veg</dd></div>
        </dl>
        <p class="fine-print">No seafood, no pork. Quick-food values are approximate — edit them to match what you actually eat.</p>
      </section>`;
  },
  mount(el) { attachSwipe(el); },
  actions: {
    day: ({ data, params }) => {
      const cur = params.date || today();
      const next = addDays(cur, Number(data.delta));
      if (next > today()) return;
      app.replace(next === today() ? 'body/nutrition' : `body/nutrition/${next}`);
    },
    food: ({ params }) => openFood(params.date || today()),
    water: ({ params }) => openWater(params.date || today()),
    serving: ({ data, params }) => addServing(params.date || today(), data.kind),
    same: ({ params }) => repeatYesterday(params.date || today()),
    whey: ({ params }) => {
      const f = store.get('foods', 'f-whey');
      store.batch([{ store: 'nutritionLogs', value: { date: params.date || today(), name: f.name, protein: f.protein, kcal: f.kcal, fruit: 0, veg: 0, foodId: f.id, at: new Date().toISOString() } },
        { store: 'foods', value: { ...f, uses: (f.uses || 0) + 1 } }]);
      hap.tap();
    },
    del: ({ data }) => removeWithUndo('nutritionLogs', data.id, 'Entry deleted'),
    'use-target': ({ data }) => {
      const s = store.settings();
      store.setSettings({ targets: { ...s.targets, kcal: Number(data.v) } });
      app.toast(`Calorie target set to ${num(Number(data.v))} kcal`, { icon: 'check' });
    },
  },
};
