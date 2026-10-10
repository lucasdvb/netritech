// Plan › Money › Bills: bills, subscriptions and renewals, what's due next and what they cost a
// month. Paying one logs it in Money and moves its due date on; the ones you pay by hand and the
// renewals you may want to cancel put a task on their day.
import * as BL from '../domain/bills.js';
import * as $ from '../domain/money.js';
import { today, fmtMD } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { toggle } from '../ui/controls.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

const dueText = (b) => {
  const d = BL.daysTo(b);
  return d < 0 ? `overdue since ${fmtMD(b.next)}` : d === 0 ? 'due today' : d === 1 ? 'due tomorrow' : d <= 14 ? `due in ${d} days` : `next ${fmtMD(b.next)}`;
};

export function openBill(id = null) {
  const cur = id ? BL.bill(id) : null;
  app.sheet({
    title: cur ? cur.name : 'New bill or subscription',
    ui: { kind: cur?.kind || 'bill', every: cur?.every || 'month', autopay: !!cur?.autopay, name: cur?.name || '', amount: cur?.amount ?? '', next: cur?.next || today(), remindDays: cur?.remindDays ?? 3, category: cur?.category || 'home' },
    render: (s) => {
      const u = s.ui;
      return html`<form class="form" data-submit="bl-save">
        <div class="seg seg--wrap" role="radiogroup" aria-label="Kind">${BL.KINDS.map((k) => html`<button type="button" role="radio" class="seg-btn" aria-checked="${u.kind === k.id}" data-action="bl-kind" data-v="${k.id}">${k.label}</button>`)}</div>
        <p class="field-hint">${BL.KINDS.find((k) => k.id === u.kind).hint}</p>
        <label class="field"><span class="field-label">Name</span><input class="input" maxlength="60" required value="${u.name}" data-input="bl-f" data-f="name" placeholder="Electricity"></label>
        <div class="grid-2">
          <label class="field"><span class="field-label">Amount</span><input class="input" type="number" inputmode="decimal" step="0.01" min="0" value="${u.amount}" data-input="bl-f" data-f="amount" placeholder="0"></label>
          <label class="field"><span class="field-label">Next due</span><input class="input" type="date" required value="${u.next}" data-change="bl-f" data-f="next"></label>
        </div>
        <label class="field"><span class="field-label">How often</span><select class="input" data-change="bl-f" data-f="every">${BL.EVERY.map((e) => html`<option value="${e.id}" ${u.every === e.id ? 'selected' : ''}>${e.label}</option>`)}</select></label>
        <label class="field"><span class="field-label">Category in Money</span><select class="input" data-change="bl-f" data-f="category">${$.config().categories.map((c) => html`<option value="${c.id}" ${u.category === c.id ? 'selected' : ''}>${c.label}</option>`)}</select></label>
        ${u.kind === 'bill' ? html`<div class="set-row set-row--plain"><span class="set-text"><span class="set-label">Paid automatically</span><span class="set-hint">No reminder task; mark it paid to log it.</span></span>${toggle(u.autopay, { action: 'bl-auto', label: 'Paid automatically' })}</div>` : ''}
        <label class="field"><span class="field-label">${u.kind === 'bill' ? 'Remind me (days before)' : 'Decide this many days before it renews'}</span><input class="input" type="number" inputmode="numeric" min="0" max="30" value="${u.remindDays}" data-input="bl-f" data-f="remindDays"></label>
        <button type="submit" class="btn btn--primary btn--block">${cur ? 'Save' : 'Add'}</button>
        ${cur ? html`<button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="bl-delete">${icon('trash-2', { size: 16 })} Delete</button>` : ''}
      </form>`;
    },
    inputs: { 'bl-f': ({ el, value, sheet }) => { sheet.ui[el.dataset.f] = value; if (el.tagName === 'SELECT') sheet.refresh(); } },
    actions: {
      'bl-kind': ({ data, sheet }) => { sheet.ui.kind = data.v; if (data.v === 'renewal') sheet.ui.every = 'year'; if (data.v !== 'bill') sheet.ui.remindDays = Math.max(Number(sheet.ui.remindDays) || 0, data.v === 'renewal' ? 14 : 3); sheet.refresh(); },
      'bl-auto': ({ sheet }) => { sheet.ui.autopay = !sheet.ui.autopay; sheet.refresh(); },
      'bl-save': ({ sheet }) => {
        const u = sheet.ui;
        if (!String(u.name).trim()) { app.toast('Give it a name.'); return; }
        BL.save(cur?.id || null, { kind: u.kind, every: u.every, autopay: u.kind === 'bill' && u.autopay, name: u.name, amount: Number(u.amount) || 0, next: u.next, remindDays: Math.max(0, Math.min(30, Number(u.remindDays) || 0)), category: u.category });
        BL.ensureTasks();
        hap.success();
        app.closeSheet(sheet);
      },
      'bl-delete': ({ sheet }) => {
        const undo = BL.remove(cur.id);
        app.closeSheet(sheet);
        app.toast(`${cur.name} deleted`, { action: { label: 'Undo', fn: undo } });
      },
    },
  });
}

