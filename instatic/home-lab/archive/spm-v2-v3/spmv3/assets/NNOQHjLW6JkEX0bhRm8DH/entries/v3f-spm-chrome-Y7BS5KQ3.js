// src/scripts/v3f-spm-chrome.js
(function() {
  "use strict";
  if (!/^\/spmv3(\/|\.html)?$/.test(location.pathname) && window.self === window.top) return;
  var NAV = [
    { label: "Solutions", href: "#", active: true },
    { label: "Pourquoi SPM", href: "#" },
    { label: "Clients & Partenaires", href: "#" },
    { label: "Secteurs", href: "#" },
    { label: "Actualit\xE9s", href: "#" }
  ];
  var HERE = {
    "solutions": "Solutions",
    "pourquoi-spm": "Pourquoi SPM",
    "clients-partenaires": "Clients & Partenaires",
    "secteurs": "Secteurs",
    "actualites": "Actualit\xE9s",
    "carrieres": "",
    "contact": ""
  };
  var slug = location.pathname.replace(/^\/+|\/+$/g, "");
  if (Object.prototype.hasOwnProperty.call(HERE, slug)) {
    NAV.forEach(function(it) {
      it.active = it.label === HERE[slug];
    });
  }
  var links = document.querySelector(".v3f-nav-links");
  if (links && !links.dataset.v3fRebuilt) {
    links.dataset.v3fRebuilt = "1";
    links.innerHTML = NAV.map(function(it) {
      return '<li><a href="' + it.href + '"' + (it.active ? ' class="v3f-nav-active" aria-current="page"' : "") + ">" + it.label + "</a></li>";
    }).join("");
  }
  var actions = document.querySelector(".v3f-nav-actions");
  function langHTML() {
    return '<div class="v3f-lang" role="group" aria-label="Langue"><button type="button" class="v3f-lang-opt is-on" data-lang="fr">FR</button><span class="v3f-lang-sep" aria-hidden="true">\xB7</span><button type="button" class="v3f-lang-opt" data-lang="en">EN</button></div>';
  }
  var CTA_HTML = '<a class="v3f-nav-icon" aria-label="Nous appeler" href="#contact" target="_self"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></a><a class="v3f-nav-btn v3f-nav-btn-white" href="#contact" target="_self">Prendre rendez-vous</a><a class="v3f-nav-btn v3f-nav-btn-grey" href="#contact" target="_self">Nous contacter</a>';
  if (actions && !actions.dataset.v3fRebuilt) {
    actions.dataset.v3fRebuilt = "1";
    actions.innerHTML = CTA_HTML;
  }
  var ddUl = document.querySelector(".v3f-nav-dropdown ul");
  if (ddUl && !ddUl.dataset.v3fRebuilt) {
    ddUl.dataset.v3fRebuilt = "1";
    ddUl.innerHTML = NAV.map(function(it) {
      return '<li><a href="' + it.href + '">' + it.label + "</a></li>";
    }).join("") + '<li><a href="#contact">Nous contacter</a></li>';
  }
  if (!document.querySelector(".v3f-langball")) {
    var ball = document.createElement("div");
    ball.className = "v3f-langball";
    ball.innerHTML = langHTML();
    (document.body || document.documentElement).appendChild(ball);
  }
  function setLang(code) {
    try {
      localStorage.setItem("v3f-lang", code);
    } catch (e) {
    }
    try {
      document.documentElement.setAttribute("lang", code);
    } catch (e) {
    }
    var opts = document.querySelectorAll(".v3f-lang-opt");
    for (var i = 0; i < opts.length; i++) opts[i].classList.toggle("is-on", opts[i].getAttribute("data-lang") === code);
  }
  var stored = "fr";
  try {
    stored = localStorage.getItem("v3f-lang") || "fr";
  } catch (e) {
  }
  setLang(stored);
  document.addEventListener("click", function(e) {
    var b = e.target.closest ? e.target.closest(".v3f-lang-opt") : null;
    if (b) {
      e.preventDefault();
      setLang(b.getAttribute("data-lang"));
    }
  });
  var FT_LOGO = "/uploads/gKEZLSHCdTDIyJ4OrlBXF-HUMAN___AI__2_.svg";
  var TILES = [
    "Accueil",
    "Solutions",
    "Pourquoi SPM",
    "Clients & Partenaires",
    "Secteurs & \xE9tudes de cas",
    "Actualit\xE9s",
    "Carri\xE8res",
    "Contact"
  ];
  var LEGAL = ["Mentions l\xE9gales", "Politique de confidentialit\xE9", "Facebook", "Instagram", "LinkedIn"];
  function esc(s) {
    return s.replace(/&/g, "&amp;");
  }
  var footer = document.querySelector(".v3f-ti-footer");
  if (footer && !footer.dataset.v3fRebuilt) {
    footer.dataset.v3fRebuilt = "1";
    var tiles = TILES.map(function(t) {
      return '<a class="v3f-ft-tile" href="#">' + esc(t) + '<span class="v3f-ft-ar" aria-hidden="true">\u2192</span></a>';
    }).join("");
    var legal = LEGAL.map(function(t) {
      return '<a href="#">' + t + "</a>";
    }).join("");
    footer.innerHTML = '<div class="v3f-ft"><div class="v3f-ft-wrap"><div class="v3f-ft-top"><h2 class="v3f-ft-head">Des \xE9quipes humaines, acc\xE9l\xE9r\xE9es par l\u2019IA,<span class="v3f-ft-mut"> qui restent.</span></h2><a class="v3f-ft-cta" href="#"><span>PRENDRE RENDEZ-VOUS</span><span class="v3f-ft-cta-ic" aria-hidden="true">\u2192</span></a></div><nav class="v3f-ft-grid" aria-label="Plan du site">' + tiles + '</nav><div class="v3f-ft-addr"><div class="v3f-ft-col"><p class="v3f-ft-ey">\xCELE MAURICE</p><p>SPM Tower, Rue Desroches</p><p>Port Louis</p><p class="v3f-ft-pill">[T\xE9l\xE9phone Maurice]</p></div><div class="v3f-ft-col"><p class="v3f-ft-ey">FRANCE \xB7 LYON</p><p>8 chemin du Jubin</p><p>69570 Dardilly</p></div><div class="v3f-ft-col"><p class="v3f-ft-ey">FRANCE \xB7 AIX-EN-PROVENCE</p><p>103 Impasse Evariste Galois</p><p>13790 Rousset</p></div><div class="v3f-ft-col"><p class="v3f-ft-ey">NOUS \xC9CRIRE</p><p><a class="v3f-ft-ln" href="tel:+33481659845">04 81 65 98 45</a></p><p><a class="v3f-ft-ln" href="mailto:contact@spmservices.fr">contact@spmservices.fr</a></p></div></div><div class="v3f-ft-bar"><a class="v3f-ft-logo" href="#v3f-top" aria-label="SPM"><img src="' + FT_LOGO + '" alt="SPM" loading="lazy" decoding="async"></a><span class="v3f-ft-copy">\xA9 2026 Service Plus Monde. Tous droits r\xE9serv\xE9s.</span><div class="v3f-ft-legal">' + legal + '</div><span class="v3f-ft-credit">R\xE9alis\xE9 par Disruptive Dodo</span></div></div></div>';
    mountFooterFX(footer.querySelector(".v3f-ft"));
  }
  (function() {
    var tiRoot = document.querySelector(".v3f-ti-root");
    if (!tiRoot || tiRoot.dataset.v3fNotch) return;
    tiRoot.dataset.v3fNotch = "1";
    var SVGNS = "http://www.w3.org/2000/svg";
    var TABF = 0.16, D = 30, RAMP = 84, C = 14;
    var n = document.createElement("div");
    n.className = "v3f-notch";
    n.setAttribute("aria-hidden", "true");
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("preserveAspectRatio", "none");
    var path = document.createElementNS(SVGNS, "path");
    svg.appendChild(path);
    n.appendChild(svg);
    tiRoot.insertBefore(n, tiRoot.firstChild);
    function leftTab(w) {
      var k = RAMP * 0.5;
      return "M 0 0 L 0 " + (D - C) + " Q 0 " + D + " " + C + " " + D + " L " + w + " " + D + " C " + (w + k) + " " + D + " " + (w + RAMP - k) + " 0 " + (w + RAMP) + " 0 Z";
    }
    function rightTab(W, w) {
      var x0 = W - w, k = RAMP * 0.5;
      return "M " + W + " 0 L " + W + " " + (D - C) + " Q " + W + " " + D + " " + (W - C) + " " + D + " L " + x0 + " " + D + " C " + (x0 - k) + " " + D + " " + (x0 - RAMP + k) + " 0 " + (x0 - RAMP) + " 0 Z";
    }
    function draw() {
      var W = Math.max(320, tiRoot.clientWidth || window.innerWidth);
      var small = W < 768;
      D = small ? 20 : 30;
      RAMP = small ? 56 : 84;
      C = small ? 10 : 14;
      var w = W * TABF;
      n.style.height = D + "px";
      svg.setAttribute("viewBox", "0 0 " + W + " " + D);
      path.setAttribute("d", leftTab(w) + " " + rightTab(W, w));
    }
    draw();
    window.addEventListener("resize", draw, { passive: true });
  })();
  function mountFooterFX(root) {
    if (!root) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var cv = document.createElement("canvas");
    cv.className = "v3f-ft-fx";
    cv.setAttribute("aria-hidden", "true");
    root.insertBefore(cv, root.firstChild);
    var ctx = cv.getContext("2d");
    var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var GAP = 48, TR = 6, DS = 8, pulses = [], running = false, raf = 0, last = 0;
    function spawn() {
      var horiz = Math.random() < 0.5, dir = Math.random() < 0.5 ? 1 : -1, sp = 90 + Math.random() * 90;
      if (horiz) {
        var row = 1 + Math.floor(Math.random() * Math.max(1, H / GAP - 1));
        return { h: true, y: row * GAP, pos: dir > 0 ? -50 : W + 50, dir, sp };
      }
      var col = 1 + Math.floor(Math.random() * Math.max(1, W / GAP - 1));
      return { h: false, x: col * GAP, pos: dir > 0 ? -50 : H + 50, dir, sp };
    }
    function build() {
      var n = Math.round(W / 220);
      n = Math.max(4, Math.min(9, n));
      pulses = [];
      for (var i = 0; i < n; i++) pulses.push(spawn());
    }
    function size() {
      var r = root.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, root.offsetHeight || r.height);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      cv.style.width = W + "px";
      cv.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }
    function grid() {
      ctx.strokeStyle = "rgba(255,255,255,.03)";
      ctx.lineWidth = 1;
      for (var gx = GAP; gx < W; gx += GAP) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, H);
        ctx.stroke();
      }
      for (var gy = GAP; gy < H; gy += GAP) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(W, gy);
        ctx.stroke();
      }
    }
    function dot(cx, cy, al) {
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 9);
      g.addColorStop(0, "rgba(94,198,207," + (al * 0.45).toFixed(3) + ")");
      g.addColorStop(1, "rgba(94,198,207,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 9, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, 1.6, 0, 7);
      ctx.fillStyle = "rgba(120,210,218," + al.toFixed(3) + ")";
      ctx.fill();
    }
    function frame(now) {
      if (!running) return;
      var dt = last ? Math.min((now - last) / 1e3, 0.05) : 0.016;
      last = now;
      ctx.clearRect(0, 0, W, H);
      grid();
      for (var i = 0; i < pulses.length; i++) {
        var p = pulses[i];
        p.pos += p.dir * p.sp * dt;
        for (var k = 0; k < TR; k++) {
          var pos2 = p.pos - p.dir * k * DS, al = (1 - k / TR) * 0.36;
          if (p.h) dot(pos2, p.y, al);
          else dot(p.x, pos2, al);
        }
        var len = p.h ? W : H;
        if (p.dir > 0 && p.pos > len + 70 || p.dir < 0 && p.pos < -70) pulses[i] = spawn();
      }
      raf = requestAnimationFrame(frame);
    }
    function start() {
      if (running) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
    }
    size();
    window.addEventListener("resize", size, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function(es) {
        es.forEach(function(e) {
          e.isIntersecting ? start() : stop();
        });
      }, { rootMargin: "150px" }).observe(root);
    } else {
      start();
    }
  }
})();
