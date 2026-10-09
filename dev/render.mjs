// Local preview renderer for the Moana Beauté theme.
// Renders the real theme files with liquidjs and Shopify-shaped objects built from the store's real catalogue
// (dev/data/*.json, exported from the Admin API). It exists because this environment cannot reach the storefront;
// it is a QA aid, not a Shopify replacement: Shopify-only behaviour (checkout, real filters, real search ranking)
// is approximated, and product photos (served from cdn.shopify.com) are replaced by labelled placeholders.
import { Liquid, Tag, Hash } from '../tools/node/node_modules/liquidjs/dist/liquid.node.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const THEME = path.resolve(HERE, '../theme');
const read = (p) => fs.readFileSync(path.join(THEME, p), 'utf8');
const readJSON = (p) => JSON.parse(read(p).replace(/^\/\*[\s\S]*?\*\/\s*/, ''));
const handleize = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/* ------------------------------------------------------------------ data */
const rawProducts = JSON.parse(fs.readFileSync(path.join(HERE, 'data/products.json'), 'utf8')).data.products.nodes;
const rawCollections = JSON.parse(fs.readFileSync(path.join(HERE, 'data/collections.json'), 'utf8'));

function imageObj(src, alt, w, h, key) {
  return { src, alt, width: w, height: h, aspect_ratio: w / h, _key: key, preview_image: null };
}
export const products = rawProducts.map((p, idx) => {
  const mf = {};
  p.metafields.nodes.forEach((m) => { mf[m.key] = { value: m.type.startsWith('list.') ? JSON.parse(m.value) : m.value, type: m.type }; });
  const media = p.media.nodes.map((m, i) => {
    const img = imageObj(`/__img/${p.handle}/${i}.svg`, m.alt || p.title, m.image.width, m.image.height, `${p.handle}:${i}`);
    img.preview_image = img; img.media_type = 'image'; img.id = idx * 10 + i;
    return img;
  });
  const v = p.variants.nodes[0];
  const variant = {
    id: Number(v.id.split('/').pop()), title: v.title, sku: v.sku, price: Math.round(Number(v.price) * 100),
    compare_at_price: v.compareAtPrice ? Math.round(Number(v.compareAtPrice) * 100) : null,
    available: v.availableForSale, inventory_quantity: v.inventoryQuantity, inventory_management: 'shopify', inventory_policy: 'deny',
    options: [v.title]
  };
  return {
    id: Number(p.id.split('/').pop()), published_at: '2026-10-08T09:55:26Z', created_at: '2026-10-08T09:55:24Z', title: p.title, handle: p.handle, vendor: p.vendor, type: p.productType, tags: p.tags,
    description: p.descriptionHtml, content: p.descriptionHtml, url: `/products/${p.handle}`, price: variant.price, price_min: variant.price,
    price_max: variant.price, price_varies: false, available: variant.available, compare_at_price: variant.compare_at_price,
    featured_media: media[0], featured_image: media[0], media, images: media, metafields: { custom: mf },
    variants: [variant], selected_or_first_available_variant: variant, first_available_variant: variant,
    has_only_default_variant: true, options: ['Title'], options_with_values: [{ name: 'Title', values: [v.title], selected_value: v.title }],
    seo: p.seo
  };
});
export const productByHandle = Object.fromEntries(products.map((p) => [p.handle, p]));

function buildCollection(c, list) {
  return {
    id: list.length + 1, handle: c.handle, title: c.title, description: c.description, url: `/collections/${c.handle}`, image: null,
    products: list, products_count: list.length, all_products_count: list.length, all_tags: [...new Set(list.flatMap((p) => p.tags))],
    featured_image: list[0]?.featured_media || null, sort_by: null, default_sort_by: 'best-selling', filters: [], template_suffix: c.handle === 'skincare' ? 'skincare' : '',
    sort_options: [['manual', 'Featured'], ['best-selling', 'Best selling'], ['title-ascending', 'Alphabetically, A-Z'], ['title-descending', 'Alphabetically, Z-A'],
      ['price-ascending', 'Price, low to high'], ['price-descending', 'Price, high to low'], ['created-descending', 'Date, new to old'], ['created-ascending', 'Date, old to new']]
      .map(([value, name]) => ({ value, name }))
  };
}
export const collections = {};
for (const c of rawCollections) {
  const r = c.rules;
  const list = r.none ? [] : products.filter((p) => (r.type && r.type.includes(p.type)) || (r.tag && r.tag.some((t) => p.tags.includes(t))) || (r.vendor && r.vendor.includes(p.vendor)));
  collections[c.handle] = buildCollection(c, list);
}
collections.all = buildCollection({ handle: 'all', title: 'Products', description: '' }, products);

