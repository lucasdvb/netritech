// Minimal keyed DOM morphing. Keeps existing nodes (and their CSS transitions,
// focus and scroll) when a view re-renders. Keys come from data-key or id.

const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute('data-key') || n.id || null : null);
const sameKind = (a, b) => a.nodeType === b.nodeType && (a.nodeType !== 1 || a.tagName === b.tagName);
// Fields the user has typed into since the last render that matched them.
// A re-render never overwrites these, so in-flight text can't be lost.
const dirty = new WeakSet();
if (typeof document !== 'undefined') {
  document.addEventListener('input', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) dirty.add(e.target);
  }, true);
}

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function patch(parent, markup) {
  const tpl = document.createElement('template');
  tpl.innerHTML = String(markup);
  morphChildren(parent, tpl.content);
}

function morphChildren(from, to) {
  const keyed = new Map();
  for (let n = from.firstChild; n; n = n.nextSibling) {
    const k = keyOf(n);
    if (k) keyed.set(k, n);
  }
  let cursor = from.firstChild;
  const incoming = [...to.childNodes];
  for (const next of incoming) {
    const k = keyOf(next);
    let match = null;
    if (k) {
      match = keyed.get(k) || null;
      if (match) keyed.delete(k);
    } else if (cursor && !keyOf(cursor) && sameKind(cursor, next)) {
      match = cursor;
    }
    if (match && sameKind(match, next)) {
      if (match === cursor) cursor = cursor.nextSibling;
      else from.insertBefore(match, cursor);
      morphNode(match, next);
    } else {
      from.insertBefore(next, cursor);
    }
  }
  while (cursor) {
    const after = cursor.nextSibling;
    from.removeChild(cursor);
    cursor = after;
  }
}

function morphNode(a, b) {
  if (a.nodeType === 3 || a.nodeType === 8) {
    if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue;
    return;
  }
  if (a.nodeType !== 1) return;
  if (a.hasAttribute('data-static') && b.hasAttribute('data-static')
      && a.getAttribute('data-static') === b.getAttribute('data-static')) return;

  const oldTween = a.getAttribute('data-tween');
  syncAttributes(a, b);

  const tag = a.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
    syncFormControl(a, b);
    if (tag !== 'SELECT') return;
  }
  morphChildren(a, b);

  const newTween = a.getAttribute('data-tween');
  if (newTween != null && oldTween != null && newTween !== oldTween) tween(a, Number(oldTween), Number(newTween));
}

function syncAttributes(a, b) {
  for (const { name } of [...a.attributes]) {
    if (!b.hasAttribute(name)) a.removeAttribute(name);
  }
  for (const { name, value } of b.attributes) {
    if (a.getAttribute(name) !== value) a.setAttribute(name, value);
  }
}

function syncFormControl(a, b) {
  const focused = document.activeElement === a;
  if (a.tagName === 'TEXTAREA') {
    if (a.value === b.textContent) dirty.delete(a);
    else if (!focused && !dirty.has(a)) a.value = b.textContent;
    return;
  }
  if (a.type === 'checkbox' || a.type === 'radio') {
    a.checked = b.hasAttribute('checked');
    return;
  }
  if (a.tagName === 'SELECT') {
    queueMicrotask(() => {
      const sel = b.querySelector('option[selected]');
      if (sel && a.value !== sel.value) a.value = sel.value;
    });
    return;
  }
  const v = b.getAttribute('value') ?? '';
  if (a.value === v) dirty.delete(a);
  else if (!focused && !dirty.has(a) && a.type !== 'file') a.value = v;
}

/** Animates the number inside an element from `from` to `to`, keeping the final markup. */
function tween(el, from, to) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || reduceMotion()) return;
  const target = el.querySelector('[data-tween-text]') || el;
  const final = target.textContent;
  const decimals = Number(el.getAttribute('data-tween-decimals') || 0);
  const suffix = el.getAttribute('data-tween-suffix') || '';
  const dur = 620;
  const t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    if (p < 1) {
      target.textContent = (from + (to - from) * e).toFixed(decimals) + suffix;
      target.style.filter = `blur(${((1 - e) * 2.5).toFixed(2)}px)`;
      requestAnimationFrame(step);
    } else {
      target.textContent = final;
      target.style.filter = '';
    }
  };
  requestAnimationFrame(step);
}
