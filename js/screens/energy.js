// Review › Energy: a one-tap check-in of how your energy is right now, and your own curve through
// the day from them. Once there are five days of check-ins, the hours where it's reliably highest
// are named as your peak, and the morning briefing and Your day suggest deep work there.
import * as EN from '../domain/energy.js';
import { today, fmtHM, minutesOfDay } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { pageHead } from '../ui/components.js';
import { barChart } from '../ui/charts.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

/** The five buttons of a check-in (used here and in the + sheet). */
export function checkInRow({ action = 'en-log' } = {}) {
  const last = EN.latest();
  return html`<div class="energy-row" role="group" aria-label="How is your energy right now?">
    ${EN.LEVELS.map(([n, label]) => html`<button type="button" class="energy-btn" data-action="${action}" data-level="${n}" aria-pressed="${last?.level === n && last.time === fmtHM(minutesOfDay(new Date()))}">
      <span class="energy-n tnum">${n}</span><span class="energy-label">${label}</span></button>`)}
  </div>`;
}

export function logEnergy(level) {
  const { rec, undo } = EN.log(level);
  hap.tap();
  app.toast(`Energy ${rec.level} of 5 at ${rec.time}`, { action: { label: 'Undo', fn: undo } });
}

/** The check-in on its own, from the + sheet. */
export function openEnergy() {
  app.sheet({
    title: 'Your energy right now',
    render: () => html`<div class="form">${checkInRow({ action: 'en-pick' })}<p class="sheet-note">A few check-ins a day for a week or two show when you’re at your sharpest.</p></div>`,
    actions: { 'en-pick': ({ data, sheet }) => { app.closeSheet(sheet); logEnergy(Number(data.level)); } },
  });
}

export default {
  id: 'energy',
  title: 'Energy',
  render() {
    const c = EN.curve();
    const peak = EN.peak();
    const wait = EN.daysToPeak();
    const todays = EN.logs(today());
    return html`
      ${pageHead({ title: 'Energy', back: { to: 'review', label: 'Review' },
        info: 'Check in whenever you notice your energy, a few times a day for a week or two. Your curve shows the average by time of day; the peak is named once five days have check-ins and a window is clearly higher than your lowest one. Most people are sharpest a few hours after waking, but your own pattern beats the average.' })}
      <section class="card energy-card"><p class="section-label">Right now</p>${checkInRow()}
        ${todays.length ? html`<p class="muted small">Today: ${todays.map((l) => `${l.time} · ${l.level}`).join('  ')}</p>` : ''}</section>
      <section class="block"><div class="block-head"><h2 class="block-title">Your day’s energy</h2><span class="block-meta">last 4 weeks</span></div>
        <div class="card">${c.windows.some((w) => w.avg != null)
          ? barChart({ labels: c.windows.map((w) => w.from.slice(0, 2)), tipLabels: c.windows.map((w) => `${w.from}–${w.to}${w.n ? ` · ${w.n} check-ins` : ''}`), values: c.windows.map((w) => (w.avg == null ? null : Math.round(w.avg * 10) / 10)), max: 5, highlightLast: false, fmt: (v) => `${v} of 5` })
          : html`<p class="muted">No check-ins yet. A tap above, a few times a day, builds the curve.</p>`}
          <p class="energy-peak">${peak ? EN.peakLine(peak) : wait ? `${wait} more day${wait === 1 ? '' : 's'} of check-ins and your peak hours are named.` : 'No clear peak yet: your energy is about the same all day, or the check-ins are spread thin.'}</p>
        </div></section>`;
  },
  actions: {
    'en-log': ({ data }) => logEnergy(Number(data.level)),
  },
};
