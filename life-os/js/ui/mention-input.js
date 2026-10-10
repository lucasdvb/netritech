// Typing # or @ in a note or the journal suggests what to mention: your habits, goals, routines,
// workouts and projects after #, the people you've mentioned before after @. A tap puts the tag in.
// One row of chips floats under the field (outside the screen's markup, so redraws leave it alone).
import { html } from './dom.js';
import { suggest } from '../domain/mentions.js';

let bar = null;
let field = null;
let current = null;

function hide() {
  bar?.remove();
  bar = null;
  field = null;
  current = null;
}

function place() {
  if (!bar || !field?.isConnected) { hide(); return; }
  const r = field.getBoundingClientRect();
  const vv = window.visualViewport;
  const bottom = Math.min(r.bottom, (vv ? vv.offsetTop + vv.height : innerHeight) - 52);
  bar.style.top = `${Math.max(8, bottom + 6)}px`;
  bar.style.left = `${Math.max(8, r.left)}px`;
  bar.style.width = `${Math.min(r.width, innerWidth - 16)}px`;
}

/** Check the field after typing: show, update or hide the suggestions. */
export function check(el) {
  const s = suggest(el.value, el.selectionStart ?? el.value.length);
  if (!s) { hide(); return; }
  current = s;
  field = el;
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'mention-bar';
    bar.setAttribute('role', 'listbox');
    bar.setAttribute('aria-label', s.sign === '#' ? 'Mention a habit, goal or project' : 'Mention a person');
    // Keep the keyboard up: choosing must not take focus from the field.
    bar.addEventListener('pointerdown', (e) => e.preventDefault());
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]');
      if (b) choose(Number(b.dataset.i));
    });
    document.body.append(bar);
  }
  bar.innerHTML = String(html`${s.options.map((o, i) => html`<button type="button" class="chip mention-chip" role="option" data-i="${i}">
    <span>${o.insert}</span><small>${o.sub}</small></button>`)}`);
  place();
}

function choose(i) {
  const o = current?.options[i];
  if (!o || !field) return;
  const el = field;
  const { from, to } = current;
  const after = el.value.slice(to);
  const insert = `${o.insert}${/^\s/.test(after) ? '' : ' '}`;
  el.value = el.value.slice(0, from) + insert + after;
  const caret = from + insert.length;
  el.setSelectionRange(caret, caret);
  hide();
  // Saved the same way as typing it.
  el.dispatchEvent(new window.Event('input', { bubbles: true }));
  el.dispatchEvent(new window.Event('change', { bubbles: true }));
  el.focus();
}

document.addEventListener('focusout', (e) => { if (e.target === field) setTimeout(() => { if (document.activeElement !== field) hide(); }, 150); });
addEventListener('resize', place);
window.visualViewport?.addEventListener('resize', place);
document.addEventListener('scroll', place, { passive: true, capture: true });
