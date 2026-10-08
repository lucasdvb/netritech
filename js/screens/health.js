// Apple Health without typing (U10): a Shortcut copies today's steps, sleep and weight, and one
// tap here pastes them. Everything is shown before it's saved, and saving has Undo.
import * as store from '../data/store.js';
import * as M from '../domain/metrics.js';
import { parseHealth, SAMPLE } from '../domain/health-paste.js';
import { today, durationHM, relativeDay } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { num, kgOut, weightUnit } from '../ui/format.js';

export function openHealthPaste({ auto = false } = {}) {
  const ui = { text: '', data: null, error: '' };
  const read = async (sheet) => {
    try {
      const t = await navigator.clipboard.readText();
      take(sheet, t);
    } catch {
      sheet.ui.error = 'This browser didn’t share the clipboard. Paste into the box below instead.';
      sheet.refresh();
    }
  };
  const take = (sheet, t) => {
    sheet.ui.text = t;
    sheet.ui.data = parseHealth(t, today());
    sheet.ui.error = sheet.ui.data ? '' : 'No steps, sleep or weight in what was pasted. Run the Shortcut, then try again.';
    sheet.refresh();
  };
  const sheet = app.sheet({
    title: 'Paste from Health',
    ui,
    render: (s) => {
      const d = s.ui.data;
      const was = d && { steps: M.steps(d.date), sleep: M.sleepHours(d.date), weight: M.weight(d.date) };
      return html`<div class="form health">
        ${d ? html`<p class="form-label">${relativeDay(d.date)}</p>
          <ul class="cap-list">
            ${d.steps != null ? row('footprints', 'Steps', num(d.steps), was.steps != null && was.steps !== d.steps ? `replaces ${num(was.steps)}` : '') : ''}
            ${d.sleepHours != null ? row('bed', 'Sleep', durationHM(d.sleepHours * 60), was.sleep != null && was.sleep !== d.sleepHours ? `replaces ${durationHM(was.sleep * 60)}` : '') : ''}
            ${d.weightKg != null ? row('scale', 'Weight', `${num(kgOut(d.weightKg), 1)} ${weightUnit()}`, was.weight != null && was.weight !== d.weightKg ? `replaces ${num(kgOut(was.weight), 1)}` : '') : ''}
          </ul>
          ${d.unknown.length ? html`<p class="field-hint">Left out: ${d.unknown.slice(0, 3).join(' · ')}</p>` : ''}
          <button type="button" class="btn btn--primary btn--block" data-action="hp-save">Save all</button>`
        : html`<p class="sheet-note">Run your “Life OS Health” Shortcut, then paste. Steps, sleep and weight fill in together.</p>
          <button type="button" class="btn btn--primary btn--block" data-action="hp-read">${icon('heart-pulse', { size: 18 })} Paste</button>`}
        ${s.ui.error ? html`<p class="field-error" role="alert">${s.ui.error}</p>` : ''}
        <details class="disclosure"${!d && s.ui.error ? ' open' : ''}><summary>Paste by hand</summary>
          <textarea class="input" rows="4" data-input="hp-text" placeholder="${SAMPLE}" aria-label="Pasted Health text">${s.ui.text}</textarea></details>
        <button type="button" class="link-btn" data-action="hp-recipe">How to set up the Shortcut</button>
      </div>`;
    },
    inputs: { 'hp-text': ({ value, sheet: s }) => take(s, value) },
    actions: {
      'hp-read': ({ sheet: s }) => read(s),
      'hp-recipe': () => openRecipe(),
      'hp-save': ({ sheet: s }) => {
        const d = s.ui.data;
        if (!d) return;
        const ids = [d.steps != null && ['stepLogs', d.date], d.sleepHours != null && ['sleepEntries', d.date], d.weightKg != null && ['weightEntries', d.date]].filter(Boolean);
        const before = ids.map(([st, id]) => ({ st, id, value: store.get(st, id) || null }));
        const ops = [];
        if (d.steps != null) ops.push({ store: 'stepLogs', value: { ...(store.get('stepLogs', d.date) || {}), id: d.date, date: d.date, steps: d.steps, source: 'health' } });
        if (d.sleepHours != null) ops.push({ store: 'sleepEntries', value: { ...(store.get('sleepEntries', d.date) || {}), id: d.date, date: d.date, hours: d.sleepHours, source: 'health' } });
        if (d.weightKg != null) ops.push({ store: 'weightEntries', value: { ...(store.get('weightEntries', d.date) || {}), id: d.date, date: d.date, kg: d.weightKg, source: 'health' } });
        store.batch(ops);
        hap.success();
        app.closeSheet(s);
        app.toast(`From Health: ${ops.length === 3 ? 'steps, sleep and weight' : ops.map((o) => ({ stepLogs: 'steps', sleepEntries: 'sleep', weightEntries: 'weight' })[o.store]).join(' and ')}`, { icon: 'heart-pulse',
          action: { label: 'Undo', fn: () => store.batch(before.map((b) => (b.value ? { store: b.st, value: b.value } : { store: b.st, delete: b.id }))) } });
      },
    },
  });
  // Opened from the Shortcut (#/today?paste=1): offer the paste straight away.
  if (auto) sheet.el?.querySelector('[data-action="hp-read"]')?.focus();
  return sheet;
}

const row = (ic, title, value, note) => html`<li class="cap-item"><span class="cap-ic">${icon(ic, { size: 18 })}</span>
  <span class="cap-text"><span class="cap-title">${title}</span><span class="cap-value">${value}</span></span>${note ? html`<span class="cap-day">${note}</span>` : ''}</li>`;

/** The Shortcut, step by step (made once in the Shortcuts app, then run each morning). */
export function openRecipe() {
  const url = `${location.origin}${location.pathname}#/today?paste=1`;
  app.sheet({
    title: 'The Health Shortcut',
    render: () => html`<div class="form recipe">
      <p class="sheet-note">Life OS can’t read Apple Health from the browser, so a Shortcut does it in one tap. Make it once in the Shortcuts app:</p>
      <ol class="recipe-steps">
        <li><b>New Shortcut</b>, name it “Life OS Health”.</li>
        <li><b>Find Health Samples</b>: Steps, start date is today. Then <b>Calculate Statistics</b>: Sum.</li>
        <li><b>Find Health Samples</b>: Sleep Analysis, start date in the last 1 day, value is Asleep. Then <b>Calculate Statistics</b>: Sum (hours).</li>
        <li><b>Find Health Samples</b>: Weight, sorted latest first, limit 1.</li>
        <li><b>Text</b>: <code>steps: [Statistics 1]</code>, <code>sleep: [Statistics 2]</code>, <code>weight: [Health Samples 3]</code>, one per line.</li>
        <li><b>Copy to Clipboard</b>, then <b>Open URLs</b>: <code>${url}</code></li>
      </ol>
      <p class="field-hint">Add it to your Home Screen or run it from an automation each morning. In Life OS, tap Paste once and Save all.</p>
    </div>`,
  });
}
