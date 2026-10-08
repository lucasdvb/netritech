// IndexedDB schema. Every record carries an envelope: `id`, `createdAt`, `updatedAt` and `rev`
// (+1 per write). Deleted records stay on disk as tombstones (`deletedAt`, no payload) so a
// future sync can learn about deletions. Date-keyed records also carry `date` ('YYYY-MM-DD',
// indexed) and `tz`, the time zone they were first written in.
export const DB_NAME = 'life-os';
export const DB_VERSION = 4;
// Version of the built-in habit system (the seed); seed.js brings older installs up to date.
export const SEED_VERSION = 2;
/** The newest migration (data/migrations.js). Start-up loads migrations only when it isn't applied. */
export const LATEST_MIGRATION = '2026-10-backups';

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
export const LOCAL_ONLY = new Set(['meta', 'daySnapshots', 'reminderLog', 'outbox', 'localBackups']);

// Derived stores: rebuilt from other data, so their writes don't count as changes to your day.
export const DERIVED = new Set(['daySnapshots']);

// What a backup file holds: everything you entered (photo data is optional and handled apart).
export const BACKUP_STORES = Object.keys(STORES).filter((s) => s !== 'photoBlobs' && (!LOCAL_ONLY.has(s) || s === 'meta'));
