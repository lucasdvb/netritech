# Handover audit (October 2026)

A full audit of Life OS before handover. Four specialist reviews read the code: security, calculations, persistence and forms. Each one reproduced what it found by running the code. Two crawlers then drove the real app in Chromium. Every confirmed defect was fixed at its cause and pinned by a test. This page records what was found, what changed, how it was proven, and what is still open.

## The application in one paragraph

Life OS is a local-first PWA built from vanilla ES modules with no framework and no build step. It covers about 60 routes and 100 screens and sheets.

- **Storage:** data lives in IndexedDB (`js/data/store.js`, schema version 9, 54 stores). The store keeps an in-memory cache and writes to disk in batches. Each write carries an outbox entry for sync.
- **Rendering:** screens render through an `html` tagged template, which escapes everything by default, and a keyed DOM patch.
- **Events:** delegated handlers (`data-action`, `data-input`, `data-change`, `data-submit`) wire markup to each screen's handlers.
- **Sync (optional):** an end-to-end encrypted sync through the owner's own Cloudflare Worker (`server/worker.js`, D1). The same server can send reminders by Web Push.
- **No accounts:** there are no user accounts. The sync key is the only credential.

## Findings and fixes

Severity uses the brief's scale. "Proof" means the test that now pins the fix.

### Critical and high

| # | What was broken | Why | Fix | Proof |
|---|---|---|---|---|
| 1 | Stored XSS through a quick food's name: a crafted backup or synced record ran script when you opened Log food › Edit. | The name went into markup through `raw()` without escaping. | Built with `html` instead, which escapes. | Unit test (`handover.test.mjs`); the crawler's script payload in every field never ran. |
| 2 | Stored XSS through a habit or goal category in charts. | Categories became CSS colours inside `raw()` chart markup. | `catColor` only accepts known categories; chart colours go through `safeColor`. | Unit tests. |
| 3 | No Content Security Policy, so any injected markup could run inline script. | — | A CSP that allows only this site's own scripts. The theme script moved to `js/theme-boot.js`. | Every suite runs under the CSP. The accessibility suite injects axe, so it opts out. |
| 4 | "Replace" restore with one bad record could wipe stores and leave them empty. | `inspect` accepted any truthy id. A refused record threw part-way and the clears were already committed. | Ids must be strings or numbers. Photos must be image data. A failure aborts the whole transaction, clears included. | Unit tests; `resilience.mjs`. |
| 5 | "Erase everything" on a synced device pushed the default habits over your records on every device. | Sync stayed on through the reset. | Sync is turned off before erasing. | Traced; the sync suite passes. |
| 6 | Sync could lose changes coming from other devices for good when a save failed. | It moved its position on before the writes landed, and adopted records had no rollback. | Sync waits for the writes. Adopted records are tracked like any write and roll back on failure. | `sync.mjs`. |
| 7 | Two screens showed stale data: an insight that ignored new tasks, and the weight trend chart. | Their memo lists left out stores they read. | Lists corrected. Journal entries stay out of insights on purpose, so typing stays fast. | Traced; visual and reflect suites. |
| 8 | Edits in sheets were lost when the sheet closed by Escape or swipe-down, or (on iPhone) when a button was tapped. | The field never lost focus, so its `change` event never fired. | Before a sheet closes, a screen changes or a button acts, the active field saves first. | `journey.mjs`, `workout-notes.mjs`. |
| 9 | Clearing a Top 3 slot deleted the task for good, with its notes, repeat and project. | `setPriority` removed the task. | A bare priority is removed; one with more to it only leaves the Top 3. Either way Undo is offered. | Unit test. |
| 10 | Journal answers were lost when you switched fields quickly. | One debounce timer per entry replaced the earlier pending change. | A shared saver (`js/ui/save-later.js`) collects changes per record and saves on blur and on leaving. Used by the journal and both reviews. | Traced; reflect suite. |
| 11 | On a phone set to comma decimals, number fields were pre-filled ten times too large. Saving measurements without touching them stored ×10. | Locale-formatted numbers ("72,5") were put into `type=number` fields. | `fieldNum()` always writes a dot decimal. | Unit test. |
| 12 | Selects and checkboxes in forms reverted when anything else on the screen redrew. | The patch reset them to the markup's value. | A choice you made is kept until the form saves. Open `<details>` sections stay as you left them. | `workout-notes.mjs`; every suite. |
| 13 | Pausing a habit counted the pause days as misses: runs broke and consistency fell. | Only "due" checks knew about pauses. | Pauses count as rest. Each habit keeps a dated state history (`stateLog`), so past days read the state they had then. | Unit tests. |
| 14 | Changing a habit's state today rewrote past day scores, ghosts and seasons. | Past days read the habit's current state. | Same state history as #13. | Unit test. |

