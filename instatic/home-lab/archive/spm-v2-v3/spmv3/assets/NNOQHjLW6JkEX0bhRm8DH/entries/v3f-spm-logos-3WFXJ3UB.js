// src/scripts/v3f-spm-logos.js
(function() {
  if (!/^\/spmv3(\/|\.html)?$/.test(location.pathname) && window.self === window.top) return;
  (function injectCSS() {
    if (document.getElementById("v3f-lg-css")) return;
    var st = document.createElement("style");
    st.id = "v3f-lg-css";
    st.textContent = ".v3f-spm-logostrip .v3f-spm-logostrip-eyebrow{display:none!important}@media (min-width:1024px){.v3f-spm-logostrip .v3f-lg--wall{--lg-w:min(88vw,420px)}.v3f-spm-logostrip .v3f-lg--wall .v3f-lg-cell{flex-basis:33.3333%}.v3f-ti-builtby .v3f-lg--grid{--lg-w:min(88vw,420px)}.v3f-ti-builtby .v3f-lg--grid .v3f-lg-cell{flex-basis:33.3333%}}";
    (document.head || document.documentElement).appendChild(st);
  })();
  var LOGOS = [
    { n: "Norvel", m: '<circle cx="9" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="15" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/>' },
    { n: "Axendo", m: '<path d="M4 20 L12 5 L20 20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M8 15 H16" fill="none" stroke="currentColor" stroke-width="2.2"/>' },
    { n: "Meridal", m: '<rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>' },
    { n: "Kalveo", m: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 17 L17 7" fill="none" stroke="currentColor" stroke-width="2.2"/>' },
    { n: "Vanteo", m: '<rect x="4" y="13" width="3.4" height="7" rx="1" fill="currentColor"/><rect x="10.3" y="8" width="3.4" height="12" rx="1" fill="currentColor"/><rect x="16.6" y="3" width="3.4" height="17" rx="1" fill="currentColor"/>' },
    { n: "Solvae", m: '<path d="M12 3 L20 7.5 L20 16.5 L12 21 L4 16.5 L4 7.5 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>' }
  ];
  function glyph(l) {
    return '<span class="v3f-spm-clogo"><svg class="v3f-spm-clogo-ic" viewBox="0 0 24 24" aria-hidden="true">' + l.m + '</svg><span class="v3f-spm-clogo-name">' + l.n + "</span></span>";
  }
  function logoHTML(l) {
    return l.src ? '<img src="' + l.src + '" alt="' + (l.n || "") + '" loading="lazy" decoding="async">' : glyph(l);
  }
  var lead = document.querySelector(".v3f-spm-lead-logos");
  if (lead) {
    lead.innerHTML = LOGOS.map(glyph).join("");
    lead.classList.add("v3f-spm-clogo-grid");
  }
  var GRIDS = [
    { sel: ".v3f-spm-logostrip .v3f-spm-logos-grid", kind: "wall", cols: 3, topExt: true },
    { sel: ".v3f-ti-builtby .v3f-ti-logos", kind: "grid", cols: 3, topExt: true }
  ];
  var lg = matchMedia("(min-width: 1024px)");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var live = [];
  function cellsFor(g) {
    var t = lg.matches ? g.cols : 2, n = LOGOS.length;
    var total = Math.ceil(n / t) * t, out = [], i;
    if (lg.matches && n < t) {
      var off = g.kind === "wall" ? Math.floor((t - n) / 2) : Math.floor(t / 2) - Math.floor((n - 1) / 2);
      for (i = 0; i < t; i++) out.push(i >= off && i < off + n ? LOGOS[i - off] : null);
      return { cells: out, t };
    }
    for (i = 0; i < total; i++) out.push(i < n ? LOGOS[i] : null);
    return { cells: out, t };
  }
  function build(g) {
    var r = cellsFor(g), cells = r.cells, t = r.t, rows = Math.ceil(cells.length / t), k = 0;
    var html = cells.map(function(l, i) {
      var col = i % t, row = Math.floor(i / t);
      var cls = "v3f-lg-cell" + (col === 0 ? " c1" : "") + (row === 0 ? " r1" : "");
      var x = ["tl", "tr", "br", "bl"].map(function(p) {
        var d = reduce ? 0 : (Math.random() * 2).toFixed(2);
        return '<span class="v3f-lg-x ' + p + '" style="--d:' + d + 's"><i></i><i></i></span>';
      }).join("");
      var ext = (col === 0 ? '<span class="v3f-lg-ext l"></span>' : "") + (col === t - 1 || i === cells.length - 1 ? '<span class="v3f-lg-ext r"></span>' : "") + (row === 0 && g.topExt ? '<span class="v3f-lg-ext t"></span>' : "") + (row === rows - 1 ? '<span class="v3f-lg-ext b"></span>' : "");
      var logo = l ? '<span class="v3f-lg-logo" style="--i:' + k++ + ";--s:" + (l.scale || 1) + '">' + logoHTML(l) + "</span>" : "";
      return '<div class="' + cls + '" style="z-index:' + (cells.length - i) + '"' + (l ? "" : ' aria-hidden="true"') + '><div class="v3f-lg-xs">' + x + "</div>" + ext + '<div class="v3f-lg-ow"><div class="v3f-lg-frame"></div><div class="v3f-lg-light"></div><div class="v3f-lg-fill"></div><div class="v3f-lg-slot">' + logo + '</div><div class="v3f-lg-wash"></div></div></div>';
    }).join("");
    g.el.innerHTML = html;
    measure(g);
  }
  function measure(g) {
    var vw = document.documentElement.clientWidth;
    g.el.style.setProperty("--lg-vw", vw + "px");
    var cells = g.el.children;
    for (var i = 0; i < cells.length; i++) {
      cells[i].style.setProperty("--tx", cells[i].offsetLeft + "px");
      cells[i].style.setProperty("--ty", cells[i].offsetTop + "px");
    }
  }
  GRIDS.forEach(function(g) {
    var host = document.querySelector(g.sel);
    if (!host) return;
    host.classList.add("v3f-lg-host");
    var sec = host.closest("section");
    if (sec) sec.classList.add("v3f-lg-sec");
    host.innerHTML = "";
    g.el = document.createElement("div");
    g.el.className = "v3f-lg v3f-lg--" + g.kind;
    host.appendChild(g.el);
    g.visible = false;
    build(g);
    live.push(g);
  });
  if (!live.length) return;
  var px = -1e5, py = -1e5, queued = false;
  function paint() {
    queued = false;
    for (var i = 0; i < live.length; i++) {
      var g = live[i];
      if (!g.visible) continue;
      var r = g.el.getBoundingClientRect();
      g.el.style.setProperty("--mx", (px - r.left).toFixed(1) + "px");
      g.el.style.setProperty("--my", (py - r.top).toFixed(1) + "px");
    }
  }
  function queue() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(paint);
    }
  }
  function onMove(e) {
    var p = e.touches ? e.touches[0] : e;
    if (!p) return;
    px = p.clientX;
    py = p.clientY;
    queue();
  }
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("touchstart", onMove, { passive: true });
  document.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("scroll", queue, { passive: true });
  if ("IntersectionObserver" in window) {
    var seen = new IntersectionObserver(function(es) {
      es.forEach(function(e) {
        live.forEach(function(g) {
          if (g.el === e.target) {
            g.visible = e.isIntersecting;
            if (g.visible) queue();
          }
        });
      });
    });
    var reveal = new IntersectionObserver(function(es) {
      es.forEach(function(e) {
        if (e.isIntersecting) e.target.classList.add("is-in");
        else if (e.boundingClientRect.top > 0) e.target.classList.remove("is-in");
      });
    }, { rootMargin: "0px 0px -50% 0px" });
    live.forEach(function(g) {
      seen.observe(g.el);
      reveal.observe(g.el);
    });
  } else {
    live.forEach(function(g) {
      g.visible = true;
      g.el.classList.add("is-in");
    });
  }
  function rebuild() {
    live.forEach(build);
    queue();
  }
  if (lg.addEventListener) lg.addEventListener("change", rebuild);
  else if (lg.addListener) lg.addListener(rebuild);
  var rz = 0;
  window.addEventListener("resize", function() {
    if (rz) return;
    rz = requestAnimationFrame(function() {
      rz = 0;
      live.forEach(measure);
      queue();
    });
  }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function() {
    live.forEach(measure);
  });
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(function() {
      live.forEach(measure);
      queue();
    });
    live.forEach(function(g) {
      ro.observe(g.el);
    });
  }
})();
