// Quick amounts on the number pad, each prefilled with your last value and undoable: weight,
// steps and any habit that counts something. The detailed forms stay one link away.
import * as store from '../data/store.js';
import * as H from '../domain/habits.js';
import { today, addDays } from '../domain/dates.js';
import { app } from '../ui/app-api.js';
import { html } from '../ui/dom.js';
import * as hap from '../ui/haptics.js';
import { openNumpad } from '../ui/numpad.js';
import { num, kgIn, kgOut, weightUnit } from '../ui/format.js';

/** Put records back exactly as they were (or remove them if they were new). */
const restore = (list) => store.batch(list.map(({ s, id, value }) => (value ? { store: s, value } : { store: s, delete: id })));
const snap = (s, id) => ({ s, id, value: store.get(s, id) || null });
const latest = (s, before) => store.all(s).filter((r) => r.date <= before).reduce((a, b) => (!a || b.date > a.date ? b : a), null);

export function weightPad(date = today()) {
  const cur = store.get('weightEntries', date);
  const last = cur || latest('weightEntries', date);
  const unit = weightUnit();
  openNumpad({
    title: cur ? 'Edit weight' : 'Log weight', unit, decimals: 1, step: 0.1,
    value: last ? Math.round(kgOut(last.kg) * 10) / 10 : null,
    min: unit === 'lb' ? 45 : 20, max: unit === 'lb' ? 880 : 400,
    hint: last && !cur ? `Last: ${num(kgOut(last.kg), 1)} ${unit}${last.date === addDays(date, -1) ? ' yesterday' : ''}. After the bathroom, before food.` : 'After the bathroom, before food or drink.',
    more: { label: 'Date or note', run: async () => (await import('./sheets.js')).openWeight(date) },
    onSave: (v) => {
      const before = [snap('weightEntries', date)];
      store.put('weightEntries', { ...(cur || {}), id: date, date, kg: Math.round(kgIn(v) * 100) / 100 });
      hap.success();
      app.toast(`Weight · ${num(v, 1)} ${unit}`, { icon: 'check', action: { label: 'Undo', fn: () => restore(before) } });
    },
  });
}

export function stepsPad(date = today()) {
  const cur = store.get('stepLogs', date);
  const last = cur || latest('stepLogs', date);
  openNumpad({
    title: 'Steps', unit: 'steps', step: 500, min: 0, max: 100000,
    value: cur?.steps ?? null,
    hint: cur ? 'Today’s total from your phone or watch.' : last ? `Last logged: ${num(last.steps)} steps. Enter today’s total.` : 'Today’s total from your phone or watch.',
    quick: last && !cur ? [{ label: `Same as last (${num(last.steps)})`, value: last.steps }] : [],
    onSave: (v) => {
      const before = [snap('stepLogs', date)];
      store.put('stepLogs', { ...(cur || {}), id: date, date, steps: Math.round(v) });
      hap.success();
      app.toast(`Steps · ${num(v)}`, { icon: 'check', action: { label: 'Undo', fn: () => restore(before) } });
    },
  });
}

/** The last number logged for a habit before a date (for the pad's starting value). */
function lastValue(h, date) {
  for (let i = 1; i <= 60; i++) {
    const v = H.log(h.id, addDays(date, -i))?.value;
    if (v != null) return v;
  }
  return null;
}

export function habitPad(h, date = today(), { onDone } = {}) {
  const v = H.value(h, date);
  const prev = v ?? lastValue(h, date);
  openNumpad({
    title: h.name, unit: h.unit || '', step: h.step || 1, min: 0, max: 100000, decimals: h.type === 'duration' && h.unit === 'h' ? 1 : 0,
    value: prev,
    hint: v == null && prev != null ? `Last time: ${num(prev)} ${h.unit || ''}. Change it or save.` : null,
    quick: H.tinyOf(h)?.min != null ? [{ label: `Tiny · ${num(H.tinyOf(h).min)} ${h.unit || ''}`, value: H.tinyOf(h).min }] : [],
    more: { label: 'More options', run: async () => (await import('./sheets.js')).openHabit(h.id, date) },
    onSave: (n) => {
      const before = [snap('habitLogs', H.logId(h.id, date))];
      H.setValue(h, date, n);
      onDone?.();
      hap.success();
      app.toast(`${h.name} · ${num(n)} ${h.unit || ''}`.trim(), { icon: 'check', action: { label: 'Undo', fn: () => { restore(before); onDone?.(); } } });
    },
  });
}

/**
 * "Not today", with Undo that puts the day's log back exactly. A habit with a why or a backup plan
 * (H10, H6) shows them first: the moment you'd skip is the moment they're for.
 */
export function notToday(h, date = today(), { onDone, direct = false } = {}) {
  if (!direct && (h.why || h.backup?.then)) return beforeSkip(h, date, { onDone });
  const before = [snap('habitLogs', H.logId(h.id, date))];
  H.setSkip(h, date, true);
  onDone?.();
  hap.commit();
  app.toast(`${h.name}: not today`, { action: { label: 'Undo', fn: () => { restore(before); onDone?.(); } } });
}

/** Times a habit counted this month, up to a date ("you showed up as that person 9 times"). */
function shownUp(h, date) {
  let n = 0;
  for (let d = `${date.slice(0, 7)}-01`; d <= date; d = addDays(d, 1)) if (H.counts(h, d)) n++;
  return n;
}

function beforeSkip(h, date, { onDone } = {}) {
  const n = shownUp(h, date);
  app.sheet({
    title: h.name,
    render: () => html`<div class="form skip-sheet">
      ${h.why ? html`<blockquote class="why-line">${h.why}</blockquote>
        <p class="why-count">${n ? `You showed up as that person ${n} time${n === 1 ? '' : 's'} this month.` : 'Today could be the first time this month.'}</p>` : ''}
      ${h.backup?.then ? html`<div class="backup-card">
        <p class="backup-if">${h.backup.when ? `If ${h.backup.when.replace(/^if\s+/i, '')}` : 'Backup plan'}</p>
        <p class="backup-then">${h.backup.then}</p>
        <button type="button" class="btn btn--primary btn--block" data-action="do-backup">Do the backup</button>
      </div>` : ''}
      <button type="button" class="btn btn--ghost btn--block" data-action="skip-anyway">Not today</button>
    </div>`,
    actions: {
      'do-backup': ({ sheet }) => {
        const before = [snap('habitLogs', H.logId(h.id, date))];
        H.setLog(h, date, H.isNumeric(h) ? { completed: true, backup: true, note: h.backup.then } : { value: 1, backup: true, note: h.backup.then });
        onDone?.();
        app.closeSheet(sheet);
        hap.success();
        app.toast(`${h.name}: backup done. It counts.`, { icon: 'check', action: { label: 'Undo', fn: () => { restore(before); onDone?.(); } } });
      },
      'skip-anyway': ({ sheet }) => { app.closeSheet(sheet); notToday(h, date, { onDone, direct: true }); },
    },
  });
}

/** The tiny version in one hold, with Undo. */
export function logTiny(h, date = today(), { onDone } = {}) {
  const before = [snap('habitLogs', H.logId(h.id, date))];
  H.setTiny(h, date, true);
  onDone?.();
  hap.success();
  const t = H.tinyOf(h);
  app.toast(`${h.name}: tiny version${t?.label ? ` · ${t.label}` : ''}. It counts.`, { action: { label: 'Undo', fn: () => { restore(before); onDone?.(); } } });
}
