// Shared task pieces: the row used on Today and the Tasks screen. The add/edit sheet
// (task-sheet.js) loads on first use.
import * as T from '../domain/tasks.js';
import { catColor, catLabel } from '../domain/taxonomy.js';
import { today } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { check } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';


export function taskRow(t, { showDue = true, ref = today() } = {}) {
  const late = !t.done && t.date && t.date < ref;
  const meta = [showDue || late ? T.dueLabel(t.date, ref) : '', t.repeat ? T.repeatLabel(t.repeat) : '', catLabel(t.area)].filter(Boolean);
  return html`<li class="${cx('trow', t.done && 'is-done', late && 'is-late')}" data-key="t-${t.id}" style="--ic:${catColor(t.area)}">
    ${check(t.done, { action: 'task-check', data: { id: t.id }, label: `${t.title}${t.done ? ', done' : ''}`, color: catColor(t.area), cls: 'check--sm' })}
    <button type="button" class="trow-main" data-action="task-open" data-id="${t.id}">
      <span class="trow-title">${t.title}</span>
      <span class="trow-meta">${t.repeat ? icon('repeat', { size: 12 }) : ''}${meta.join(' · ')}</span>
    </button>
  </li>`;
}

/** Shared actions for any screen that shows task rows. */
export const taskActions = {
  'task-check': ({ data }) => {
    const t = T.task(data.id);
    if (!t) return;
    const now = T.toggle(data.id);
    if (now) {
      hap.success();
      if (t.repeat) app.toast(`Done. Next one ${T.dueLabel(T.task(T.task(data.id)?.nextId)?.date).toLowerCase()}.`, { icon: 'repeat' });
    } else hap.tap();
  },
  'task-open': ({ data }) => openTask(data.id),
};

/** Add (no id) or edit a task. `defaults` pre-fills a new one: { date, area, title }. */
export const openTask = async (id = null, defaults = {}) => (await import('./task-sheet.js')).openTask(id, defaults);
