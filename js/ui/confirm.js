// The confirm sheet, kept for whole-device actions only (restore, erase). Loads on first use.
import { html } from './dom.js';
import * as sheet from './sheet.js';

export function confirmDialog({ title, body = '', confirm = 'Confirm', cancel = 'Cancel', tone = '' }) {
  return new Promise((resolveP) => {
    let answered = false;
    const s = sheet.open({
      title,
      render: () => html`<div class="confirm">
        ${body ? html`<p class="confirm-body">${body}</p>` : ''}
        <div class="btn-row">
          <button type="button" class="btn btn--ghost" data-action="no">${cancel}</button>
          <button type="button" class="btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}" data-action="yes">${confirm}</button>
        </div></div>`,
      actions: {
        yes: () => { answered = true; resolveP(true); sheet.close(s); },
        no: () => { answered = true; resolveP(false); sheet.close(s); },
      },
      onClose: () => { if (!answered) resolveP(false); },
    });
  });
}