const pages = Object.fromEntries(['about', 'contact', 'k-beauty', 'delivery', 'brands', 'faq', 'routine-finder', 'wishlist'].map((h) => [h, {
  handle: h, url: `/pages/${h}`, content: '', title: { about: 'About', contact: 'Contact', 'k-beauty': 'K-Beauty', delivery: 'Delivery & Returns', brands: 'Brands', faq: 'FAQ', 'routine-finder': 'Find my routine', wishlist: 'Wishlist' }[h]
}]));

function link(title, url, children = []) {
  const handle = url.split('/').pop();
  const isCol = url.startsWith('/collections/');
  return { title, url, type: isCol ? 'collection_link' : 'page_link', object: isCol ? collections[handle] : null, links: children, current: false, active: false };
}
const catLinks = ['cleansers', 'toners-essences', 'serums-ampoules', 'moisturisers', 'sunscreen', 'masks', 'eye-care', 'lip-care'].map((h) => link(collections[h].title, `/collections/${h}`));
// mirrors the menus the build creates in Shopify (moana-main, moana-footer-shop) and the store's existing footer menu
export const linklists = {
  'moana-main': { links: [link('Shop', '/collections/skincare', catLinks), link('Brands', '/pages/brands'), link('The routine', '/pages/k-beauty'), link('About', '/pages/about')] },
  'main-menu': { links: [link('Skincare', '/collections/skincare', catLinks)] },
  'moana-nav': { links: [link('New In', '/collections/new'), link('Skincare', '/collections/skincare', catLinks), link('Cleansers', '/collections/cleansers'), link('Toners & Essences', '/collections/toners-essences'), link('Serums', '/collections/serums-ampoules'), link('Moisturisers', '/collections/moisturisers'), link('Sunscreen', '/collections/sunscreen'), link('Brands', '/pages/brands'), link('Routine guide', '/pages/k-beauty')] },
  'moana-footer-help': { links: [link('Delivery & returns', '/pages/delivery'), link('FAQ', '/pages/faq'), link('Contact', '/pages/contact')] },
  footer: { links: [link('Delivery & returns', '/pages/delivery'), link('FAQ', '/pages/faq'), link('Contact', '/pages/contact'), link('Privacy policy', '/policies/privacy-policy'), link('Terms of service', '/policies/terms-of-service')] },
  'moana-footer-shop': { links: [link('All skincare', '/collections/skincare'), link('New', '/collections/new'), link('Brands', '/pages/brands'), link('The routine guide', '/pages/k-beauty'), link('About us', '/pages/about')] }
};

