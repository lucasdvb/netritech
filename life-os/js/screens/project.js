// A project: its outcome, how far along it is, and its tasks (add one in a line). Deleting the
// project keeps its tasks, with Undo.
import * as store from '../data/store.js';
import * as P from '../domain/projects.js';
import { catLabel } from '../domain/taxonomy.js';
import { fmtMDY, today, diffDays } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, ring } from '../ui/components.js';
import { pct } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { taskRow, taskActions } from './task-ui.js';
import { projectSheet } from './projects.js';

export default {
  id: 'project',
  title: ({ params }) => P.project(params.id)?.name || 'Project',
  render({ params, ui }) {
    const p = P.project(params.id);
    if (!p) return html`${pageHead({ title: 'Project', back: { to: 'plan/projects', label: 'Projects' } })}${empty({ ic: 'layers', title: 'This project was deleted.' })}`;
    const { open, done } = P.tasksOf(p.id);
    const pr = P.progress(p.id);
    return html`
      ${pageHead({ title: p.name, morph: `project-${p.id}`, eyebrow: `${catLabel(p.area)} · project`, back: { to: 'plan/projects', label: 'Projects' },
        actions: html`<button type="button" class="btn btn--soft btn--sm" data-action="edit">Edit</button>` })}
      <div class="card goal-hero">
        <span class="goal-ring">${ring(pr.ratio || 0, { size: 84, stroke: 7, color: 'var(--accent)' })}<span class="goal-pct tnum">${pr.ratio != null ? pct(pr.ratio) : '—'}</span></span>
        <div><p class="card-title">${p.outcome || 'Add the outcome: how you’ll know it’s done.'}</p>
          <p class="muted small">${pr.total ? `${pr.done} of ${pr.total} tasks done` : 'No tasks yet'}${p.due ? ` · by ${fmtMDY(p.due)} (${Math.max(0, diffDays(p.due, today()))} days)` : ''}</p></div>
      </div>
      <section class="block"><div class="block-head"><h2 class="block-title">Tasks</h2><span class="block-meta tnum">${open.length} open</span></div>
        <div class="card tasks-card">
          <ul class="tlist">${open.map((t) => taskRow(t))}</ul>
          <div class="task-add"><span class="task-add-ic" aria-hidden="true">${icon('plus', { size: 18 })}</span>
            <input class="task-add-input" data-change="p-add" placeholder="Add a task to this project" enterkeyhint="done" aria-label="Add a task to this project" maxlength="140"></div>
        </div>
        ${done.length ? html`<details class="disclosure block-tight" ${ui.showDone ? 'open' : ''}><summary>Done · ${done.length}</summary><ul class="tlist card">${done.map((t) => taskRow(t))}</ul></details>` : ''}
      </section>
      <div class="danger-zone">
        <button type="button" class="btn btn--soft" data-action="p-status" data-v="${p.status === 'done' ? 'active' : 'done'}">${p.status === 'done' ? 'Make active' : 'Mark done'}</button>
        ${p.status === 'active' ? html`<button type="button" class="btn btn--soft" data-action="p-status" data-v="paused">Pause</button>` : ''}
        <button type="button" class="btn btn--ghost btn--danger-text" data-action="p-delete">Delete</button>
      </div>`;
  },
  inputs: {
    'p-add': ({ el, value, params }) => {
      const t = value.trim();
      if (!t) return;
      P.addTask(params.id, t);
      el.value = '';
      hap.tap();
    },
  },
  actions: {
    ...taskActions,
    edit: ({ params }) => projectSheet(P.project(params.id)),
    'p-status': ({ data, params }) => {
      store.update('projects', params.id, { status: data.v });
      hap.tap();
      if (data.v === 'done') app.toast('Project done. Well finished.', { icon: 'check' });
    },
    'p-delete': ({ params }) => {
      const p = P.project(params.id);
      const { before, ops } = P.removalOps(params.id);
      app.replace('plan/projects');
      store.batch(ops);
      app.toast(`“${p.name}” deleted. Its tasks are still in your list.`, { action: { label: 'Undo', fn: () => store.batch(before) } });
    },
  },
};
