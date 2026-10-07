// The map of Life OS: four places (Today, Plan, Progress, Reflect), the You pages, and where
// every older address now lives. Routes match in order; ':name?' marks an optional segment.
// `list` names the list a detail belongs to, so wide screens can show them side by side.

export const PLACES = [
  { id: 'today', label: 'Today', icon: 'sun', path: 'today', key: '1' },
  { id: 'plan', label: 'Plan', icon: 'map', path: 'plan', key: '2' },
  { id: 'progress', label: 'Progress', icon: 'chart-spline', path: 'progress', key: '3' },
  { id: 'reflect', label: 'Reflect', icon: 'notebook-pen', path: 'reflect', key: '4' },
];

const v = (name) => () => import(`./screens/${name}.js`);

export const ROUTES = [
  { path: 'today/:date?', tab: 'today', depth: 0, load: v('today') },
  { path: 'workout/:id', tab: 'today', depth: 1, load: v('workout') },

  { path: 'plan', tab: 'plan', depth: 0, load: v('plan-home') },
  { path: 'plan/habits/sort', tab: 'plan', depth: 2, load: v('habit-sort') },
  { path: 'plan/habits/:id', tab: 'plan', depth: 2, load: v('habit'), list: 'plan/habits' },
  { path: 'plan/habits', tab: 'plan', depth: 1, load: v('habits'), list: 'plan/habits', emptyIcon: 'list-checks', emptyText: 'Choose a habit to see its run, its week and its history here.' },
  { path: 'plan/tasks', tab: 'plan', depth: 1, load: v('tasks') },
  { path: 'plan/goals/:id', tab: 'plan', depth: 2, load: v('goal'), list: 'plan/goals' },
  { path: 'plan/goals', tab: 'plan', depth: 1, load: v('goals'), list: 'plan/goals', emptyIcon: 'target', emptyText: 'Choose a goal to see where it’s heading and what feeds it.' },
  { path: 'plan/training/exercises/:id', tab: 'plan', depth: 3, load: v('exercise') },
  { path: 'plan/training/exercises', tab: 'plan', depth: 2, load: v('exercises') },
  { path: 'plan/training', tab: 'plan', depth: 1, load: v('training') },
  { path: 'plan/playbook', tab: 'plan', depth: 1, load: v('playbook') },

  { path: 'progress/body/weight', tab: 'progress', depth: 2, load: v('weight') },
  { path: 'progress/body/nutrition/:date?', tab: 'progress', depth: 2, load: v('nutrition') },
  { path: 'progress/body/measurements', tab: 'progress', depth: 2, load: v('measurements') },
  { path: 'progress/body/photos', tab: 'progress', depth: 2, load: v('photos') },
  { path: 'progress/body/sleep', tab: 'progress', depth: 2, load: v('sleep') },
  { path: 'progress/body', tab: 'progress', depth: 1, load: v('body') },
  { path: 'progress/areas/mind', tab: 'progress', depth: 1, load: v('mind') },
  { path: 'progress/areas/spirit', tab: 'progress', depth: 1, load: v('faith') },
  { path: 'progress/areas/relationships', tab: 'progress', depth: 1, load: v('relationships') },
  { path: 'progress/areas/work', tab: 'progress', depth: 1, load: v('work') },
  { path: 'progress/areas/:id', tab: 'progress', depth: 1, load: v('area') },
  { path: 'progress/:seg?', tab: 'progress', depth: 0, load: v('progress') },

  { path: 'reflect', tab: 'reflect', depth: 0, load: v('reflect') },
  { path: 'reflect/journal/:id', tab: 'reflect', depth: 2, load: v('journal-entry'), list: 'reflect/journal' },
  { path: 'reflect/journal', tab: 'reflect', depth: 1, load: v('journal'), list: 'reflect/journal', emptyIcon: 'notebook-pen', emptyText: 'Choose an entry to read it, or start today’s.' },
  { path: 'reflect/review/week/:date?', tab: 'reflect', depth: 1, load: v('review-week') },
  { path: 'reflect/review/month/:month?', tab: 'reflect', depth: 1, load: v('review-month') },
  { path: 'reflect/reviews', tab: 'reflect', depth: 1, load: v('reviews') },

  { path: 'you/settings', tab: 'you', depth: 1, load: v('settings') },
  { path: 'you/data', tab: 'you', depth: 1, load: v('data') },
  { path: 'you/privacy', tab: 'you', depth: 1, load: v('privacy') },
];

/** Older addresses (bookmarks, Home Screen shortcuts, links in backups) and their new homes. */
export const REDIRECTS = [
  ['habits/new', 'plan/habits?new=1'],
  ['habits/sort', 'plan/habits/sort'],
  ['habits/:id/edit', 'plan/habits/:id?edit=1'],
  ['plan/habits/:id/edit', 'plan/habits/:id?edit=1'],
  ['habits/:id', 'plan/habits/:id'],
  ['habits', 'plan/habits'],
  ['body/weight', 'progress/body/weight'],
  ['body/nutrition/:date?', 'progress/body/nutrition/:date?'],
  ['body/training', 'plan/training'],
  ['body/workout/:id', 'workout/:id'],
  ['body/exercises', 'plan/training/exercises'],
  ['body/exercise/:id', 'plan/training/exercises/:id'],
  ['body/measurements', 'progress/body/measurements'],
  ['body/photos', 'progress/body/photos'],
  ['body/sleep', 'progress/body/sleep'],
  ['body', 'progress/body'],
  ['more/tasks', 'plan/tasks'],
  ['more/plan', 'plan/playbook'],
  ['more/journal/:id', 'reflect/journal/:id'],
  ['more/journal', 'reflect/journal'],
  ['more/mind', 'progress/areas/mind'],
  ['more/faith', 'progress/areas/spirit'],
  ['more/relationships', 'progress/areas/relationships'],
  ['more/work', 'progress/areas/work'],
  ['more/goals/:id', 'plan/goals/:id'],
  ['more/goals', 'plan/goals'],
  ['more/review/week/:date?', 'reflect/review/week/:date?'],
  ['more/review/month/:month?', 'reflect/review/month/:month?'],
  ['more/reviews', 'reflect/reviews'],
  ['more/settings', 'you/settings'],
  ['more/data', 'you/data'],
  ['more/privacy', 'you/privacy'],
  ['more', 'plan'],
  ['you', 'today?you=1'],
  ['progress/areas', 'progress'],
].map(([path, to]) => ({ path, to }));

/** Fill a redirect target with the matched parameters; optional ones that are missing drop out. */
export function target(to, params) {
  const [p, q] = to.split('?');
  const fill = (seg) => {
    if (!seg.startsWith(':')) return seg;
    const v = params[seg.replace(/^:|\?$/g, '')];
    return v == null || v === '' ? null : encodeURIComponent(v);
  };
  const path = p.split('/').map(fill).filter((s) => s != null).join('/');
  return q ? `${path}?${q}` : path;
}