/* ------------------------------------------------------------------ locale + money */
const locales = { en: readJSON('locales/en.default.json'), fr: readJSON('locales/fr.json') };
function translate(key, args, lang = 'en') {
  let v = key.split('.').reduce((o, k) => (o ? o[k] : undefined), locales[lang]);
  if (v && typeof v === 'object') v = Number(args.count) === 1 ? v.one : v.other;
  if (v === undefined) return `translation missing: ${lang}.${key}`;
  return String(v).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (args[k] ?? ''));
}
export function money(cents) {
  const n = Math.round(Number(cents || 0) / 100);
  return 'Rs ' + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/* ------------------------------------------------------------------ engine */
export function createEngine(ctxExtra = {}) {
  const engine = new Liquid({ root: [path.join(THEME, 'snippets')], extname: '.liquid', strictFilters: false, strictVariables: false, jsTruthy: false, dynamicPartials: true, relativeReference: false });
  const kw = (args) => Object.fromEntries(args.filter(Array.isArray));
  const imgURL = (img, width) => (typeof img === 'string' ? img : (img && img.src ? `${img.src}?w=${width || ''}&r=${(img.aspect_ratio || 1).toFixed(3)}` : ''));
  engine.registerFilter('t', function (key, ...args) { return translate(key, kw(args), this.context.getSync(['request', 'locale', 'iso_code']) || 'en'); });
  engine.registerFilter('asset_url', (n) => `/assets/${n}`);
  engine.registerFilter('image_url', (img, ...args) => imgURL(img, kw(args).width));
  engine.registerFilter('img_url', (img) => imgURL(img, 600));
  engine.registerFilter('image_tag', (url, ...args) => {
    const o = kw(args);
    const m = /r=([\d.]+)/.exec(url || '');
    const ratio = m ? Number(m[1]) : 1;
    const base = String(url).split('?')[0];
    const w = 1200, h = Math.round(w / ratio);
    const srcset = (o.widths || '').split(',').map((s) => s.trim()).filter(Boolean).map((x) => `${base}?w=${x}&r=${ratio} ${x}w`).join(', ');
    const attrs = [`src="${url}"`, `alt="${String(o.alt ?? '').replace(/"/g, '&quot;')}"`, `width="${o.width || w}"`, `height="${o.height || h}"`];
    if (srcset) attrs.push(`srcset="${srcset}"`);
    if (o.sizes) attrs.push(`sizes="${o.sizes}"`);
    if (o.loading) attrs.push(`loading="${o.loading}"`);
    if (o.fetchpriority) attrs.push(`fetchpriority="${o.fetchpriority}"`);
    if (o.class) attrs.push(`class="${o.class}"`);
    return `<img ${attrs.join(' ')}>`;
  });
  engine.registerFilter('money', money);
  engine.registerFilter('money_without_currency', (c) => money(c).replace('Rs ', ''));
  engine.registerFilter('handle', handleize);
  engine.registerFilter('handleize', handleize);
  engine.registerFilter('stylesheet_tag', (u, ...a) => (kw(a).preload ? `<link rel="preload" href="${u}" as="style">` : '') + `<link rel="stylesheet" href="${u}">`);
  engine.registerFilter('preload_tag', (u, ...a) => { const o = kw(a); return `<link rel="preload" href="${u}" as="${o.as}" type="${o.type || ''}" crossorigin>`; });
  engine.registerFilter('placeholder_svg_tag', (n, cls) => `<svg class="${cls || ''}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="#f4f4f4"/></svg>`);
  engine.registerFilter('structured_data', (p) => JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.title, brand: { '@type': 'Brand', name: p.vendor }, offers: { '@type': 'Offer', price: (p.price / 100).toFixed(2), priceCurrency: 'MUR', availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } }));
  engine.registerFilter('default_errors', (e) => (Array.isArray(e?.messages) ? e.messages.join(' ') : ''));
  engine.registerFilter('time_tag', (d) => `<time>${d}</time>`);
  engine.registerFilter('format_code', (c) => c);
  engine.registerFilter('payment_type_svg_tag', () => '');

  // tags that Shopify compiles away
  for (const name of ['schema', 'stylesheet', 'javascript']) {
    engine.registerTag(name, class extends Tag {
      constructor(token, remain, liquid) { super(token, remain, liquid); const end = 'end' + name; while (remain.length) { const t = remain.shift(); if (t.name === end) return; } }
      * render() { }
    });
  }
  engine.registerTag('layout', class extends Tag { * render(ctx) { ctx.environments.__layout = this.token.args.trim().replace(/['"]/g, ''); } });

  engine.registerTag('form', class extends Tag {
    constructor(token, remain, liquid) {
      super(token, remain, liquid);
      const m = /^\s*'([^']+)'\s*(?:,\s*([a-zA-Z_][\w.]*))?\s*(?:,\s*(.*))?$/s.exec(token.args);
      this.type = m[1]; this.objExpr = m[2] && !m[2].includes(':') ? m[2] : null;
      this.hash = new Hash(m[3] || (m[2] && m[2].includes(':') ? m[2] : ''));
      this.tpls = [];
      const stream = liquid.parser.parseStream(remain).on('tag:endform', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('form not closed'); });
      stream.start();
    }
    * render(ctx, emitter) {
      const opts = yield this.hash.render(ctx);
      const actions = { product: '/cart/add', contact: '/contact#contact_form', localization: '/localization', storefront_password: '/password', customer: '/contact#newsletter' };
      const attrs = Object.entries(opts).filter(([k]) => !['return_to'].includes(k)).map(([k, v]) => `${k}="${v}"`).join(' ');
      emitter.write(`<form method="post" action="${actions[this.type] || '/'}" accept-charset="UTF-8" enctype="multipart/form-data" ${attrs}><input type="hidden" name="form_type" value="${this.type}"><input type="hidden" name="utf8" value="✓">`);
      ctx.push({ form: { posted_successfully: false, errors: null } });
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      ctx.pop();
      emitter.write('</form>');
    }
  });

  engine.registerTag('paginate', class extends Tag {
    constructor(token, remain, liquid) {
      super(token, remain, liquid);
      const m = /^\s*([\w.]+)\s+by\s+([\w.]+)/.exec(token.args);
      this.expr = m[1]; this.by = m[2];
      this.tpls = [];
      const stream = liquid.parser.parseStream(remain).on('tag:endpaginate', () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error('paginate not closed'); });
      stream.start();
    }
    * render(ctx, emitter) {
      const arr = (yield this.liquid.evalValue(this.expr, ctx)) || [];
      const by = Number(yield this.liquid.evalValue(this.by, ctx)) || 24;
      const pagesN = Math.max(1, Math.ceil(arr.length / by));
      ctx.push({ paginate: { pages: pagesN, current_page: 1, items: arr.length, page_size: by, parts: [] } });
      yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
      ctx.pop();
    }
  });

  const sectionTag = (group) => class extends Tag {
    * render(ctx, emitter) {
      const name = this.token.args.trim().replace(/['"]/g, '');
      if (group) {
        const g = readJSON(`sections/${name}.json`);
        for (const key of g.order) emitter.write(yield renderSection(engine, key, g.sections[key], ctx, 'sections--1__'));
      } else {
        emitter.write(yield renderSection(engine, name, { type: name, settings: {} }, ctx));
      }
    }
  };
  engine.registerTag('section', sectionTag(false));
  engine.registerTag('sections', sectionTag(true));
  Object.assign(engine, { ctxExtra });
  return engine;
}

/* ------------------------------------------------------------------ sections */
function schemaOf(file) {
  const m = /\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/.exec(file);
  return m ? JSON.parse(m[1]) : { settings: [] };
}
export function stylesheets() {
  return fs.readdirSync(path.join(THEME, 'sections')).filter((f) => f.endsWith('.liquid')).map((f) => {
    const m = /\{%\s*stylesheet\s*%\}([\s\S]*?)\{%\s*endstylesheet\s*%\}/.exec(read(`sections/${f}`));
    return m ? `/* ${f} */\n${m[1]}` : '';
  }).join('\n');
}
function resolveSetting(def, value) {
  if (value === undefined) value = def.default;
  if (value === undefined || value === '') return def.type === 'checkbox' ? false : null;
  switch (def.type) {
    case 'collection': return collections[value] || null;
    case 'product': return productByHandle[value] || null;
    case 'collection_list': return (value || []).map((h) => collections[h]).filter(Boolean);
    case 'product_list': return (value || []).map((h) => productByHandle[h]).filter(Boolean);
    case 'url': return String(value).replace(/^shopify:\/\/(collections|pages|products)\//, '/$1/');
    case 'image_picker': return null;
    case 'richtext': case 'inline_richtext': return String(value).replace(/href="shopify:\/\/(collections|pages|products)\//g, 'href="/$1/');
    default: return value;
  }
}
function settingsFor(defs, raw) {
  const out = {};
  for (const d of defs || []) if (d.id) out[d.id] = resolveSetting(d, raw?.[d.id]);
  return out;
}
export async function renderSection(engine, id, data, ctx, prefix = 'template--1__') {
  const file = read(`sections/${data.type}.liquid`);
  const schema = schemaOf(file);
  const blockDefs = Object.fromEntries((schema.blocks || []).map((b) => [b.type, b]));
  const order = data.block_order || Object.keys(data.blocks || {});
  const blocks = order.map((k) => { const b = data.blocks[k]; return { id: k, type: b.type, settings: settingsFor(blockDefs[b.type]?.settings, b.settings), shopify_attributes: '' }; });
  const section = { id: `${prefix}${id}`, settings: settingsFor(schema.settings, data.settings), blocks };
  const scope = { section };
  const g = ctx.getAll ? ctx.getAll() : ctx;
  // Shopify globals (settings, shop, routes…) must also reach {% render %}ed snippets: pass them as liquidjs globals.
  const html = await engine.parseAndRender(file, { ...g, ...scope }, { globals: ctx.__globals || g });
  const tag = schema.tag || 'div';
  return `<${tag} id="shopify-section-${section.id}" class="shopify-section${schema.class ? ' ' + schema.class : ''}">${html}</${tag}>`;
}

/* ------------------------------------------------------------------ globals per request */
export function globals({ template, collection = null, product = null, page = null, cart, currentTags = null, search = null, lang = 'en', url = '/' }) {
  const settings = readJSON('config/settings_data.json').current;
  return {
    settings, collections, linklists, pages, product, collection, page, cart, search,
    current_tags: currentTags, current_page: 1,
    shop: {
      name: 'My Store', email: 'shop@moanabeaute.com', url: 'http://localhost:4100', money_format: 'Rs {{amount_no_decimals}}', customer_accounts_enabled: false,
      policies: [['Privacy policy', 'privacy-policy'], ['Shipping', 'shipping-policy'], ['Terms of service', 'terms-of-service'], ['Contact', 'contact-information']].map(([title, h]) => ({ title, url: `/policies/${h}` })),
      enabled_payment_types: [], password_message: ''
    },
    request: { locale: { iso_code: lang }, path: url, host: 'localhost' },
    localization: { available_languages: [{ iso_code: 'en', endonym_name: 'English' }, { iso_code: 'fr', endonym_name: 'français' }], language: { iso_code: lang } },
    routes: { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', cart_update_url: '/cart/update', search_url: '/search', predictive_search_url: '/search/suggest', product_recommendations_url: '/recommendations/products', all_products_collection_url: '/collections/all', account_url: '/account', collections_url: '/collections' },
    template: { name: template.split('.')[0], suffix: template.split('.')[1] || null, toString() { return template; } },
    canonical_url: 'http://localhost:4100' + url, page_title: product?.title || collection?.title || page?.title || 'Moana Beauté',
    page_description: product?.seo?.description || '', page_image: product?.featured_media || null, content_for_header: '',
    recommendations: { performed: false, products_count: 0, products: [] },
    predictive_search: { performed: false }
  };
}

export async function renderPage(templateName, g) {
  const engine = createEngine();
  const tplPath = `templates/${templateName}`;
  let content;
  let layoutName = 'theme';
  if (fs.existsSync(path.join(THEME, tplPath + '.json'))) {
    const t = readJSON(tplPath + '.json');
    if (t.layout) layoutName = t.layout;
    const parts = [];
    for (const key of t.order) parts.push(await renderSection(engine, key, t.sections[key], { ...g, __globals: g }));
    content = parts.join('\n');
  } else {
    const src = read(tplPath + '.liquid');
    if (/\{%-?\s*layout none/.test(src)) return engine.parseAndRender(src, g, { globals: g });
    content = await engine.parseAndRender(src, g, { globals: g });
  }
  const layout = read(`layout/${layoutName}.liquid`);
  let html = await engine.parseAndRender(layout, { ...g, content_for_layout: content }, { globals: g });
  html = html.replace('</head>', `<style data-compiled-section-css>${stylesheets()}</style>\n</head>`);
  return html;
}
