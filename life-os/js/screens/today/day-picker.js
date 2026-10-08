// Pick a day to look back on: a month at a time, with each day's score as a quiet fill.
import { dayScore } from '../../domain/scoring.js';
import { today, startOfMonth, addMonths, weekday, fmtMonth, fmtLong, range, endOfMonth } from '../../domain/dates.js';
import { html, cx } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { app } from '../../ui/app-api.js';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function openDayPicker(current) {
  app.sheet({
    title: 'Go to a day',
    ui: { month: startOfMonth(current) },
    render: (s) => {
      const m = s.ui.month;
      const lead = weekday(m) - 1;
      const days = range(m, endOfMonth(m));
      const t = today();
      return html`<div class="dpick">
        <div class="dpick-head">
          <button type="button" class="icon-btn icon-btn--sm" data-action="month" data-delta="-1" aria-label="Previous month">${icon('chevron-left', { size: 18 })}</button>
          <p class="dpick-month">${fmtMonth(m)}</p>
          <button type="button" class="icon-btn icon-btn--sm" data-action="month" data-delta="1" aria-label="Next month"${m >= startOfMonth(t) ? ' disabled' : ''}>${icon('chevron-right', { size: 18 })}</button>
        </div>
        <div class="dpick-grid" role="grid" aria-label="${fmtMonth(m)}">
          ${DOW.map((d) => html`<span class="dpick-dow" aria-hidden="true">${d}</span>`)}
          ${Array.from({ length: lead }, () => html`<span></span>`)}
          ${days.map((d) => {
            const future = d > t;
            const r = future ? null : dayScore(d).ratio;
            return html`<button type="button" class="${cx('dpick-day', d === current && 'is-on', d === t && 'is-today')}" data-action="pick" data-d="${d}"
              aria-label="${fmtLong(d)}${r != null ? `, ${Math.round(r * 100)}%` : ''}"${future ? ' disabled' : ''} style="--fill:${r ?? 0}"><span class="tnum">${Number(d.slice(8))}</span></button>`;
          })}
        </div>
        <button type="button" class="btn btn--soft btn--block" data-action="pick" data-d="${t}">Today</button>
      </div>`;
    },
    actions: {
      month: ({ data, sheet }) => { sheet.ui.month = addMonths(sheet.ui.month, Number(data.delta)); sheet.refresh(); },
      pick: ({ data, sheet }) => { app.closeSheet(sheet); app.replace(data.d === today() ? 'today' : `today/${data.d}`); },
    },
  });
}
