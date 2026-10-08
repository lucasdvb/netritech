import * as store from '../data/store.js';
import * as R from '../domain/routines.js';
import * as H from '../domain/habits.js';
import { CATEGORIES, SECTIONS, habitColor } from '../domain/taxonomy.js';
import { today, fmtMD } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, segmented, dots, empty, row } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { attachSwipe } from '../ui/swipe.js';

const GROUPINGS = [{ id: 'state', label: 'State' }, { id: 'area', label: 'Area' }, { id: 'time', label: 'Time of day' }];
const STATE_GROUPS = [
  { id: 'focus', title: 'Your three' },
  { id: 'autopilot', title: 'Autopilot' },
  { id: 'queue', title: 'Later' },
  { id: 'paused', title: 'Paused' },
];

function groups(by, list) {
  if (by === 'area') return CATEGORIES.map((c) => ({ id: c.id, title: c.label, items: list.filter((h) => h.category === c.id) }));
  if (by === 'time') return SECTIONS.map((s) => ({ id: s.id, title: s.label, items: list.filter((h) => h.section === s.id) }));
  return STATE_GROUPS.map((g) => ({ ...g, hint: H.STATES[g.id].hint, items: g.id === 'focus' ? H.focusHabits() : g.id === 'queue' ? H.queue() : list.filter((h) => H.stateOf(h) === g.id) }));
}

function habitRow(h) {
  const st = H.stateOf(h);
  const c = H.consistency(h, today(), H.isFlexible(h) ? 28 : 7);
  const flexible = H.isFlexible(h);
  const r = st === 'focus' ? H.runs(h) : null;
  const sub = [H.scheduleLabel(h),
    st === 'paused' && h.pausedUntil ? `back ${fmtMD(h.pausedUntil)}` : '',
    r?.current >= 2 ? `${r.current}-${r.unit} run` : r?.missesInRow === 1 ? 'don’t miss twice' : '',
    h.anchor || ''].filter(Boolean).join(' · ');
  const right = flexible
    ? html`<span class="hl-week tnum">${H.periodLabel(h, today()).replace(' this week', '').replace(' this month', '')}</span>`
    : dots(H.dots(h, today(), 7), { size: 'sm' });
  return html`<li class="swipe" data-key="${h.id}" data-swipe>
    <div class="swipe-actions"><button type="button" class="swipe-btn" data-action="archive" data-id="${h.id}">${icon('archive', { size: 18 })}<span>Archive</span></button></div>
    <a class="row swipe-content" href="#/plan/habits/${h.id}" data-action="nav" data-to="plan/habits/${h.id}">
      <span class="row-ic" style="--ic:${habitColor(h)}">${icon(h.icon, { size: 18 })}</span>
      <span class="row-main"><span class="row-title" data-morph="habit-${h.id}">${h.name}</span><span class="row-sub">${sub}</span></span>
      <span class="row-right hl-right">${st === 'queue' || st === 'paused' ? '' : right}${c.ratio != null && !flexible && st !== 'queue' && st !== 'paused' ? html`<span class="hl-pct tnum">${Math.round(c.ratio * 100)}%</span>` : ''}</span>
      <span class="row-chev">${icon('chevron-right', { size: 18 })}</span>
    </a>
  </li>`;
}

/** Routines: habits linked into a sequence, each opened from here to edit. */
function routinesSection() {
  const list = R.routines();
  return html`<section class="block" data-key="g-routines">
    <div class="block-head"><h2 class="block-title">Routines</h2><button type="button" class="link-btn" data-action="new-routine">${icon('plus', { size: 16 })} New routine</button></div>
    <p class="block-hint">Habits you do one after another, with a window of time. Today opens the one that’s due.</p>
    ${list.length ? html`<ul class="list">${list.map((r) => html`<li>${row({ ic: r.kind === 'evening' ? 'moon' : r.kind === 'morning' ? 'sunrise' : 'repeat', title: r.name,
      sub: `${(r.steps || []).length} step${(r.steps || []).length === 1 ? '' : 's'} · ${R.windowLabel(r)}`, action: 'edit-routine', data: { id: r.id }, key: `rt-${r.id}` })}</li>`)}</ul>`
      : html`<p class="card-lead">No routines yet.</p>`}
  </section>`;
}

