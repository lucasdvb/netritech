// Plan › Trips: where and when, how your days run while you're away (time off, a Travel day plan,
// or as usual), the travel legs, reminders paused or not, and a packing list that fits the trip.
import * as TR from '../domain/trips.js';
import { today, fmtMD, relativeDay, diffDays } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { toggle } from '../ui/controls.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import * as L from '../domain/lists.js';

export function openTrip(id = null) {
  const cur = id ? TR.trip(id) : null;
  app.sheet({
    title: cur ? cur.name : 'New trip',
    size: 'tall',
    ui: { name: cur?.name || '', where: cur?.where || '', from: cur?.from || today(), to: cur?.to || today(), mode: cur?.mode || 'away', pause: !!cur?.pause, flags: [...(cur?.flags || [])], legs: (cur?.legs || []).map((l) => ({ ...l })), busy: false },
    render: (s) => {
      const u = s.ui;
      return html`<form class="form" data-submit="tr-save">
        <label class="field"><span class="field-label">Trip</span><input class="input" required maxlength="60" value="${u.name}" data-input="tr-f" data-f="name" placeholder="Paris with Sarah"></label>
        <label class="field"><span class="field-label">Where <small>optional</small></span><input class="input" maxlength="60" value="${u.where}" data-input="tr-f" data-f="where" placeholder="Paris"></label>
        <div class="grid-2">
          <label class="field"><span class="field-label">From</span><input class="input" type="date" required value="${u.from}" data-change="tr-f" data-f="from"></label>
          <label class="field"><span class="field-label">To</span><input class="input" type="date" required value="${u.to}" min="${u.from}" data-change="tr-f" data-f="to"></label>
        </div>
        <div class="field"><span class="field-label">Your days while away</span>
          <div class="seg seg--wrap" role="radiogroup" aria-label="Your days while away">${TR.MODES.map((m) => html`<button type="button" role="radio" class="seg-btn" aria-checked="${u.mode === m.id}" data-action="tr-mode" data-v="${m.id}">${m.label}</button>`)}</div>
          <span class="field-hint">${TR.MODES.find((m) => m.id === u.mode).hint}</span></div>
        <div class="set-row set-row--plain"><span class="set-text"><span class="set-label">Pause reminders</span><span class="set-hint">Medication reminders carry on.</span></span>${toggle(u.pause, { action: 'tr-pause', label: 'Pause reminders' })}</div>
        <div class="field"><span class="field-label">Packing for</span>
          <div class="seg seg--wrap" role="group" aria-label="Packing for">${TR.FLAGS.map(([k, l]) => html`<button type="button" class="seg-btn" aria-pressed="${u.flags.includes(k)}" data-action="tr-flag" data-k="${k}">${l}</button>`)}</div>
          ${cur?.packingListId ? html`<span class="field-hint">The list is made once; change it in Lists.</span>` : ''}</div>
        <div class="field"><span class="field-label">Travel plan</span>
          ${u.legs.map((l, i) => html`<div class="trip-leg" data-key="leg-${i}">
            <input class="input" type="date" value="${l.date || u.from}" data-change="tr-leg" data-i="${i}" data-k="date" aria-label="Leg ${i + 1}: date">
            <input class="input" type="time" value="${l.time || ''}" data-change="tr-leg" data-i="${i}" data-k="time" aria-label="Leg ${i + 1}: time">
            <input class="input" maxlength="80" value="${l.what || ''}" data-input="tr-leg" data-i="${i}" data-k="what" placeholder="Flight MK 015" aria-label="Leg ${i + 1}: what">
            <button type="button" class="icon-btn icon-btn--sm" data-action="tr-leg-del" data-i="${i}" aria-label="Remove leg ${i + 1}">${icon('x', { size: 16 })}</button></div>`)}
          <button type="button" class="chip chip--add" data-action="tr-leg-add">${icon('plus', { size: 14 })} Flight, train, hotel…</button>
          <span class="field-hint">Each goes on your tasks on its day, with its time.</span></div>
        <button type="submit" class="btn btn--primary btn--block" ${u.busy ? 'disabled' : ''}>${cur ? 'Save' : 'Add trip'}</button>
        ${cur ? html`<button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="tr-delete">${icon('trash-2', { size: 16 })} Delete trip</button>` : ''}
      </form>`;
    },
    inputs: {
      'tr-f': ({ el, value, sheet }) => { sheet.ui[el.dataset.f] = value; if (el.dataset.f === 'from' && sheet.ui.to < value) { sheet.ui.to = value; sheet.refresh(); } },
      'tr-leg': ({ el, value, sheet }) => { sheet.ui.legs[Number(el.dataset.i)][el.dataset.k] = value; },
    },
    actions: {
      'tr-mode': ({ data, sheet }) => { sheet.ui.mode = data.v; sheet.refresh(); },
      'tr-pause': ({ sheet }) => { sheet.ui.pause = !sheet.ui.pause; sheet.refresh(); },
      'tr-flag': ({ data, sheet }) => { const f = new Set(sheet.ui.flags); if (f.has(data.k)) f.delete(data.k); else f.add(data.k); sheet.ui.flags = [...f]; sheet.refresh(); },
      'tr-leg-add': ({ sheet }) => { sheet.ui.legs.push({ date: sheet.ui.from, time: '', what: '' }); sheet.refresh(); },
      'tr-leg-del': ({ data, sheet }) => { sheet.ui.legs.splice(Number(data.i), 1); sheet.refresh(); },
      'tr-save': async ({ sheet }) => {
        const u = sheet.ui;
        if (!u.name.trim()) { app.toast('Give the trip a name.'); return; }
        if (u.busy) return;
        u.busy = true;
        try {
          const { trip, undo } = await TR.save(cur?.id || null, { name: u.name, where: u.where.trim().slice(0, 60), from: u.from, to: u.to, mode: u.mode, pause: u.pause, flags: u.flags, legs: u.legs.filter((l) => l.what?.trim()) });
          hap.success();
          app.closeSheet(sheet);
          app.toast(cur ? 'Trip saved' : `${trip.name}: ${TR.nights(trip)} night${TR.nights(trip) === 1 ? '' : 's'}, packing list ready`, { icon: 'check', action: { label: 'Undo', fn: undo } });
        } catch (err) {
          console.error(err);
          u.busy = false;
          app.toast('Couldn’t save the trip. Nothing was changed. Try again.', { tone: 'danger' });
        }
      },
      'tr-delete': async ({ sheet }) => {
        const undo = await TR.remove(cur.id);
        app.closeSheet(sheet);
        app.toast(`${cur.name} deleted`, { action: { label: 'Undo', fn: undo } });
      },
    },
  });
}

