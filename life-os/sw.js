/* Life OS service worker: precache the whole app, serve it offline, update on request. */
// BEGIN GENERATED (node tools/build-sw.mjs)
const VERSION = 'ae2c595216';
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/base.css",
  "./css/components.css",
  "./css/motion.css",
  "./css/tokens.css",
  "./css/type.css",
  "./css/views.css",
  "./js/app.js",
  "./js/ceremony/film.js",
  "./js/ceremony/finale.js",
  "./js/ceremony/moments.js",
  "./js/ceremony/seal.js",
  "./js/ceremony/stage.js",
  "./js/ceremony/year.js",
  "./js/data/adapter-idb.js",
  "./js/data/adapter-memory.js",
  "./js/data/backup.js",
  "./js/data/blobs.js",
  "./js/data/demo.js",
  "./js/data/journal.js",
  "./js/data/migrations.js",
  "./js/data/schema.js",
  "./js/data/seed.js",
  "./js/data/store.js",
  "./js/data/tiny-versions.js",
  "./js/domain/adapt.js",
  "./js/domain/books.js",
  "./js/domain/capture-save.js",
  "./js/domain/capture.js",
  "./js/domain/coach.js",
  "./js/domain/commitments.js",
  "./js/domain/cues.js",
  "./js/domain/dates.js",
  "./js/domain/day-blocks.js",
  "./js/domain/day-plan.js",
  "./js/domain/day.js",
  "./js/domain/events.js",
  "./js/domain/exercise-media.js",
  "./js/domain/experiments.js",
  "./js/domain/film.js",
  "./js/domain/fitness-core.js",
  "./js/domain/fitness.js",
  "./js/domain/focus.js",
  "./js/domain/goals.js",
  "./js/domain/habit-system.js",
  "./js/domain/habits-more.js",
  "./js/domain/habits.js",
  "./js/domain/health-paste.js",
  "./js/domain/history.js",
  "./js/domain/ics.js",
  "./js/domain/insights.js",
  "./js/domain/levels.js",
  "./js/domain/lists.js",
  "./js/domain/meals.js",
  "./js/domain/memories.js",
  "./js/domain/metrics-core.js",
  "./js/domain/metrics.js",
  "./js/domain/money.js",
  "./js/domain/moodboard.js",
  "./js/domain/next-action.js",
  "./js/domain/next-step.js",
  "./js/domain/notes.js",
  "./js/domain/progression.js",
  "./js/domain/projects.js",
  "./js/domain/push-plan.js",
  "./js/domain/quests.js",
  "./js/domain/records.js",
  "./js/domain/reminder-rules.js",
  "./js/domain/reminders.js",
  "./js/domain/review-data.js",
  "./js/domain/rewards.js",
  "./js/domain/rituals.js",
  "./js/domain/routines.js",
  "./js/domain/scoring.js",
  "./js/domain/seasons.js",
  "./js/domain/session-clock.js",
  "./js/domain/snapshots.js",
  "./js/domain/story.js",
  "./js/domain/tasks-more.js",
  "./js/domain/tasks.js",
  "./js/domain/taxonomy.js",
  "./js/domain/templates.js",
  "./js/domain/urges.js",
  "./js/domain/year-review.js",
  "./js/push/client.js",
  "./js/redirects.js",
  "./js/routes.js",
  "./js/screens/area.js",
  "./js/screens/auto-check.js",
  "./js/screens/body.js",
  "./js/screens/book.js",
  "./js/screens/books.js",
  "./js/screens/calendar-file.js",
  "./js/screens/calendar.js",
  "./js/screens/capture.js",
  "./js/screens/commitments.js",
  "./js/screens/cues.js",
  "./js/screens/data.js",
  "./js/screens/dates.js",
  "./js/screens/day-planner.js",
  "./js/screens/exercise-media-ui.js",
  "./js/screens/exercise-picker.js",
  "./js/screens/exercise.js",
  "./js/screens/exercises.js",
  "./js/screens/experiment-ui.js",
  "./js/screens/faith.js",
  "./js/screens/focus-sheet.js",
  "./js/screens/fresh-start.js",
  "./js/screens/goal.js",
  "./js/screens/goals.js",
  "./js/screens/gym.js",
  "./js/screens/habit-edit.js",
  "./js/screens/habit-new.js",
  "./js/screens/habit-sort.js",
  "./js/screens/habit.js",
  "./js/screens/habits.js",
  "./js/screens/health.js",
  "./js/screens/insight-ui.js",
  "./js/screens/insights.js",
  "./js/screens/journal-entry.js",
  "./js/screens/journal.js",
  "./js/screens/less.js",
  "./js/screens/list.js",
  "./js/screens/lists.js",
  "./js/screens/measurements.js",
  "./js/screens/mind.js",
  "./js/screens/money.js",
  "./js/screens/moodboard.js",
  "./js/screens/notes.js",
  "./js/screens/nutrition.js",
  "./js/screens/pads.js",
  "./js/screens/photos.js",
  "./js/screens/plan-home.js",
  "./js/screens/playbook.js",
  "./js/screens/privacy.js",
  "./js/screens/progress.js",
  "./js/screens/project.js",
  "./js/screens/projects.js",
  "./js/screens/push-sheet.js",
  "./js/screens/records.js",
  "./js/screens/reflect.js",
  "./js/screens/relationships.js",
  "./js/screens/review-month.js",
  "./js/screens/review-week.js",
  "./js/screens/review-year.js",
  "./js/screens/reviews.js",
  "./js/screens/rewards.js",
  "./js/screens/ritual.js",
  "./js/screens/routine-edit.js",
  "./js/screens/search.js",
  "./js/screens/season.js",
  "./js/screens/settings.js",
  "./js/screens/sheets.js",
  "./js/screens/sleep.js",
  "./js/screens/sync.js",
  "./js/screens/task-calendar.js",
  "./js/screens/task-sheet.js",
  "./js/screens/task-ui.js",
  "./js/screens/tasks.js",
  "./js/screens/template.js",
  "./js/screens/tidy.js",
  "./js/screens/today/blocks.js",
  "./js/screens/today/day-picker.js",
  "./js/screens/today/edit.js",
  "./js/screens/today/limit-row.js",
  "./js/screens/today/modes.js",
  "./js/screens/today/nets.js",
  "./js/screens/today/now.js",
  "./js/screens/today/open.js",
  "./js/screens/today/priorities.js",
  "./js/screens/today/routines.js",
  "./js/screens/today/rows.js",
  "./js/screens/today/upcoming.js",
  "./js/screens/today.js",
  "./js/screens/training.js",
  "./js/screens/trends.js",
  "./js/screens/weight.js",
  "./js/screens/work.js",
  "./js/screens/workout-actions.js",
  "./js/screens/workout.js",
  "./js/screens/year.js",
  "./js/screens/you.js",
  "./js/sync/crypto.js",
  "./js/sync/engine.js",
  "./js/ui/app-api.js",
  "./js/ui/badge.js",
  "./js/ui/charts.js",
  "./js/ui/components.js",
  "./js/ui/confirm.js",
  "./js/ui/controls.js",
  "./js/ui/dom.js",
  "./js/ui/focus-bar.js",
  "./js/ui/format.js",
  "./js/ui/gestures.js",
  "./js/ui/haptics.js",
  "./js/ui/hold.js",
  "./js/ui/icons-more.js",
  "./js/ui/icons.js",
  "./js/ui/images.js",
  "./js/ui/install.js",
  "./js/ui/keys.js",
  "./js/ui/later.js",
  "./js/ui/motion.js",
  "./js/ui/numpad.js",
  "./js/ui/patch.js",
  "./js/ui/reorder.js",
  "./js/ui/router.js",
  "./js/ui/save-later.js",
  "./js/ui/sheet.js",
  "./js/ui/sound.js",
  "./js/ui/swipe.js",
  "./js/ui/tips.js",
  "./js/ui/toast.js",
  "./js/ui/transitions.js",
  "./js/ui/undo.js",
  "./js/ui/updates.js",
  "./assets/fonts/Inter-latin-400.woff2",
  "./assets/fonts/Inter-latin-500.woff2",
  "./assets/fonts/Inter-latin-600.woff2",
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

// A reminder from the sender on your server (13c). Every push shows a notification, as iOS requires.
self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data?.json() || {}; } catch { d = { body: event.data?.text() || '' }; }
  event.waitUntil(self.registration.showNotification(d.title || 'Life OS', {
    body: d.body || '', tag: d.tag || 'life-os', icon: 'assets/icons/icon-192.png', badge: 'assets/icons/icon-192.png', data: { url: d.url || './#/today' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Only ever a page of this app: a push can't send you anywhere else.
  let target = './#/today';
  try { const u = new URL(event.notification.data?.url || target, self.location.href); if (u.origin === self.location.origin) target = u.href; } catch { /* keep Today */ }
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      // A window this worker doesn't control can't be navigated; it is still brought forward.
      if ('focus' in c) { c.navigate?.(target)?.catch(() => {}); return c.focus(); }
    }
    return self.clients.openWindow(target);
  })());
});
