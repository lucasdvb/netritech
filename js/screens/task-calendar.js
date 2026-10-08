// Put a task in your calendar (13c): a day, a time and a length, with an alert, made here and handed
// to the phone's calendar like the reminders file. A plan with a date and a time gets done far more
// often than one with a date alone (Milkman et al. 2011).
import * as store from '../data/store.js';
import * as T from '../domain/tasks.js';
import { buildCalendar } from '../domain/ics.js';
import { today, dayInline, parseHM, fmtHM, minutesOfDay } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { handToCalendar } from './calendar-file.js';

export const LENGTHS = [15, 30, 60, 90];
export const ALERTS = [[0, 'At the start'], [10, '10 min before'], [30, '30 min before']];

/** The next half hour from now, as HH:MM (a sensible first time to offer). */
export function nextSlot(now = new Date()) {
  const m = Math.ceil((minutesOfDay(now) + 1) / 30) * 30;
  return fmtHM(Math.min(m, 23 * 60 + 30));
}

/** The calendar event for a task booked at a day and time. */
export function taskEvent(t, { date, time, minutes, alarm }, base = `${location.origin}${location.pathname}`) {
  return {
    uid: `lifeos-task-${t.id}-${date.replace(/-/g, '')}${time.replace(':', '')}@life-os`,
    title: t.title, time, start: date, minutes, alarm,
    note: t.notes || '', url: `${base}#/plan/tasks`,
  };
}

/** A short line for a booked task: "Thu 8 Oct at 14:00 · 30 min". */
export const bookedLabel = (c) => (c ? `${dayInline(c.date)} at ${c.time} · ${c.minutes} min` : '');

export function openTaskCalendar(id, { onDone } = {}) {
  const t = T.task(id);
  if (!t) return;
  const prev = t.calendar || {};
  app.sheet({
    title: 'Put it in your calendar',
    ui: { date: prev.date || (t.date && t.date >= today() ? t.date : today()), time: prev.time || nextSlot(), minutes: prev.minutes || 30, alarm: prev.alarm ?? 10 },
    render: (s) => {
      const u = s.ui;
      return html`<div class="form task-cal">
        <p class="sheet-note"><b>${t.title}</b>. A day and a time make it far more likely to happen than a date alone.</p>
        <div class="grid-2">
          <label class="field"><span class="field-label">Day</span><input class="input" type="date" min="${today()}" value="${u.date}" data-change="tc-date"></label>
          <label class="field"><span class="field-label">Time</span><input class="input" type="time" value="${u.time}" data-change="tc-time"></label>
        </div>
        <div class="field"><span class="field-label">How long</span>
          <div class="chips" role="group" aria-label="How long">${LENGTHS.map((m) => html`<button type="button" class="${cx('chip', u.minutes === m && 'is-active')}" aria-pressed="${u.minutes === m}" data-action="tc-len" data-v="${m}">${m < 60 ? `${m} min` : m === 60 ? '1 hour' : '1½ hours'}</button>`)}</div></div>
        <div class="field"><span class="field-label">Alert</span>
          <div class="chips" role="group" aria-label="Alert">${ALERTS.map(([m, l]) => html`<button type="button" class="${cx('chip', u.alarm === m && 'is-active')}" aria-pressed="${u.alarm === m}" data-action="tc-alarm" data-v="${m}">${l}</button>`)}</div></div>
        <button type="button" class="btn btn--primary btn--block" data-action="tc-add">Add to Calendar</button>
        <p class="field-hint">On iPhone, Calendar opens: tap <b>Add</b>. The file is made on this device and goes straight to your calendar.${prev.date ? ' Booked before? Delete the older event in Calendar.' : ''}</p>
      </div>`;
    },
    inputs: {
      'tc-date': ({ sheet, value }) => { if (value) sheet.ui.date = value; },
      'tc-time': ({ sheet, value }) => { if (parseHM(value) != null) sheet.ui.time = value; },
    },
    actions: {
      'tc-len': ({ sheet, data }) => { sheet.ui.minutes = Number(data.v); hap.tap(); sheet.refresh(); },
      'tc-alarm': ({ sheet, data }) => { sheet.ui.alarm = Number(data.v); hap.tap(); sheet.refresh(); },
      'tc-add': ({ sheet }) => {
        const u = sheet.ui;
        const booking = { date: u.date, time: u.time, minutes: u.minutes, alarm: u.alarm };
        handToCalendar(buildCalendar([taskEvent(t, booking)], { name: 'Life OS tasks' }), `${t.title.replace(/[^\w -]+/g, '').trim().slice(0, 40) || 'task'}.ics`);
        // The task moves to the booked day, so Today and the calendar agree.
        store.put('tasks', { ...T.task(id), date: u.date, calendar: booking });
        hap.success();
        app.closeSheet(sheet);
        app.toast(`In your calendar · ${bookedLabel(booking)}`, { icon: 'calendar-check' });
        onDone?.();
      },
    },
  });
}
