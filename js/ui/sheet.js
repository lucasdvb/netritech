// Bottom sheets: one render function, re-rendered on data changes, dismiss by
// dragging the handle, tapping the scrim, pressing Escape or a close button.
import { patch } from './patch.js';
import { html } from './dom.js';
import { icon } from './icons.js';

const stack = [];
let layer;
let lastFocus = null;

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export const sheets = () => stack;
export const top = () => stack[stack.length - 1] || null;

export function open(opts) {
  layer ||= document.getElementById('sheets');
  const s = {
    id: opts.id || `sheet-${Date.now()}`,
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
    <section class="sheet" role="dialog" aria-modal="true" tabindex="-1" aria-label="${s.title.replace(/"/g, '&quot;')}">
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

function attachDrag(s) {
  const panel = s.el.querySelector('.sheet');
  const handle = s.el.querySelector('.sheet-grab');
  let startY = 0, dy = 0, dragging = false;
  const down = (e) => {
    const content = s.el.querySelector('.sheet-content');
    const fromHandle = handle.contains(e.target) || e.target.closest('.sheet-head');
    if (!fromHandle && !(content && content.scrollTop <= 0 && e.target.closest('.sheet-head'))) return;
    if (e.target.closest('button, input, textarea, select')) return;
    dragging = true; startY = e.clientY; dy = 0;
    panel.style.transition = 'none';
    panel.setPointerCapture?.(e.pointerId);
  };
  const move = (e) => {
    if (!dragging) return;
    dy = Math.max(0, e.clientY - startY);
    panel.style.transform = `translateY(${dy}px)`;
  };
  const up = () => {
    if (!dragging) return;
    dragging = false;
    panel.style.transition = '';
    panel.style.transform = '';
    if (dy > 110) close(s);
  };
  panel.addEventListener('pointerdown', down);
  panel.addEventListener('pointermove', move);
  panel.addEventListener('pointerup', up);
  panel.addEventListener('pointercancel', up);
}
