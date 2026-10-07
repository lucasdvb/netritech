import * as store from '../data/store.js';
import * as G from '../domain/goals.js';
import { CATEGORIES, catColor, catLabel } from '../domain/taxonomy.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, ring } from '../ui/components.js';
import { app } from '../ui/app-api.js';

export function goalSheet(existing = null) {
  app.sheet({
    title: existing ? 'Edit goal' : 'New goal',
    render: () => html`<form class="form" data-submit="save">
      <label class="field"><span class="field-label">Name</span><input class="input" name="name" value="${existing?.name || ''}" required maxlength="60"></label>
      <label class="field"><span class="field-label">Description</span><textarea class="input" name="description" rows="2">${existing?.description || ''}</textarea></label>
      <div class="grid-2">
        <label class="field"><span class="field-label">Area</span><select class="input" name="category">${CATEGORIES.map((c) => html`<option value="${c.id}" ${raw(existing?.category === c.id ? 'selected' : '')}>${c.label}</option>`)}</select></label>
        <label class="field"><span class="field-label">Measured by</span><select class="input" name="type">
          <option value="consistency" ${raw(existing?.type === 'consistency' ? 'selected' : '')}>Habit consistency</option>
          <option value="milestones" ${raw(existing?.type === 'milestones' ? 'selected' : '')}>Milestones</option>
          <option value="numeric" ${raw(existing?.type === 'numeric' ? 'selected' : '')}>A number</option></select></label>
        <label class="field"><span class="field-label">Start value <small>numbers only</small></span><input class="input" name="start" type="number" step="any" value="${existing?.start ?? ''}"></label>
        <label class="field"><span class="field-label">Target value</span><input class="input" name="target" type="number" step="any" value="${existing?.target ?? ''}"></label>
        <label class="field"><span class="field-label">Unit</span><input class="input" name="unit" value="${existing?.unit || ''}" placeholder="%, kg, books…"></label>
        <label class="field"><span class="field-label">Deadline <small>optional</small></span><input class="input" type="date" name="deadline" value="${existing?.deadline || ''}"></label>
      </div>
      <button type="submit" class="btn btn--primary btn--block">Save</button>
    </form>`,
    actions: {
      save: ({ form, sheet }) => {
        if (!form.name?.trim()) { app.toast('Give the goal a name.'); return; }
        const num = (v) => (v === '' ? null : Number(v));
        const g = store.put('goals', { status: 'active', habitIds: [], milestones: [], order: 99, metric: null, ...(existing || {}),
          name: form.name.trim(), description: form.description, category: form.category, type: form.type,
          start: num(form.start), target: num(form.target), unit: form.unit, deadline: form.deadline || null });
        app.closeSheet(sheet);
        if (!existing) app.go(`more/goals/${g.id}`);
      },
    },
  });
}

export default {
  id: 'goals',
  title: 'Goals',
  render() {
    const all = G.goals();
    const active = all.filter((g) => g.status === 'active');
    const other = all.filter((g) => g.status !== 'active');
    const card = (g) => {
      const p = G.progress(g);
      return html`<li><a class="goal-card" href="#/more/goals/${g.id}" data-action="nav" data-to="more/goals/${g.id}" style="--ic:${catColor(g.category)}">
        <span class="goal-ring">${ring(p.ratio || 0, { size: 46, stroke: 4.5, color: 'var(--ic)' })}<span class="goal-ic">${icon(CATEGORIES.find((c) => c.id === g.category)?.icon || 'target', { size: 16 })}</span></span>
        <span class="row-main"><span class="row-title">${g.name}</span><span class="row-sub">${p.label || catLabel(g.category)}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;
    };
    return html`
      ${pageHead({ title: 'Goals', back: { to: 'more', label: 'More' }, actions: html`<button type="button" class="icon-btn icon-btn--filled" data-action="new" aria-label="New goal">${icon('plus', { size: 20 })}</button>` })}
      <p class="lead">Numbers where they’re real, milestones where they’re not, consistency for the habits that carry each goal.</p>
      ${active.length ? html`<ul class="goal-list">${active.map(card)}</ul>` : empty({ ic: 'target', title: 'No active goals', cta: 'Add a goal', action: 'new' })}
      ${other.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Paused or done</h2></div><ul class="goal-list">${other.map(card)}</ul></section>` : ''}`;
  },
  actions: { new: () => goalSheet() },
};
