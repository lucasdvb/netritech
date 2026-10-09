/* Moana Beauté theme script.
   Everything here enhances markup that already works without JavaScript: add to cart, cart changes, search,
   filters and sorting are all plain forms or links first. No libraries; one file; deferred. */
(function () {
  'use strict';

  var T = window.theme || { routes: {}, strings: {} };
  var R = T.routes || {};
  var S = T.strings || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------------------------------------------------------------- helpers */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); }
  function debounce(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
  function announce(text) {
    var live = $('#a11y-status');
    if (!live) return;
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 40);
  }
  function parseHTML(html) { return new DOMParser().parseFromString(html, 'text/html'); }
  function sectionIdOf(el) {
    var s = el && el.closest('.shopify-section');
    return s ? s.id.replace(/^shopify-section-/, '') : null;
  }
  var toastTimer;
  function toast(text, isError) {
    var el = $('[data-toast]');
    if (!el) { announce(text); return; }
    el.textContent = text;
    el.classList.toggle('toast--error', !!isError);
    el.hidden = false;
    requestAnimationFrame(function () { el.classList.add('is-open'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-open'); }, 3200);
  }

  /* ---------------------------------------------------------------- reveal on scroll */
  var revealIO = 'IntersectionObserver' in window && !reduceMotion
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' })
    : null;
  function initReveal(ctx) {
    $$('.reveal:not(.is-in), .reveal-media:not(.is-in)', ctx).forEach(function (el) {
      if (revealIO) revealIO.observe(el); else el.classList.add('is-in');
    });
  }
  initReveal();

  /* ---------------------------------------------------------------- line reveal (GetLayers Lumora text engine)
     Headings marked [data-lines] are split into their rendered lines; each line rises out of its own mask,
     100ms apart, over 900ms on easeOutCubic. The mask is padded so descenders are never cropped. The text stays
     in the DOM in reading order, so screen readers and crawlers see one ordinary heading. */
  function splitLines(el) {
    if (el.dataset.linesDone) return;
    el.dataset.linesDone = '1';
    var words = [];
    (function walk(node, wrap) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { words.push(null); return; }
            var w = document.createElement('span');
            w.className = 'lw';
            var inner = w;
            wrap.forEach(function (tag) { var c = tag.cloneNode(false); inner.appendChild(c); inner = c; });
            inner.textContent = part;
            words.push(w);
          });
        } else if (n.nodeType === 1) {
          walk(n, wrap.concat([n]));
        }
      });
    })(el, []);
    el.textContent = '';
    words.forEach(function (w) { el.appendChild(w || document.createTextNode(' ')); });
    var lines = [], top = null;
    words.forEach(function (w) {
      if (!w) return;
      var t = w.offsetTop;
      if (top === null || Math.abs(t - top) > 4) { lines.push([]); top = t; }
      lines[lines.length - 1].push(w);
    });
    el.textContent = '';
    lines.forEach(function (ws, i) {
      var line = document.createElement('span');
      line.className = 'line';
      var inner = document.createElement('span');
      inner.className = 'line__inner';
      inner.style.setProperty('--li', i);
      ws.forEach(function (w, j) { if (j) inner.appendChild(document.createTextNode(' ')); inner.appendChild(w); });
      line.appendChild(inner);
      el.appendChild(line);
    });
    el.classList.add('has-lines');
    if (revealIO) revealIO.observe(el); else el.classList.add('is-in');
  }
  function initLines(ctx) {
    if (reduceMotion || !revealIO) return;
    var run = function () { $$('[data-lines]', ctx).forEach(splitLines); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run); else run();
  }
  initLines();

  /* ---------------------------------------------------------------- overlay, drawers, focus trap */
  var overlay = $('[data-overlay]');
  var openStack = [];
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapFocus(container, ev) {
    if (ev.key !== 'Tab') return;
    var items = $$(FOCUSABLE, container).filter(function (el) { return el.offsetParent !== null || el === document.activeElement; });
    if (!items.length) return;
    var first = items[0], last = items[items.length - 1];
    if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); last.focus(); }
    else if (!ev.shiftKey && document.activeElement === last) { ev.preventDefault(); first.focus(); }
  }

  function openPanel(panel, opener) {
    if (!panel || panel.classList.contains('is-open')) return;
    closeMega();
    panel._opener = opener || document.activeElement;
    panel.hidden = false;
    openStack.push(panel);
    root.classList.add('scroll-lock');
    if (overlay && !panel.matches('[data-search-modal]')) overlay.classList.add('is-open');
    var target = $('[data-search-input]', panel) || panel;
    requestAnimationFrame(function () {
      panel.classList.add('is-open');
      target.focus({ preventScroll: true });
    });
    $$('[aria-controls="' + panel.id + '"]').forEach(function (b) { b.setAttribute('aria-expanded', 'true'); });
    panel._trap = function (ev) { trapFocus(panel, ev); };
    panel.addEventListener('keydown', panel._trap);
  }

  function closePanel(panel) {
    panel = panel || openStack[openStack.length - 1];
    if (!panel) return;
    panel.classList.remove('is-open');
    openStack = openStack.filter(function (p) { return p !== panel; });
    if (!openStack.length) {
      root.classList.remove('scroll-lock');
      if (overlay) overlay.classList.remove('is-open');
    }
    $$('[aria-controls="' + panel.id + '"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); });
    panel.removeEventListener('keydown', panel._trap);
    if (panel.matches('[data-search-modal]')) {
      setTimeout(function () { if (!panel.classList.contains('is-open')) panel.hidden = true; }, reduceMotion ? 0 : 520);
    }
    if (panel._opener && document.body.contains(panel._opener)) panel._opener.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (ev) {
    var opener = ev.target.closest('[data-drawer-open]');
    if (opener) { ev.preventDefault(); openPanel(document.getElementById(opener.getAttribute('data-drawer-open')), opener); return; }
    var closer = ev.target.closest('[data-drawer-close]');
    if (closer && closer.type !== 'submit') { ev.preventDefault(); closePanel(closer.closest('.drawer')); return; }
    if (closer && closer.type === 'submit') { closePanel(closer.closest('.drawer')); }
  });
  on(overlay, 'click', function () { while (openStack.length) closePanel(); });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && openStack.length) { ev.preventDefault(); closePanel(); }
  });

  /* ---------------------------------------------------------------- header: scrolled state, hide on scroll down */
  var header = $('[data-header]');
  if (header) {
    var lastY = window.scrollY, ticking = false;
    var onScroll = function () {
      var y = window.scrollY;
      header.classList.toggle('is-scrolled', y > 8);
      var megaOpen = $('.mega.is-open');
      if (!megaOpen && !openStack.length && y > 420 && y > lastY + 6) header.classList.add('is-hidden');
      else if (y < lastY - 6 || y < 420) header.classList.remove('is-hidden');
      lastY = y; ticking = false;
    };
    on(window, 'scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    on(header, 'focusin', function () { header.classList.remove('is-hidden'); });
    onScroll();
  }

  /* ---------------------------------------------------------------- mega menu */
  var megaHoverTimer;
  function closeMega(except) {
    $$('[data-mega-toggle]').forEach(function (btn) {
      if (btn === except) return;
      btn.setAttribute('aria-expanded', 'false');
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (panel) panel.classList.remove('is-open');
    });
  }
  function openMega(btn) {
    closeMega(btn);
    btn.setAttribute('aria-expanded', 'true');
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (panel) panel.classList.add('is-open');
  }
  $$('[data-mega-toggle]').forEach(function (btn) {
    var li = btn.closest('[data-mega]');
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    on(btn, 'click', function () { btn.getAttribute('aria-expanded') === 'true' ? closeMega() : openMega(btn); });
    if (window.matchMedia('(hover: hover)').matches) {
      on(li, 'mouseenter', function () { clearTimeout(megaHoverTimer); megaHoverTimer = setTimeout(function () { openMega(btn); }, 90); });
      on(li, 'mouseleave', function () { clearTimeout(megaHoverTimer); megaHoverTimer = setTimeout(function () { closeMega(); }, 180); });
    }
    on(panel, 'keydown', function (ev) { if (ev.key === 'Escape') { closeMega(); btn.focus(); } });
    on(li, 'focusout', function (ev) { if (!li.contains(ev.relatedTarget)) closeMega(); });
  });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeMega(); });
  document.addEventListener('click', function (ev) { if (!ev.target.closest('[data-mega]')) closeMega(); });

  /* ---------------------------------------------------------------- cart */
  var cartDrawer = $('[data-cart-drawer]');
  function cartSections() {
    var ids = ['cart-drawer'];
    var page = $('[data-cart-page]');
    var pid = sectionIdOf(page);
    if (pid) ids.push(pid);
    return ids;
  }
  function renderCartSections(sections) {
    if (!sections) return;
    Object.keys(sections).forEach(function (id) {
      var html = sections[id];
      if (!html) return;
      var doc = parseHTML(html);
      if (id === 'cart-drawer') {
        var fresh = $('[data-cart-drawer]', doc);
        if (fresh && cartDrawer) {
          // swap the inside only, so the open state, focus trap and listeners on the drawer survive
          var wasOpen = cartDrawer.classList.contains('is-open');
          cartDrawer.innerHTML = fresh.innerHTML;
          if (wasOpen) { var c = $('[data-drawer-close]', cartDrawer); if (c && cartDrawer.contains(document.activeElement) === false) c.focus({ preventScroll: true }); }
        }
      } else {
        var target = document.getElementById('shopify-section-' + id);
        var src = doc.getElementById('shopify-section-' + id) || doc.body;
        if (target && src) { target.innerHTML = src.innerHTML; initReveal(target); initLines(target); }
      }
    });
  }
  function setCount(n) {
    $$('[data-cart-count]').forEach(function (el) {
      var prev = parseInt(el.textContent, 10) || 0;
      el.textContent = String(n);
      el.hidden = !(n > 0);
      if (n > prev && !reduceMotion) { el.classList.remove('is-bumped'); void el.offsetWidth; el.classList.add('is-bumped'); }
    });
    $$('[data-cart-count-label]').forEach(function (el) { el.textContent = (S.cartCount || '').replace('__COUNT__', n); });
  }
  function refreshCount() {
    return fetch((R.cart || '/cart') + '.js', { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (cart) { setCount(cart.item_count); return cart; });
  }

  function setBusy(btn, busy) {
    if (!btn) return;
    if (busy) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy');
  }

  function showFormError(form, text) {
    var box = $('[data-form-error]', form);
    if (box) { box.textContent = text; box.hidden = false; }
    toast(text, true);
  }

  document.addEventListener('submit', function (ev) {
    var form = ev.target.closest('form[data-product-form]');
    if (!form || !window.fetch || !window.FormData) return;
    ev.preventDefault();
    var submitter = ev.submitter || $('[type="submit"]', form);
    var btns = $$('[type="submit"][form="' + form.id + '"]').concat($$('[type="submit"]', form));
    var errBox = $('[data-form-error]', form);
    if (errBox) { errBox.hidden = true; errBox.textContent = ''; }
    btns.forEach(function (b) { setBusy(b, true); });
    var fd = new FormData(form);
    fd.append('sections', cartSections().join(','));
    fd.append('sections_url', window.location.pathname);
    fetch(R.cartAdd + '.js', { method: 'POST', body: fd, headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (res) {
        if (!res.ok || res.data.status) { throw new Error(res.data.description || res.data.message || S.addError); }
        renderCartSections(res.data.sections);
        return refreshCount().then(function () {
          announce(S.added);
          if (cartDrawer) openPanel(cartDrawer, submitter); else toast(S.added);
        });
      })
      .catch(function (err) { showFormError(form, (err && err.message) || S.addError); })
      .then(function () { btns.forEach(function (b) { setBusy(b, false); }); });
  });

  function changeLine(lineEl, qty) {
    var line = parseInt(lineEl.getAttribute('data-line'), 10);
    var prevQty = parseInt(($('[data-line-input]', lineEl) || {}).value, 10);
    lineEl.classList.add('is-busy');
    return fetch(R.cartChange + '.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line: line, quantity: qty, sections: cartSections(), sections_url: window.location.pathname })
    })
      .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (res) {
        if (!res.ok || res.data.status) { throw new Error(res.data.description || res.data.message || S.updateError); }
        renderCartSections(res.data.sections);
        setCount(res.data.item_count);
        // Shopify silently caps quantities at stock: tell the shopper instead of failing silently.
        var item = res.data.items && res.data.items[line - 1];
        if (qty > 0 && item && item.quantity < qty && qty > prevQty) toast(S.capped, true);
        else announce((S.cartCount || '').replace('__COUNT__', res.data.item_count));
      })
      .catch(function (err) {
        lineEl.classList.remove('is-busy');
        var box = $('[data-line-error]', lineEl);
        if (box) { box.textContent = (err && err.message) || S.updateError; box.hidden = false; }
      });
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-line-change]');
    if (!a || !window.fetch) return;
    ev.preventDefault();
    changeLine(a.closest('[data-line]'), parseInt(a.getAttribute('data-line-change'), 10));
  });
  document.addEventListener('change', function (ev) {
    var input = ev.target.closest('[data-line-input]');
    if (!input) return;
    var v = Math.max(0, parseInt(input.value, 10) || 0);
    changeLine(input.closest('[data-line]'), v);
  });
  $$('[data-cart-open]').forEach(function (a) {
    on(a, 'click', function (ev) {
      if (!cartDrawer || $('[data-cart-page]')) return; // on /cart the link just reloads the page
      ev.preventDefault();
      openPanel(cartDrawer, a);
    });
  });

  /* ---------------------------------------------------------------- product page */
  function initProduct(ctx) {
    var section = $('[data-product-section]', ctx);
    if (!section) return;
    var form = $('[data-main-form]', section);

    // quantity stepper
    var qtyWrap = $('[data-qty]', section);
    if (qtyWrap) {
      var input = $('[data-qty-input]', qtyWrap), minus = $('[data-qty-minus]', qtyWrap), plus = $('[data-qty-plus]', qtyWrap);
      var sync = function () {
        var v = parseInt(input.value, 10) || 1, max = parseInt(input.max, 10) || 99;
        v = Math.min(Math.max(1, v), max);
        input.value = v;
        minus.disabled = v <= 1;
        plus.disabled = v >= max;
      };
      on(minus, 'click', function () { input.value = (parseInt(input.value, 10) || 1) - 1; sync(); });
      on(plus, 'click', function () { input.value = (parseInt(input.value, 10) || 1) + 1; sync(); });
      on(input, 'change', sync);
      sync();
    }

    // variants (only rendered when the product has real options)
    var variantsJSON = $('[data-variants]', section);
    if (variantsJSON && form) {
      var variants = JSON.parse(variantsJSON.textContent);
      var idInput = $('[data-variant-id]', form);
      var addBtn = $('[data-add-button]', form), addLabel = $('[data-add-label]', form);
      on(form, 'change', function (ev) {
        if (!ev.target.matches('[data-option-input]')) return;
        var chosen = $$('fieldset', form).map(function (fs) { var c = $('input:checked', fs); return c ? c.value : null; });
        var match = variants.filter(function (v) { return v.options.every(function (o, i) { return o === chosen[i]; }); })[0];
        if (!match) { addBtn.disabled = true; addLabel.textContent = S.addError; return; }
        idInput.value = match.id;
        addBtn.disabled = !match.available;
        addBtn.setAttribute('aria-disabled', String(!match.available));
        addLabel.textContent = match.available ? S.addToCart : S.soldOut;
        var url = new URL(window.location.href); url.searchParams.set('variant', match.id);
        history.replaceState({}, '', url.toString());
        // price comes from the server-rendered section so formatting is always the shop's own
        fetch(url.pathname + '?variant=' + match.id + '&section_id=' + sectionIdOf(section))
          .then(function (r) { return r.text(); })
          .then(function (html) {
            var fresh = $('[data-price-wrap]', parseHTML(html));
            var cur = $('[data-price-wrap]', section);
            if (fresh && cur) cur.innerHTML = fresh.innerHTML;
          });
      });
    }

    // gallery: dots follow the swipe position on phones
    var track = $('[data-gallery-track]', section);
    var dots = $$('[data-dot]', section);
    if (track && dots.length) {
      on(track, 'scroll', debounce(function () {
        var i = Math.round(track.scrollLeft / track.clientWidth);
        dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
      }, 60), { passive: true });
    }

    // zoom
    var lb = $('[data-lightbox]', section), lbImg = $('[data-lightbox-img]', section);
    if (lb && lb.showModal) {
      $$('[data-zoom]', section).forEach(function (b) {
        on(b, 'click', function () { lbImg.src = b.getAttribute('data-zoom'); lbImg.alt = b.getAttribute('data-zoom-alt') || ''; lb.showModal(); });
      });
      on($('[data-lightbox-close]', lb), 'click', function () { lb.close(); });
      on(lb, 'click', function (ev) { if (ev.target === lb || ev.target === lbImg) lb.close(); });
    }

    // sticky purchase bar
    var bar = $('[data-buybar]', section), addMain = $('[data-add-button]', section);
    if (bar && addMain && 'IntersectionObserver' in window) {
      var footer = $('.site-footer');
      var addVisible = true, footerVisible = false;
      var update = function () {
        var show = !addVisible && !footerVisible && addMain.getBoundingClientRect().top < 0;
        bar.classList.toggle('is-visible', show);
        bar.setAttribute('aria-hidden', String(!show));
        $$('button', bar).forEach(function (b) { b.tabIndex = show ? 0 : -1; });
      };
      new IntersectionObserver(function (e) { addVisible = e[0].isIntersecting; update(); }).observe(addMain);
      if (footer) new IntersectionObserver(function (e) { footerVisible = e[0].isIntersecting; update(); }).observe(footer);
    }
  }
  initProduct();

  /* ---------------------------------------------------------------- recommendations */
  $$('[data-recommendations]').forEach(function (el) {
    var url = el.getAttribute('data-recommendations');
    if (!url || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      fetch(url).then(function (r) { return r.text(); }).then(function (html) {
        var fresh = $('[data-recommendations]', parseHTML(html));
        if (fresh && fresh.innerHTML.trim()) { el.innerHTML = fresh.innerHTML; initReveal(el); initLines(el); }
      });
    }, { rootMargin: '400px 0px' });
    io.observe(el);
  });

  /* ---------------------------------------------------------------- predictive search */
  var modal = $('[data-search-modal]');
  if (modal) {
    var sInput = $('[data-search-input]', modal);
    var sResults = $('[data-search-results]', modal);
    var startHTML = sResults.innerHTML;
    var ctrl;
    $$('[data-search-open]').forEach(function (a) {
      on(a, 'click', function (ev) { ev.preventDefault(); openPanel(modal, a); });
    });
    on($('[data-search-close]', modal), 'click', function () { closePanel(modal); });
    on(modal, 'click', function (ev) { if (ev.target === modal) closePanel(modal); });
    var run = debounce(function () {
      var q = sInput.value.trim();
      if (ctrl) ctrl.abort();
      if (q.length < 2) { sResults.innerHTML = startHTML; sInput.setAttribute('aria-expanded', 'false'); return; }
      ctrl = 'AbortController' in window ? new AbortController() : null;
      var url = R.predictiveSearch + '?q=' + encodeURIComponent(q) +
        '&resources[type]=product,collection,page,query&resources[limit]=6&resources[options][unavailable_products]=last&section_id=predictive-search';
      fetch(url, ctrl ? { signal: ctrl.signal } : {})
        .then(function (r) { return r.text(); })
        .then(function (html) {
          var fresh = $('[data-predictive]', parseHTML(html));
          sResults.innerHTML = fresh ? fresh.outerHTML : '<p class="predictive__none">' + S.searchNone + '</p>';
          sInput.setAttribute('aria-expanded', 'true');
        })
        .catch(function () {});
    }, 220);
    on(sInput, 'input', run);
    // arrow keys move through the options; Enter on the input still submits the full search
    on(modal, 'keydown', function (ev) {
      if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return;
      var opts = $$('[role="option"]', sResults);
      if (!opts.length) return;
      ev.preventDefault();
      var i = opts.indexOf(document.activeElement);
      i = ev.key === 'ArrowDown' ? Math.min(i + 1, opts.length - 1) : i - 1;
      if (i < 0) { sInput.focus(); return; }
      opts[i].focus();
    });
  }

  /* ---------------------------------------------------------------- collection: filter and sort without reload */
  function collectionRoot() { return $('[data-collection]'); }
  function filterURL(form) {
    var params = new URLSearchParams(new FormData(form));
    // drop empty price inputs so they do not become filters
    Array.from(params.keys()).forEach(function (k) { if (params.get(k) === '') params.delete(k); });
    return form.getAttribute('action') + '?' + params.toString();
  }
  var plpSeq = 0, plpCtrl;
  function loadCollection(url, push) {
    var rootEl = collectionRoot();
    if (!rootEl) { window.location.href = url; return; }
    var id = rootEl.getAttribute('data-section-id');
    rootEl.setAttribute('aria-busy', 'true');
    var sep = url.indexOf('?') > -1 ? '&' : '?';
    // only the latest request may paint: a slow earlier response must never overwrite a newer choice
    var seq = ++plpSeq;
    if (plpCtrl) plpCtrl.abort();
    plpCtrl = 'AbortController' in window ? new AbortController() : null;
    if (push) history.pushState({ plp: true }, '', url);
    fetch(url + sep + 'section_id=' + id, plpCtrl ? { signal: plpCtrl.signal } : {})
      .then(function (r) { return r.text(); })
      .then(function (html) {
        if (seq !== plpSeq) return;
        var doc = parseHTML(html);
        ['[data-results]', '[data-filter-drawer] .drawer__body', '.plp__routes', '.plp__head'].forEach(function (sel) {
          var fresh = $(sel, doc), cur = $(sel, rootEl);
          if (fresh && cur) cur.innerHTML = fresh.innerHTML;
        });
        var freshCount = $('.plp__filter-btn', doc), curCount = $('.plp__filter-btn', rootEl);
        if (freshCount && curCount) curCount.innerHTML = freshCount.innerHTML;
        rootEl.removeAttribute('aria-busy');
        initReveal(rootEl); initLines(rootEl);
        var status = $('[data-results] [role="status"]', rootEl);
        if (status) announce(status.textContent);
      })
      .catch(function (err) { if (err && err.name === 'AbortError') return; window.location.href = url; });
  }
  document.addEventListener('change', function (ev) {
    var f = ev.target.closest('[data-filter-form]');
    if (f && ev.target.type !== 'number') { loadCollection(filterURL(f), true); return; }
    var sort = ev.target.closest('[data-sort-select]');
    if (sort) { loadCollection(filterURL(sort.form), true); }
  });
  document.addEventListener('submit', function (ev) {
    var f = ev.target.closest('[data-filter-form]');
    if (!f) return;
    ev.preventDefault();
    loadCollection(filterURL(f), true);
  });
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest('[data-filter-link]');
    if (!a || ev.metaKey || ev.ctrlKey) return;
    ev.preventDefault();
    loadCollection(a.href, true);
  });
  on(window, 'popstate', function (ev) { if (collectionRoot() && ev.state && ev.state.plp) loadCollection(window.location.href, false); });
  if (collectionRoot()) history.replaceState({ plp: true }, '', window.location.href);

  /* ---------------------------------------------------------------- rails */
  $$('[data-rail-controls]').forEach(function (c) {
    var rail = document.getElementById(c.getAttribute('data-rail-controls'));
    if (!rail) return;
    var prev = $('[data-rail-prev]', c), next = $('[data-rail-next]', c);
    var step = function () { var item = rail.firstElementChild; return item ? item.getBoundingClientRect().width + 16 : 240; };
    var state = function () {
      var max = rail.scrollWidth - rail.clientWidth - 2;
      prev.disabled = rail.scrollLeft <= 2;
      next.disabled = rail.scrollLeft >= max;
      c.hidden = max <= 0;
    };
    on(prev, 'click', function () { rail.scrollBy({ left: -step() * 2, behavior: reduceMotion ? 'auto' : 'smooth' }); });
    on(next, 'click', function () { rail.scrollBy({ left: step() * 2, behavior: reduceMotion ? 'auto' : 'smooth' }); });
    on(rail, 'scroll', debounce(state, 50), { passive: true });
    on(window, 'resize', debounce(state, 150));
    state();
  });

  /* ---------------------------------------------------------------- brand index: packshot follows the cursor */
  if (window.matchMedia('(hover: hover) and (min-width: 990px)').matches) {
    $$('[data-brand-row]').forEach(function (row) {
      var shot = $('.brand-row__shot', row);
      if (!shot) return;
      var move = function (ev) {
        shot.style.setProperty('--x', (ev.clientX + 24) + 'px');
        shot.style.setProperty('--y', (ev.clientY - 110) + 'px');
      };
      on(row, 'mouseenter', function (ev) { move(ev); row.classList.add('is-hover'); });
      on(row, 'mousemove', move);
      on(row, 'mouseleave', function () { row.classList.remove('is-hover'); });
    });
  }

  /* ---------------------------------------------------------------- contact form */
  var focusTarget = $('[data-focus-on-load]');
  if (focusTarget) focusTarget.focus();
  var prefill = $('[data-prefill-param]');
  if (prefill && !prefill.value && window.URLSearchParams) {
    var range = new URLSearchParams(window.location.search).get(prefill.getAttribute('data-prefill-param'));
    if (range && S.contactPrefill) prefill.value = S.contactPrefill.replace('__RANGE__', range.slice(0, 80));
  }

  /* ---------------------------------------------------------------- theme editor */
  document.addEventListener('shopify:section:load', function (ev) { initReveal(ev.target); initLines(ev.target); initProduct(ev.target); $$('.reveal', ev.target).forEach(function (el) { el.classList.add('is-in'); }); });
})();
