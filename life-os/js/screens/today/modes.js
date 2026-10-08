// Minimum and sick days: the essentials, tiles for what's measured and a way back to a normal
// day. Only those days need this, so Today loads it when the day's mode asks for it.
import * as H from '../../domain/habits.js';
import { html } from '../../ui/dom.js';
import { habitRow, metricTile, METRIC_SOURCES } from './rows.js';
import { essentials } from './blocks.js';

export function minimumBlock(date, ui) {
  const list = H.activeHabits().filter((h) => H.dueOn(h, date, 'minimum'));
  const tiles = list.filter((h) => METRIC_SOURCES.includes(h.source));
  const rows = list.filter((h) => !tiles.includes(h));
  return html`<section class="minday" data-key="minday">
    <div class="minday-head"><p class="minday-title">${essentials()} essentials</p><p class="minday-sub">Never abandon the system completely. This is enough today.</p></div>
    ${tiles.length ? html`<div class="tiles">${tiles.map((h) => metricTile(h, date, 'minimum'))}</div>` : ''}
    <ul class="hlist">${rows.map((h) => habitRow(h, date, 'minimum', ui))}</ul>
    <button type="button" class="link-btn" data-action="set-mode" data-mode="normal">Back to a normal day</button>
  </section>`;
}

export function sickBlock(date, ui) {
  const list = H.activeHabits().filter((h) => H.dueOn(h, date, 'sick'));
  const tiles = list.filter((h) => METRIC_SOURCES.includes(h.source));
  const rows = list.filter((h) => !tiles.includes(h));
  return html`<section class="minday minday--sick" data-key="sick">
    <div class="minday-head"><p class="minday-title">Rest. Fluids. Food. Sleep.</p>
      <p class="minday-sub">No hard training, no calorie deficit, no forced cardio. Get medical care if you need it. Training resumes gradually.</p></div>
    ${tiles.length ? html`<div class="tiles">${tiles.map((h) => metricTile(h, date, 'sick'))}</div>` : ''}
    <ul class="hlist">${rows.map((h) => habitRow(h, date, 'sick', ui))}</ul>
    <button type="button" class="link-btn" data-action="set-mode" data-mode="normal">I’m feeling better</button>
  </section>`;
}

