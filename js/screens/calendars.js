// Plan › Your calendar: add your own calendar (a subscription link, or a file you export) so its
// events show in Your day as busy time, count in the morning briefing, and are left out of the free
// time tasks can go into. Events stay on this device and refresh when the app opens.
import * as store from '../data/store.js';
import * as ICS from '../domain/ics-import.js';
import { today, addDays, fmtDayShort, relativeDay } from '../domain/dates.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const ago = (iso) => {
  if (!iso) return 'never';
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  return m < 2 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`;
};

function addSheet() {
  app.sheet({
    title: 'Add your calendar',
    ui: { name: '', url: '', busy: false },
    render: (s) => html`<form class="form" data-submit="cal-save">
      <label class="field"><span class="field-label">Name</span><input class="input" name="name" maxlength="40" placeholder="Work, Family…" value="${s.ui.name}" data-input="cal-f" data-f="name"></label>
      <label class="field"><span class="field-label">Calendar link</span><input class="input" name="url" inputmode="url" autocomplete="off" placeholder="webcal://… or https://….ics" value="${s.ui.url}" data-input="cal-f" data-f="url" required></label>
      <details class="steps-more"><summary>Where do I find the link?</summary>
        <ol class="steps">
          <li><strong>iPhone / iCloud:</strong> Calendar app › Calendars › ⓘ next to a calendar › Public Calendar on › Share Link.</li>
          <li><strong>Google:</strong> calendar.google.com › Settings › your calendar › <em>Secret address in iCal format</em>.</li>
          <li><strong>Outlook:</strong> Settings › Calendar › Shared calendars › Publish a calendar › ICS link.</li>
        </ol>
        <p class="sheet-note">Most calendars only let your own sync server read them (You › Sync). Without it, export a file instead and import it below.</p></details>
      <button type="submit" class="btn btn--primary btn--block" ${s.ui.busy ? 'disabled' : ''}>${s.ui.busy ? 'Reading…' : 'Add calendar'}</button>
      <label class="btn btn--soft btn--block file-btn">${icon('upload', { size: 18 })} Or import a calendar file (.ics)<input type="file" accept=".ics,text/calendar" class="sr-only" data-change="cal-file"></label>
    </form>`,
    inputs: {
      'cal-f': ({ el, value, sheet }) => { sheet.ui[el.dataset.f] = value; },
      'cal-file': async ({ el, sheet }) => {
        const f = el.files?.[0];
        if (!f) return;
        try {
          const text = await f.text();
          const rec = await ICS.addCalendar({ name: sheet.ui.name || f.name.replace(/\.ics$/i, ''), text });
          hap.success();
          app.closeSheet(sheet);
          app.toast(`${rec.name}: ${rec.count} events in the next two months`, { icon: 'check' });
        } catch (err) { app.toast(String(err.message || err), { tone: 'danger' }); }
      },
    },
    actions: {
      'cal-save': async ({ sheet }) => {
        if (sheet.ui.busy) return;
        sheet.ui.busy = true;
        sheet.refresh();
        try {
          const rec = await ICS.addCalendar({ name: sheet.ui.name, url: sheet.ui.url });
          hap.success();
          app.closeSheet(sheet);
          app.toast(`${rec.name}: ${rec.count} events in the next two months`, { icon: 'check' });
        } catch (err) {
          sheet.ui.busy = false;
          sheet.refresh();
          app.toast(String(err.message || err), { tone: 'danger', duration: 7000 });
        }
      },
    },
  });
}

export default {
  id: 'calendars',
  title: 'Your calendar',
  render() {
    const cals = ICS.calendars();
    const days = Array.from({ length: 7 }, (_, i) => addDays(today(), i)).map((d) => ({ d, ev: ICS.on(d) })).filter((x) => x.ev.length);
    return html`
      ${pageHead({ title: 'Your calendar', back: { to: 'plan', label: 'Plan' }, info: 'Your own calendar’s events show in Your day as busy time, count in the morning briefing, and are left out of the free time a task can go into. They stay on this device; each device reads the calendar itself, refreshing when the app opens (at most every three hours).',
        actions: html`<button type="button" class="btn btn--soft btn--sm" data-action="cal-add">${icon('plus', { size: 16 })} Add</button>` })}
      ${cals.length ? html`<ul class="list" data-key="cals">${cals.map((c) => html`<li data-key="cal-${c.id}"><div class="row cal-row">
          <span class="row-ic">${icon('calendar', { size: 18 })}</span>
          <span class="row-main"><span class="row-title">${c.name}</span>
            <span class="row-sub">${c.error ? html`<span class="text-danger">${c.error}</span>` : `${c.count} events · ${c.url ? `updated ${ago(c.at)}` : 'imported file'}`}</span></span>
          <span class="row-right">${c.url ? html`<button type="button" class="icon-btn icon-btn--sm" data-action="cal-refresh" data-id="${c.id}" aria-label="Refresh ${c.name}">${icon('refresh-cw', { size: 16 })}</button>` : ''}
            <button type="button" class="icon-btn icon-btn--sm" data-action="cal-remove" data-id="${c.id}" aria-label="Remove ${c.name}">${icon('trash-2', { size: 16 })}</button></span>
        </div></li>`)}</ul>`
        : empty({ ic: 'calendar', title: 'Bring your calendar in', body: 'Meetings and plans from iPhone, Google or Outlook show in Your day, so the free time it shows is real.', cta: 'Add your calendar', action: 'cal-add' })}
      ${days.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">The next seven days</h2></div>
        <ul class="list">${days.map(({ d, ev }) => html`<li data-key="cd-${d}"><div class="row row--static"><span class="row-main"><span class="row-title">${relativeDay(d) || fmtDayShort(d)}</span>
          <span class="row-sub">${ev.map((e) => (e.allDay ? e.title : `${e.start}–${e.end} ${e.title}`)).join(' · ')}</span></span></div></li>`)}</ul></section>` : ''}`;
  },
  actions: {
    'cal-add': () => addSheet(),
    'cal-refresh': async ({ data }) => {
      const c = ICS.calendars().find((x) => x.id === data.id);
      if (!c) return;
      app.toast('Refreshing…');
      try { const rec = await ICS.addCalendar({ name: c.name, url: c.url }); app.toast(`${rec.name}: ${rec.count} events`, { icon: 'check' }); }
      catch (err) { app.toast(String(err.message || err), { tone: 'danger' }); }
    },
    'cal-remove': ({ data }) => {
      const c = ICS.calendars().find((x) => x.id === data.id);
      if (!c) return;
      const kept = store.all('calendarEvents').filter((e) => e.source === c.id);
      ICS.removeCalendar(c.id);
      hap.tap();
      app.toast(`${c.name} removed`, { action: { label: 'Undo', fn: () => { ICS.save(c.id, kept); store.setSettings({ calendars: [...ICS.calendars(), c] }); } } });
    },
  },
};
