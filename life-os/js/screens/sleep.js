import * as store from '../data/store.js';
import * as M from '../domain/metrics.js';
import { today, lastNDays, fmtMD, fmtDayShort, relativeDay, parseHM, fmtHM, durationHM } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { barChart } from '../ui/charts.js';
import { num } from '../ui/format.js';
import { openCheckin } from './sheets.js';

/** Bedtimes after midnight count as late evening (e.g. 00:30 → 24:30). */
const bedMinutes = (hm) => { const m = parseHM(hm); return m == null ? null : m < 12 * 60 ? m + 1440 : m; };
const sd = (xs) => { if (xs.length < 2) return null; const a = xs.reduce((p, c) => p + c, 0) / xs.length; return Math.sqrt(xs.reduce((p, c) => p + (c - a) ** 2, 0) / xs.length); };

export default {
  id: 'sleep',
  title: 'Sleep',
  render() {
    const days = lastNDays(today(), 30);
    const entries = store.all('sleepEntries').sort((a, b) => (a.date < b.date ? 1 : -1));
    const t = M.targets();
    if (!entries.length) {
      return html`${pageHead({ title: 'Sleep', back: { to: 'progress/body', label: 'Body' } })}
        ${empty({ ic: 'bed', title: 'No nights logged yet', body: 'The morning check-in takes 30 seconds: bedtime, wake time and how you feel.', cta: 'Morning check-in', action: 'checkin' })}`;
    }
    const since = lastNDays(today(), 14)[0];
    const last14 = entries.filter((e) => e.date >= since);
    const avgH = M.avg(last14.map((e) => e.hours).filter(Boolean));
    const beds = last14.map((e) => bedMinutes(e.bedtime)).filter((x) => x != null);
    const wakes = last14.map((e) => parseHM(e.wake)).filter((x) => x != null);
    const bedSd = sd(beds), wakeSd = sd(wakes);
    const onTarget = last14.filter((e) => e.hours >= t.sleepMinH).length;
    const consistencyText = bedSd == null ? 'Needs a few more nights' : bedSd <= 30 ? 'Very consistent' : bedSd <= 60 ? 'Fairly consistent' : 'Bedtime varies a lot';
    return html`
      ${pageHead({ title: 'Sleep', back: { to: 'progress/body', label: 'Body' }, actions: html`<button type="button" class="btn btn--soft btn--sm" data-action="checkin">Log night</button>` })}
      <div class="stat-row stat-row--3">
        <div class="stat"><p class="stat-label">Last night</p><p class="stat-value tnum">${entries[0].date === today() ? durationHM(entries[0].hours * 60) : '—'}</p><p class="stat-sub">${entries[0].quality ? `quality ${entries[0].quality}/10` : ''}</p></div>
        <div class="stat"><p class="stat-label">Average</p><p class="stat-value tnum">${avgH ? num(avgH, 1) : '—'}<span class="stat-unit">h</span></p><p class="stat-sub">14 nights</p></div>
        <div class="stat"><p class="stat-label">7 h or more</p><p class="stat-value tnum">${onTarget}<span class="stat-unit">/ ${last14.length}</span></p><p class="stat-sub">nights</p></div>
      </div>
      <section class="block">
        <div class="block-head"><h2 class="block-title">Duration</h2><span class="block-meta">30 days · aim ${t.sleepH}–8.5 h</span></div>
        <div class="card">${barChart({ labels: days.map((d) => fmtDayShort(d).slice(0, 1)), tipLabels: days.map(fmtMD), values: days.map((d) => M.sleepHours(d)), color: 'var(--c-posture)', fmt: (v) => durationHM(v * 60), goal: { value: t.sleepH, label: `${t.sleepH} h` } })}</div>
      </section>
      <section class="block">
        <div class="block-head"><h2 class="block-title">Consistency</h2></div>
        <div class="card">
          <p class="card-lead"><strong>${consistencyText}.</strong> A steady bedtime matters more than any single night.</p>
          <dl class="facts facts--plain">
            <div><dt>Typical bedtime</dt><dd class="tnum">${beds.length ? fmtHM(Math.round(M.avg(beds))) : '—'}${bedSd != null ? ` · ±${Math.round(bedSd)} min` : ''}</dd></div>
            <div><dt>Typical wake</dt><dd class="tnum">${wakes.length ? fmtHM(Math.round(M.avg(wakes))) : '—'}${wakeSd != null ? ` · ±${Math.round(wakeSd)} min` : ''}</dd></div>
            <div><dt>Plan</dt><dd>Lights out ${store.profile().bedTime} · up ${store.profile().wakeTime}</dd></div>
          </dl>
        </div>
      </section>
      <section class="block">
        <div class="block-head"><h2 class="block-title">Nights</h2></div>
        <ul class="list">${entries.slice(0, 21).map((e) => {
          const mood = M.mood(e.date);
          return html`<li data-key="${e.id}"><button type="button" class="row" data-action="edit" data-date="${e.date}">
            <span class="row-main"><span class="row-title tnum">${durationHM(e.hours * 60)} <span class="muted">· ${e.bedtime}–${e.wake}</span></span>
              <span class="row-sub">${relativeDay(e.date)}${e.quality ? ` · quality ${e.quality}` : ''}${mood?.energy ? ` · energy ${mood.energy}` : ''}</span></span>
            <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></button></li>`;
        })}</ul>
      </section>`;
  },
  actions: {
    checkin: () => openCheckin(today()),
    edit: ({ data }) => openCheckin(data.date),
  },
};
