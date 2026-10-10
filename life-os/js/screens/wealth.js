// Plan › Money › Net worth & savings: what you own minus what you owe, from a balance per account
// now and then (monthly is plenty), its line over the year, and your savings goals with what each
// still needs a month.
import * as W from '../domain/wealth.js';
import * as $ from '../domain/money.js';
import { today, fmtMD, monthKey } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, empty } from '../ui/components.js';
import { bar } from '../ui/controls.js';
import { lineChart } from '../ui/charts.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

function accountSheet(id = null) {
  const cur = id ? W.account(id) : null;
  const bal = cur ? W.balanceOn(cur.id) : null;
  app.sheet({
    title: cur ? cur.name : 'New account',
    ui: { name: cur?.name || '', kind: cur?.kind || 'cash', amount: bal?.amount ?? '' },
    render: (s) => html`<form class="form" data-submit="ac-save">
      <label class="field"><span class="field-label">Name</span><input class="input" required maxlength="40" value="${s.ui.name}" data-input="ac-f" data-f="name" placeholder="Current account"></label>
      <label class="field"><span class="field-label">Kind</span><select class="input" data-change="ac-f" data-f="kind">${W.KINDS.map((k) => html`<option value="${k.id}" ${s.ui.kind === k.id ? 'selected' : ''}>${k.label}${k.owe ? ' (owed)' : ''}</option>`)}</select></label>
      <label class="field"><span class="field-label">${W.KINDS.find((k) => k.id === s.ui.kind)?.owe ? 'Owed today' : 'Balance today'}</span><input class="input" type="number" inputmode="decimal" step="0.01" min="0" value="${s.ui.amount}" data-input="ac-f" data-f="amount"></label>
      ${bal ? html`<p class="field-hint">Last: ${$.fmt(bal.amount)} on ${fmtMD(bal.date)}. A new balance is kept beside the old ones, so the line shows the change.</p>` : ''}
      <button type="submit" class="btn btn--primary btn--block">${cur ? 'Save' : 'Add account'}</button>
      ${cur ? html`<button type="button" class="btn btn--ghost btn--block" data-action="ac-archive">Hide this account</button>` : ''}
    </form>`,
    inputs: { 'ac-f': ({ el, value, sheet }) => { sheet.ui[el.dataset.f] = value; if (el.tagName === 'SELECT') sheet.refresh(); } },
    actions: {
      'ac-save': ({ sheet }) => {
        const u = sheet.ui;
        if (!u.name.trim()) { app.toast('Give it a name.'); return; }
        const a = W.saveAccount(cur?.id || null, { name: u.name, kind: u.kind });
        if (u.amount !== '' && u.amount != null) W.setBalance(a.id, Number(u.amount));
        hap.success();
        app.closeSheet(sheet);
      },
      'ac-archive': ({ sheet }) => {
        W.saveAccount(cur.id, { archived: true });
        app.closeSheet(sheet);
        app.toast(`${cur.name} hidden`, { action: { label: 'Undo', fn: () => W.saveAccount(cur.id, { archived: false }) } });
      },
    },
  });
}

function goalSheet(id = null) {
  const cur = id ? W.goal(id) : null;
  app.sheet({
    title: cur ? cur.name : 'New savings goal',
    ui: { name: cur?.name || '', target: cur?.target ?? '', by: cur?.by || '', saved: cur?.saved ?? 0, add: '' },
    render: (s) => html`<form class="form" data-submit="sg-save">
      <label class="field"><span class="field-label">For</span><input class="input" required maxlength="60" value="${s.ui.name}" data-input="sg-f" data-f="name" placeholder="Emergency fund"></label>
      <div class="grid-2">
        <label class="field"><span class="field-label">Target</span><input class="input" type="number" inputmode="decimal" min="0" step="0.01" required value="${s.ui.target}" data-input="sg-f" data-f="target"></label>
        <label class="field"><span class="field-label">By <small>optional</small></span><input class="input" type="date" value="${s.ui.by}" data-change="sg-f" data-f="by"></label>
      </div>
      ${cur ? html`<label class="field"><span class="field-label">Put aside now</span><input class="input" type="number" inputmode="decimal" step="0.01" value="${s.ui.add}" data-input="sg-f" data-f="add" placeholder="Amount (negative to take out)"></label>`
        : html`<label class="field"><span class="field-label">Already saved</span><input class="input" type="number" inputmode="decimal" min="0" step="0.01" value="${s.ui.saved}" data-input="sg-f" data-f="saved"></label>`}
      <button type="submit" class="btn btn--primary btn--block">${cur ? 'Save' : 'Add goal'}</button>
      ${cur ? html`<button type="button" class="btn btn--ghost btn--block" data-action="sg-archive">${cur.reachedOn ? 'Put it away (reached)' : 'Stop this goal'}</button>` : ''}
    </form>`,
    inputs: { 'sg-f': ({ el, value, sheet }) => { sheet.ui[el.dataset.f] = value; } },
    actions: {
      'sg-save': ({ sheet }) => {
        const u = sheet.ui;
        if (!u.name.trim() || !(Number(u.target) > 0)) { app.toast('A name and a target, please.'); return; }
        const g = W.saveGoal(cur?.id || null, { name: u.name, target: Number(u.target), by: u.by || null, ...(cur ? {} : { saved: Number(u.saved) || 0 }) });
        if (cur && Number(u.add)) W.contribute(g.id, Number(u.add));
        hap.success();
        app.closeSheet(sheet);
      },
      'sg-archive': ({ sheet }) => {
        W.saveGoal(cur.id, { archived: true });
        app.closeSheet(sheet);
        app.toast(`${cur.name} put away`, { action: { label: 'Undo', fn: () => W.saveGoal(cur.id, { archived: false }) } });
      },
    },
  });
}

