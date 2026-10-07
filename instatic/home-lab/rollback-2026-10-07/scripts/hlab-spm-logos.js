/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]')) return;
// Partner logo grids (Terminal-Industries LogoWall / LogoGrid pattern) + the
// lead-form logo row. Logos are generic placeholders (original monochrome
// glyph + neutral wordmark) until the real client/partner files are added:
// give an entry a `src` (and optional `scale`, e.g. 0.85) to use an image.
(function () {
  // Runtime styles for the logostrip (section 2): these target JS-created
  // .hlab-lg* classes, which the design-system CSS pipeline prunes, so inject
  // them here where they reliably apply and win the cascade.
  (function injectCSS() {
    if (document.getElementById('hlab-lg-css')) return;
    var st = document.createElement('style');
    st.id = 'hlab-lg-css';
    st.textContent =
      '.hlab-spm-logostrip .hlab-spm-logostrip-eyebrow{display:none!important}' +
      '@media (min-width:1024px){' +
        '.hlab-spm-logostrip .hlab-lg--wall{--lg-w:min(88vw,420px)}' +
        '.hlab-spm-logostrip .hlab-lg--wall .hlab-lg-cell{flex-basis:33.3333%}' +
        '.hlab-ti-builtby .hlab-lg--grid{--lg-w:min(88vw,420px)}' +
        '.hlab-ti-builtby .hlab-lg--grid .hlab-lg-cell{flex-basis:33.3333%}' +
      '}';
    (document.head || document.documentElement).appendChild(st);
  })();

  var LOGOS = [
    { n: 'Norvel',  m: '<circle cx="9" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/>' },
    { n: 'Axendo',  m: '<path d="M4 20 L12 5 L20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M8 15 H16" fill="none" stroke="currentColor" stroke-width="2.2"/>' },
    { n: 'Meridal', m: '<rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>' },
    { n: 'Kalveo',  m: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 17 L17 7" fill="none" stroke="currentColor" stroke-width="2.2"/>' },
    { n: 'Vanteo',  m: '<rect x="4" y="13" width="3.4" height="7" rx="1" fill="currentColor"/><rect x="10.3" y="8" width="3.4" height="12" rx="1" fill="currentColor"/><rect x="16.6" y="3" width="3.4" height="17" rx="1" fill="currentColor"/>' },
    { n: 'Solvae',  m: '<path d="M12 3 L20 7.5 L20 16.5 L12 21 L4 16.5 L4 7.5 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' }
  ];

  function glyph(l) {
    return '<span class="hlab-spm-clogo"><svg class="hlab-spm-clogo-ic" viewBox="0 0 24 24" aria-hidden="true">' + l.m +
      '</svg><span class="hlab-spm-clogo-name">' + l.n + '</span></span>';
  }
  function logoHTML(l) {
    return l.src ? '<img src="' + l.src + '" alt="' + (l.n || '') + '" loading="lazy" decoding="async">' : glyph(l);
  }

  // Lead-form row keeps the simple inline treatment.
  var lead = document.querySelector('.hlab-spm-lead-logos');
  if (lead) { lead.innerHTML = LOGOS.map(glyph).join(''); lead.classList.add('hlab-spm-clogo-grid'); }

  /* ---- tile grids ----
     wall: 10 per row (2 on mobile), logos centred in the row (TI LogoWall)
     grid:  5 per row (2 on mobile), logos from the start   (TI LogoGrid) */
  var GRIDS = [
    { sel: '.hlab-spm-logostrip .hlab-spm-logos-grid', kind: 'wall', cols: 3, topExt: true },
    { sel: '.hlab-ti-builtby .hlab-ti-logos', kind: 'grid', cols: 3, topExt: true }
  ];
  var lg = matchMedia('(min-width: 1024px)');
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var live = [];

  function cellsFor(g) {
    var t = lg.matches ? g.cols : 2, n = LOGOS.length;
    var total = Math.ceil(n / t) * t, out = [], i;
    if (lg.matches && n < t) {                    // one partial row: centre it
      var off = g.kind === 'wall' ? Math.floor((t - n) / 2) : Math.floor(t / 2) - Math.floor((n - 1) / 2);
      for (i = 0; i < t; i++) out.push(i >= off && i < off + n ? LOGOS[i - off] : null);
      return { cells: out, t: t };
    }
    for (i = 0; i < total; i++) out.push(i < n ? LOGOS[i] : null);
    return { cells: out, t: t };
  }

  function build(g) {
    var r = cellsFor(g), cells = r.cells, t = r.t, rows = Math.ceil(cells.length / t), k = 0;
    var html = cells.map(function (l, i) {
      var col = i % t, row = Math.floor(i / t);
      var cls = 'hlab-lg-cell' + (col === 0 ? ' c1' : '') + (row === 0 ? ' r1' : '');
      var x = ['tl', 'tr', 'br', 'bl'].map(function (p) {
        var d = reduce ? 0 : (Math.random() * 2).toFixed(2);
        return '<span class="hlab-lg-x ' + p + '" style="--d:' + d + 's"><i></i><i></i></span>';
      }).join('');
      var ext = (col === 0 ? '<span class="hlab-lg-ext l"></span>' : '') +
                (col === t - 1 || i === cells.length - 1 ? '<span class="hlab-lg-ext r"></span>' : '') +
                (row === 0 && g.topExt ? '<span class="hlab-lg-ext t"></span>' : '') +
                (row === rows - 1 ? '<span class="hlab-lg-ext b"></span>' : '');
      var logo = l ? '<span class="hlab-lg-logo" style="--i:' + (k++) + ';--s:' + (l.scale || 1) + '">' + logoHTML(l) + '</span>' : '';
      return '<div class="' + cls + '" style="z-index:' + (cells.length - i) + '"' + (l ? '' : ' aria-hidden="true"') + '>' +
        '<div class="hlab-lg-xs">' + x + '</div>' + ext +
        '<div class="hlab-lg-ow"><div class="hlab-lg-frame"></div><div class="hlab-lg-light"></div><div class="hlab-lg-fill"></div>' +
        '<div class="hlab-lg-slot">' + logo + '</div><div class="hlab-lg-wash"></div></div></div>';
    }).join('');
    g.el.innerHTML = html;
    measure(g);
  }

  // Each tile's offset inside its grid; the light layers subtract it from the
  // grid-relative cursor, so one pair of custom properties drives every tile.
  function measure(g) {
    var vw = document.documentElement.clientWidth;
    g.el.style.setProperty('--lg-vw', vw + 'px');
    var cells = g.el.children;
    for (var i = 0; i < cells.length; i++) {
      cells[i].style.setProperty('--tx', cells[i].offsetLeft + 'px');
      cells[i].style.setProperty('--ty', cells[i].offsetTop + 'px');
    }
  }

  GRIDS.forEach(function (g) {
    var host = document.querySelector(g.sel);
    if (!host) return;
    host.classList.add('hlab-lg-host');
    var sec = host.closest('section');
    if (sec) sec.classList.add('hlab-lg-sec');
    host.innerHTML = '';
    g.el = document.createElement('div');
    g.el.className = 'hlab-lg hlab-lg--' + g.kind;
    host.appendChild(g.el);
    g.visible = false;
    build(g);
    live.push(g);
  });
  if (!live.length) return;

  /* ---- pointer light: one listener, rAF-batched, visible grids only ---- */
  var px = -1e5, py = -1e5, queued = false;
  function paint() {
    queued = false;
    for (var i = 0; i < live.length; i++) {
      var g = live[i];
      if (!g.visible) continue;
      var r = g.el.getBoundingClientRect();
      g.el.style.setProperty('--mx', (px - r.left).toFixed(1) + 'px');
      g.el.style.setProperty('--my', (py - r.top).toFixed(1) + 'px');
    }
  }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
  function onMove(e) {
    var p = e.touches ? e.touches[0] : e;
    if (!p) return;
    px = p.clientX; py = p.clientY; queue();
  }
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('touchstart', onMove, { passive: true });
  document.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('scroll', queue, { passive: true });   // grid moves under a still cursor

  /* ---- visibility + logo reveal (TI: opacity .3 → 1, staggered, at 20% / 50%) ---- */
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        live.forEach(function (g) { if (g.el === e.target) { g.visible = e.isIntersecting; if (g.visible) queue(); } });
      });
    });
    var reveal = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('is-in');
        else if (e.boundingClientRect.top > 0) e.target.classList.remove('is-in');   // reverse when scrolled back above
      });
    }, { rootMargin: '0px 0px -50% 0px' });
    live.forEach(function (g) { seen.observe(g.el); reveal.observe(g.el); });
  } else {
    live.forEach(function (g) { g.visible = true; g.el.classList.add('is-in'); });
  }

  /* ---- breakpoint + resize ---- */
  function rebuild() { live.forEach(build); queue(); }
  if (lg.addEventListener) lg.addEventListener('change', rebuild); else if (lg.addListener) lg.addListener(rebuild);
  var rz = 0;
  window.addEventListener('resize', function () {
    if (rz) return;
    rz = requestAnimationFrame(function () { rz = 0; live.forEach(measure); queue(); });
  }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { live.forEach(measure); });
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function () { live.forEach(measure); queue(); });
    live.forEach(function (g) { ro.observe(g.el); });
  }
})();

})();
