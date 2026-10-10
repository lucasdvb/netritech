# Life OS

A private, local-first app for habits, health, training and life. It is built for daily use on an iPhone from the Home Screen, and works in any modern browser.

Everything you log stays on the device that logged it, unless you turn on sync with your own server (below). There are no accounts, no analytics and no third-party services.

Where it's heading: the owner's brief is in [`docs/master-brief.md`](docs/master-brief.md), and the architecture and phased build plan in [`docs/product-architecture.md`](docs/product-architecture.md). The handover audit (what was checked, fixed and proven, and what is still open) is in [`docs/handover-audit.md`](docs/handover-audit.md).

---

## Using it on your iPhone

To install from Safari, a PWA has to be served over **HTTPS**. Hosting only serves the app's code; your data never leaves the phone.

1. Host the `life-os/` folder on any static host (see below).
2. Open the URL in **Safari** on the iPhone.
3. Tap **Share → Add to Home Screen**.
4. Open Life OS from the Home Screen icon. It runs full-screen and works offline.

The first time you open it from the Home Screen, go to **You → Data** (the initial at the top of Today) and make a backup habit of it. Safari can clear website storage for sites that aren't used for weeks. Installing to the Home Screen and taking regular backups avoids that.

### Keep one address (this is what keeps your data)

Your data lives in the phone's storage **for one web address**. Open Life OS at a different address and it is a different, empty app; the old one still has your data, but the new one can't see it. So:

- **Host it once, at an address that never changes,** and always update that same site. Updates then arrive by themselves (see *Updating* below) and your data stays exactly where it is.
- **Don't use Netlify Drop for updates.** Each drop on app.netlify.com/drop creates a *new* site with a *new* address, which is why an "update" that way opened an empty app.

| Host | How (one-time setup, then updates keep the same address) |
|---|---|
| **Netlify, linked to GitHub (recommended)** | In Netlify: *Add new site → Import an existing project → GitHub*, pick this repository and set **Base directory** to `life-os` (the publish directory is `.` from `netlify.toml`). Every push to the branch you choose deploys to the same address automatically. |
| **Netlify, same site by hand** | Open your existing site in Netlify → **Deploys** → drag the new `life-os-site.zip` (from `sh tools/pack-site.sh`) onto *"Need to update your site? Drag and drop your site output folder here"*. Same site, same address. |
| **Cloudflare Pages** | Connect the repository (root `life-os`), or use *Direct upload* to the same project each time. |
| **GitHub Pages** | Enable Pages for the repo and point it at the branch. The app lives at `https://<user>.github.io/<repo>/life-os/`. Paths are all relative, so a sub-path is fine. |

`netlify.toml` turns Netlify's build off: the app has no build step, and `package.json`'s scripts are developer checks that must not run there.

Each device keeps its own data in its own browser storage (Sync, below, keeps devices the same).

### Moving to a new address (once)

If you already use Life OS at an old address (for example an earlier Netlify Drop) and set up a fixed one:

1. At the **old** address: **You → Data & backup → Back up my Life OS** (or **You → Updating Life OS → Back up now**). Save the file to Files.
2. Open the **new** address in Safari, **Add to Home Screen**, open it from the new icon.
3. **You → Data & backup → Choose backup file** under Restore, and pick the file. Everything comes across: habits, history, workouts, plans, settings.
4. Delete the old Home Screen icon. From now on only the site at the new address is updated.

The 5-minute setup (Today, first open) also offers **Restore** as its first step.

### Updating

After changing any file, rebuild the service-worker asset list, then redeploy:

```sh
node tools/build-sw.mjs
```

This gives the cache a new version (a unit test fails if you forget). A phone that already has Life OS opens the version it has and looks for a new one in the background, when the app opens and each time it comes back to the front. A new version takes over as soon as it has downloaded, and the app reloads into it; if you're typing, it waits and offers **Reload** instead. This works from any earlier release, because the new offline worker does it by itself. **Settings › About › Version** shows which version is running, and **Check for updates** looks right away.

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

**The 5-minute setup** (*You › Set up your days*, offered on Today the first time): your name, your usual day (up, lights out, work hours and days), whether weekends differ (a Weekend plan), how you train (days, gym or home: the programme that fits, or your own), the habits you build first, and your reminders. Nothing changes until the last step, it goes through the same linked rules as changing each thing by hand, and *Undo the setup* puts everything back. Moving from another address? Its first step points to *Restore*.

**Three places and a +.** The tab bar is *Today · Plan · + · Review*. **Plan** is what you're building, in five groups (Habits & routines, Goals, Training, Tasks & notes, Life) after tomorrow and this week. **Review** is how it's going and what you learned, on one screen: today's page to write, this week's story, the reviews that are due, what's moving and why, insights, then Body, the areas and the journal (the pages under it keep their old addresses, *progress/…* and *reflect/…*). **+** logs anything from anywhere: type one line, or tap one of the shortcuts (*Log weight* and *Start workout* first). **You** (the initial on Today, or the rail on wider screens) holds settings, data and privacy. Older addresses (bookmarks, Home Screen shortcuts) land on their new homes.
- **Search** (pull down, or / and ⌘K) goes to any screen by its everyday word ("spending" finds Money) and to any setting, opening Settings on that row; Settings keeps the rarely used (reminders when the app is closed, safety nets) under *Advanced*.
- **Everything linked.** A habit, goal, workout, routine or project ends with *Linked to*: its goals, routine, place in Your day, workout, reminder, pledge, and where you mentioned it. Deleting something linked says so first and offers to hand its links to another; one Undo puts it all back.
- **Every number explains itself.** Tap a run, a strength, a consistency, a goal's percentage, the week on Review or the weight average to see the sum with your own numbers.
- **Reminders on one timeline** (You › Reminders): every reminder in the order of your day. One linked to Your day moves its block when you change it, so everything keeps the same time.
- **Goals measured by anything:** a habit's total (km, minutes, pages), several habits together, a body measurement, sleep or steps, as well as weight, workouts, pages and your own number.
- **#mentions and @mentions** in the brain dump and the journal: #Prayer links to the habit (suggested as you type), @Sarah collects everything you've written about Sarah (Relationships lists them).
- **Training from Today** opens straight in gym mode. While a workout is running and you've left it, a bar above the tab bar shows it (and the rest still to go) and takes you back in one tap.

