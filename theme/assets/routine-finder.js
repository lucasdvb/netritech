/* Find my routine: scores the real catalogue against four answers. Runs on the routine-finder page, and inside
   the Find my routine pop-up (theme.js fetches the section and calls MoanaFinder.init on it). */
(function () {
  'use strict';
  function init(stage) {
    if (!stage || stage.__finder) return;
    stage.__finder = true;
    var scope = stage.closest('.shopify-section') || stage.parentNode;
    var root = stage.querySelector('[data-finder]');
    var dataEl = scope.querySelector('[data-finder-data]');
    if (!root || !dataEl) return;
    var D = JSON.parse(dataEl.textContent);
    var form = root.querySelector('[data-finder-form]');
    var steps = [].slice.call(form.querySelectorAll('.rf__step'));
    var back = root.querySelector('[data-finder-back]');
    var next = root.querySelector('[data-finder-next]');
    var bar = root.querySelector('[data-finder-bar]');
    var result = root.querySelector('[data-finder-result]');
    var list = root.querySelector('[data-finder-list]');
    var title = root.querySelector('[data-finder-title]');
    var more = root.querySelector('[data-finder-more]');
    var addAll = root.querySelector('[data-finder-addall]');
    var restart = root.querySelector('[data-finder-restart]');
    var S = (window.theme && window.theme.strings) || {};
    var R = (window.theme && window.theme.routes) || {};
    var i = 0;
    var wash = stage && stage.querySelector('canvas[data-wash]');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // the wash shifts with each answer: palettes from the brand tints (Spring, Khaki Linen, Mist, Sage)
    var PAL = {
      spring: { bg: '#f6f8f0', a: '#eef1e4', b: '#d1d9be', c: '#d6d2bf', d: '#bcc09b' },
      linen: { bg: '#f8f6f0', a: '#f1ede2', b: '#ddd5bf', c: '#d6cdb4', d: '#c7c2ab' },
      mist: { bg: '#f4f6f4', a: '#e9ece8', b: '#d4dad3', c: '#dfe0db', d: '#b9c3b6' },
      sage: { bg: '#f2f4ea', a: '#e6eadb', b: '#c9d0b0', c: '#c7c2ab', d: '#abb086' }
    };
    var MOOD = {
      'Dry skin': 'linen', 'Normal skin': 'linen', 'All skin types': 'spring', 'Sensitive skin': 'spring',
      'Oily skin': 'mist', 'Combination skin': 'mist', 'Acne-prone skin': 'mist',
      'Hydration': 'mist', 'Fine lines': 'mist', 'Firmness': 'mist', 'Dark circles': 'mist', 'Puffiness': 'mist',
      'Dullness': 'linen', 'Dark spots': 'linen', 'Sun protection': 'linen'
    };
    function tint(name) {
      var p = PAL[name] || PAL.sage;
      if (!wash) return;
      wash.dataset.bg = p.bg; wash.dataset.a = p.a; wash.dataset.b = p.b; wash.dataset.c = p.c; wash.dataset.d = p.d;
      wash.dispatchEvent(new CustomEvent('wash:tint', { detail: p }));
    }

    function answer(name) {
      var r = form.querySelector('input[type="range"][name="' + name + '"]');
      if (r) return r.value;
      var c = form.querySelector('input[name="' + name + '"]:checked'); return c ? c.value : '';
    }
    function money(cents) {
      var n = Math.round(cents / 100).toLocaleString('en-US');
      return (D.moneyFormat || 'Rs {{amount_no_decimals}}').replace(/\{\{\s*amount\w*\s*\}\}/, n);
    }

    /* budget slider: stops in rupees (0 = no limit); the label, the filled track and a live estimate follow her thumb */
    var budgetBox = form.querySelector('[data-budget]');
    var budgetInput = budgetBox && budgetBox.querySelector('input[type="range"]');
    var STOPS = budgetBox ? budgetBox.getAttribute('data-stops').split(',').map(Number) : [];
    function budgetCents() { return budgetInput ? (STOPS[+budgetInput.value] || 0) * 100 : 0; }
    function paintBudget() {
      if (!budgetInput) return;
      var rs = STOPS[+budgetInput.value] || 0;
      budgetBox.querySelector('[data-budget-value]').textContent = rs ? budgetBox.getAttribute('data-upto').replace('[amount]', money(rs * 100)) : budgetBox.getAttribute('data-any');
      budgetInput.style.setProperty('--fill', (+budgetInput.value / (STOPS.length - 1) * 100) + '%');
      var r = pick(answer('skin'), answer('concern'), parseInt(answer('steps') || '5', 10), budgetCents());
      budgetBox.querySelector('[data-budget-estimate]').textContent = r.total ? budgetBox.getAttribute('data-estimate').replace('[amount]', money(r.total)) : '';
    }
    if (budgetInput) budgetInput.addEventListener('input', paintBudget);
    function show(k) {
      var leaving = steps[i];
      if (k !== i && leaving && !reduce && leaving.classList.contains('is-current')) {
        leaving.classList.add('is-leaving');
        setTimeout(function () { leaving.classList.remove('is-leaving'); paintStep(k); }, 200);
        return;
      }
      paintStep(k);
    }
    function paintStep(k) {
      i = k;
      if (steps[k] && steps[k].getAttribute('data-q') === 'budget') paintBudget();
      if (stage) stage.classList.toggle('is-started', k > 0);
      tint(k === 0 ? 'spring' : MOOD[answer(k === 1 ? 'skin' : 'concern')] || 'sage');
      steps.forEach(function (s, j) { s.classList.toggle('is-current', j === i); });
      back.hidden = i === 0;
      bar.style.width = ((i + 1) / steps.length * 100) + '%';
      next.disabled = !answer(steps[i].getAttribute('data-q'));
      next.textContent = i === steps.length - 1 ? next.getAttribute('data-done-label') : next.getAttribute('data-next-label');
      var first = steps[i].querySelector('input:checked') || steps[i].querySelector('input');
      if (first && k > 0) first.focus();
    }
    form.addEventListener('change', function () { next.disabled = !answer(steps[i].getAttribute('data-q')); });
    // picking an option moves on by itself (Enter/Space or a tap), except on the last question
    form.addEventListener('click', function (ev) {
      if (!ev.target.matches('input[type="radio"]')) return;
      if (ev.detail === 0) return; // arrow keys move through the options without jumping ahead
      if (i < steps.length - 1) setTimeout(function () { show(i + 1); }, 260);
      else setTimeout(build, 260);
    });
    next.addEventListener('click', function () { if (i < steps.length - 1) show(i + 1); else build(); });
    back.addEventListener('click', function () { if (i > 0) show(i - 1); });

    function score(p, skin, concern) {
      var s = 0;
      if (concern && p.tags.indexOf(concern) > -1) s += 3;
      if (skin && p.tags.indexOf(skin) > -1) s += 2;
      else if (p.tags.indexOf('All skin types') > -1) s += 1;
      if (skin === 'Sensitive skin' && p.tags.indexOf('Sensitive skin') > -1) s += 1;
      return s;
    }
    function esc(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

    // best product per step; then, while over budget, swap in the cheaper alternative that costs the least fit
    function pick(skin, concern, n, budget) {
      var wanted = n === 3 ? [D.steps[0], D.steps[1], D.steps[4]] : D.steps.slice(0, 5);
      var used = {};
      var picks = wanted.map(function (step) {
        var pool = D.products.filter(function (p) { return p.available && p.tags.indexOf(step) > -1 && !used[p.handle]; });
        pool.sort(function (a, b) { return score(b, skin, concern) - score(a, skin, concern) || a.cents - b.cents; });
        var p = pool[0] || null;
        if (p) used[p.handle] = true;
        return { step: step, product: p };
      });
      var sum = function () { return picks.reduce(function (t, x) { return t + (x.product ? x.product.cents : 0); }, 0); };
      var total = sum();
      while (budget && total > budget) {
        var best = null;
        picks.forEach(function (x, k) {
          if (!x.product) return;
          D.products.forEach(function (p) {
            if (!p.available || p.tags.indexOf(x.step) === -1 || p.cents >= x.product.cents) return;
            if (picks.some(function (y) { return y.product && y.product.handle === p.handle; })) return;
            var cost = score(x.product, skin, concern) - score(p, skin, concern), save = x.product.cents - p.cents;
            if (!best || cost < best.cost || (cost === best.cost && save > best.save)) best = { k: k, p: p, cost: cost, save: save };
          });
        });
        if (!best) break;
        picks[best.k].product = best.p;
        total = sum();
      }
      return { wanted: wanted, picks: picks, total: total, over: !!(budget && total > budget) };
    }

    function build() {
      var skin = answer('skin'), concern = answer('concern'), n = parseInt(answer('steps') || '5', 10);
      var res = pick(skin, concern, n, budgetCents());
      var wanted = res.wanted, picks = res.picks;
      var totalEl = root.querySelector('[data-finder-total]');
      if (totalEl) totalEl.textContent = D.strings.total.replace('__A__', money(res.total)) + (res.over ? ' ' + D.strings.over : '');
      // remember the routine on this device, for the skin diary
      try { localStorage.setItem('moana:routine', JSON.stringify({ skin: skin, concern: concern, at: Date.now(), picks: picks.filter(function (x) { return x.product; }).map(function (x) { return { step: x.step, handle: x.product.handle }; }) })); } catch (e) {}
      title.textContent = D.strings.title.replace('__N__', wanted.length).replace('__C__', concern.toLowerCase());
      list.innerHTML = picks.map(function (x, k) {
        var label = '<span class="rf__step-name">' + esc(D.strings.stepLabel.replace('__N__', k + 1)) + ' · ' + esc(x.step) + '</span>';
        if (!x.product) return '<li class="rf__item" style="--k:' + k + '"><span class="rf__img"></span><div>' + label + '<p class="rf__none">' + esc(D.strings.none) + '</p></div></li>';
        var p = x.product;
        var buy = p.single
          ? '<form class="rf__buy" method="post" action="' + (R.cartAdd || '/cart/add') + '" data-product-form><input type="hidden" name="id" value="' + p.variant + '"><input type="hidden" name="quantity" value="1"><button class="btn" type="submit" name="add">' + esc(D.strings.add) + '<span class="sr-only">: ' + esc(p.title) + '</span></button></form>'
          : '<a class="btn rf__buy" href="' + p.url + '">' + esc(D.strings.add) + '</a>';
        return '<li class="rf__item" style="--k:' + k + '" data-variant="' + (p.single ? p.variant : '') + '">' +
          '<a class="rf__img" href="' + p.url + '" tabindex="-1" aria-hidden="true">' + (p.image ? '<img src="' + p.image + '" alt="" width="120" height="120" loading="lazy">' : '') + '</a>' +
          '<div>' + label + '<a class="rf__name" href="' + p.url + '">' + esc(p.title) + '</a><span class="rf__price">' + esc(p.price) + '</span></div>' + buy + '</li>';
      }).join('');
      var ids = picks.filter(function (x) { return x.product && x.product.single; }).map(function (x) { return x.product.variant; });
      addAll.hidden = ids.length < 2;
      addAll.onclick = function () {
        addAll.setAttribute('aria-busy', 'true');
        var C = window.MoanaCart;
        fetch((R.cartAdd || '/cart/add') + '.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: ids.map(function (id) { return { id: id, quantity: 1 }; }), sections: C ? C.sections() : [], sections_url: window.location.pathname }) })
          .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
          .then(function (data) { addAll.removeAttribute('aria-busy'); if (C) return C.afterAdd(data.sections, addAll, data.items); })
          .catch(function () { alert(S.addError || 'Error'); })
          .then(function () { addAll.removeAttribute('aria-busy'); });
      };
      more.href = D.collectionUrl + '/' + concern.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      form.hidden = true;
      result.hidden = false;
      tint('sage');
      // in the pop-up only its own panel scrolls back to the top
      var panel = stage.closest('[data-qp-panel]');
      if (panel) panel.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      else stage.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      result.focus({ preventScroll: true });
    }
    restart.addEventListener('click', function () {
      form.reset(); result.hidden = true; form.hidden = false; paintStep(0);
      var f = form.querySelector('input'); if (f) f.focus();
    });
    paintStep(0);
    // "Save to my skin diary": the picks become her diary routine, then the diary opens
    var diaryLink = root.querySelector('[data-finder-diary]');
    if (diaryLink) diaryLink.addEventListener('click', function () {
      try {
        var r = JSON.parse(localStorage.getItem('moana:routine') || 'null');
        var d = JSON.parse(localStorage.getItem('moana:diary') || 'null') || { v: 1, log: {} };
        d.routine = {};
        (r && r.picks || []).forEach(function (x) { d.routine[x.step] = x.handle; });
        localStorage.setItem('moana:diary', JSON.stringify(d));
      } catch (e) {}
    });
  }
  window.MoanaFinder = { init: init };
  [].forEach.call(document.querySelectorAll('[data-finder-stage]'), function (stage) { if (!stage.closest('.qp')) init(stage); });
})();
