import * as store from '../data/store.js';
import * as G from '../domain/goals.js';
import * as M from '../domain/metrics.js';
import { catLabel, catColor, habitColor } from '../domain/taxonomy.js';
import { fmtMDY, today, diffDays, fmtMD } from '../domain/dates.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, check, ring } from '../ui/components.js';
import { lineChart } from '../ui/charts.js';
import { pct, num } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { goalSheet } from './goals.js';

export default {
  id: 'goal',
  title: ({ params }) => store.get('goals', params.id)?.name || 'Goal',
  render({ params }) {
    const g = store.get('goals', params.id);
    if (!g) return html`${pageHead({ title: 'Goal', back: { to: 'more/goals', label: 'Goals' } })}${empty({ ic: 'target', title: 'This goal was deleted.' })}`;
    const p = G.progress(g);
    const hc = G.habitConsistency(g);
    const habits = store.all('habits').filter((h) => !h.archived);
    const est = g.metric === 'bodyFat' ? store.all('bodyFatEstimates').sort((a, b) => (a.date < b.date ? -1 : 1)) : [];
    const calves = g.id === 'g-calves' ? store.all('measurements').filter((m) => m.calves).sort((a, b) => (a.date < b.date ? -1 : 1)) : [];
    return html`
      ${pageHead({ title: g.name, eyebrow: catLabel(g.category), back: { to: 'more/goals', label: 'Goals' }, actions: html`<button type="button" class="btn btn--soft btn--sm" data-action="edit">Edit</button>` })}
      ${g.description ? html`<p class="lead">${g.description}</p>` : ''}
      <div class="card goal-hero" style="--ic:${catColor(g.category)}">
        <span class="goal-ring">${ring(p.ratio || 0, { size: 84, stroke: 7, color: 'var(--ic)' })}<span class="goal-pct tnum">${p.ratio != null ? pct(p.ratio) : '—'}</span></span>
        <div><p class="card-title">${p.label || ''}</p>
          <p class="muted small">${p.kind === 'numeric' ? (g.metric === 'bodyFat' ? 'From your latest body-fat estimate. An estimate, not a lab value.' : 'Measured value.') : p.kind === 'milestones' ? 'Progress counts finished milestones, not effort.' : 'Average 30-day consistency of the habits below.'}</p>
          ${g.deadline ? html`<p class="muted small">Deadline ${fmtMDY(g.deadline)} · ${Math.max(0, diffDays(g.deadline, today()))} days left</p>` : ''}</div>
      </div>
      ${g.type === 'numeric' && g.metric == null ? html`<form class="inline-form block-tight" data-submit="set-current"><span class="input-unit"><input name="v" type="number" step="any" value="${g.current ?? ''}" placeholder="Current value" aria-label="Current value"><span>${g.unit}</span></span><button class="btn btn--soft" type="submit">Update</button></form>` : ''}
      ${est.length >= 2 ? html`<div class="card chart-card block-tight">${lineChart({ labels: est.map((e) => fmtMD(e.date)), series: [{ values: est.map((e) => e.percent), color: catColor(g.category), area: true, marks: true, label: 'Body fat' }], fmt: (v) => `${num(v, 1)}%` })}</div>` : ''}
      ${calves.length >= 2 ? html`<div class="card chart-card block-tight"><p class="section-label">Calf measurement</p>${lineChart({ labels: calves.map((e) => fmtMD(e.date)), series: [{ values: calves.map((e) => e.calves), color: catColor(g.category), area: true, marks: true, label: 'Calves' }], fmt: (v) => `${num(v, 1)} cm` })}</div>` : ''}

      <section class="block"><div class="block-head"><h2 class="block-title">Milestones</h2><button type="button" class="link-btn" data-action="add-m">${icon('plus', { size: 15 })} Add</button></div>
        ${(g.milestones || []).length ? html`<ul class="list">${g.milestones.map((m) => html`<li class="row milestone ${m.done ? 'is-done' : ''}" data-key="${m.id}">
          ${check(m.done, { action: 'toggle-m', data: { id: m.id }, label: m.title, color: catColor(g.category) })}
          <span class="row-main"><span class="row-title">${m.title}</span>${m.doneAt ? html`<span class="row-sub">Done ${fmtMDY(m.doneAt.slice(0, 10))}</span>` : ''}</span>
          <button type="button" class="icon-btn icon-btn--sm" data-action="del-m" data-id="${m.id}" aria-label="Remove milestone">${icon('x', { size: 15 })}</button></li>`)}</ul>`
          : html`<p class="muted small">Milestones make qualitative goals concrete. Add one when it helps.</p>`}
      </section>

      <section class="block"><div class="block-head"><h2 class="block-title">Habits that carry it</h2><button type="button" class="link-btn" data-action="link">Choose</button></div>
        ${hc.rows.length ? html`<ul class="list">${hc.rows.map((r) => html`<li><a class="row" href="#/habits/${r.habit.id}" data-action="nav" data-to="habits/${r.habit.id}">
          <span class="row-ic" style="--ic:${habitColor(r.habit)}">${icon(r.habit.icon, { size: 16 })}</span>
          <span class="row-main"><span class="row-title">${r.habit.name}</span><span class="row-sub">30 days</span></span><span class="row-right tnum">${pct(r.c.ratio)}</span></a></li>`)}</ul>`
          : html`<p class="muted small">Link habits and their consistency shows here.</p>`}
      </section>
      <div class="danger-zone">
        <button type="button" class="btn btn--soft" data-action="status" data-v="${g.status === 'active' ? 'done' : 'active'}">${g.status === 'active' ? 'Mark achieved' : 'Make active'}</button>
        ${g.status === 'active' ? html`<button type="button" class="btn btn--soft" data-action="status" data-v="paused">Pause</button>` : ''}
        <button type="button" class="btn btn--ghost btn--danger-text" data-action="delete">Delete</button>
      </div>`;
  },
  actions: {
    edit: ({ params }) => goalSheet(store.get('goals', params.id)),
    'set-current': ({ form, params }) => { store.update('goals', params.id, { current: form.v === '' ? null : Number(form.v) }); hap.tap(); },
    'toggle-m': ({ data, params }) => {
      const g = store.get('goals', params.id);
      const ms = g.milestones.map((m) => (m.id === data.id ? { ...m, done: !m.done, doneAt: !m.done ? new Date().toISOString() : null } : m));
      store.update('goals', g.id, { milestones: ms });
      const now = ms.find((m) => m.id === data.id).done;
      if (now) { hap.success(); if (ms.every((m) => m.done)) app.toast('Every milestone done. Well earned.', { icon: 'sparkles' }); } else hap.tap();
    },
    'del-m': ({ data, params }) => { const g = store.get('goals', params.id); store.update('goals', g.id, { milestones: g.milestones.filter((m) => m.id !== data.id) }); },
    'add-m': ({ params }) => app.sheet({
      title: 'New milestone',
      render: () => html`<form class="form" data-submit="save"><input class="input" name="t" placeholder="e.g. 20 strict push-ups" autofocus required><button class="btn btn--primary btn--block" type="submit">Add</button></form>`,
      actions: { save: ({ form, sheet }) => {
        if (!form.t?.trim()) return;
        const g = store.get('goals', params.id);
        store.update('goals', g.id, { milestones: [...(g.milestones || []), { id: store.uid(), title: form.t.trim(), done: false, doneAt: null }] });
        app.closeSheet(sheet);
      } },
    }),
    link: ({ params }) => app.sheet({
      title: 'Habits for this goal',
      render: () => {
        const g = store.get('goals', params.id);
        return html`<ul class="checklist">${store.all('habits').filter((h) => !h.archived).sort((a, b) => a.order - b.order).map((h) => html`<li data-key="${h.id}">
          ${check((g.habitIds || []).includes(h.id), { action: 'pick', data: { id: h.id }, label: h.name, color: habitColor(h) })}<span>${h.name}</span></li>`)}</ul>`;
      },
      actions: { pick: ({ data }) => {
        const g = store.get('goals', params.id);
        const set = new Set(g.habitIds || []);
        set.has(data.id) ? set.delete(data.id) : set.add(data.id);
        store.update('goals', g.id, { habitIds: [...set] });
      } },
    }),
    status: ({ data, params }) => { store.update('goals', params.id, { status: data.v }); hap.tap(); },
    delete: async ({ params }) => {
      const ok = await app.confirm({ title: 'Delete this goal?', body: 'Linked habits stay as they are.', confirm: 'Delete', tone: 'danger' });
      if (!ok) return;
      store.remove('goals', params.id);
      app.replace('more/goals');
    },
  },
};