export default {
  id: 'bills',
  title: 'Bills',
  render() {
    const list = BL.all();
    const m = BL.monthly();
    const soon = BL.upcoming(14);
    const later = list.filter((b) => !soon.includes(b));
    const row = (b) => html`<li data-key="bl-${b.id}"><div class="row bill-row">
      <button type="button" class="row-main bill-open" data-action="bl-open" data-id="${b.id}"><span class="row-title">${b.name}</span>
        <span class="${cx('row-sub', BL.daysTo(b) < 0 && 'text-danger')}">${dueText(b)} · ${BL.EVERY.find((e) => e.id === b.every)?.label.toLowerCase()}${b.kind !== 'bill' ? ` · ${b.kind}` : ''}${b.autopay ? ' · automatic' : ''}</span></button>
      <span class="row-right"><span class="money-amt tnum">${$.fmt(b.amount)}</span>
        ${BL.daysTo(b) <= 14 ? html`<button type="button" class="btn btn--soft btn--sm" data-action="bl-pay" data-id="${b.id}">Paid</button>` : ''}</span></div></li>`;
    return html`
      ${pageHead({ title: 'Bills', back: { to: 'plan/money', label: 'Money' },
        actions: html`<button type="button" class="btn btn--primary btn--sm" data-action="bl-new">${icon('plus', { size: 16 })} Add</button>`,
        info: 'Bills, subscriptions and renewals. Paid logs the payment in Money and moves the due date on. Bills you pay by hand get a task a few days before; a subscription or renewal gets a “keep it?” task before it renews, while cancelling is still possible.' })}
      ${list.length ? html`<section class="money-hero"><p class="section-label">A month, on average</p><p class="money-total tnum">${$.fmt(m.total, { cents: 0 })}</p>
          <p class="money-left">${m.subscriptions ? `${$.fmt(m.subscriptions, { cents: 0 })} of it subscriptions and renewals · ${$.fmt(m.subscriptions * 12, { cents: 0 })} a year` : `${m.count} bill${m.count === 1 ? '' : 's'}`}</p></section>
        ${soon.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Next two weeks</h2></div><ul class="list">${soon.map(row)}</ul></section>` : ''}
        ${later.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">Later</h2></div><ul class="list">${later.map(row)}</ul></section>` : ''}`
        : empty({ ic: 'receipt', title: 'Nothing due, as far as Life OS knows', body: 'Add rent, utilities, phone, insurance and every subscription: what’s due shows here and on your morning briefing, and nothing renews by surprise.', cta: 'Add a bill', action: 'bl-new' })}`;
  },
  actions: {
    'bl-new': () => openBill(),
    'bl-open': ({ data }) => openBill(data.id),
    'bl-pay': ({ data }) => {
      const b = BL.bill(data.id);
      const undo = BL.pay(data.id);
      hap.success();
      app.toast(`${b.name} paid${b.amount ? ` · ${$.fmt(b.amount)} in Money` : ''}. Next ${fmtMD(BL.bill(data.id).next)}`, { icon: 'check', action: { label: 'Undo', fn: undo } });
    },
  },
};
