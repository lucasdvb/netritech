// Text with its mentions marked: #Tags that name something become links to it (or, inside a row that
// is already a link, highlighted words), @Names open what you've written about that person. A # that
// names nothing stays plain text.
import { html } from './dom.js';
import { scan, resolve } from '../domain/mentions.js';

/** `links`: make mentions tappable (only where the text isn't inside another link or button). */
export function mentionText(text, { links = false } = {}) {
  const s = String(text || '');
  const parts = [];
  let at = 0;
  for (const m of scan(s)) {
    const token = s.slice(m.index, m.index + m.length);
    if (m.sign === '#') {
      const hit = resolve(m.word)[0];
      if (!hit) continue;
      parts.push(s.slice(at, m.index));
      parts.push(links ? html`<a class="mention" href="#/${hit.to}" data-action="nav" data-to="${hit.to}">${token}</a>` : html`<span class="mention">${token}</span>`);
    } else {
      parts.push(s.slice(at, m.index));
      parts.push(links ? html`<button type="button" class="mention mention--person" data-action="person" data-name="${m.word}">${token}</button>` : html`<span class="mention mention--person">${token}</span>`);
    }
    at = m.index + m.length;
  }
  parts.push(s.slice(at));
  return html`${parts}`;
}

/** The things and people a text mentions, as a row of chips to go to each (nothing when there are none). */
export function mentionChips(text) {
  const seen = new Set();
  const chips = [];
  for (const m of scan(text)) {
    const key = `${m.sign}${m.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (m.sign === '#') {
      const hit = resolve(m.word)[0];
      if (hit) chips.push(html`<a class="chip mention-link" href="#/${hit.to}" data-action="nav" data-to="${hit.to}">#${m.word}</a>`);
    } else chips.push(html`<button type="button" class="chip mention-link" data-action="person" data-name="${m.word}">@${m.word}</button>`);
  }
  return chips.length ? html`<div class="chips mention-chips" data-key="mention-chips" aria-label="Mentioned here">${chips}</div>` : '';
}
