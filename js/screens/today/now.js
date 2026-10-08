// The Now card: today's score and the one next action. Skip moves to the next candidate; when
// nothing is left it becomes the done-for-today state.
import * as M from '../../domain/metrics.js';
import { dayScore, rolling, band, pct } from '../../domain/scoring.js';
import { nextActions, doneState } from '../../domain/next-action.js';
import { lastNDays, fmtDayLetter, fmtDay } from '../../domain/dates.js';
import * as H from '../../domain/habits.js';
import { html, raw, cx } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { ring } from '../../ui/components.js';

const button = (a, cls) => {
  if (!a) return '';
  const d = Object.entries(a.data || {}).map(([k, v]) => ` data-${k}="${String(v).replace(/"/g, '&quot;')}"`).join('');
  return html`<button type="button" class="${cls}" data-action="${a.act}"${raw(d)}>${a.label}</button>`;
};

function scoreChip(date) {
  const s = dayScore(date);
  if (s.mode === 'sick') return html`<div class="now-score is-paused" aria-label="Score paused on a sick day">${ring(0, { size: 56, stroke: 5 })}<span class="now-score-ic">${icon('thermometer', { size: 18 })}</span></div>`;
  const p = Math.round((s.ratio || 0) * 100);
  return html`<div class="now-score" data-action="plan" aria-hidden="true">${ring(s.ratio || 0, { size: 56, stroke: 5 })}
    <span class="now-pct tnum" data-tween="${p}" data-tween-suffix="%"><span data-tween-text>${p}%</span></span></div>`;
}

function scoreLine(date) {
  const s = dayScore(date);
  if (s.mode === 'sick') return html`<p class="now-meta">Sick day · the score is paused</p>`;
  const r7 = rolling(date, 7);
  const b = band(r7.ratio);
  return html`<button type="button" class="now-meta now-meta--btn" data-action="plan" aria-label="${s.total ? `${s.done} of ${s.total} planned done${s.tiny ? `, ${s.tiny} tiny` : ''}` : 'Nothing planned yet'}. What counts today">
    <span class="tnum">${s.total ? html`${s.done} of ${s.total} planned${s.tiny ? html` · ${s.tiny} tiny` : ''}` : 'Nothing planned yet'}</span>
    ${r7.ratio != null && r7.days >= 3 ? html`<span class="now-week">· 7 days <strong class="tnum">${pct(r7.ratio)}</strong> <span class="band band--${b.key}">${b.label}</span></span>` : ''}
    ${icon('chevron-right', { size: 16, cls: 'now-chev' })}</button>`;
}

/** The week as seven small bars (past days, a review). */
function week(date) {
  return html`<div class="mini-bars" aria-label="Last 7 days">${lastNDays(date, 7).map((d) => {
    const s = dayScore(d);
    return html`<span class="${cx('mini-bar', d === date && 'is-today', (d < H.trackingStart() || s.mode === 'sick') && 'is-off')}" title="${fmtDay(d)}: ${pct(s.ratio)}"><i style="--h:${Math.max(0.06, Math.round((s.ratio || 0) * 100) / 100)}"></i><b>${fmtDayLetter(d)}</b></span>`;
  })}</div>`;
}

/** The action to show, after any you've skipped. */
export function pick(date, ui, now = new Date()) {
  const list = nextActions(date, now);
  const skipped = new Set(ui.skipped || []);
  return { action: list.find((c) => !skipped.has(c.id)) || null, left: list.filter((c) => !skipped.has(c.id)).length, skipped: skipped.size };
}

export function nowCard(date, isToday, ui) {
  if (!isToday) {
    return html`<section class="now now--past" data-key="now" aria-label="Score">
      <div class="now-top">${scoreChip(date)}<div class="now-top-text"><p class="now-eyebrow">Looking back</p>${scoreLine(date)}</div></div>
      ${week(date)}
    </section>`;
  }
  const { action, left, skipped } = pick(date, ui);
  const a = action || doneState(date);
  const done = a.kind === 'done';
  const win = M.review(date)?.win || '';
  return html`<section class="${cx('now', `now--${a.kind}`)}" data-key="now" aria-label="Next action">
    <div class="now-top">${scoreChip(date)}<div class="now-top-text">${scoreLine(date)}</div></div>
    <div class="now-body" data-key="now-${a.id}">
      <p class="now-eyebrow">${a.eyebrow}</p>
      <h2 class="now-title">${a.title}</h2>
      ${a.sub ? html`<p class="now-sub">${a.sub}</p>` : ''}
    </div>
    ${done ? html`<label class="now-win"><span class="sr-only">Win of the day</span>${icon('star', { size: 15 })}
        <input class="now-win-input" value="${win}" placeholder="One win from today (optional)" data-change="win" maxlength="160" enterkeyhint="done"></label>
        ${skipped ? html`<button type="button" class="link-btn now-skip" data-action="unskip">Show what I skipped</button>` : ''}`
      : html`<div class="now-actions">
        ${button(a.primary, 'btn btn--primary now-go')}
        ${button(a.secondary, 'btn btn--ghost now-alt')}
        ${left > 1 || a.kind === 'suggestion' ? html`<button type="button" class="link-btn now-skip" data-action="skip" data-id="${a.id}">Not now</button>` : ''}
      </div>`}
  </section>`;
}
