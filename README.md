# Life OS

A private, local-first app for habits, health, training and life. It is built for daily use on an iPhone from the Home Screen, and works in any modern browser.

Everything you log stays on the device that logged it. There are no accounts, no servers, no analytics and no third-party services.

Where it's heading: the owner's brief is in [`docs/master-brief.md`](docs/master-brief.md), and the architecture and phased build plan in [`docs/product-architecture.md`](docs/product-architecture.md).

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

**Four places and a +.** The tab bar is *Today · Plan · + · Progress · Reflect*. **Plan** is what you're building (tomorrow, habits, goals, tasks, training, the playbook). **Progress** is how it's going (trends, calendar, insights, Body, and one page per area of life). **Reflect** is what you learned (today's journal, reviews, the archive). **+** logs anything from anywhere: type one line, or tap one of the shortcuts (*Log weight* and *Start workout* first). **You** (the initial on Today, or the rail on wider screens) holds settings, data and privacy. Older addresses (bookmarks, Home Screen shortcuts) land on their new homes.

- **Moving around:** screens hand over with a View Transition, and the habit, goal or entry you tapped grows into the next screen's title. Back returns to exactly where you were. Pull down at the top of a place to search. Sheets follow your finger: a flick or a long pull closes them, and the habit editor opens at half height and pulls up. Reduced motion turns all of this into simple fades.
- **Keyboard:** 1–4 switch place, J/K move through items, X or Space completes, E edits, N logs something, / or ⌘K searches, ? shows the list.
- **Tablet and desktop:** an icon rail from 600 px, a labelled rail from 1024 px. Habits, goals and the journal show the list and the selected item side by side; the list keeps its place.
- **Logging in one line:** type what happened ("water 500", "slept 11pm to 6:30", "read 20 pages of Atomic Habits", "2 fruit and 3 veg", "called mum 20 min") or what's next ("call mum Friday"). It's read on your phone and shown back (what, how much, which day) before anything is saved; when a line could mean two things ("chicken", "1500") it asks, and something that hasn't happened yet ("run 5k tomorrow") becomes a task. Suggestions complete what you type, and the keyboard's microphone works for dictation. Every save has Undo.
- **Hold and swipe:** hold a habit to enter an amount on the number pad (last value already there) or to log its tiny version; swipe it left for *Not today*, which takes it out of today's plan and score (it counts as the run's one allowed miss). *Not today* habits wait at the bottom of Today to be brought back. The same choices are buttons in the habit's sheet, and right-click is the hold on a computer. Weight and steps open on the number pad too.
- **Edits and deletes:** editing happens in sheets, and a habit's changes save as you go, with Undo when you close. Deleting a habit, goal, entry, photo or session happens at once with Undo; only whole-device actions (restore, erase) ask first.

- **Today** answers "what now?". The **Now card** holds today's score (tap it to see exactly what counts) and one next action, picked from the time of day: the check-in in the morning, the next step of the routine that's open, your priorities during work, your three, anything overdue, closing the work day in the evening, and at most one coach suggestion. *Not now* moves to the next one; when nothing is left it says you're done for today, with a line for your win.
  - **Routines** are habits linked into a sequence with a window of time (Morning and Evening to start). The one that's open shows its steps in order with the next one marked; tick a step, or **Did it all** for the whole routine in one tap (with Undo). The others are one line each.
  - **Your three** (when they aren't steps of a routine), **Priorities and tasks** in one card (the day's Top 3 are tasks with a rank, so there is one list), up to three **pinned actions**, and **Everything else** on autopilot, folded.
  - **Edit Today** reorders and hides blocks and chooses the pinned actions. The date opens a day picker; swiping the header moves a day.
  - **Normal / Minimum / Rest / Sick** day modes change the plan and the Now card.
- **Habits**: every type: yes/no, numeric, duration, quantity, rating and checklist.
  - Schedules: daily, chosen weekdays, X per week, X per month, every N days.
  - **Focus on three:** each habit is in Focus (at most three), Autopilot, Later or Paused (until a date). *Choose your three* sorts every habit on one screen, with suggestions.
  - **Tiny versions** that always count, **runs** that survive one miss ("don't miss twice"), comebacks, and a suggestion to move a habit to autopilot after six steady weeks.
  - A new habit takes three questions (what, when, the tiny version); everything else is under *More options*. Per-habit reminders.
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
- **Habits:** 41 habits across the 8 pillars, each with a tiny version, all on autopilot until you choose your three (the optional ones wait in Later), and the 8 Minimum-day essentials. Morning reset, mobility and evening routine are one-tick checklists.
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

