/* Life OS service worker: precache the whole app, serve it offline, update on request. */
// BEGIN GENERATED (node tools/build-sw.mjs)
const VERSION = '46302f547f';
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/base.css",
  "./css/components.css",
  "./css/tokens.css",
  "./css/views.css",
  "./js/app.js",
  "./js/core/backup.js",
  "./js/core/coach.js",
  "./js/core/dates.js",
  "./js/core/demo.js",
  "./js/core/fitness.js",
  "./js/core/goals.js",
  "./js/core/habits.js",
  "./js/core/metrics.js",
  "./js/core/reminders.js",
  "./js/core/review-data.js",
  "./js/core/scoring.js",
  "./js/core/store.js",
  "./js/core/tasks.js",
  "./js/core/taxonomy.js",
  "./js/db/idb.js",
  "./js/db/schema.js",
  "./js/db/seed.js",
  "./js/ui/app-api.js",
  "./js/ui/charts.js",
  "./js/ui/components.js",
  "./js/ui/dom.js",
  "./js/ui/format.js",
  "./js/ui/haptics.js",
  "./js/ui/icons.js",
  "./js/ui/install.js",
  "./js/ui/patch.js",
  "./js/ui/router.js",
  "./js/ui/sheet.js",
  "./js/ui/swipe.js",
  "./js/ui/toast.js",
  "./js/views/body.js",
  "./js/views/data.js",
  "./js/views/exercise.js",
  "./js/views/exercises.js",
  "./js/views/faith.js",
  "./js/views/goal.js",
  "./js/views/goals.js",
  "./js/views/habit-edit.js",
  "./js/views/habit.js",
  "./js/views/habits.js",
  "./js/views/journal-entry.js",
  "./js/views/journal.js",
  "./js/views/measurements.js",
  "./js/views/mind.js",
  "./js/views/more.js",
  "./js/views/nutrition.js",
  "./js/views/photos.js",
  "./js/views/plan.js",
  "./js/views/privacy.js",
  "./js/views/progress.js",
  "./js/views/relationships.js",
  "./js/views/review-month.js",
  "./js/views/review-week.js",
  "./js/views/reviews.js",
  "./js/views/search.js",
  "./js/views/settings.js",
  "./js/views/sheets.js",
  "./js/views/sleep.js",
  "./js/views/task-ui.js",
  "./js/views/tasks.js",
  "./js/views/today.js",
  "./js/views/training.js",
  "./js/views/weight.js",
  "./js/views/work.js",
  "./js/views/workout-actions.js",
  "./js/views/workout.js",
  "./assets/fonts/Inter-latin-ext.woff2",
  "./assets/fonts/Inter-latin.woff2",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon-32.png",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable-512.png",
  "./assets/icons/icon-maskable.svg",
  "./assets/icons/icon.svg"
];
// END GENERATED

const CACHE = `lifeos-${VERSION}`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS.map((a) => new Request(a, { cache: 'reload' })))),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('lifeos-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match('./index.html');
      if (cached) return cached;
      try { return await fetch(req); } catch { return new Response('Offline', { status: 503 }); }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    } catch {
      return new Response('', { status: 504, statusText: 'Offline' });
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || './#/today';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) { c.navigate?.(target); return c.focus(); }
    }
    return self.clients.openWindow(target);
  })());
});