- **Moving around:** screens hand over with a View Transition, and the habit, goal or entry you tapped grows into the next screen's title. Back returns to exactly where you were, and stays at the top of the screen however far down a page you scroll. Pull down at the top of a place to search. Sheets follow your finger: a flick or a long pull closes them, and the habit editor opens at half height and pulls up. Reduced motion turns all of this into simple fades.
- **Keyboard:** 1–3 switch place, J/K move through items, X or Space completes, E edits, N logs something, / or ⌘K searches, ? shows the list.
- **Tablet and desktop:** an icon rail from 600 px, a labelled rail from 1024 px. Habits, goals and the journal show the list and the selected item side by side; the list keeps its place.
- **Logging in one line:** type what happened ("water 500", "slept 11pm to 6:30", "read 20 pages of Atomic Habits", "2 fruit and 3 veg", "called mum 20 min") or what's next ("call mum Friday"). It's read on your phone and shown back (what, how much, which day) before anything is saved; when a line could mean two things ("chicken", "1500") it asks, and something that hasn't happened yet ("run 5k tomorrow") becomes a task. Suggestions complete what you type, and the keyboard's microphone works for dictation. Every save has Undo.
- **Hold and swipe:** hold a habit to enter an amount on the number pad (last value already there) or to log its tiny version; swipe it left for *Not today*, which takes it out of today's plan and score (it counts as the run's one allowed miss). *Not today* habits wait at the bottom of Today to be brought back. The same choices are buttons in the habit's sheet, and right-click is the hold on a computer. Weight and steps open on the number pad too.
- **Explanations:** text that explains a screen or a card sits behind an ⓘ beside its title, so the screens stay short. Tap it to read, tap again to fold. Settings › *Show explanations* keeps them all open.
- **Edits and deletes:** editing happens in sheets, and a habit's changes save as you go, with Undo when you close. Deleting a habit, goal, entry, photo or session happens at once with Undo (swipe the message away, sideways or down, to clear it sooner; the change stays undoable in You › Recent changes); something linked to other things shows its links first and can hand them on. Only whole-device actions (restore, erase) ask first.

- **Today is the cockpit.** At the top, one **Log anything** field (to speak instead, use the keyboard's own microphone). Then the Now card (score and one next action), the **quick row** and **Your day**.
  - The **quick row** shows the four things you log most around this hour, learned on this device (Edit Today › *Quick row learns from me*; off, you choose its actions). Water is one tap, a weigh-in two.
  - **Your day** is your plan from Your plan › Your day: every block in order, a line at the time it is now, the block you're in open with its one action (Check in, Done, Start, Log, Close the day), and the ones behind you folded. It's the real habit, routine or workout behind each block, so done here is done everywhere.
  - Sections you haven't used in two weeks **fold to one line** (tap to open; Edit Today › *Fold sections I don't use*). After midnight, before your day ends, Today says so: "Still Friday · your day ends at 03:00".
  - **You › Recent changes** lists everything this session offered Undo for, so it can be undone after its message has gone. **You › Your usage** shows what the usage meter counted (on this device only, never synced or backed up) and, after 30 days, what you haven't opened.
- **Today** answers "what now?". The **Now card** holds today's score (tap it to see exactly what counts) and one next action, picked from the time of day: the check-in in the morning, the next step of the routine that's open, your priorities during work, your three, anything overdue, closing the work day in the evening, and at most one coach suggestion. *Not now* moves to the next one; when nothing is left it says you're done for today, with a line for your win.
  - **Routines** are habits linked into a sequence with a window of time (Morning and Evening to start). The one that's open shows its steps in order with the next one marked; tick a step, or **Did it all** for the whole routine in one tap (with Undo). The others are one line each.
  - **Your three** (when they aren't steps of a routine; two to five if you change it in Settings), **Priorities and tasks** in one card (the day's Top 3 are tasks with a rank, so there is one list), your **moodboard** as a quiet collage, **Coming up** (birthdays, anniversaries and countdowns in the next two weeks), up to six **pinned actions**, and **Other habits** on autopilot, folded.
  - **Edit Today** drags blocks into order, hides them, and chooses and orders the pinned actions. The date opens a day picker; swiping the header moves a day.
  - **Normal / Minimum / Rest / Sick** day modes change the plan and the Now card.
  - **Rituals:** the morning check-in is a one-minute ritual (sleep, how you feel, an optional weigh-in, your three), one question per screen. In the evening, *Close your day* asks what's left, one win, which unfinished tasks move to tomorrow and tomorrow's first task, then you **seal the day** with a press and hold. Every step can be skipped, and answers save as you go.
  - **Safety nets**, each shown at most once and each switchable off in *Settings › Safety nets*: the morning after a day you didn't log, a **catch-up** card lets you tap what you did; after three or more days away, a **fresh start** marks the gap as *away* (not missed, and runs carry on over it) and lets you pick one to three habits for the week; after a rough week a habit is offered a **smaller target** (or its tiny version, or a pause) for two weeks, and after two steady weeks a **10% step up**, never more than once a fortnight per habit and never on its own; once a week a **tidy-up** brings habits untouched for two weeks (keep, smaller, pause until a date, archive).
  - **Backup plans and your why:** a habit can carry "if it rains → 20 minutes at home" and one line about who it makes you. Both appear when you go to mark it *not today*, with how many times you showed up this month; doing the backup counts.
