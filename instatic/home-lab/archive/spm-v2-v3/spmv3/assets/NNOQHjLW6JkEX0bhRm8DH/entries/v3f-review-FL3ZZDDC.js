// src/scripts/v3f-review.js
(function() {
  var sec = document.querySelector(".v3f-spm-review");
  if (!sec) return;
  var frame = sec.querySelector(".v3f-spm-review-frame");
  var layer = sec.querySelector(".v3f-spm-review-scale");
  var inner = sec.querySelector(".v3f-spm-review-inner");
  if (!frame || !layer) return;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)");
  var BASE = "/uploads/t0ER5RMTjn_NJxCsKJb7R-4552";
  if (!layer.querySelector(".v3f-rv-img")) {
    var img = new Image();
    img.className = "v3f-rv-img";
    img.alt = "";
    img.decoding = "async";
    img.loading = "lazy";
    img.setAttribute("aria-hidden", "true");
    img.sizes = "(max-aspect-ratio: 16/9) calc(100vh * 2), 116vw";
    img.srcset = BASE + "-w640.webp 640w, " + BASE + "-w1024.webp 1024w, " + BASE + ".avif 1500w";
    img.src = BASE + "-w1024.webp";
    img.addEventListener("load", function() {
      sec.classList.add("v3f-rv-loaded");
    });
    layer.appendChild(img);
    if (img.complete && img.naturalWidth) sec.classList.add("v3f-rv-loaded");
  }
  sec.classList.add("v3f-rv");
  function notchPath(w, h, top, bot) {
    var span = w * 0.65, x0 = (w - span) / 2, x1 = x0 + span;
    var ramp = Math.min(w < 768 ? 44 : 70, span / 4), k = ramp * 0.5;
    var f = function(n) {
      return n.toFixed(1);
    };
    var d = "M0,0 ";
    if (top > 0.2) {
      d += "H" + f(x0) + " C" + f(x0 + k) + ",0 " + f(x0 + ramp - k) + "," + f(top) + " " + f(x0 + ramp) + "," + f(top) + " H" + f(x1 - ramp) + " C" + f(x1 - ramp + k) + "," + f(top) + " " + f(x1 - k) + ",0 " + f(x1) + ",0 ";
    }
    d += "H" + f(w) + " V" + f(h) + " ";
    if (bot > 0.2) {
      var y = h - bot;
      d += "H" + f(x1) + " C" + f(x1 - k) + "," + f(h) + " " + f(x1 - ramp + k) + "," + f(y) + " " + f(x1 - ramp) + "," + f(y) + " H" + f(x0 + ramp) + " C" + f(x0 + ramp - k) + "," + f(y) + " " + f(x0 + k) + "," + f(h) + " " + f(x0) + "," + f(h) + " ";
    }
    return "path('" + d + "H0 Z')";
  }
  var visible = false, raf = 0;
  var tx = 0, ty = 0, cx = 0, cy = 0;
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }
  function frameTick() {
    raf = 0;
    var r = frame.getBoundingClientRect(), vh = window.innerHeight || 800;
    var w = r.width, h = r.height, A = w < 768 ? 20 : 40;
    var pTop = clamp((vh - r.top) / vh, 0, 1);
    var pBot = clamp((vh - r.bottom) / vh, 0, 1);
    var top = reduce ? A * 0.5 : pTop * A, bot = reduce ? A * 0.5 : (1 - pBot) * A;
    frame.style.clipPath = notchPath(w, h, top, bot);
    if (!reduce) {
      var pass = clamp((vh - r.top) / (vh + h), 0, 1);
      var par = (pass * 2 - 1) * 0.08 * h;
      var zoom = 1.05 - 0.05 * Math.min(1, pass * 2);
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      layer.style.transform = "translate3d(" + (-cx * 14).toFixed(2) + "px," + (par - cy * 10).toFixed(2) + "px,0) scale(" + zoom.toFixed(4) + ")";
      if (inner) inner.style.transform = "perspective(1200px) rotateX(" + (-cy * 3).toFixed(2) + "deg) rotateY(" + (cx * 4).toFixed(2) + "deg) translate3d(" + (cx * 8).toFixed(2) + "px," + (cy * 6).toFixed(2) + "px,0)";
      if (visible && (Math.abs(tx - cx) > 2e-3 || Math.abs(ty - cy) > 2e-3)) raf = requestAnimationFrame(frameTick);
    }
  }
  function kick() {
    if (!raf && visible) raf = requestAnimationFrame(frameTick);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function(es) {
      es.forEach(function(e) {
        visible = e.isIntersecting;
        if (visible) kick();
      });
    }, { rootMargin: "100px 0px" }).observe(frame);
    new IntersectionObserver(function(es, io) {
      es.forEach(function(e) {
        if (e.isIntersecting) {
          sec.classList.add("v3f-rv-in");
          io.disconnect();
        }
      });
    }, { threshold: 0.35 }).observe(frame);
  } else {
    visible = true;
    sec.classList.add("v3f-rv-in");
  }
  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick, { passive: true });
  if (!reduce) {
    frame.addEventListener("pointermove", function(e) {
      if (!fine.matches) return;
      var r = frame.getBoundingClientRect();
      tx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1, 1);
      ty = clamp((e.clientY - r.top) / r.height * 2 - 1, -1, 1);
      kick();
    });
    frame.addEventListener("pointerleave", function() {
      tx = ty = 0;
      kick();
    });
  }
  kick();
})();
