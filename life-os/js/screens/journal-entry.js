import * as store from '../data/store.js';
import { today, fmtLong, fmtTime } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import { PROMPTS, KIND_LABEL } from './journal.js';

const timers = new Map();
function saveLater(id, patch) {
  clearTimeout(timers.get(id));
  timers.set(id, setTimeout(() => {
    const cur = store.get('journalEntries', id);
    if (cur) store.put('journalEntries', { ...cur, ...patch(cur) });
  }, 350));
}

export default {
  id: 'journal-entry',
  title: 'Journal',
  render({ params }) {
    const j = store.get('journalEntries', params.id);
    if (!j) return html`${pageHead({ title: 'Journal', back: { to: 'more/journal', label: 'Journal' } })}${empty({ ic: 'notebook-pen', title: 'This entry was deleted.' })}`;
    const prompts = PROMPTS[j.kind] || [];
    return html`
      ${pageHead({ title: KIND_LABEL[j.kind], eyebrow: fmtLong(j.date), back: { to: 'more/journal', label: 'Journal' },
        actions: html`<button type="button" class="icon-btn" data-action="del" aria-label="Delete entry">${icon('trash-2', { size: 19 })}</button>` })}
      <div class="journal-form">
        ${prompts.map((q, i) => html`<label class="prompt"><span class="prompt-q">${q}</span>
          <textarea class="prompt-a" rows="2" data-input="answer" data-i="${i}" placeholder="A sentence is enough">${j.answers?.[i] || ''}</textarea></label>`)}
        ${j.kind === 'evening' ? html`<label class="prompt"><span class="prompt-q">What am I avoiding? <small>optional</small></span>
          <textarea class="prompt-a" rows="2" data-input="answer" data-i="avoid">${j.answers?.avoid || ''}</textarea></label>` : ''}
        <label class="prompt"><span class="prompt-q">${prompts.length ? 'Anything else' : 'Write freely'}</span>
          <textarea class="prompt-a prompt-a--free" rows="${prompts.length ? 3 : 10}" data-input="text" placeholder="${prompts.length ? 'Optional' : 'Whatever is on your mind.'}" ${prompts.length ? '' : 'autofocus'}>${j.text || ''}</textarea></label>
        <p class="fine-print">Saved as you type · ${j.updatedAt ? `last saved ${fmtTime(new Date(j.updatedAt))}` : ''}</p>
      </div>`;
  },
  mount(el) {
    el.querySelectorAll('textarea').forEach((t) => { t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px`; });
    el.addEventListener('input', (e) => { if (e.target.tagName === 'TEXTAREA') { e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px`; } });
  },
  inputs: {
    answer: ({ el, value, params }) => saveLater(params.id, (cur) => ({ answers: { ...(cur.answers || {}), [el.dataset.i]: value } })),
    text: ({ value, params }) => saveLater(params.id, () => ({ text: value })),
  },
  actions: {
    del: async ({ params }) => {
      const ok = await app.confirm({ title: 'Delete this entry?', body: 'It’s removed from this device. This can’t be undone.', confirm: 'Delete', tone: 'danger' });
      if (!ok) return;
      clearTimeout(timers.get(params.id));
      store.remove('journalEntries', params.id);
      app.replace('more/journal');
    },
  },
  unmount(el, { params }) {
    // Remove entries left completely empty.
    setTimeout(() => {
      const j = store.get('journalEntries', params.id);
      if (j && !(j.text || '').trim() && !Object.values(j.answers || {}).some((a) => (a || '').trim())) store.remove('journalEntries', j.id);
    }, 500);
  },
};
