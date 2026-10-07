// IndexedDB schema. Every record has `id`, `createdAt` and `updatedAt`.
// Date-keyed records also carry `date` ('YYYY-MM-DD') which is indexed.
export const DB_NAME = 'life-os';
export const DB_VERSION = 2;

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
  tasks: { indexes: ['date'] },              // one-off and repeating to-dos (Week Plan tasks)
};

// Stores kept fully in memory for instant rendering (photoBlobs is not).
export const CACHED = Object.keys(STORES).filter((s) => s !== 'photoBlobs');
