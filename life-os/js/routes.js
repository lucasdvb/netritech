// The map of Life OS: four places (Today, Plan, Progress, Reflect), the You pages, and where
// every older address now lives. Routes match in order; ':name?' marks an optional segment.
// `list` names the list a detail belongs to, so wide screens can show them side by side.

export const PLACES = [
  { id: 'today', label: 'Today', icon: 'calendar-check', path: 'today', key: '1' },
  { id: 'plan', label: 'Plan', icon: 'map', path: 'plan', key: '2' },
  { id: 'progress', label: 'Progress', icon: 'chart-spline', path: 'progress', key: '3' },
  { id: 'reflect', label: 'Reflect', icon: 'notebook-pen', path: 'reflect', key: '4' },
];

const v = (name) => () => import(`./screens/${name}.js`);

export const ROUTES = [
  { path: 'today/:date?', tab: 'today', depth: 0, load: v('today') },
  { path: 'workout/:id/gym', tab: 'today', depth: 2, load: v('gym') },
  { path: 'workout/:id', tab: 'today', depth: 1, load: v('workout') },

  { path: 'plan', tab: 'plan', depth: 0, load: v('plan-home') },
  { path: 'plan/habits/sort', tab: 'plan', depth: 2, load: v('habit-sort') },
  { path: 'plan/habits/:id', tab: 'plan', depth: 2, load: v('habit'), list: 'plan/habits' },
  { path: 'plan/habits', tab: 'plan', depth: 1, load: v('habits'), list: 'plan/habits', emptyIcon: 'list-checks', emptyText: 'Choose a habit to see its run, its week and its history here.' },
  { path: 'plan/tasks', tab: 'plan', depth: 1, load: v('tasks') },
  { path: 'plan/goals/:id', tab: 'plan', depth: 2, load: v('goal'), list: 'plan/goals' },
  { path: 'plan/goals', tab: 'plan', depth: 1, load: v('goals'), list: 'plan/goals', emptyIcon: 'target', emptyText: 'Choose a goal to see where it’s heading and what feeds it.' },
  { path: 'plan/projects/:id', tab: 'plan', depth: 2, load: v('project'), list: 'plan/projects' },
  { path: 'plan/projects', tab: 'plan', depth: 1, load: v('projects'), list: 'plan/projects', emptyIcon: 'layers', emptyText: 'Choose a project to see its outcome and tasks here.' },
  { path: 'plan/books/:id', tab: 'plan', depth: 2, load: v('book'), list: 'plan/books' },
  { path: 'plan/books', tab: 'plan', depth: 1, load: v('books'), list: 'plan/books', emptyIcon: 'book-open', emptyText: 'Choose a book to see your page, your pace and your notes.' },
  { path: 'plan/training/workouts/:id', tab: 'plan', depth: 2, load: v('template') },
  { path: 'plan/training/exercises/:id', tab: 'plan', depth: 3, load: v('exercise') },
  { path: 'plan/training/exercises', tab: 'plan', depth: 2, load: v('exercises') },
  { path: 'plan/training', tab: 'plan', depth: 1, load: v('training') },
  { path: 'plan/playbook', tab: 'plan', depth: 1, load: v('playbook') },
  { path: 'plan/moodboard', tab: 'plan', depth: 1, load: v('moodboard') },
  { path: 'plan/lists/:id', tab: 'plan', depth: 2, load: v('list'), list: 'plan/lists' },
  { path: 'plan/lists', tab: 'plan', depth: 1, load: v('lists'), list: 'plan/lists', emptyIcon: 'list-checks', emptyText: 'Choose a list to see what’s on it.' },
  { path: 'plan/money/:month?', tab: 'plan', depth: 1, load: v('money') },
  { path: 'plan/dates', tab: 'plan', depth: 1, load: v('dates') },
  { path: 'plan/commitments', tab: 'plan', depth: 1, load: v('commitments') },
  { path: 'plan/rewards', tab: 'plan', depth: 1, load: v('rewards') },

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
  { path: 'progress/trends/:metric?', tab: 'progress', depth: 1, load: v('trends') },
  { path: 'progress/calendar', tab: 'progress', depth: 1, load: v('calendar') },
  { path: 'progress/records', tab: 'progress', depth: 1, load: v('records') },
  { path: 'progress/season', tab: 'progress', depth: 1, load: v('season') },
  { path: 'progress/year/:year?', tab: 'progress', depth: 1, load: v('year') },
  { path: 'progress', tab: 'progress', depth: 0, load: v('progress') },

  { path: 'reflect', tab: 'reflect', depth: 0, load: v('reflect') },
  { path: 'reflect/journal/:id', tab: 'reflect', depth: 2, load: v('journal-entry'), list: 'reflect/journal' },
  { path: 'reflect/journal', tab: 'reflect', depth: 1, load: v('journal'), list: 'reflect/journal', emptyIcon: 'notebook-pen', emptyText: 'Choose an entry to read it, or start today’s.' },
  { path: 'reflect/review/week/:date?', tab: 'reflect', depth: 1, load: v('review-week') },
  { path: 'reflect/review/month/:month?', tab: 'reflect', depth: 1, load: v('review-month') },
  { path: 'reflect/reviews', tab: 'reflect', depth: 1, load: v('reviews') },
  { path: 'reflect/insights', tab: 'reflect', depth: 1, load: v('insights') },

  { path: 'you/settings', tab: 'you', depth: 1, load: v('settings') },
  { path: 'you/data', tab: 'you', depth: 1, load: v('data') },
  { path: 'you/privacy', tab: 'you', depth: 1, load: v('privacy') },
  { path: 'you/sync', tab: 'you', depth: 1, load: v('sync') },
];