### Medium

| What | Fix |
|---|---|
| Runs for every-N-days habits jumped by half overnight. | Windows anchored to the habit's start. |
| A weekly-target habit's past day changed when you logged later that week, and snapshots went stale. | A day is judged only by the days before it. |
| Limit habits counted future days as kept, and their clean days earned no mastery. | Future days are not kept; days within the limit count. |
| Season and weekly scores counted today as 0 before anything was done. | Today counts once something is done, as in the weekly story. |
| A blocked database upgrade (an old tab still open) showed a "private browsing" error and stayed stuck. | It now says to close the other tab, and carries on by itself once it's closed. |
| Unsaved edits copied for replay were dropped if the replay failed. | They are kept for the next start. |
| The first sync upload could drop changes made while it ran. | Only the outbox entries it covered are cleared. |
| A full device said "Try again". | It now says storage is full. |
| Restore errors always said "your data is unchanged". | The message now matches what actually happened. Restoring with sync on says that newer copies on other devices win. |
| The ritual's weight step saved your last weigh-in as today's. | The last weigh-in is only a hint. |
| ± buttons left the field showing an old number. | They update the field. |
| Ritual answers on the current step were lost when you closed it. | They are saved on close. Skip still leaves them out. |
| Values cleaned up on save (trimmed, refused) kept showing what was typed. | Fields show the saved value once you leave them. |
| Number fields with `step="0.5"` refused 22.3 g of protein or 18.3% body fat. | Set to `step="any"`. |
| Double-tapping could log twice (capture, Make it a task, Save as a workout). | A second tap does nothing while the first is saving. |
| Goal edits could clear a target or keep the wrong direction. | Validated; the direction is recomputed. |
| Malformed or future-dated sync records could stop sync or pin a record. | Checked on the device and on the server. |
| Notification clicks could open any address. | Only pages of this app open. |

### Low

These were fixed:

- **Durations:** "7h 60m" now reads "8h 00m".
- **Units:** weights in the weekly review, insights and records now use your unit.
- **Weight steps:** lb steps no longer drift (100, 105, 110…).
- **Money:** "-$0" no longer appears, and 1.005 rounds to 1.01.
- **CSV export:** cells that would be formulas stay text, line breaks are quoted, and the file starts with a byte-order mark so accents survive in Excel.
- **Dates:** five-digit years are refused.
- **Numbers:** profile numbers are bounded.
- **Labels:** five fields had none; they now do.
- **Length caps:** missing caps were added.
- **Keyboard:** Return saves a task, and the number pad accepts ",".
- **Lists:** dragging in a list with ticked items moved the wrong item.
- **Server:** request size is now measured on chunked uploads too.

## Verification

| Check | Result |
|---|---|
| Lint (`npm run lint`) | Clean |
| Unit tests (`npm run test:unit`) | 186 pass, including 10 new handover tests |
| Browser suites (28, Chromium at iPhone 14 size) | All pass: the 26 before the audit, plus `workout-notes.mjs` and `journey.mjs` |
| Performance budgets (`tests/hardening.mjs`: a year of data, CPU 4× slower) | All pass. Once, at the end of a full parallel run, one journal input took 56 ms (budget 50); it passed on its own twice straight after, so the margin there is thin. |
| Build (`npm run build`) | Precache 1.65 MB (limit 2 MB). First-screen JS 212 KB: over the 200 KB target, within the 240 KB limit |
| Field crawler (every screen, plus every sheet a safe button opens) | See below |
| Layout and accessibility sweep (7 widths, 320–1440 px; axe at 375 px in light and dark) | See below |