The look is built from the [GetLayers](https://www.getlayers.ai) library. Its decisions are recorded in `getlayers.json`:

- **Colours: the brand palette.** White paper in light mode and true black in dark mode.
  - **Cards are one solid colour** from the palette: off-white `#F5F5F7` (near-black `#1D1D1F` in dark mode), near-black for the Today score and Body weight cards, and blue for the first Today tile. No card mixes colours.
  - **Blue (`#0071E3`)** is the one accent: actions, ticks, the active tab, today's bar and the latest bar in charts. In dark mode, blue text is lifted to `#2997FF` so it stays readable on black.
  - **Greys, kept quiet:** near-black for text, dark grey `#434344` for secondary text and mid grey `#6E6E73` for tertiary text, so every line of text clears 4.5:1 contrast (a unit test checks this). In dark mode, dark grey is used for raised and selected surfaces.
  - **Status uses the greys, not extra colours.** "Needs attention" is the strongest grey; rest days are a soft grey. Red appears only on delete buttons and error messages.
  - Selected tabs and chips are near-black (off-white in dark mode), so the blue stays rationed.
- **Style: Stride** from GetLayers sets the layout, the shapes and how sparingly the accent is used.
- **Typography: Inter.** Self-hosted in `assets/fonts` (SIL OFL) in the four weights the system uses (400, 500, 600, 700), so it works offline. Every size, weight, line height and letter spacing comes from a semantic role (Display, H1–H4, Body, Caption, Footnote, Micro) defined once in `css/tokens.css`, stepping up on tablet and desktop. The owner's rules are in [`docs/typography.md`](docs/typography.md), and unit tests fail if a stray size, weight or uppercase label appears.
- **Details from other GetLayers styles:** Aerra's sheen sweep and swapping arrow tile on the main buttons, Relay's ring that draws itself clockwise on hover and focus, and the house reveal (blocks rise out of a slight blur in a short stagger, numbers sharpen as they stop counting).
- **Shapes:** pill buttons and chips, round icon buttons, a floating near-black tab bar on phones (with a white + in the middle) and a near-black rail on tablet and desktop.
- **Charts:** bars are near-black where the target was hit and grey where it wasn't; the latest bar is blue. Line charts are near-black over a soft blue fill.

Every colour is a token in `css/tokens.css` (`--brand`, `--ink`, the greys, the selection colours and the pillar colours).

## Architecture

```
index.html             app shell (tab bar / sidebar, main, sheets, toasts)
manifest.webmanifest   PWA manifest (standalone, icons, shortcuts)
sw.js                  service worker: precache, cache-first, offline navigation
css/                   tokens.css (palette, type scale, motion tokens) · base · components ·
                       views · motion (screen transitions, reduced motion)
js/routes.js           the map: places, every route, and redirects from older addresses
js/app.js              navigation (transitions, list-and-detail), view lifecycle, event
                       delegation, focus management
js/data/               store (in-memory cache + batched optimistic writes), storage
                       adapters (IndexedDB, in-memory), schema, migrations and safety
                       copies, first-run seed (your habit system), backup, sample data
js/domain/             habit engine, scoring, metrics, fitness, coach, goals, reviews,
                       reminders, tasks, dates (with the day boundary), day snapshots
js/ui/                 html`` templates, keyed DOM morphing, components, charts,
                       sheets (with drag physics and detents), toasts, haptics, icons, motion
                       (springs, FLIP), transitions, gestures, keyboard shortcuts, undo
js/screens/            one module per screen, loaded on demand
tools/                 build-sw.mjs · check-budgets.mjs · build-icons.mjs · render-icons.mjs
tests/                 unit/ (node --test, no browser) and Playwright browser suites
docs/                  the owner's brief and the architecture and build plan
```

- **No framework.** It uses ES modules, a tagged-template `html` that escapes by default, and a small keyed DOM morph (`js/ui/patch.js`). Re-renders therefore keep existing elements, so animations, focus, scroll and half-typed text survive.
- **Data flow:** `store` loads every store into memory at start. Reads are synchronous, and writes are optimistic: the UI updates first, and everything written in the same moment goes to disk in one transaction. A failed write rolls back and shows a message. Derived numbers are memoised per data version. Screens never touch IndexedDB; the store talks to a storage adapter, so a sync-backed one can replace it later.
- **Ready for sync:** every record carries `rev` (+1 per write), and dated records carry the time zone they were written in. Deleting leaves a tombstone (no data, just the id and `deletedAt`), and every change leaves its latest entry in the `outbox`. Nothing reads these yet; they are the hooks a future sync needs.
- **Migrations:** changes to stored data are ordered, one-time migrations (`js/data/migrations.js`). Before any of them run, a safety copy of everything you entered is saved on the device (the last three are kept, and can be restored from *Settings › Data*). Backups from older versions catch up through the same migrations when restored.
- **Day boundary:** the day ends at 03:00 by default (*Settings › My day ends at*), so ticking a habit at 00:30 counts for the day you're still living.
- **Day snapshots** (`js/domain/snapshots.js`): one compact summary per finished day (score, sleep, weight, steps, protein, workouts, mood, tasks done), rebuilt in the background in small slices whenever that day's data changes. Later features (Progress, insights, the year view) read these.
- **Text size:** all type is in `rem` on a 17px base, so it follows the phone's text-size setting (Dynamic Type on iPhone); a test renders every screen at 85% and 200% and fails if text is cut off.
- **Habit engine** (`js/domain/habits.js`): each habit has a type, schedule, thresholds (`min` / `target` / ramp), a `tiny` version (`{ label, min }`), a `state` (focus, autopilot, queue, paused) and an optional *source*, so its value comes from your logs instead of a second tap. Runs are judged per scheduled day (or per week / month for flexible habits), and only two misses in a row end one.
- **Routines** (`js/domain/routines.js`): steps are habits or plain lines; each day's plain steps and finish time live in `routineRuns`. A routine opens in its window, where the hours before the day ends (03:00) still count as the evening.
- **Next action** (`js/domain/next-action.js`): plain rules that rank candidates (check-in, routine step, training, your three, priorities, overdue, shutdown, one coach suggestion) and fall back to a done-for-today state.
- **Score** (`js/domain/scoring.js`): today's score is the share of today's plan that is done: each routine (part-way counts), your focus habits that are due, plus your Top 3. Tiny versions count; autopilot never lowers it. Minimum days plan the tiny versions of your three plus the essentials; rest days drop training; sick days pause scoring. Rolling consistency excludes days before tracking started.
- **Capture** (`js/domain/capture.js`): a local parser, plain rules and no network. Recognisers run from the most specific (sleep, faith, sessions, steps, workouts, water, food from your own food list, weight, measurements, how you feel, counters, people) to habits by name, then tasks and dates; a log dated in the future becomes a task, and a reading that isn't certain becomes a question. `capture-save.js` writes everything in one batch and keeps what each record was, so Undo restores it exactly. Tested against a table of 167 phrasings (all read right, none logged as something else).
- **Haptics** (`js/ui/haptics.js`): one map from moments (tap, success, hold, threshold, commit, warn, seal) to a vibration pattern or iOS tick, so the same kind of action always feels the same.
- **Coach** (`js/domain/coach.js`): plain rules that separate *facts from your data* from *suggestions*. Nothing is generated or sent anywhere.

### Data model (IndexedDB stores)

`profile` (including `dayEndsAt`), `settings`, `habits`, `habitLogs` (`habitId:date`; `skip` marks *Not today*), `goals`, `exercises`, `templates`, `workouts`, `workoutSets`, `foods`, `nutritionLogs`, `waterLogs`, `stepLogs`, `weightEntries` (one per date), `measurements`, `bodyFatEstimates`, `photos` + `photoBlobs`, `sleepEntries`, `moodEntries`, `journalEntries`, `readingSessions`, `learningSessions`, `meditationSessions`, `spiritualSessions`, `relationshipEntries`, `dailyReviews` (mode, shutdown, win, counters), `weeklyReviews`, `monthlyReviews`, `reminderLog`, `tasks` (one-off and repeating; a repeating task is a chain of instances; the day's Top 3 carry a `rank`), `routines` and `routineRuns`, `meta` (seed version, applied migrations).

Device-only stores, never in backups or a future sync: `daySnapshots` (derived), `outbox` (latest change per record), `localBackups` (safety copies).

Dates are local `YYYY-MM-DD` strings. Every record has `id`, `createdAt`, `updatedAt` and `rev`.

---

## Tests

Unit tests cover the rules and the data layer without a browser (store, migrations, day boundary, day snapshots, colour contrast, motion tokens):

```sh
npm run test:unit          # node --test tests/unit/*.test.mjs
npm run build              # regenerate the offline file list, then check size budgets
```

The browser suites run in Chromium at iPhone 14 size, using Playwright from the global npm root:

```sh
node tests/serve.mjs 4173 &
NODE_PATH=$(npm root -g) node tests/phase0.mjs http://localhost:4173/ ./test-shots   # upgrades, safety copies, reloads mid-write,
                                                                                    # day boundary, text at 85% and 200%
NODE_PATH=$(npm root -g) node tests/smoke.mjs  http://localhost:4173/ ./test-shots   # Today, habits, modes
NODE_PATH=$(npm root -g) node tests/phase1.mjs http://localhost:4173/ ./test-shots   # choose your three, tiny versions, runs,
                                                                                    # the score sheet, new habit, pause, graduation
NODE_PATH=$(npm root -g) node tests/phase2.mjs http://localhost:4173/ ./test-shots   # every old route, 3-level reach, keyboard,
                                                                                    # reduced motion, scroll, split view, Undo
NODE_PATH=$(npm root -g) node tests/today.mjs  http://localhost:4173/ ./test-shots   # Today at 07:00, 13:00, 21:00 and 00:30,
                                                                                    # routines, Edit Today, a year of data
NODE_PATH=$(npm root -g) node tests/capture.mjs http://localhost:4173/ ./test-shots  # one-line capture, real touch hold and
                                                                                    # swipe, number pad, Undo, labels
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

Icons: [Lucide](https://lucide.dev) (ISC). Font: [Inter](https://rsms.me/inter/) (OFL). Both are self-hosted. Layout, button and motion details come from the GetLayers library.
