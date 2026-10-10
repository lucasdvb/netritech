// Older addresses (bookmarks, Home Screen shortcuts, links in backups) and their new homes.
// Loaded only when an address looks old, so start-up doesn't carry it.

/** Paths worth checking against the table below. */
export const LEGACY = /^(habits|body|more)(\/|$)|^you$|^progress$|^reflect$|^progress\/(areas|overview|insights)$|^plan\/habits\/[^/]+\/edit$/;

export const REDIRECTS = [
  // Progress and Reflect became one place, Review (October 2026).
  ['progress', 'review'],
  ['reflect', 'review'],
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
  ['progress/areas', 'review'],
  ['progress/overview', 'progress/trends'],
  ['progress/insights', 'reflect/insights'],
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
