/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]') || window.self !== window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname)) return;
/* SPM V3 — "Une équipe SPM pensée pour chaque métier" carousel motion, matched
   to terminal-industries.com "One modular platform":
   · expanded card: eyebrow, title, copy and CTA stagger in (fade + 30px rise,
     .9s expo-out, .12s apart, .15s delay)
   · expanded titles are held to two balanced lines
   · collapsed card on hover: a notch slides 20px into the right edge and
     follows the cursor vertically (damped)
   Styling lives in src/styles/hlab-tm2.css; open/close + tabs stay in
   hlab-spm-teams.js. Page-scoped to SPM V3. */
(function () {
  var root = document.querySelector("[data-tm2]");
  if (!root) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  var desktop = matchMedia("(min-width: 861px)");
  var EASE = "cubic-bezier(.19, 1, .22, 1)";
  var cards = Array.prototype.slice.call(root.querySelectorAll(".hlab-tm2-card"));

  /* ---- two-line titles on the expanded card ---- */
  function fitTitle(card) {
    var t = card.querySelector(".hlab-tm2-title");
    if (!t) return;
    t.style.maxWidth = "";
    if (!card.classList.contains("hlab-is-open") || !desktop.matches) return;
    var ws = t.style.whiteSpace;
    t.style.whiteSpace = "nowrap"; t.style.maxWidth = "none";
    var rg = document.createRange(); rg.selectNodeContents(t);
    var one = rg.getBoundingClientRect().width;          // single-line text width
    t.style.whiteSpace = ws; t.style.maxWidth = "";
    if (!(one > 0)) return;
    // widest of: just over half the line (→ two lines), grown until a hidden
    // copy at that width really sits on two lines
    var probe = t.cloneNode(true);
    probe.style.cssText = "position:absolute;visibility:hidden;pointer-events:none;left:0;top:0;max-width:none;margin:0";
    t.parentNode.appendChild(probe);
    var lh = parseFloat(getComputedStyle(t).lineHeight) || 50, f = 0.56, w;
    do { w = Math.ceil(one * f); probe.style.width = w + "px"; f += 0.04; }
    while (probe.getBoundingClientRect().height > lh * 2.5 && f < 1);
    probe.parentNode.removeChild(probe);
    t.style.maxWidth = w + "px";
  }

  /* ---- stagger the expanded content in ---- */
  function reveal(card) {
    if (reduce || !card.animate) return;
    var parts = card.querySelectorAll(".hlab-tm2-eyebrow, .hlab-tm2-title, .hlab-tm2-body, .hlab-tm2-cta");
    for (var i = 0; i < parts.length; i++) {
      parts[i].animate(
        [{ opacity: 0, transform: "translateY(30px)" }, { opacity: 1, transform: "translateY(0)" }],
        { duration: 900, delay: 150 + i * 120, easing: EASE, fill: "backwards" }
      );
    }
  }

  function onOpenChange(card) {
    fitTitle(card);
    if (card.classList.contains("hlab-is-open")) { reveal(card); setNotch(card, 0, true); }
  }

  var mo = new MutationObserver(function (muts) {
    for (var i = 0; i < muts.length; i++) {
      var c = muts[i].target;
      if (c.classList.contains("hlab-tm2-panel")) {           // a tab was shown: size its open card
        if (c.classList.contains("hlab-is-on")) Array.prototype.forEach.call(c.querySelectorAll(".hlab-tm2-card"), fitTitle);
        continue;
      }
      var was = (muts[i].oldValue || "").indexOf("hlab-is-open") > -1;
      if (was !== c.classList.contains("hlab-is-open")) onOpenChange(c);
    }
  });
  Array.prototype.forEach.call(root.querySelectorAll(".hlab-tm2-panel"), function (p) {
    mo.observe(p, { attributes: true, attributeFilter: ["class"] });
  });
  cards.forEach(function (c) {
    mo.observe(c, { attributes: true, attributeFilter: ["class"], attributeOldValue: true });
    fitTitle(c);
  });
  var rz = 0;
  window.addEventListener("resize", function () {
    if (rz) return;
    rz = requestAnimationFrame(function () { rz = 0; cards.forEach(fitTitle); });
  }, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { cards.forEach(fitTitle); });

  /* ---- hover notch on collapsed cards (TI: 20px deep, follows the cursor) ---- */
  var DEPTH = 20, SIZE = 0.3, EDGE = SIZE / 2 + 0.12, DAMP = 6;
  function notchPath(w, h, pos, off) {
    var cy = pos * h, inner = h * 0.115, ramp = off * 2.5, outer = inner + ramp;
    var x = w - off;
    return "path('M0,0 H" + w + " V" + (cy - outer).toFixed(1) +
      " C" + w + "," + (cy - outer + ramp * 0.55).toFixed(1) + " " + x.toFixed(1) + "," + (cy - inner - ramp * 0.55).toFixed(1) + " " + x.toFixed(1) + "," + (cy - inner).toFixed(1) +
      " V" + (cy + inner).toFixed(1) +
      " C" + x.toFixed(1) + "," + (cy + inner + ramp * 0.55).toFixed(1) + " " + w + "," + (cy + outer - ramp * 0.55).toFixed(1) + " " + w + "," + (cy + outer).toFixed(1) +
      " V" + h + " H0 Z')";
  }
  function setNotch(card, off, reset) {
    var s = card.__tm || (card.__tm = { pos: 0.6, target: 0.6, off: 0, to: 0, t0: 0, from: 0 });
    if (reset) { s.off = s.to = s.from = 0; card.style.clipPath = ""; return; }
    s.from = s.off; s.to = off; s.t0 = performance.now();
    kick();
  }
  var raf = 0, last = 0;
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(now) {
    raf = 0;
    var dt = Math.min((now - last) / 1000, 0.05); last = now;
    var busy = false;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i], s = c.__tm;
      if (!s) continue;
      var k = Math.min((now - s.t0) / 500, 1), e = 1 - (1 - k) * (1 - k);   // .5s power2.out
      s.off = s.from + (s.to - s.from) * e;
      s.pos += (s.target - s.pos) * (1 - Math.exp(-DAMP * dt));
      if (k < 1 || Math.abs(s.target - s.pos) > 0.001) busy = true;
      if (s.off < 0.05 || c.classList.contains("hlab-is-open")) { c.style.clipPath = ""; continue; }
      c.style.clipPath = notchPath(c.offsetWidth, c.offsetHeight, s.pos, s.off);
    }
    if (busy) raf = requestAnimationFrame(tick);
  }
  if (!reduce) {
    cards.forEach(function (c) {
      c.addEventListener("pointerenter", function (e) {
        if (!finePointer.matches || !desktop.matches || c.classList.contains("hlab-is-open")) return;
        var s = c.__tm || (c.__tm = { pos: 0.6, target: 0.6, off: 0, to: 0, t0: 0, from: 0 });
        var r = c.getBoundingClientRect();
        s.pos = s.target = EDGE + (1 - 2 * EDGE) * Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
        setNotch(c, DEPTH);
      });
      c.addEventListener("pointermove", function (e) {
        var s = c.__tm;
        if (!s || !s.to) return;
        var r = c.getBoundingClientRect();
        s.target = EDGE + (1 - 2 * EDGE) * Math.max(0, Math.min(1, (e.clientY - r.top) / r.height));
        kick();
      });
      c.addEventListener("pointerleave", function () { if (c.__tm) setNotch(c, 0); });
    });
  }
})();

})();
