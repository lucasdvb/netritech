// The small controls Today draws at first render: the progress ring and bar, the check and the
// switch. components.js re-exports them with everything else.
import { html, raw, attr, cx, esc, dataAttrs } from './dom.js';

/** Progress ring. value 0..1. */
export function ring(value, { size = 56, stroke = 5, color = 'var(--accent)', track = 'var(--track)', label = '', cls = '' } = {}) {
  const v = Math.max(0, Math.min(1, value || 0));
  const r = (size - stroke) / 2;
  const c = size / 2;
  return html`<svg class="${cx('ring', cls)}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ${raw(label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"')}>
    <circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/>
    <circle class="ring-val" cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
      pathLength="100" stroke-dasharray="100" stroke-dashoffset="${(100 - v * 100).toFixed(2)}" transform="rotate(-90 ${c} ${c})"/>
  </svg>`;
}

export function bar(value, { color = 'var(--accent)', cls = '', label = '' } = {}) {
  const v = Math.max(0, Math.min(1, value || 0));
  return html`<div class="${cx('bar', cls)}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v * 100)}"${attr(label, 'aria-label', label)}>
    <span class="bar-fill" style="transform:scaleX(${v.toFixed(3)});background:${color}"></span></div>`;
}

export function check(done, { action, data = {}, label, color, cls = '', state } = {}) {
  const s = state || (done ? 'done' : 'open');
  // tiny: the two-minute version was done. It counts, so it reads as partly checked, not empty.
  return html`<button type="button" class="${cx('check', `check--${s}`, cls)}" role="checkbox" aria-checked="${s === 'done' ? 'true' : s === 'no' || s === 'tiny' ? 'mixed' : 'false'}"
    aria-label="${label}" data-action="${action}"${dataAttrs(data)}${attr(color, 'style', `--check:${color}`)}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle class="check-ring" cx="12" cy="12" r="10.5"/><circle class="check-fill" cx="12" cy="12" r="10.5"/>
      <path class="check-mark" d="M7.5 12.4l3 3 6-6.6" pathLength="1"/>${s === 'no' ? raw('<path class="check-no" d="M8 12h8"/>') : ''}${s === 'tiny' ? raw('<circle class="check-tiny" cx="12" cy="12" r="5"/>') : ''}</svg>
  </button>`;
}

export function toggle(on, { action, data = {}, label, cls = '' } = {}) {
  const d = dataAttrs(data);
  return html`<button type="button" role="switch" aria-checked="${!!on}" aria-label="${label}" class="${cx('switch', cls)}" data-action="${action}"${d}><span class="switch-knob"></span></button>`;
}
