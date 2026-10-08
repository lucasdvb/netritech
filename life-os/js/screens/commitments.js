// Commitments (G8): a 7, 14 or 30-day pledge to one habit, with a stake you choose, sealed with a
// press and hold. Each day shows as kept or missed from your logs. Ending early asks what got in the
// way and offers a smaller pledge.
import * as H from '../domain/habits.js';
import * as C from '../domain/commitments.js';
import { today, addDays, range, fmtMD, relativeDay } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead, segmented } from '../ui/components.js';
import { holdButton, attachHold } from '../ui/hold.js';
import { app } from '../ui/app-api.js';
import * as hap from '../ui/haptics.js';

function pledgeCard(c) {
  const t = today();
  const s = C.state(c, t);
  const h = H.habit(c.habitId);
  const days = range(c.start, c.end);
  return html`<li class="pledge" data-key="pg-${c.id}">
    <p class="section-label">Day ${s.day} of ${s.of}${s.left ? ` · ${s.left} to go` : ' · last day'}</p>
    <p class="pledge-title">${c.title}</p>
    ${c.stake ? html`<p class="pledge-stake">${icon('hand', { size: 14 })} ${c.stake}</p>` : ''}
    <ol class="pledge-days" aria-label="${s.kept} of ${s.due} days kept so far">${days.map((d) => {
      const due = h && H.isScheduledDay(h, d);
      const kept = h && H.counts(h, d);
      return html`<li class="${cx('pd', kept && 'is-kept', d < t && due && !kept && 'is-missed', d > t && 'is-future', d === t && 'is-today', !due && 'is-off')}" title="${fmtMD(d)}"></li>`;
    })}</ol>
    <p class="row-sub">${s.kept} of ${s.due} days kept${s.missed.length ? ` · missed ${s.missed.map((d) => relativeDay(d)).join(', ')}` : ''}</p>
    <button type="button" class="link-btn" data-action="pg-end" data-id="${c.id}">End early</button>
  </li>`;
}

const outcome = (c) => (c.status === 'kept' ? `Kept, all ${c.days} days` : c.status === 'ended' ? `Ended on ${fmtMD(c.endedAt)}${c.reason ? ` · ${c.reason}` : ''}` : `Kept ${c.kept} of ${c.due} days`);

export function openNewPledge(preset = {}) {
  const pool = [...H.focusHabits(), ...H.activeHabits().filter((h) => H.stateOf(h) !== 'focus' && !['paused', 'queue'].includes(H.stateOf(h)))];
  const ui = { habitId: preset.habitId || pool[0]?.id, days: preset.days || 7, stake: preset.stake || '', tiny: !!preset.tiny };
  const sheet = app.sheet({
    title: 'A pledge',
    size: 'detent',
    ui,
    render: (s) => {
      const h = H.habit(s.ui.habitId);
      return html`<div class="form pledge-new">
        <p class="sheet-note">Pick one habit and a length. The days count from your logs; the tiny version counts too.</p>
        <label class="field"><span class="field-label">Habit</span><select class="input" data-change="pg-habit" aria-label="Habit">${pool.map((x) => html`<option value="${x.id}" ${x.id === s.ui.habitId ? 'selected' : ''}>${x.name}</option>`)}</select></label>
        <div class="field"><span class="field-label">For</span>${segmented(C.LENGTHS.map((n) => ({ id: String(n), label: `${n} days` })), String(s.ui.days), { action: 'pg-days', name: 'Length', cls: 'seg--compact' })}
          <p class="field-hint">${fmtMD(today())} to ${fmtMD(addDays(today(), s.ui.days - 1))}${h ? ` · ${H.scheduleLabel(h).toLowerCase()}` : ''}</p></div>
        <label class="field"><span class="field-label">Your stake <small>optional</small></span><input class="input" data-input="pg-stake" value="${s.ui.stake}" placeholder="If I miss a day, I’ll…" maxlength="120"></label>
        <div class="ritual-seal">${holdButton({ label: 'Hold to seal', action: 'pg-seal' })}</div>
      </div>`;
    },
    inputs: {
      'pg-habit': ({ value, sheet: s }) => { s.ui.habitId = value; s.refresh(); },
      'pg-stake': ({ value, sheet: s }) => { s.ui.stake = value; },
    },
    actions: { 'pg-days': ({ data, sheet: s }) => { s.ui.days = Number(data.value); hap.tap(); s.refresh(); } },
  });
  attachHold(sheet.el, (action) => {
    if (action !== 'pg-seal') return;
    const c = C.create({ habitId: sheet.ui.habitId, days: sheet.ui.days, stake: sheet.ui.stake, tiny: sheet.ui.tiny });
    setTimeout(() => {
      app.closeSheet(sheet);
      app.toast(`Sealed: ${c.title}`, { icon: 'check', action: { label: 'Undo', fn: () => import('../data/store.js').then((st) => st.remove('commitments', c.id)) } });
    }, 380);
  });
  return sheet;
}

