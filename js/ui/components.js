import { html, raw, attr, cx } from './dom.js';
import { icon } from './icons.js';

/** Progress ring. value 0..1. */
export function ring(value, { size = 56, stroke = 5, color = 'var(--accent)', track = 'var(--track)', label = '', cls = '' } = {}) {
  const v = Math.max(0, Math.min(1, value || 0));
  const r = (size - stroke) / 2;
  const c = size / 2;
  return html`<svg class="${cx('ring', cls)}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" ${raw(label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"')}>
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
  const dataAttrs = Object.entries(data).map(([k, v]) => ` data-${k}="${String(v).replace(/"/g, '&quot;')}"`).join('');
  const s = state || (done ? 'done' : 'open');
  return html`<button type="button" class="${cx('check', `check--${s}`, cls)}" role="checkbox" aria-checked="${s === 'done' ? 'true' : s === 'no' ? 'mixed' : 'false'}"
    aria-label="${label}" data-action="${action}"${raw(dataAttrs)}${raw(color ? ` style="--check:${color}"` : '')}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle class="check-ring" cx="12" cy="12" r="10.5"/><circle class="check-fill" cx="12" cy="12" r="10.5"/>
      <path class="check-mark" d="M7.5 12.4l3 3 6-6.6" pathLength="1"/>${s === 'no' ? raw('<path class="check-no" d="M8 12h8"/>') : ''}</svg>
  </button>`;
}

export function segmented(options, value, { action, name, cls = '', size = '' } = {}) {
  return html`<div class="${cx('seg', size && `seg--${size}`, cls)}" role="tablist"${attr(name, 'aria-label', name)}>
    ${options.map((o) => html`<button type="button" role="tab" class="seg-btn" aria-selected="${o.id === value}" data-action="${action}" data-value="${o.id}">${o.label}</button>`)}
  </div>`;
}

export function empty({ ic = 'sparkle', title, body = '', cta, action, data = {} }) {
  const d = Object.entries(data).map(([k, v]) => ` data-${k}="${v}"`).join('');
  return html`<div class="empty">
    <div class="empty-ic">${icon(ic, { size: 22 })}</div>
    <p class="empty-title">${title}</p>
    ${body ? html`<p class="empty-body">${body}</p>` : ''}
    ${cta ? html`<button type="button" class="btn btn--soft" data-action="${action}"${raw(d)}>${cta}</button>` : ''}
  </div>`;
}

export function pageHead({ title, eyebrow, back, actions = '', sub }) {
  return html`<header class="page-head${back ? ' page-head--child' : ''}">
    ${back ? html`<button type="button" class="back-btn" data-action="go-back" data-fallback="${back.to}">${icon('chevron-left', { size: 22 })}<span>${back.label}</span></button>` : ''}
    <div class="page-head-row">
      <div>
        ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}
        <h1 class="page-title">${title}</h1>
        ${sub ? html`<p class="page-sub">${sub}</p>` : ''}
      </div>
      <div class="page-actions">${actions}</div>
    </div>
  </header>`;
}

export function section(title, body, { action = '', cls = '', id } = {}) {
  return html`<section class="${cx('block', cls)}"${attr(id, 'data-key', id)}>
    ${title ? html`<div class="block-head"><h2 class="block-title">${title}</h2>${action}</div>` : ''}
    ${body}
  </section>`;
}

export function stat({ label, value, unit = '', sub = '', tone = '', tween, decimals = 0 }) {
  return html`<div class="${cx('stat', tone && `stat--${tone}`)}">
    <p class="stat-label">${label}</p>
    <p class="stat-value tnum"${tween != null ? raw(` data-tween="${tween}" data-tween-decimals="${decimals}"`) : ''}><span data-tween-text>${value}</span>${unit ? html`<span class="stat-unit">${unit}</span>` : ''}</p>
    ${sub ? html`<p class="stat-sub">${sub}</p>` : ''}
  </div>`;
}

export function dots(list, { size = 'md' } = {}) {
  return html`<span class="dots dots--${size}" aria-hidden="true">${list.map((d) => html`<i class="dot dot--${d.state}"></i>`)}</span>`;
}

