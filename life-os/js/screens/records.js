// Records & mastery (G3, G4): the records shelf, found in your own data, and each habit's mastery
// plates, engraved with the day each level was reached. Quiet: nothing here asks anything of you.
import * as H from '../domain/habits.js';
import * as L from '../domain/levels.js';
import * as Rec from '../domain/records.js';
import { fmtMD, relativeDay } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { num } from '../ui/format.js';
import { app } from '../ui/app-api.js';

/** A habit's mastery: its plate (level and the day it was engraved) and how far to the next. */
export function plateCard(h, { link = false } = {}) {
  const m = L.mastery(h);
  if (!m.count) return '';
  const where = `${num(m.count)} time${m.count === 1 ? '' : 's'}${m.next ? ` · ${m.toNext} more to ${m.next.name}` : ' · every plate engraved'}`;
  const bar = m.next ? html`<span class="plate-bar" aria-hidden="true"><span style="transform:scaleX(${((m.count - (m.level?.at || 0)) / (m.next.at - (m.level?.at || 0))).toFixed(3)})"></span></span>` : '';
  const plate = html`<span class="${cx('plate', m.level && `plate--${m.level.level}`)}" aria-hidden="true">${icon(m.level?.level === 'mastered' ? 'medal' : 'star', { size: 16 })}</span>`;
  if (link) {
    return html`<a class="row plate-row" href="#/plan/habits/${h.id}" data-action="nav" data-to="plan/habits/${h.id}" data-key="pl-${h.id}">${plate}
      <span class="row-main"><span class="row-title">${h.name}</span><span class="row-sub">${m.level ? `${m.level.name} since ${fmtMD(m.level.date)} · ` : ''}${where}</span>${bar}</span>
      <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a>`;
  }
  return html`<div class="row plate-row" data-key="mastery">${plate}
    <span class="row-main"><span class="row-title">${m.level ? m.level.name : 'Not yet started'}${m.level ? html` <span class="muted">· since ${fmtMD(m.level.date)}</span>` : ''}</span>
      <span class="row-sub">${where}</span>${bar}</span></div>`;
}

const SHOW = { shelf: 6, habits: 8 };

export default {
  id: 'records',
  title: 'Records & mastery',
  render({ ui }) {
    const shelf = Rec.shelf();
    const habits = H.activeHabits().filter((h) => !['paused'].includes(H.stateOf(h))).map((h) => ({ h, m: L.mastery(h) })).filter((x) => x.m.count)
      .sort((a, b) => (b.m.level?.at || 0) - (a.m.level?.at || 0) || b.m.count - a.m.count);
    return html`
      ${pageHead({ title: 'Records & mastery', back: { to: 'progress', label: 'Progress' } })}
      <section class="block block--first" data-key="shelf">
        <div class="block-head"><h2 class="block-title">Records</h2><span class="block-meta">from your own data</span></div>
        ${shelf.length ? html`<ul class="record-shelf">${shelf.slice(0, ui.allRecords ? shelf.length : SHOW.shelf).map((r) => html`<li class="record" data-key="rec-${r.id}">
            <p class="record-label">${r.label}</p>
            <p class="record-value tnum">${r.text}</p>
            <p class="record-sub">${r.ongoing ? 'Still going · ' : ''}${relativeDay(r.date)} · before: ${r.previousText}</p></li>`)}</ul>
          ${shelf.length > SHOW.shelf && !ui.allRecords ? html`<button type="button" class="link-btn" data-action="more" data-k="allRecords">Show all ${shelf.length}</button>` : ''}`
          : html`<p class="quiet-line">Records appear once something has been logged four times or more, so your first entries set the bar rather than break it.</p>`}
      </section>
      <section class="block" data-key="mastery">
        <div class="block-head"><h2 class="block-title">Mastery</h2><span class="block-meta">1 · 10 · 30 · 66 · 150 times</span></div>
        ${habits.length ? html`<ul class="list">${habits.slice(0, ui.allHabits ? habits.length : SHOW.habits).map(({ h }) => html`<li>${plateCard(h, { link: true })}</li>`)}</ul>
          ${habits.length > SHOW.habits && !ui.allHabits ? html`<button type="button" class="link-btn" data-action="more" data-k="allHabits">Show all ${habits.length} habits</button>` : ''}`
          : html`<p class="quiet-line">Each habit earns a plate the first time you do it, then at 10, 30, 66 and 150 times. The date is engraved for good.</p>`}
      </section>`;
  },
  actions: { more: ({ data, ui }) => { ui[data.k] = true; app.refresh(); } },
};
