import * as store from '../core/store.js';
import * as M from '../core/metrics.js';
import { today, fmtMD, fmtMDY, relativeDay, addDays, diffDays } from '../core/dates.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, segmented } from '../ui/components.js';
import { lineChart } from '../ui/charts.js';
import { num, signed, cmOut, cmIn, lengthUnit, weight as fw, kgOut, weightUnit } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { removeWithUndo } from './sheets.js';

export const FIELDS = [
  { id: 'waist', label: 'Waist' }, { id: 'chest', label: 'Chest' }, { id: 'arms', label: 'Arms' },
  { id: 'thighs', label: 'Thighs' }, { id: 'calves', label: 'Calves' }, { id: 'neck', label: 'Neck', optional: true },
];
const n = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? null : Number(v));

export function openMeasurement(existing = null) {
  const date = existing?.date || today();
  app.sheet({
    title: existing ? 'Edit measurements' : 'New measurements',
    render: () => html`<form class="form" data-submit="save">
      <p class="sheet-note">Same time of day, relaxed, tape snug but not tight. Measure at the widest point (navel line for the waist).</p>
      <label class="field"><span class="field-label">Date</span><input class="input" type="date" name="date" value="${date}" max="${today()}"></label>
      <div class="grid-2">${FIELDS.map((f) => html`<label class="field"><span class="field-label">${f.label}${f.optional ? html` <small>optional</small>` : ''}</span>
        <span class="input-unit"><input name="${f.id}" type="number" inputmode="decimal" step="0.1" min="0" value="${existing?.[f.id] != null ? num(cmOut(existing[f.id]), 1).replace(/,/g, '') : ''}"><span>${lengthUnit()}</span></span></label>`)}</div>
      <label class="field"><span class="field-label">Note</span><input class="input" name="note" value="${existing?.note || ''}" placeholder="Optional"></label>
      <div class="btn-row">
        ${existing ? html`<button type="button" class="btn btn--ghost" data-action="del">Delete</button>` : ''}
        <button type="submit" class="btn btn--primary">Save</button>
      </div>
    </form>`,
    actions: {
      save: ({ form, sheet }) => {
        const rec = { ...(existing || {}), date: form.date && form.date <= today() ? form.date : date, note: form.note || '' };
        let any = false;
        for (const f of FIELDS) { const v = cmIn(n(form[f.id])); rec[f.id] = v != null ? Math.round(v * 10) / 10 : null; if (v) any = true; }
        if (!any) { app.toast('Add at least one measurement.'); return; }
        store.put('measurements', rec);
        hap.success();
        app.closeSheet(sheet);
      },
      del: ({ sheet }) => { removeWithUndo('measurements', existing.id, 'Measurements deleted'); app.closeSheet(sheet); },
    },
  });
}

function bodyFatSheet() {
  const c = M.bodyComposition();
  app.sheet({
    title: 'Body-fat estimate',
    render: () => html`<form class="form" data-submit="save">
      <p class="sheet-note">Every method has an error of several percent. Use one method consistently and watch the direction, not the decimal.</p>
      ${c.navy ? html`<p class="note-card">Your tape estimate (US Navy formula, waist + neck + height) is about <strong>${num(c.navy, 1)}%</strong>.</p>` : ''}
      <div class="grid-2">
        <label class="field"><span class="field-label">Estimate</span><span class="input-unit"><input name="pct" type="number" inputmode="decimal" step="0.5" min="3" max="60" value="${c.navy ? num(c.navy, 1) : ''}" required><span>%</span></span></label>
        <label class="field"><span class="field-label">Date</span><input class="input" type="date" name="date" value="${today()}" max="${today()}"></label>
      </div>
      <label class="field"><span class="field-label">Method</span><select class="input" name="method">
        ${['Visual estimate', 'Tape estimate (US Navy formula)', 'Smart scale', 'Calipers', 'DEXA scan'].map((m) => html`<option ${raw(c.navy && m.startsWith('Tape') ? 'selected' : '')}>${m}</option>`)}</select></label>
      <button type="submit" class="btn btn--primary btn--block">Save estimate</button>
    </form>`,
    actions: {
      save: ({ form, sheet }) => {
        const pct = n(form.pct);
        if (!pct || pct < 3 || pct > 60) { app.toast('Enter a percentage between 3 and 60.'); return; }
        store.put('bodyFatEstimates', { date: form.date || today(), percent: pct, method: form.method });
        hap.tap();
        app.closeSheet(sheet);
      },
    },
  });
}

