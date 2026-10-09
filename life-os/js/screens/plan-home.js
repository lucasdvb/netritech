// Plan: what you're building. Tomorrow first, then habits, goals, tasks, lists, training, money,
// dates and the playbook.
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

function projectsCard() {
  const list = P.active().slice(0, 4);
  return html`<section class="block" data-key="projects">
    ${head('Projects', 'plan/projects', 'All projects')}
    ${list.length ? html`<ul class="list">${list.map(projectRow)}</ul>` : html`<p class="card-lead">Anything with more than one task: a launch, a move. One level, no folders.</p>`}
  </section>`;
}

function booksCard() {
  const reading = B.byStatus('reading').slice(0, 2);
  return html`<section class="block" data-key="books">
    ${head('Reading', 'plan/books', 'All books')}
    ${reading.length ? html`<ul class="list">${reading.map(bookRow)}</ul>` : html`<p class="card-lead">Add the book you’re reading and “read 20 pages” moves it along.</p>`}
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
          <span class="row-main"><span class="row-title" data-morph="habit-${h.id}">${h.name}</span><span class="row-sub">In focus · ${r.current ? `${r.current}-${r.unit} run` : H.scheduleLabel(h)}</span></span>
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;
      })}
      <li><a class="row" href="#/plan/habits/sort" data-action="nav" data-to="plan/habits/sort">
        <span class="row-ic">${icon('target', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">${three.length ? `Change your ${H.focusWord()}` : `Choose your ${H.focusWord()}`}</span>
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
        <span class="row-main"><span class="row-title" data-morph="goal-${g.id}">${g.name}</span><span class="row-sub">${projectionLine(g) || p.label || ''}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;
    })}</ul>` : html`<p class="card-lead">No active goals. A goal is a direction your habits serve.</p>`}
  </section>`;
}

const questDay = (q) => { const d = T.task(q.taskId)?.date; return !d ? '' : d === today() ? ' for today' : d === addDays(today(), 1) ? ' for tomorrow' : ` for ${fmtDay(d)}`; };

/** Keep going (G7–G9): this week's side quest, your pledges, the rewards you've set, your moodboard. */
function keepGoing() {
  const q = Q.offer();
  const pledges = C.active();
  const rewards = Rw.rewards().filter((r) => r.status !== 'claimed');
  const unlocked = rewards.filter((r) => r.status === 'unlocked').length;
  const mb = (store.settings().moodboard || []).length;
  const quest = q.status === 'declined' ? '' : html`<div class="quest" data-key="quest">
      <p class="section-label">Side quest · this week, if you like</p>
      <p class="quest-title">${q.title}</p>
      ${q.status === 'offered' ? html`<div class="row-actions"><button type="button" class="btn btn--soft btn--sm" data-action="quest-yes">Add to my tasks</button><button type="button" class="link-btn" data-action="quest-no">Not this week</button></div>`
        : html`<p class="row-sub">${Q.isDone(q) ? html`${icon('check', { size: 14 })} Done` : `In your tasks${questDay(q)}`}</p>`}
    </div>`;
  return html`<section class="block" data-key="keep">
    ${head('Keep going')}
    ${quest}
    <ul class="list">
      <li><a class="row" href="#/plan/commitments" data-action="nav" data-to="plan/commitments">
        <span class="row-ic">${icon('hand', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Commitments</span><span class="row-sub">${pledges.length ? pledges.map((c) => `${c.title} · day ${C.state(c).day}`).join(' · ') : 'A pledge for as long as you choose, with your own stake'}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
      <li><a class="row" href="#/plan/rewards" data-action="nav" data-to="plan/rewards">
        <span class="row-ic">${icon('trophy', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Rewards</span><span class="row-sub">${unlocked ? `${unlocked} unlocked` : rewards.length ? `${rewards.length} you’re working towards` : 'Something you’ll enjoy, unlocked by something real'}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
      <li><a class="row" href="#/plan/moodboard" data-action="nav" data-to="plan/moodboard">
        <span class="row-ic">${icon('image', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Moodboard</span><span class="row-sub">${mb ? `${mb} image${mb === 1 ? '' : 's'} on Today` : 'Up to five images that remind you why'}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
    </ul>
  </section>`;
}

function tasksAndTraining() {
  const open = T.open();
  const overdue = T.overdue();
  const week = range(startOfWeek(today()), addDays(startOfWeek(today()), 6));
  const sessions = week.map((d) => ({ d, tpl: F.plannedTemplate(d), done: F.workoutsOn(d).length > 0 }));
  const lists = L.lists();
  const notes = N.notes();
  const spent = $.summary();
  const soon = E.sorted().find((x) => x.in >= 0);
  return html`<section class="block" data-key="more">
    <ul class="list">
      <li><a class="row" href="#/plan/tasks" data-action="nav" data-to="plan/tasks">
        <span class="row-ic">${icon('list-todo', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Tasks</span><span class="row-sub tnum">${open.length} open${overdue.length ? ` · ${overdue.length} overdue` : ''}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
      <li><a class="row" href="#/plan/lists" data-action="nav" data-to="plan/lists">
        <span class="row-ic">${icon('list-checks', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Lists</span><span class="row-sub">${lists.length ? lists.slice(0, 3).map((l) => l.name).join(' · ') : 'Groceries, packing, ideas'}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
      <li><a class="row" href="#/plan/notes" data-action="nav" data-to="plan/notes">
        <span class="row-ic">${icon('brain', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Brain dump</span><span class="row-sub tnum">${notes.length ? `${notes.length} note${notes.length === 1 ? '' : 's'}${notes[0] ? ` · ${N.firstLine(notes[0].text, 40)}` : ''}` : 'Ideas and thoughts, filed by category'}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
      <li><a class="row" href="#/plan/training" data-action="nav" data-to="plan/training">
        <span class="row-ic">${icon('dumbbell', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Training</span>
          <span class="row-sub plan-week-strip" aria-label="This week’s sessions">${sessions.map((s) => html`<span class="${cx('pws', s.done && 'is-done', s.d === today() && 'is-today', !s.tpl && 'is-rest')}" title="${fmtDayShort(s.d)}: ${s.tpl?.name || 'Rest'}">${fmtDayShort(s.d).slice(0, 1)}</span>`)}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
      <li><a class="row" href="#/plan/money" data-action="nav" data-to="plan/money">
        <span class="row-ic">${icon('wallet', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Money</span><span class="row-sub tnum">${spent.count ? `${$.fmt(spent.total, { cents: 0 })} this month${spent.budget ? ` · ${spent.left >= 0 ? `${$.fmt(spent.left, { cents: 0 })} left` : 'over budget'}` : ''}` : 'What you spend, against a budget if you like'}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
      <li><a class="row" href="#/plan/dates" data-action="nav" data-to="plan/dates">
        <span class="row-ic">${icon('calendar-heart', { size: 18 })}</span>
        <span class="row-main"><span class="row-title">Dates</span><span class="row-sub">${soon ? `${E.label(soon)} · ${E.inWords(soon.in).toLowerCase()}` : 'Birthdays, anniversaries, countdowns'}</span></span>
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
    const theme = themeWord(today());
    return html`
      ${pageHead({ title: 'Plan', sub: 'What you’re building.',
        actions: html`<button type="button" class="icon-btn" data-action="open-search" aria-label="Search" aria-keyshortcuts="/">${icon('search', { size: 20 })}</button>` })}
      ${theme ? html`<a class="theme-word" href="#/reflect/review/year/${theme.year - 1}" data-action="nav" data-to="reflect/review/year/${theme.year - 1}" data-key="theme"><span class="tnum">${theme.year}</span><b>${theme.word}</b></a>` : ''}
      ${tomorrow()}
      ${thisWeek()}
      ${habitsCard()}
      ${later('goals', goalsCard, 240)}
      ${later('projects', projectsCard, 160)}
      ${later('books', booksCard, 160)}
      ${later('keep', keepGoing, 280)}
      ${later('more', tasksAndTraining, 420)}`;
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
