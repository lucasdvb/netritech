// Money: this month's spending at a glance, against a budget if you set one, by category, and every
// entry. Adding one takes an amount and a tap on a category.
import * as store from '../data/store.js';
import * as $ from '../domain/money.js';
import { today, monthKey, addMonths, fmtMonth, relativeDay } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { bar } from '../ui/controls.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';
import { deleteWithUndo } from '../ui/undo.js';

const monthOf = (params) => (/^\d{4}-\d{2}$/.test(params.month || '') ? params.month : monthKey(today()));

export default {
  id: 'money',
  title: 'Money',
  render({ params }) {
    const month = monthOf(params);
    const now = monthKey(today());
    const s = $.summary(month);
    const list = $.inMonth(month);
    const over = s.budget && s.left < 0;
    return html`
      ${pageHead({ title: 'Money', back: { to: 'plan', label: 'Plan' },
        actions: html`<button type="button" class="icon-btn" data-action="settings" aria-label="Budget and currency">${icon('sliders-horizontal', { size: 20 })}</button>
          <button type="button" class="btn btn--primary btn--sm" data-action="add">${icon('plus', { size: 16 })} Add</button>` })}
      <div class="cal-head block-tight">
        <button type="button" class="icon-btn" data-action="nav" data-to="plan/money/${addMonths(`${month}-01`, -1).slice(0, 7)}" aria-label="Previous month">${icon('chevron-left', { size: 20 })}</button>
        <h2 class="block-title">${fmtMonth(`${month}-01`)}</h2>
        <button type="button" class="icon-btn" data-action="nav" data-to="plan/money/${addMonths(`${month}-01`, 1).slice(0, 7)}" aria-label="Next month"${month >= now ? ' disabled' : ''}>${icon('chevron-right', { size: 20 })}</button>
      </div>
      <section class="money-hero" aria-label="Spent this month">
        <p class="section-label">Spent${month === now ? ' so far' : ''}</p>
        <p class="money-total tnum">${$.fmt(s.total, { cents: 0 })}</p>
        ${s.budget ? html`${bar(Math.min(1, s.total / s.budget), { label: 'Budget used' })}
          <p class="money-left tnum">${over ? html`<strong>${$.fmt(-s.left, { cents: 0 })} over</strong> a ${$.fmt(s.budget, { cents: 0 })} budget` : html`${$.fmt(s.left, { cents: 0 })} left of ${$.fmt(s.budget, { cents: 0 })}${s.perDay ? ` · about ${$.fmt(s.perDay, { cents: 0 })} a day for ${s.daysLeft} day${s.daysLeft === 1 ? '' : 's'}` : ''}`}</p>`
          : html`<button type="button" class="link-btn" data-action="settings">Set a monthly budget</button>`}
      </section>
      ${s.byCategory.length ? html`<section class="block"><div class="block-head"><h2 class="block-title">By category</h2></div>
        <ul class="money-cats">${s.byCategory.map((c) => html`<li data-key="mc-${c.id}"><span class="money-cat">${c.label}</span><span class="money-amt tnum">${$.fmt(c.total, { cents: 0 })}</span>
          ${bar(c.total / s.byCategory[0].total, { label: c.label })}</li>`)}</ul></section>` : ''}
      <section class="block"><div class="block-head"><h2 class="block-title">Entries</h2><span class="block-meta tnum">${s.count || ''}</span></div>
        ${list.length ? html`<ul class="list">${list.map((e) => html`<li data-key="${e.id}"><button type="button" class="row" data-action="edit" data-id="${e.id}">
            <span class="row-main"><span class="row-title">${e.note || $.category(e.category).label}</span><span class="row-sub">${relativeDay(e.date)}${e.note ? ` · ${$.category(e.category).label}` : ''}</span></span>
            <span class="row-right money-amt tnum">${$.fmt(e.amount)}</span></button></li>`)}</ul>`
          : empty({ ic: 'wallet', title: month === now ? 'Nothing spent yet this month' : 'Nothing logged that month', body: 'Log what you spend as it happens: an amount and a category. It takes five seconds.', cta: 'Add spending', action: 'add' })}
      </section>
      <p class="foot-note">Kept on this device only. Not linked to any bank.</p>`;
  },
  actions: {
    add: ({ params }) => openExpense(null, { date: monthOf(params) === monthKey(today()) ? today() : `${monthOf(params)}-01` }),
    edit: ({ data }) => openExpense(data.id),
    settings: () => openMoneySettings(),
  },
};

