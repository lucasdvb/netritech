import * as store from './data/store.js';
import { SEED_VERSION } from './data/schema.js';
import { runMigrations, markAllApplied } from './data/migrations.js';
import { patch } from './ui/patch.js';
import * as router from './ui/router.js';
import * as sheet from './ui/sheet.js';
import { toast } from './ui/toast.js';
import { icon } from './ui/icons.js';
import { html } from './ui/dom.js';
import { app, APP_NAME } from './ui/app-api.js';
import { today, setDayEnd } from './domain/dates.js';

const TABS = [
  { id: 'today', label: 'Today', icon: 'sun', path: 'today' },
  { id: 'progress', label: 'Progress', icon: 'chart-spline', path: 'progress' },
  { id: 'habits', label: 'Habits', icon: 'list-checks', path: 'habits' },
  { id: 'body', label: 'Body', icon: 'activity', path: 'body' },
  { id: 'more', label: 'More', icon: 'layout-grid', path: 'more' },
];

const v = (name) => () => import(`./screens/${name}.js`);
const ROUTES = [
  { path: 'today/:date?', tab: 'today', depth: 0, load: v('today') },
  { path: 'progress/:seg?', tab: 'progress', depth: 0, load: v('progress') },
  { path: 'habits/new', tab: 'habits', depth: 1, load: v('habit-edit') },
  { path: 'habits/sort', tab: 'habits', depth: 1, load: v('habit-sort') },
  { path: 'habits/:id/edit', tab: 'habits', depth: 2, load: v('habit-edit') },
  { path: 'habits/:id', tab: 'habits', depth: 1, load: v('habit') },
  { path: 'habits', tab: 'habits', depth: 0, load: v('habits') },
  { path: 'body/weight', tab: 'body', depth: 1, load: v('weight') },
  { path: 'body/nutrition/:date?', tab: 'body', depth: 1, load: v('nutrition') },
  { path: 'body/training', tab: 'body', depth: 1, load: v('training') },
  { path: 'body/workout/:id', tab: 'body', depth: 2, load: v('workout') },
  { path: 'body/exercises', tab: 'body', depth: 2, load: v('exercises') },
  { path: 'body/exercise/:id', tab: 'body', depth: 3, load: v('exercise') },
  { path: 'body/measurements', tab: 'body', depth: 1, load: v('measurements') },
  { path: 'body/photos', tab: 'body', depth: 1, load: v('photos') },
  { path: 'body/sleep', tab: 'body', depth: 1, load: v('sleep') },
  { path: 'body', tab: 'body', depth: 0, load: v('body') },
  { path: 'more/tasks', tab: 'more', depth: 1, load: v('tasks') },
  { path: 'more/plan', tab: 'more', depth: 1, load: v('plan') },
  { path: 'more/journal/:id', tab: 'more', depth: 2, load: v('journal-entry') },
  { path: 'more/journal', tab: 'more', depth: 1, load: v('journal') },
  { path: 'more/mind', tab: 'more', depth: 1, load: v('mind') },
  { path: 'more/faith', tab: 'more', depth: 1, load: v('faith') },
  { path: 'more/relationships', tab: 'more', depth: 1, load: v('relationships') },
  { path: 'more/work', tab: 'more', depth: 1, load: v('work') },
  { path: 'more/goals/:id', tab: 'more', depth: 2, load: v('goal') },
  { path: 'more/goals', tab: 'more', depth: 1, load: v('goals') },
  { path: 'more/review/week/:date?', tab: 'more', depth: 1, load: v('review-week') },
  { path: 'more/review/month/:month?', tab: 'more', depth: 1, load: v('review-month') },
  { path: 'more/reviews', tab: 'more', depth: 1, load: v('reviews') },
  { path: 'more/settings', tab: 'more', depth: 1, load: v('settings') },
  { path: 'more/data', tab: 'more', depth: 1, load: v('data') },
  { path: 'more/privacy', tab: 'more', depth: 1, load: v('privacy') },
  { path: 'more', tab: 'more', depth: 0, load: v('more') },
];

const main = document.getElementById('main');
const tabbar = document.getElementById('tabbar');
const scrollMemory = new Map();
const uiMemory = new Map();
let current = null;
let navToken = 0;
let refreshQueued = false;

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
function renderTabbar() {
  patch(tabbar, html`
    <div class="tab-brand">${icon('orbit', { size: 20 })}<span>${APP_NAME}</span></div>
    ${TABS.map((t) => html`<a class="tab" href="#/${t.path}" data-key="tab-${t.id}" ${current?.route.tab === t.id ? html`aria-current="page"` : ''}>
      ${icon(t.icon, { size: 23, stroke: current?.route.tab === t.id ? 2 : 1.6 })}<span>${t.label}</span></a>`)}
    <p class="tab-foot">Everything stays on this device.</p>`);
}

/* ---------- views ---------- */
const ctxOf = (c) => ({ params: c.params, query: c.query, ui: c.ui, route: c.route, path: c.path });

