// Bottom sheets: one render function, re-rendered on data changes, dismiss by
// dragging the handle, tapping the scrim, pressing Escape or a close button.
import { patch } from './patch.js';
import { html, esc } from './dom.js';
import { icon } from './icons.js';

const stack = [];
let layer;
let lastFocus = null;

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export const sheets = () => stack;
export const top = () => stack[stack.length - 1] || null;

// A counter, not the clock: two sheets opened in the same millisecond must not share an id.
let opened = 0;

export function open(opts) {
  layer ||= document.getElementById('sheets');
  const s = {
    id: opts.id || `sheet-${++opened}`,
    title: opts.title || '',
    render: opts.render,
    actions: opts.actions || {},
    inputs: opts.inputs || {},
    onClose: opts.onClose,
    size: opts.size || 'auto',
    ui: opts.ui || {},
    el: null,
  };
  if (!stack.length) lastFocus = document.activeElement;
  const wrap = document.createElement('div');
  wrap.className = `sheet-wrap sheet--${s.size}`;
  wrap.dataset.sheet = s.id;
  wrap.innerHTML = `<div class="sheet-scrim" data-sheet-close></div>
    <section class="sheet" role="dialog" aria-modal="true" tabindex="-1" aria-label="${esc(s.title)}">
      <div class="sheet-grab" aria-hidden="true"><span></span></div>
      <div class="sheet-body"></div>
    </section>`;
  layer.appendChild(wrap);
  s.el = wrap;
  stack.push(s);
  document.documentElement.classList.add('has-sheet');
  refresh(s);
  requestAnimationFrame(() => {
    wrap.classList.add('is-open');
    const f = wrap.querySelector('[autofocus]') || wrap.querySelector('.sheet-body ' + FOCUSABLE);
    if (f && !matchMedia('(pointer: coarse)').matches) f.focus({ preventScroll: true });
    else wrap.querySelector('.sheet').focus?.({ preventScroll: true });
  });
  attachDrag(s);
  s.close = () => close(s);
  s.refresh = () => refresh(s);
  return s;
}

export function refresh(s = top()) {
  if (!s?.el) return;
  const body = s.el.querySelector('.sheet-body');
  patch(body, html`
    <header class="sheet-head">
      <h2 class="sheet-title">${s.title}</h2>
      <button class="icon-btn sheet-x" type="button" data-sheet-close aria-label="Close">${icon('x', { size: 20 })}</button>
    </header>
    <div class="sheet-content">${s.render(s)}</div>`);
}

export function refreshAll() {
  stack.forEach(refresh);
}

export function close(s = top()) {
  if (!s) return;
  const i = stack.indexOf(s);
  if (i < 0) return;
  // A field still being edited saves first (its change event needs the sheet to find its
  // handler): Escape, a drag down or a tap outside don't take the focus away on their own.
  if (s.el.contains(document.activeElement)) document.activeElement.blur();
  stack.splice(i, 1);
  s.el.classList.remove('is-open');
  s.el.classList.add('is-closing');
  setTimeout(() => s.el.remove(), 260);
  if (!stack.length) {
    document.documentElement.classList.remove('has-sheet');
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }
  s.onClose?.();
}

export function closeAll() {
  [...stack].reverse().forEach((s) => close(s));
}

export function trapFocus(e) {
  const s = top();
  if (!s || e.key !== 'Tab') return;
  const items = [...s.el.querySelectorAll(FOCUSABLE)].filter((x) => x.offsetParent !== null);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

// Sheet physics: drag the handle or header (or the content, when it's scrolled to the top) to
// move the sheet. A flick or a pull past a third closes it; anything less springs back. Past
// the top it resists. Sheets with detents open at medium height and pull up to full height.
const phone = () => matchMedia('(max-width: 699px)').matches;

function suppressNextClick() {
  const stop = (e) => { e.stopPropagation(); e.preventDefault(); };
  window.addEventListener('click', stop, { capture: true, once: true });
  setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 0);
}

