// The focus timer sheet: pick a length (and, if you like, what it's for) and start; while a block
// runs, the time left, pause, finish early (it counts the minutes so far) or stop.
import * as F from '../domain/focus.js';
import { reviewOf } from '../domain/day.js';
import { today } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const bar = () => import('../ui/focus-bar.js').then((m) => m.sync());

export function openFocus() {
  let tick = 0;
  const s = app.sheet({
    title: 'Focus',
    size: 'detent',
    ui: { minutes: 25, label: '' },
    render: (sh) => {
      const t = F.current();
      const r = reviewOf(today());
      const sofar = r.deepWork ? `${r.deepWork} block${r.deepWork === 1 ? '' : 's'} today${r.focusMinutes ? ` · ${r.focusMinutes} min` : ''}` : 'No focus blocks yet today';
      if (t) {
        return html`<div class="form focus-sheet">
          <p class="focus-clock tnum" id="focus-clock" role="timer" aria-live="off">${F.clock(F.remaining(t))}</p>
          <p class="focus-for">${t.pausedAt ? 'Paused' : t.label || `${t.minutes}-minute block`}</p>
          <div class="btn-row">
            <button type="button" class="btn btn--soft" data-action="${t.pausedAt ? 'resume' : 'pause'}">${icon(t.pausedAt ? 'play' : 'pause', { size: 16 })} ${t.pausedAt ? 'Resume' : 'Pause'}</button>
            <button type="button" class="btn btn--primary" data-action="finish">${icon('check', { size: 16 })} Finish now</button>
          </div>
          <button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="stop">Stop without counting</button>
          <p class="field-hint center">${sofar}</p>
        </div>`;
      }
      return html`<div class="form focus-sheet">
        <p class="sheet-note">One thing, no switching. When the time is up it counts as a focus block for today.</p>
        <label class="field"><span class="field-label">What for <small>optional</small></span>
          <input class="input" value="${sh.ui.label}" data-input="label" maxlength="60" placeholder="e.g. Client proposal" enterkeyhint="done"></label>
        <div class="field"><span class="field-label">How long</span>
          <div class="chips" role="group" aria-label="How long">${F.LENGTHS.map((m) => html`<button type="button" class="${cx('chip', sh.ui.minutes === m && 'is-active')}" aria-pressed="${sh.ui.minutes === m}" data-action="len" data-m="${m}">${m} min</button>`)}
            <span class="input-unit focus-own"><input type="number" inputmode="numeric" min="5" max="180" step="5" value="${F.LENGTHS.includes(sh.ui.minutes) ? '' : sh.ui.minutes}" placeholder="Other" data-change="own" aria-label="Other length in minutes"><span>min</span></span></div></div>
        <button type="button" class="btn btn--primary btn--block" data-action="start">${icon('timer', { size: 16 })} Start ${sh.ui.minutes} minutes</button>
        <p class="field-hint center">${sofar}</p>
      </div>`;
    },
    onClose: () => clearInterval(tick),
    inputs: {
      label: ({ value, sheet }) => { sheet.ui.label = value; },
      own: ({ value, sheet }) => { const m = Math.round(Number(value)); if (m >= 5) { sheet.ui.minutes = Math.min(180, m); sheet.refresh(); } },
    },
    actions: {
      len: ({ data, sheet }) => { sheet.ui.minutes = Number(data.m); hap.tap(); sheet.refresh(); },
      start: ({ sheet }) => { F.start(sheet.ui.minutes, sheet.ui.label); hap.success(); bar(); app.closeSheet(sheet); },
      pause: ({ sheet }) => { F.pause(); hap.tap(); bar(); sheet.refresh(); },
      resume: ({ sheet }) => { F.resume(); hap.tap(); bar(); sheet.refresh(); },
      finish: ({ sheet }) => {
        const r = F.finish({ early: true });
        bar();
        app.closeSheet(sheet);
        if (r) { hap.success(); app.toast(`Counted · ${r.minutes} min of focus`, { icon: 'check' }); }
      },
      stop: ({ sheet }) => {
        const undo = F.stop();
        bar();
        app.closeSheet(sheet);
        app.toast('Timer stopped', { action: { label: 'Undo', fn: () => { undo(); bar(); } } });
      },
    },
  });
  tick = setInterval(() => {
    const c = document.getElementById('focus-clock');
    const t = F.current();
    if (c && t) c.textContent = F.clock(F.remaining(t));
  }, 1000);
  return s;
}
