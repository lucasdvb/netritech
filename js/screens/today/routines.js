// Routines on Today: the one open now is a numbered sequence with its next step highlighted;
// the others are one line each ("Evening · 0/6 · 19:00") and open in place.
import { on as planOn } from '../../domain/day-plans-core.js';
import * as R from '../../domain/routines.js';
import * as H from '../../domain/habits.js';
import { habitColor } from '../../domain/taxonomy.js';
import { fmtTime } from '../../domain/dates.js';
import { html, cx } from '../../ui/dom.js';
import { icon } from '../../ui/icons.js';
import { check } from '../../ui/controls.js';

function step(p, s, i, date) {
  const h = s.habit;
  const isNext = p.next?.id === s.id;
  const name = s.kind === 'habit' ? h.name : s.label;
  const lv = s.kind === 'habit' ? H.level(h, date) : null;
  const sub = s.kind === 'habit' ? (lv === 'tiny' ? `Tiny version${H.tinyOf(h)?.label ? ` · ${H.tinyOf(h).label}` : ''}` : H.stateOf(h, date) === 'focus' ? 'One of your three' : h.time || '') : s.minutes ? `${s.minutes} min` : '';
  const auto = s.kind === 'habit' && h.source === 'sleep';
  // One of your three inside a routine keeps its tiny version one tap away.
  const canTiny = s.kind === 'habit' && !s.done && H.stateOf(h, date) === 'focus' && H.tinyOf(h) && !h.source && h.type !== 'check';
  return html`<li class="${cx('rstep', s.done && 'is-done', isNext && 'is-next')}" data-key="${p.routine.id}-${s.id}"${s.kind === 'habit' ? html` data-habit="${h.id}" data-swipe="${s.done ? 'off' : 'on'}"` : ''} style="--ic:${s.kind === 'habit' ? habitColor(h) : 'var(--accent)'}">
    ${auto ? html`<span class="${cx('auto-ic', s.done && 'is-done')}">${s.done ? icon('check', { size: 16, stroke: 2.2 }) : icon('bed', { size: 16 })}</span>`
      : check(s.done, { action: 'step', data: { r: p.routine.id, s: s.id }, label: `${name}${s.done ? ', done' : ''}`, state: lv === 'tiny' ? 'tiny' : undefined, cls: 'rstep-check' })}
    <button type="button" class="rstep-main" data-action="${s.kind === 'habit' ? 'habit' : 'step'}" data-id="${h?.id || ''}" data-r="${p.routine.id}" data-s="${s.id}">
      <span class="rstep-n tnum" aria-hidden="true">${i + 1}</span>
      <span class="rstep-text"><span class="rstep-name">${name}</span>${sub ? html`<span class="rstep-sub">${sub}</span>` : ''}</span>
    </button>
    ${canTiny ? html`<button type="button" class="tiny-btn" data-action="tiny" data-id="${h.id}" aria-label="Log the tiny version of ${h.name}${H.tinyOf(h).label ? `: ${H.tinyOf(h).label}` : ''}">Tiny</button>` : ''}
  </li>`;
}

function card(p, open, date) {
  const r = p.routine;
  const when = p.complete ? (p.completedAt ? `Done ${fmtTime(new Date(p.completedAt))}` : 'Done') : `${planOn(date).window(r)?.from || ''}`;
  return html`<section class="${cx('routine', open && 'is-open', p.complete && 'is-complete')}" data-key="r-${r.id}" aria-label="${r.name} routine">
    <button type="button" class="routine-head" data-action="routine" data-id="${r.id}" aria-expanded="${open}">
      <span class="routine-ic">${p.complete ? icon('check', { size: 16, stroke: 2.2 }) : icon(R.iconOf(r), { size: 16 })}</span>
      <span class="routine-name">${r.name}</span>
      <span class="routine-meta tnum">${p.done}/${p.total} · ${when}</span>
      ${icon('chevron-down', { size: 18, cls: 'routine-chev' })}
    </button>
    ${open ? html`<div class="routine-body">
      <ol class="rsteps">${p.steps.map((s, i) => step(p, s, i, date))}</ol>
      <div class="routine-foot">
        ${!p.complete && p.total - p.done > 1 ? html`<button type="button" class="btn btn--soft btn--sm" data-action="did-it-all" data-r="${r.id}">${icon('check', { size: 16 })} Did it all</button>` : ''}
        <button type="button" class="link-btn" data-action="edit-routine" data-id="${r.id}">Edit routine</button>
      </div>
    </div>` : ''}
  </section>`;
}

/** All of today's routines: the current one open, the rest one line each unless you opened them. */
export function routinesBlock(date, ui) {
  const list = R.forDay(date);
  if (!list.length) return '';
  const cur = R.current(date);
  const isOpen = (p) => ui.routines?.[p.routine.id] ?? cur?.routine.id === p.routine.id;
  return html`<div class="routines" data-key="routines">${list.map((p) => card(p, isOpen(p), date))}</div>`;
}