export default {
  id: 'measurements',
  title: 'Measurements',
  render({ ui }) {
    const all = store.all('measurements').sort((a, b) => (a.date < b.date ? -1 : 1));
    const field = ui.field || 'waist';
    const latest = (f) => [...all].reverse().find((m) => m[f] != null);
    const first = (f) => all.find((m) => m[f] != null);
    const prevOf = (f) => { const l = latest(f); return l ? [...all].reverse().find((m) => m[f] != null && m.date < l.date) : null; };
    const pts = all.filter((m) => m[field] != null);
    const c = M.bodyComposition();
    const bfs = store.all('bodyFatEstimates').sort((a, b) => (a.date < b.date ? 1 : -1));
    const last = all[all.length - 1];
    const due = last ? Math.max(0, 14 - diffDays(today(), last.date)) : 0;
    return html`
      ${pageHead({ title: 'Measurements', back: { to: 'body', label: 'Body' },
        actions: html`<button type="button" class="btn btn--primary btn--sm" data-action="add">${icon('plus', { size: 16 })} Measure</button>` })}
      <p class="lead">${last ? (due ? `Next in ${due} day${due === 1 ? '' : 's'}. Every two weeks is enough.` : 'Due now. Every two weeks is enough.') : 'Every two weeks: waist, chest, arms, thighs, calves.'}</p>
      ${!all.length ? empty({ ic: 'ruler', title: 'No measurements yet', body: 'Waist is the most useful number while losing fat. Calves show your priority work paying off.', cta: 'Take measurements', action: 'add' }) : html`
        <div class="measure-grid">${FIELDS.map((f) => {
          const l = latest(f.id), fst = first(f.id), p = prevOf(f.id);
          return html`<button type="button" class="${cx('measure-cell', field === f.id && 'is-on')}" data-action="field" data-f="${f.id}" aria-pressed="${field === f.id}">
            <span class="stat-label">${f.label}</span>
            <span class="measure-val tnum">${l ? num(cmOut(l[f.id]), 1) : '—'}<small> ${l ? lengthUnit() : ''}</small></span>
            <span class="measure-delta">${l && p ? html`${signed(cmOut(l[f.id] - p[f.id]), 1)} last` : ''}${l && fst && fst.id !== l.id ? html` · ${signed(cmOut(l[f.id] - fst[f.id]), 1)} total` : ''}</span>
          </button>`;
        })}</div>
        <div class="card block">
          <p class="section-label">${FIELDS.find((f) => f.id === field).label} trend</p>
          ${lineChart({ labels: pts.map((m) => fmtMD(m.date)), series: [{ values: pts.map((m) => cmOut(m[field])), color: field === 'calves' ? 'var(--c-body)' : 'var(--c-posture)', area: true, marks: true, label: FIELDS.find((f) => f.id === field).label }], fmt: (v) => `${num(v, 1)} ${lengthUnit()}`, empty: 'Two measurements make a trend.' })}
        </div>`}

      <section class="block"><div class="block-head"><h2 class="block-title">Body composition</h2><button type="button" class="link-btn" data-action="bf">Add estimate</button></div>
        <div class="card">
          <div class="comp-grid">
            <div><p class="stat-label">Body fat</p><p class="comp-val tnum">~${num(c.bodyFat, 1)}%</p></div>
            <div><p class="stat-label">Lean mass</p><p class="comp-val tnum">~${num(kgOut(c.leanMass), 1)}<small> ${weightUnit()}</small></p></div>
            <div><p class="stat-label">Fat mass</p><p class="comp-val tnum">~${num(kgOut(c.fatMass), 1)}<small> ${weightUnit()}</small></p></div>
          </div>
          <p class="card-lead">Goal: about ${c.goalBodyFat}% body fat — roughly ${fw(c.goalWeight)} if lean mass stays the same.</p>
          <p class="fine-print">${c.source}. These are estimates with real error, not medical measurements. Strength, waist and the mirror tell the story alongside them.</p>
        </div>
        ${bfs.length ? html`<ul class="list block-tight">${bfs.slice(0, 6).map((b) => html`<li class="row"><span class="row-main"><span class="row-title tnum">${num(b.percent, 1)}%</span><span class="row-sub">${fmtMDY(b.date)} · ${b.method}</span></span>
          <button type="button" class="icon-btn icon-btn--sm" data-action="del-bf" data-id="${b.id}" aria-label="Delete estimate">${icon('x', { size: 16 })}</button></li>`)}</ul>` : ''}
      </section>

      ${all.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">History</h2></div>
        <ul class="list">${[...all].reverse().map((m) => html`<li><button type="button" class="row" data-action="edit" data-id="${m.id}">
          <span class="row-main"><span class="row-title">${fmtMDY(m.date)}</span><span class="row-sub tnum">${FIELDS.filter((f) => m[f.id] != null).map((f) => `${f.label} ${num(cmOut(m[f.id]), 1)}`).join(' · ')}</span></span>
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></button></li>`)}</ul></section>` : ''}`;
  },
  actions: {
    add: () => openMeasurement(),
    edit: ({ data }) => openMeasurement(store.get('measurements', data.id)),
    field: ({ data, ui }) => { ui.field = data.f; hap.tap(); app.refresh(); },
    bf: () => bodyFatSheet(),
    'del-bf': ({ data }) => removeWithUndo('bodyFatEstimates', data.id, 'Estimate deleted'),
  },
};
