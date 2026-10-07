// Hash router. Routes are matched in order; ':name?' marks an optional segment.
export function parse(hash = location.hash) {
  const h = hash.replace(/^#\/?/, '');
  const [path, q = ''] = h.split('?');
  return { path: path || 'today', parts: (path || 'today').split('/').filter(Boolean), query: Object.fromEntries(new URLSearchParams(q)) };
}

export function match(routes, parts) {
  for (const r of routes) {
    const segs = r.path.split('/');
    const params = {};
    let ok = true;
    for (let i = 0; i < Math.max(segs.length, parts.length); i++) {
      const s = segs[i];
      const p = parts[i];
      if (s === undefined) { ok = false; break; }
      const optional = s.endsWith('?');
      const name = s.replace(/^:/, '').replace(/\?$/, '');
      if (s.startsWith(':')) {
        if (p === undefined) { if (!optional) ok = false; continue; }
        params[name] = decodeURIComponent(p);
      } else if (s !== p) { ok = false; break; }
    }
    if (ok) return { route: r, params };
  }
  return null;
}

export function go(path, { replace = false } = {}) {
  const url = `#/${path.replace(/^#?\/?/, '')}`;
  if (replace) history.replaceState(null, '', url);
  else history.pushState(null, '', url);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}
