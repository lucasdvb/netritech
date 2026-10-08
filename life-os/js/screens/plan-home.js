// Plan: what you're building. Tomorrow first, then habits, goals, tasks, training and the playbook.
import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import * as G from '../domain/goals.js';
import * as T from '../domain/tasks.js';
import * as F from '../domain/fitness.js';
import { catColor, CATEGORIES } from '../domain/taxonomy.js';
import { today, addDays, fmtLong, startOfWeek, range, fmtDayShort } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, ring } from '../ui/components.js';

const head = (title, to, label) => html`<div class="block-head"><h2 class="block-title">${title}</h2>
  ${to ? html`<a class="link-btn" href="#/${to}" data-action="nav" data-to="${to}">${label}</a>` : ''}</div>`;

function tomorrow() {
  const tm = addDays(today(), 1);
  const top = T.priorities(tm).map((t) => ({ text: t.title }));
  const tasks = T.onDay(tm).filter((t) => !t.done);
  const tpl = F.plannedTemplate(tm);
  return html`<section class="plan-tomorrow" data-key="tomorrow" aria-label="Tomorrow">
    <p class="section-label">Tomorrow · ${fmtLong(tm)}</p>
    ${top.length ? html`<ol class="plan-top">${top.map((p, i) => html`<li><span class="tnum">${i + 1}</span>${p.text}</li>`)}</ol>`
      : html`<p class="card-lead">No priorities yet. The evening shutdown sets tomorrow’s first one.</p>`}
    <p class="plan-tomorrow-meta">${icon('activity', { size: 15 })} ${tpl ? tpl.name : 'Recovery · walk or mobility'}${tasks.length ? html` · ${icon('list-todo', { size: 15 })} ${tasks.length} task${tasks.length === 1 ? '' : 's'}` : ''}</p>
  </section>`;
}

function habitsCard() {
  const three = H.focusHabits();
  const n = (s) => H.inState(s).length;
  return html`<section class="block" data-key="habits">
    ${head('Habits', 'plan/habits', 'All habits')}
    <ul class="list">
      ${three.map((h) => {
        const r = H.runs(h);
        return html`<li><a class="row" href="#/plan/habits/${h.id}" data-action="nav" data-to="plan/habits/${h.id}">
          <span class="row-ic" style="--ic:${catColor(h.category)}">${icon(h.icon, { size: 18 })}</span>
          <span class="row-main"><span class="row-title" data-morph="habit-${h.id}">${h.name}</span><span class="row-sub">One of your three · ${r.current ? `${r.current}-${r.unit} run` : H.scheduleLabel(h)}</span></span>
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;
      })}
      <li><a class="row" href="#/plan/habits/sort" data-action="nav" data-to="plan/habits/sort">
        <span class="row-ic">${icon('target', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">${three.length ? 'Change your three' : 'Choose your three'}</span>
          <span class="row-sub tnum">${n('autopilot')} on autopilot · ${n('queue')} later${n('paused') ? ` · ${n('paused')} paused` : ''}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
    </ul>
  </section>`;
}

function goalsCard() {
  const active = G.goals().filter((g) => g.status === 'active').slice(0, 4);
  return html`<section class="block" data-key="goals">
    ${head('Goals', 'plan/goals', 'All goals')}
    ${active.length ? html`<ul class="list">${active.map((g) => {
      const p = G.progress(g);
      return html`<li><a class="row" href="#/plan/goals/${g.id}" data-action="nav" data-to="plan/goals/${g.id}">
        <span class="goal-ring" style="--ic:${catColor(g.category)}">${ring(p.ratio || 0, { size: 38, stroke: 4, color: 'var(--accent)' })}<span class="goal-ic">${icon(CATEGORIES.find((c) => c.id === g.category)?.icon || 'target', { size: 14 })}</span></span>
        <span class="row-main"><span class="row-title" data-morph="goal-${g.id}">${g.name}</span><span class="row-sub">${p.label || ''}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;
    })}</ul>` : html`<p class="card-lead">No active goals. A goal is a direction your habits serve.</p>`}
  </section>`;
}

function tasksAndTraining() {
  const open = T.open();
  const overdue = T.overdue();
  const week = range(startOfWeek(today()), addDays(startOfWeek(today()), 6));
  const sessions = week.map((d) => ({ d, tpl: F.plannedTemplate(d), done: F.workoutsOn(d).length > 0 }));
  return html`<section class="block" data-key="more">
    <ul class="list">
      <li><a class="row" href="#/plan/tasks" data-action="nav" data-to="plan/tasks">
        <span class="row-ic">${icon('list-todo', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Tasks</span><span class="row-sub tnum">${open.length} open${overdue.length ? ` · ${overdue.length} overdue` : ''}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
      <li><a class="row" href="#/plan/training" data-action="nav" data-to="plan/training">
        <span class="row-ic">${icon('dumbbell', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Training</span>
          <span class="row-sub plan-week-strip" aria-label="This week’s sessions">${sessions.map((s) => html`<span class="${cx('pws', s.done && 'is-done', s.d === today() && 'is-today', !s.tpl && 'is-rest')}" title="${fmtDayShort(s.d)}: ${s.tpl?.name || 'Rest'}">${fmtDayShort(s.d).slice(0, 1)}</span>`)}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
      <li><a class="row" href="#/plan/playbook" data-action="nav" data-to="plan/playbook">
        <span class="row-ic">${icon('scroll-text', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Playbook</span><span class="row-sub">Your day, week, routines, food and rules</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
    </ul>
  </section>`;
}

export default {
  id: 'plan',
  title: 'Plan',
  render() {
    return html`
      ${pageHead({ title: 'Plan', sub: 'What you’re building.',
        actions: html`<button type="button" class="icon-btn" data-action="open-search" aria-label="Search" aria-keyshortcuts="/">${icon('search', { size: 20 })}</button>` })}
      ${tomorrow()}
      ${habitsCard()}
      ${goalsCard()}
      ${tasksAndTraining()}`;
  },
};
