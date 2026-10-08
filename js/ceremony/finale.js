// The season finale (G1), the ceremony: the season's name and intention, its six weeks filling,
// the numbers counting up, the plates and records it earned, and a closing line. It ends on its
// summary and waits; Close leaves.
import * as H from '../domain/habits.js';
import * as S from '../domain/seasons.js';
import { level } from '../domain/levels.js';
import { fmtMD } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { pct } from '../ui/format.js';
import * as sound from '../ui/sound.js';
import { stage, anim, countUp } from './stage.js';

function markup(s) {
  const sum = S.summaryOf(s);
  const plates = [
    ...sum.levels.filter((l) => ['steady', 'second-nature', 'mastered'].includes(l.level)).map((l) => `${H.habit(l.habitId)?.name || 'A habit'} · ${level(l.level)?.name}`),
    ...sum.records.map((r) => `${r.label}: ${r.text}`),
  ].slice(0, 4);
  return { sum, el: html`<div class="cer cer-finale">
    <p class="cer-eyebrow">Six weeks · ${fmtMD(s.start)} to ${fmtMD(s.end)}</p>
    <h2 class="cer-title">${s.name}</h2>
    ${s.intention ? html`<p class="cer-quote">“${s.intention}”</p>` : ''}
    <ol class="cer-weeks" aria-hidden="true">${Array.from({ length: S.WEEKS }, () => html`<li><i></i></li>`)}</ol>
    <div class="cer-stats">
      <div><b class="tnum" data-n="score">${pct(sum.score)}</b><span>plan done</span></div>
      <div><b class="tnum" data-n="sealed">${sum.sealed}</b><span>days sealed</span></div>
      <div><b class="tnum" data-n="workouts">${sum.workouts}</b><span>workouts</span></div>
    </div>
    ${plates.length ? html`<ul class="cer-plates">${plates.map((p) => html`<li><span class="dot"></span>${p}</li>`)}</ul>` : ''}
    <p class="cer-close-line">${s.endedEarly ? 'Ended early. Kept what it gave.' : 'Six weeks. Kept.'}</p>
    <div class="cer-actions"><button type="button" class="btn btn--primary" data-stage-close>Close</button></div>
  </div>` };
}

export function finale(seasonId) {
  const s = S.season(seasonId);
  if (!s) return Promise.resolve({ skipped: true });
  const m = markup(s);
  sound.play('seal');
  return stage({
    name: 'finale',
    label: `${s.name}, the season’s summary`,
    play: (el) => {
      el.insertAdjacentHTML('beforeend', String(m.el));
      const list = [];
      const q = (sel) => el.querySelector(sel);
      anim(list, q('.cer-eyebrow'), [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 150 });
      anim(list, q('.cer-title'), [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 600, delay: 250 });
      if (q('.cer-quote')) anim(list, q('.cer-quote'), [{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 700 });
      el.querySelectorAll('.cer-weeks i').forEach((i, n) => anim(list, i, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 250, delay: 1000 + n * 120 }));
      anim(list, q('.cer-stats'), [{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 1700 });
      countUp(q('[data-n="score"]'), 0, Math.round((m.sum.score || 0) * 100), { delay: 1800, duration: 1000, fmt: (v) => `${Math.round(v)}%` });
      countUp(q('[data-n="sealed"]'), 0, m.sum.sealed, { delay: 1800, duration: 1000 });
      countUp(q('[data-n="workouts"]'), 0, m.sum.workouts, { delay: 1800, duration: 1000 });
      el.querySelectorAll('.cer-plates li').forEach((li, n) => anim(list, li, [{ clipPath: 'inset(0 100% 0 0 round 999px)' }, { clipPath: 'inset(0 0% 0 0 round 999px)' }], { duration: 500, delay: 2900 + n * 300 }));
      anim(list, q('.cer-close-line'), [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 4300 });
      anim(list, q('.cer-actions'), [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 4700 });
      return { duration: 5200, animations: list, keep: true };
    },
    still: (el) => { el.insertAdjacentHTML('beforeend', String(m.el)); el.querySelector('.cer-actions')?.remove(); },
  });
}
