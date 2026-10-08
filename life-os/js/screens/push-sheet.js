// Settings › Reminders › When Life OS is closed: turn on the sender on your own server, and see
// exactly what it holds.
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import * as P from '../push/client.js';

const DAY = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAYS = ['', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays', 'Sundays'];
const when = (it) => (it.dates ? (it.dates.length === 1 ? 'that day' : 'on the days it’s due') : it.days?.length === 7 || !it.days ? 'every day' : it.days.length === 1 ? DAYS[it.days[0]] : it.days.map((d) => DAY[d]).join(', '));

/** Training reminders come one per day; the list shows them once. */
function rows(items) {
  const out = [];
  const train = items.filter((it) => it.id.startsWith('train-'));
  for (const it of items) if (!it.id.startsWith('train-')) out.push({ at: it.at, what: it.title, when: when(it) });
  if (train.length) out.push({ at: train[0].at, what: 'Training', when: `on the ${train.length} planned day${train.length === 1 ? '' : 's'} this week` });
  return out.sort((a, b) => (a.at < b.at ? -1 : 1));
}

export function openPushSheet({ onDone } = {}) {
  app.sheet({
    title: 'When Life OS is closed',
    ui: { busy: false, error: '' },
    render: (s) => {
      const sup = P.support();
      const on = P.config();
      const plan = sup === 'unsupported' ? null : P.plan();
      const list = plan ? rows(plan.items) : [];
      const head = html`<p class="sheet-note">Your reminders arrive even when Life OS is closed, sent by the server you already use for sync. It holds only what’s listed below, and skips anything you’ve already done today.</p>`;
      if (sup === 'install') return html`<div class="form">${head}<p class="notice">${icon('smartphone', { size: 16 })} On iPhone, reminders reach only the Life OS on your Home Screen. Open it from there (You › Add to Home Screen), then come back here.</p></div>`;
      if (sup === 'unsupported') return html`<div class="form">${head}<p class="notice">${icon('info', { size: 16 })} This browser can’t receive them. Your calendar can: Settings › Reminders › In your calendar.</p></div>`;
      if (sup === 'nosync') return html`<div class="form">${head}<p class="notice">${icon('refresh-cw', { size: 16 })} Turn on sync first: reminders go through the same server.</p>
        <button type="button" class="btn btn--primary btn--block" data-action="ps-sync">Set up sync</button></div>`;
      return html`<div class="form push-sheet">
        ${head}
        ${on ? html`<p class="sync-state">${icon('bell', { size: 18 })}<span role="status">On${on.sentAt ? `. Up to date with this device: ${on.count} reminder${on.count === 1 ? '' : 's'}.` : '.'}</span></p>` : ''}
        <div class="field"><span class="field-label">What your server holds</span>
          ${list.length ? html`<ul class="list push-list">${list.map((r) => html`<li class="row"><span class="row-ic tnum">${r.at}</span><span class="row-main"><span class="row-title">${r.what}</span><span class="row-sub">${r.when}</span></span></li>`)}</ul>`
            : html`<p class="field-hint">No timed reminders are switched on. Choose them below in Settings › Reminders, or give a habit a reminder time.</p>`}
          <span class="field-hint">Plus your time zone and which of these are done today. Change them in Settings › Reminders and the server follows.</span></div>
        ${s.ui.error ? html`<p class="field-error" role="alert">${s.ui.error}</p>` : ''}
        ${on ? html`<button type="button" class="btn btn--ghost btn--block" data-action="ps-off"${s.ui.busy ? ' disabled' : ''}>Turn off on this device</button>`
          : html`<button type="button" class="btn btn--primary btn--block" data-action="ps-on"${s.ui.busy || !list.length ? ' disabled' : ''}>Turn on</button>`}
      </div>`;
    },
    actions: {
      'ps-sync': ({ sheet }) => { app.closeSheet(sheet); app.go('you/sync'); },
      'ps-on': async ({ sheet }) => {
        sheet.ui.busy = true; sheet.ui.error = ''; sheet.refresh();
        try { await P.enable(); hap.success(); app.toast('Reminders on. They arrive even when Life OS is closed.', { icon: 'bell' }); onDone?.(); } catch (err) { sheet.ui.error = err.message; }
        sheet.ui.busy = false; sheet.refresh();
      },
      'ps-off': async ({ sheet }) => {
        sheet.ui.busy = true; sheet.refresh();
        await P.disable();
        sheet.ui.busy = false;
        app.toast('Reminders off on this device. The server forgot it.');
        onDone?.();
        sheet.refresh();
      },
    },
  });
}
