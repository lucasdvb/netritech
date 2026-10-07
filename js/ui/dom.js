class Raw {
  constructor(s) { this.s = s; }
  toString() { return this.s; }
}

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c]);
export const raw = (s) => new Raw(String(s ?? ''));

function part(v) {
  if (v == null || v === false || v === true) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(part).join('');
  return esc(v);
}

/** Tagged template: interpolations are escaped unless produced by html`` or raw(). */
// Inside aria-*="…" a boolean means "true"/"false", not an omitted value.
const ARIA_OPEN = /\saria-[a-z]+="$/;

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    out += (typeof v === 'boolean' && ARIA_OPEN.test(strings[i]) ? String(v) : part(v)) + strings[i + 1];
  }
  return new Raw(out);
}

export const attr = (cond, name, value = '') => (cond ? raw(value === '' ? ` ${name}` : ` ${name}="${esc(value)}"`) : '');
export const cx = (...xs) => xs.filter(Boolean).join(' ');

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
