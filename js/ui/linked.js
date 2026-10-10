// "Linked to" (50): one section on every habit, goal, workout, routine and project page listing what
// it's linked to (each a tap away), and where it's mentioned in your notes and journal.
import { html } from './dom.js';
import { icon } from './icons.js';
import { everything } from '../domain/links.js';
import { relativeDay } from '../domain/dates.js';
import { tagOf } from '../domain/mentions.js';

const SHOWN = 3;

/** The section. `name` is the item's name, for the hint on how to mention it; `except` leaves out
 *  groups the page already shows in full. */
export function linkedBlock(kind, id, name, { except = [] } = {}) {
  const all = everything(kind, id);
  const links = all.links.filter((l) => !except.includes(l.group));
  const { mentions } = all;
  const row = (l) => html`<li><a class="row" href="#/${l.to}" data-action="nav" data-to="${l.to}">
    <span class="row-ic">${icon(l.icon, { size: 16 })}</span>
    <span class="row-main"><span class="row-title">${l.label}</span><span class="row-sub">${l.group}${l.sub ? ` · ${l.sub}` : ''}</span></span>
    <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`;
  const mention = (m) => html`<li><a class="row" href="#/${m.to}" data-action="nav" data-to="${m.to}">
    <span class="row-ic">${icon(m.source === 'note' ? 'brain' : 'notebook-pen', { size: 16 })}</span>
    <span class="row-main"><span class="row-title linked-snippet">${m.snippet}</span><span class="row-sub">${m.source === 'note' ? 'Brain dump' : 'Journal'} · ${relativeDay(m.date)}</span></span></a></li>`;
  return html`<section class="block" data-key="linked">
    <div class="block-head"><h2 class="block-title">Linked to</h2>${links.length ? html`<span class="block-meta tnum">${links.length}</span>` : ''}</div>
    ${links.length ? html`<ul class="list">${links.map(row)}</ul>` : except.length ? '' : html`<p class="quiet-line">Not linked to anything yet.</p>`}
    ${mentions.length ? html`<p class="section-label linked-label">Mentioned in</p>
      <ul class="list">${mentions.slice(0, SHOWN).map(mention)}</ul>
      ${mentions.length > SHOWN ? html`<button type="button" class="link-btn" data-action="mentions" data-kind="${kind}" data-id="${id}" data-title="${name || ''}">All ${mentions.length} mentions</button>` : ''}`
      : name ? html`<p class="quiet-line">Write <span class="mention">#${tagOf(name)}</span> in a note or your journal to link it here.</p>` : ''}
  </section>`;
}

/** Every mention of an item, in a sheet. */
export function mentionsSheet(app, kind, id, title) {
  const { mentions } = everything(kind, id);
  app.sheet({
    title: `Mentions of ${title}`,
    render: () => html`<ul class="list">${mentions.map((m) => html`<li><a class="row" href="#/${m.to}" data-action="go" data-to="${m.to}">
      <span class="row-main"><span class="row-title linked-snippet">${m.snippet}</span><span class="row-sub">${m.source === 'note' ? 'Brain dump' : 'Journal'} · ${relativeDay(m.date)}</span></span></a></li>`)}</ul>`,
    actions: { go: ({ data, sheet }) => { app.closeSheet(sheet); app.go(data.to); } },
  });
}
