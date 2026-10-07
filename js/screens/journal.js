import * as store from '../data/store.js';
import { today, relativeDay, fmtMDY, fmtTime } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, segmented, empty } from '../ui/components.js';
import { app } from '../ui/app-api.js';

export const PROMPTS = {
  morning: ['What matters most today?', 'What could derail me?', 'How will I respond?'],
  evening: ['What did I accomplish?', 'Where did I fall short?', 'What will I do differently tomorrow?'],
  free: [],
};
export const KIND_LABEL = { morning: 'Morning reflection', evening: 'Evening reflection', free: 'Entry' };

export function newEntry(kind, date = today()) {
  const existing = kind !== 'free' && store.onDate('journalEntries', date).find((j) => j.kind === kind);
  if (existing) { app.go(`reflect/journal/${existing.id}`); return; }
  const e = store.put('journalEntries', { date, kind, answers: {}, text: '' });
  app.go(`reflect/journal/${e.id}`);
}

const preview = (j) => {
  const parts = [...Object.values(j.answers || {}), j.text || ''].map((s) => (s || '').trim()).filter(Boolean);
  return parts.join(' · ').slice(0, 140) || 'Empty';
};

export default {
  id: 'journal',
  title: 'Journal',
  render({ ui }) {
    const filter = ui.filter || 'all';
    const all = store.all('journalEntries').sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.createdAt || '').localeCompare(a.createdAt || '')));
    const list = all.filter((j) => filter === 'all' || j.kind === filter);
    const hour = new Date().getHours();
    return html`
      ${pageHead({ title: 'Journal', back: { to: 'reflect', label: 'Reflect' } })}
      <p class="privacy-line">${icon('lock', { size: 14 })} Private. Stored only on this device.</p>
      <div class="write-row">
        <button type="button" class="write-btn${hour < 14 ? ' is-suggested' : ''}" data-action="new" data-kind="morning">${icon('sunrise', { size: 18 })}<span>Morning</span></button>
        <button type="button" class="write-btn${hour >= 18 ? ' is-suggested' : ''}" data-action="new" data-kind="evening">${icon('moon', { size: 18 })}<span>Evening</span></button>
        <button type="button" class="write-btn" data-action="new" data-kind="free">${icon('feather', { size: 18 })}<span>Free entry</span></button>
      </div>
      ${all.length ? segmented([{ id: 'all', label: 'All' }, { id: 'morning', label: 'Morning' }, { id: 'evening', label: 'Evening' }, { id: 'free', label: 'Free' }], filter, { action: 'filter', name: 'Filter' }) : ''}
      ${!list.length ? empty({ ic: 'notebook-pen', title: 'Start today’s reflection.', body: 'Three questions in the morning, three at night. Or just write.' })
        : html`<ul class="list block">${list.map((j) => html`<li><a class="row journal-row" href="#/reflect/journal/${j.id}" data-action="nav" data-to="reflect/journal/${j.id}">
          <span class="row-main"><span class="row-title" data-morph="journal-${j.id}">${KIND_LABEL[j.kind]} <span class="muted">· ${relativeDay(j.date)}</span></span><span class="row-sub journal-preview">${preview(j)}</span></span>
          <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`)}</ul>`}`;
  },
  actions: {
    new: ({ data }) => newEntry(data.kind),
    filter: ({ data, ui }) => { ui.filter = data.value; app.refresh(); },
  },
};
