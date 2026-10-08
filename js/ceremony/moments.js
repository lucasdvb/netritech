// Moments (1–2 s, inline, never blocking): a fine blue line draws around the card it belongs to,
// and a plate engraves at the bottom of the screen with a light passing over it. At most one per
// action; tap the plate to let it go. Under reduced motion the plate simply appears.
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { reducedMotion } from '../ui/motion.js';
import * as hap from '../ui/haptics.js';
import * as sound from '../ui/sound.js';
import { focusWord } from '../domain/habits.js';

/** Draw a fine blue line around an element, then let it fade. */
export function outline(el, { hold = 900 } = {}) {
  if (!el?.isConnected || reducedMotion()) return;
  const r = el.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight || !r.width) return;
  const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 16;
  const pad = 3;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'moment-outline');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('width', r.width + pad * 2);
  svg.setAttribute('height', r.height + pad * 2);
  Object.assign(svg.style, { left: `${r.left - pad + scrollX}px`, top: `${r.top - pad + scrollY}px` });
  svg.innerHTML = `<rect x="1.5" y="1.5" width="${r.width + pad * 2 - 3}" height="${r.height + pad * 2 - 3}" rx="${radius + pad}" pathLength="1" />`;
  document.body.appendChild(svg);
  const rect = svg.firstChild;
  rect.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 800, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'both' });
  svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, delay: 800 + hold, fill: 'both' }).finished.then(() => svg.remove()).catch(() => svg.remove());
}

let plateEl = null;
let plateTimer = 0;

/** A plate engraving at the bottom of the screen: { icon, title, sub, action: { label, fn } }. */
export function plate({ icon: ic = 'star', title, sub = '', action = null }) {
  plateEl?.remove();
  clearTimeout(plateTimer);
  const el = document.createElement('div');
  el.className = 'moment-plate';
  el.setAttribute('role', 'status');
  el.innerHTML = String(html`<span class="moment-plate-ic">${icon(ic, { size: 20 })}</span>
    <span class="moment-plate-text"><strong>${title}</strong>${sub ? html`<span>${sub}</span>` : ''}</span>
    ${action ? html`<button type="button" class="btn btn--sm btn--soft" data-moment-act>${action.label}</button>` : ''}
    <span class="moment-sweep" aria-hidden="true"></span>`);
  document.body.appendChild(el);
  plateEl = el;
  const close = () => { if (!el.isConnected) return; el.classList.remove('is-open'); setTimeout(() => el.remove(), 260); };
  el.addEventListener('click', (e) => { if (e.target.closest('[data-moment-act]')) action?.fn(); close(); });
  requestAnimationFrame(() => el.classList.add('is-open'));
  if (!reducedMotion()) {
    el.animate([{ clipPath: 'inset(0 100% 0 0 round 30px)' }, { clipPath: 'inset(0 0% 0 0 round 30px)' }], { duration: 650, easing: 'cubic-bezier(.2, .8, .2, 1)', fill: 'both' });
    el.querySelector('.moment-sweep').animate([{ transform: 'translateX(-120%)' }, { transform: 'translateX(420%)' }], { duration: 900, delay: 500, easing: 'ease-in-out', fill: 'both' });
  }
  plateTimer = setTimeout(close, action ? 6500 : 3800);
  return el;
}

/** Show one progression moment (from domain/progression.js). */
export function show(m, { go } = {}) {
  hap.success();
  sound.play('moment');
  if (m.kind === 'level') {
    outline(document.querySelector(`[data-habit="${m.habitId}"]`));
    return plate({ icon: m.level === 'mastered' ? 'medal' : 'star', title: `${m.name} · ${m.levelName}`, sub: `${m.at} time${m.at === 1 ? '' : 's'}, engraved today` });
  }
  if (m.kind === 'comeback') {
    outline(document.querySelector(`[data-habit="${m.habitId}"]`));
    return plate({ icon: 'rotate-ccw', title: `Back to ${m.name}`, sub: m.count > 1 ? `Coming back is the habit. ${m.count} this month.` : 'Coming back is the habit.' });
  }
  if (m.kind === 'focus') {
    outline(document.querySelector('.now'));
    return plate({ icon: 'check', title: `Your ${focusWord()} are done`, sub: 'Everything else today is a bonus.' });
  }
  if (m.kind === 'record') return plate({ icon: 'medal', title: 'New record', sub: `${m.label}: ${m.value}` });
  if (m.kind === 'reward') return plate({ icon: 'trophy', title: `Unlocked: ${m.title}`, sub: 'Earned by what really happened.' });
  if (m.kind === 'season') return plate({ icon: 'flag', title: `${m.name} is complete`, sub: 'Six weeks, summed up.', action: { label: 'See the finale', fn: () => go?.(m) } });
  return plate({ icon: m.icon || 'star', title: m.text });
}
