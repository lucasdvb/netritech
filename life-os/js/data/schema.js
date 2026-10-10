// IndexedDB schema. Every record carries an envelope: `id`, `createdAt`, `updatedAt` and `rev`
// (+1 per write). Deleted records stay on disk as tombstones (`deletedAt`, no payload) so a
// future sync can learn about deletions. Date-keyed records also carry `date` ('YYYY-MM-DD',
// indexed) and `tz`, the time zone they were first written in.
export const DB_NAME = 'life-os';
export const DB_VERSION = 10;
// Version of the built-in habit system (the seed); seed.js brings older installs up to date.
export const SEED_VERSION = 2;
/** The newest migration (data/migrations.js). Start-up loads migrations only when it isn't applied. */
export const LATEST_MIGRATION = '2026-10-mobility-workout';

export const STORES = {
  meta: { indexes: [] },                     // schema/seed bookkeeping
  profile: { indexes: [] },                  // UserProfile (single record 'me')
  settings: { indexes: [] },                 // Settings (single record 'app')
  goals: { indexes: ['status'] },
  habits: { indexes: ['section', 'priority'] },
  habitLogs: { indexes: ['date', 'habitId'] },        // HabitLogs + HabitCompletions (completed flag)
  workouts: { indexes: ['date'] },
  workoutSets: { indexes: ['workoutId', 'exerciseId', 'date'] },
  exercises: { indexes: ['category'] },
  templates: { indexes: [] },                // workout templates
  foods: { indexes: [] },                    // quick-add food presets
  nutritionLogs: { indexes: ['date'] },
  waterLogs: { indexes: ['date'] },
  stepLogs: { indexes: ['date'] },
  weightEntries: { indexes: ['date'] },
  measurements: { indexes: ['date'] },
  bodyFatEstimates: { indexes: ['date'] },
  photos: { indexes: ['date'] },             // metadata only
  photoBlobs: { indexes: [] },               // image data, loaded on demand
  sleepEntries: { indexes: ['date'] },
  moodEntries: { indexes: ['date'] },
  journalEntries: { indexes: ['date'] },
  readingSessions: { indexes: ['date'] },
  learningSessions: { indexes: ['date'] },
  meditationSessions: { indexes: ['date'] },
  spiritualSessions: { indexes: ['date'] },
  relationshipEntries: { indexes: ['date'] },
  dailyReviews: { indexes: ['date'] },       // per-day: mode, top 3, shutdown, win, counters
  weeklyReviews: { indexes: [] },
  monthlyReviews: { indexes: [] },
  reminderLog: { indexes: ['date'] },
  tasks: { indexes: ['date'] },              // one-off and repeating to-dos; the day's Top 3 carry a rank
  routines: { indexes: [] },                 // habits linked into a sequence with a window of time
  routineRuns: { indexes: ['date'] },        // per routine per day: plain steps done, when it was finished
  projects: { indexes: ['status'] },         // flat projects: an outcome and its tasks (tasks carry projectId)
  books: { indexes: ['status'] },            // books you're reading, want to read or finished; sessions carry bookId
  seasons: { indexes: [] },                  // six-week seasons: name, intention, three habits, a frozen summary at the end
  records: { indexes: [] },                  // personal records already marked (each one once), derived from real data
  levelEvents: { indexes: [] },              // the day each habit reached each mastery level, engraved once
  rewards: { indexes: ['status'] },          // rewards you set, unlocked only by real counts
  commitments: { indexes: ['status'] },      // pledges (7, 14, 30 days or your own length) with your own stake
  quests: { indexes: [] },                   // one optional side quest a week (id = the week's Monday)
  lists: { indexes: [] },                    // simple checklists (groceries, packing): a name and its items
  expenses: { indexes: ['date'] },           // money spent: amount, category, note
  events: { indexes: [] },                   // dates that matter: birthdays, anniversaries, countdowns
  urges: { indexes: ['date'] },              // urges resisted or given in to, for habits you're cutting down or quitting
  experiments: { indexes: [] },              // "try it for 14 days": a habit, what to watch, and the verdict at the end
  yearlyReviews: { indexes: [] },            // the year in review (id = the year) and the theme word for the next one
  notes: { indexes: [] },                    // brain dump: a note's text, its category ('' is Unsorted) and a pin
  energyLogs: { indexes: ['date'] },         // energy check-ins (1–5) at a time of day, for your peak hours
  calendarEvents: { indexes: ['date'] },     // busy times from your own calendar (subscribed or imported), this device only
  recipes: { indexes: [] },                  // meals you cook: ingredients (for the grocery list) and protein per serving
  mealPlan: { indexes: ['date'] },           // a meal planned on a date (id = date:slot)
  bills: { indexes: [] },                    // bills, subscriptions and renewals: amount, how often, next due
  accounts: { indexes: [] },                 // what you own and owe, for net worth
  balances: { indexes: ['date'] },           // an account's balance on a date (net worth snapshots)
  savingsGoals: { indexes: [] },             // a target, a date and what's put aside so far
  supplements: { indexes: [] },              // supplements and medication: dose, times, stock and when to reorder
  supplementLogs: { indexes: ['date'] },     // a dose taken (id = date:supplement:time)
  trips: { indexes: [] },                    // trips: dates, where, the travel plan and packing list
  takeaways: { indexes: [] },                // ideas worth keeping (from books, notes, reviews), brought back spaced
  decisions: { indexes: [] },                // the decision journal: what, why, expected, and the review three months on
  wheelChecks: { indexes: [] },              // the quarterly life wheel (id = the quarter): a score per area
  daySnapshots: { indexes: [] },             // derived per-day summary (id = date), rebuilt from the logs
  outbox: { indexes: [] },                   // latest change per record ('store:id'), for a future sync
  localBackups: { indexes: [] },             // automatic copies taken before data migrations (last three)
};

// Stores kept fully in memory for instant rendering. Photo data, the outbox and the
// safety backups are only ever read on demand.
const UNCACHED = new Set(['photoBlobs', 'outbox', 'localBackups']);
export const CACHED = Object.keys(STORES).filter((s) => !UNCACHED.has(s));

// Stores that describe this device rather than your life: never synced. Of these, only meta
// goes into backups, because it records which migrations the data has already had.
export const LOCAL_ONLY = new Set(['meta', 'daySnapshots', 'reminderLog', 'outbox', 'localBackups', 'calendarEvents']);

// Derived stores: rebuilt from other data, so their writes don't count as changes to your day.
export const DERIVED = new Set(['daySnapshots']);
// Loaded in two steps when the app opens on Today: the recent weeks first (by their date index),
// or nothing at all for stores Today never reads, and the rest just after.
export const DEFERRED = new Set(['workoutSets', 'daySnapshots']);

// What a backup file holds: everything you entered (photo data is optional and handled apart).
export const BACKUP_STORES = Object.keys(STORES).filter((s) => s !== 'photoBlobs' && (!LOCAL_ONLY.has(s) || s === 'meta'));
