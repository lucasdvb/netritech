// Projects (DR-07): flat. Each is an outcome with its tasks; nothing nests deeper than that.
import * as store from '../data/store.js';
import * as P from '../domain/projects.js';
import { catColor, CATEGORIES } from '../domain/taxonomy.js';
import { today } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, ring } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

/** New or edit: name, the outcome (how you'll know it's done), area and an optional date. */
export function projectSheet(existing = null) {
  const ui = { name: existing?.name || '', outcome: existing?.outcome || '', area: existing?.area || 'work', due: existing?.due || '' };
  app.sheet({
    title: existing ? 'Edit project' : 'New project',
    ui,
    render: (s) => html`<div class="form">
      <label class="field"><span class="field-label">Project</span><input class="input" value="${s.ui.name}" data-input="pf" data-f="name" placeholder="e.g. Launch the website" maxlength="60" autofocus></label>
      <label class="field"><span class="field-label">Done when…</span><input class="input" value="${s.ui.outcome}" data-input="pf" data-f="outcome" placeholder="The outcome, in one line" maxlength="120"></label>
      <div class="field"><span class="field-label">Area</span><div class="chips">${CATEGORIES.map((c) => html`<button type="button" class="${cx('chip chip--area', s.ui.area === c.id && 'is-active')}" style="--ic:${catColor(c.id)}" aria-pressed="${s.ui.area === c.id}" data-action="pf-area" data-id="${c.id}"><i class="chip-dot" aria-hidden="true"></i>${c.label}</button>`)}</div></div>
      <label class="field"><span class="field-label">By <small>optional</small></span><input class="input" type="date" min="${today()}" value="${s.ui.due}" data-change="pf" data-f="due"></label>
      <button type="button" class="btn btn--primary btn--block" data-action="pf-save">${existing ? 'Save' : 'Create project'}</button>
    </div>`,
    inputs: { pf: ({ el, value, sheet }) => { sheet.ui[el.dataset.f] = value; } },
    actions: {
      'pf-area': ({ data, sheet }) => { sheet.ui.area = data.id; sheet.refresh(); },
      'pf-save': ({ sheet }) => {
        const u = sheet.ui;
        if (!u.name.trim()) { app.toast('Give the project a name.'); return; }
        if (existing) store.put('projects', { ...existing, name: u.name.trim(), outcome: u.outcome.trim(), area: u.area, due: u.due || null });
        const p = existing || P.create({ name: u.name, outcome: u.outcome, area: u.area, due: u.due || null });
        hap.success();
        app.closeSheet(sheet);
        if (!existing) app.go(`plan/projects/${p.id}`);
      },
    },
  });
}

export function projectRow(p) {
  const pr = P.progress(p.id);
  return html`<li data-key="p-${p.id}"><a class="row" href="#/plan/projects/${p.id}" data-action="nav" data-to="plan/projects/${p.id}">
    <span class="goal-ring" style="--ic:${catColor(p.area)}">${ring(pr.ratio || 0, { size: 38, stroke: 4, color: 'var(--accent)' })}<span class="goal-ic">${icon('layers', { size: 14 })}</span></span>
    <span class="row-main"><span class="row-title" data-morph="project-${p.id}">${p.name}</span>
      <span class="row-sub">${pr.total ? `${pr.done} of ${pr.total} done${pr.next ? ` · next: ${pr.next.title}` : ''}` : p.outcome || 'No tasks yet'}</span></span>
    <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;
}

export default {
  id: 'projects',
  title: 'Projects',
  render() {
    const all = P.projects();
    const active = all.filter((p) => p.status === 'active');
    const rest = all.filter((p) => p.status !== 'active');
    return html`
      ${pageHead({ title: 'Projects', back: { to: 'plan', label: 'Plan' }, actions: html`<button type="button" class="icon-btn icon-btn--filled" data-action="new" aria-label="New project">${icon('plus', { size: 20 })}</button>`, info: 'An outcome and the tasks that get you there. One level, no folders.' })}
      ${active.length ? html`<ul class="list">${active.map(projectRow)}</ul>` : empty({ ic: 'layers', title: 'No projects yet', body: 'A project is anything with more than one task: a launch, a move, a renovation.', cta: 'New project', action: 'new' })}
      ${rest.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Paused or done</h2></div><ul class="list">${rest.map(projectRow)}</ul></section>` : ''}`;
  },
  actions: { new: () => projectSheet() },
};
