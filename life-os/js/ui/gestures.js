// Gestures: pull down at the top of a place to search (⌘K or / on a keyboard), and hold or swipe
// a habit row. Each one has a visible alternative.
import { html } from './dom.js';
import { icon } from './icons.js';
import * as hap from './haptics.js';

const THRESHOLD = 76;

export function attachPullToSearch({ enabled, onSearch }) {
  let startY = null, dy = 0, pill = null;
  const show = (d) => {
    if (!pill) {
      pill = document.createElement('div');
      pill.className = 'pull-search';
      pill.setAttribute('aria-hidden', 'true');
      document.body.appendChild(pill);
    }
    const ready = d >= THRESHOLD;
    pill.innerHTML = String(html`${icon('search', { size: 16 })}<span>${ready ? 'Release to search' : 'Pull to search'}</span>`);
    pill.classList.toggle('is-ready', ready);
    pill.style.setProperty('--pull', String(Math.min(1, d / THRESHOLD)));
    pill.style.transform = `translate(-50%, ${Math.min(d, 120) * 0.55}px)`;
  };
  const hide = () => { pill?.remove(); pill = null; };
  addEventListener('touchstart', (e) => {
    startY = null;
    if (e.touches.length !== 1 || scrollY > 0 || !enabled()) return;
    if (document.documentElement.classList.contains('has-sheet')) return;
    if (e.target.closest('input, textarea, select, [data-drag], [data-swipe], .sheet, .tabbar')) return;
    startY = e.touches[0].clientY;
    dy = 0;
  }, { passive: true });
  addEventListener('touchmove', (e) => {
    if (startY == null) return;
    dy = e.touches[0].clientY - startY;
    if (dy <= 8 || scrollY > 0) { hide(); if (scrollY > 0) startY = null; return; }
    show(dy);
  }, { passive: true });
  const end = () => {
    if (startY == null) return;
    const go = dy >= THRESHOLD;
    startY = null;
    hide();
    if (go) onSearch();
  };
  addEventListener('touchend', end);
  addEventListener('touchcancel', () => { startY = null; hide(); });
}

/* ---------- habit rows: hold and swipe (U3) ---------- */

const HOLD_MS = 450;
const SLOP = 8;
const COMMIT = 96;

/** Swallow the click a gesture's release may produce. Returns a function that stops waiting for it. */
function swallowClick() {
  const stop = (e) => { e.stopPropagation(); e.preventDefault(); };
  const done = () => window.removeEventListener('click', stop, { capture: true });
  window.addEventListener('click', stop, { capture: true, once: true });
  setTimeout(done, 350);
  return done;
}

/**
 * Rows marked [data-habit]: hold (or right-click) for an amount or the tiny version, swipe left
 * past the line for "not today". Both have visible alternatives in the habit's sheet, which a
 * tap on the row's name opens. Vertical scrolling is left to the browser (touch-action: pan-y).
 */
export function attachRowGestures(root, { onHold, onSwipe }) {
  let g = null;
  let heldAt = 0;
  const reset = (row) => {
    row.classList.remove('is-swiping', 'is-past', 'is-held');
    row.style.removeProperty('--swipe');
  };
  const cancel = () => {
    if (!g) return;
    clearTimeout(g.timer);
    const { row, axis } = g;
    g = null;
    if (axis === 'x') { row.classList.add('is-returning'); reset(row); setTimeout(() => row.classList.remove('is-returning'), 260); }
    else reset(row);
  };
  root.addEventListener('pointerdown', (e) => {
    const row = e.target.closest('[data-habit]');
    if (!row || e.button > 0 || e.target.closest('input, textarea, select, [data-drag]')) return;
    g = { row, id: row.dataset.habit, x: e.clientX, y: e.clientY, dx: 0, axis: null, past: false, pointer: e.pointerId, mouse: e.pointerType === 'mouse' };
    g.timer = setTimeout(() => {
      if (!g || g.axis) return;
      const { row: r, id } = g;
      g = null;
      heldAt = Date.now();
      r.classList.add('is-held');
      setTimeout(() => r.classList.remove('is-held'), 220);
      swallowClick();
      onHold(id, r);
    }, HOLD_MS);
  });
  root.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.pointer) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.axis) {
      if (Math.abs(dx) < SLOP && Math.abs(dy) < SLOP) return;
      clearTimeout(g.timer);
      g.axis = !g.mouse && g.row.dataset.swipe !== 'off' && dx < 0 && Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
      if (g.axis !== 'x') { const r = g.row; g = null; reset(r); return; }
      g.row.classList.add('is-swiping');
      g.row.setPointerCapture?.(e.pointerId);
    }
    g.dx = Math.min(0, dx);
    // Past the line it slows down, so letting go there feels deliberate.
    const shown = g.dx > -COMMIT ? g.dx : -COMMIT + (g.dx + COMMIT) * 0.35;
    g.row.style.setProperty('--swipe', `${shown}px`);
    const past = -g.dx >= COMMIT;
    if (past !== g.past) { g.past = past; g.row.classList.toggle('is-past', past); if (past) hap.threshold(); }
  });
  root.addEventListener('pointerup', (e) => {
    if (!g || e.pointerId !== g.pointer) return;
    clearTimeout(g.timer);
    if (g.axis !== 'x') { g = null; return; }
    const unswallow = swallowClick();
    const { row, id, past } = g;
    g = null;
    if (!past) { row.classList.add('is-returning'); reset(row); setTimeout(() => row.classList.remove('is-returning'), 260); return; }
    row.classList.add('is-leaving');
    row.style.setProperty('--swipe', '-100%');
    // By now any click from the release has come and gone: the first tap on what opens next is yours.
    setTimeout(() => { unswallow(); row.classList.remove('is-leaving'); reset(row); onSwipe(id, row); }, 180);
  });
  root.addEventListener('pointercancel', cancel);
  // A mouse or a trackpad: right-click is the hold. A long touch can raise it too, so ignore
  // the one that follows a hold.
  root.addEventListener('contextmenu', (e) => {
    const row = e.target.closest('[data-habit]');
    if (!row) return;
    e.preventDefault();
    if (Date.now() - heldAt < 1000) return;
    cancel();
    onHold(row.dataset.habit, row);
  });
}

/** A horizontal swipe that starts on `selector`: onSwipe(+1) for left, onSwipe(-1) for right. */
export function attachHeadSwipe(root, selector, onSwipe) {
  let x0 = null, y0 = 0;
  root.addEventListener('touchstart', (e) => {
    x0 = e.target.closest(selector) && e.touches.length === 1 ? e.touches[0].clientX : null;
    y0 = e.touches[0]?.clientY || 0;
  }, { passive: true });
  root.addEventListener('touchend', (e) => {
    if (x0 == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - x0, dy = t.clientY - y0;
    x0 = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
    onSwipe(dx < 0 ? 1 : -1);
  });
}
