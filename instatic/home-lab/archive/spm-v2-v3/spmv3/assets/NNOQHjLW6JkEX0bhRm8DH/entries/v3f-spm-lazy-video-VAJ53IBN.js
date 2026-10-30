// src/scripts/v3f-spm-lazy-video.js
(function() {
  var STICKY_SRC = "/uploads/pwm0R9gjqZcCImaFfu_KQ-8865787-hd_1920_1080_25fps.mp4";
  var vids = Array.prototype.slice.call(document.querySelectorAll(".v3f-ti-sticky-vid, video[data-src]"));
  if (!vids.length) return;
  vids.forEach(function(v) {
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("preload", "none");
    if (!v.dataset.src) v.dataset.src = v.classList.contains("v3f-ti-sticky-vid") ? STICKY_SRC : "";
  });
  function load(v) {
    if (!v.getAttribute("src") && v.dataset.src) {
      v.preload = "auto";
      v.src = v.dataset.src;
      try {
        v.load();
      } catch (e) {
      }
      var p = v.play();
      if (p && p.catch) p.catch(function() {
      });
    }
  }
  if (!("IntersectionObserver" in window)) {
    vids.forEach(load);
    return;
  }
  var lead = Math.max(1200, Math.round((window.innerHeight || 800) * 1.5));
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        load(e.target);
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: lead + "px 0px" });
  vids.forEach(function(v) {
    io.observe(v);
  });
})();