- **Plan** is lists you act on: **tomorrow's three** written right there, **this week** day by day (with the three things the weekly review set for it), then habits, goals, projects, reading, your moodboard, tasks, lists, training, money, dates and the playbook.
  - **Drag to reorder** wherever order matters: priorities, Today's blocks and pinned actions, routine steps and routines, habits and goals (*Arrange*), workouts and their exercises, exercises during a session, list items, money categories and moodboard pictures. Drag the grip, or focus it and use the arrow keys (Home and End jump); a screen reader hears where it landed.
  - **Moodboard:** up to five pictures that remind you why, kept on the phone (each shrunk to 1600 px). They sit on Today as one collage, the first one large; *Edit* arranges, captions or removes them. Every backup carries them.
  - **Lists:** plain checklists for what isn't a task (groceries, packing, ideas). Add one item at a time or paste several lines; ticked items wait at the bottom until you clear them, or untick everything to reuse a packing list.
  - **Money:** what you spend, in five seconds (an amount and a category), against a monthly budget if you set one: spent so far, what's left and about how much a day, by category, every entry. Your currency, categories and budget are yours to change; it's linked to no bank and stays on the phone.
  - **Dates:** birthdays and anniversaries come round every year (with the age or the number of years when you know the year), events happen once; anything in the next two weeks, and any countdown you ask for, shows on Today under *Coming up*.
  - **Goals** take three questions (what outcome, by when, how you'll know: your weight, body fat, how often a habit is done, workouts, pages read, a number you update, milestones, or keeping habits going). Each goal then says where it's heading from your own data ("On pace for 74 kg by 20 Nov, 42 days before your deadline", "3 weeks behind") or what data it needs first, with its chart and habits from the same area suggested to link.
  - **Projects** are flat: an outcome and its tasks, added in a line. Deleting a project keeps its tasks.
  - **Books**: reading now, want to read, finished. Log pages on the number pad or anywhere with "read 20 pages", which moves the book you're reading; the last two weeks' pace says when you'd finish.
  - **The weekly review plans next week**: three things for the week, and the first one can become Monday's priority.
- **Progress you can feel, quietly** (no points, no currency, nothing that nags):
  - **Seasons:** six weeks from a Monday with a name, three habits and one intention. Starting one makes those three your focus (any other habit in focus moves to autopilot, with Undo). Week 3 brings a short halfway check-in; at the end the summary (plan done, sealed days, workouts, each habit, records and plates) is frozen. A quiet line on Progress shows the week you're in.
  - **The ghost:** this week against your past self at the same point of its week, as one marker on a thin bar. Race the same week a month ago (the default), your best week of the last twelve, or last week (Settings).
  - **Records** come from your own data: heaviest lift, most reps or longest hold per exercise, best protein week, longest run on a habit, most focus blocks in a week, earliest week of wake-ups, most steps in a day. A value only counts as a record after three earlier entries, and the shelf follows your data if you edit or delete something.
  - **Mastery plates** per habit at 1, 10, 30, 66 and 150 times: Started, Practised, Steady, Second nature, Mastered. Each plate is engraved with the day it was reached and never changes afterwards (an Undo on the same day takes it back).
  - **Commitments:** a pledge to one habit for 7, 14 or 30 days or any length from 3 to 90, with a stake you choose, sealed with a press and hold. Days count from your logs. Ending early asks what got in the way and offers a smaller pledge.
  - **Rewards you set:** something you'll enjoy, unlocked by something real (so many workouts, sealed days, times you did a habit, a season's score, a goal reached), counted from the day you set it.
  - **A side quest** each week, optional, leaning towards the area you've done least; accepting adds it to your tasks.
  - Each new level, record or reward is marked once, as a **moment**: a fine blue line draws around the card it belongs to and a plate engraves at the bottom of the screen, with a light passing over it. Finishing the last of your three gets one too (once a day). At most one moment per action.
- **Ceremonies**, only at their moment or when you ask, always skippable with a tap and shown as a still card when the phone asks for reduced motion:
  - **Seal the day:** after the hold, the day's card folds into its tile in the week and fills.
  - **Season finale:** offered when a season ends (and replayable from the season page): the name and intention, six weeks filling, the numbers counting up, the plates and records it earned.
  - **Monthly film:** your month as a short story (days sealed, plan done, strongest habit, a record, training, weight, a win), in *Review › Monthly films*; *Save video* records it on the phone and hands it to the share sheet.
  - **Your year:** every day as one ray around a circle, as long as the day was full, a blue point for each sealed day. The same days always make the same picture; *Save print* makes a 3600 × 4500 PNG (12 × 15 in at 300 dpi). In *Progress › Your year*.
  - Black, white and one blue; no confetti. An optional **sound** palette (soft, made on the phone, off by default) lives in Settings.
  - The timing was approved from a HyperFrames preview kept in `videos/life-os-moments/` (not shipped).
- **Habits**: every type: yes/no, numeric, duration, quantity, rating and checklist.
  - Schedules: daily, chosen weekdays, X per week, X per month, every N days.
  - **Focus on three:** each habit is in Focus (three at most, or two to five in *Settings › Habits*), Autopilot, Later or Paused (until a date). *Choose your three* sorts every habit on one screen, with suggestions. *Arrange* drags habits into order; in Later, the first one moves into focus next.
  - **Tiny versions** that always count, **runs** that survive one miss ("don't miss twice"), comebacks, and a suggestion to move a habit to autopilot after six steady weeks.
  - A new habit takes three questions (what, when, the tiny version); everything else is under *More options*. Per-habit reminders.
  - Values can come from your logs automatically (water, protein, steps, sleep, workouts, reviews).
- **Body**: weight with 7/14/30-day trends (logged on the number pad from your last value); nutrition with quick foods, protein and adaptive calories; water and steps.
  - Measurements every two weeks; private progress photos with a compare slider; sleep. Body-composition estimates sit one level down, behind one line.
  - **From Apple Health:** a web app can't read Health, so a Shortcut (the recipe is in the app) copies today's steps, sleep and weight and opens Life OS. One tap on *Paste* shows all three, one *Save all* keeps them, with Undo. Pasting by hand works too.
