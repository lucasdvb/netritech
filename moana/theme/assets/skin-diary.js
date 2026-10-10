/* My skin diary (sections/skin-diary.liquid). All state lives in localStorage "moana:diary":
   { v: 1, routine: { Cleanse: "<handle>", ... }, log: { "2026-10-10": { am: ["Cleanse"], pm: [], feel: ["Calm"] } } }
   Days are counted in Mauritius time. A day counts towards the streak when at least one session is complete. */
(function () {
  'use strict';
  var root = document.querySelector('[data-diary]');
  var dataEl = document.querySelector('[data-diary-data]');
  if (!root || !dataEl) return;
  var D = JSON.parse(dataEl.textContent);
  var KEY = 'moana:diary';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lang = (document.documentElement.lang || 'en').slice(0, 2) === 'fr' ? 'fr-FR' : 'en-GB';
  function $(s, c) { return (c || root).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || root).querySelectorAll(s)); }
  function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  var byHandle = {};
  D.products.forEach(function (p) { byHandle[p.handle] = p; });

  function load() {
    try { var d = JSON.parse(localStorage.getItem(KEY) || 'null'); if (d && d.v === 1) { d.log = d.log || {}; return d; } } catch (e) {}
    return { v: 1, log: {} };
  }
  function save() {
    // keep about three months of history
    var keys = Object.keys(state.log).sort();
    while (keys.length > 100) delete state.log[keys.shift()];
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  var state = load();

  // dates in Mauritius time, as YYYY-MM-DD and as UTC midnights for arithmetic
  function todayKey() {
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Indian/Mauritius', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
    catch (e) { var n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); }
  }
  function toDate(k) { var p = k.split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function toKey(d) { return d.toISOString().slice(0, 10); }
  function addDays(k, n) { var d = toDate(k); d.setUTCDate(d.getUTCDate() + n); return toKey(d); }
  var TODAY = todayKey();

  function sessionSteps(mode) {
    return D.steps.filter(function (s) { return state.routine && state.routine[s] && (mode === 'am' || D.amOnly.indexOf(s) === -1); });
  }
  function entry(k) { return state.log[k] || (state.log[k] = { am: [], pm: [], feel: [] }); }
  function complete(k, mode) {
    var e = state.log[k], need = sessionSteps(mode);
    return !!(e && need.length && need.every(function (s) { return e[mode] && e[mode].indexOf(s) > -1; }));
  }
  function streak() {
    var k = TODAY, n = 0;
    if (!complete(k, 'am') && !complete(k, 'pm')) k = addDays(k, -1); // today still counts until midnight
    while (complete(k, 'am') || complete(k, 'pm')) { n++; k = addDays(k, -1); }
    return n;
  }

  // evening from 5pm to 4am, Mauritius time (worked out here: this script can run before theme.js)
  function evening() {
    var h;
    try { h = +new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hourCycle: 'h23', timeZone: 'Indian/Mauritius' }).format(new Date()); }
    catch (e) { h = new Date().getHours(); }
    return h >= 17 || h < 4;
  }
  var mode = evening() ? 'pm' : 'am';
  var sw = $('[data-ampm]');
  var wash = $('canvas[data-wash]');
  var DAY = { bg: '#f6f8f0', a: '#eef1e4', b: '#d1d9be', c: '#d6d2bf', d: '#bcc09b' };
  var DUSK = { bg: '#20271f', a: '#2a3229', b: '#3b4734', c: '#323a2e', d: '#56634a' };

  function paintGreeting() {
    var pm = mode === 'pm';
    $$('[data-greet-am], [data-greet-sub-am]').forEach(function (el) { el.hidden = pm; });
    $$('[data-greet-pm], [data-greet-sub-pm]').forEach(function (el) { el.hidden = !pm; });
    root.classList.toggle('is-evening', pm);
    if (wash) {
      var p = pm ? DUSK : DAY;
      wash.dataset.bg = p.bg; wash.dataset.a = p.a; wash.dataset.b = p.b; wash.dataset.c = p.c; wash.dataset.d = p.d;
      wash.dispatchEvent(new CustomEvent('wash:tint', { detail: p }));
    }
  }

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function paintList() {
    var steps = sessionSteps(mode), e = entry(TODAY), ticked = e[mode];
    $('[data-diary-list]').innerHTML = steps.map(function (s) {
      var p = byHandle[state.routine[s]] || {}, on = ticked.indexOf(s) > -1;
      return '<li class="sd__item' + (on ? ' is-done' : '') + '">' +
        '<button class="sd__check" type="button" aria-pressed="' + on + '" data-tick="' + esc(s) + '"><span class="sr-only">' + esc(s) + ': ' + esc(p.title || '') + '</span>' + CHECK + '</button>' +
        '<a class="sd__img" href="' + (p.url || '#') + '" tabindex="-1" aria-hidden="true">' + (p.image ? '<img src="' + p.image + '" alt="" width="80" height="80" loading="lazy">' : '') + '</a>' +
        '<div class="sd__info"><span class="sd__step">' + esc(s) + '</span><span class="sd__name">' + esc(p.title || '') + '</span>' +
        (p.url ? '<a class="sd__reorder" href="' + p.url + '">' + esc(D.strings.reorder) + '</a>' : '') + '</div></li>';
    }).join('');
    paintProgress(false);
  }
  function paintProgress(justFinished) {
    var steps = sessionSteps(mode), done = entry(TODAY)[mode].filter(function (s) { return steps.indexOf(s) > -1; }).length;
    $('[data-diary-bar]').style.width = (steps.length ? done / steps.length * 100 : 0) + '%';
    $('[data-diary-count]').textContent = D.strings.progress.replace('[done]', done).replace('[total]', steps.length);
    var all = steps.length && done === steps.length, box = $('[data-diary-done]');
    box.hidden = !all;
    $('[data-diary-done-text]').textContent = mode === 'pm' ? D.strings.donePm : D.strings.doneAm;
    if (all && justFinished && window.MoanaCelebrate) window.MoanaCelebrate(box);
  }
  function paintStreak(bump) {
    var n = streak(), el = $('[data-diary-streak]'), lab = $('[data-diary-streak-label]');
    var prev = +el.textContent;
    el.textContent = n;
    lab.textContent = n === 1 ? lab.getAttribute('data-one') : lab.getAttribute('data-other');
    if (bump && n > prev && !reduce) { el.classList.remove('is-bumped'); void el.offsetWidth; el.classList.add('is-bumped'); }
  }
  function paintCalendar() {
    var cells = [], start = addDays(TODAY, -27);
    var fmt = new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    for (var i = 0; i < 28; i++) {
      var k = addDays(start, i), am = complete(k, 'am'), pm = complete(k, 'pm');
      var cls = 'sd__day' + (k === TODAY ? ' is-today' : '') + (am && pm ? ' is-full' : am ? ' is-half' : pm ? ' is-half is-pm' : '');
      var label = D.strings.day.replace('[date]', fmt.format(toDate(k))).replace('[am]', am ? D.strings.yes : D.strings.no).replace('[pm]', pm ? D.strings.yes : D.strings.no);
      cells.push('<li class="' + cls + '" aria-label="' + esc(label) + '">' + toDate(k).getUTCDate() + '</li>');
    }
    $('[data-diary-cal]').innerHTML = cells.join('');
  }
  function paintFeels() {
    var f = (state.log[TODAY] && state.log[TODAY].feel) || [];
    $$('[data-feel]').forEach(function (b) { b.setAttribute('aria-pressed', String(f.indexOf(b.getAttribute('data-feel')) > -1)); });
  }
  function paintDate() {
    var d = new Intl.DateTimeFormat(lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Indian/Mauritius' }).format(new Date());
    $('[data-diary-date]').textContent = d.charAt(0).toUpperCase() + d.slice(1);
  }
  function paintEditor() {
    $('[data-diary-selects]').innerHTML = D.steps.map(function (s) {
      var opts = D.products.filter(function (p) { return p.tags.indexOf(s) > -1; });
      var cur = state.routine && state.routine[s];
      return '<label>' + esc(D.strings.choose.replace('[step]', s)) +
        '<select data-pick="' + esc(s) + '"><option value="">' + esc(D.strings.none) + '</option>' +
        opts.map(function (p) { return '<option value="' + esc(p.handle) + '"' + (p.handle === cur ? ' selected' : '') + '>' + esc(p.vendor + ' · ' + p.title) + '</option>'; }).join('') +
        '</select></label>';
    }).join('');
  }
  function hasRoutine() { return !!(state.routine && D.steps.some(function (s) { return state.routine[s]; })); }
  function paintAll() {
    var has = hasRoutine();
    $('[data-diary-empty]').hidden = has;
    $('[data-diary-main]').hidden = !has;
    var quiz = null;
    try { quiz = JSON.parse(localStorage.getItem('moana:routine') || 'null'); } catch (e) {}
    $('[data-diary-use-quiz]').hidden = !(quiz && quiz.picks && quiz.picks.length);
    $('[data-diary-find]').classList.toggle('btn--secondary', !!(quiz && quiz.picks && quiz.picks.length));
    paintGreeting(); paintDate(); paintEditor();
    if (has) { paintList(); paintStreak(false); paintCalendar(); paintFeels(); }
  }

  // events
  root.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-tick]');
    if (t) {
      var s = t.getAttribute('data-tick'), list = entry(TODAY)[mode], at = list.indexOf(s);
      if (at > -1) list.splice(at, 1); else list.push(s);
      save();
      var on = at === -1;
      t.setAttribute('aria-pressed', String(on));
      t.closest('.sd__item').classList.toggle('is-done', on);
      paintProgress(on); paintStreak(on); paintCalendar();
      return;
    }
    var f = ev.target.closest('[data-feel]');
    if (f) {
      var e = entry(TODAY), v = f.getAttribute('data-feel'), i = e.feel.indexOf(v);
      if (i > -1) e.feel.splice(i, 1); else e.feel.push(v);
      save(); paintFeels();
      return;
    }
    if (ev.target.closest('[data-diary-use-quiz]')) {
      try {
        var q = JSON.parse(localStorage.getItem('moana:routine') || 'null');
        state.routine = {};
        (q && q.picks || []).forEach(function (x) { state.routine[x.step] = x.handle; });
        save(); paintAll();
      } catch (err) {}
      return;
    }
    if (ev.target.closest('[data-diary-build]')) {
      var ed = $('[data-diary-editor]'); ed.open = true;
      var first = $('select', ed); if (first) first.focus();
    }
  });
  root.addEventListener('change', function (ev) {
    var sel = ev.target.closest('[data-pick]');
    if (!sel) return;
    state.routine = state.routine || {};
    if (sel.value) state.routine[sel.getAttribute('data-pick')] = sel.value; else delete state.routine[sel.getAttribute('data-pick')];
    save();
    var has = hasRoutine();
    $('[data-diary-empty]').hidden = has;
    $('[data-diary-main]').hidden = !has;
    if (has) { paintList(); paintStreak(false); paintCalendar(); paintFeels(); }
  });
  if (sw) {
    sw.addEventListener('ampm:change', function (ev) { mode = ev.detail.mode; paintGreeting(); if (hasRoutine()) paintList(); });
    if (mode === 'pm') {
      sw.setAttribute('data-mode', 'pm');
      [].forEach.call(sw.querySelectorAll('[data-ampm-value]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-ampm-value') === 'pm')); });
    }
  }
  paintAll();
})();
