/* Full-screen product gallery (product page). Opens from any [data-zoom] photo.
   Phones: swipe between photos, pinch or double-tap to zoom, drag to pan, swipe down to close.
   Desktop: arrows, a thumbnail rail, click to zoom at the pointer, arrow keys, Escape.
   One pointer-event state machine drives every gesture; only transform and opacity move. */
(function () {
  'use strict';
  var buttons = [].slice.call(document.querySelectorAll('[data-zoom]'));
  if (!buttons.length || !window.HTMLDialogElement) return;
  var S = (window.theme && window.theme.strings) || {};
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var MAX = 4, ZOOM = 2.5;
  var ICON = {
    close: '<path d="m6 6 12 12M18 6 6 18" stroke-linecap="round"/>',
    prev: '<path d="m14.5 6-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/>',
    next: '<path d="m9.5 6 6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function svg(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" focusable="false">' + p + '</svg>'; }

  var items = buttons.map(function (b) {
    var im = b.querySelector('img');
    return { src: b.getAttribute('data-zoom'), alt: b.getAttribute('data-zoom-alt') || '', thumb: im ? (im.currentSrc || im.src) : b.getAttribute('data-zoom') };
  });

  var dlg = document.createElement('dialog');
  dlg.className = 'viewer';
  dlg.setAttribute('aria-label', S.galleryLabel || '');
  dlg.innerHTML =
    '<div class="viewer__top"><p class="viewer__count" aria-live="polite"></p>' +
    '<button class="viewer__btn viewer__close" type="button" data-v-close>' + svg(ICON.close) + '<span class="sr-only">' + (S.close || 'Close') + '</span></button></div>' +
    '<div class="viewer__stage"><ul class="viewer__track" role="list">' +
    items.map(function (it) { return '<li class="viewer__slide"><img data-src="' + it.src + '" width="1200" height="1200" alt="' + it.alt.replace(/"/g, '&quot;') + '" draggable="false"></li>'; }).join('') +
    '</ul></div>' +
    (items.length > 1
      ? '<button class="viewer__btn viewer__nav viewer__nav--prev" type="button" data-v-prev>' + svg(ICON.prev) + '<span class="sr-only">' + (S.prevSlide || 'Previous') + '</span></button>' +
        '<button class="viewer__btn viewer__nav viewer__nav--next" type="button" data-v-next>' + svg(ICON.next) + '<span class="sr-only">' + (S.nextSlide || 'Next') + '</span></button>' +
        '<div class="viewer__thumbs">' + items.map(function (it, i) { return '<button type="button" data-v-thumb="' + i + '"><img src="' + it.thumb + '" width="56" height="56" alt="" draggable="false"><span class="sr-only">' + (i + 1) + ' / ' + items.length + '</span></button>'; }).join('') + '</div>'
      : '');
  document.body.appendChild(dlg);

  var stage = dlg.querySelector('.viewer__stage');
  var track = dlg.querySelector('.viewer__track');
  var slides = [].slice.call(dlg.querySelectorAll('.viewer__slide'));
  var count = dlg.querySelector('.viewer__count');
  var thumbs = [].slice.call(dlg.querySelectorAll('[data-v-thumb]'));
  var index = 0, opener = null;
  var z = { s: 1, x: 0, y: 0 }; // zoom of the current photo

  function img(i) { return slides[i].querySelector('img'); }
  function load(i) { var im = slides[i] && img(i); if (im && !im.getAttribute('src')) im.src = im.getAttribute('data-src'); }
  function setTrack(dx, animate) {
    track.style.transition = animate && !reduce ? 'transform 420ms cubic-bezier(.2, 0, 0, 1)' : 'none';
    track.style.transform = 'translate3d(calc(' + (-index * 100) + '% + ' + (dx || 0) + 'px), 0, 0)';
  }
  function applyZoom(animate) {
    var im = img(index);
    im.style.transition = animate && !reduce ? 'transform 320ms cubic-bezier(.2, 0, 0, 1)' : 'none';
    im.style.transform = 'translate3d(' + z.x + 'px,' + z.y + 'px,0) scale(' + z.s + ')';
    dlg.classList.toggle('is-zoomed', z.s > 1.01);
  }
  function resetZoom(animate) { z = { s: 1, x: 0, y: 0 }; applyZoom(animate); }
  // keep the zoomed photo covering the stage (no empty edges while panning)
  function clamp() {
    var r = stage.getBoundingClientRect();
    var mx = Math.max(0, (r.width * z.s - r.width) / 2), my = Math.max(0, (r.height * z.s - r.height) / 2);
    z.x = Math.min(mx, Math.max(-mx, z.x)); z.y = Math.min(my, Math.max(-my, z.y));
  }
  // zoom to scale s keeping the stage point (px, py) (relative to the stage centre) still
  function zoomAt(s, px, py) {
    s = Math.min(MAX, Math.max(1, s));
    z.x = px - (px - z.x) * (s / z.s); z.y = py - (py - z.y) * (s / z.s); z.s = s;
    if (s === 1) { z.x = 0; z.y = 0; }
    clamp();
  }
  function go(i, animate) {
    i = Math.max(0, Math.min(items.length - 1, i));
    if (i !== index) resetZoom(false);
    index = i;
    load(i); load(i + 1); load(i - 1);
    setTrack(0, animate !== false);
    count.textContent = (i + 1) + ' / ' + items.length;
    thumbs.forEach(function (t, k) { t.classList.toggle('is-active', k === i); t.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    var p = dlg.querySelector('[data-v-prev]'), n = dlg.querySelector('[data-v-next]');
    if (p) p.disabled = i === 0;
    if (n) n.disabled = i === items.length - 1;
  }
  function open(i, from) {
    opener = from;
    dlg.style.removeProperty('--v-fade');
    dlg.showModal();
    go(i, false);
    resetZoom(false);
    requestAnimationFrame(function () { dlg.classList.add('is-open'); });
  }
  function close() {
    if (!dlg.open) return;
    var done = function () { dlg.classList.remove('is-open', 'is-closing'); dlg.close(); resetZoom(false); if (opener) opener.focus({ preventScroll: true }); };
    if (reduce) return done();
    dlg.classList.add('is-closing');
    setTimeout(done, 260);
  }

  buttons.forEach(function (b, i) { b.addEventListener('click', function () { open(i, b); }); });
  dlg.querySelector('[data-v-close]').addEventListener('click', close);
  dlg.addEventListener('cancel', function (ev) { ev.preventDefault(); close(); });
  var pb = dlg.querySelector('[data-v-prev]'), nb = dlg.querySelector('[data-v-next]');
  if (pb) pb.addEventListener('click', function () { go(index - 1); });
  if (nb) nb.addEventListener('click', function () { go(index + 1); });
  thumbs.forEach(function (t) { t.addEventListener('click', function () { go(+t.getAttribute('data-v-thumb')); }); });
  dlg.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowRight') { ev.preventDefault(); go(index + 1); }
    if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(index - 1); }
  });
  window.addEventListener('resize', function () { if (dlg.open) { setTrack(0, false); clamp(); applyZoom(false); } });

  /* gestures */
  var pts = new Map(), mode = null, start = null, lastTap = 0;
  function centre(e) { var r = stage.getBoundingClientRect(); return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 }; }
  function pair() { var a = Array.from(pts.values()); return { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 }; }

  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    stage.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      var p = pair(), r = stage.getBoundingClientRect();
      mode = 'pinch';
      start = { d: p.d, s: z.s, x: z.x, y: z.y, cx: p.x - r.left - r.width / 2, cy: p.y - r.top - r.height / 2 };
    } else if (pts.size === 1) {
      mode = null;
      start = { x: e.clientX, y: e.clientY, t: performance.now(), zx: z.x, zy: z.y, type: e.pointerType };
    }
  });
  stage.addEventListener('pointermove', function (e) {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (mode === 'pinch' && pts.size === 2) {
      var p = pair(), r = stage.getBoundingClientRect();
      var s = Math.min(MAX, Math.max(.85, start.s * p.d / start.d));
      var cx = p.x - r.left - r.width / 2, cy = p.y - r.top - r.height / 2;
      z.x = cx - (start.cx - start.x) * (s / start.s); z.y = cy - (start.cy - start.y) * (s / start.s); z.s = s;
      applyZoom(false);
      return;
    }
    if (pts.size !== 1 || !start) return;
    var dx = e.clientX - start.x, dy = e.clientY - start.y;
    if (!mode) {
      if (Math.hypot(dx, dy) < 8) return;
      mode = z.s > 1.01 ? 'pan' : Math.abs(dx) > Math.abs(dy) ? 'swipe' : dy > 0 ? 'dismiss' : 'none';
    }
    if (mode === 'pan') { z.x = start.zx + dx; z.y = start.zy + dy; clamp(); applyZoom(false); }
    else if (mode === 'swipe') {
      var edge = (index === 0 && dx > 0) || (index === items.length - 1 && dx < 0);
      setTrack(edge ? dx * .3 : dx, false);
    } else if (mode === 'dismiss') {
      var im = img(index);
      im.style.transition = 'none';
      im.style.transform = 'translate3d(0,' + dy + 'px,0) scale(' + Math.max(.8, 1 - dy / 1600) + ')';
      dlg.style.setProperty('--v-fade', String(Math.max(0, 1 - dy / 400)));
    }
  });
  function end(e) {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (mode === 'pinch') {
      if (pts.size === 0) { if (z.s < 1.05) resetZoom(true); else { clamp(); applyZoom(true); } mode = null; }
      return;
    }
    if (!start) return;
    var dx = e.clientX - start.x, dy = e.clientY - start.y, dt = performance.now() - start.t;
    if (mode === 'swipe') {
      var w = stage.clientWidth, fast = Math.abs(dx) / dt > .5;
      if ((Math.abs(dx) > w * .2 || fast) && dx < 0) go(index + 1);
      else if ((Math.abs(dx) > w * .2 || fast) && dx > 0) go(index - 1);
      else setTrack(0, true);
    } else if (mode === 'dismiss') {
      if (dy > 110 || dy / dt > .6) { close(); }
      else { resetZoom(true); dlg.style.removeProperty('--v-fade'); }
    } else if (!mode && e.type === 'pointerup') {
      // a tap: mouse click zooms at the pointer; on touch it takes a double tap
      var now = performance.now(), c = centre(e);
      if (start.type === 'mouse' || now - lastTap < 300) {
        if (z.s > 1.01) resetZoom(true); else { zoomAt(ZOOM, c.x, c.y); applyZoom(true); }
        lastTap = 0;
      } else { lastTap = now; }
    }
    mode = null; start = null;
  }
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  stage.addEventListener('wheel', function (e) {
    if (!e.ctrlKey && Math.abs(e.deltaY) < 1) return;
    e.preventDefault();
    var c = centre(e);
    zoomAt(z.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), c.x, c.y);
    applyZoom(false);
  }, { passive: false });
})();
