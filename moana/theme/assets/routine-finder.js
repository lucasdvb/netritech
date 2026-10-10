/* Find my routine: scores the real catalogue against three answers. Loaded only on the routine-finder page. */
(function () {
  'use strict';
  var root = document.querySelector('[data-finder]');
  var dataEl = document.querySelector('[data-finder-data]');
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
  var stage = document.querySelector('[data-finder-stage]');
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

  function answer(name) { var c = form.querySelector('input[name="' + name + '"]:checked'); return c ? c.value : ''; }
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

  function build() {
    var skin = answer('skin'), concern = answer('concern'), n = parseInt(answer('steps') || '5', 10);
    var wanted = n === 3 ? [D.steps[0], D.steps[1], D.steps[4]] : D.steps.slice(0, 5);
    var used = {};
    var picks = wanted.map(function (step) {
      var pool = D.products.filter(function (p) { return p.available && p.tags.indexOf(step) > -1 && !used[p.handle]; });
      pool.sort(function (a, b) { return score(b, skin, concern) - score(a, skin, concern); });
      var p = pool[0] || null;
      if (p) used[p.handle] = true;
      return { step: step, product: p };
    });
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
    if (stage) stage.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
    result.focus({ preventScroll: true });
  }
  restart.addEventListener('click', function () {
    form.reset(); result.hidden = true; form.hidden = false; paintStep(0);
    var f = form.querySelector('input'); if (f) f.focus();
  });
  paintStep(0);
})();