async function navigate() {
  const token = ++navToken;
  const { parts, query, path } = router.parse();
  const found = router.match(ROUTES, parts) || router.match(ROUTES, ['today']);
  let mod;
  try {
    mod = await found.route.load();
  } catch (err) {
    console.error(err);
    toast('That screen couldn’t load. Check your connection once, then it works offline.', { tone: 'danger' });
    return;
  }
  if (token !== navToken) return;
  const view = mod.default;
  const prev = current;
  if (prev) {
    scrollMemory.set(prev.path, window.scrollY);
    prev.view.unmount?.(prev.el, ctxOf(prev));
  }
  sheet.closeAll();

  let dir = 'view--fade';
  if (prev && prev.route.tab === found.route.tab) {
    if (found.route.depth > prev.route.depth) dir = 'view--push';
    else if (found.route.depth < prev.route.depth) dir = 'view--pop';
  }
  const ui = uiMemory.get(path) || {};
  uiMemory.set(path, ui);
  current = { route: found.route, params: found.params, query, view, ui, path, el: null };

  const el = document.createElement('div');
  el.className = `view ${dir === 'view--fade' ? '' : dir}${view.wide ? ' view--wide' : ''}`;
  el.dataset.view = view.id || '';
  try {
    el.innerHTML = String(view.render(ctxOf(current)));
  } catch (err) {
    console.error(err);
    el.innerHTML = String(html`<div class="empty"><p class="empty-title">Something went wrong on this screen.</p><p class="empty-body">Your data is safe. Try going back to Today.</p><a class="btn btn--soft" href="#/today">Back to Today</a></div>`);
  }
  current.el = el;
  main.replaceChildren(el);
  const y = dir === 'view--pop' ? scrollMemory.get(path) || 0 : 0;
  window.scrollTo(0, y);
  view.mount?.(el, ctxOf(current));
  growAll(el);
  renderTabbar();
  document.title = view.title ? `${typeof view.title === 'function' ? view.title(ctxOf(current)) : view.title} · ${APP_NAME}` : APP_NAME;
  if (prev) {
    const h1 = el.querySelector('h1');
    if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
  }
}

function refresh() {
  if (refreshQueued) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    if (!current?.el) return;
    try {
      const restore = focusAnchor(current.el);
      patch(current.el, current.view.render(ctxOf(current)));
      current.view.update?.(current.el, ctxOf(current));
      growAll(current.el);
      restore();
    } catch (err) {
      console.error(err);
    }
    sheet.refreshAll();
  });
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
};

function resolve(el, kind, name) {
  const s = sheetOf(el);
  const table = kind === 'action' ? 'actions' : 'inputs';
  return (s && s[table][name]) || (current?.view[table]?.[name]) || (kind === 'action' ? globalActions[name] : null);
}

function run(handler, el, event, extra = {}) {
  const s = sheetOf(el);
  try {
    const out = handler({ el, data: el.dataset, event, sheet: s, ui: s ? s.ui : current?.ui, params: current?.params, value: el.value, ...extra });
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
  run(handler, el, e);
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
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); app.search(); }
});

/* ---------- navigation helpers ---------- */
let internalNavs = 0;
function back(fallback = 'today') {
  if (internalNavs > 0) history.back();
  else router.go(fallback, { replace: true });
}

window.addEventListener('hashchange', () => navigate());
window.addEventListener('popstate', () => { if (internalNavs > 0) internalNavs--; });

/* ---------- confirm ---------- */
function confirmDialog({ title, body = '', confirm = 'Confirm', cancel = 'Cancel', tone = '' }) {
  return new Promise((resolveP) => {
    let answered = false;
    const s = sheet.open({
      title,
      render: () => html`<div class="confirm">
        ${body ? html`<p class="confirm-body">${body}</p>` : ''}
        <div class="btn-row">
          <button type="button" class="btn btn--ghost" data-action="no">${cancel}</button>
          <button type="button" class="btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}" data-action="yes">${confirm}</button>
        </div></div>`,
      actions: {
        yes: () => { answered = true; resolveP(true); sheet.close(s); },
        no: () => { answered = true; resolveP(false); sheet.close(s); },
      },
      onClose: () => { if (!answered) resolveP(false); },
    });
  });
}

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
  Object.assign(app, {
    go: (path) => { internalNavs++; router.go(path); },
    replace: (path) => router.go(path, { replace: true }),
    back,
    refresh,
    sheet: (opts) => { const s = sheet.open(opts); growAll(s.el); return s; },
    closeSheet: (s) => sheet.close(s),
    toast,
    confirm: confirmDialog,
    current: () => current,
    search: async () => (await import('./screens/search.js')).openSearch(),
  });

  try {
    await store.init();
    // The built-in habit system is only loaded on first run, or when it has an update.
    const seeded = store.get('meta', 'seed');
    const { seedIfNeeded } = !seeded || (seeded.version || 1) < SEED_VERSION ? await import('./data/seed.js') : {};
    if (seedIfNeeded && await seedIfNeeded()) markAllApplied();
    else await runMigrations();
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
  store.subscribe((ev) => {
    if (ev.type === 'error') { toast(ev.message, { tone: 'danger', icon: 'circle-alert' }); return; }
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

  import('./domain/reminders.js').then((r) => r.start()).catch((err) => console.warn(err));
  import('./domain/snapshots.js').then((m) => m.start()).catch((err) => console.warn(err));
  import('./ui/install.js').then((m) => m.maybePrompt()).catch(() => {});
  if (navigator.storage?.persist) navigator.storage.persisted().then((p) => { if (!p) navigator.storage.persist(); });
  window.__lifeos = { store, app, ready: true };
}

boot();
