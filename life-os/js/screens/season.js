// Seasons (G1): six weeks with a name, an intention and three focus habits. The season page shows
// where this one stands, the check-in halfway, and every past season's frozen summary.
import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import * as S from '../domain/seasons.js';
import { suggestFocus } from '../domain/habit-system.js';
import { today, fmtMD, fmtLong, addDays, startOfWeek } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { pct } from '../ui/format.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

/** The quiet line Progress shows while a season runs (or is about to). */
export function seasonLine(date = today()) {
  const s = S.current(date) || S.upcoming(date);
  if (!s) return '';
  const running = s.start <= date;
  return html`<a class="season-line" href="#/progress/season" data-action="nav" data-to="progress/season" data-key="season-line">
    ${icon('flag', { size: 15 })}<span><b>${s.name}</b> · ${running ? `week ${S.weekOf(s, date)} of ${S.WEEKS}` : `starts ${fmtMD(s.start)}`}${s.intention ? html` · <span class="season-intent">${s.intention}</span>` : ''}</span>
    ${icon('chevron-right', { size: 16 })}</a>`;
}

const summaryBlock = (sum) => html`<dl class="facts facts--plain">
  <div><dt>Plan done</dt><dd>${pct(sum.score)}</dd></div>
  <div><dt>Days sealed</dt><dd>${sum.sealed} of ${sum.days}</dd></div>
  <div><dt>Workouts</dt><dd>${sum.workouts}</dd></div>
  ${sum.focus.map((f) => html`<div><dt>${f.name}</dt><dd>${pct(f.ratio)}</dd></div>`)}
  <div><dt>Records</dt><dd>${sum.records.length ? sum.records.map((r) => `${r.label}: ${r.text}`).join(' · ') : '—'}</dd></div>
  <div><dt>Plates</dt><dd>${sum.levels.length || '—'}</dd></div>
</dl>`;

export function openNewSeason() {
  // Your focus three, or (when nothing is in focus yet) the three the habit system would suggest.
  const focus = (H.focusHabits().length ? H.focusHabits() : suggestFocus(3)).map((h) => h.id);
  const start = S.nextStart();
  const mon = startOfWeek(today());
  const ui = { name: '', intention: '', ids: focus.slice(0, 3), start };
  app.sheet({
    title: 'A new season',
    size: 'detent',
    ui,
    render: (s) => {
      const pool = H.activeHabits().filter((h) => !h.optional).sort((a, b) => (s.ui.ids.includes(b.id) - s.ui.ids.includes(a.id)) || (a.order ?? 0) - (b.order ?? 0));
      const moving = H.focusHabits().filter((h) => !s.ui.ids.includes(h.id));
      return html`<div class="form season-new">
        <p class="sheet-note">Six weeks, three habits, one intention. Short enough to stay sharp, long enough to change something.</p>
        <label class="field"><span class="field-label">Name</span><input class="input" data-input="sn-name" value="${s.ui.name}" placeholder="Season ${S.seasons().length + 1}" maxlength="40"></label>
        <label class="field"><span class="field-label">Intention</span><input class="input" data-input="sn-intent" value="${s.ui.intention}" placeholder="One line: who you’ll be by the end" maxlength="120"></label>
        <div class="field"><span class="field-label">Three habits <small>${s.ui.ids.length} of 3</small></span>
          <div class="chips">${pool.slice(0, 18).map((h) => html`<button type="button" class="${cx('chip', s.ui.ids.includes(h.id) && 'is-active')}" data-action="sn-pick" data-id="${h.id}" aria-pressed="${s.ui.ids.includes(h.id)}">${h.name}</button>`)}</div>
          ${moving.length ? html`<p class="field-hint">${moving.map((h) => h.name).join(', ')} move${moving.length === 1 ? 's' : ''} to autopilot.</p>` : ''}</div>
        <div class="field"><span class="field-label">Starts</span>
          <div class="seg seg--compact" role="radiogroup" aria-label="Starts">${[...new Set([start === mon ? mon : null, addDays(mon, 7)].filter(Boolean))].map((d) => html`<button type="button" role="radio" class="seg-btn" aria-checked="${s.ui.start === d}" data-action="sn-start" data-d="${d}">${d === mon ? `This Monday · ${fmtMD(d)}` : `Next Monday · ${fmtMD(d)}`}</button>`)}</div>
          <p class="field-hint">Ends ${fmtLong(addDays(s.ui.start, S.WEEKS * 7 - 1))}.</p></div>
        <button type="button" class="btn btn--primary btn--block" data-action="sn-go" ${s.ui.ids.length ? '' : 'aria-disabled="true"'}>Start the season</button>
      </div>`;
    },
    inputs: {
      'sn-name': ({ value, sheet }) => { sheet.ui.name = value; },
      'sn-intent': ({ value, sheet }) => { sheet.ui.intention = value; },
    },
    actions: {
      'sn-pick': ({ data, sheet }) => {
        const ids = sheet.ui.ids;
        if (ids.includes(data.id)) sheet.ui.ids = ids.filter((x) => x !== data.id);
        else if (ids.length < 3) sheet.ui.ids = [...ids, data.id];
        else { app.toast('Three habits a season. Take one out first.'); return; }
        hap.tap();
        sheet.refresh();
      },
      'sn-start': ({ data, sheet }) => { sheet.ui.start = data.d; hap.tap(); sheet.refresh(); },
      'sn-go': ({ sheet }) => {
        if (!sheet.ui.ids.length) { app.toast('Choose at least one habit.'); return; }
        const { season, undo } = S.create({ name: sheet.ui.name, intention: sheet.ui.intention, habitIds: sheet.ui.ids, start: sheet.ui.start });
        hap.success();
        app.closeSheet(sheet);
        app.toast(`${season.name} ${season.start <= today() ? 'has begun' : `starts ${fmtMD(season.start)}`}`, { icon: 'flag', action: { label: 'Undo', fn: undo } });
        app.go('progress/season');
      },
    },
  });
}