const tripRow = (t) => {
  const d = diffDays(t.from, today());
  const when = t.from <= today() && today() <= t.to ? 'Now' : d > 0 ? (d === 1 ? 'Tomorrow' : `In ${d} days`) : relativeDay(t.to) || fmtMD(t.to);
  const list = t.packingListId && L.list(t.packingListId);
  const c = list ? L.counts(list) : null;
  return html`<li data-key="tr-${t.id}"><div class="row trip-row">
    <button type="button" class="row-main trip-open" data-action="tr-open" data-id="${t.id}"><span class="row-title">${t.name}</span>
      <span class="row-sub">${when} · ${fmtMD(t.from)}–${fmtMD(t.to)} · ${TR.MODES.find((m) => m.id === t.mode)?.label.toLowerCase()}${t.pause ? ' · reminders paused' : ''}</span></button>
    ${list ? html`<button type="button" class="${cx('btn btn--sm', c.done === c.total ? 'btn--ghost' : 'btn--soft')}" data-action="nav" data-to="plan/lists/${list.id}">Packing ${c.done}/${c.total}</button>` : ''}
  </div></li>`;
};

export default {
  id: 'trips',
  title: 'Trips',
  render() {
    const up = TR.upcoming();
    const past = TR.past().slice(0, 6);
    return html`
      ${pageHead({ title: 'Trips', back: { to: 'plan', label: 'Plan' },
        actions: html`<button type="button" class="btn btn--primary btn--sm" data-action="tr-new">${icon('plus', { size: 16 })} Add</button>`,
        info: 'A trip sets up your days while you’re away: time off marks them away (nothing counts as missed); a Travel plan keeps your habits on lighter times; reminders can pause. The packing list fits the trip, and the travel legs and “pack” go on your tasks on their days.' })}
      ${up.length ? html`<ul class="list">${up.map(tripRow)}</ul>`
        : empty({ ic: 'map', title: 'No trips ahead', body: 'Add one and your days, reminders, packing and travel plan are set up together.', cta: 'Add a trip', action: 'tr-new' })}
      ${past.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Past trips</h2></div><ul class="list">${past.map(tripRow)}</ul></section>` : ''}`;
  },
  actions: {
    'tr-new': () => openTrip(),
    'tr-open': ({ data }) => openTrip(data.id),
  },
};
