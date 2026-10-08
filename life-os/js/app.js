import * as store from './data/store.js';
import { SEED_VERSION, LATEST_MIGRATION } from './data/schema.js';
import { patch } from './ui/patch.js';
import * as router from './ui/router.js';
import * as sheet from './ui/sheet.js';
import { toast } from './ui/toast.js';
import { icon, loadIcons } from './ui/icons.js';
import { html } from './ui/dom.js';
import { firstRender, fill, waitingKeys } from './ui/later.js';
import { app, APP_NAME } from './ui/app-api.js';
import { today, setDayEnd } from './domain/dates.js';

import { PLACES, ROUTES } from './routes.js';

const main = document.getElementById('main');
const tabbar = document.getElementById('tabbar');
const scrollMemory = new Map();
const uiMemory = new Map();
let current = null;
let navToken = 0;
let refreshQueued = false;
// Screen changes animate once ui/transitions.js has loaded (just after the first screen).
let swap = (update) => update();

/* ---------- theme ---------- */
const media = matchMedia('(prefers-color-scheme: dark)');
export function applyTheme(theme = store.settings()?.theme || 'system') {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('lifeos.theme', theme); } catch { /* private mode */ }
  const dark = theme === 'dark' || (theme === 'system' && media.matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#000000' : '#FFFFFF'));
}
media.addEventListener?.('change', () => applyTheme());

/* ---------- tab bar ---------- */
// Phone: a floating pill, Today · Plan · + · Progress · Reflect. Tablet and desktop: a rail,
// with + and You below the places.
function renderTabbar() {
  const place = (t) => html`<a class="tab" href="#/${t.path}" data-key="tab-${t.id}" ${current?.route.tab === t.id ? html`aria-current="page"` : ''}>
      ${icon(t.icon, { size: 23, stroke: current?.route.tab === t.id ? 2 : 1.6 })}<span>${t.label}</span></a>`;
  patch(tabbar, html`
    <div class="tab-brand">${icon('orbit', { size: 20 })}<span>${APP_NAME}</span></div>
    ${PLACES.slice(0, 2).map(place)}
    <button type="button" class="tab tab--capture" data-action="capture" data-key="tab-capture" aria-label="Log something" aria-keyshortcuts="N">${icon('plus', { size: 24, stroke: 2 })}<span>Log something</span></button>
    ${PLACES.slice(2).map(place)}
    <button type="button" class="tab tab--you" data-action="you" data-key="tab-you" ${current?.route.tab === 'you' ? html`aria-current="page"` : ''}>${icon('user-round', { size: 22, stroke: 1.6 })}<span>You</span></button>
    <p class="tab-foot">Everything stays on this device.</p>`);
}

/* ---------- views ---------- */
const ctxOf = (c) => ({ params: c.params, query: c.query, ui: c.ui, route: c.route, path: c.path });

// Older addresses land on their new homes, keeping any query. The table loads only when needed.
const LEGACY = /^(habits|body|more)(\/|$)|^you$|^progress\/(areas|overview|insights)$|^plan\/habits\/[^/]+\/edit$/;
async function redirect() {
  const { parts, query, path } = router.parse();
  if (!LEGACY.test(path)) return false;
  const { REDIRECTS, target } = await import('./redirects.js');
  const old = router.match(REDIRECTS, parts);
  if (!old) return false;
  let to = target(old.route.to, old.params);
  const q = new URLSearchParams(query).toString();
  if (q) to += (to.includes('?') ? '&' : '?') + q;
  history.replaceState(history.state, '', `#/${to}`);
  return true;
}

// On wide screens a detail (a habit, a goal, an entry) sits beside its list. The list pane
// survives moving between details, so its scroll and state stay put.
const wide = matchMedia('(min-width: 1024px)');
let pane = null; // { route, path, view, ui, params, query, el }
const ERROR_HTML = () => String(html`<div class="empty"><p class="empty-title">Something went wrong on this screen.</p><p class="empty-body">Your data is safe. Try going back to Today.</p><a class="btn btn--soft" href="#/today">Back to Today</a></div>`);

// How long each view takes to render and reach the page (the last 60), for the performance tests.
const renderTimes = [];
function timed(c, fn) {
  const t0 = performance.now();
  fn();
  renderTimes.push({ route: c.route.path, ms: performance.now() - t0 });
  if (renderTimes.length > 60) renderTimes.shift();
}

let waiting = []; // sections of the screen being opened that fill in after it (ui/later.js)
function renderInto(el, c, defer = true) {
  timed(c, () => {
    try {
      const r = defer ? firstRender(() => c.view.render(ctxOf(c))) : { markup: c.view.render(ctxOf(c)), waiting: [] };
      el.innerHTML = String(r.markup);
      waiting.push(...r.waiting);
    } catch (err) { console.error(err); el.innerHTML = ERROR_HTML(); }
  });
}

