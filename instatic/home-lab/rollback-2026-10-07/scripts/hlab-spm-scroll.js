/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]') || window.self !== window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname)) return;
/* spm-scroll.js — Lenis-style momentum smoothing for the whole SPM page
   (page njpmPrypl8ZfTsjolUuHT). Real Lenis via CDN is CSP-blocked on this site,
   so this is a compact self-contained equivalent, tuned HEAVY for a premium,
   immersive "opening a product" feel. It now smooths the WebGL HERO too, so the
   cinematic beats glide past under weight instead of jumping per mouse-wheel notch.
   Self-contained -> CSP-safe. Fine-pointer, non-touch, motion-OK only.
   Frame-rate independent: LERP is per 60Hz frame, so 120/144Hz screens glide
   exactly like 60Hz ones instead of twice as fast.
   Kill switch: ?nosmooth in the URL, or window.__spmScroll.disable().
   Tune live: window.__spmScroll.setLerp(0.05..0.16)  lower = heavier / more glide
              window.__spmScroll.setMult(0.55..1.10)  lower = less travel per wheel notch */
(function () {
  try {
    if (/[?&]nosmooth\b/.test(location.search)) return;
    if (!window.matchMedia) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!matchMedia('(pointer:fine)').matches) return;            // touch / coarse -> native
    if (!('requestAnimationFrame' in window)) return;

    var se = document.scrollingElement || document.documentElement;
    var LERP = 0.10;                        // glide / weight (lower = heavier) — TI-matched
    var MULT = 1.0;                         // travel per wheel notch (TI wheelMultiplier 1)
    var target = window.scrollY, running = false, raf = 0, lastT = 0, pos = target;

    function maxY() { return Math.max(0, se.scrollHeight - window.innerHeight); }
    function frame(now) {
      var dt = lastT ? Math.min(Math.max((now - lastT) / 16.667, 0.25), 4) : 1;
      lastT = now;
      // track a sub-pixel position ourselves: scrollY may be rounded by the browser
      if (Math.abs(window.scrollY - pos) > 1.5) pos = window.scrollY;
      var next = pos + (target - pos) * (1 - Math.pow(1 - LERP, dt));
      if (Math.abs(target - next) < 0.5) { next = target; running = false; }
      pos = next;
      window.scrollTo(0, next);
      raf = running ? requestAnimationFrame(frame) : 0;
    }
    function nestedScrollable(node) {
      while (node && node !== document.body && node.nodeType === 1) {
        if (node.scrollHeight - node.clientHeight > 4) {
          var oy = getComputedStyle(node).overflowY;
          if (oy === 'auto' || oy === 'scroll') return true;
        }
        node = node.parentElement;
      }
      return false;
    }
    function onWheel(e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return; // zoom / handled
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;                     // horizontal intent
      if (nestedScrollable(e.target)) return;                                  // let inner scrollers scroll
      e.preventDefault();
      if (!running) { target = pos = window.scrollY; }                         // resync on (re)start
      var dm = e.deltaMode, k = dm === 1 ? 16 : dm === 2 ? window.innerHeight : 1;
      target = Math.max(0, Math.min(maxY(), target + e.deltaY * k * MULT));
      if (!running) { running = true; lastT = 0; raf = requestAnimationFrame(frame); }
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', function () { if (!running) target = pos = window.scrollY; }, { passive: true });
    window.addEventListener('resize', function () { target = pos = window.scrollY; });
    window.__spmScroll = {
      disable: function () { running = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener('wheel', onWheel); },
      setLerp: function (v) { LERP = Math.max(0.03, Math.min(0.5, +v || 0.085)); },
      setMult: function (v) { MULT = Math.max(0.3, Math.min(2, +v || 0.82)); }
    };
  } catch (err) { /* fail safe -> native scroll */ }
})();

})();
