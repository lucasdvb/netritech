import * as store from '../data/store.js';
import { areaBlocks } from './area.js';
import * as H from '../domain/habits.js';
import { today, lastNDays, startOfWeek, relativeDay, fmtDayLetter, cmp } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { openRelationship, PEOPLE_LABELS } from './sheets.js';

const PEOPLE = [
  { id: 'fiancee', habit: 'h-fiancee', icon: 'heart', prompt: '10–20 minutes, phone away. “How are you really doing?”' },
  { id: 'date', habit: 'h-date', icon: 'coffee', prompt: 'Once a week: dinner, a walk, coffee, a movie, a day trip.' },
  { id: 'son', habit: 'h-son', icon: 'user-round', prompt: 'A conversation, something shared, guidance or encouragement.' },
  { id: 'family', habit: 'h-family', icon: 'message-circle', prompt: 'One meaningful conversation a week.' },
];

export default {
  id: 'relationships',
  title: 'Relationships',
  render() {
    const days = lastNDays(today(), 7);
    const wk = startOfWeek(today());
    const moments = store.all('relationshipEntries').sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : cmp(b.createdAt || '', a.createdAt || '')));
    return html`
      ${pageHead({ title: 'Relationships', back: { to: 'progress', label: 'Progress' } })}
      <p class="lead">Presence, not performance. Notes here are for remembering, not scoring.</p>
      <div class="people">${PEOPLE.map((p) => {
        const h = H.habit(p.habit);
        const thisWeek = moments.filter((m) => m.person === p.id && m.date >= wk).length;
        return html`<section class="card person" style="--ic:var(--c-relationships)">
          <div class="person-head"><span class="row-ic">${icon(p.icon, { size: 18 })}</span><div class="person-title"><p class="card-title">${PEOPLE_LABELS[p.id]}</p><p class="muted small">${p.prompt}</p></div></div>
          ${p.id === 'fiancee' && h ? html`<div class="practice-days">${days.map((d) => html`<span class="${cx('pday', H.isDone(h, d) && 'is-on', d === today() && 'is-today')}">${fmtDayLetter(d)}</span>`)}</div>`
            : html`<p class="person-week">${thisWeek ? `${thisWeek} moment${thisWeek === 1 ? '' : 's'} this week` : 'Not yet this week'}</p>`}
          <button type="button" class="btn btn--soft btn--sm" data-action="log" data-person="${p.id}">${icon('plus', { size: 15 })} Log time together</button>
        </section>`;
      })}</div>
      <section class="block"><div class="block-head"><h2 class="block-title">Moments</h2></div>
        ${moments.length ? html`<ul class="list">${moments.slice(0, 20).map((m) => html`<li><button type="button" class="row" data-action="edit" data-id="${m.id}">
          <span class="row-main"><span class="row-title">${PEOPLE_LABELS[m.person]} · ${m.kind}</span><span class="row-sub">${relativeDay(m.date)}${m.minutes ? ` · ${m.minutes} min` : ''}${m.note ? ` · ${m.note}` : ''}</span></span></button></li>`)}</ul>`
          : html`<p class="muted">Ticking “Time with your fiancée” on Today is enough. Log a moment when there’s something worth remembering.</p>`}
      </section>
      ${areaBlocks('relationships')}`;
  },
  actions: {
    log: ({ data }) => openRelationship(data.person, today()),
    edit: ({ data }) => openRelationship(null, null, store.get('relationshipEntries', data.id)),
  },
};