function markSelected() {
  if (!pane) return;
  pane.el.querySelectorAll('[aria-current="page"]').forEach((a) => a.removeAttribute('aria-current'));
  if (current && current.el !== pane.el) pane.el.querySelector(`a[href="#/${current.path}"]`)?.setAttribute('aria-current', 'page');
}

function dropPane() {
  if (!pane) return;
  pane.view.unmount?.(pane.el, ctxOf(pane));
  pane = null;
}

async function navigate() {
  const token = ++navToken;
  await redirect();
  if (token !== navToken) return;
  const back = wentBack;
  wentBack = false;
  const { parts, query, path } = router.parse();
  const found = router.match(ROUTES, parts) || router.match(ROUTES, ['today']);
  const listRoute = found.route.list && wide.matches ? ROUTES.find((r) => r.path === found.route.list) : null;
  let mod, listMod;
  try {
    // Screens other than Today wait for the rest of the icons (already loaded after the first screen).
    [mod, listMod] = await Promise.all([found.route.load(), listRoute && listRoute !== found.route ? listRoute.load() : null, found.route.tab !== 'today' ? loadIcons() : null]);
  } catch (err) {
    console.error(err);
    toast('That screen couldn’t load. Check your connection once, then it works offline.', { tone: 'danger' });
    return;
  }
  if (token !== navToken) return;
  const view = mod.default;
  const prev = current;
  const keepPane = !!(listRoute && pane && pane.path === listRoute.path);
  if (prev) {
    scrollMemory.set(prev.path, window.scrollY);
    if (!(keepPane && prev.el === pane.el)) prev.view.unmount?.(prev.el, ctxOf(prev));
  }
  if (!keepPane) dropPane();
  sheet.closeAll();

  let dir = 'view--fade';
  if (prev && prev.route.tab === found.route.tab) {
    if (found.route.depth > prev.route.depth) dir = 'view--push';
    else if (found.route.depth < prev.route.depth) dir = 'view--pop';
  }
  // Back returns to exactly where you were; going somewhere new starts at the top. A screen
  // returned to mid-page draws in full at once, so nothing below shifts under you.
  const y = back || dir === 'view--pop' ? scrollMemory.get(path) || 0 : 0;
  const ui = uiMemory.get(path) || {};
  uiMemory.set(path, ui);
  current = { route: found.route, params: found.params, query, view, ui, path, el: null };
  const isList = !!listRoute && listRoute === found.route;

  // The list pane: kept if it's the same list, otherwise rendered fresh.
  waiting = [];
  let freshPane = false;
  if (listRoute && !keepPane) {
    const lv = isList ? view : listMod.default;
    const lui = uiMemory.get(listRoute.path) || {};
    uiMemory.set(listRoute.path, lui);
    pane = { route: listRoute, path: listRoute.path, view: lv, ui: lui, params: {}, query: isList ? query : {}, el: document.createElement('div') };
    pane.el.className = 'view split-list';
    pane.el.dataset.view = lv.id || '';
    pane.el.dataset.pane = 'list';
    renderInto(pane.el, pane);
    freshPane = true;
  }

  let el;
  if (isList) {
    el = pane.el;
    current.el = el;
    if (!freshPane) timed(current, () => patch(el, view.render(ctxOf(current))));
  } else {
    el = document.createElement('div');
    el.className = `view ${dir === 'view--fade' ? '' : dir}${view.wide ? ' view--wide' : ''}${listRoute ? ' split-detail' : ''}`;
    el.dataset.view = view.id || '';
    current.el = el;
    renderInto(el, current, !y);
  }
  const detail = isList ? (() => {
    const d = document.createElement('div');
    d.className = 'view split-detail split-empty';
    d.innerHTML = String(html`<div class="empty"><div class="empty-ic">${icon(listRoute.emptyIcon || 'list', { size: 22 })}</div><p class="empty-body">${listRoute.emptyText || 'Choose something on the left.'}</p></div>`);
    return d;
  })() : el;

  // Everything that needs the new screen in the document runs once it's there.
  const settle = () => {
    if (freshPane && !isList) pane.view.mount?.(pane.el, ctxOf(pane));
    if (!(isList && !freshPane)) view.mount?.(el, ctxOf(current));
    markSelected();
    growAll(main);
    renderTabbar();
    document.title = view.title ? `${typeof view.title === 'function' ? view.title(ctxOf(current)) : view.title} · ${APP_NAME}` : APP_NAME;
    if (prev) {
      const h1 = (isList ? pane.el : el).querySelector('h1');
      if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }
  };
  const apply = () => {
    if (token !== navToken) return;
    // Arriving by a View Transition: the CSS entrances would animate a second time.
    if (document.documentElement.dataset.nav) [el, detail, freshPane ? pane.el : null].filter(Boolean).forEach((n) => n.classList.add('view--vt'));
    if (listRoute) {
      let split = main.querySelector(':scope > .split');
      if (!split || !keepPane) { split = document.createElement('div'); split.className = 'split'; main.replaceChildren(split); }
      if (pane.el.parentNode !== split) split.prepend(pane.el);
      [...split.children].filter((c) => c !== pane.el).forEach((c) => c.remove());
      split.append(detail);
    } else {
      main.replaceChildren(el);
    }
    window.scrollTo(0, y);
    settle();
    // The sections that waited fill in after, once the screen is on its way.
    fill(main, waiting); // (an empty list also stops a previous screen's fill)
    waiting = [];
  };
  if (prev) swap(apply, dir.replace('view--', '')); else apply();
}
wide.addEventListener?.('change', () => { if (current?.route.list) navigate(); });

function refresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  // The frame after a change first paints the tap's own response (the pressed state, a check
  // ticking); the screen redraws straight after that paint, so a tap never waits on a render.
  requestAnimationFrame(() => setTimeout(() => {
    refreshQueued = false;
    if (!current?.el) return;
    try {
      const restore = focusAnchor(main);
      // Sections still filling in stay deferred, so a change mid-fill doesn't work them all out at once.
      const keys = waitingKeys();
      timed(current, () => {
        const r = keys ? firstRender(() => current.view.render(ctxOf(current)), keys) : { markup: current.view.render(ctxOf(current)), waiting: [] };
        patch(current.el, r.markup);
        if (keys) fill(main, r.waiting);
      });
      current.view.update?.(current.el, ctxOf(current));
      if (pane && pane.el !== current.el) patch(pane.el, pane.view.render(ctxOf(pane)));
      markSelected();
      growAll(main);
      restore();
    } catch (err) {
      console.error(err);
    }
    sheet.refreshAll();
  }));
}

// If a re-render removes or hides the focused control (a group that collapses once
// it's complete), move focus to the nearest surviving container instead of <body>.
const FOCUSABLE = 'button:not([disabled]), a[href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
const visible = (n) => n.isConnected && n.getClientRects().length > 0;
function focusAnchor(root) {
  const prev = document.activeElement;
  if (!prev || prev === document.body || !root.contains(prev)) return () => {};
  const chain = [];
  for (let n = prev.parentElement; n && n !== root; n = n.parentElement) chain.push(n);
  return () => {
    if (document.activeElement && document.activeElement !== document.body) return;
    if (visible(prev)) { prev.focus({ preventScroll: true }); return; }
    const box = chain.find(visible);
    const target = [...(box || root).querySelectorAll(FOCUSABLE)].find(visible);
    target?.focus({ preventScroll: true });
  };
}

/* ---------- event delegation ---------- */
function sheetOf(el) {
  const wrap = el.closest('[data-sheet]');
  return wrap ? sheet.sheets().find((s) => s.id === wrap.dataset.sheet) : null;
}

const globalActions = {
  'go-back': ({ data }) => back(data.fallback),
  'nav': ({ data }) => app.go(data.to),
  'open-search': () => app.search(),
  capture: async () => (await import('./screens/capture.js')).openCapture(),
  you: async () => (await import('./screens/you.js')).openYou(),
};

/** The view that owns an element: the list pane beside a detail, or the current screen. */
const ownerOf = (el) => (pane && pane.el !== current?.el && pane.el.contains(el) ? pane : current);

function resolve(el, kind, name) {
  const s = sheetOf(el);
  const table = kind === 'action' ? 'actions' : 'inputs';
  return (s && s[table][name]) || (ownerOf(el)?.view[table]?.[name]) || (kind === 'action' ? globalActions[name] : null);
}

function run(handler, el, event, extra = {}) {
  const s = sheetOf(el);
  const owner = ownerOf(el);
  try {
    const out = handler({ el, data: el.dataset, event, sheet: s, ui: s ? s.ui : owner?.ui, params: owner?.params, value: el.value, ...extra });
    if (out instanceof Promise) out.catch((err) => { console.error(err); toast('That didn’t work. Your data is safe. Try again.', { tone: 'danger' }); });
  } catch (err) {
    console.error(err);
    toast('That didn’t work. Your data is safe. Try again.', { tone: 'danger' });
  }
}

