// Local preview server: `node dev/server.mjs` then open http://localhost:4100
// Emulates the Shopify storefront endpoints the theme uses (cart AJAX API with section rendering, predictive search,
// recommendations, storefront filters, ?section_id= rendering) against an in-memory cart and the real catalogue.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { THEME, products, productByHandle, collections, globals, renderPage, renderSection, createEngine, money } from './render.mjs';

const PORT = Number(process.env.PORT || 4100);
const PAGE_TEMPLATES = { about: 'page.about', contact: 'page.contact', 'k-beauty': 'page.kbeauty', delivery: 'page.delivery', brands: 'page.brands', faq: 'page.faq', 'routine-finder': 'page.routine-finder', wishlist: 'page.wishlist', 'skin-diary': 'page.skin-diary', rewards: 'page.rewards' };
const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(THEME, p), 'utf8').replace(/^\/\*[\s\S]*?\*\/\s*/, ''));

/* ------------------------------------------------------------------ cart */
let lines = []; // { handle, qty }
function cartObj() {
  const items = lines.map((l, i) => {
    const p = productByHandle[l.handle]; const v = p.variants[0];
    return { key: `${v.id}:${i}`, id: v.id, product_id: p.id, quantity: l.qty, variant: v, product: p, url: p.url, image: p.featured_media, title: p.title, vendor: p.vendor,
      price: v.price, final_price: v.price, final_line_price: v.price * l.qty, original_line_price: v.price * l.qty, line_level_discount_allocations: [] };
  });
  return { items, item_count: items.reduce((a, b) => a + b.quantity, 0), total_price: items.reduce((a, b) => a + b.final_line_price, 0),
    taxes_included: true, cart_level_discount_applications: [], currency: { iso_code: 'MUR' }, requires_shipping: true };
}
function cartJSON() {
  const c = cartObj();
  return { token: 'local', item_count: c.item_count, total_price: c.total_price, currency: 'MUR',
    items: c.items.map((i) => ({ key: i.key, id: i.id, quantity: i.quantity, title: i.title, price: i.price, line_price: i.final_line_price, handle: i.product.handle })) };
}

