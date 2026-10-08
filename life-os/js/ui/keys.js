// Keyboard shortcuts. 1–4 switch place, J and K move through items, X or Space completes,
// E edits, N logs something, / or ⌘K searches, ? shows them all. Typing in a field always wins.
import { html } from './dom.js';
import * as sheet from './sheet.js';

export const SHORTCUTS = [
  ['1 – 4', 'Today, Plan, Progress, Reflect'],
  ['J / K', 'Next or previous item'],
  ['X or Space', 'Complete the selected item'],
  ['E', 'Edit what you’re looking at'],
  ['N', 'Log something'],
  ['/ or ⌘K', 'Search'],
  ['Esc', 'Close'],
  ['?', 'Show these shortcuts'],
];

const ITEMS = ['.hrow', '.tile', '.counter', '.trow', '.top3-item', '.list > li', '.sort-row', '.goal-list > li', '.wchip', '.counts-item'].map((s) => `#main ${s}`).join(', ');
const FOCUSABLE = 'button:not([disabled]), a[href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
const visible = (el) => el.getClientRects().length > 0;
const typing = (el) => !!el && (el.matches?.('input, textarea, select') || el.isContentEditable);

function move(step) {
  // Only rows you can act on: a row of plain text (a day in This week) is skipped.
  const items = [...document.querySelectorAll(ITEMS)].filter((it) => visible(it) && (it.matches(FOCUSABLE) || it.querySelector(FOCUSABLE)));
  if (!items.length) return;
  const at = items.findIndex((it) => it.contains(document.activeElement));
  const next = items[at < 0 ? (step > 0 ? 0 : items.length - 1) : Math.max(0, Math.min(items.length - 1, at + step))];
  const target = next.matches(FOCUSABLE) ? next : next.querySelector(FOCUSABLE);
  target?.focus();
  target?.scrollIntoView({ block: 'nearest' });
}

function complete(e) {
  const item = document.activeElement?.closest?.(ITEMS);
  const box = item?.querySelector('.check, [role="checkbox"]');
  if (!box) return false;
  // Space on the circle itself already toggles it.
  if (e.key === ' ' && document.activeElement === box) return false;
  e.preventDefault();
  box.click();
  requestAnimationFrame(() => (item.isConnected ? item.querySelector('.check, [role="checkbox"]') : null)?.focus({ preventScroll: true }));
  return true;
}

export function openShortcuts() {
  sheet.open({
    title: 'Keyboard shortcuts',
    render: () => html`<dl class="keys">${SHORTCUTS.map(([k, what]) => html`<div><dt>${k.split(' ').map((p) => (['–', '/', 'or'].includes(p) ? html` <span class="muted">${p}</span> ` : html`<kbd class="kbd">${p}</kbd>`))}</dt><dd>${what}</dd></div>`)}</dl>`,
  });
}

export function attachShortcuts({ places, go, capture, search }) {
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); search(); return; }
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || typing(document.activeElement)) return;
    if (sheet.top()) return; // a sheet keeps its own keys; Esc closes it
    const k = e.key;
    const place = places.find((p) => p.key === k);
    if (place) { e.preventDefault(); go(place.path); return; }
    switch (k.toLowerCase()) {
      case 'j': e.preventDefault(); move(1); break;
      case 'k': e.preventDefault(); move(-1); break;
      case 'x': complete(e); break;
      case ' ': complete(e); break;
      case 'e': {
        const btn = [...document.querySelectorAll('#main [data-action="edit"]')].find(visible);
        if (btn) { e.preventDefault(); btn.click(); }
        break;
      }
      case 'n': e.preventDefault(); capture(); break;
      case '/': e.preventDefault(); search(); break;
      case '?': e.preventDefault(); openShortcuts(); break;
      default:
    }
  });
}
