// "Add to your calendar" (U6): choose what to be reminded about, then one file adds them all to
// Apple Calendar (or any calendar) with an alert at each time. Nothing leaves the phone: the file is
// made here and handed straight to your calendar.
import * as store from '../data/store.js';
import { buildCalendar, reminderOptions } from '../domain/ics.js';
import { html } from '../ui/dom.js';
import { toggle } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const base = () => `${location.origin}${location.pathname}`;

export function openCalendarFile() {
  const opts = reminderOptions(base());
  const saved = store.settings()?.calendarPicks || {};
  const ui = { on: Object.fromEntries(opts.map((o) => [o.key, saved[o.key] ?? o.on])) };
  app.sheet({
    title: 'Reminders in your calendar',
    ui,
    render: (s) => html`<div class="form cal-file">
      <p class="sheet-note">Your calendar reminds you, even when Life OS is closed, and each alert opens the right page. Nothing is sent anywhere.</p>
      <ul class="set-list">${opts.map((o) => html`<li class="set-row" data-key="cf-${o.key}"><span class="set-text"><span class="set-label">${o.label}</span><span class="set-hint">${o.hint}</span></span>
        <span class="set-ctl">${toggle(s.ui.on[o.key], { action: 'cf-toggle', data: { k: o.key }, label: o.label })}</span></li>`)}</ul>
      <button type="button" class="btn btn--primary btn--block" data-action="cf-add">Add ${Object.values(s.ui.on).filter(Boolean).length} to Calendar</button>
      <p class="field-hint">On iPhone, tap <b>Add All</b> when Calendar opens. Changed a time later? Add the file again and delete the older Life OS events if any appear twice.</p>
    </div>`,
    actions: {
      'cf-toggle': ({ data, sheet }) => { sheet.ui.on[data.k] = !sheet.ui.on[data.k]; hap.tap(); sheet.refresh(); },
      'cf-add': ({ sheet }) => {
        const picked = opts.filter((o) => sheet.ui.on[o.key]);
        if (!picked.length) { app.toast('Choose at least one reminder.'); return; }
        const ics = buildCalendar(picked.map((o) => o.event));
        const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
        const a = Object.assign(document.createElement('a'), { href: url, download: 'life-os-reminders.ics' });
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        store.setSettings({ calendarPicks: sheet.ui.on, calendarAddedAt: new Date().toISOString() });
        hap.success();
        app.closeSheet(sheet);
        app.toast(`${picked.length} reminder${picked.length === 1 ? '' : 's'} ready for your calendar`, { icon: 'calendar-check' });
      },
    },
  });
}
