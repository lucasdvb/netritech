// Progress: how it's going, as a story rather than a dashboard (A12). This week in one sentence
// and its score against the same point last week, what's moving (each with what to do), the few
// measures that drive a decision, then Body and the areas. Charts live one level down.
import * as S from '../domain/story.js';
import { areaList } from './area.js';
import { seasonLine } from './season.js';
import * as Se from '../domain/seasons.js';
import { today, fmtDayLetter, fmtDay, fmtLong, fmtMD } from '../domain/dates.js';
import { html, cx } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { pageHead } from '../ui/components.js';
import { pct } from '../ui/format.js';

function story(w) {
  const t = today();
  return html`<section class="story" data-key="story" aria-label="This week">
    <p class="section-label">This week</p>
    <p class="story-sentence">${S.sentence(w)}</p>
    <div class="story-score">
      <p class="story-pct tnum">${w.ratio != null ? pct(w.ratio) : '—'}</p>
      <p class="story-label">of your plan so far</p>
      <p class="story-ghost">${w.ghostOf ? html`${w.ghostOf.label}${w.ghostOf.id === 'best' ? ` (week of ${fmtMD(w.ghostOf.from)})` : ''} by ${fmtDay(t)}: <span class="tnum">${pct(w.ghost)}</span>` : 'Your past self appears here once there’s a week to compare.'}</p>
    </div>
    <div class="ghost-bar" role="img" aria-label="This week ${w.ratio != null ? pct(w.ratio) : 'not started'}${w.ghostOf ? `; ${w.ghostOf.noun} ${pct(w.ghost)}` : ''}">
      <span class="ghost-fill" style="transform:scaleX(${(w.ratio || 0).toFixed(3)})"></span>
      ${w.ghostOf ? html`<span class="ghost-mark" style="left:${(w.ghost * 100).toFixed(1)}%"></span>` : ''}</div>
    <ol class="week-strip" aria-label="Days this week">${w.days.map((d) => html`<li class="${cx('wk-day', d.date === t && 'is-today', d.future && 'is-future', d.off && 'is-off')}"
        aria-label="${fmtLong(d.date)}${d.ratio != null ? `, ${pct(d.ratio)}` : ''}${d.sealed ? ', sealed' : ''}${d.off ? ', a day off' : ''}">
      <span class="wk-letter" aria-hidden="true">${fmtDayLetter(d.date)}</span>
      <span class="wk-tile" aria-hidden="true"><span class="wk-fill" style="opacity:${d.ratio != null ? (0.18 + d.ratio * 0.82).toFixed(2) : 0}"></span>${d.sealed ? icon('check', { size: 12, cls: 'wk-seal' }) : ''}</span>
    </li>`)}</ol>
    <p class="story-foot">${w.sealed ? `${w.sealed} of ${w.elapsed} day${w.elapsed === 1 ? '' : 's'} sealed` : 'Seal each evening to close the day.'}</p>
  </section>`;
}

function moving(list) {
  return html`<section class="block" data-key="moving">
    <div class="block-head"><h2 class="block-title">What’s moving</h2></div>
    ${list.length ? html`<ul class="list move-list">${list.map((m) => html`<li><a class="row move-row" href="#/${m.to}" data-action="nav" data-to="${m.to}">
        <span class="${cx('row-ic', !m.rightWay && 'row-ic--quiet')}">${icon(m.up ? 'trending-up' : 'trending-down', { size: 18 })}</span>
        <span class="row-main"><span class="row-title" data-morph="metric-${m.id}">${m.label} ${m.changeText}</span>
          <span class="move-todo"><span class="move-todo-label">What to do</span> ${m.decision}</span></span>
        <span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`)}</ul>`
      : html`<p class="quiet-line">Nothing moved much on last week. Steady is fine.</p>`}
  </section>`;
}

function measures(list) {
  if (!list.length) return html`<section class="block" data-key="measures"><p class="quiet-line">Your patterns will appear here as you use Life OS: weight, sleep, food, steps and training, each with what to do next.</p></section>`;
  return html`<section class="block" data-key="measures">
    <div class="block-head"><h2 class="block-title">Measures</h2><span class="block-meta">each with what to do</span></div>
    <ul class="measure-list">${list.map((m) => html`<li><a class="measure" href="#/${m.to}" data-action="nav" data-to="${m.to}" data-key="m-${m.id}">
      <span class="measure-top"><span class="measure-label">${m.label}</span>
        <span class="measure-value tnum">${m.value}${m.sub ? html` <small>${m.sub}</small>` : ''}</span></span>
      <span class="measure-decision">${icon(m.good === false ? 'circle-alert' : m.good ? 'circle-check' : 'circle', { size: 15, cls: cx('measure-ic', m.good === false && 'is-watch') })}<span>${m.decision}</span></span>
    </a></li>`)}</ul>
  </section>`;
}

export default {
  id: 'progress',
  title: 'Progress',
  render() {
    const w = S.week();
    const ms = S.measures();
    return html`
      ${pageHead({ title: 'Progress', sub: 'How it’s going.',
        actions: html`<button type="button" class="icon-btn" data-action="open-search" aria-label="Search" aria-keyshortcuts="/">${icon('search', { size: 20 })}</button>` })}
      ${seasonLine()}
      ${story(w)}
      ${moving(S.moving(today(), ms))}
      ${measures(ms)}
      <section class="block" data-key="body-link">
        <div class="block-head"><h2 class="block-title">Body</h2></div>
        <a class="card card--link sort-cta" href="#/progress/body" data-action="nav" data-to="progress/body">
          <span class="sort-cta-text"><span class="card-title">Weight, food, sleep and training</span><span class="row-sub">Trends, measurements and photos</span></span>
          ${icon('chevron-right', { size: 18 })}</a></section>
      <section class="block" data-key="areas"><div class="block-head"><h2 class="block-title">Areas</h2></div>${areaList()}</section>
      <section class="block" data-key="more"><ul class="list">
        <li><a class="row" href="#/progress/records" data-action="nav" data-to="progress/records"><span class="row-ic">${icon('medal', { size: 18 })}</span>
          <span class="row-main"><span class="row-title">Records & mastery</span><span class="row-sub">Your bests, and each habit’s plates</span></span><span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
        ${Se.current() || Se.upcoming() ? '' : html`<li><a class="row" href="#/progress/season" data-action="nav" data-to="progress/season"><span class="row-ic">${icon('flag', { size: 18 })}</span>
          <span class="row-main"><span class="row-title">Seasons</span><span class="row-sub">Six weeks, three habits, one intention</span></span><span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>`}
        <li><a class="row" href="#/progress/trends" data-action="nav" data-to="progress/trends"><span class="row-ic">${icon('chart-spline', { size: 18 })}</span>
          <span class="row-main"><span class="row-title">All trends</span><span class="row-sub">Charts over 30, 60 or 90 days, bests and wins</span></span><span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
        <li><a class="row" href="#/progress/calendar" data-action="nav" data-to="progress/calendar"><span class="row-ic">${icon('calendar', { size: 18 })}</span>
          <span class="row-main"><span class="row-title">Calendar</span><span class="row-sub">Every day, and what happened on it</span></span><span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
        <li><a class="row" href="#/reflect/insights" data-action="nav" data-to="reflect/insights"><span class="row-ic">${icon('lightbulb', { size: 18 })}</span>
          <span class="row-main"><span class="row-title">Insights</span><span class="row-sub">Patterns in your logs, each with one change to make</span></span><span class="row-chev">${icon('chevron-right', { size: 18 })}</span></a></li>
      </ul></section>`;
  },
};
