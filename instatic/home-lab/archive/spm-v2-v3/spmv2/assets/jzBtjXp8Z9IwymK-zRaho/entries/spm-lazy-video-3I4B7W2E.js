// src/scripts/spm-lazy-video.js
(function() {
  var STICKY_SRC = "/uploads/Yq7DXEItD-Ubndh8550s--7659792-uhd_3840_2160_25fps.mp4";
  var vids = Array.prototype.slice.call(document.querySelectorAll(".ti-sticky-vid, video[data-src]"));
  if (!vids.length) return;
  vids.forEach(function(v) {
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("preload", "none");
    if (!v.dataset.src) v.dataset.src = v.classList.contains("ti-sticky-vid") ? STICKY_SRC : "";
  });
  function load(v) {
    if (!v.getAttribute("src") && v.dataset.src) {
      v.src = v.dataset.src;
      var p = v.play();
      if (p && p.catch) p.catch(function() {
      });
    }
  }
  if (!("IntersectionObserver" in window)) {
    vids.forEach(load);
    return;
  }
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        load(e.target);
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: "200px" });
  vids.forEach(function(v) {
    io.observe(v);
  });
})();