`tests/journey.mjs` drives a whole session through the interface and checks the database after each step:

- **Habit:** create one (an empty name is refused; a double tap still makes one), rename it (same record), log it and take it back, leave, return, reload, delete with Undo, then delete for good (its logs go too).
- **Task:** blank refused, double-tap safe, edited, ticked and unticked across a reload.
- **Journal and weight:** a journal entry with accents, emoji and a script tag survives a reload as text; a weigh-in is replaced, not duplicated.
- **Settings:** survive a reload.

**Field crawler.** It visited every screen (46) and every sheet that a non-destructive button opens (81). In each field it typed edge-case text: leading and trailing spaces, accents, a check mark, an emoji, quotes, `&`, and an `<img onerror>` script payload. Number fields got a decimal; date, time and select fields got a valid value. 243 fields in all.

- **Script injection:** the payload never ran anywhere.
- **Page errors:** none.
- **Labels and sizing:** every field has an accessible label, none is narrower than 44 px, and none has text under 16 px (iOS would zoom into it).
- **Persistence:** after a reload, the 60 auto-saving page fields showed what was typed. The 9 that didn't are by design:
  - add fields that clear after adding (task, list item);
  - search boxes;
  - the brain dump's unsent draft;
  - the sync screen's fields, which save on Connect;
  - three values the app rightly cleaned or refused: the word for the year keeps only one word, workout minutes are rounded, and a 12.5 kg starting weight is refused.
- **Crawler mistakes:** 85 interaction failures were the crawler's own. It lost its place after a screen redrew, or a button was covered by the tab bar. Each kind was checked by hand: the New habit field keeps exactly what was typed, and search filters correctly (37 results for "te").

**Layout and accessibility sweep.** 86 routes at 320, 360, 375, 430, 768, 1024 and 1440 px (464 renders), plus axe WCAG 2.1 AA at 375 px in light and dark.

- **Layout:** no sideways overflow, nothing past the right edge, no clipped text, no tap target under 24 px, no broken images and no console errors.
- **Contrast:** one issue, now fixed. The blue "next step" text in gym mode measured 4.47:1 on black; it now uses a lifted blue (`--gym-accent`).
- **Polish from looking at the screens:** Today's date chip on 320 px phones now reads "Fri 9" instead of "Fri,…". Brain dump categories wrap on wide screens instead of scrolling.

## What could not be verified here

- **A real iPhone.** Everything ran in desktop Chromium with iPhone dimensions and touch. Not tested on Safari:
  - its own focus behaviour, which the blur-before-action fix is designed for;
  - comma-decimal number keyboards, where `type=number` may read "72,5" as empty;
  - Home Screen installs;
  - VoiceOver.

  `docs/voiceover-script.md` is the manual check to run on the phone.
- **The live sync server.** The Worker's SQL runs against SQLite in the tests (`tests/support/`), not Cloudflare D1. Push delivery to Apple's servers can't be reached from here.
- **Long-term storage eviction by Safari.** This is outside the app's control. The backup nudge and the Home Screen install are the mitigations.

## Still open (deliberate, or needing the owner)

- **Who can claim the sync server.** The first sync key to reach a freshly deployed Worker becomes its owner. Connect your phone right after deploying. A deploy-time claim secret would close this gap. It needs a field in the sync screen, so it is left for a decision.
- **Same-day edits on two devices.** If two devices change the same day's record (one weigh-in or check-in per day), the newer device's version wins whole. Merging field by field is a design change.
- **Journal habits and insights.** Insights don't recompute while you type in the journal, which keeps typing fast. An insight about a journal habit can lag until other data changes, at most a day.
- **First-screen JavaScript** is 12 KB over its target, though within its limit.