/* ------------------------------------------------------------------ storefront filters (Shopify's default set) */
function applyFilters(col, q) {
  let list = col.products.slice();
  const tag = q.tag;
  if (tag) list = list.filter((p) => p.tags.some((t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-') === tag));
  const base = new URLSearchParams(q.raw);
  const urlWithout = (param, value) => { const u = new URLSearchParams(base); const all = u.getAll(param).filter((v) => v !== value); u.delete(param); all.forEach((v) => u.append(param, v)); return `${q.path}?${u}`; };
  const avail = base.getAll('filter.v.availability');
  const types = base.getAll('filter.p.product_type');
  const vendors = base.getAll('filter.p.vendor');
  const gte = base.get('filter.v.price.gte'); const lte = base.get('filter.v.price.lte');
  const pass = (p, skip) => (skip === 'a' || !avail.length || avail.includes(p.available ? '1' : '0')) &&
    (skip === 't' || !types.length || types.includes(p.type)) && (skip === 'v' || !vendors.length || vendors.includes(p.vendor)) &&
    (skip === 'p' || ((!gte || p.price >= Number(gte) * 100) && (!lte || p.price <= Number(lte) * 100)));
  const listFor = (skip) => list.filter((p) => pass(p, skip));
  const mk = (label, param, values, active, skip) => {
    const l = listFor(skip);
    const vals = values.map(([value, vlabel]) => ({ label: vlabel, value, param_name: param, active: active.includes(value),
      count: l.filter((p) => (param.includes('availability') ? (p.available ? '1' : '0') === value : param.includes('type') ? p.type === value : p.vendor === value)).length,
      url_to_remove: urlWithout(param, value) }));
    return { label, type: 'list', param_name: param, values: vals, active_values: vals.filter((v) => v.active) };
  };
  const max = Math.max(...col.products.map((p) => p.price), 0);
  const filters = [
    mk('Availability', 'filter.v.availability', [['1', 'In stock'], ['0', 'Out of stock']], avail, 'a'),
    { label: 'Price', type: 'price_range', range_max: max, active_values: [], min_value: { param_name: 'filter.v.price.gte', value: gte ? Number(gte) * 100 : null }, max_value: { param_name: 'filter.v.price.lte', value: lte ? Number(lte) * 100 : null },
      url_to_remove: (() => { const u = new URLSearchParams(base); u.delete('filter.v.price.gte'); u.delete('filter.v.price.lte'); return `${q.path}?${u}`; })() },
    mk('Product type', 'filter.p.product_type', [...new Set(list.map((p) => p.type))].sort().map((t) => [t, t]), types, 't'),
    mk('Brand', 'filter.p.vendor', [...new Set(list.map((p) => p.vendor))].sort().map((t) => [t, t]), vendors, 'v')
  ];
  let out = listFor(null);
  const sort = base.get('sort_by') || 'best-selling';
  const by = { 'title-ascending': (a, b) => a.title.localeCompare(b.title), 'title-descending': (a, b) => b.title.localeCompare(a.title), 'price-ascending': (a, b) => a.price - b.price, 'price-descending': (a, b) => b.price - a.price }[sort];
  if (by) out.sort(by);
  return { ...col, products: out, products_count: out.length, filters, sort_by: sort };
}

/* ------------------------------------------------------------------ helpers */
function send(res, code, body, type = 'text/html; charset=utf-8') { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); }
function readBody(req) { return new Promise((r) => { let d = []; req.on('data', (c) => d.push(c)); req.on('end', () => r(Buffer.concat(d))); }); }
function parseBody(req, buf) {
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json')) return JSON.parse(buf.toString() || '{}');
  if (type.includes('multipart/form-data')) {
    const boundary = type.split('boundary=')[1]; const out = {};
    buf.toString().split('--' + boundary).forEach((part) => { const m = /name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n$/.exec(part); if (m) out[m[1]] = m[2]; });
    return out;
  }
  return Object.fromEntries(new URLSearchParams(buf.toString()));
}
const placeholderSVG = (handle, i, w = 1000, ratio = 1) => {
  const p = productByHandle[handle];
  const h = Math.round(1000 / ratio);
  const tall = /Serum|Toner|Sunscreen|Vitamin|Cleanser|Lip Serum/.test(p?.type || '');
  const shape = tall
    ? `<rect x="400" y="${h * 0.28}" width="200" height="${h * 0.52}" rx="26" fill="#d1d9be"/><rect x="430" y="${h * 0.2}" width="140" height="${h * 0.09}" rx="10" fill="#abb086"/>`
    : `<rect x="320" y="${h * 0.42}" width="360" height="${h * 0.28}" rx="40" fill="#d1d9be"/><rect x="330" y="${h * 0.36}" width="340" height="${h * 0.08}" rx="18" fill="#abb086"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 ${h}"><rect width="1000" height="${h}" fill="#ffffff"/>${shape}<text x="500" y="${h * 0.9}" text-anchor="middle" font-family="Arial" font-size="34" fill="#6b6b66">${(p?.vendor || '').replace(/&/g, '&amp;')} · local preview ${i ? '(2)' : ''}</text></svg>`;
};

async function sectionHTML(id, g) {
  const engine = createEngine();
  if (id === 'cart-drawer') return renderSection(engine, 'cart-drawer', { type: 'cart-drawer', settings: {} }, g);
  if (id === 'predictive-search') return renderSection(engine, 'predictive-search', { type: 'predictive-search', settings: {} }, g);
  // template section ids look like template--1__<key>
  const key = id.split('__').pop();
  const tplName = g.template.toString();
  const t = readJSON(`templates/${tplName}.json`);
  // a section file asked for by name (Section Rendering API: ?section_id=routine-finder) renders with its defaults
  if (!t.sections[key] && fs.existsSync(path.join(THEME, 'sections', `${id}.liquid`))) return renderSection(engine, id, { type: id, settings: {} }, g, '');
  return renderSection(engine, key, t.sections[key], g);
}

/* ------------------------------------------------------------------ router */
http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://localhost:${PORT}`);
    const p = decodeURIComponent(u.pathname);
    const lang = u.searchParams.get('locale') || 'en';

    if (p.startsWith('/assets/')) {
      const f = path.join(THEME, 'assets', path.basename(p));
      if (!fs.existsSync(f)) return send(res, 404, 'missing asset');
      const ext = path.extname(f);
      const types = { '.css': 'text/css', '.js': 'application/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.png': 'image/png' };
      return send(res, 200, fs.readFileSync(f), types[ext] || 'application/octet-stream');
    }
    if (p.startsWith('/__img/')) {
      const [, , handle, file] = p.split('/');
      return send(res, 200, placeholderSVG(handle, Number(file), 1000, Number(u.searchParams.get('r') || 1)), 'image/svg+xml');
    }

    /* cart API */
    if (p === '/cart.js') return send(res, 200, JSON.stringify(cartJSON()), 'application/json');
    if (p === '/cart/add.js' || p === '/cart/add') {
      const body = parseBody(req, await readBody(req));
      // Shopify also accepts { items: [{ id, quantity }] } and answers { items: [...] }
      if (Array.isArray(body.items)) {
        const added = [];
        for (const it of body.items) {
          const pi = products.find((x) => String(x.variants[0].id) === String(it.id));
          if (!pi) return send(res, 404, JSON.stringify({ status: 404, message: 'Cart Error', description: 'Cannot find variant' }), 'application/json');
          const li = lines.find((l) => l.handle === pi.handle);
          if (li) li.qty += Number(it.quantity || 1); else lines.push({ handle: pi.handle, qty: Number(it.quantity || 1) });
          added.push({ id: pi.variants[0].id, key: `${pi.variants[0].id}:${lines.findIndex((l) => l.handle === pi.handle)}`, quantity: Number(it.quantity || 1), title: pi.title });
        }
        const out = { items: added };
        if (body.sections) {
          const g = globals({ template: body.sections_url === '/cart' ? 'cart' : 'index', cart: cartObj(), lang });
          out.sections = {};
          for (const s of [].concat(body.sections)) out.sections[s] = await sectionHTML(s, g);
        }
        return send(res, 200, JSON.stringify(out), 'application/json');
      }
      const pr = products.find((x) => String(x.variants[0].id) === String(body.id));
      if (!pr) return send(res, 404, JSON.stringify({ status: 404, message: 'Cart Error', description: 'Cannot find variant' }), 'application/json');
      const qty = Math.max(1, Number(body.quantity || 1));
      const line = lines.find((l) => l.handle === pr.handle);
      const have = line ? line.qty : 0;
      if (have + qty > pr.variants[0].inventory_quantity) {
        return send(res, 422, JSON.stringify({ status: 422, message: 'Cart Error', description: `You can't add more ${pr.title} to the cart.` }), 'application/json');
      }
      if (line) line.qty += qty; else lines.push({ handle: pr.handle, qty });
      if (p === '/cart/add') { res.writeHead(302, { Location: '/cart' }); return res.end(); }
      const out = { id: pr.variants[0].id, key: `${pr.variants[0].id}:${lines.findIndex((l) => l.handle === pr.handle)}`, quantity: qty, title: pr.title };
      if (body.sections) {
        const g = globals({ template: body.sections_url === '/cart' ? 'cart' : 'index', cart: cartObj(), lang });
        out.sections = {};
        for (const s of String(body.sections).split(',')) out.sections[s] = await sectionHTML(s, g);
      }
      return send(res, 200, JSON.stringify(out), 'application/json');
    }
    if (p === '/cart/change.js' || p === '/cart/change') {
      const body = req.method === 'POST' ? parseBody(req, await readBody(req)) : Object.fromEntries(u.searchParams);
      const idx = Number(body.line) - 1;
      if (lines[idx]) {
        const max = productByHandle[lines[idx].handle].variants[0].inventory_quantity;
        const q = Math.min(Number(body.quantity), max);
        if (q <= 0) lines.splice(idx, 1); else lines[idx].qty = q;
      }
      if (p === '/cart/change') { res.writeHead(302, { Location: '/cart' }); return res.end(); }
      const out = cartJSON();
      if (body.sections) {
        const g = globals({ template: body.sections_url === '/cart' ? 'cart' : 'index', cart: cartObj(), lang });
        out.sections = {};
        for (const s of [].concat(body.sections)) out.sections[s] = await sectionHTML(s, g);
      }
      return send(res, 200, JSON.stringify(out), 'application/json');
    }
    if (p === '/cart/clear') { lines = []; return send(res, 200, '{}', 'application/json'); }
    if (p === '/__seed-cart') { lines = [{ handle: 'torriden-dive-in-low-molecular-hyaluronic-acid-serum', qty: 1 }, { handle: 'round-lab-1025-dokdo-toner', qty: 1 }]; return send(res, 200, '{}', 'application/json'); }

    const cart = cartObj();

    /* predictive search */
    if (p === '/search/suggest') {
      const q = (u.searchParams.get('q') || '').toLowerCase();
      const hits = products.filter((x) => (x.title + ' ' + x.vendor + ' ' + x.tags.join(' ') + ' ' + x.type).toLowerCase().includes(q));
      const cols = Object.values(collections).filter((c) => c.title.toLowerCase().includes(q) && c.products_count > 0).slice(0, 4);
      const g = globals({ template: 'search', cart, lang });
      g.predictive_search = { performed: true, terms: q, resources: { products: hits.slice(0, 6), collections: cols, pages: [], queries: q.length > 2 ? [{ text: q, styled_text: `<mark>${q}</mark>`, url: `/search?q=${encodeURIComponent(q)}` }] : [] } };
      return send(res, 200, await sectionHTML('predictive-search', g));
    }
    if (p === '/recommendations/products') {
      const pr = products.find((x) => String(x.id) === u.searchParams.get('product_id'));
      const recs = products.filter((x) => x !== pr && x.tags.some((t) => pr.tags.includes(t) && !['New', 'Morning', 'Evening', 'All skin types'].includes(t))).slice(0, 4);
      const g = globals({ template: 'product', product: pr, cart, lang });
      g.recommendations = { performed: true, products_count: recs.length, products: recs };
      return send(res, 200, await sectionHTML(u.searchParams.get('section_id'), g));
    }

    /* pages */
    let template = '404', g;
    const parts = p.split('/').filter(Boolean);
    if (p === '/') { template = 'index'; g = globals({ template, cart, lang, url: p + (/dev_customer/.test(u.search) ? u.search : '') }); }
    else if (parts[0] === 'collections' && parts[1]) {
      const col = collections[parts[1]];
      if (col) {
        const tag = parts[2] || null;
        const filtered = applyFilters(col, { raw: u.search, path: p, tag });
        template = col.handle === 'skincare' ? 'collection.skincare' : 'collection';
        g = globals({ template, collection: filtered, currentTags: tag ? [col.all_tags.find((t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-') === tag) || tag] : null, cart, lang, url: p + (/dev_customer/.test(u.search) ? u.search : '') });
      }
    } else if (parts[0] === 'collections') { template = 'list-collections'; g = globals({ template, cart, lang, url: p + (/dev_customer/.test(u.search) ? u.search : '') }); }
    else if (parts[0] === 'products' && productByHandle[parts[1]]) { template = 'product'; g = globals({ template, product: productByHandle[parts[1]], cart, lang, url: p + (/dev_customer/.test(u.search) ? u.search : '') }); }
    else if (parts[0] === 'pages' && PAGE_TEMPLATES[parts[1]]) { template = PAGE_TEMPLATES[parts[1]]; g = globals({ template, page: { title: parts[1], handle: parts[1], content: '' }, cart, lang, url: p + (/dev_customer/.test(u.search) ? u.search : '') }); }
    else if (p === '/cart') { template = 'cart'; g = globals({ template, cart, lang, url: p + (/dev_customer/.test(u.search) ? u.search : '') }); }
    else if (p === '/search') {
      template = 'search';
      const q = (u.searchParams.get('q') || '').trim();
      const results = q ? products.filter((x) => (x.title + ' ' + x.vendor + ' ' + x.tags.join(' ')).toLowerCase().includes(q.toLowerCase())).map((x) => ({ ...x, object_type: 'product' })) : [];
      g = globals({ template, cart, lang, url: p + (/dev_customer/.test(u.search) ? u.search : ''), search: { performed: !!q, terms: q, results, results_count: results.length } });
    } else if (p === '/password') { template = 'password'; g = globals({ template, cart, lang, url: p + (/dev_customer/.test(u.search) ? u.search : '') }); }
    if (!g) g = globals({ template: '404', cart, lang, url: p + (/dev_customer/.test(u.search) ? u.search : '') });

    if (template === 'product' && u.searchParams.get('view')) {
      // alternate product templates (?view=card, ?view=quick): templates/product.<view>.liquid, layout none
      const view = u.searchParams.get('view').replace(/[^a-z0-9_-]/gi, '');
      const file = path.join(THEME, 'templates', `product.${view}.liquid`);
      if (!fs.existsSync(file)) return send(res, 404, 'no such view');
      const engine = createEngine();
      const all = g.getAll ? g.getAll() : g;
      const src = fs.readFileSync(file, 'utf8').replace(/\{%-?\s*layout none\s*-?%\}/, '');
      return send(res, 200, await engine.parseAndRender(src, all, { globals: g.__globals || all }));
    }
    const sid = u.searchParams.get('section_id');
    if (sid) return send(res, 200, await sectionHTML(sid, g));
    return send(res, template === '404' ? 404 : 200, await renderPage(template, g));
  } catch (err) {
    console.error(err);
    send(res, 500, `<pre>${String(err.stack || err).replace(/</g, '&lt;')}</pre>`);
  }
}).listen(PORT, () => console.log(`Moana preview on http://localhost:${PORT}`));
