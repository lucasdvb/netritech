// Plan: what you're building. Tomorrow and this week first, then five groups, one list each:
// Habits & routines, Goals, Training, Tasks & notes, and Life.
import * as store from '../data/store.js';
import * as H from '../domain/habits-more.js';
import * as G from '../domain/goals.js';
import * as T from '../domain/tasks.js';
import * as F from '../domain/fitness.js';
import * as P from '../domain/projects.js';
import * as B from '../domain/books.js';
import * as C from '../domain/commitments.js';
import * as Rw from '../domain/rewards.js';
import * as L from '../domain/lists.js';
import * as N from '../domain/notes.js';
import * as $ from '../domain/money.js';
import * as E from '../domain/events.js';
import * as Q from '../domain/quests.js';
import { projectionLine } from './goals.js';
import { projectRow } from './projects.js';
import { bookRow } from './books.js';
import { catColor, CATEGORIES } from '../domain/taxonomy.js';
import { today, addDays, fmtLong, startOfWeek, range, fmtDayShort, fmtDay } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, ring } from '../ui/components.js';
import { themeWord } from '../domain/year-review.js';
import { app } from '../ui/app-api.js';
import { later } from '../ui/later.js';
import * as hap from '../ui/haptics.js';

const head = (title, to, label) => html`<div class="block-head"><h2 class="block-title">${title}</h2>
  ${to ? html`<a class="link-btn" href="#/${to}" data-action="nav" data-to="${to}">${label}</a>` : ''}</div>`;

/** Tomorrow: its three, written here, plus the session and how many tasks are waiting. */
function tomorrow() {
  const tm = addDays(today(), 1);
  const slots = T.slots(tm);
  const tasks = T.onDay(tm).filter((t) => !t.done && !t.rank);
  const tpl = F.plannedTemplate(tm);
  return html`<section class="plan-tomorrow" data-key="tomorrow" aria-label="Tomorrow">
    <p class="section-label">Tomorrow · ${fmtLong(tm)}</p>
    <ol class="plan-three">${slots.map((t, i) => html`<li data-key="tm-${i}"><span class="tnum">${i + 1}</span>
      <input class="plan-three-input" value="${t?.title || ''}" data-change="tm-three" data-i="${i}" placeholder="${['The one that matters most', 'Second', 'Third'][i]}" aria-label="Tomorrow’s priority ${i + 1}" enterkeyhint="next" maxlength="140"></li>`)}</ol>
    <p class="plan-tomorrow-meta">${icon('activity', { size: 15 })} ${tpl ? tpl.name : 'Recovery · walk or mobility'}${tasks.length ? html` · ${icon('list-todo', { size: 15 })} ${tasks.length} more task${tasks.length === 1 ? '' : 's'}` : ''}</p>
  </section>`;
}

/** The next seven days: your three for the week (from the weekly review), then each day. */
function thisWeek() {
  const ws = startOfWeek(today());
  const wr = store.get('weeklyReviews', ws) || {};
  const plan = (wr.plan || []).filter(Boolean);
  const days = range(today(), addDays(today(), 6));
  return html`<section class="block" data-key="week">
    ${head('This week', 'reflect/review/week', 'Weekly review')}
    ${plan.length ? html`<div class="card week-plan"><p class="section-label">Your three for the week</p><ol class="plan-top">${plan.map((p, i) => html`<li><span class="tnum">${i + 1}</span>${p}</li>`)}</ol>
      ${wr.obstacle ? html`<p class="week-if">${icon('shield-check', { size: 15 })} <span>If ${wr.obstacle.replace(/^if\s+/i, '')}${wr.ifThen ? html`: <b>${wr.ifThen}</b>` : ''}</span></p>` : ''}</div>`
      : html`<p class="muted small">The weekly review sets three things for the week; they show here.</p>`}
    <ul class="list week-days">${days.map((d) => {
      const pri = T.priorities(d)[0];
      const n = T.onDay(d).filter((t) => !t.done).length;
      const tpl = F.plannedTemplate(d);
      return html`<li class="row" data-key="wd-${d}"><span class="week-dow">${d === today() ? 'Today' : fmtDayShort(d)}</span>
        <span class="row-main"><span class="row-title">${pri ? pri.title : n ? `${n} task${n === 1 ? '' : 's'}` : 'Open'}</span>
          <span class="row-sub">${tpl ? tpl.name : 'Rest or recovery'}${pri && n > 1 ? ` · ${n - 1} more` : ''}</span></span></li>`;
    })}</ul>
  </section>`;
}

