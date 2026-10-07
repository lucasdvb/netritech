# Life OS

A private, local-first app for habits, health, training and life. It is built for daily use on an iPhone from the Home Screen, and works in any modern browser.

Everything you log stays on the device that logged it. There are no accounts, no servers, no analytics and no third-party services.

---

## Using it on your iPhone

To install from Safari, a PWA has to be served over **HTTPS**. Hosting only serves the app's code; your data never leaves the phone.

1. Host the `life-os/` folder on any static host (see below).
2. Open the URL in **Safari** on the iPhone.
3. Tap **Share → Add to Home Screen**.
4. Open Life OS from the Home Screen icon. It runs full-screen and works offline.

The first time you open it from the Home Screen, go to **More → Data** and make a backup habit of it. Safari can clear website storage for sites that aren't used for weeks. Installing to the Home Screen and taking regular backups avoids that.

### Hosting options (any of these works)

| Host | How |
|---|---|
| **Netlify Drop** | Go to app.netlify.com/drop and drag the `life-os` folder in. You get an HTTPS URL in seconds. |
| **Cloudflare Pages** | Create a project, choose "Direct upload" and upload the `life-os` folder. |
| **GitHub Pages** | Enable Pages for the repo and point it at the branch. The app lives at `https://<user>.github.io/<repo>/life-os/`. Paths are all relative, so a sub-path is fine. |

Hosting makes the app's code reachable at that URL, but not your data. Each device keeps its own data in its own browser storage.

### Updating

After changing any file, rebuild the service-worker asset list, then redeploy:

```sh
node tools/build-sw.mjs
```

This gives the cache a new version. The next time the app is opened online, it fetches the update and reloads once.

---

## Running locally

No build step and no dependencies. Serve the folder over HTTP:

```sh
node tests/serve.mjs 4173          # → http://localhost:4173/
# or: python3 -m http.server 4173
```

`localhost` counts as a secure origin, so the service worker and installation also work there on a desktop browser.

---

## What's inside

- **Today**: a time-aware greeting and a daily score from 9 key habits. Habits are grouped by time of day and open progressively. One tap completes with a small animation and haptic feedback.
  - **Top 3 priorities** (drag or arrow keys to reorder), then **Tasks** for the day with quick add, plus the **next useful action** from the coach.
  - **Win of the day**, morning check-in and evening shutdown.
  - **Normal / Minimum / Sick** day modes.
- **Habits**: every type: yes/no, numeric, duration, quantity, rating and checklist.
  - Schedules: daily, chosen weekdays, X per week, X per month, every N days.
  - Three priority levels and Minimum-day versions; per-habit reminders.
  - Values can come from your logs automatically (water, protein, steps, sleep, workouts, reviews).
- **Body**: weight with 7/14/30-day trends; nutrition with quick foods, protein and adaptive calories; water and steps.
  - Measurements every two weeks; private progress photos with a compare slider; body-composition estimates; sleep.
- **Training**: today's planned session with a smart call ("train as planned", "go lighter", "walk instead") based on sleep, energy and stress.
  - Workout logger prefilled from last time, with progressive-overload comparison.
  - Exercise library with history; dedicated calf, core and posture tracking.
- **Tasks**: one-off jobs and weekly or monthly chores, grouped into Overdue, Today, the next six days, Later and Anytime.
  - Ticking a repeating task schedules the next one, so a missed week never piles up.
  - The evening shutdown can move unfinished tasks to tomorrow.
- **Progress**: trends, consistency by area, a calendar of every day, weekly insights, personal bests and "needs attention".
- **More**: Tasks, Journal, Mind (reading, learning, meditation), Faith, Relationships, Work (deep work, shutdown), Your plan, Goals, and Weekly and Monthly reviews.
  - **Your plan** is the workbook's Plan & Routines playbook: your day, your week, routines, training templates, food targets and the rules. It is built from your live habits, templates and targets, so editing them updates it.
  - Also: Search, Settings (units, theme, targets, reminders), Data and Privacy.

### Preloaded on first launch

