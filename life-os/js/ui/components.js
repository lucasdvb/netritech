import { html, raw, attr, cx, esc, dataAttrs } from './dom.js';
import { icon } from './icons.js';
import { ring, bar, check, toggle } from './controls.js';
import { tipOpen } from './tips.js';
export { ring, bar, check, toggle };

/* ---------- explanations behind an ⓘ (see tips.js) ---------- */
const tipId = (key) => `tip-${String(key).replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`;

/** The ⓘ button. `label` names what it explains, for screen readers. */
export function infoBtn(key, label = 'this') {
  const open = tipOpen(key);
  return html`<button type="button" class="${cx('info-btn', open && 'is-open')}" data-action="tip" data-tip="${key}" aria-expanded="${open}" aria-controls="${tipId(key)}" aria-label="About ${label}">${icon('info', { size: 18 })}</button>`;
}

/** The explanation itself: shown only while its ⓘ is open. */
export function tipText(key, text, { cls = '' } = {}) {
  return tipOpen(key) ? html`<p class="${cx('tip-text', cls)}" id="${tipId(key)}" data-key="${tipId(key)}">${text}</p>` : '';
}




export function segmented(options, value, { action, name, cls = '', size = '' } = {}) {
  return html`<div class="${cx('seg', size && `seg--${size}`, cls)}" role="tablist"${attr(name, 'aria-label', name)}>
    ${options.map((o) => html`<button type="button" role="tab" class="seg-btn" aria-selected="${o.id === value}" data-action="${action}" data-value="${o.id}">${o.label}</button>`)}
  </div>`;
}

export function empty({ ic = 'sparkle', title, body = '', cta, action, data = {} }) {
  const d = dataAttrs(data);
  return html`<div class="empty">
    <div class="empty-ic">${icon(ic, { size: 22 })}</div>
    <p class="empty-title">${title}</p>
    ${body ? html`<p class="empty-body">${body}</p>` : ''}
    ${cta ? html`<button type="button" class="btn btn--soft" data-action="${action}"${d}>${cta}</button>` : ''}
  </div>`;
}

export function pageHead({ title, eyebrow, back, actions = '', sub, morph, info }) {
  const key = info && `page:${typeof title === 'string' ? title : eyebrow || 'page'}`;
  // Back sits in its own bar before the header, so it stays at the top of the screen as you scroll.
  return html`${back ? html`<div class="back-bar"><button type="button" class="back-btn" data-action="go-back" data-fallback="${back.to}" aria-label="Back to ${back.label}">${icon('chevron-left', { size: 22 })}<span>${back.label}</span></button></div>` : ''}
  <header class="page-head${back ? ' page-head--child' : ''}">
    <div class="page-head-row">
      <div>
        ${eyebrow ? html`<p class="eyebrow">${eyebrow}</p>` : ''}
        ${info ? html`<div class="title-line"><h1 class="page-title"${attr(morph, 'data-morph', morph)}>${title}</h1>${infoBtn(key, typeof title === 'string' ? title : 'this page')}</div>`
    : html`<h1 class="page-title"${attr(morph, 'data-morph', morph)}>${title}</h1>`}
        ${sub ? html`<p class="page-sub">${sub}</p>` : ''}
      </div>
      <div class="page-actions">${actions}</div>
    </div>
    ${info ? tipText(key, info, { cls: 'tip-text--page' }) : ''}
  </header>`;
}

export function section(title, body, { action = '', cls = '', id, info } = {}) {
  const key = info && `sec:${id || title}`;
  return html`<section class="${cx('block', cls)}"${attr(id, 'data-key', id)}>
    ${title ? html`<div class="block-head"><h2 class="block-title">${title}${info ? infoBtn(key, title) : ''}</h2>${action}</div>` : ''}
    ${info ? tipText(key, info) : ''}
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
  const d = dataAttrs(data);
  return html`<button type="button" class="${cx('chip', active && 'is-active', cls)}" data-action="${action}"${d} aria-pressed="${!!active}">${ic ? icon(ic, { size: 16 }) : ''}<span>${label}</span></button>`;
}

export function row({ ic, color, title, sub, right = '', action, data = {}, chevron = true, cls = '', key }) {
  const d = dataAttrs(data);
  const tag = action ? 'button' : 'div';
  return html`${raw(`<${tag} class="${cx('row', cls)}"${action ? ` type="button" data-action="${esc(action)}"` : ''}${d}${key ? ` data-key="${esc(key)}"` : ''}>`)}
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

export function stepper(value, { action, data = {}, step = 1, unit = '', min = 0, max = Infinity } = {}) {
  const d = dataAttrs(data);
  return html`<div class="stepper">
    <button type="button" class="stepper-btn" data-action="${action}" data-delta="${-step}"${d} aria-label="Less"${value <= min ? raw(' disabled') : ''}>${icon('minus', { size: 18 })}</button>
    <span class="stepper-val tnum">${value}${unit ? html`<small>${unit}</small>` : ''}</span>
    <button type="button" class="stepper-btn" data-action="${action}" data-delta="${step}"${d} aria-label="More"${value >= max ? raw(' disabled') : ''}>${icon('plus', { size: 18 })}</button>
  </div>`;
}

export function scale10(value, { action, data = {}, low = 'Low', high = 'High', name = '' } = {}) {
  const d = dataAttrs(data);
  return html`<div class="scale" role="radiogroup"${attr(name, 'aria-label', name)}>
    <div class="scale-row">${Array.from({ length: 10 }, (_, i) => i + 1).map((n) => html`<button type="button" role="radio" aria-checked="${value === n}" class="${cx('scale-btn', value === n && 'is-on', value != null && n < value && 'is-under')}" data-action="${action}" data-value="${n}"${d}>${n}</button>`)}</div>
    <div class="scale-legend"><span>${low}</span><span>${high}</span></div>
  </div>`;
}

export const badge = (text, tone = '') => html`<span class="${cx('badge', tone && `badge--${tone}`)}">${text}</span>`;


export function settingRow(label, control, { hint = '', key } = {}) {
  return html`<div class="set-row"${attr(key, 'data-key', key)}><div class="set-text"><span class="set-label">${label}</span>${hint ? html`<span class="set-hint">${hint}</span>` : ''}</div><div class="set-ctl">${control}</div></div>`;
}
