/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]') || window.self !== window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname)) return;
(function () {
  // Instatic strips <video> attributes on insert, so we set src + flags here and lazy-load.
  var STICKY_SRC = '/uploads/pwm0R9gjqZcCImaFfu_KQ-8865787-hd_1920_1080_25fps.mp4';
  var vids = Array.prototype.slice.call(document.querySelectorAll('.hlab-ti-sticky-vid, video[data-src]'));
  if (!vids.length) return;
  vids.forEach(function (v) {
    v.muted = true; v.loop = true; v.playsInline = true;
    v.setAttribute('playsinline', ''); v.setAttribute('preload', 'none');
    if (!v.dataset.src) v.dataset.src = v.classList.contains('hlab-ti-sticky-vid') ? STICKY_SRC : '';
  });
  function load(v) {
    if (!v.getAttribute('src') && v.dataset.src) {
      v.preload = 'auto';                 // buffer aggressively once we commit to loading
      v.src = v.dataset.src;
      try { v.load(); } catch (e) {}
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
  }
  if (!('IntersectionObserver' in window)) { vids.forEach(load); return; }
  // Start fetching ~1.5 screens early so the clip is buffered before it scrolls into view.
  var lead = Math.max(1200, Math.round((window.innerHeight || 800) * 1.5));
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { load(e.target); io.unobserve(e.target); } });
  }, { rootMargin: lead + 'px 0px' });
  vids.forEach(function (v) { io.observe(v); });
})();

})();