export default {
  id: 'season',
  title: 'Season',
  render({ ui }) {
    const t = today();
    const s = S.current(t);
    const next = S.upcoming(t);
    const past = S.past(t);
    let main;
    if (s) {
      const sum = S.summaryOf(s, t);
      main = html`<section class="season-card" data-key="season-now">
        <p class="section-label">Week ${S.weekOf(s, t)} of ${S.WEEKS} · ${S.daysLeft(s, t)} day${S.daysLeft(s, t) === 1 ? '' : 's'} left</p>
        <h2 class="season-name">${s.name}</h2>
        ${s.intention ? html`<p class="season-quote">“${s.intention}”</p>` : ''}
        <ol class="season-weeks" aria-hidden="true">${Array.from({ length: S.WEEKS }, (_, i) => html`<li class="${cx(i + 1 < S.weekOf(s, t) && 'is-done', i + 1 === S.weekOf(s, t) && 'is-now')}"></li>`)}</ol>
        ${summaryBlock(sum)}
      </section>
      ${S.checkInDue(s, t) ? html`<section class="block" data-key="checkin"><div class="card season-checkin">
        <p class="card-title">Halfway</p>
        <p class="card-lead">Three weeks in. Are these still the right three, and is the intention still true?</p>
        <textarea class="input input--grow" rows="2" data-input="sn-note" placeholder="A line for yourself, optional" aria-label="Halfway note">${ui.note || ''}</textarea>
        <div class="row-actions"><button type="button" class="btn btn--primary btn--sm" data-action="sn-keep">Keep going</button>
          <button type="button" class="btn btn--soft btn--sm" data-action="sn-change">Change a habit</button></div>
      </div></section>` : s.checkIn ? html`<p class="quiet-line">${icon('check', { size: 15 })} Halfway check-in, ${fmtMD(s.checkIn.date)}${s.checkIn.note ? `: ${s.checkIn.note}` : ''}</p>` : ''}
      <button type="button" class="link-btn block" data-action="sn-end">End this season early</button>`;
    } else if (next) {
      main = html`<section class="season-card" data-key="season-next"><p class="section-label">Starts ${fmtLong(next.start)}</p><h2 class="season-name">${next.name}</h2>
        ${next.intention ? html`<p class="season-quote">“${next.intention}”</p>` : ''}
        <p class="card-lead">${next.habitIds.map((id) => H.habit(id)?.name).filter(Boolean).join(' · ')}</p>
        <button type="button" class="link-btn" data-action="sn-cancel">Cancel it</button></section>`;
    } else {
      main = html`<section class="season-card season-card--empty" data-key="season-none">
        <h2 class="season-name">No season running</h2>
        <p class="card-lead">A season is six weeks with a name, three habits and one intention, with a check-in halfway and a summary at the end.</p>
        <button type="button" class="btn btn--primary" data-action="sn-new">Start a season</button></section>`;
    }
    return html`
      ${pageHead({ title: 'Season', back: { to: 'progress', label: 'Progress' } })}
      ${main}
      ${past.length ? html`<section class="block" data-key="past"><div class="block-head"><h2 class="block-title">Past seasons</h2></div>
        ${past.map((p) => html`<div class="card season-past" data-key="sp-${p.id}"><p class="card-title">${p.name}</p>
          <p class="row-sub">${fmtMD(p.start)} – ${fmtMD(p.end)}${p.endedEarly ? ' · ended early' : ''}${p.intention ? ` · “${p.intention}”` : ''}</p>
          ${summaryBlock(S.summaryOf(p))}
          <button type="button" class="link-btn" data-action="sn-finale" data-id="${p.id}">Play the finale</button></div>`)}</section>` : ''}`;
  },
  inputs: { 'sn-note': ({ value, ui }) => { ui.note = value; } },
  actions: {
    'sn-new': () => openNewSeason(),
    'sn-finale': async ({ data }) => (await import('../ceremony/finale.js')).finale(data.id),
    'sn-keep': ({ ui }) => { S.checkIn(S.current(), { note: ui.note || '', keep: true }); hap.success(); app.toast('Halfway noted. Three more weeks.', { icon: 'flag' }); },
    'sn-change': ({ ui }) => { S.checkIn(S.current(), { note: ui.note || '', keep: false }); app.go('plan/habits/sort'); },
    'sn-end': () => {
      const cur = S.current();
      if (!cur) return;
      S.endEarly(cur);
      hap.tap();
      app.toast('Season ended. Its summary is kept.', { icon: 'flag', action: { label: 'Undo', fn: () => store.put('seasons', cur) } });
    },
    'sn-cancel': () => { const n = S.upcoming(); if (!n) return; store.remove('seasons', n.id); app.toast('Season cancelled', { action: { label: 'Undo', fn: () => store.put('seasons', n) } }); },
  },
};

