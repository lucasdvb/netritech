import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';

const POINTS = [
  ['smartphone', 'On this device', 'Everything you enter is stored in this browser’s private storage (IndexedDB) on this device. There is no account and no server.'],
  ['wifi-off', 'Works offline', 'After the first visit the whole app is cached on your phone. It makes no network requests to show or save your data.'],
  ['eye-off', 'No tracking', 'No analytics, no advertising, no third-party scripts, no fonts or icons loaded from other sites.'],
  ['lock', 'Journal and photos stay put', 'Journal entries and progress photos are never uploaded. Photos are left out of backups unless you choose to include them.'],
  ['hard-drive-download', 'You hold the backups', 'A backup is a file you save yourself. Restoring always shows what’s inside and asks before changing anything.'],
  ['shield-check', 'Not medical advice', 'Life OS tracks habits and shows trends. Body-fat and maintenance-calorie figures are estimates. Eye care, jaw alignment and anything persistent belong with a professional.'],
];

export default {
  id: 'privacy',
  title: 'Privacy',
  render() {
    return html`
      ${pageHead({ title: 'Privacy', back: { to: 'more', label: 'More' } })}
      <p class="lead">A personal system holds personal things. Here’s exactly where they go: nowhere.</p>
      <ul class="privacy-list">${POINTS.map(([ic, t, b]) => html`<li><span class="row-ic" style="--ic:var(--accent)">${icon(ic, { size: 18 })}</span><div><p class="card-title">${t}</p><p class="muted">${b}</p></div></li>`)}</ul>
      <p class="fine-print">If you clear Safari’s website data for this site, your Life OS data is deleted with it. Keep a recent backup.</p>`;
  },
};
