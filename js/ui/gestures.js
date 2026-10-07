// Pull down at the top of a place to search, like a list on iPhone. Touch only; on a
// keyboard, ⌘K or / does the same.
import { html } from './dom.js';
import { icon } from './icons.js';

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
