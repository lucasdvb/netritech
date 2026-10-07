// Shared handle so views can navigate, open sheets and show toasts without
// importing the shell (filled in by app.js at boot).
export const APP_NAME = 'Life OS';

export const app = {
  go: () => {},
  back: () => {},
  refresh: () => {},
  sheet: () => {},
  closeSheet: () => {},
  toast: () => {},
  confirm: async () => false,
  current: () => null,
  search: () => {},
};