export default {
  id: 'habits',
  title: 'Habits',
  render({ ui }) {
    const by = ui.by || 'state';
    const all = H.habits();
    const active = all.filter((h) => !h.archived);
    const archived = all.filter((h) => h.archived);
    const focus = H.focusHabits().length;
    return html`
      ${pageHead({ title: 'Habits', sub: `${focus} of ${H.FOCUS_LIMIT} in focus · ${active.length} active`,
        actions: html`<button type="button" class="icon-btn" data-action="open-search" aria-label="Search">${icon('search', { size: 20 })}</button>
          <button type="button" class="icon-btn icon-btn--filled" data-action="new" aria-label="New habit">${icon('plus', { size: 20 })}</button>` })}
      ${segmented(GROUPINGS, by, { action: 'by', name: 'Group habits by' })}
      ${!active.length ? empty({ ic: 'list-checks', title: 'No habits yet', body: 'Start with one small thing you want to do most days. Three questions and it’s on Today.', cta: 'Add a habit', action: 'new' }) : ''}
      ${by === 'state' && active.length ? html`<button type="button" class="card card--link sort-cta" data-action="nav" data-to="plan/habits/sort" data-key="sort-cta">
        <span class="sort-cta-text"><span class="card-title">${focus ? 'Change your three' : 'Choose your three'}</span>
          <span class="row-sub">Sort every habit into Focus, Autopilot or Later on one screen.</span></span>
        ${icon('chevron-right', { size: 18 })}</button>` : ''}
      ${by === 'state' ? routinesSection() : ''}
      ${groups(by, active).filter((g) => g.items.length).map((g) => html`<section class="block" data-key="g-${g.id}">
        <div class="block-head"><h2 class="block-title">${g.title}</h2><span class="block-meta tnum">${g.id === 'focus' ? `${g.items.length} of ${H.FOCUS_LIMIT}` : g.items.length}</span></div>
        ${g.hint ? html`<p class="block-hint">${g.hint}</p>` : ''}
        <ul class="list">${g.items.map(habitRow)}</ul>
      </section>`)}
      ${archived.length ? html`<details class="block disclosure archived" ${ui.showArchived ? 'open' : ''}>
        <summary>Archived · ${archived.length}</summary>
        <ul class="list">${archived.map((h) => html`<li data-key="a-${h.id}" class="row">
          <span class="row-ic" style="--ic:var(--text-3)">${icon(h.icon, { size: 18 })}</span>
          <span class="row-main"><span class="row-title">${h.name}</span><span class="row-sub">History kept</span></span>
          <button type="button" class="btn btn--soft btn--sm" data-action="restore" data-id="${h.id}">Restore</button></li>`)}</ul>
      </details>` : ''}
      <p class="foot-note">Swipe left on a habit to archive it. Archived habits keep their history.</p>`;
  },
  mount(el, ctx) {
    attachSwipe(el);
    if (ctx.query.new) {
      window.history.replaceState(window.history.state, '', location.hash.split('?')[0]);
      import('./habit-new.js').then((m) => m.openNewHabit());
    }
  },
  actions: {
    by: ({ data, ui }) => { ui.by = data.value; hap.tap(); app.refresh(); },
    'edit-routine': async ({ data }) => (await import('./routine-edit.js')).openRoutineEditor(data.id),
    'new-routine': async () => (await import('./routine-edit.js')).newRoutine(),
    new: async () => (await import('./habit-new.js')).openNewHabit(),
    archive: ({ data }) => {
      const h = H.habit(data.id);
      store.update('habits', h.id, { archived: true });
      hap.tap();
      app.toast(`${h.name} archived`, { action: { label: 'Undo', fn: () => store.update('habits', h.id, { archived: false }) } });
    },
    restore: ({ data }) => { store.update('habits', data.id, { archived: false }); hap.tap(); },
  },
};
