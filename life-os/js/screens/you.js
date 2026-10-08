// You: profile, settings, data and privacy, in a sheet from the profile button on Today
// (or the rail on wider screens). Used rarely, so it doesn't take a place in the tab bar.
import * as store from '../data/store.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { row } from '../ui/components.js';
import { app, APP_NAME } from '../ui/app-api.js';
import { isInstalled } from '../ui/install.js';

const go = (to) => ({ sheet }) => { app.closeSheet(sheet); app.go(to); };

export function openYou() {
  app.sheet({
    title: 'You',
    render: () => {
      const p = store.profile() || {};
      const demo = store.settings()?.demo;
      return html`<div class="you">
        <div class="you-head"><span class="you-avatar" aria-hidden="true">${(p.name || 'Y').slice(0, 1).toUpperCase()}</span>
          <span><span class="you-name">${p.name || 'You'}</span><span class="you-sub">${icon('lock', { size: 13 })} Everything stays on this device.</span></span></div>
        ${demo ? html`<p class="notice notice--warn">${icon('info', { size: 16 })} Sample data is loaded. <button type="button" class="link-btn" data-action="data">Remove it</button></p>` : ''}
        <ul class="list">
          <li>${row({ ic: 'settings', title: 'Settings', sub: 'Profile, targets, reminders, appearance', action: 'settings' })}</li>
          <li>${row({ ic: 'calendar-check', title: 'Reminders in your calendar', sub: 'Alerts that arrive even when Life OS is closed', action: 'calendar' })}</li>
          <li>${row({ ic: 'database', title: 'Data & backup', sub: 'Export, import, safety copies', action: 'data' })}</li>
          <li>${row({ ic: 'shield-check', title: 'Privacy', sub: 'What is stored, and where', action: 'privacy' })}</li>
          ${!isInstalled() ? html`<li>${row({ ic: 'smartphone', title: 'Add to Home Screen', sub: 'Full screen, works offline', action: 'install' })}</li>` : ''}
        </ul>
        <p class="foot-note">${APP_NAME} · local-first · press ? for keyboard shortcuts</p>
      </div>`;
    },
    actions: {
      settings: go('you/settings'),
      data: go('you/data'),
      privacy: go('you/privacy'),
      calendar: async ({ sheet }) => { app.closeSheet(sheet); (await import('./calendar-file.js')).openCalendarFile(); },
      install: async ({ sheet }) => {
        const m = await import('../ui/install.js');
        if (m.canPromptNative()) { await m.promptNative(); return; }
        app.closeSheet(sheet);
        app.sheet({
          title: 'Add to Home Screen',
          render: () => html`<ol class="steps steps--big">
            <li>Open ${APP_NAME} in <strong>Safari</strong>.</li>
            <li>Tap ${icon('share', { size: 16, cls: 'inline-ic' })} <strong>Share</strong>.</li>
            <li>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li></ol>
            <p class="sheet-note">It opens full screen, works offline, and your data stays exactly where it is.</p>`,
        });
      },
    },
  });
}
