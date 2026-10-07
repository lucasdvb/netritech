import * as store from '../core/store.js';
import * as H from '../core/habits.js';
import { PRIORITIES, CATEGORIES, SECTIONS, habitColor } from '../core/taxonomy.js';
import { today } from '../core/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, segmented, dots, empty } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { attachSwipe } from '../ui/swipe.js';

const GROUPINGS = [{ id: 'priority', label: 'Priority' }, { id: 'area', label: 'Area' }, { id: 'time', label: 'Time of day' }];

function groups(by, list) {
  if (by === 'area') return CATEGORIES.map((c) => ({ id: c.id, title: c.label, items: list.filter((h) => h.category === c.id) }));
  if (by === 'time') return SECTIONS.map((s) => ({ id: s.id, title: s.label, items: list.filter((h) => h.section === s.id) }));
  return PRIORITIES.map((p) => ({ id: p.id, title: p.label, hint: p.hint, items: list.filter((h) => h.priority === p.id) }));
}

function habitRow(h) {
  const c = H.consistency(h, today(), H.isFlexible(h) ? 28 : 7);
  const flexible = H.isFlexible(h);
  const sub = [H.scheduleLabel(h), h.affectsScore && h.priority !== 'optional' ? 'In daily score' : '', h.mvd ? 'Minimum day' : ''].filter(Boolean).join(' · ');
  const right = flexible
    ? html`<span class="hl-week tnum">${H.periodLabel(h, today()).replace(' this week', '').replace(' this month', '')}</span>`
    : dots(H.dots(h, today(), 7), { size: 'sm' });
  return html`<li class="swipe" data-key="${h.id}" data-swipe>
    <div class="swipe-actions"><button type="button" class="swipe-btn" data-action="archive" data-id="${h.id}">${icon('archive', { size: 18 })}<span>Archive</span></button></div>
    <a class="row swipe-content" href="#/habits/${h.id}" data-action="nav" data-to="habits/${h.id}">
      <span class="row-ic" style="--ic:${habitColor(h)}">${icon(h.icon, { size: 18 })}</span>
      <span class="row-main"><span class="row-title">${h.name}</span><span class="row-sub">${sub}</span></span>
      <span class="row-right hl-right">${right}${c.ratio != null && !flexible ? html`<span class="hl-pct tnum">${Math.round(c.ratio * 100)}%</span>` : ''}</span>
      <span class="row-chev">${icon('chevron-right', { size: 18 })}</span>
    </a>
  </li>`;
}

export default {
  id: 'habits',
  title: 'Habits',
  render({ ui }) {
    const by = ui.by || 'priority';
    const all = H.habits();
    const active = all.filter((h) => !h.archived);
    const archived = all.filter((h) => h.archived);
    const core = active.filter((h) => h.priority === 'core').length;
    return html`
      ${pageHead({ title: 'Habits', sub: `${active.length} active · ${core} in the foundation`,
        actions: html`<button type="button" class="icon-btn" data-action="open-search" aria-label="Search">${icon('search', { size: 20 })}</button>
          <button type="button" class="icon-btn icon-btn--filled" data-action="new" aria-label="New habit">${icon('plus', { size: 20 })}</button>` })}
      ${segmented(GROUPINGS, by, { action: 'by', name: 'Group habits by' })}
      ${!active.length ? empty({ ic: 'list-checks', title: 'No habits yet', body: 'Start with one small thing you want to do most days.', cta: 'Create a habit', action: 'new' }) : ''}
      ${groups(by, active).filter((g) => g.items.length).map((g) => html`<section class="block" data-key="g-${g.id}">
        <div class="block-head"><h2 class="block-title">${g.title}</h2><span class="block-meta">${g.items.length}</span></div>
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
  mount(el) { attachSwipe(el); },
  actions: {
    by: ({ data, ui }) => { ui.by = data.value; hap.tap(); app.refresh(); },
    new: () => app.go('habits/new'),
    archive: ({ data }) => {
      const h = H.habit(data.id);
      store.update('habits', h.id, { archived: true });
      hap.tap();
      app.toast(`${h.name} archived`, { action: { label: 'Undo', fn: () => store.update('habits', h.id, { archived: false }) } });
    },
    restore: ({ data }) => { store.update('habits', data.id, { archived: false }); hap.tap(); },
  },
};
