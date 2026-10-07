(function () {
  var root = document.querySelector('.hlab-ti-root');
  if (!root || window.self !== window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname)) return;

  root.classList.add('hlab-ti-anim');

  /* ---------- Scroll reveals ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var d = e.target.getAttribute('data-delay');
        if (d) e.target.style.transitionDelay = d + 'ms';
        e.target.classList.add('hlab-ti-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    root.querySelectorAll('.hlab-ti-reveal').forEach(function (el) { io.observe(el); });
  } else {
    root.querySelectorAll('.hlab-ti-reveal').forEach(function (el) { el.classList.add('hlab-ti-in'); });
  }

  /* ---------- Sticky story: fade features in/out around viewport center ---------- */
  var feats = root.querySelectorAll('.hlab-ti-feature.hlab-ti-fade');
  if (feats.length) {
    var featTick = false;
    function updateFeats() {
      featTick = false;
      var vh = window.innerHeight;
      for (var i = 0; i < feats.length; i++) {
        var r = feats[i].getBoundingClientRect();
        var center = r.top + r.height / 2;
        var dist = Math.abs(center - vh / 2);
        if (dist < vh * 0.38) feats[i].classList.add('hlab-ti-active');
        else feats[i].classList.remove('hlab-ti-active');
      }
    }
    function onFeatScroll() {
      if (!featTick) { featTick = true; window.requestAnimationFrame(updateFeats); }
    }
    window.addEventListener('scroll', onFeatScroll, { passive: true });
    window.addEventListener('resize', onFeatScroll);
    updateFeats();
  }

  /* ---------- ROI calculator (économies vs recrutement interne) ---------- */
  var calc = root.querySelector('.hlab-ti-calc');
  if (calc) {
    var fields = calc.querySelectorAll('.hlab-ti-fields input');
    var agents = fields[0], cost = fields[1], hours = fields[2], days = fields[3];
    var slider = calc.querySelector('.hlab-ti-range');
    var fill = slider && slider.querySelector('.hlab-ti-range-fill');
    var thumb = slider && slider.querySelector('.hlab-ti-range-thumb');
    var effOut = calc.querySelector('[data-out="eff"]');
    var ratioOut = calc.querySelector('[data-out="ratio"]');
    var total = calc.querySelector('[data-out="total"]');
    var rSal = calc.querySelector('[data-out="detention"]');
    var rRec = calc.querySelector('[data-out="labor"]');
    var rInf = calc.querySelector('[data-out="throughput"]');

    var eMin = slider ? parseFloat(slider.getAttribute('data-min')) || 10 : 10;
    var eMax = slider ? parseFloat(slider.getAttribute('data-max')) || 100 : 100;
    var eff = slider ? parseFloat(slider.getAttribute('data-val')) || 60 : 60;

    var money = function (n) { return Math.round(n).toLocaleString('fr-FR') + ' €'; };
    function num(el, fb) { var v = parseFloat(el && el.value); return isNaN(v) ? fb : v; }

    function recompute() {
      var a = num(agents, 20), c = num(cost, 3200), h = num(hours, 40), d = num(days, 5);
      var part = eff / 100;
      var cov = Math.max(0.4, (h / 40) * (d / 5));
      var annualPayroll = a * c * 12;
      var masse = annualPayroll * part * 0.30 * cov;
      var recrutement = a * 4200 * part;
      var infra = a * 2800 * part * cov;
      var sum = masse + recrutement + infra;
      var ratio = annualPayroll > 0 ? Math.min(60, sum / annualPayroll * 100) : 0;
      if (effOut) effOut.textContent = Math.round(eff) + ' %';
      if (ratioOut) ratioOut.textContent = Math.round(ratio) + ' %';
      if (rSal) rSal.textContent = money(masse);
      if (rRec) rRec.textContent = money(recrutement);
      if (rInf) rInf.textContent = money(infra);
      if (total) total.textContent = money(sum);
    }
    function paint() {
      var pct = (eff - eMin) / (eMax - eMin) * 100;
      if (fill) fill.style.width = pct + '%';
      if (thumb) thumb.style.left = pct + '%';
    }
    function setEff(v) {
      eff = Math.max(eMin, Math.min(eMax, Math.round(v)));
      if (slider) slider.setAttribute('aria-valuenow', eff);
      paint();
      recompute();
    }

    [agents, cost, hours, days].forEach(function (el) {
      if (el) { el.addEventListener('input', recompute); el.addEventListener('change', recompute); }
    });

    if (slider) {
      var sdown = false;
      var fromX = function (x) { var r = slider.getBoundingClientRect(); return eMin + ((x - r.left) / r.width) * (eMax - eMin); };
      slider.addEventListener('pointerdown', function (e) { sdown = true; try { slider.setPointerCapture(e.pointerId); } catch (err) {} setEff(fromX(e.clientX)); });
      slider.addEventListener('pointermove', function (e) { if (sdown) setEff(fromX(e.clientX)); });
      slider.addEventListener('pointerup', function () { sdown = false; });
      slider.addEventListener('pointercancel', function () { sdown = false; });
      slider.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { setEff(eff - 1); e.preventDefault(); }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { setEff(eff + 1); e.preventDefault(); }
      });
    }

    paint();
    recompute();
  }

  /* ---------- Carousel ---------- */
  var car = root.querySelector('.hlab-ti-carousel-outer');
  if (car) {
    var track = car.querySelector('.hlab-ti-carousel');
    var bar = car.querySelector('.hlab-ti-car-bar');
    var prev = car.querySelector('[data-car="prev"]');
    var next = car.querySelector('[data-car="next"]');

    function step() {
      var first = track.querySelector('.hlab-ti-slide');
      if (!first) return track.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 20) || 20;
      return first.getBoundingClientRect().width + gap;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var ratio = max > 0 ? track.scrollLeft / max : 0;
      if (bar) {
        var vis = Math.max(0.12, track.clientWidth / track.scrollWidth);
        bar.style.width = (vis * 100) + '%';
        bar.style.transform = 'translateX(' + (ratio * (100 / vis - 100)) + '%)';
      }
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
    }
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', function () { window.requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);

    var down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener('pointerdown', function (e) {
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
      track.classList.add('hlab-ti-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false; track.classList.remove('hlab-ti-dragging');
    });
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

    update();
  }
})();
