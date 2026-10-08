// "Does it feel automatic yet?" (13b): the four questions of the Self-Report Behavioural Automaticity
// Index, one tap each. When it feels automatic, its reminders fade and autopilot is offered, so the
// focus slot goes to the next habit. Asked in the monthly review, or any time from the habit page.
import * as H from '../domain/habits-more.js';
import * as HS from '../domain/habit-system.js';
import { html, cx } from '../ui/dom.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const SCALE = [1, 2, 3, 4, 5];

export function openAutoCheck(h, { onDone } = {}) {
  app.sheet({
    title: 'Does it feel automatic?',
    ui: { answers: [null, null, null, null], score: null },
    render: (s) => {
      const u = s.ui;
      if (u.score != null) {
        const auto = u.score >= 4;
        const focus = H.stateOf(H.habit(h.id)) === 'focus';
        const next = H.queue().find((q) => q.id !== h.id);
        return html`<div class="form auto-check">
          <p class="auto-score tnum">${u.score} <span>of 5</span></p>
          <p class="sheet-note">${auto
            ? `${h.name} is becoming automatic.${h.reminder ? ' Its reminders will fade.' : ''}${focus ? ` Autopilot keeps it going and frees its slot${next ? ` for ${next.name}` : ''}.` : ''}`
            : `Not automatic yet, and that’s normal: most habits take months. Keep it ${focus ? 'in focus' : 'going'}; you’ll be asked again in a month.`}</p>
          ${auto && focus ? html`<button type="button" class="btn btn--primary btn--block" data-action="ac-graduate">Move to autopilot</button>` : ''}
          <button type="button" class="btn btn--ghost btn--block" data-action="ac-close">Done</button>
        </div>`;
      }
      return html`<div class="form auto-check">
        <p class="sheet-note">${h.name}. How true is each of these, lately?</p>
        ${H.AUTO_QUESTIONS.map((q, i) => html`<div class="auto-q"><p class="auto-q-text">${q}</p>
          <div class="auto-scale" role="radiogroup" aria-label="${q}">${SCALE.map((v) => html`<button type="button" role="radio" aria-checked="${u.answers[i] === v}"
            class="${cx('auto-opt', u.answers[i] === v && 'is-on')}" data-action="ac-pick" data-i="${i}" data-v="${v}" aria-label="${v} of 5">${v}</button>`)}</div>
          <p class="auto-ends"><span>Not at all</span><span>Completely</span></p></div>`)}
        <button type="button" class="btn btn--primary btn--block" data-action="ac-save"${u.answers.includes(null) ? ' disabled' : ''}>See the answer</button>
      </div>`;
    },
    actions: {
      'ac-pick': ({ data, sheet }) => { sheet.ui.answers[Number(data.i)] = Number(data.v); hap.tap(); sheet.refresh(); },
      'ac-save': ({ sheet }) => {
        if (sheet.ui.answers.includes(null)) return;
        sheet.ui.score = HS.recordAuto(H.habit(h.id), sheet.ui.answers);
        hap.success();
        onDone?.();
        sheet.refresh();
      },
      'ac-graduate': ({ sheet }) => {
        const before = [H.habit(h.id), H.queue().find((q) => q.id !== h.id)].filter(Boolean).map((x) => ({ ...x }));
        const next = HS.graduate(H.habit(h.id));
        app.closeSheet(sheet);
        hap.success();
        onDone?.();
        app.toast(`${h.name} is on autopilot${next ? `; ${next.name} takes its slot` : ''}.`, { icon: 'check',
          action: { label: 'Undo', fn: async () => { (await import('../data/store.js')).batch(before.map((v) => ({ store: 'habits', value: v }))); onDone?.(); } } });
      },
      'ac-close': ({ sheet }) => app.closeSheet(sheet),
    },
  });
}
