/* Homepage: mark sections on screen (spm-vis) so ambient animations run only when visible */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('spm-vis', e.isIntersecting); });
  }, { rootMargin: '80px 0px' });
  document.querySelectorAll('.hlab-ti-sec').forEach(function (s) { io.observe(s); });
})();
