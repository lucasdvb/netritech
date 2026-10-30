// src/scripts/v3f-spm-scroll.js
(function() {
  try {
    let maxY2 = function() {
      return Math.max(0, se.scrollHeight - window.innerHeight);
    }, frame2 = function(now) {
      var dt = lastT ? Math.min(Math.max((now - lastT) / 16.667, 0.25), 4) : 1;
      lastT = now;
      if (Math.abs(window.scrollY - pos) > 1.5) pos = window.scrollY;
      var next = pos + (target - pos) * (1 - Math.pow(1 - LERP, dt));
      if (Math.abs(target - next) < 0.5) {
        next = target;
        running = false;
      }
      pos = next;
      window.scrollTo(0, next);
      raf = running ? requestAnimationFrame(frame2) : 0;
    }, nestedScrollable2 = function(node) {
      while (node && node !== document.body && node.nodeType === 1) {
        if (node.scrollHeight - node.clientHeight > 4) {
          var oy = getComputedStyle(node).overflowY;
          if (oy === "auto" || oy === "scroll") return true;
        }
        node = node.parentElement;
      }
      return false;
    }, onWheel2 = function(e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (nestedScrollable2(e.target)) return;
      e.preventDefault();
      if (!running) {
        target = pos = window.scrollY;
      }
      var dm = e.deltaMode, k = dm === 1 ? 16 : dm === 2 ? window.innerHeight : 1;
      target = Math.max(0, Math.min(maxY2(), target + e.deltaY * k * MULT));
      if (!running) {
        running = true;
        lastT = 0;
        raf = requestAnimationFrame(frame2);
      }
    };
    var maxY = maxY2, frame = frame2, nestedScrollable = nestedScrollable2, onWheel = onWheel2;
    if (/[?&]nosmooth\b/.test(location.search)) return;
    if (!window.matchMedia) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!matchMedia("(pointer:fine)").matches) return;
    if (!("requestAnimationFrame" in window)) return;
    var se = document.scrollingElement || document.documentElement;
    var LERP = 0.1;
    var MULT = 1;
    var target = window.scrollY, running = false, raf = 0, lastT = 0, pos = target;
    window.addEventListener("wheel", onWheel2, { passive: false });
    window.addEventListener("scroll", function() {
      if (!running) target = pos = window.scrollY;
    }, { passive: true });
    window.addEventListener("resize", function() {
      target = pos = window.scrollY;
    });
    window.__spmScroll = {
      disable: function() {
        running = false;
        if (raf) cancelAnimationFrame(raf);
        window.removeEventListener("wheel", onWheel2);
      },
      setLerp: function(v) {
        LERP = Math.max(0.03, Math.min(0.5, +v || 0.085));
      },
      setMult: function(v) {
        MULT = Math.max(0.3, Math.min(2, +v || 0.82));
      }
    };
  } catch (err) {
  }
})();
