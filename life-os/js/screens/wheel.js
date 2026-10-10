// Review › Life wheel: once a quarter, eight areas of your life from 1 to 10. The radar shows the
// shape (last quarter's beside it), the changes say which way each moved, and the weakest area
// becomes the suggested focus of your next season.
import * as WH from '../domain/wheel.js';
import { html, raw, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import * as hap from '../ui/haptics.js';

const pts = (list) => list.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

/** The radar: this quarter filled, last quarter as an outline. */
export function radarSvg(scores, prev) {
  const now = WH.radar(scores);
  const before = prev ? WH.radar(prev) : null;
  const rings = [2, 4, 6, 8, 10].map((n) => pts(WH.radar(Object.fromEntries(WH.AREAS.map((a) => [a.id, n])))));
  return html`<svg class="wheel-svg" viewBox="0 0 240 240" role="img" aria-label="${WH.AREAS.map((a) => `${a.label} ${scores?.[a.id] ?? 'not rated'}`).join(', ')}">
    ${rings.map((r) => raw(`<polygon class="wheel-ring" points="${r}"/>`))}
    ${now.map((p) => raw(`<line class="wheel-axis" x1="120" y1="120" x2="${p.ax.toFixed(1)}" y2="${p.ay.toFixed(1)}"/>`))}
    ${before ? raw(`<polygon class="wheel-prev" points="${pts(before)}"/>`) : ''}
    ${raw(`<polygon class="wheel-now" points="${pts(now)}"/>`)}
    ${now.map((p) => (scores?.[p.area.id] != null ? raw(`<circle class="wheel-dot" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3"/>`) : ''))}
  </svg>`;
}

export default {
  id: 'wheel',
  title: 'Life wheel',
  render() {
    const q = WH.quarterOf();
    const c = WH.check(q) || { scores: {} };
    const p = WH.previous(q);
    const done = WH.complete(c);
    const weak = done ? WH.weakest(q) : null;
    const ch = WH.changes(q);
    const sugg = done ? WH.seasonSuggestion(q) : null;
    return html`
      ${pageHead({ title: 'Life wheel', eyebrow: q.replace('-', ' · '), back: { to: 'review', label: 'Review' },
        info: 'Once a quarter, rate each area of your life from 1 (neglected) to 10 (thriving), as it feels today, in about two minutes. The shape shows the balance; last quarter is the outline. The weakest area is suggested as the focus of your next six-week season.' })}
      <div class="wheel-wrap card">${radarSvg(c.scores, p?.scores)}
        <ul class="wheel-legend">${WH.AREAS.map((a) => html`<li><span>${a.label}</span><b class="tnum">${c.scores?.[a.id] ?? '—'}</b></li>`)}</ul></div>
      <section class="block"><div class="block-head"><h2 class="block-title">${done ? 'This quarter' : 'Rate each area'}</h2></div>
        <ul class="wheel-rate">${WH.AREAS.map((a) => html`<li data-key="wr-${a.id}"><span class="wheel-area">${a.label}${ch.find((x) => x.area.id === a.id && x.change) ? html` <small class="tnum">${ch.find((x) => x.area.id === a.id).change > 0 ? '+' : ''}${ch.find((x) => x.area.id === a.id).change}</small>` : ''}</span>
          <div class="wheel-scale" role="radiogroup" aria-label="${a.label}">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => html`<button type="button" role="radio" class="${cx('wheel-n', c.scores?.[a.id] === n && 'is-on')}" aria-checked="${c.scores?.[a.id] === n}" aria-label="${a.label}: ${n}" data-action="wh-rate" data-a="${a.id}" data-n="${n}">${n}</button>`)}</div></li>`)}</ul></section>
      ${weak ? html`<section class="card wheel-focus" data-key="wheel-focus"><p class="section-label">Weakest this quarter</p>
          <p class="card-title">${weak.label} · ${weak.score} of 10</p>
          <p class="muted">${sugg.intention}${sugg.habitIds.length ? ' Your habits in this area are picked to start with.' : ' Choose one or two habits that would move it.'}</p>
          <button type="button" class="btn btn--primary btn--block" data-action="wh-season">${icon('flag', { size: 16 })} Make it my next season</button></section>` : ''}
      <label class="field block"><span class="field-label">A note for this quarter <small>optional</small></span>
        <textarea class="input" rows="2" data-change="wh-note" placeholder="What’s behind the scores">${c.note || ''}</textarea></label>`;
  },
  inputs: { 'wh-note': ({ value }) => { WH.note(value); } },
  actions: {
    'wh-rate': ({ data }) => { WH.rate(data.a, Number(data.n)); hap.tap(); },
    'wh-season': async () => {
      const s = WH.seasonSuggestion();
      if (s) (await import('./season.js')).openNewSeason({ name: s.name, intention: s.intention, habitIds: s.habitIds });
    },
  },
};
