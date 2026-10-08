// Flat projects (DR-07): a project is an outcome and the tasks that get you there. Tasks carry a
// projectId and never nest further, so a project is never more than one level deep.
import * as store from '../data/store.js';
import * as T from './tasks.js';
import { cmp } from './dates.js';

export const STATUS = { active: 'Active', paused: 'Paused', done: 'Done' };

export const projects = () => store.memo('projects-sorted', ['projects'], () => store.all('projects')
  .sort((a, b) => (a.status === 'done') - (b.status === 'done') || (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)));
export const project = (id) => store.get('projects', id);
export const active = () => projects().filter((p) => p.status === 'active');

/** A project's tasks: open ones by date (undated last), then the done ones. */
export function tasksOf(id) {
  return store.memo(`project-tasks:${id}`, ['tasks'], () => {
    const list = T.all().filter((t) => t.projectId === id);
    const open = list.filter((t) => !t.done).sort((a, b) => cmp(a.date || '9999', b.date || '9999') || (a.order ?? 0) - (b.order ?? 0));
    const done = list.filter((t) => t.done).sort((a, b) => cmp(b.doneAt || '', a.doneAt || ''));
    return { open, done };
  });
}

export function progress(id) {
  const { open, done } = tasksOf(id);
  const total = open.length + done.length;
  return { open: open.length, done: done.length, total, ratio: total ? done.length / total : null, next: open[0] || null };
}

export function create({ name, outcome = '', area = 'work', due = null }) {
  const n = (name || '').trim();
  if (!n) return null;
  const order = projects().reduce((m, p) => Math.max(m, p.order ?? 0), 0) + 1;
  return store.put('projects', { id: store.uid(), name: n, outcome: outcome.trim(), area, due, status: 'active', order });
}

/** Add a task to a project (dated or not). */
export function addTask(projectId, title, date = null) {
  const p = project(projectId);
  return T.add({ title, date, area: p?.area || 'work', projectId });
}

/** The records a delete touches: the project goes, its tasks stay (without the project). */
export function removalOps(id) {
  const tasks = T.all().filter((t) => t.projectId === id);
  const p = store.get('projects', id);
  return { before: [...(p ? [{ store: 'projects', value: p }] : []), ...tasks.map((t) => ({ store: 'tasks', value: t }))],
    ops: [{ store: 'projects', delete: id }, ...tasks.map((t) => ({ store: 'tasks', value: { ...t, projectId: null } }))] };
}