// One row, the way every group lists its things.
const linkRow = (to, ic, title, sub, { iconHtml = null, morph = '' } = {}) => html`<li><a class="row" href="#/${to}" data-action="nav" data-to="${to}">
  ${iconHtml || html`<span class="row-ic">${icon(ic, { size: 18 })}</span>`}
  <span class="row-main"><span class="row-title"${morph ? html` data-morph="${morph}"` : ''}>${title}</span>${sub ? html`<span class="row-sub">${sub}</span>` : ''}</span>
  <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;
const group = (key, title, rows, extra = '') => html`<section class="block plan-group" data-key="${key}">
  <div class="block-head"><h2 class="block-title">${title}</h2></div>${extra}<ul class="list">${rows}</ul></section>`;

/** Habits & routines: your three, the rest at a glance, and your day and week (Your plan). */
function habitsGroup() {
  const three = H.focusHabits();
  const n = (s) => H.inState(s).length;
  return group('habits', 'Habits & routines', html`
    ${three.map((h) => {
      const r = H.runs(h);
      return linkRow(`plan/habits/${h.id}`, null, h.name, `In focus · ${r.current ? `${r.current}-${r.unit} run` : H.scheduleLabel(h)}`,
        { iconHtml: html`<span class="row-ic" style="--ic:${catColor(h.category)}">${icon(h.icon, { size: 18 })}</span>`, morph: `habit-${h.id}` });
    })}
    ${linkRow('plan/habits/sort', 'target', three.length ? `Change your ${H.focusWord()}` : `Choose your ${H.focusWord()}`,
      `${n('autopilot')} on autopilot · ${n('queue')} later${n('paused') ? ` · ${n('paused')} paused` : ''}`)}
    ${linkRow('plan/habits', 'list-checks', 'All habits', `${H.activeHabits().length} active`)}
    ${linkRow('plan/playbook', 'scroll-text', 'Your plan', 'Your day, your week, routines, food and rules')}`);
}

const questDay = (q) => { const d = T.task(q.taskId)?.date; return !d ? '' : d === today() ? ' for today' : d === addDays(today(), 1) ? ' for tomorrow' : ` for ${fmtDay(d)}`; };

/** Goals: where each is heading, the projects that serve them, your pledges and rewards. */
function goalsGroup() {
  const active = G.goals().filter((g) => g.status === 'active').slice(0, 4);
  const projects = P.active().slice(0, 3);
  const pledges = C.active();
  const rewards = Rw.rewards().filter((r) => r.status !== 'claimed');
  const unlocked = rewards.filter((r) => r.status === 'unlocked').length;
  const q = Q.offer();
  const quest = q.status === 'declined' ? '' : html`<div class="quest" data-key="quest">
      <p class="section-label">Side quest · this week, if you like</p>
      <p class="quest-title">${q.title}</p>
      ${q.status === 'offered' ? html`<div class="row-actions"><button type="button" class="btn btn--soft btn--sm" data-action="quest-yes">Add to my tasks</button><button type="button" class="link-btn" data-action="quest-no">Not this week</button></div>`
        : html`<p class="row-sub">${Q.isDone(q) ? html`${icon('check', { size: 14 })} Done` : `In your tasks${questDay(q)}`}</p>`}
    </div>`;
  return group('goals', 'Goals', html`
    ${active.map((g) => {
      const p = G.progress(g);
      return linkRow(`plan/goals/${g.id}`, null, g.name, projectionLine(g) || p.label || '', {
        iconHtml: html`<span class="goal-ring" style="--ic:${catColor(g.category)}">${ring(p.ratio || 0, { size: 38, stroke: 4, color: 'var(--accent)' })}<span class="goal-ic">${icon(CATEGORIES.find((c) => c.id === g.category)?.icon || 'target', { size: 16 })}</span></span>`,
        morph: `goal-${g.id}` });
    })}
    ${linkRow('plan/goals', 'target', active.length ? 'All goals' : 'Set a goal', active.length ? '' : 'A direction your habits serve. Three questions.')}
    ${projects.map(projectRow)}
    ${linkRow('plan/projects', 'layers', 'Projects', projects.length ? '' : 'Anything with more than one task: a launch, a move')}
    ${linkRow('plan/commitments', 'hand', 'Commitments', pledges.length ? pledges.map((c) => `${c.title} · day ${C.state(c).day}`).join(' · ') : 'A pledge for as long as you choose, with a stake')}
    ${linkRow('plan/rewards', 'trophy', 'Rewards', unlocked ? `${unlocked} unlocked` : rewards.length ? `${rewards.length} you’re working towards` : 'Something you’ll earn by what really happens')}`, quest);
}

/** Training: this week's sessions at a glance. */
function trainingGroup() {
  const week = range(startOfWeek(today()), addDays(startOfWeek(today()), 6));
  const sessions = week.map((d) => ({ d, tpl: F.plannedTemplate(d), done: F.workoutsOn(d).length > 0 }));
  return group('training', 'Training', html`<li><a class="row" href="#/plan/training" data-action="nav" data-to="plan/training">
      <span class="row-ic">${icon('dumbbell', { size: 18 })}</span>
      <span class="row-main"><span class="row-title">Workouts and your week</span>
        <span class="row-sub plan-week-strip" aria-label="This week’s sessions">${sessions.map((s) => html`<span class="${cx('pws', s.done && 'is-done', s.d === today() && 'is-today', !s.tpl && 'is-rest')}" title="${fmtDay(s.d)}: ${s.tpl ? s.tpl.name : 'Rest'}">${fmtDayShort(s.d).slice(0, 1)}</span>`)}</span></span>
      <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
    ${linkRow('plan/training/exercises', 'activity', 'Exercises', 'Each one’s history, your photos and notes')}
    ${linkRow('plan/training/programmes', 'trophy', 'Programmes', 'Proven plans, optional. Or keep your own')}`);
}

/** Tasks & notes: one-off jobs, checklists and the brain dump. */
function tasksGroup() {
  const open = T.open();
  const overdue = T.overdue();
  const lists = L.lists();
  const notes = N.notes();
  return group('tasks', 'Tasks & notes', html`
    ${linkRow('plan/tasks', 'list-todo', 'Tasks', `${open.length} open${overdue.length ? ` · ${overdue.length} overdue` : ''}`)}
    ${linkRow('plan/lists', 'list-checks', 'Lists', lists.length ? lists.slice(0, 3).map((l) => l.name).join(' · ') : 'Groceries, packing, ideas')}
    ${linkRow('plan/notes', 'brain', 'Brain dump', notes.length ? `${notes.length} note${notes.length === 1 ? '' : 's'}${notes[0] ? ` · ${N.firstLine(notes[0].text)}` : ''}` : 'Get it out of your head, sort it later')}`);
}

/** Life: money, dates, reading and your moodboard. */
function lifeGroup() {
  const spent = $.summary();
  const soon = E.sorted().find((x) => x.in >= 0);
  const reading = B.byStatus('reading').slice(0, 2);
  const mb = (store.settings().moodboard || []).length;
  return group('life', 'Life', html`
    ${linkRow('plan/money', 'wallet', 'Money', spent.count ? `${$.fmt(spent.total, { cents: 0 })} this month${spent.budget ? ` · ${spent.left >= 0 ? `${$.fmt(spent.left, { cents: 0 })} left` : `${$.fmt(-spent.left, { cents: 0 })} over`}` : ''}` : 'What you spend, against a budget')}
    ${linkRow('plan/dates', 'calendar-heart', 'Dates', soon ? `${E.label(soon)} · ${E.inWords(soon.in).toLowerCase()}` : 'Birthdays, anniversaries, countdowns')}
    ${reading.map(bookRow)}
    ${linkRow('plan/books', 'book-open', 'Books', reading.length ? '' : 'Add the book you’re reading; “read 20 pages” moves it along')}
    ${linkRow('plan/moodboard', 'image', 'Moodboard', mb ? `${mb} image${mb === 1 ? '' : 's'} on Today` : 'Up to five images that remind you why')}`);
}

export default {
  id: 'plan',
  title: 'Plan',
  render() {
    const theme = themeWord(today());
    return html`
      ${pageHead({ title: 'Plan', sub: 'What you’re building.',
        actions: html`<button type="button" class="icon-btn" data-action="open-search" aria-label="Search" aria-keyshortcuts="/">${icon('search', { size: 20 })}</button>` })}
      ${theme ? html`<a class="theme-word" href="#/reflect/review/year/${theme.year - 1}" data-action="nav" data-to="reflect/review/year/${theme.year - 1}" data-key="theme"><span class="tnum">${theme.year}</span><b>${theme.word}</b></a>` : ''}
      ${tomorrow()}
      ${thisWeek()}
      ${habitsGroup()}
      ${later('goals', goalsGroup, 360)}
      ${later('training', trainingGroup, 120)}
      ${later('tasks', tasksGroup, 200)}
      ${later('life', lifeGroup, 260)}`;
  },
  actions: {
    'quest-yes': () => { const undo = Q.accept(Q.offer()); hap.success(); app.toast('Added to your tasks', { icon: 'check', action: { label: 'Undo', fn: undo } }); },
    'quest-no': () => { const undo = Q.decline(Q.offer()); hap.tap(); app.toast('Let it go for this week', { action: { label: 'Undo', fn: undo } }); },
  },
  inputs: {
    'tm-three': ({ el, value }) => {
      const undo = T.setPriorityUndoable(addDays(today(), 1), Number(el.dataset.i), value);
      if (undo) app.toast('Priority cleared', { action: { label: 'Undo', fn: undo } });
    },
  },
};