/** Add (no id) or edit one entry. */
export function openExpense(id = null, { date = today() } = {}) {
  const cur = id ? store.get('expenses', id) : null;
  const cfg = $.config();
  app.sheet({
    title: cur ? 'Edit spending' : 'Spent',
    size: 'detent',
    ui: { category: cur?.category || cfg.categories[0]?.id || 'other', error: '' },
    render: (s) => html`<form class="form" data-submit="save">
      <label class="field"><span class="field-label">Amount <small>${cfg.currency}</small></span>
        <span class="input-unit input-unit--xl"><input name="amount" type="number" inputmode="decimal" step="0.01" min="0" value="${cur?.amount ?? ''}" placeholder="0" autofocus required aria-label="Amount"></span>
        ${s.ui.error ? html`<span class="field-error" role="alert">${s.ui.error}</span>` : ''}</label>
      <div class="field"><span class="field-label">On</span>
        <div class="chips" role="radiogroup" aria-label="Category">${$.config().categories.map((c) => html`<button type="button" role="radio" class="${cx('chip', s.ui.category === c.id && 'is-active')}" aria-checked="${s.ui.category === c.id}" data-action="cat" data-id="${c.id}">${c.label}</button>`)}</div></div>
      <div class="grid-2">
        <label class="field"><span class="field-label">Note <small>optional</small></span><input class="input" name="note" value="${cur?.note || ''}" maxlength="80" placeholder="e.g. Lunch"></label>
        <label class="field"><span class="field-label">Date</span><input class="input" type="date" name="date" value="${cur?.date || date}" max="${today()}"></label>
      </div>
      <button type="submit" class="btn btn--primary btn--block">${cur ? 'Save' : 'Add'}</button>
      ${cur ? html`<button type="button" class="btn btn--ghost btn--block btn--danger-text" data-action="delete">Delete</button>` : ''}
    </form>`,
    actions: {
      cat: ({ data, sheet }) => { sheet.ui.category = data.id; hap.tap(); sheet.refresh(); },
      save: ({ form, sheet }) => {
        try {
          const e = $.save({ id: cur?.id, amount: form.amount, category: sheet.ui.category, note: form.note || '', date: form.date && form.date <= today() ? form.date : today() });
          hap.success();
          app.closeSheet(sheet);
          if (!cur) app.toast(`${$.fmt(e.amount)} · ${$.category(e.category).label}`, { icon: 'check', action: { label: 'Undo', fn: () => store.remove('expenses', e.id) } });
        } catch (err) { sheet.ui.error = err.message; sheet.refresh(); }
      },
      delete: ({ sheet }) => { app.closeSheet(sheet); deleteWithUndo([{ store: 'expenses', id: cur.id }], 'Entry deleted'); },
    },
  });
}

/** Currency, monthly budget and the categories you use. */
function openMoneySettings() {
  app.sheet({
    title: 'Budget and currency',
    render: () => {
      const cfg = $.config();
      return html`<div class="form">
        <div class="grid-2">
          <label class="field"><span class="field-label">Monthly budget <small>optional</small></span><input class="input" type="number" inputmode="decimal" min="0" step="100" value="${cfg.budget ?? ''}" data-change="budget" placeholder="None"></label>
          <label class="field"><span class="field-label">Currency</span><input class="input" value="${cfg.currency}" data-change="currency" maxlength="3" autocapitalize="characters" aria-label="Currency code, like MUR, EUR or USD"></label>
        </div>
        <p class="field-hint">Three letters, like MUR, EUR, GBP or USD. Changing it relabels amounts; it doesn’t convert them.</p>
        <div class="field"><span class="field-label">Categories</span>
          <ol class="et-list" data-reorder="cat-move">${cfg.categories.map((c) => html`<li class="et-row" data-key="cat-${c.id}">
            <button type="button" class="drag-handle" data-drag aria-label="Move ${c.label}" aria-describedby="drag-hint">${icon('grip-vertical', { size: 16 })}</button>
            <input class="input et-input" value="${c.label}" data-change="cat-name" data-id="${c.id}" maxlength="24" aria-label="Category name">
            <button type="button" class="icon-btn icon-btn--sm" data-action="cat-del" data-id="${c.id}" aria-label="Remove ${c.label}"${cfg.categories.length <= 1 ? ' disabled' : ''}>${icon('x', { size: 16 })}</button></li>`)}</ol>
          <input class="input block-tight" data-change="cat-add" placeholder="Add a category" maxlength="24" enterkeyhint="done"></div>
        <p class="field-hint">Entries keep their category if you remove it; they show as “Other”.</p>
      </div>`;
    },
    inputs: {
      budget: ({ value }) => $.setConfig({ budget: Number(value) > 0 ? Math.round(Number(value)) : null }),
      currency: ({ value }) => {
        const code = value.trim().toUpperCase();
        try { new Intl.NumberFormat(undefined, { style: 'currency', currency: code }); $.setConfig({ currency: code }); }
        catch { app.toast('That isn’t a currency code. Try MUR, EUR, GBP or USD.'); }
      },
      'cat-name': ({ el, value }) => { const t = value.trim(); if (t) $.setConfig({ categories: $.config().categories.map((c) => (c.id === el.dataset.id ? { ...c, label: t } : c)) }); },
      'cat-add': ({ el, value }) => {
        const t = value.trim();
        if (!t) return;
        $.setConfig({ categories: [...$.config().categories, { id: store.uid(), label: t }] });
        el.value = '';
        hap.tap();
      },
    },
    actions: {
      'cat-del': ({ data }) => { $.setConfig({ categories: $.config().categories.filter((c) => c.id !== data.id) }); hap.tap(); },
      'cat-move': ({ from, to }) => {
        const list = [...$.config().categories];
        const [c] = list.splice(from, 1);
        list.splice(to, 0, c);
        $.setConfig({ categories: list });
      },
    },
  });
}
