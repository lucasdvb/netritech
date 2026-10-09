// Number pad sheet: big keys, the last value already there, ± steppers for small changes.
// The first key you press replaces the prefilled value, like a calculator. A keyboard works too.
import { html, cx, attr } from './dom.js';
import { icon } from './icons.js';
import { app } from './app-api.js';
import * as hap from './haptics.js';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

/**
 * openNumpad({ title, unit, value, step, decimals, min, max, hint, quick, onSave, more })
 * quick: [{ label, value }] shortcuts; more: { label, run } for the detailed form.
 */
export function openNumpad(o) {
  const decimals = o.decimals ?? 0;
  const fmt = (v) => (v == null || v === '' ? '' : String(Math.round(Number(v) * 10 ** decimals) / 10 ** decimals));
  const ui = { text: fmt(o.value), fresh: true };
  const valueOf = (t) => (t === '' || t === '.' ? null : Number(t));
  const valid = (v) => v != null && Number.isFinite(v) && (o.min == null || v >= o.min) && (o.max == null || v <= o.max);
  let sheet;
  const press = (k) => {
    if (k === 'del') ui.text = ui.fresh ? '' : ui.text.slice(0, -1);
    else if (k === '.') { if (!decimals || ui.text.includes('.')) return; ui.text = ui.fresh || !ui.text ? '0.' : `${ui.text}.`; }
    else {
      const next = ui.fresh ? k : ui.text === '0' ? k : ui.text + k;
      const dot = next.indexOf('.');
      if (dot >= 0 && next.length - dot - 1 > decimals) return;
      if (next.replace('.', '').length > 7) return;
      ui.text = next;
    }
    ui.fresh = false;
    hap.tap();
    sheet.refresh();
  };
  const step = (dir) => {
    const v = (valueOf(ui.text) ?? o.value ?? 0) + dir * (o.step || 1);
    ui.text = fmt(Math.max(o.min ?? 0, Math.min(o.max ?? Infinity, v)));
    ui.fresh = false;
    hap.tap();
    sheet.refresh();
  };
  const save = () => {
    const v = valueOf(ui.text);
    if (!valid(v)) { hap.warn(); app.toast(o.min != null && o.max != null ? `Enter a number between ${o.min} and ${o.max}.` : 'Enter a number.'); return; }
    app.closeSheet(sheet);
    o.onSave(v);
  };
  const onKey = (e) => {
    if (sheet?.el && !sheet.el.isConnected) { removeEventListener('keydown', onKey); return; }
    if (e.target.matches?.('input, textarea')) return;
    if (/^[0-9.,]$/.test(e.key)) { e.preventDefault(); press(e.key === ',' ? '.' : e.key); }
    else if (e.key === 'Backspace') { e.preventDefault(); press('del'); }
    else if (e.key === 'Enter') { e.preventDefault(); save(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); step(-1); }
  };
  sheet = app.sheet({
    title: o.title,
    ui,
    onClose: () => removeEventListener('keydown', onKey),
    render: (s) => {
      const v = valueOf(s.ui.text);
      return html`<div class="numpad">
        <div class="numpad-display">
          <button type="button" class="icon-btn numpad-step" data-action="np-step" data-dir="-1" aria-label="Minus ${o.step || 1}">${icon('minus', { size: 20 })}</button>
          <p class="${cx('numpad-value tnum', s.ui.fresh && 'is-fresh')}" role="status" aria-live="polite" aria-label="${o.title}: ${s.ui.text || 'empty'} ${o.unit || ''}">
            <span>${s.ui.text || '0'}</span>${o.unit ? html`<small>${o.unit}</small>` : ''}</p>
          <button type="button" class="icon-btn numpad-step" data-action="np-step" data-dir="1" aria-label="Plus ${o.step || 1}">${icon('plus', { size: 20 })}</button>
        </div>
        ${o.hint ? html`<p class="numpad-hint">${o.hint}</p>` : ''}
        ${o.quick?.length ? html`<div class="numpad-quick">${o.quick.map((q) => html`<button type="button" class="chip" data-action="np-quick" data-v="${q.value}">${q.label}</button>`)}</div>` : ''}
        <div class="numpad-keys" role="group" aria-label="Number keys">${KEYS.map((k) => k === '.' && !decimals
          ? html`<span aria-hidden="true"></span>`
          : html`<button type="button" class="numpad-key" data-action="np-key" data-k="${k}" aria-label="${k === 'del' ? 'Delete' : k === '.' ? 'Decimal point' : k}">${k === 'del' ? icon('chevron-left', { size: 22 }) : k}</button>`)}</div>
        <div class="numpad-foot">
          ${o.more ? html`<button type="button" class="link-btn" data-action="np-more">${o.more.label}</button>` : html`<span></span>`}
          <button type="button" class="btn btn--primary" data-action="np-save"${attr(!valid(v), 'aria-disabled', 'true')}>Save</button>
        </div>
      </div>`;
    },
    actions: {
      'np-key': ({ data }) => press(data.k),
      'np-step': ({ data }) => step(Number(data.dir)),
      'np-quick': ({ data }) => { ui.text = fmt(Number(data.v)); ui.fresh = false; hap.tap(); sheet.refresh(); },
      'np-save': save,
      'np-more': () => { app.closeSheet(sheet); o.more.run(); },
    },
  });
  addEventListener('keydown', onKey);
  return sheet;
}
