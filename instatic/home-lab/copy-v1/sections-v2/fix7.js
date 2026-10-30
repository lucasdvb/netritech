/* Sept problèmes: pin the section and pan the card track with scroll (desktop); swipe row elsewhere */
(function () {
  var vp = document.querySelector('[data-s7]');
  if (!vp) return;
  var sec = vp.closest('section'), pin = sec.querySelector('.spm-s7-pin'), track = vp.querySelector('.spm-s7-track');
  var cards = [].slice.call(track.children), fill = sec.querySelector('.spm-s7-fill'), count = sec.querySelector('.spm-s7-count b');
  sec.classList.add('spm-s7-sec');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mq = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
  var dist = 0, cur = 0, target = 0, raf = 0, on = false, centers = [], last = -1;

  function setCount(i) { if (i !== last && count) { last = i; count.textContent = (i < 9 ? '0' : '') + (i + 1); } }
  function measure() {
    on = mq.matches && !reduce;
    sec.classList.toggle('is-pin', on);
    track.style.transform = '';
    cards.forEach(function (c) { c.style.removeProperty('--s7y'); c.style.removeProperty('--s7s'); c.style.removeProperty('--s7o'); });
    if (!on) { sec.style.height = ''; return; }
    dist = Math.max(0, track.scrollWidth - vp.clientWidth);
    sec.style.height = (window.innerHeight + dist) + 'px';
    centers = cards.map(function (c) { return c.offsetLeft + c.offsetWidth / 2; });
    onScroll();
  }
  function apply(x) {
    track.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
    var mid = vp.clientWidth / 2, w = vp.clientWidth, best = 0, bd = 1e9;
    cards.forEach(function (c, i) {
      var d = (centers[i] - x - mid) / w;          // -0.5..0.5 inside the view
      var k = Math.min(1, Math.max(0, d - 0.34) / 0.4); // only cards still entering from the right recede
      c.style.setProperty('--s7s', (1 - k * 0.07).toFixed(3));
      c.style.setProperty('--s7y', (k * 26).toFixed(1) + 'px');
      c.style.setProperty('--s7o', (1 - k * 0.45).toFixed(3));
      var ad = Math.abs(d + 0.25); if (ad < bd) { bd = ad; best = i; }
    });
    var p = dist ? x / dist : 0;
    if (fill) fill.style.setProperty('--s7p', (0.14 + p * 0.86).toFixed(3));
    setCount(p > 0.985 ? cards.length - 1 : best);
  }
  function tick() {
    cur += (target - cur) * 0.12;
    if (Math.abs(target - cur) < 0.3) cur = target;
    apply(cur);
    raf = cur !== target ? requestAnimationFrame(tick) : 0;
  }
  function onScroll() {
    if (!on) return;
    var top = sec.getBoundingClientRect().top;
    target = Math.min(dist, Math.max(0, -top));
    if (!raf) raf = requestAnimationFrame(tick);
  }
  // swipe mode: keep the bar and counter in step with the native scroll
  vp.addEventListener('scroll', function () {
    if (on) return;
    var max = vp.scrollWidth - vp.clientWidth, p = max > 0 ? vp.scrollLeft / max : 0;
    if (fill) fill.style.setProperty('--s7p', (0.14 + p * 0.86).toFixed(3));
    setCount(Math.round(p * (cards.length - 1)));
  }, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { clearTimeout(measure.t); measure.t = setTimeout(measure, 150); });
  if (mq.addEventListener) mq.addEventListener('change', measure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  measure();
})();
