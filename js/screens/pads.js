// Quick amounts on the number pad, each prefilled with your last value and undoable: weight,
// steps and any habit that counts something. The detailed forms stay one link away.
import * as store from '../data/store.js';
import * as H from '../domain/habits-more.js';
import { today, addDays } from '../domain/dates.js';
import { app } from '../ui/app-api.js';
import { html } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
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
 * "Not today", with Undo that puts the day's log back exactly. It asks, optionally, what got in the
 * way, and answers with the help that fits: a sick day, the backup plan, the tiny version now, a
 * stronger cue, or your why. The week's reserve is spent first, so a planned skip keeps the run.
 */
export function notToday(h, date = today(), { onDone, direct = false } = {}) {
  if (direct) return skip(h, date, { onDone });
  return skipSheet(h, date, { onDone });
}

/** Skip now; returns the toast it showed. */
function skip(h, date, { onDone, reason } = {}) {
  const before = [snap('habitLogs', H.logId(h.id, date))];
  const { reserve } = H.skipToday(h, date, { reason });
  onDone?.();
  hap.commit();
  app.toast(`${h.name}: not today${reserve ? ' · reserve used' : ''}`, { action: { label: 'Undo', fn: () => { restore(before); onDone?.(); } } });
  return reserve;
}

/** Times a habit counted this month, up to a date ("you showed up as that person 9 times"). */
function shownUp(h, date) {
  let n = 0;
  for (let d = `${date.slice(0, 7)}-01`; d <= date; d = addDays(d, 1)) if (H.counts(h, d)) n++;
  return n;
}

const whyBlock = (h, date) => {
  const n = shownUp(h, date);
  return h.why ? html`<blockquote class="why-line">${h.why}</blockquote>
    <p class="why-count">${n ? `You showed up as that person ${n} time${n === 1 ? '' : 's'} this month.` : 'Today could be the first time this month.'}</p>` : '';
};
const backupBlock = (h) => (h.backup?.then ? html`<div class="backup-card">
    <p class="backup-if">${h.backup.when ? `If ${h.backup.when.replace(/^if\s+/i, '')}` : 'Backup plan'}</p>
    <p class="backup-then">${h.backup.then}</p>
    <button type="button" class="btn btn--primary btn--block" data-action="do-backup">Do the backup</button>
  </div>` : '');
const tinyButton = (h) => {
  const t = H.tinyOf(h);
  return t ? html`<button type="button" class="btn btn--primary btn--block" data-action="do-tiny">Do the tiny version${t.label ? html` · ${t.label}` : ''}</button>` : '';
};

/** The help that fits each reason, shown once the skip is saved. */
function helpFor(h, date, reason) {
  const edit = (label, focus) => html`<button type="button" class="btn btn--soft btn--block" data-action="edit-habit" data-focus="${focus}">${label}</button>`;
  switch (reason) {
    case 'sick': return html`<p class="sheet-note">Rest is the plan. On a sick day nothing is missed, and only water and sleep stay on.</p>
      ${H.dayMode(date) === 'sick' ? '' : html`<button type="button" class="btn btn--primary btn--block" data-action="sick-day">Make today a sick day</button>`}`;
    case 'travel': return h.backup?.then ? html`<p class="sheet-note">This is what your backup plan is for.</p>${backupBlock(h)}`
      : html`<p class="sheet-note">A travel version makes the next trip easier: a smaller thing you can do anywhere.</p>${edit('Add a backup plan', 'backup')}`;
    case 'busy': return H.tinyOf(h) ? html`<p class="sheet-note">Two minutes still counts, and keeps the habit alive on a full day.</p>${tinyButton(h)}`
      : html`<p class="sheet-note">A tiny version lets a busy day still count. Two minutes is enough.</p>${edit('Add a tiny version', 'tiny')}`;
    case 'forgot': return html`<p class="sheet-note">Forgetting means the cue is weak. Tie it to something you already do every day${h.anchor ? html`, or a moment that happens more reliably than “${h.anchor}”` : ''}.</p>
      ${edit(h.anchor ? 'Change the cue' : 'Choose a cue', 'anchor')}`;
    default: return html`${whyBlock(h, date)}<p class="sheet-note">Some days are like that. The smallest step still counts${H.tinyOf(h) ? ', and it’s here' : ''}.</p>${tinyButton(h)}`;
  }
}

function skipSheet(h, date, { onDone } = {}) {
  const left = H.reservesLeft(h, date);
  const allowance = H.reserveAllowance(h);
  const undoTo = [snap('habitLogs', H.logId(h.id, date))];
  const counted = (sheet, msg) => { onDone?.(); app.closeSheet(sheet); hap.success(); app.toast(msg, { icon: 'check', action: { label: 'Undo', fn: () => { restore(undoTo); onDone?.(); } } }); };
  app.sheet({
    title: h.name,
    ui: { reason: null, reserve: false },
    render: (sheet) => {
      const reason = sheet.ui.reason;
      if (reason) {
        return html`<div class="form skip-sheet">
          <p class="skip-done">${icon('check', { size: 16 })} Not today${sheet.ui.reserve ? ' · your reserve for this week, so the run carries on' : ''}.</p>
          ${helpFor(h, date, reason)}
          <button type="button" class="btn btn--ghost btn--block" data-action="close">Done</button>
        </div>`;
      }
      return html`<div class="form skip-sheet">
        ${whyBlock(h, date)}
        ${backupBlock(h)}
        <p class="field-label">What got in the way? <small>optional</small></p>
        <div class="chips" role="group" aria-label="What got in the way">${H.REASONS.map(([v, l]) => html`<button type="button" class="chip" data-action="reason" data-v="${v}">${l}</button>`)}</div>
        ${allowance ? html`<p class="field-hint">${left ? `Uses your reserve for this week (${left} left), so the run carries on.` : 'This week’s reserve is used, so this counts as a miss. Don’t miss twice.'}</p>` : ''}
        <button type="button" class="btn btn--ghost btn--block" data-action="skip-anyway">Not today</button>
      </div>`;
    },
    actions: {
      reason: ({ data, sheet }) => {
        sheet.ui.reserve = skip(h, date, { onDone, reason: data.v });
        sheet.ui.reason = data.v;
        sheet.refresh();
      },
      'skip-anyway': ({ sheet }) => { app.closeSheet(sheet); skip(h, date, { onDone }); },
      'do-backup': ({ sheet }) => {
        H.setLog(h, date, H.isNumeric(h) ? { completed: true, backup: true, note: h.backup.then } : { value: 1, backup: true, note: h.backup.then });
        counted(sheet, `${h.name}: backup done. It counts.`);
      },
      'do-tiny': ({ sheet }) => {
        H.setTiny(h, date, true);
        const t = H.tinyOf(h);
        counted(sheet, `${h.name}: tiny version${t?.label ? ` · ${t.label}` : ''}. It counts.`);
      },
      'sick-day': async ({ sheet }) => { app.closeSheet(sheet); (await import('./sheets.js')).setMode(date, 'sick'); onDone?.(); },
      'edit-habit': async ({ data, sheet }) => { app.closeSheet(sheet); (await import('./habit-edit.js')).openHabitEditor(h.id, { focus: data.focus }); },
      close: ({ sheet }) => app.closeSheet(sheet),
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
