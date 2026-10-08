// Sections that are slow to work out and sit below the fold. When a screen opens they render as a
// placeholder of about the right height and fill in one per task straight after, so the screen
// appears first and no single task runs long. A redraw while they fill keeps the ones not yet
// filled waiting; any redraw after that draws them in full.
import { html } from './dom.js';

let pending = null; // during a render that defers: [{ key, fn }]
let only = null;    // keys that may wait (a redraw while filling), or null for all
let queue = [];
let root = null;
let timer = 0;

/** Render with deferral on. Returns the markup and the sections still to fill in. */
export function firstRender(fn, keys = null) {
  pending = [];
  only = keys;
  try { return { markup: fn(), waiting: pending }; } finally { pending = null; only = null; }
}

/** A section keyed `key`: its markup now, or a placeholder while deferring. */
export function later(key, fn, height = 280) {
  if (!pending || (only && !only.has(key))) return fn();
  pending.push({ key, fn });
  return html`<section class="block block--later" data-key="${key}" style="min-height:${height}px" aria-hidden="true"></section>`;
}

/** The keys still waiting to fill in, or null when nothing is. */
export const waitingKeys = () => (queue.length ? new Set(queue.map((i) => i.key)) : null);

/** Fill the placeholders under `el`, one per task. Replaces any fill in progress. */
export function fill(el, list) {
  root = el;
  queue = list;
  clearTimeout(timer);
  if (queue.length) timer = setTimeout(step);
}

function step() {
  const item = queue.shift();
  if (!item) return;
  const ph = root.querySelector(`.block--later[data-key="${CSS.escape(item.key)}"]`);
  if (ph) {
    const tpl = document.createElement('template');
    try { tpl.innerHTML = String(item.fn()); } catch (err) { console.error(err); }
    ph.replaceWith(tpl.content);
  }
  if (queue.length) timer = setTimeout(step);
}
