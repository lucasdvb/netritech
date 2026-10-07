import * as store from '../data/store.js';
import * as M from '../domain/metrics.js';
import { today, lastNDays, fmtMD, relativeDay, addDays, fmtMDY } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, segmented, empty } from '../ui/components.js';
import { lineChart } from '../ui/charts.js';
import { num, weight as fw, signed, kgOut, weightUnit } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import { attachSwipe } from '../ui/swipe.js';
import { openWeight, removeWithUndo } from './sheets.js';

const RANGES = [{ id: '30', label: '30 days' }, { id: '60', label: '60 days' }, { id: '90', label: '90 days' }];

function dailyNote(s) {
  const entries = store.all('weightEntries').sort((a, b) => (a.date < b.date ? 1 : -1));
  if (entries.length < 2) return '';
  const [a, b] = entries;
  const diff = a.kg - b.kg;
  if (Math.abs(diff) < 0.3) return '';
  return html`<div class="note-card">
    <p><span class="tag">Data</span> ${relativeDay(a.date)}: ${signed(kgOut(diff), 1)} ${weightUnit()} vs ${relativeDay(b.date).toLowerCase()}.</p>
    <p><span class="tag tag--soft">Note</span> Day-to-day swings of this size are usually water, salt and food volume. The 7-day average${s.weekChange != null ? ` moved ${signed(kgOut(s.weekChange), 1)} ${weightUnit()} this week` : ' is the number to watch'}.</p>
  </div>`;
}

export default {
  id: 'weight',
  title: 'Weight',
  render({ ui }) {
    const range = Number(ui.range || 30);
    const s = M.weightSummary();
    const c = M.bodyComposition();
    const entries = store.all('weightEntries').sort((a, b) => (a.date < b.date ? 1 : -1));
    const days = lastNDays(today(), range);
    const t = M.targets();
    let trajectory = null;
    if (s.trend && s.trend.perWeek < -0.05 && s.avg7 && c.goalWeight && s.avg7 > c.goalWeight) {
      trajectory = Math.round((s.avg7 - c.goalWeight) / -s.trend.perWeek);
    }
    const rate = s.trend ? -s.trend.perWeek : null;
    const rateNote = rate == null ? 'Needs about 5 weigh-ins' : rate > (t.lossMaxKg ?? 0.8) ? 'Faster than the 0.4–0.8 kg target' : rate >= (t.lossMinKg ?? 0.4) ? 'Inside the 0.4–0.8 kg target' : rate > 0.05 ? 'Slower than target' : 'Roughly flat';
    return html`
      ${pageHead({ title: 'Weight', back: { to: 'progress/body', label: 'Body' },
        actions: html`<button type="button" class="btn btn--primary btn--sm" data-action="add">${icon('plus', { size: 16 })} Log</button>` })}
      ${!entries.length ? empty({ ic: 'scale', title: 'Give us a starting point.', body: 'Weigh in tomorrow morning after the bathroom. Daily readings feed a 7-day average, which is the number decisions are based on.', cta: 'Log first weigh-in', action: 'add' }) : html`
      <div class="metric-top">
        <p class="section-label">7-day average</p>
        <p class="big-num tnum">${num(kgOut(s.avg7), 1)}<span>${weightUnit()}</span></p>
        <p class="hero-meta">${s.latest ? `Latest ${fw(s.latest.kg)} · ${relativeDay(s.latest.date).toLowerCase()}` : ''}</p>
      </div>
      ${segmented(RANGES, String(range), { action: 'range', name: 'Range' })}
      <div class="card chart-card">${lineChart({
        labels: days.map((d) => fmtMD(d)),
        series: [
          { values: days.map((d) => (M.weight(d) != null ? kgOut(M.weight(d)) : null)), color: 'var(--text-3)', line: false, marks: true, noDot: true, label: 'Weigh-in' },
          { values: days.map((d) => { const a = M.weightAvg(d, 7); return a != null && store.all('weightEntries').some((e) => e.date <= d) ? kgOut(a) : null; }), color: 'var(--chart-1)', fill: 'var(--accent)', area: true, width: 2.4, label: '7-day avg' },
        ],
        fmt: (v) => `${num(v, 1)} ${weightUnit()}`, height: 210,
        goal: c.goalWeight ? { value: kgOut(c.goalWeight), label: `goal ~${num(kgOut(c.goalWeight), 1)}` } : null,
      })}</div>
      ${dailyNote(s)}
      <div class="stat-row stat-row--4 block">
        <div class="stat"><p class="stat-label">This week</p><p class="stat-value tnum">${signed(kgOut(s.weekChange), 1)}</p><p class="stat-sub">${weightUnit()} · 7-day avg</p></div>
        <div class="stat"><p class="stat-label">This month</p><p class="stat-value tnum">${signed(kgOut(s.monthChange), 1)}</p><p class="stat-sub">${weightUnit()} · vs 30 days ago</p></div>
        <div class="stat"><p class="stat-label">Since start</p><p class="stat-value tnum">${signed(kgOut(s.sinceStart), 1)}</p><p class="stat-sub">from ${fw(s.startKg)}</p></div>
        <div class="stat"><p class="stat-label">14-day avg</p><p class="stat-value tnum">${num(kgOut(s.avg14), 1)}</p><p class="stat-sub">${weightUnit()}</p></div>
      </div>
      <div class="card block">
        <p class="section-label">30-day trend</p>
        <p class="trend-line"><strong class="tnum">${rate == null ? '—' : `${rate >= 0 ? '−' : '+'}${num(Math.abs(rate), 2)} ${weightUnit() === 'kg' ? 'kg' : 'lb'}/week`}</strong> <span class="muted">${rateNote}</span></p>
        ${trajectory != null ? html`<p class="trend-line"><strong class="tnum">~${trajectory} weeks</strong> <span class="muted">to about ${fw(c.goalWeight)} at this pace · estimate, assumes muscle is kept</span></p>` : ''}
        <p class="fine-print">Target pace 0.4–0.8 kg a week. Faster isn’t better if strength, sleep or energy suffer.</p>
      </div>`}
      ${entries.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Entries</h2><span class="block-meta">${entries.length}</span></div>
        <ul class="list">${entries.slice(0, ui.all ? 400 : 20).map((e, i) => {
          const prev = entries[i + 1];
          return html`<li class="swipe" data-key="${e.id}" data-swipe>
            <div class="swipe-actions"><button type="button" class="swipe-btn swipe-btn--danger" data-action="del" data-id="${e.id}">${icon('trash-2', { size: 18 })}<span>Delete</span></button></div>
            <button type="button" class="row swipe-content" data-action="edit" data-id="${e.id}">
              <span class="row-main"><span class="row-title tnum">${fw(e.kg)}</span><span class="row-sub">${fmtMDY(e.date)}${e.note ? ` · ${e.note}` : ''}</span></span>
              <span class="row-right tnum muted">${prev ? signed(kgOut(e.kg - prev.kg), 1) : ''}</span>
            </button></li>`;
        })}</ul>
        ${entries.length > 20 && !ui.all ? html`<button type="button" class="link-btn center-link" data-action="all">Show all ${entries.length}</button>` : ''}
      </section>` : ''}`;
  },
  mount(el) { attachSwipe(el); },
  actions: {
    add: () => openWeight(today()),
    edit: ({ data }) => openWeight(data.id),
    del: ({ data }) => removeWithUndo('weightEntries', data.id, 'Weight entry deleted'),
    range: ({ data, ui }) => { ui.range = data.value; app.refresh(); },
    all: ({ ui }) => { ui.all = true; app.refresh(); },
  },
};