Your whole system from the Life OS spec and workbook is there on day one. Nothing needs typing in:

- **Profile and day:** 35, 180 cm, 76 kg, ~25% → 15% body fat, wake 06:00, train 06:30, work 10:00–20:00, lights out 22:00.
- **Habits:** 41 habits across the 8 pillars, with three priority levels, the 9 that make up the daily score and the 8 Minimum-day essentials. Morning reset, mobility and evening routine are one-tick checklists.
  - Caffeine cutoff and alcohol-free days are included but archived, because the spec says to track them only if they apply. A task asks you to decide.
- **Training:** the Mon–Sun split with five templates (upper + posture, lower + calves + core, walk + mobility, cardio, 20-minute minimum) and about 40 exercises with progressions.
  - Upper days end with a short calf and core finisher, so both reach the spec's 3–4 sessions a week.
- **Tasks:**
  - one-off: book an eye-specialist follow-up, book a dental / orthodontic assessment, set up the desk, turn on reminders, and the caffeine and alcohol decisions;
  - weekly chores: laundry, room and bathroom on Saturday, groceries and calendar review on Sunday;
  - monthly: back up Life OS.
- **Goals, targets and foods:** 8 goals with milestones; protein 150 g, 1,800–2,000 kcal, water 2.5–3 L, a 7k → 8k → 9k steps ramp and sleep targets; Mauritius-friendly quick foods, including whey isolate at 25.5 g / 113 kcal.

Opening the app on a device that already holds an older Life OS version adds whatever is new. Anything you've edited is left alone.

### Reminders on iPhone, honestly

Reminders show as a banner while Life OS is open. If you allow notifications, they also arrive as system notifications while the app is recently used. The rules are adaptive:

- a habit you usually finish before its reminder time stops being reminded;
- a reminder ignored three times in a row pauses and suggests a different time;
- changing a reminder's time, or switching it off and on, gives it a fresh start.

iOS only delivers notifications to a fully closed web app through a push server. This private, server-free version deliberately doesn't use one, and the Settings screen says so.

---

## Your data

- **Storage:** IndexedDB in the browser (`life-os` database), on this device only. Photos are stored as blobs and are never uploaded.
- **Backup:** More → Data → *Download backup*. You get one JSON file, with photos optional. On iPhone it opens the share sheet, so you can save it to Files or iCloud Drive yourself.
- **Restore:** you can merge (keeps the newer version of each record) or replace everything (asks you to confirm first). An invalid file is rejected and nothing changes.
- **CSV:** export weight, measurements, habits, nutrition, water, steps, sleep, workouts and journal for spreadsheets.
- **Sample data:** opt-in, clearly labelled and removable in one tap. Every sample record carries `demo: true` and never overwrites a real entry.
- **Erase:** More → Data → *Erase everything* (asks twice).

Nothing in the app is a medical claim:

- body-fat figures are labelled estimates;
- eye breaks are comfort habits, not treatment for keratoconus;
- jaw concerns are routed to a dentist or orthodontist rather than exercises.

---

## Design

The look follows modern finance-app references: near-black and white surfaces with a single bright lime accent (`#D3F36B`), plus soft lavender, peach and mint for the Today metric tiles.

- **Shapes:** pill buttons and chips, round icon buttons, and big flat cards with 30 px corners.
- **Navigation:** a floating black tab bar with round buttons on phones; a black sidebar on desktop.
- **Black cards:** the Today score and the Body weight card carry the key numbers. Ticks fill lime.
- **Charts:** bars stand on hatched tracks. They are black where the target was hit, grey where it wasn't, and the latest day is lime. Line charts are black over a lime fill.
- **Light and dark:** both themes come from the same tokens in `css/tokens.css`. Dark cards re-scope the text colours locally, so anything placed inside them stays readable.

## Architecture

