// Said at once when an update seems to have lost data (data/update-guard.js): what's missing, and
// the way back (the safety copy from before, in You › Data). Loaded only when it's needed.
import * as store from '../data/store.js';
import { remember } from '../data/update-guard.js';
import { app } from '../ui/app-api.js';

const NAMES = { habitLogs: 'habit check-ins', tasks: 'tasks', journalEntries: 'journal entries', workouts: 'workouts', workoutSets: 'workout sets',
  weightEntries: 'weights', sleepEntries: 'nights of sleep', nutritionLogs: 'meals', habits: 'habits', goals: 'goals' };

export async function warnLost(lost) {
  const what = lost[0].store === 'all'
    ? `${lost[0].before - lost[0].now} of ${lost[0].before} entries`
    : lost.slice(0, 3).map((l) => `${l.before} ${NAMES[l.store] || l.store}`).join(', ');
  const look = await app.confirm({
    title: 'Some of your data seems to be missing',
    body: `Since this update, ${what} can’t be found. Nothing more has been changed. The safety copy from before the update is in You › Data › Safety copies, and restoring it brings them back.`,
    confirm: 'See safety copies',
    cancel: 'It’s fine',
  });
  // Answered either way: from now on, the counts follow what's here.
  const m = store.get('meta', 'dataCheck');
  store.put('meta', { ...m, warned: null });
  if (look) app.go('you/data');
  else remember();
}