export default {
  id: 'wealth',
  title: 'Net worth & savings',
  render() {
    const accts = W.accounts();
    const nw = W.netWorth();
    const series = W.series(12);
    const goals = W.goals();
    const due = accts.length ? W.dueForSnapshot() : [];
    return html`
      ${pageHead({ title: 'Net worth & savings', back: { to: 'plan/money', label: 'Money' },
        info: 'Net worth is what you own minus what you owe, from one balance per account now and then; once a month is plenty. Savings goals turn a target and a date into what it needs a month. All of it stays on this device; nothing is linked to a bank.' })}
      ${accts.length ? html`<section class="money-hero"><p class="section-label">Net worth</p><p class="money-total tnum">${$.fmt(nw.net, { cents: 0 })}</p>
          <p class="money-left">${$.fmt(nw.own, { cents: 0 })} owned · ${$.fmt(nw.owe, { cents: 0 })} owed${nw.stale.length ? ` · ${nw.stale.join(', ')} not updated in 45 days` : ''}</p></section>
        ${series.length > 1 ? html`<div class="card block-tight">${lineChart({ labels: series.map((x) => x.month.slice(5)), series: [{ values: series.map((x) => x.net), color: 'var(--chart-1)', label: 'Net worth', marks: true }], fmt: (v) => $.fmt(v, { cents: 0 }) })}</div>` : ''}
        ${due.length ? html`<p class="notice notice--action">${icon('calendar-check', { size: 16 })}<span>${monthKey(today()).slice(5) === '01' ? 'New year' : 'This month'}: ${due.length} account${due.length === 1 ? '' : 's'} without a balance yet.</span><button type="button" class="link-btn" data-action="ac-open" data-id="${due[0].id}">Update ${due[0].name}</button></p>` : ''}
        <section class="block"><div class="block-head"><h2 class="block-title">Accounts</h2><button type="button" class="link-btn" data-action="ac-new">Add</button></div>
          <ul class="list">${accts.map((a) => { const b = W.balanceOn(a.id); return html`<li data-key="ac-${a.id}"><button type="button" class="row" data-action="ac-open" data-id="${a.id}">
            <span class="row-main"><span class="row-title">${a.name}</span><span class="row-sub">${W.KINDS.find((k) => k.id === a.kind)?.label}${b ? ` · ${fmtMD(b.date)}` : ' · no balance yet'}</span></span>
            <span class="${cx('row-right money-amt tnum', W.isDebt(a) && 'is-owed')}">${b ? `${W.isDebt(a) ? '−' : ''}${$.fmt(b.amount, { cents: 0 })}` : '—'}</span></button></li>`; })}</ul></section>`
        : empty({ ic: 'piggy-bank', title: 'Your net worth, in one number', body: 'Add your accounts (current, savings, investments, a loan or card) with today’s balance. Update them once a month and the line shows where you’re heading.', cta: 'Add an account', action: 'ac-new' })}
      <section class="block"><div class="block-head"><h2 class="block-title">Savings goals</h2><button type="button" class="link-btn" data-action="sg-new">Add</button></div>
        ${goals.length ? html`<ul class="list">${goals.map((g) => { const p = W.progress(g); return html`<li data-key="sg-${g.id}"><button type="button" class="row savings-row" data-action="sg-open" data-id="${g.id}">
          <span class="row-main"><span class="row-title">${g.name}</span>
            <span class="row-sub tnum">${$.fmt(g.saved || 0, { cents: 0 })} of ${$.fmt(g.target, { cents: 0 })}${p.left ? (p.perMonth != null ? ` · ${$.fmt(p.perMonth, { cents: 0 })} a month to make ${fmtMD(g.by)}${p.onTrack === false ? ' · behind' : p.onTrack ? ' · on track' : ''}` : '') : ' · reached'}</span>
            ${bar(p.share, { label: `${g.name} saved` })}</span></button></li>`; })}</ul>`
          : html`<p class="muted">A target and a date, and it says what to put aside each month.</p>`}
      </section>`;
  },
  actions: {
    'ac-new': () => accountSheet(),
    'ac-open': ({ data }) => accountSheet(data.id),
    'sg-new': () => goalSheet(),
    'sg-open': ({ data }) => goalSheet(data.id),
  },
};
