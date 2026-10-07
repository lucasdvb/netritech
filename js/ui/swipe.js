// Swipe-left-to-reveal actions on list rows marked [data-swipe].
// The same actions stay reachable without gestures (detail screens, menus).
export function attachSwipe(root) {
  let s = null;
  const close = (except) => root.querySelectorAll('.swipe.is-open').forEach((el) => {
    if (el !== except) { el.classList.remove('is-open'); el.querySelector('.swipe-content').style.transform = ''; }
  });
  root.addEventListener('pointerdown', (e) => {
    const row = e.target.closest('[data-swipe]');
    if (!row || e.target.closest('.swipe-btn') || e.pointerType === 'mouse') { if (!e.target.closest('.swipe-btn')) close(); return; }
    close(row);
    s = { row, x: e.clientX, y: e.clientY, dx: 0, locked: null, open: row.classList.contains('is-open') };
  });
  root.addEventListener('pointermove', (e) => {
    if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (s.locked == null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) s.locked = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    if (s.locked !== 'x') return;
    s.dx = Math.min(0, (s.open ? -88 : 0) + dx);
    s.row.querySelector('.swipe-content').style.transform = `translateX(${Math.max(-120, s.dx)}px)`;
    s.row.classList.add('is-dragging');
  });
  const end = () => {
    if (!s) return;
    const { row, dx, locked } = s;
    s = null;
    row.classList.remove('is-dragging');
    if (locked !== 'x') return;
    const content = row.querySelector('.swipe-content');
    if (dx < -50) { row.classList.add('is-open'); content.style.transform = 'translateX(-88px)'; }
    else { row.classList.remove('is-open'); content.style.transform = ''; }
    const block = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    content.addEventListener('click', block, { capture: true, once: true });
    setTimeout(() => content.removeEventListener('click', block, { capture: true }), 50);
  };
  root.addEventListener('pointerup', end);
  root.addEventListener('pointercancel', end);
}