- **Training**: today's planned session with a smart call ("train as planned", "go lighter", "walk instead") based on sleep, energy and stress.
  - **Your workouts:** make as many as you like: a name, a type, about how long, a note, and exercises in order, each with sets, a target (8–12, 30–45 s, 20 min), a starting load and rest between sets (or the default for its kind). Drag to reorder, duplicate, delete with Undo (the weekly plan days that used it clear and come back). Any session can be saved as a workout, and exercises can be dragged into a new order mid-session. Gym mode rests for the time the workout sets. Loads follow your kg or lb setting.
  - Workout logger prefilled from last time, with progressive-overload comparison.
  - **Gym mode:** one set at a time with large controls for one hand (every target at least 56 px, black for gym lighting), the screen kept awake (or a plain warning where the browser can't), and a rest timer that starts when you log a set and stays right to the second across app switches and reloads. The next set is prefilled from the one you just did; the full list is one tap away.
  - Exercise library with history; dedicated calf, core and posture tracking.
  - **Effort and autoregulation:** in gym mode each set can carry how many more reps you had in you (*Reps left* 0–4+, one tap, optional). Four or more left inside the range moves the rest of that exercise's sets a step heavier; nothing left below the range takes 5% off; next session, every set at the top with three or more to spare is a double step, and lots to spare below the top is two more reps. The exercise page charts your **estimated max** (Epley, counting reps left).
  - **Automatic deload:** Training suggests a lighter week when two lifts' estimated max hasn't gone up in three sessions, when a week of short sleep and low energy meets hard training, or after six hard weeks in a row. *Start a lighter week* halves the sets and takes 10% off every session you start that week (Today says so); *Not now* asks again in two weeks at the earliest.
  - **Temptation bundling:** any habit can be paired with something you only enjoy while doing it (*Pair it with* in the habit editor). The pairing rides with the habit's reminder, and training's shows at the top of gym mode.
  - **Proven programmes, optional** (*Plan › Training › Programmes*): Full body (3 days), Upper / lower (4), Push / pull / legs (6, or 3), Minimum dose (2) and Home dumbbells (3). Each says who it suits, how long it takes, why it works (the research behind it) and how it progresses. *Follow* adds its workouts to your library and sets your training week; recovery and cardio days you had stay. *Stop* puts your own week back; the workouts stay yours to edit. Your own workouts keep working exactly as before if you never choose one.
- **Your calendar in Your day** (*Plan › Your calendar*): add a calendar's subscription link (iCloud, Google, Outlook) or import a .ics file. Its events for the next two months show in Your day as busy time (all-day ones as a line above), count in the morning briefing, and are left out of the free time. Subscriptions refresh when the app opens, at most every three hours; most calendars only let a web page read them through your own sync server (You › Sync), which passes the calendar through without keeping it. Events stay on the device.
- **Tasks into free gaps:** under Your day, the free stretches from now to lights out (20 minutes or more, the one at your energy peak marked). *Fill* lists the open tasks that fit, with your usual overrun applied; picking one gives it that time today, and it shows in Your day at its slot.
- **Estimates that correct themselves:** a task can carry an estimate and what it took (a focus block started for the task adds its minutes by itself). Once three or more finished tasks have both, your own ratio is applied to every new estimate ("Likely 1 h: your tasks take 100% longer than you estimate") and the Tasks screen says how your estimates run.
- **Energy through the day** (*Review › Energy*, or + › Energy): a one-tap check-in (Drained to Sharp). After five days the window where your energy is reliably highest is named as your peak; the briefing and Your day's free gaps point deep work there.
- **The morning briefing:** on Today until noon, the day in a few lines (the kind of day and its times, your calendar, training, the first task, your energy peak, bills due, the morning's doses, a decision to review, a trip) and a takeaway that's due. The morning reminder carries its first lines. *Got it* puts it away for the day; Settings can turn it off.
- **Sleep regularity:** Sleep rates how much your bedtime and wake time move (steady, variable, irregular), and both Sleep and Your days warn when your day plans wake you more than an hour apart.
- **Bills, subscriptions and renewals** (*Plan › Bills*): what's due in the next two weeks and later, and the monthly total. *Paid* logs it in Money and moves the due date on (the 31st stays the month's last day). Bills you pay by hand get a task a few days before; a subscription or renewal gets a "keep it?" task before it renews.
- **Net worth & savings** (*Plan › Net worth*): one balance per account now and then (a monthly prompt) gives what you own minus what you owe and its line; savings goals turn a target and a date into what's needed a month, and say whether the last three months' pace keeps up.
- **Supplements & medication** (*Body › Supplements*): times and dose, one tap per dose that counts the stock down, a reorder task once when it's running low, two weeks' adherence. Reminders per time (medication is never paused or faded).
- **Meals** (*Plan › Meals*): the week's meals from your recipes or in words, each day's planned protein against your target, *Repeat last week*, and *Grocery list*, which writes the week's ingredients into Lists with the same items added up and keeps what you added by hand.
- **Trips** (*Plan › Trips*): dates, where, and how your days run: time off (the days are marked away, nothing counts as missed), a Travel day plan, or as usual. Reminders can pause (medication carries on). The packing list fits the nights and what you're doing; "pack" and each travel leg go on your tasks on their days.
- **Takeaways** (*Review › Takeaways*, a book's page, or +): an idea worth keeping comes back in the morning check-in after 1, 3, 7, 16, 35 and 90 days. *Used it* or *Still true* moves it further out, *Had forgotten* starts again, *Retire* stops it.
- **Decisions** (*Review › Decisions*, or +): the decision, the options, why, what you expect and how sure you are. Three months on it's on Review for a short review (how it turned out, and whether it was a good decision with what you knew then); the scorecard flags overconfidence.
- **The life wheel** (*Review › Life wheel*, due each quarter): eight areas from 1 to 10 on a radar, last quarter as an outline. The weakest becomes the suggested focus of your next season, with the season sheet filled in.
- **The honest habit timeline:** a habit in focus says "Day 23 of about 66", with what the research says (a median of about two months, often more; a missed day doesn't reset it), on its page and on Today.
- **Tasks**: one-off jobs and repeating ones (every day or every few days, chosen weekdays, monthly on a day, yearly on a date), grouped into Overdue, Today, the next six days, Later and Anytime.
  - Ticking a repeating task schedules the next one, so a missed week never piles up.
  - The evening shutdown can move unfinished tasks to tomorrow.
- **Review › this week** (what was Progress) is a story, not a dashboard: this week in one sentence ("Ahead of last week: 82% of your plan done, 3 training sessions and weight down 0.3 kg."), the score against the same point last week, a strip of the week's days (sealed ones marked), **what's moving** (the biggest changes on last week, each with what to do) and **measures** (consistency, weight, sleep, protein, steps and training, each with a decision line; a measure with no data isn't shown). Body and the areas follow; every chart, personal bests, wins and the calendar of every day are one level down.
- **Review › today's page** (what was Reflect) is ready to type: a prompt for the time of day, saved as you write, mood one optional tap, and the morning and evening questions a tap away. Below it are the reviews that are due (close the day, the week, the month), **insights** and the journal.
  - **Insights end in one tap.** Each states what your logs show and carries one change to your plan, with Undo: your weakest routine gets its least-done step made tiny for two weeks; your hardest weekday gets a Minimum day planned; short nights get a wind-down reminder; a training day that rarely happens becomes the 20-minute minimum; a habit that has become automatic moves to autopilot; a flat weight trend lowers the calorie target by 150 kcal (never below the floor); a protein or steps gap adds one step to a routine. *Not now* keeps one quiet for two weeks. An insight you can't act on is never shown. The rules sit behind an engine interface, so a smarter engine can be added later without changing the screens.
  - **The weekly review** takes about three minutes as five short screens: the week in a sentence, what went well and where it slipped (both computed from your logs), one change (pick an insight and it's applied, or write your own) and next week's three. On Sunday from 17:00 the Now card offers it. The monthly review is guided the same way. "See it all on one page" shows every number and question.
- **Areas** (*Review › Areas*): Health, Mind (reading, learning, meditation), Spirit, Relationships and Work (deep work, shutdown), each a view over the same habits, goals and sessions.
  - **Focus timer** (from Work, the + sheet, or a Today tile): 25, 50 or 90 minutes or your own, with what it's for. A small pill above the tab bar follows you with the time left and pause; when time is up the block counts as a focus block for that day, even if the app was closed. *Finish now* counts the minutes so far; *Stop* counts nothing.
  - **The playbook** (*Plan › Playbook*) is the workbook's Plan & Routines playbook: your day, your week, routines, training templates, food targets and the rules. It is built from your live habits, templates and targets, so editing them updates it.
  - **Your day** on the playbook is the day as blocks you can change: wake, prayer, mobility, training, work, the evening routine, lights out, and anything you add. Each block is linked to the habit, routine or time behind it, so tapping one to change its time or length changes that habit, routine and its reminders, and Today follows (routines keep their steps in time order). Drag a block's handle to move it: it starts when the one before it ends. Add any habit, routine, training, work or a plain block like *Lunch*; remove one with Undo. Moving wake or lights out can carry the whole morning or evening with it. Settings' wake, training, work and lights-out times are the same links.
  - **Your days**: your day can differ from day to day. On Your plan, make a plan for each kind of day (*Long day*, *Short day*, *Saturday*: a copy of another to start), give each weekday its plan, and in the next two weeks give any date another plan or adjust that day only. *Every day* is the linked day above; another plan keeps its own times, and on its days Today, the Now card, the routines, the reminders (in the app, from your server and in the calendar file) follow them. A habit that's in some plan but not in a day's plan isn't expected that day. Each plan shows how much free time it leaves; the weekly review sets out next week's days. With only Every day, nothing changes.
  - **You** holds Settings (units, theme, targets, reminders, safety nets), Data and Privacy. Search is a pull down at the top of any place, or / and ⌘K.

### Preloaded on first launch

Your whole system from the Life OS spec and workbook is there on day one. Nothing needs typing in:

- **Profile and day:** 35, 180 cm, 76 kg, ~25% → 15% body fat, wake 06:00, train 06:30, work 10:00–20:00, lights out 22:00.
- **Habits:** 41 habits across the 8 pillars, each with a tiny version, all on autopilot until you choose your three (the optional ones wait in Later), and the 8 Minimum-day essentials. Morning reset and the evening routine are one-tick checklists. Mobility & posture is a workout (below); its habit ticks itself when you finish it.
  - Caffeine cutoff and alcohol-free days are included but archived, because the spec says to track them only if they apply. A task asks you to decide.
- **Training:** the Mon–Sun split with six workouts (upper + posture, lower + calves + core, walk + mobility, cardio, 20-minute minimum, and the 10-minute Mobility & posture) and about 40 exercises with progressions. Mobility sessions don't count as training.
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

iOS only delivers notifications to a fully closed web app through a push server. This private, server-free version deliberately doesn't use one, so **your calendar does the reminding**: *You › Reminders in your calendar* builds one calendar file (morning check-in, each training day, close the day, the weekly and monthly reviews, and every habit with a reminder time), each event with an alert at its time and a link back to the right page. On iPhone, tap *Add All* when Calendar opens. The file is made on the phone and handed straight to Calendar; nothing is sent anywhere.

The **app-icon badge** shows how much of today's plan is still open and updates as you log (Settings › Reminders). On iPhone it needs notifications allowed for Life OS.

### Sync between your devices

*You › Sync* keeps your phone and your computer the same.
- Each device keeps its full copy and works offline. Changes travel through a small server you own: a free Cloudflare Worker with one database, set up once in about five minutes.
- The steps are in the app (*How to set it up*, with a button that copies the server code) and in [`server/README.md`](server/README.md).
- Everything is encrypted on the device before it leaves, with a sync key only your devices hold, so the server can't read any of it.
- The first device starts sync and shows the key. Another device joins with it and takes the synced data; what it had is kept as a safety copy.
- The newest change to a record wins. Settings sync one by one, and theme and notifications stay with each device.

---

## Your data

- **Storage:** IndexedDB in the browser (`life-os` database), on this device only. Photos are stored as blobs and are never uploaded.
- **Backup:** You → Data → *Back up my Life OS*. You get one JSON file, with photos optional. On iPhone it opens the share sheet, so you can save it to Files or iCloud Drive yourself.
- **Restore:** you can merge (keeps the newer version of each record) or replace everything (asks you to confirm first). Either way, what's on the device is kept as a safety copy first, so a restore can be taken back from *Safety copies*. An invalid file is rejected and nothing changes.
- **CSV:** export weight, measurements, habits, nutrition, water, steps, sleep, workouts and journal for spreadsheets.
- **Sample data:** opt-in, clearly labelled and removable in one tap. Every sample record carries `demo: true` and never overwrites a real entry.
- **Erase:** You → Data → *Erase everything on this device* (asks twice). Sync is turned off first, so the fresh start never replaces your records on your other devices.
- **Brain dump:** Plan → Brain dump keeps notes by category; they're in backups, sync and the CSV export.
- **Exercise pictures and notes:** up to two pictures and a note per exercise, added when you make the exercise (+ on Exercises) or later (⋯ › Photos and note). A picture can be a photo or a GIF of the movement (kept as it is, up to 6 MB, so it plays), picked or pasted straight from a web page. Gym mode shows it large, so the form is on screen during the set. They're always in backups, like the moodboard; a GIF over 1.8 MB stays off sync.

**Security.** The app runs only its own code: a Content Security Policy (`index.html`) allows scripts from this site alone (plus the one-line theme script, allowed by its hash; change that script and its hash in the policy together), so even a damaged or hostile record can't run anything. Everything you type is shown as text, and colours or categories that reach markup are checked against known values. A backup is checked in full before anything changes, and a restore that fails part-way changes nothing. CSV cells that a spreadsheet would treat as formulas are exported as text.

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
- **Typography: Inter.** Self-hosted in `assets/fonts` (SIL OFL) in the weights the system uses (400, 500 and 600, cached for offline use; 700 is declared for rare emphasis but nothing uses it, and emphasis inside text is 600). Every size, weight, line height and letter spacing comes from a semantic role (Display, H1–H4, Body, Caption, Footnote, Micro) defined once in `css/tokens.css`, stepping up on tablet and desktop. The owner's rules are in [`docs/typography.md`](docs/typography.md), and unit tests fail if a stray size, weight or uppercase label appears.
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
tools/                 build-sw.mjs · check-budgets.mjs · build-icons.mjs · render-icons.mjs ·
                       unused-imports.mjs · manual-shots.mjs
tests/                 unit/ (node --test, no browser) and Playwright browser suites
docs/                  the owner's brief and the architecture and build plan
```

- **No framework.** It uses ES modules, a tagged-template `html` that escapes by default, and a small keyed DOM morph (`js/ui/patch.js`). Re-renders therefore keep existing elements, so animations, focus, scroll and half-typed text survive.
- **Data flow:** `store` loads every store into memory at start (opening on Today, the workout history loads its last three weeks first and the rest straight after; whatever needs all of it waits for `store.complete()`). Reads are synchronous, and writes are optimistic: the UI updates first, and everything written in the same moment goes to disk in one transaction. A failed write rolls back and shows a message; if another window takes the database over (an update opened there), this one stops writing and asks to be reloaded. Derived numbers are memoised per data version. Screens never touch IndexedDB; the store talks to a storage adapter, so a sync-backed one can replace it later.
- **Ready for sync:** every record carries `rev` (+1 per write), and dated records carry the time zone they were written in. Deleting leaves a tombstone (no data, just the id and `deletedAt`), and every change leaves its latest entry in the `outbox`. Nothing reads these yet; they are the hooks a future sync needs.
- **Migrations:** changes to stored data are ordered, one-time migrations (`js/data/migrations.js`). Before any of them run, and before a backup is restored, a safety copy of everything you entered is saved on the device (the last three are kept, and can be restored from *You › Data*). Backups from older versions catch up through the same migrations when restored.
- **Day boundary:** the day ends at 03:00 by default (*Settings › My day ends at*), so ticking a habit at 00:30 counts for the day you're still living.
- **Day snapshots** (`js/domain/snapshots.js`): one compact summary per finished day (score, sleep, weight, steps, protein, workouts, mood, tasks done), rebuilt in the background in small slices whenever that day's data changes. They are kept for what reads many days at once (a future AI summary or sync); nothing on screen depends on them yet.
- **Text size:** all type is in `rem` on a 17px base, so it follows the phone's text-size setting (Dynamic Type on iPhone); a test renders every screen at 85% and 200% and fails if text is cut off.
- **Habit engine** (`js/domain/habits.js`): each habit has a type, schedule, thresholds (`min` / `target` / ramp), a `tiny` version (`{ label, min }`), a `state` (focus, autopilot, queue, paused) and an optional *source*, so its value comes from your logs instead of a second tap. Runs are judged per scheduled day (or per week / month for flexible habits), and only two misses in a row end one.
- **Routines** (`js/domain/routines.js`): steps are habits or plain lines; each day's plain steps and finish time live in `routineRuns`. A routine opens in its window, where the hours before the day ends (03:00) still count as the evening.
- **Next action** (`js/domain/next-action.js`): plain rules that rank candidates (check-in, routine step, training, your three, priorities, overdue, shutdown, one coach suggestion) and fall back to a done-for-today state.
- **Score** (`js/domain/scoring.js`): today's score is the share of today's plan that is done: each routine (part-way counts), your focus habits that are due, plus your Top 3. Tiny versions count; autopilot never lowers it. Minimum days plan the tiny versions of your three plus the essentials; rest days drop training; sick days pause scoring. Rolling consistency excludes days before tracking started.
- **Capture** (`js/domain/capture.js`): a local parser, plain rules and no network. Recognisers run from the most specific (sleep, faith, sessions, steps, workouts, water, food from your own food list, weight, measurements, how you feel, counters, people) to habits by name, then tasks and dates; a log dated in the future becomes a task, and a reading that isn't certain becomes a question. `capture-save.js` writes everything in one batch and keeps what each record was, so Undo restores it exactly. Tested against a table of 167 phrasings (all read right, none logged as something else).
- **Haptics** (`js/ui/haptics.js`): one map from moments (tap, success, hold, threshold, commit, warn, seal) to a vibration pattern or iOS tick, so the same kind of action always feels the same.
- **Goals, projects and books** (`js/domain/goals.js`, `projects.js`, `books.js`): a goal's measure gives a series (weigh-ins, estimates, your updates, or counts since the goal began); levels are projected from a least-squares trend over six weeks, counts from their pace so far, and a goal without enough data says exactly what it needs. Projects are one level deep by design. A reading session with pages moves its book on and finishes it at the last page.
- **Rituals and safety nets** (`js/domain/rituals.js`, `js/domain/adapt.js`): which ritual screens apply today, sealing a day (`sealedAt` on the day record), and the rules behind catch-up, time away (`away` days are skipped by runs and scores like sick days), shrink and grow (a temporary `temp` target that ends by itself), and the tidy-up. They suggest; nothing changes until you accept, and every change has Undo.
- **Coach** (`js/domain/coach.js`): plain rules that separate *facts from your data* from *suggestions*. Nothing is generated or sent anywhere.

### Data model (IndexedDB stores)

`profile` (including `dayEndsAt`), `settings` (including `nets`, the safety nets you turned off), `habits` (with `backup`, `why` and a temporary `temp` target), `habitLogs` (`habitId:date`; `skip` marks *Not today*), `goals`, `exercises`, `templates`, `workouts`, `workoutSets`, `foods`, `nutritionLogs`, `waterLogs`, `stepLogs`, `weightEntries` (one per date), `measurements`, `bodyFatEstimates`, `photos` + `photoBlobs`, `sleepEntries`, `moodEntries`, `journalEntries`, `readingSessions`, `learningSessions`, `meditationSessions`, `spiritualSessions`, `relationshipEntries`, `dailyReviews` (mode including `away`, shutdown, win, counters including `deepWork` and `focusMinutes`, rituals done, `sealedAt`, catch-up), `weeklyReviews`, `monthlyReviews`, `reminderLog`, `tasks` (one-off and repeating; a repeating task is a chain of instances; the day's Top 3 carry a `rank`), `routines` and `routineRuns`, `projects` (tasks carry `projectId`), `books` (reading sessions carry `bookId`), `seasons`, `records` (which personal records have been marked), `levelEvents` (mastery plates, engraved once), `rewards`, `commitments` (pledges), `quests` (the week's side quest), `lists` (a name and its items in order), `expenses` (amount, category, note, date), `events` (birthdays, anniversaries, events), `meta` (seed version, applied migrations). Settings also hold the moodboard (order and captions; the pictures are `photoBlobs` named `mb-…`), money (currency, budget, categories), the running focus block and the focus limit. Workout `templates` keep their exercises in order with sets, target, load and `rest`.

Device-only stores, never in backups or a future sync: `daySnapshots` (derived), `outbox` (latest change per record), `localBackups` (safety copies).

Dates are local `YYYY-MM-DD` strings. Every record has `id`, `createdAt`, `updatedAt` and `rev`.

---

## Tests

Unit tests cover the rules and the data layer without a browser (store, migrations, day boundary, day snapshots, colour contrast, motion tokens):

```sh
npm run lint               # ESLint core rules: undefined names, unused code, unreachable code
npm run test:unit          # node --test tests/unit/*.test.mjs
npm run build              # regenerate the offline file list, then check size budgets
```

`npm test` runs the lint, the unit tests and every browser suite. The lint uses a global ESLint (`npm i -g eslint`) and only its built-in rules, so it needs no plugins; `eslint.config.mjs` lists the browser globals the app uses, which keeps a missing import from reaching a screen that only breaks when that path runs.

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
NODE_PATH=$(npm root -g) node tests/rituals.mjs http://localhost:4173/ ./test-shots  # rituals, seal the day, five days away,
                                                                                    # catch-up, backup plans, shrink and grow, tidy-up
NODE_PATH=$(npm root -g) node tests/plan.mjs http://localhost:4173/ ./test-shots     # tomorrow and this week, a goal in three
                                                                                    # questions with its projection, projects, books
NODE_PATH=$(npm root -g) node tests/body.mjs http://localhost:4173/ ./test-shots     # gym mode under clock control, rest across
                                                                                    # an app switch and a reload, Health paste
NODE_PATH=$(npm root -g) node tests/reflect.mjs http://localhost:4173/ ./test-shots  # Progress as a story, Reflect ready to write,
                                                                                    # insights applied, guided reviews, calendar file, badge
NODE_PATH=$(npm root -g) node tests/progression.mjs http://localhost:4173/ ./test-shots # plates, records, a season, the ghost,
                                                                                    # a pledge sealed with a hold, rewards, side quest
NODE_PATH=$(npm root -g) node tests/ceremonies.mjs http://localhost:4173/ ./test-shots # seal, finale, film and year: 60 fps at 4×
                                                                                    # slower CPU, skip, reduced motion, video and PNG exports
NODE_PATH=$(npm root -g) node tests/phase3.mjs http://localhost:4173/ ./test-shots   # weight, food, training, photos
NODE_PATH=$(npm root -g) node tests/phase4.mjs http://localhost:4173/ ./test-shots   # progress, modules, reviews, backup
NODE_PATH=$(npm root -g) node tests/phase5.mjs http://localhost:4173/ ./test-shots   # reminders, restore, offline,
                                                                                    # keyboard, 1-year dataset, desktop
NODE_PATH=$(npm root -g) node tests/phase6.mjs http://localhost:4173/ ./test-shots   # preloaded setup, tasks, plan, migration
NODE_PATH=$(npm root -g) node tests/phase12.mjs http://localhost:4173/ ./test-shots  # text at 360 px, drag to reorder, a workout
                                                                                    # from scratch, moodboard, focus timer, lists,
                                                                                    # money, dates, limits that became settings
NODE_PATH=$(npm root -g) node tests/resilience.mjs http://localhost:4173/ ./test-shots # a full disk, a backup of every store,
                                                                                    # another window taking over, a v5 upgrade,
                                                                                    # damaged records, storage blocked
NODE_PATH=$(npm root -g) node tests/workout-notes.mjs http://localhost:4173/ ./test-shots # sets logged by typing, warm-ups, the session
                                                                                    # clock, the brain dump end to end
NODE_PATH=$(npm root -g) node tests/journey.mjs http://localhost:4173/ ./test-shots  # a whole session through the interface: create,
                                                                                    # edit, log, reload, delete; tasks, journal, settings, ⓘ
NODE_PATH=$(npm root -g) node tests/day-plan.mjs http://localhost:4173/ ./test-shots # your day: change a block and Today and the
                                                                                    # reminders follow, carry the morning, drag, add, remove
NODE_PATH=$(npm root -g) node tests/cockpit.mjs http://localhost:4173/ ./test-shots  # the cockpit: learned quick row, 1-tap water, your day
                                                                                    # with a line at now, folding, speaking, Recent changes
NODE_PATH=$(npm root -g) node tests/structure.mjs http://localhost:4173/ ./test-shots # Today · Plan · + · Review, Plan's five groups,
                                                                                    # search to screens and settings, gym from Today
NODE_PATH=$(npm root -g) node tests/linking.mjs http://localhost:4173/ ./test-shots  # linked to, safe delete with Undo, numbers that
                                                                                    # explain, reminders timeline, goals, #/@mentions
NODE_PATH=$(npm root -g) node tests/update.mjs x ./test-shots                         # a phone with the app gets a new release: applied on
                                                                                    # the next open, or offered with Update mid-session
NODE_PATH=$(npm root -g) node tests/a11y.mjs http://localhost:4173/ ./test-shots     # axe (WCAG 2.2 AA) on every screen, sheet and
                                                                                    # state, light and dark; a keyboard-only morning
NODE_PATH=$(npm root -g) node tests/visual.mjs http://localhost:4173/ ./test-shots   # every screen against its baseline in tests/visual
NODE_PATH=$(npm root -g) node tests/hardening.mjs http://localhost:4173/ ./test-shots # the performance budgets (run it on its own)
```

Every suite fails on console errors or a page wider than the screen. The accessibility suite needs `axe-core`, a development dependency only (`npm install` once); nothing of it ships.

**Visual baselines.** `tests/visual/` keeps every screen, light and dark, shrunk to 64 pixels wide (about 5 KB each). The suite fails when a screen changes by more than 1.5%. After a deliberate design change, refresh them with `UPDATE=1 node tests/visual.mjs …` and commit the new copies.

**The manual's pictures.** The owner's manual (a step-by-step guide per routine) shows real screens with numbered callouts. When a screen it shows changes, retake them with `node tools/manual-shots.mjs http://localhost:4173/ ./manual-shots` (or name the flows to retake, like `05-day`) and replace the images in the manual.

**Performance budgets** (`tests/hardening.mjs`, with a year of data and the CPU slowed 4×, Lighthouse's mid-tier phone setting for a machine like the one the tests run on):

| Measure | Budget | Measured |
|---|---|---|
| Today usable from a cold start | under 600 ms | about 470 ms |
| Any screen's render, first time and after a change (median of three visits) | under 70 ms | 35 ms at most; no single render over 120 ms |
| A tap's visual response (input to next paint, median of three) | under 50 ms | 16 to 40 ms |
| Long tasks while using a screen (taps, typing, background work) | none over 50 ms | none |
| JavaScript for the first screen | target 200 KB, limit 240 KB | 212 KB (over target since the October 2026 handover fixes; within the limit) |
| Offline precache | target 1.75 MB, limit 2 MB | 1.65 MB |

Opening a screen is one task of render plus the browser's own layout; on the slowed profile that is 60 to 120 ms for the longest screens, so their lower sections fill in just after the screen appears (`js/ui/later.js`). Opening on Today, the workout history (the biggest store) loads its last three weeks first, which is all Today reads, and the rest straight after; backups, exports, records and the day summaries wait for all of it.

**By hand before a release:** [`docs/voiceover-script.md`](docs/voiceover-script.md), a walk through the app with VoiceOver on an iPhone.

---

## Adding integrations later

The app is deliberately self-contained. If you want automatic steps, sleep or weight later, the cleanest local-first route is an **Apple Shortcut** that reads Health data and builds a JSON file in the backup format, which you then import with *Merge*. This keeps everything on the phone without a server.

Anything that needs a server (push notifications to a closed app, sync between devices) would be a separate, opt-in addition. It is not pretended here.

---

Icons: [Lucide](https://lucide.dev) (ISC). Font: [Inter](https://rsms.me/inter/) (OFL). Both are self-hosted. Layout, button and motion details come from the GetLayers library.