```
index.html             app shell (tab bar / sidebar, main, sheets, toasts)
manifest.webmanifest   PWA manifest (standalone, icons, shortcuts)
sw.js                  service worker: precache, cache-first, offline navigation
css/                   tokens.css (themes, palette, type) · base · components · views
js/app.js              router, view lifecycle, event delegation, focus management
js/db/                 IndexedDB wrapper, schema, first-run seed (your habit system)
js/core/               store (in-memory cache + optimistic writes), habit engine,
                       scoring, metrics, fitness, coach, goals, reviews, reminders,
                       backup, sample data
js/ui/                 html`` templates, keyed DOM morphing, components, charts,
                       sheets, toasts, haptics, icons
js/views/              one module per screen, loaded on demand
tools/                 build-sw.mjs · build-icons.mjs · render-icons.mjs
tests/                 Playwright browser tests at iPhone 14 size
```

- **No framework.** It uses ES modules, a tagged-template `html` that escapes by default, and a small keyed DOM morph (`js/ui/patch.js`). Re-renders therefore keep existing elements, so animations, focus, scroll and half-typed text survive.
- **Data flow:** `store` loads every store into memory at start. Reads are synchronous, and writes are optimistic: the UI updates first, IndexedDB is written in the background, and a failed write rolls back and shows a message. Derived numbers are memoised per data version.
- **Habit engine** (`js/core/habits.js`): each habit has a type, schedule, thresholds (`min` / `target` / `mvdMin` / ramp) and an optional *source*, so its value comes from your logs instead of a second tap.
- **Score:** the daily score uses the habits marked "in daily score". Minimum days score the Minimum-day habits; sick days pause scoring. Rolling consistency excludes days before tracking started.
- **Coach** (`js/core/coach.js`): plain rules that separate *facts from your data* from *suggestions*. Nothing is generated or sent anywhere.

### Data model (IndexedDB stores)

`profile`, `settings`, `habits`, `habitLogs` (`habitId:date`), `goals`, `exercises`, `templates`, `workouts`, `workoutSets`, `foods`, `nutritionLogs`, `waterLogs`, `stepLogs`, `weightEntries` (one per date), `measurements`, `bodyFatEstimates`, `photos` + `photoBlobs`, `sleepEntries`, `moodEntries`, `journalEntries`, `readingSessions`, `learningSessions`, `meditationSessions`, `spiritualSessions`, `relationshipEntries`, `dailyReviews` (check-in, Top 3, shutdown, counters), `weeklyReviews`, `monthlyReviews`, `reminderLog`, `tasks` (one-off and repeating; a repeating task is a chain of instances), `meta`.

Dates are local `YYYY-MM-DD` strings. Every record has `id`, `createdAt` and `updatedAt`.

---

## Tests

The tests run in Chromium at iPhone 14 size, using Playwright from the global npm root:

```sh
node tests/serve.mjs 4173 &
NODE_PATH=$(npm root -g) node tests/smoke.mjs  http://localhost:4173/ ./test-shots   # Today, habits, modes
NODE_PATH=$(npm root -g) node tests/phase3.mjs http://localhost:4173/ ./test-shots   # weight, food, training, photos
NODE_PATH=$(npm root -g) node tests/phase4.mjs http://localhost:4173/ ./test-shots   # progress, modules, reviews, backup
NODE_PATH=$(npm root -g) node tests/phase5.mjs http://localhost:4173/ ./test-shots   # reminders, restore, offline,
                                                                                    # keyboard, 1-year dataset, desktop
NODE_PATH=$(npm root -g) node tests/phase6.mjs http://localhost:4173/ ./test-shots   # preloaded setup, tasks, plan, migration
```

Every suite fails on console errors or a page wider than the screen. The smoke and progress suites also flag buttons without an accessible label.

---

## Adding integrations later

The app is deliberately self-contained. If you want automatic steps, sleep or weight later, the cleanest local-first route is an **Apple Shortcut** that reads Health data and builds a JSON file in the backup format, which you then import with *Merge*. This keeps everything on the phone without a server.

Anything that needs a server (push notifications to a closed app, sync between devices) would be a separate, opt-in addition. It is not pretended here.

---

Icons: [Lucide](https://lucide.dev) (ISC). Font: [Inter](https://rsms.me/inter/) (OFL). Both are self-hosted.
