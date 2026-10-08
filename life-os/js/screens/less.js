// Habits you're cutting down or quitting (13b): the day's count against the limit, one tap for each
// one you have, and one for each urge you ride out. After an urge, where and how you felt (if you
// like), and your "instead, I will…", which is the plan for the next one.
import * as H from '../domain/habits-more.js';
import * as U from '../domain/urges.js';
import { today } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

export function openLess(h, date = today(), { onDone } = {}) {
  app.sheet({
    title: h.name,
    ui: { urge: null },
    render: (s) => {
      const hb = H.habit(h.id);
      const n = H.log(hb.id, date)?.value || 0;
      const max = H.limitOf(hb);
      const kept = H.isDone(hb, date);
      const u = s.ui;
      if (u.urge) {
        const tag = (key, pairs, label) => html`<div class="field"><span class="field-label">${label} <small>optional</small></span>
          <div class="chips" role="group" aria-label="${label}">${pairs.map(([v, l]) => html`<button type="button" class="${cx('chip', u.urge[key] === v && 'is-active')}" aria-pressed="${u.urge[key] === v}" data-action="ls-tag" data-k="${key}" data-v="${v}">${l}</button>`)}</div></div>`;
        return html`<div class="form less-sheet">
          <p class="skip-done">${icon('check', { size: 16 })} ${u.urge.outcome === 'resisted' ? 'Urge ridden out. That’s the habit getting weaker.' : 'Logged. One slip is a data point, not a verdict.'}</p>
          ${tag('where', U.WHERE, 'Where were you?')}
          ${tag('feeling', U.FEELING, 'How did you feel?')}
          ${hb.instead ? html`<div class="backup-card"><p class="backup-if">Next time, instead</p><p class="backup-then">${hb.instead}</p></div>`
            : html`<p class="field-hint">Add an “instead, I will…” in the habit’s options: a plan for the next urge works better than willpower.</p>`}
          <button type="button" class="btn btn--primary btn--block" data-action="ls-close">Done</button>
        </div>`;
      }
      return html`<div class="form less-sheet">
        <div class="less-count">
          <p class="less-n tnum">${max === 0 ? (kept ? H.keptDays(hb, date) : 0) : n}<span>${max === 0 ? ` day${H.keptDays(hb, date) === 1 && kept ? '' : 's'} free` : ` of ${max}${hb.unit ? ` ${hb.unit}` : ''} today`}</span></p>
          <p class="less-state">${kept ? (max === 0 ? 'Free today.' : n === max ? 'At the limit. That’s the day’s amount.' : 'Within the limit.') : 'Over the limit today. Tomorrow starts clean.'}</p>
        </div>
        <button type="button" class="btn btn--primary btn--block" data-action="ls-resisted">${icon('shield-check', { size: 18 })} I rode out an urge</button>
        <button type="button" class="btn btn--soft btn--block" data-action="ls-slipped">${max === 0 ? 'I slipped' : `I had one${hb.unit ? ` (${hb.unit.replace(/s$/, '')})` : ''}`}</button>
        ${n > 0 ? html`<button type="button" class="link-btn" data-action="ls-less">Take one off today’s count</button>` : ''}
        <button type="button" class="link-btn" data-action="ls-details">Triggers and history ${icon('chevron-right', { size: 16 })}</button>
      </div>`;
    },
    actions: {
      'ls-resisted': ({ sheet }) => { const { id } = U.log(H.habit(h.id), { outcome: 'resisted', date }); sheet.ui.urge = { id, outcome: 'resisted' }; hap.success(); onDone?.(); sheet.refresh(); },
      'ls-slipped': ({ sheet }) => {
        const { id, undo } = U.log(H.habit(h.id), { outcome: 'slipped', date });
        sheet.ui.urge = { id, outcome: 'slipped' };
        hap.commit();
        onDone?.();
        app.toast(`${h.name}: logged`, { action: { label: 'Undo', fn: () => { undo(); onDone?.(); } } });
        sheet.refresh();
      },
      'ls-less': ({ sheet }) => { H.addCount(H.habit(h.id), date, -1); hap.tap(); onDone?.(); sheet.refresh(); },
      'ls-tag': async ({ data, sheet }) => {
        const u = sheet.ui.urge;
        u[data.k] = u[data.k] === data.v ? null : data.v;
        const store = await import('../data/store.js');
        if (u.id) store.update('urges', u.id, { [data.k]: u[data.k] });
        hap.tap();
        sheet.refresh();
      },
      'ls-details': ({ sheet }) => { app.closeSheet(sheet); app.go(`plan/habits/${h.id}`); },
      'ls-close': ({ sheet }) => app.closeSheet(sheet),
    },
  });
}
