// Seal the day (G5), the ceremony: the day's card appears, folds into its tile in the week, the
// tile fills, and the day is closed. About three seconds, tap to skip; under reduced motion a
// still card says the same.
import * as S from '../domain/story.js';
import { dayScore } from '../domain/scoring.js';
import { reviewOf } from '../domain/day.js';
import { fmtDay, fmtDayLetter } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { pct } from '../ui/format.js';
import * as hap from '../ui/haptics.js';
import * as sound from '../ui/sound.js';
import { stage, anim } from './stage.js';

function scene(date) {
  const sc = dayScore(date);
  const w = S.week(date);
  const win = reviewOf(date).win;
  return {
    sc, win, day: fmtDay(date),
    markup: html`<div class="cer cer-seal">
      <div class="cer-day"><p class="cer-eyebrow">${fmtDay(date)}${sc.total ? ` · ${sc.done} of ${sc.total}` : ''}</p>
        <p class="cer-big tnum">${sc.ratio != null ? pct(sc.ratio) : '—'}</p>${win ? html`<p class="cer-line">Win: ${win}</p>` : ''}</div>
      <ol class="cer-week" aria-hidden="true">${w.days.map((d) => html`<li class="${d.date === date ? 'is-today' : ''}"><span class="cer-letter">${fmtDayLetter(d.date)}</span>
        <span class="cer-tile"><span class="cer-fill" style="opacity:${d.date === date ? 0 : d.ratio != null ? (0.25 + d.ratio * 0.75).toFixed(2) : 0}"></span></span></li>`)}</ol>
      <p class="cer-done">${fmtDay(date)} is sealed. Rest well.</p>
    </div>`,
  };
}

/** Play the ceremony for a sealed day. Resolves when it's over. */
export function sealCeremony(date) {
  const s = scene(date);
  hap.play('seal');
  sound.play('seal');
  return stage({
    name: 'seal',
    label: `${s.day} is sealed`,
    play: (el) => {
      el.insertAdjacentHTML('beforeend', String(s.markup));
      const list = [];
      const day = el.querySelector('.cer-day');
      const tile = el.querySelector('.is-today .cer-tile');
      anim(list, day, [{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 350 });
      anim(list, el.querySelector('.cer-week'), [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 200 });
      // fold: the card travels into today's tile
      const a = day.getBoundingClientRect();
      const b = tile.getBoundingClientRect();
      const k = b.width / a.width;
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      anim(list, day, [{ transform: 'none', borderRadius: '30px' }, { transform: `translate(${dx}px, ${dy}px) scale(${k}, ${(b.height / a.height).toFixed(4)})`, borderRadius: '30px' }],
        { duration: 900, delay: 750, easing: 'cubic-bezier(.65, 0, .35, 1)' });
      for (const c of day.children) anim(list, c, [{ opacity: 1 }, { opacity: 0 }], { duration: 280, delay: 750 });
      anim(list, day, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, delay: 1600 });
      anim(list, el.querySelector('.is-today .cer-fill'), [{ opacity: 0 }, { opacity: s.sc.ratio != null ? 0.25 + s.sc.ratio * 0.75 : 1 }], { duration: 250, delay: 1560 });
      anim(list, tile, [{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 300, delay: 1700 });
      anim(list, el.querySelector('.cer-done'), [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'none' }], { duration: 450, delay: 1850 });
      return { duration: 3300, animations: list };
    },
    still: (el) => {
      el.insertAdjacentHTML('beforeend', String(s.markup));
      el.querySelector('.is-today .cer-fill').style.opacity = s.sc.ratio != null ? 0.25 + s.sc.ratio * 0.75 : 1;
    },
  });
}