export function chip(label, { action, data = {}, active = false, ic, cls = '' } = {}) {
  const d = Object.entries(data).map(([k, v]) => ` data-${k}="${String(v).replace(/"/g, '&quot;')}"`).join('');
  return html`<button type="button" class="${cx('chip', active && 'is-active', cls)}" data-action="${action}"${raw(d)} aria-pressed="${!!active}">${ic ? icon(ic, { size: 16 }) : ''}<span>${label}</span></button>`;
}

export function row({ ic, color, title, sub, right = '', action, data = {}, chevron = true, cls = '', key }) {
  const d = Object.entries(data).map(([k, v]) => ` data-${k}="${String(v).replace(/"/g, '&quot;')}"`).join('');
  const tag = action ? 'button' : 'div';
  return html`${raw(`<${tag} class="${cx('row', cls)}"${action ? ` type="button" data-action="${action}"` : ''}${d}${key ? ` data-key="${key}"` : ''}>`)}
    ${ic ? html`<span class="row-ic" style="${color ? `--ic:${color}` : ''}">${icon(ic, { size: 18 })}</span>` : ''}
    <span class="row-main"><span class="row-title">${title}</span>${sub ? html`<span class="row-sub">${sub}</span>` : ''}</span>
    ${right ? html`<span class="row-right">${right}</span>` : ''}
    ${chevron && action ? html`<span class="row-chev">${icon('chevron-right', { size: 18 })}</span>` : ''}
  ${raw(`</${tag}>`)}`;
}

/** Labelled form field wrapper. */
export function field(label, control, { hint = '', id, cls = '', error = '' } = {}) {
  return html`<label class="${cx('field', cls, error && 'field--error')}"${attr(id, 'for', id)}>
    <span class="field-label">${label}</span>
    ${control}
    ${error ? fieldError(error) : hint ? html`<span class="field-hint">${hint}</span>` : ''}
  </label>`;
}

/** What went wrong with one field, announced to screen readers. The input itself is never cleared. */
export const fieldError = (message) => (message ? html`<span class="field-error" role="alert">${message}</span>` : '');

export function stepper(value, { action, data = {}, step = 1, unit = '', min = 0 } = {}) {
  const d = Object.entries(data).map(([k, v]) => ` data-${k}="${v}"`).join('');
  return html`<div class="stepper">
    <button type="button" class="stepper-btn" data-action="${action}" data-delta="${-step}"${raw(d)} aria-label="Less"${value <= min ? raw(' disabled') : ''}>${icon('minus', { size: 18 })}</button>
    <span class="stepper-val tnum">${value}${unit ? html`<small>${unit}</small>` : ''}</span>
    <button type="button" class="stepper-btn" data-action="${action}" data-delta="${step}"${raw(d)} aria-label="More">${icon('plus', { size: 18 })}</button>
  </div>`;
}

export function scale10(value, { action, data = {}, low = 'Low', high = 'High', name = '' } = {}) {
  const d = Object.entries(data).map(([k, v]) => ` data-${k}="${v}"`).join('');
  return html`<div class="scale" role="radiogroup"${attr(name, 'aria-label', name)}>
    <div class="scale-row">${Array.from({ length: 10 }, (_, i) => i + 1).map((n) => html`<button type="button" role="radio" aria-checked="${value === n}" class="${cx('scale-btn', value === n && 'is-on', value != null && n < value && 'is-under')}" data-action="${action}" data-value="${n}"${raw(d)}>${n}</button>`)}</div>
    <div class="scale-legend"><span>${low}</span><span>${high}</span></div>
  </div>`;
}

export const badge = (text, tone = '') => html`<span class="${cx('badge', tone && `badge--${tone}`)}">${text}</span>`;

export function toggle(on, { action, data = {}, label, cls = '' } = {}) {
  const d = Object.entries(data).map(([k, v]) => ` data-${k}="${v}"`).join('');
  return html`<button type="button" role="switch" aria-checked="${!!on}" aria-label="${label}" class="${cx('switch', cls)}" data-action="${action}"${raw(d)}><span class="switch-knob"></span></button>`;
}

export function settingRow(label, control, { hint = '', key } = {}) {
  return html`<div class="set-row"${key ? raw(` data-key="${key}"`) : ''}><div class="set-text"><span class="set-label">${label}</span>${hint ? html`<span class="set-hint">${hint}</span>` : ''}</div><div class="set-ctl">${control}</div></div>`;
}
