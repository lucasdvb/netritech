// Body › Supplements & medication: today's doses in time order, one tap each; what's left and when
// to reorder; and each one's dose, times and stock in its sheet.
import * as SU from '../domain/supplements.js';
import { today } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { check } from '../ui/controls.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

export function openSupplement(id = null) {
  const cur = id ? SU.one(id) : null;
  app.sheet({
    title: cur ? cur.name : 'New supplement or medication',
    ui: { name: cur?.name || '', kind: cur?.kind || 'supplement', dose: cur?.dose || '', times: [...(cur?.times || ['08:00'])], perDose: cur?.perDose ?? 1, stock: cur?.stock ?? '', reorderDays: cur?.reorderDays ?? 7, restock: '' },
    render: (s) => {
      const u = s.ui;
      return html`<form class="form" data-submit="su-save">
        <div class="seg seg--wrap" role="radiogroup" aria-label="Kind">${[['supplement', 'Supplement'], ['medication', 'Medication']].map(([v, l]) => html`<button type="button" role="radio" class="seg-btn" aria-checked="${u.kind === v}" data-action="su-kind" data-v="${v}">${l}</button>`)}</div>
        <label class="field"><span class="field-label">Name</span><input class="input" required maxlength="60" value="${u.name}" data-input="su-f" data-f="name" placeholder="Vitamin D3"></label>
        <label class="field"><span class="field-label">Dose <small>as it says on the pack</small></span><input class="input" maxlength="40" value="${u.dose}" data-input="su-f" data-f="dose" placeholder="1 capsule · 2000 IU"></label>
        <div class="field"><span class="field-label">When</span>
          <div class="su-times">${u.times.map((t, i) => html`<span class="su-time"><input class="input" type="time" value="${t}" data-change="su-time" data-i="${i}" aria-label="Time ${i + 1}">
            ${u.times.length > 1 ? html`<button type="button" class="icon-btn icon-btn--sm" data-action="su-time-del" data-i="${i}" aria-label="Remove ${t}">${icon('x', { size: 16 })}</button>` : ''}</span>`)}
            ${u.times.length < 4 ? html`<button type="button" class="chip chip--add" data-action="su-time-add">${icon('plus', { size: 14 })} Another time</button>` : ''}</div></div>
        <div class="grid-2">
          <label class="field"><span class="field-label">Per dose <small>units</small></span><input class="input" type="number" inputmode="decimal" min="0.25" step="0.25" value="${u.perDose}" data-input="su-f" data-f="perDose"></label>
          <label class="field"><span class="field-label">In stock <small>optional</small></span><input class="input" type="number" inputmode="numeric" min="0" value="${u.stock}" data-input="su-f" data-f="stock" placeholder="60"></label>
        </div>
        <label class="field"><span class="field-label">Reorder when this many days are left</span><input class="input" type="number" inputmode="numeric" min="1" max="60" value="${u.reorderDays}" data-input="su-f" data-f="reorderDays"></label>
        ${cur && cur.stock != null ? html`<label class="field"><span class="field-label">Just bought <small>adds to the stock</small></span><input class="input" type="number" inputmode="numeric" min="0" value="${u.restock}" data-input="su-f" data-f="restock" placeholder="60"></label>` : ''}
        ${u.kind === 'medication' ? html`<p class="field-hint">Medication reminders are never paused, not on trips or quiet days. Follow your prescriber’s instructions; Life OS only reminds.</p>` : ''}
        <button type="submit" class="btn btn--primary btn--block">${cur ? 'Save' : 'Add'}</button>
        ${cur ? html`<button type="button" class="btn btn--ghost btn--block" data-action="su-archive">Stop taking it</button>` : ''}
      </form>`;
    },
    inputs: {
      'su-f': ({ el, value, sheet }) => { sheet.ui[el.dataset.f] = value; },
      'su-time': ({ el, value, sheet }) => { if (/^\d{2}:\d{2}$/.test(value)) sheet.ui.times[Number(el.dataset.i)] = value; },
    },
    actions: {
      'su-kind': ({ data, sheet }) => { sheet.ui.kind = data.v; sheet.refresh(); },
      'su-time-add': ({ sheet }) => { sheet.ui.times.push('20:00'); sheet.refresh(); },
      'su-time-del': ({ data, sheet }) => { sheet.ui.times.splice(Number(data.i), 1); sheet.refresh(); },
      'su-save': ({ sheet }) => {
        const u = sheet.ui;
        if (!u.name.trim()) { app.toast('Give it a name.'); return; }
        const rec = SU.save(cur?.id || null, { name: u.name, kind: u.kind, dose: u.dose.trim().slice(0, 40), times: u.times, perDose: Number(u.perDose) || 1, stock: u.stock === '' ? null : Number(u.stock), reorderDays: Math.max(1, Math.min(60, Number(u.reorderDays) || 7)) });
        if (Number(u.restock) > 0) SU.restock(rec.id, Number(u.restock));
        SU.ensureTasks();
        hap.success();
        app.closeSheet(sheet);
      },
      'su-archive': ({ sheet }) => {
        SU.save(cur.id, { archived: true });
        app.closeSheet(sheet);
        app.toast(`${cur.name} stopped`, { action: { label: 'Undo', fn: () => SU.save(cur.id, { archived: false }) } });
      },
    },
  });
}

