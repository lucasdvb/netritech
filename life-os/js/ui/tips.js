// Explanations behind an ⓘ: which ones are open. Text that explains a screen or a card stays folded
// beside its title; tapping the ⓘ opens it (the shell's "tip" action). Settings › Show explanations
// keeps every one open. Kept tiny so the shell can hold the action without loading components.
import * as store from '../data/store.js';

const open = new Set();
export const tipOpen = (key) => open.has(key) || store.settings().showTips === true;
export function toggleTip(key) {
  if (open.has(key)) open.delete(key); else open.add(key);
}