function openEnd(c) {
  const ui = { reason: '' };
  app.sheet({
    title: 'End this pledge?',
    ui,
    render: (s) => html`<div class="form">
      <p class="sheet-note">Nothing is lost: the days you kept stay kept.</p>
      <label class="field"><span class="field-label">What got in the way?</span><textarea class="input input--grow" rows="2" data-input="pe-why" placeholder="Optional" aria-label="What got in the way?">${s.ui.reason}</textarea></label>
      <button type="button" class="btn btn--primary btn--block" data-action="pe-smaller">End it and try 7 days${H.tinyOf(H.habit(c.habitId) || {})?.label ? ' of the tiny version' : ''}</button>
      <button type="button" class="btn btn--soft btn--block" data-action="pe-end">Just end it</button>
    </div>`,
    inputs: { 'pe-why': ({ value, sheet }) => { sheet.ui.reason = value; } },
    actions: {
      'pe-end': ({ sheet }) => { const undo = C.endEarly(c, sheet.ui.reason); hap.tap(); app.closeSheet(sheet); app.toast('Pledge ended', { action: { label: 'Undo', fn: undo } }); },
      'pe-smaller': ({ sheet }) => { C.endEarly(c, sheet.ui.reason); app.closeSheet(sheet); setTimeout(() => openNewPledge(C.smaller(c)), 320); },
    },
  });
}

export default {
  id: 'commitments',
  title: 'Commitments',
  render() {
    const act = C.active();
    const past = C.commitments().filter((c) => c.status !== 'active').slice(0, 10);
    return html`
      ${pageHead({ title: 'Commitments', back: { to: 'plan', label: 'Plan' }, actions: html`<button type="button" class="btn btn--primary btn--sm" data-action="pg-new">New pledge</button>` })}
      <p class="lead">A pledge you choose for 7, 14 or 30 days, with a stake you set. It’s the one place Life OS counts down.</p>
      ${act.length ? html`<ul class="pledge-list">${act.map(pledgeCard)}</ul>`
        : html`<div class="card"><p class="card-lead">No pledge running. Pick one habit you want to prove to yourself.</p><button type="button" class="btn btn--soft btn--sm" data-action="pg-new">New pledge</button></div>`}
      ${past.length ? html`<section class="block" data-key="past"><div class="block-head"><h2 class="block-title">Before</h2></div>
        <ul class="list">${past.map((c) => html`<li class="row"><span class="${c.status === 'kept' ? 'row-ic row-ic--done' : 'row-ic row-ic--quiet'}">${icon(c.status === 'kept' ? 'check' : 'flag', { size: 16 })}</span>
          <span class="row-main"><span class="row-title">${c.title}</span><span class="row-sub">${outcome(c)}</span></span></li>`)}</ul></section>` : ''}`;
  },
  actions: {
    'pg-new': () => openNewPledge(),
    'pg-end': ({ data }) => { const c = C.commitments().find((x) => x.id === data.id); if (c) openEnd(c); },
  },
};
