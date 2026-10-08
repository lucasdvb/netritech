// Cues from your iPhone: one Shortcuts automation per focus habit and routine, set off by the moment
// it follows (an alarm, wind down, a place, a sticker). Each recipe is five steps and the words to
// paste. They run with Life OS closed, and nothing is sent anywhere.
import * as store from '../data/store.js';
import * as C from '../domain/cues.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

/** "Tap **Automation**" → Tap <b>Automation</b>. */
const bold = (s) => s.split('**').map((part, i) => (i % 2 ? html`<b>${part}</b>` : part));
const when = (c) => (c.trigger === 'time' ? `at ${c.time}` : c.trigger === 'nfc' ? `when you tap a sticker ${c.place || 'where you do it'}`
  : c.place && ['arrive', 'leave'].includes(c.trigger) ? `${C.TRIGGERS[c.trigger].short}: ${c.place}` : C.TRIGGERS[c.trigger].short);

export function openCues() {
  app.sheet({
    title: 'Cues from your iPhone',
    render: () => {
      const items = C.list();
      return html`<div class="form cues">
        <p class="sheet-note">Your iPhone can nudge you at the real moment: when your alarm stops, when you get to the gym, when wind down begins. It works with Life OS closed, nothing is sent anywhere, and a cue tied to a moment builds the habit better than a clock reminder.</p>
        ${items.length ? html`<ul class="list">${items.map((it) => html`<li data-key="cue-${it.id}"><button type="button" class="row" data-action="cue-open" data-id="${it.id}">
          <span class="row-ic">${icon(it.ic || 'bell', { size: 16 })}</span>
          <span class="row-main"><span class="row-title">${it.name}</span><span class="row-sub">${it.done ? 'Set up · ' : ''}${when(it.cue)}</span></span>
          <span class="row-right">${it.done ? icon('check', { size: 16 }) : icon('chevron-right', { size: 16 })}</span></button></li>`)}</ul>`
          : html`<p class="field-hint">Choose your three habits first (Plan › Habits › Choose your three); each gets a cue here.</p>`}
        <p class="field-hint">Uses the Shortcuts app, already on your iPhone. A sticker cue needs an NFC sticker (NTAG215, a few for a couple of euros).</p>
      </div>`;
    },
    actions: {
      'cue-open': ({ data }) => { const it = C.list().find((x) => x.id === data.id); if (it) openCue(it); },
    },
  });
}

export function openCue(it, { onDone } = {}) {
  app.sheet({
    title: it.name,
    render: () => html`<div class="form cue">
      <p class="cue-when">${icon(C.TRIGGERS[it.cue.trigger].ic, { size: 18 })} <span>Cue: <b>${when(it.cue)}</b></span></p>
      <ol class="recipe-steps">${C.steps(it.cue).map((s) => html`<li>${bold(s)}</li>`)}</ol>
      <div class="field"><span class="field-label">The words to paste</span>
        <p class="cue-text" data-key="cue-text">${it.text}</p></div>
      <button type="button" class="btn btn--soft btn--block" data-action="cue-copy">${icon('copy', { size: 18 })} Copy the words</button>
      <button type="button" class="btn btn--primary btn--block" data-action="cue-done">${it.done ? 'Done' : 'It’s set up'}</button>
    </div>`,
    actions: {
      'cue-copy': async () => {
        try { await navigator.clipboard.writeText(it.text); hap.success(); app.toast('Copied. Paste it into Show Notification.', { icon: 'check' }); } catch { app.toast('This browser didn’t allow copying. Select the words and copy by hand.'); }
      },
      'cue-done': ({ sheet }) => {
        const [kind, id] = it.id.split(':');
        const rec = store.get(kind === 'routine' ? 'routines' : 'habits', id);
        if (rec && !rec.cueSetAt) store.put(kind === 'routine' ? 'routines' : 'habits', { ...rec, cueSetAt: new Date().toISOString(), cue: it.cue.trigger });
        hap.success();
        app.closeSheet(sheet);
        onDone?.();
      },
    },
  });
}
