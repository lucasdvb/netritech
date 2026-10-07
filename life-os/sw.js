/* Life OS service worker: precache the whole app, serve it offline, update on request. */
// BEGIN GENERATED (node tools/build-sw.mjs)
const VERSION = 'd159a4ce2e';
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/base.css",
  "./css/components.css",
  "./css/motion.css",
  "./css/tokens.css",
  "./css/views.css",
  "./js/app.js",
  "./js/data/adapter-idb.js",
  "./js/data/adapter-memory.js",
  "./js/data/backup.js",
  "./js/data/demo.js",
  "./js/data/migrations.js",
  "./js/data/schema.js",
  "./js/data/seed.js",
  "./js/data/store.js",
  "./js/domain/coach.js",
  "./js/domain/dates.js",
  "./js/domain/day.js",
  "./js/domain/fitness.js",
  "./js/domain/goals.js",
  "./js/domain/habits.js",
  "./js/domain/metrics.js",
  "./js/domain/reminders.js",
  "./js/domain/review-data.js",
  "./js/domain/scoring.js",
  "./js/domain/snapshots.js",
  "./js/domain/tasks.js",
  "./js/domain/taxonomy.js",
  "./js/screens/body.js",
  "./js/screens/data.js",
  "./js/screens/exercise.js",
  "./js/screens/exercises.js",
  "./js/screens/faith.js",
  "./js/screens/goal.js",
  "./js/screens/goals.js",
  "./js/screens/habit-edit.js",
  "./js/screens/habit.js",
  "./js/screens/habits.js",
  "./js/screens/journal-entry.js",
  "./js/screens/journal.js",
  "./js/screens/measurements.js",
  "./js/screens/mind.js",
  "./js/screens/more.js",
  "./js/screens/nutrition.js",
  "./js/screens/photos.js",
  "./js/screens/plan.js",
  "./js/screens/privacy.js",
  "./js/screens/progress.js",
  "./js/screens/relationships.js",
  "./js/screens/review-month.js",
  "./js/screens/review-week.js",
  "./js/screens/reviews.js",
  "./js/screens/search.js",
  "./js/screens/settings.js",
  "./js/screens/sheets.js",
  "./js/screens/sleep.js",
  "./js/screens/task-ui.js",
  "./js/screens/tasks.js",
  "./js/screens/today.js",
  "./js/screens/training.js",
  "./js/screens/weight.js",
  "./js/screens/work.js",
  "./js/screens/workout-actions.js",
  "./js/screens/workout.js",
  "./js/ui/app-api.js",
  "./js/ui/charts.js",
  "./js/ui/components.js",
  "./js/ui/dom.js",
  "./js/ui/format.js",
  "./js/ui/haptics.js",
  "./js/ui/icons.js",
  "./js/ui/install.js",
  "./js/ui/motion.js",
  "./js/ui/patch.js",
  "./js/ui/router.js",
  "./js/ui/sheet.js",
  "./js/ui/swipe.js",
  "./js/ui/toast.js",
  "./assets/fonts/Manrope-latin-ext.woff2",
  "./assets/fonts/Manrope-latin.woff2",
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
