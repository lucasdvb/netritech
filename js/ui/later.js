// Sections that are slow to work out and sit below the fold. When a screen opens they render as a
// placeholder of about the right height and fill in one per task straight after, so the screen
// appears first and no single task runs long. Any later render (after a change) draws them in full.
import { html } from './dom.js';

let pending = null; // during a screen's first render: [{ key, fn }]

/** Run a screen's first render. Returns its markup and the sections still to fill in. */
export function firstRender(fn) {
  pending = [];
  try { return { markup: fn(), waiting: pending }; } finally { pending = null; }
}

/** A section keyed `key`: its markup now, or a placeholder during a screen's first render. */
export function later(key, fn, height = 280) {
  if (!pending) return fn();
  pending.push({ key, fn });
  return html`<section class="block block--later" data-key="${key}" style="min-height:${height}px" aria-hidden="true"></section>`;
}

/** Fill the placeholders under `root`, one per task. A placeholder already replaced by a full render is skipped. */
export function fill(root, list) {
  const step = () => {
    const item = list.shift();
    if (!item) return;
    const ph = root.querySelector(`.block--later[data-key="${CSS.escape(item.key)}"]`);
    if (ph) {
      const tpl = document.createElement('template');
      try { tpl.innerHTML = String(item.fn()); } catch (err) { console.error(err); }
      ph.replaceWith(tpl.content);
    }
    if (list.length) setTimeout(step);
  };
  setTimeout(step);
}
