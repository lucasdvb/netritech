// Your year (G6): the artwork, drawn from your days, with a print to keep. The same days always
// make the same picture.
import { yearData } from '../domain/film.js';
import { drawArt, playYear, savePrint } from '../ceremony/year.js';
import { today } from '../domain/dates.js';
import { trackingStart } from '../domain/habits.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const yearOf = (params) => (/^\d{4}$/.test(params.year || '') ? Number(params.year) : Number(today().slice(0, 4)));

function paint(el, data) {
  const canvas = el.querySelector('.year-art');
  if (!canvas) return;
  const css = Math.min(canvas.parentElement.clientWidth, 520);
  const dpr = Math.min(3, devicePixelRatio || 1);
  canvas.width = canvas.height = Math.round(css * dpr);
  canvas.style.width = canvas.style.height = `${css}px`;
  drawArt(canvas.getContext('2d'), data, { size: canvas.width });
}

export default {
  id: 'year',
  title: 'Your year',
  render({ params }) {
    const y = yearOf(params);
    const data = yearData(y);
    const first = Number(trackingStart().slice(0, 4));
    return html`
      ${pageHead({ title: `Your ${y}`, back: { to: 'progress', label: 'Progress' },
        actions: html`<div class="seg-mini"><button type="button" class="icon-btn icon-btn--sm" data-action="yr" data-d="-1" aria-label="Previous year" ${y <= first ? 'disabled' : ''}>${icon('chevron-left', { size: 18 })}</button>
          <button type="button" class="icon-btn icon-btn--sm" data-action="yr" data-d="1" aria-label="Next year" ${y >= Number(today().slice(0, 4)) ? 'disabled' : ''}>${icon('chevron-right', { size: 18 })}</button></div>` })}
      <p class="lead">One line a day around the circle, as long as the day was full; a blue point for every sealed day. The same days always make the same picture.</p>
      <div class="year-frame" data-key="art-${y}"><canvas class="year-art" role="img" aria-label="Your ${y}: ${data.logged} days you showed up, ${data.sealed} sealed"></canvas></div>
      <p class="year-stats"><b class="tnum">${data.logged}</b> days you showed up · <b class="tnum">${data.sealed}</b> sealed</p>
      <div class="row-actions">
        <button type="button" class="btn btn--primary" data-action="yr-print">${icon('download', { size: 18 })} Save print</button>
        <button type="button" class="btn btn--soft" data-action="yr-play">Watch it draw</button>
      </div>
      <p class="fine-print">The print is 3600 × 4500 pixels: 12 × 15 inches at 300 dpi.</p>`;
  },
  mount(el, { params }) { paint(el, yearData(yearOf(params))); },
  actions: {
    yr: ({ data, params }) => { const y = yearOf(params) + Number(data.d); app.replace(`progress/year/${y}`); },
    'yr-play': ({ params }) => playYear(yearData(yearOf(params))),
    'yr-print': async ({ params, el }) => {
      el.disabled = true;
      try { await savePrint(yearData(yearOf(params))); hap.success(); app.toast('Your print is saved', { icon: 'check' }); }
      catch { app.toast('The print couldn’t be saved this time. Try again.'); }
      finally { el.disabled = false; }
    },
  },
};
