// Area pages: one lens per area of life over the same habits and goals. Mind, Spirit,
// Relationships and Work keep their own logging on top; every area shares these blocks.
import * as H from '../domain/habits-more.js';
import * as G from '../domain/goals.js';
import { categoryConsistency, pct } from '../domain/scoring.js';
import { CATEGORIES, catLabel, catColor } from '../domain/taxonomy.js';
import { today } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty, dots, ring } from '../ui/components.js';

const BODY_LINKS = [
  ['progress/body/weight', 'scale', 'Weight'], ['progress/body/nutrition', 'utensils', 'Nutrition'], ['progress/body/sleep', 'bed', 'Sleep'],
  ['progress/body/measurements', 'ruler', 'Measurements'], ['progress/body/photos', 'camera', 'Photos'], ['plan/training', 'dumbbell', 'Training'],
];
const LINKS = { body: BODY_LINKS, health: BODY_LINKS.slice(0, 3), posture: [['progress/body/measurements', 'ruler', 'Measurements'], ['progress/body/photos', 'camera', 'Photos']] };

const link = (to, ic, title, sub = '') => html`<li><a class="row" href="#/${to}" data-action="nav" data-to="${to}">
  <span class="row-ic">${icon(ic, { size: 18 })}</span><span class="row-main"><span class="row-title">${title}</span>${sub ? html`<span class="row-sub">${sub}</span>` : ''}</span>
  <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;

/** The habits and goals in an area, for any area page. */
export function areaBlocks(id) {
  const habits = H.activeHabits().filter((h) => h.category === id);
  const goals = G.goals().filter((g) => g.category === id && g.status === 'active');
  return html`
    ${habits.length ? html`<section class="block" data-key="area-habits">
      <div class="block-head"><h2 class="block-title">Habits</h2><span class="block-meta tnum">${pct(categoryConsistency(id, today(), 30))} · 30 days</span></div>
      <ul class="list">${habits.map((h) => html`<li><a class="row" href="#/plan/habits/${h.id}" data-action="nav" data-to="plan/habits/${h.id}">
        <span class="row-ic" style="--ic:${catColor(h.category)}">${icon(h.icon, { size: 18 })}</span>
        <span class="row-main"><span class="row-title" data-morph="habit-${h.id}">${h.name}</span><span class="row-sub">${H.STATES[H.stateOf(h)].label} · ${H.scheduleLabel(h)}</span></span>
        <span class="row-right">${dots(H.dots(h, today(), 7), { size: 'sm' })}</span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`)}</ul>
    </section>` : ''}
    ${goals.length ? html`<section class="block" data-key="area-goals">
      <div class="block-head"><h2 class="block-title">Goals</h2></div>
      <ul class="list">${goals.map((g) => {
        const p = G.progress(g);
        return html`<li><a class="row" href="#/plan/goals/${g.id}" data-action="nav" data-to="plan/goals/${g.id}">
          <span class="goal-ring">${ring(p.ratio || 0, { size: 38, stroke: 4, color: 'var(--accent)' })}<span class="goal-ic">${icon('target', { size: 14 })}</span></span>
          <span class="row-main"><span class="row-title" data-morph="goal-${g.id}">${g.name}</span><span class="row-sub">${p.label || ''}</span></span>
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;
      })}</ul>
    </section>` : ''}`;
}

/** The list of areas, for Progress. */
export function areaList() {
  const pages = { body: 'progress/body' };
  return html`<ul class="list">${CATEGORIES.map((c) => {
    const n = H.activeHabits().filter((h) => h.category === c.id).length;
    return link(pages[c.id] || `progress/areas/${c.id === 'spirit' ? 'spirit' : c.id}`, c.icon, c.label,
      `${n} habit${n === 1 ? '' : 's'} · ${pct(categoryConsistency(c.id, today(), 30))} over 30 days`);
  })}</ul>`;
}

export default {
  id: 'area',
  title: ({ params }) => catLabel(params.id),
  render({ params }) {
    const c = CATEGORIES.find((x) => x.id === params.id);
    if (!c) return html`${pageHead({ title: 'Not found', back: { to: 'review', label: 'Review' } })}${empty({ ic: 'compass', title: 'There’s no area with that name.' })}`;
    const links = LINKS[c.id] || [];
    const body = areaBlocks(c.id);
    return html`
      ${pageHead({ title: c.label, eyebrow: 'Area', back: { to: 'review', label: 'Review' } })}
      ${links.length ? html`<section class="block block--first"><ul class="list">${links.map(([to, ic, t]) => link(to, ic, t))}</ul></section>` : ''}
      ${String(body).trim() ? body : empty({ ic: c.icon, title: `Nothing in ${c.label.toLowerCase()} yet`, body: 'Habits and goals you give this area show up here.' })}`;
  },
};