/** Today's doses as tap rows (here and on the morning briefing's page). */
export function dosesList(date = today()) {
  const doses = SU.doses(date);
  if (!doses.length) return '';
  return html`<ul class="list su-doses">${doses.map(({ s, time, taken }) => html`<li data-key="sd-${s.id}-${time}" class="${cx('su-dose', taken && 'is-done')}">
    ${check(taken, { action: 'su-take', data: { id: s.id, time }, label: `${s.name} at ${time}${taken ? ', taken' : ''}`, cls: 'check--sm' })}
    <button type="button" class="row-main su-open" data-action="su-open" data-id="${s.id}"><span class="row-title">${s.name}</span><span class="row-sub">${time}${s.dose ? ` · ${s.dose}` : ''}${s.kind === 'medication' ? ' · medication' : ''}</span></button></li>`)}</ul>`;
}

export const doseActions = {
  'su-take': ({ data }) => {
    const before = SU.taken(data.id, data.time);
    const undo = SU.toggle(data.id, data.time);
    hap.tap();
    if (!before) {
      const s = SU.one(data.id);
      const left = SU.daysLeft(s);
      app.toast(`${s.name} taken${left != null ? ` · ${left} day${left === 1 ? '' : 's'} left` : ''}`, { action: { label: 'Undo', fn: undo } });
      SU.ensureTasks();
    }
  },
  'su-open': ({ data }) => openSupplement(data.id),
};

export default {
  id: 'supplements',
  title: 'Supplements & medication',
  render() {
    const list = SU.all();
    const low = list.filter(SU.runningLow);
    return html`
      ${pageHead({ title: 'Supplements & medication', back: { to: 'progress/body', label: 'Body' },
        actions: html`<button type="button" class="btn btn--primary btn--sm" data-action="su-new">${icon('plus', { size: 16 })} Add</button>`,
        info: 'What you take, when, and how much is left. Taking a dose is one tap and counts the stock down; when what’s left covers fewer days than you chose, a “reorder” task appears once. Reminders: You › Reminders.' })}
      ${list.length ? html`
        ${low.length ? html`<p class="notice notice--warn">${icon('pill', { size: 16 })} Running low: ${low.map((s) => `${s.name} (${SU.daysLeft(s)} days)`).join(', ')}.</p>` : ''}
        <section class="block"><div class="block-head"><h2 class="block-title">Today</h2></div>${dosesList()}</section>
        <section class="block"><div class="block-head"><h2 class="block-title">Everything you take</h2></div>
          <ul class="list">${list.map((s) => { const d = SU.daysLeft(s); const a = SU.adherence(s.id); return html`<li data-key="su-${s.id}"><button type="button" class="row" data-action="su-open" data-id="${s.id}">
            <span class="row-ic">${icon('pill', { size: 16 })}</span>
            <span class="row-main"><span class="row-title">${s.name}</span><span class="row-sub">${s.times.join(', ')}${d != null ? ` · ${d} days left` : ''}${a != null ? ` · ${Math.round(a * 100)}% taken, 2 weeks` : ''}</span></span>
            <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></button></li>`; })}</ul></section>`
        : empty({ ic: 'pill', title: 'Nothing to take, yet', body: 'Add a supplement or a medication with its times and stock: each dose is one tap, and you’re told before it runs out.', cta: 'Add one', action: 'su-new' })}`;
  },
  actions: { 'su-new': () => openSupplement(), ...doseActions },
};