document.addEventListener('click', (e) => {
  const closer = e.target.closest('[data-sheet-close]');
  if (closer) { sheet.close(sheetOf(closer)); return; }
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled || el.getAttribute('aria-disabled') === 'true') return;
  const handler = resolve(el, 'action', el.dataset.action);
  if (!handler) return;
  if (el.tagName === 'A') e.preventDefault();
  // A check or switch flips at once; the redraw that follows shows what was really saved.
  const flip = el.matches('[role="checkbox"], [role="switch"]') && ['true', 'false'].includes(el.getAttribute('aria-checked'));
  if (flip) {
    const on = el.getAttribute('aria-checked') === 'false';
    el.setAttribute('aria-checked', String(on));
    if (el.classList.contains('check')) { el.classList.toggle('check--done', on); el.classList.toggle('check--open', !on); }
  }
  run(handler, el, e);
  if (flip) refresh();
});

for (const type of ['input', 'change']) {
  document.addEventListener(type, (e) => {
    const el = e.target.closest(`[data-${type}]`);
    if (!el) return;
    const handler = resolve(el, 'input', el.dataset[type]);
    if (handler) run(handler, el, e, { value: el.type === 'checkbox' ? el.checked : el.value });
  });
}

// Grow-to-fit answers: one line that wraps. Enter still means "done", like a normal field.
const growNative = CSS.supports?.('field-sizing', 'content');
function grow(el) {
  if (el.value.includes('\n')) el.value = el.value.replace(/\s*\n+\s*/g, ' ');
  if (growNative) return;
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight + 2}px`;
}
document.addEventListener('input', (e) => { if (e.target.matches?.('textarea[data-grow]')) grow(e.target); }, true);
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || e.isComposing || !e.target.matches?.('textarea[data-grow]')) return;
  e.preventDefault();
  const form = e.target.closest('form');
  if (form?.dataset.submit) form.requestSubmit();
  else e.target.blur();
});
export const growAll = (root = document) => { if (!growNative) root.querySelectorAll('textarea[data-grow]').forEach(grow); };

document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-submit]');
  if (!form) return;
  e.preventDefault();
  const handler = resolve(form, 'action', form.dataset.submit);
  if (handler) run(handler, form, e, { form: Object.fromEntries(new FormData(form)) });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && sheet.top()) { sheet.close(); return; }
  if (e.key === 'Tab') sheet.trapFocus(e);
});

/* ---------- navigation helpers ---------- */
let internalNavs = 0;
function back(fallback = 'today') {
  if (internalNavs > 0) history.back();
  else router.go(fallback, { replace: true });
}

let wentBack = false;
window.addEventListener('hashchange', () => navigate());
window.addEventListener('popstate', () => { wentBack = true; if (internalNavs > 0) internalNavs--; });

/* ---------- service worker ---------- */
function registerSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then((reg) => {
    reg.addEventListener('updatefound', () => {
      const nw = reg.installing;
      nw?.addEventListener('statechange', () => {
        if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          toast('A new version of Life OS is ready.', {
            duration: 0,
            action: { label: 'Update', fn: () => nw.postMessage({ type: 'skip-waiting' }) },
          });
        }
      });
    });
  }).catch((err) => console.warn('Service worker not registered', err));
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // The first install claims the page; only an update (user tapped Update) should reload.
    if (reloading || !hadController) return;
    reloading = true;
    location.reload();
  });
}

/* ---------- boot ---------- */
async function boot() {
  performance.mark('lifeos:boot');
  // The first screen's code loads while the data does (navigate() then finds it ready).
  try { (router.match(ROUTES, router.parse().parts) || router.match(ROUTES, ['today'])).route.load().catch(() => {}); } catch { /* navigate() reports it */ }
  Object.assign(app, {
    go: (path) => { internalNavs++; router.go(path); },
    replace: (path) => router.go(path, { replace: true }),
    back,
    refresh,
    sheet: (opts) => { const s = sheet.open(opts); growAll(s.el); return s; },
    closeSheet: (s) => sheet.close(s),
    toast,
    confirm: async (opts) => (await import('./ui/confirm.js')).confirmDialog(opts),
    current: () => current,
    search: async () => (await import('./screens/search.js')).openSearch(),
  });

  try {
    // Opening on Today itself, the long workout history loads just after the first screen.
    const onToday = !location.hash || /^#\/today(\?|$)/.test(location.hash);
    await store.init({ recentFirst: onToday });
    performance.mark('lifeos:data');
    // The built-in habit system is only loaded on first run, or when it has an update.
    const seeded = store.get('meta', 'seed');
    const { seedIfNeeded } = !seeded || (seeded.version || 1) < SEED_VERSION ? await import('./data/seed.js') : {};
    const fresh = seedIfNeeded && await seedIfNeeded();
    // Migrations load only on a fresh install or when an update has one waiting.
    if (fresh || !(store.get('meta', 'migrations')?.applied || []).includes(LATEST_MIGRATION)) {
      await store.loadRest(); // migrations see all of your data
      const m = await import('./data/migrations.js');
      if (fresh) m.markAllApplied(); else await m.runMigrations();
    }
    setDayEnd(store.profile()?.dayEndsAt);
  } catch (err) {
    console.error(err);
    main.innerHTML = String(html`<div class="view"><div class="empty empty--page">
      <div class="empty-ic">${icon('database', { size: 22 })}</div>
      <p class="empty-title">Life OS can’t open its local storage.</p>
      <p class="empty-body">This usually happens in private browsing, or when storage is disabled for this site. Nothing has been deleted. Open Life OS in a normal Safari window, or add it to your Home Screen.</p>
    </div></div>`);
    return;
  }

  applyTheme();
  let closeReload = null;
  store.subscribe((ev) => {
    if (ev.type === 'error') { toast(ev.message, { tone: 'danger', icon: 'circle-alert' }); return; }
    // Another window took the data over: nothing more is written here, and the message stays the newest.
    if (ev.type === 'closed') {
      closeReload?.();
      closeReload = toast('Life OS was updated in another window. Reload to carry on; everything saved is safe.', { tone: 'danger', icon: 'refresh-cw', duration: 0, action: { label: 'Reload', fn: () => location.reload() } });
      return;
    }
    if (ev.stores.has('settings')) applyTheme();
    if (ev.stores.has('profile')) setDayEnd(store.profile()?.dayEndsAt);
    // Background summaries rebuilding don't change what's on screen.
    if ([...ev.stores].some((s) => s !== 'daySnapshots')) refresh();
  });
  // Anything still queued goes to disk before the app is hidden or closed.
  addEventListener('pagehide', () => store.flush());
  document.addEventListener('visibilitychange', () => { if (document.hidden) store.flush(); });

  if (!location.hash) history.replaceState(null, '', '#/today');
  await navigate();
  registerSW();
  // The rest of the workout history, straight after the first screen; what needs all of it waits.
  setTimeout(() => store.loadRest().catch((err) => console.error(err)));

  let lastMinute = new Date().getMinutes();
  let lastDay = today();
  setInterval(() => {
    const m = new Date().getMinutes();
    if (m === lastMinute) return;
    lastMinute = m;
    if (today() !== lastDay) { lastDay = today(); navigate(); return; }
    if (current?.route.tab === 'today') refresh();
  }, 15000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });

  // After the first screen: screen transitions, the rest of the icons, keyboard shortcuts and pull-to-search.
  import('./ui/transitions.js').then((m) => { swap = m.swap; }).catch(() => {});
  loadIcons().then(() => refresh()).catch(() => {});
  import('./ui/keys.js').then((m) => m.attachShortcuts({ places: PLACES, go: (path) => app.go(path), capture: () => globalActions.capture(), search: () => app.search() })).catch(() => {});
  import('./ui/gestures.js').then((m) => m.attachPullToSearch({ enabled: () => current?.route.depth === 0, onSearch: () => app.search() })).catch(() => {});
  import('./domain/reminders.js').then((r) => r.start()).catch((err) => console.warn(err));
  store.complete().then(() => import('./domain/snapshots.js')).then((m) => m.start()).catch((err) => console.warn(err));
  import('./ui/badge.js').then((m) => m.start()).catch(() => {});
  // The optional sound palette: a soft tick for completions (off unless chosen in Settings).
  Promise.all([import('./ui/sound.js'), import('./ui/haptics.js')]).then(([m, h]) => h.onPlay((n) => { if (n === 'success' || n === 'commit') m.play('tick'); })).catch(() => {});
  // Real progress is marked once, as a moment; a finished season offers its finale.
  store.complete().then(() => import('./domain/progression.js')).then((m) => m.start((mo) => import('./ceremony/moments.js')
    .then((M) => M.show(mo, { go: (x) => import('./ceremony/finale.js').then((F) => F.finale(x.id)) })))).catch((err) => console.warn(err));
  import('./ui/install.js').then((m) => m.maybePrompt()).catch(() => {});
  if (navigator.storage?.persist) navigator.storage.persisted().then((p) => { if (!p) navigator.storage.persist(); });
  window.__lifeos = { store, app, ready: true, readyAt: performance.now(), renders: renderTimes };
}

boot();
