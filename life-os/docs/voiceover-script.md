# VoiceOver script

A walk through Life OS with VoiceOver on an iPhone, to run by hand before a release. The automated suite (`tests/a11y.mjs`) already checks every screen, sheet and state against WCAG 2.2 AA, plus the keyboard. This script covers what a machine can't hear: whether what VoiceOver says makes sense, in a sensible order, at the right moment.

**Before you start.** Settings › Accessibility › VoiceOver on (or ask Siri "turn on VoiceOver"). Open Life OS from the Home Screen. Swipe right moves to the next item, swipe left to the previous one, double-tap activates. The rotor (twist two fingers) switches between headings, links and form controls.

Each step lists what you do, then what you should hear. The exact wording of your own data will differ. If something says less than this, says it twice, or says it in the wrong order, note the step number.

## 1. Arriving on Today

| # | Do | Hear |
|---|---|---|
| 1.1 | Open the app | "Life OS" and the greeting, for example "Good morning, Lucas. Heading level 1" |
| 1.2 | Swipe right from the top | "Skip to content, link", then the tab bar: "Today, link", "Plan, link", "Log something, button", "Progress, link", "Reflect, link" |
| 1.3 | Keep swiping | "Thursday, October 8. Choose a day, button", "Day mode: Normal day, button", "Edit Today, button", "You: settings, data and privacy, button" |
| 1.4 | Rotor to Headings, swipe down | Each block's title in order: the greeting, the next action (for example "Morning check-in"), then "Priorities". Nothing is a heading that isn't a title |
| 1.5 | Swipe to the Now card | "0 of 2 planned done. What counts today, button", then the next action's title, its line, "Start, button", "Not now, button" |

## 2. Ticking things off

| # | Do | Hear |
|---|---|---|
| 2.1 | Swipe to a step in the Morning routine, for example "Prayer" | "Prayer, checkbox, not checked" |
| 2.2 | Double-tap | "Checked". A short haptic. Within a moment, the routine's count updates ("Morning 1/6") |
| 2.3 | Double-tap again | "Not checked". Nothing else changes |
| 2.4 | Swipe to "Did it all" and double-tap | "Morning done." is announced once (a status message, with an "Undo" button), and the routine closes up |
| 2.5 | Swipe to the first priority's checkbox | "Priority 1, checkbox, not checked". The field next to it reads "Priority 1, text field, The one that matters most" |
| 2.6 | Swipe to "Move priority 1. Use the arrow keys." | With a keyboard attached, the arrow keys move it. Without one, the order is changed by dragging, or by retyping the three |
| 2.7 | Swipe to a task in "Also today" | "Pipeline follow-ups, checkbox, not checked", then "Pipeline follow-ups, Yesterday, Work, button" opens it |
| 2.8 | Swipe past the tasks | "41 more from earlier days, link" when older ones wait on the Tasks screen |

## 3. Logging with Log something

| # | Do | Hear |
|---|---|---|
| 3.1 | Double-tap "Log something" | The sheet opens and focus moves into it: "Log something, text field" |
| 3.2 | Dictate or type "walked 30 minutes" | Below the field, what it understood is read when you swipe to it, for example "Walk, 30 minutes, today" |
| 3.3 | Double-tap the log button | The sheet closes, focus returns to "Log something", and what was saved is announced, with an Undo button |
| 3.4 | Open it again and type something unclear, for example "20" | It asks which you meant, as buttons, and logs nothing until you choose |

## 4. The number pad and the hold

| # | Do | Hear |
|---|---|---|
| 4.1 | In Pinned actions, double-tap "Steps Add" | The number pad opens with the last value: "Steps", the value, then each key as a button ("1", "2" … "Delete") |
| 4.2 | Enter a number and double-tap "Save" | It closes; the pin now reads the new value |
| 4.3 | On a habit row, double-tap and hold (or open the habit and use its buttons) | Holding logs the tiny version or opens the number pad. Every hold and swipe also has a labelled button in the habit's sheet: "Did the tiny version", "Not today" |

## 5. Closing the day

| # | Do | Hear |
|---|---|---|
| 5.1 | In the evening, double-tap the Now card's "Close the day" | The evening ritual opens: one question per screen, each with "Skip" |
| 5.2 | Reach "Seal the day" | "Seal the day. Press and hold, button" |
| 5.3 | Double-tap and keep your finger down, or simply double-tap | Either way the ring fills for about a second, then "Today is sealed. Rest well." is announced, with Undo. A plain double-tap holds for you, so nothing needs a long press |
| 5.4 | The ceremony plays | Reduce Motion on: a still card. It ends by itself or with a double-tap; focus comes back to Today |

## 6. Moving around

| # | Do | Hear |
|---|---|---|
| 6.1 | Double-tap "Plan" in the tab bar | "Plan, heading level 1". Focus is on the title, so the next swipe reads the first block |
| 6.2 | Double-tap "Habits", then a habit | Its name as "heading level 1", then its run ("12-day run" or "Don't miss twice"), its week and its history, each block with a heading |
| 6.3 | Double-tap "Back to Habits" (top left) | Back on the list, at the habit you came from |
| 6.4 | Progress › Calendar, swipe through the month | Each day reads in full: "Thursday, October 1, 82%, workout, journal", days to come are dimmed buttons |
| 6.5 | Reflect, swipe to the writing field | "Today's reflection, text field". What you type is kept as you go; leaving the screen saves it |

## 7. Settings that matter for VoiceOver

| # | Do | Hear |
|---|---|---|
| 7.1 | iOS Settings › Accessibility › Display & Text Size › Larger Text, at the largest standard size | Life OS follows it. Every screen still reads in the same order; nothing is cut off or hidden behind the tab bar |
| 7.2 | Reduce Motion on (iOS setting) | Screen changes cross-fade; moments appear without the light passing over; ceremonies show a still card |
| 7.3 | Sound and haptics | Ticks and haptics are extras. Every result is also spoken or shown |

## What to report

For each step that fails, the step number, what you heard, and what you expected. "Said twice", "said nothing", "focus jumped to the top" and "I couldn't reach it" are the four that matter most.
