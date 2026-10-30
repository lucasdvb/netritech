/* Sept problèmes (GetLayers stride-works): pinned stage, cards on a 3D cylinder driven by scroll */
(function () {
  var root = document.querySelector('[data-w7]');
  if (!root) return;
  var sec = root.closest('section'), stick = root.querySelector('.spm-w7-stick');
  var cards = [].slice.call(root.querySelectorAll('.spm-w7-c')), glows = [].slice.call(root.querySelectorAll('.spm-w7-glow'));
  var dots = [].slice.call(root.querySelectorAll('.spm-w7-dot'));
  var idxEl = root.querySelector('.spm-w7-idx b'), nameEl = root.querySelector('.spm-w7-name');
  var n = cards.length, STEP = 26, OVER = 0.2, PER = 52; // deg between cards, overscan, vh of scroll per card
  var R = 1000, cur = 0, idx = -1, raf = 0, near = false, on = false;
  if (sec) sec.classList.add('spm-w7-sec');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // static stack
  root.classList.add('is-on');

  function measure() {
    root.style.height = (100 + (n - 1) * PER) + 'vh';
    var h = Math.max.apply(null, cards.map(function (c) { return c.offsetHeight; })) || 400;
    R = (h * 1.14) / Math.sin(STEP * Math.PI / 180); // neighbours sit just clear of the focused card
  }
  function pad(i) { return (i < 9 ? '0' : '') + (i + 1); }
  function setIdx(i) {
    if (i === idx) return;
    idx = i;
    cards.forEach(function (c, k) { c.classList.toggle('is-focus', k === i); });
    dots.forEach(function (d, k) { d.classList.toggle('is-on', k === i); });
    if (idxEl) idxEl.textContent = pad(i);
    if (nameEl) {
      nameEl.classList.add('is-swap');
      setTimeout(function () { nameEl.textContent = cards[i].getAttribute('data-name'); nameEl.classList.remove('is-swap'); }, 180);
    }
  }
  function target() {
    var total = root.offsetHeight - stick.offsetHeight;
    var p = Math.min(Math.max(-root.getBoundingClientRect().top / Math.max(1, total), 0), 1);
    return p * (n - 1 + OVER * 2) - OVER;
  }
  function dwell(v) {           // ease between whole indices so each card rests at the centre
    var f = Math.floor(v), t = v - f;
    t = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    return f + t;
  }
  function frame(raw) {
    var v = dwell(raw);
    for (var i = 0; i < n; i++) {
      var rel = i - v, d = Math.abs(rel), rad = rel * STEP * Math.PI / 180;
      var y = R * Math.sin(rad), z = R * Math.cos(rad) - R;
      var op = d > 2.6 ? 0 : Math.max(0, 1 - d * (rel < 0 ? 1.25 : 0.32)); // cards leaving upward fade fast, clear of the heading
      cards[i].style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,' + z.toFixed(1) + 'px) rotateX(' + (-rel * STEP).toFixed(2) + 'deg) translate(-50%,-50%)';
      cards[i].style.opacity = op.toFixed(3);
      cards[i].style.visibility = op > 0 ? 'visible' : 'hidden';
      cards[i].style.pointerEvents = d < 1.5 ? 'auto' : 'none';
      cards[i].querySelector('.spm-w7-ci').style.setProperty('--scrim', Math.min(0.55, d * 0.4).toFixed(3));
      if (glows[i]) {
        glows[i].style.visibility = d < 1 ? 'visible' : 'hidden';
        glows[i].style.opacity = Math.max(0, 1 - d).toFixed(3);
        glows[i].style.transform = 'translate3d(' + (rel * -6).toFixed(1) + '%,' + (rel * 18).toFixed(1) + '%,0) scale(' + (1 + d * 0.15).toFixed(3) + ')';
      }
    }
    setIdx(Math.min(n - 1, Math.max(0, Math.round(v))));
  }
  function tick() {
    raf = 0;
    var t = target();
    cur += (t - cur) * 0.14;
    if (Math.abs(t - cur) < 0.0008) cur = t;
    frame(cur);
    if (near && cur !== t) raf = requestAnimationFrame(tick);
  }
  function kick() { if (near && !raf) raf = requestAnimationFrame(tick); }

  // jump to a solution (dot or neighbouring card)
  function go(i) {
    var total = root.offsetHeight - stick.offsetHeight;
    var p = (i + OVER) / (n - 1 + OVER * 2);
    var y = window.scrollY + root.getBoundingClientRect().top + p * total;
    window.scrollTo({ top: Math.round(y), behavior: 'smooth' });
  }
  dots.forEach(function (d) { d.addEventListener('click', function () { go(+d.getAttribute('data-i')); }); });
  cards.forEach(function (c, i) {
    c.addEventListener('click', function (e) { if (i !== idx) { e.preventDefault(); go(i); } });
    // focused card: soft light follows the pointer, slight tilt, numeral drifts
    var inner = c.querySelector('.spm-w7-ci'), pr = 0;
    c.addEventListener('pointermove', function (e) {
      if (i !== idx || e.pointerType === 'touch') return;
      var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      if (pr) return;
      pr = requestAnimationFrame(function () {
        pr = 0;
        inner.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        inner.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        inner.style.setProperty('--ry', ((px - 0.5) * 6).toFixed(2) + 'deg');
        inner.style.setProperty('--rx', ((0.5 - py) * 5).toFixed(2) + 'deg');
        var num = inner.querySelector('.spm-w7-n');
        if (num) { num.style.setProperty('--nx', ((px - 0.5) * -26).toFixed(1) + 'px'); num.style.setProperty('--ny', ((py - 0.5) * -16).toFixed(1) + 'px'); }
      });
    });
    c.addEventListener('pointerleave', function () {
      ['--mx', '--my', '--rx', '--ry'].forEach(function (p) { inner.style.removeProperty(p); });
      var num = inner.querySelector('.spm-w7-n'); if (num) { num.style.removeProperty('--nx'); num.style.removeProperty('--ny'); }
    });
  });

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', function () { measure(); cur = target(); frame(cur); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { near = es[0].isIntersecting; if (near) { cur = target(); frame(cur); kick(); } }, { rootMargin: '200px 0px' }).observe(root);
  } else near = true;
  measure(); cur = target(); frame(cur);
})();
