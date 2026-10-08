// Screen changes. Where the browser has View Transitions, the old screen hands over to the new
// one in a single animation, and the title you tapped (a habit, a goal, an entry) grows into
// the next screen's title: a morph. Elsewhere, or with reduced motion, the CSS entrances run.

let tapped = null; // the data-morph key of what was just tapped

document.addEventListener('click', (e) => {
  const host = e.target.closest?.('a, button, [data-action]');
  const m = host?.matches('[data-morph]') ? host : host?.querySelector('[data-morph]');
  tapped = m?.dataset.morph || null;
}, true);

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
export const supported = () => typeof document.startViewTransition === 'function' && !reducedMotion();

const named = (el) => { if (el) el.style.viewTransitionName = 'morph'; };
const find = (root, key) => (key ? root.querySelector(`[data-morph="${CSS.escape(key)}"]`) : null);

/** Run update() as one transition. dir is 'push', 'pop' or 'fade'. Returns true if it animated. */
export function swap(update, dir = 'fade', root = document) {
  const key = tapped;
  tapped = null;
  if (!supported()) { update(); return false; }
  const from = find(root, key);
  if (from && from.getClientRects().length) named(from);
  document.documentElement.dataset.nav = dir;
  let to = null;
  const t = document.startViewTransition(() => {
    if (from) from.style.viewTransitionName = '';
    try { update(); } catch (err) { console.error(err); }
    to = find(document.querySelector('#main') || document, key);
    if (from && to) named(to);
  });
  const done = () => {
    if (to) to.style.viewTransitionName = '';
    delete document.documentElement.dataset.nav;
  };
  t.finished.then(done, done);
  t.ready.catch(() => {});
  return true;
}
