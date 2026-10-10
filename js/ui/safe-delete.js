// Safe delete (51): something linked to other things says what, before it goes, and offers to move
// those links to another of the same kind or to let them go. Nothing linked: it goes at once, with
// Undo, as everywhere else. Either way the delete and every link it touched come back with one Undo.
import * as store from '../data/store.js';
import { html, raw } from './dom.js';
import { icon } from './icons.js';
import { app } from './app-api.js';
import * as hap from './haptics.js';
import { linksOf, others, relink } from '../domain/links.js';

const NOUN = { habit: 'habit', goal: 'goal', workout: 'workout', routine: 'routine' };

/**
 * Delete `records` ([{ store, id }], the item first) for an item of `kind`. `after` runs once it's
 * gone (to leave its page); `message(moved)` is the toast. With links, asks first in a sheet.
 */
export function safeDelete({ kind, id, name, records, after, message }) {
  // Only what the delete would change: a routine's habits stay as they are, a reminder goes with its habit.
  const links = linksOf(kind, id).filter((l) => !['Reminder', 'Experiment'].includes(l.group) && !(kind === 'routine' && l.group === 'Habit'));
  if (!links.length) { commit({ kind, id, records, to: null, after, message }); return; }
  const choices = others(kind, id);
  app.sheet({
    title: `Delete “${name}”?`,
    ui: { to: '' },
    render: (s) => html`<div class="form safe-delete">
      <p class="sheet-note">It’s linked to ${links.length === 1 ? 'one thing' : `${links.length} things`}:</p>
      <ul class="list">${links.map((l) => html`<li class="row row--static"><span class="row-ic">${icon(l.icon, { size: 16 })}</span>
        <span class="row-main"><span class="row-title">${l.label}</span><span class="row-sub">${l.group}${l.sub ? ` · ${l.sub}` : ''}</span></span></li>`)}</ul>
      ${choices.length ? html`<label class="field"><span class="field-label">Move these links to <small>optional</small></span>
        <select class="input" data-change="sd-to" aria-label="Move links to"><option value="">Nothing: let them go</option>
          ${choices.map((c) => html`<option value="${c.id}" ${raw(s.ui.to === c.id ? 'selected' : '')}>${c.name}</option>`)}</select></label>` : ''}
      <p class="fine-print">${s.ui.to ? `They’ll point to “${choices.find((c) => c.id === s.ui.to)?.name}” instead.` : `The ${links.length === 1 ? 'link goes' : 'links go'}; the things themselves stay.`} Undo puts everything back.</p>
      <button type="button" class="btn btn--danger btn--block" data-action="sd-go">${icon('trash-2', { size: 18 })} Delete ${NOUN[kind] || ''}</button>
    </div>`,
    inputs: { 'sd-to': ({ value, sheet }) => { sheet.ui.to = value; sheet.refresh(); } },
    actions: {
      'sd-go': ({ sheet }) => {
        app.closeSheet(sheet);
        commit({ kind, id, records, to: sheet.ui.to || null, after, message });
      },
    },
  });
}

function commit({ kind, id, records, to, after, message }) {
  const gone = records.map(({ store: s, id: rid }) => ({ store: s, value: store.get(s, rid) })).filter((r) => r.value);
  if (!gone.length) return;
  const moves = relink(kind, id, to);
  const toName = to ? others(kind, id).find((c) => c.id === to)?.name || null : null;
  // Everything this touches, as it is now: Undo writes it all back in one go.
  const before = [...gone, ...moves.map((op) => ({ store: op.store, value: op.store === 'profile' ? store.profile() : store.get(op.store, op.value.id) }))].filter((r) => r.value);
  store.batch([...moves, ...gone.map((r) => ({ store: r.store, delete: r.value.id }))]);
  hap.tap();
  after?.();
  app.toast(message(toName), {
    action: { label: 'Undo', fn: () => store.batch(before.map((r) => ({ store: r.store, value: r.value }))) },
  });
}
