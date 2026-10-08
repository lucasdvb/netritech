// Drag to reorder, for any list marked [data-reorder="action"]. Its direct children with a
// data-key are the items; each has a [data-drag] handle. Drag the handle (touch, mouse or pen),
// or focus it and use the arrow keys, Home and End. The list moves at once, the screen or sheet
// action named by data-reorder saves the new order ({ from, to }), and a screen reader hears
// where the item landed. app.js loads this file the first time a handle is touched.
import * as hap from './haptics.js';
import { reducedMotion } from './motion.js';

const EDGE = 56; // px from the top or bottom of the scroll area where dragging scrolls it

const itemsOf = (list) => [...list.children].filter((c) => c.matches('[data-key]:not([data-fixed])'));

let live = null;
function announce(text) {
  if (!live) {
    live = document.createElement('div');
    live.className = 'sr-only';
    live.setAttribute('aria-live', 'assertive');
    document.body.append(live);
  }
  live.textContent = '';
  requestAnimationFrame(() => { live.textContent = text; });
}

function scroller(el) {
  for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
    const oy = getComputedStyle(n).overflowY;
    if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight) return n;
  }
  return document.scrollingElement;
}

/** Let a field being edited in the list save first, while its position is still the old one. */
function settleFields(list) {
  const a = document.activeElement;
  if (a && a !== document.body && list.contains(a) && !a.matches('[data-drag]')) a.blur();
}

/** Move the item's node to its new place and tell the owner. */
function commit(list, item, from, to) {
  settleFields(list);
  const items = itemsOf(list);
  // Move the neighbours, not the item: moving a node that holds focus would drop it.
  if (to > from) for (const n of items.slice(from + 1, to + 1)) list.insertBefore(n, item);
  else { let at = item.nextSibling; for (const n of items.slice(to, from)) { list.insertBefore(n, at); at = n.nextSibling; } }
  list.dispatchEvent(new CustomEvent('lifeos:reorder', { bubbles: true, detail: { from, to } }));
  announce(`Moved to ${to + 1} of ${items.length}.`);
}

function onKey(e, list, item) {
  const items = itemsOf(list);
  const from = items.indexOf(item);
  const last = items.length - 1;
  const to = { ArrowUp: from - 1, ArrowDown: from + 1, Home: 0, End: last }[e.key];
  if (from < 0 || to == null || to < 0 || to > last || to === from) return;
  const handle = document.activeElement;
  commit(list, item, from, to);
  hap.play('tap');
  // The node moved, so focus stays on its handle; bring it into view.
  handle?.scrollIntoView?.({ block: 'nearest' });
}

function onPointer(e, list, item, handle) {
  const items = itemsOf(list);
  const from = items.indexOf(item);
  if (from < 0 || items.length < 2) return;
  try { handle.setPointerCapture(e.pointerId); } catch { return; } // already let go
  settleFields(list);
  const listTop0 = list.getBoundingClientRect().top;
  const rects = items.map((n) => { const r = n.getBoundingClientRect(); return { top: r.top - listTop0, h: r.height }; });
  const step = rects[from].h + (from < items.length - 1 ? rects[from + 1].top - rects[from].top - rects[from].h : rects[from].top - (rects[from - 1].top + rects[from - 1].h));
  const grab = e.clientY - listTop0;
  const area = scroller(list);
  let y = e.clientY;
  let to = from;
  let raf = 0;
  let dy = 0;

  item.classList.add('is-lifted');
  list.classList.add('is-sorting');
  hap.play('hold');

  const layout = () => {
    dy = y - list.getBoundingClientRect().top - grab;
    item.style.transform = `translateY(${dy}px)`;
    const mid = rects[from].top + dy + rects[from].h / 2;
    let next = from;
    for (let i = from + 1; i < items.length; i++) if (mid > rects[i].top + rects[i].h / 2) next = i;
    for (let i = from - 1; i >= 0; i--) if (mid < rects[i].top + rects[i].h / 2) next = i;
    if (next !== to) {
      to = next;
      hap.play('tap');
      items.forEach((n, i) => {
        if (n === item) return;
        const shift = from < to && i > from && i <= to ? -step : to < from && i >= to && i < from ? step : 0;
        n.style.transform = shift ? `translateY(${shift}px)` : '';
      });
    }
  };
  // Near the top or bottom edge the list scrolls, faster the closer you are.
  const tick = () => {
    raf = 0;
    const box = area === document.scrollingElement ? { top: 0, bottom: innerHeight } : area.getBoundingClientRect();
    const v = y < box.top + EDGE ? -(box.top + EDGE - y) : y > box.bottom - EDGE ? y - (box.bottom - EDGE) : 0;
    if (!v) return;
    const before = area.scrollTop;
    area.scrollTop += Math.max(-18, Math.min(18, v / 3));
    if (area.scrollTop !== before) { layout(); raf = requestAnimationFrame(tick); }
  };
  const move = (ev) => {
    y = ev.clientY;
    layout();
    if (!raf) raf = requestAnimationFrame(tick);
  };
  const end = (ev) => {
    handle.removeEventListener('pointermove', move);
    handle.removeEventListener('pointerup', end);
    handle.removeEventListener('pointercancel', end);
    if (raf) cancelAnimationFrame(raf);
    const keep = ev.type === 'pointerup' && to !== from;
    const before = item.getBoundingClientRect().top;
    // Settle without animating the neighbours: they are already where they belong.
    list.classList.remove('is-sorting');
    items.forEach((n) => { n.style.transform = ''; });
    if (keep) commit(list, item, from, to);
    item.classList.remove('is-lifted');
    const offset = before - item.getBoundingClientRect().top;
    if (offset && !reducedMotion()) {
      item.animate([{ transform: `translateY(${offset}px)` }, { transform: 'none' }], { duration: 200, easing: 'cubic-bezier(.2, .8, .2, 1)' });
    }
    if (keep) hap.play('success');
  };
  handle.addEventListener('pointermove', move);
  handle.addEventListener('pointerup', end);
  handle.addEventListener('pointercancel', end);
  layout();
}

/** Start from the event app.js caught on a handle. */
export function begin(e, handle) {
  const list = handle.closest('[data-reorder]');
  const item = list && [...list.children].find((c) => c.contains(handle));
  if (!item) return;
  if (e.type === 'keydown') onKey(e, list, item);
  else onPointer(e, list, item, handle);
}

/** The array with one entry moved: the usual way an action applies { from, to }. */
export function moved(arr, from, to) {
  const out = [...arr];
  const [x] = out.splice(from, 1);
  out.splice(to, 0, x);
  return out;
}