function attachDrag(s) {
  const panel = s.el.querySelector('.sheet');
  const scrim = s.el.querySelector('.sheet-scrim');
  let startY = 0, dy = 0, startH = 0, armed = false, dragging = false, fromContent = false, samples = [];
  const detent = () => s.el.classList.contains('sheet--detent') && phone();
  const large = () => s.el.classList.contains('is-large');
  const maxH = () => innerHeight - 24;
  s.expand = () => { if (detent()) s.el.classList.add('is-large'); };
  panel.addEventListener('focusin', (e) => { if (e.target.matches('input, textarea, select')) s.expand(); });

  const begin = (target, y, t) => {
    const content = s.el.querySelector('.sheet-content');
    const onHead = !!target.closest('.sheet-grab, .sheet-head');
    const atTop = !!content?.contains(target) && content.scrollTop <= 0;
    if (!onHead && !atTop) return;
    if (target.closest('input, textarea, select, [contenteditable], .scale, .seg, [data-drag], [data-swipe]')) return;
    if (onHead && target.closest('button')) return;
    armed = true; dragging = false; fromContent = !onHead;
    startY = y; dy = 0; samples = [[t, y]];
    startH = panel.getBoundingClientRect().height;
  };
  /** Returns true while the sheet is being dragged, so the browser shouldn't scroll. */
  const moveTo = (y, t) => {
    if (!armed) return false;
    const d = y - startY;
    if (!dragging) {
      if (Math.abs(d) < 6) return false;
      // From the content, only a downward pull moves the sheet (an upward one scrolls),
      // unless a medium sheet can still grow.
      if (fromContent && d < 0 && !(detent() && !large())) { armed = false; return false; }
      dragging = true;
      panel.style.transition = 'none';
      scrim.style.transition = 'none';
    }
    dy = d;
    samples.push([t, y]);
    if (samples.length > 6) samples.shift();
    if (detent() && !large() && dy < 0) {
      panel.style.height = `${Math.min(maxH(), startH - dy)}px`;
      return true;
    }
    const ty = dy >= 0 ? dy : -Math.sqrt(-dy) * 2.5;
    panel.style.transform = `translateY(${ty}px)`;
    scrim.style.opacity = String(Math.max(0, 1 - Math.max(0, dy) / (startH * 1.25)));
    return true;
  };
  const end = () => {
    if (!armed) return;
    armed = false;
    if (!dragging) return;
    dragging = false;
    suppressNextClick();
    const [t0, y0] = samples[0];
    const [t1, y1] = samples[samples.length - 1];
    const v = (y1 - y0) / Math.max(16, t1 - t0); // px per ms, positive is downward
    panel.style.transition = '';
    scrim.style.transition = '';
    scrim.style.opacity = '';
    if (detent() && !large() && dy < 0) {
      panel.style.height = '';
      if (-dy > 56 || v < -0.4) s.el.classList.add('is-large');
      return;
    }
    panel.style.transform = '';
    if (dy > startH * 0.3 || v > 0.6) {
      // A full-height sheet with detents drops to medium first, unless it was flicked hard.
      if (detent() && large() && dy < startH * 0.55 && v < 1.4) { s.el.classList.remove('is-large'); return; }
      close(s);
    }
  };
  // Mouse and pen through pointer events; touch through touch events, so a pull that starts
  // in the content can stop the browser from scrolling instead.
  panel.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'touch' && e.button === 0) begin(e.target, e.clientY, e.timeStamp); });
  panel.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch' && moveTo(e.clientY, e.timeStamp)) panel.setPointerCapture?.(e.pointerId); });
  panel.addEventListener('pointerup', (e) => { if (e.pointerType !== 'touch') end(); });
  panel.addEventListener('pointercancel', (e) => { if (e.pointerType !== 'touch') end(); });
  panel.addEventListener('touchstart', (e) => { if (e.touches.length === 1) begin(e.target, e.touches[0].clientY, e.timeStamp); }, { passive: true });
  panel.addEventListener('touchmove', (e) => { if (e.touches.length === 1 && moveTo(e.touches[0].clientY, e.timeStamp)) e.preventDefault(); }, { passive: false });
  panel.addEventListener('touchend', end);
  panel.addEventListener('touchcancel', end);
}
