// src/scripts/v3f-sections.js
(function() {
  if (!/^\/spmv3(\/|\.html)?$/.test(location.pathname) && window.self === window.top) return;
  var root = document.querySelector(".v3f-ti-root");
  if (!root) return;
  root.classList.add("v3f-ti-anim");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (!e.isIntersecting) return;
        var d = e.target.getAttribute("data-delay");
        if (d) e.target.style.transitionDelay = d + "ms";
        e.target.classList.add("v3f-ti-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    root.querySelectorAll(".v3f-ti-reveal").forEach(function(el) {
      io.observe(el);
    });
  } else {
    root.querySelectorAll(".v3f-ti-reveal").forEach(function(el) {
      el.classList.add("v3f-ti-in");
    });
  }
  var feats = root.querySelectorAll(".v3f-ti-feature.v3f-ti-fade");
  if (feats.length) {
    let updateFeats2 = function() {
      featTick = false;
      var vh = window.innerHeight;
      for (var i = 0; i < feats.length; i++) {
        var r = feats[i].getBoundingClientRect();
        var center = r.top + r.height / 2;
        var dist = Math.abs(center - vh / 2);
        if (dist < vh * 0.38) feats[i].classList.add("v3f-ti-active");
        else feats[i].classList.remove("v3f-ti-active");
      }
    }, onFeatScroll2 = function() {
      if (!featTick) {
        featTick = true;
        window.requestAnimationFrame(updateFeats2);
      }
    };
    var updateFeats = updateFeats2, onFeatScroll = onFeatScroll2;
    var featTick = false;
    window.addEventListener("scroll", onFeatScroll2, { passive: true });
    window.addEventListener("resize", onFeatScroll2);
    updateFeats2();
  }
  var calc = root.querySelector(".v3f-ti-calc");
  if (calc) {
    let num2 = function(el, fb) {
      var v = parseFloat(el && el.value);
      return isNaN(v) ? fb : v;
    }, recompute2 = function() {
      var a = num2(agents, 20), c = num2(cost, 3200), h = num2(hours, 40), d = num2(days, 5);
      var part = eff / 100;
      var cov = Math.max(0.4, h / 40 * (d / 5));
      var annualPayroll = a * c * 12;
      var masse = annualPayroll * part * 0.3 * cov;
      var recrutement = a * 4200 * part;
      var infra = a * 2800 * part * cov;
      var sum = masse + recrutement + infra;
      var ratio = annualPayroll > 0 ? Math.min(60, sum / annualPayroll * 100) : 0;
      if (effOut) effOut.textContent = Math.round(eff) + " %";
      if (ratioOut) ratioOut.textContent = Math.round(ratio) + " %";
      if (rSal) rSal.textContent = money(masse);
      if (rRec) rRec.textContent = money(recrutement);
      if (rInf) rInf.textContent = money(infra);
      if (total) total.textContent = money(sum);
    }, paint2 = function() {
      var pct = (eff - eMin) / (eMax - eMin) * 100;
      if (fill) fill.style.width = pct + "%";
      if (thumb) thumb.style.left = pct + "%";
    }, setEff2 = function(v) {
      eff = Math.max(eMin, Math.min(eMax, Math.round(v)));
      if (slider) slider.setAttribute("aria-valuenow", eff);
      paint2();
      recompute2();
    };
    var num = num2, recompute = recompute2, paint = paint2, setEff = setEff2;
    var fields = calc.querySelectorAll(".v3f-ti-fields input");
    var agents = fields[0], cost = fields[1], hours = fields[2], days = fields[3];
    var slider = calc.querySelector(".v3f-ti-range");
    var fill = slider && slider.querySelector(".v3f-ti-range-fill");
    var thumb = slider && slider.querySelector(".v3f-ti-range-thumb");
    var effOut = calc.querySelector('[data-out="eff"]');
    var ratioOut = calc.querySelector('[data-out="ratio"]');
    var total = calc.querySelector('[data-out="total"]');
    var rSal = calc.querySelector('[data-out="detention"]');
    var rRec = calc.querySelector('[data-out="labor"]');
    var rInf = calc.querySelector('[data-out="throughput"]');
    var eMin = slider ? parseFloat(slider.getAttribute("data-min")) || 10 : 10;
    var eMax = slider ? parseFloat(slider.getAttribute("data-max")) || 100 : 100;
    var eff = slider ? parseFloat(slider.getAttribute("data-val")) || 60 : 60;
    var money = function(n) {
      return Math.round(n).toLocaleString("fr-FR") + " \u20AC";
    };
    [agents, cost, hours, days].forEach(function(el) {
      if (el) {
        el.addEventListener("input", recompute2);
        el.addEventListener("change", recompute2);
      }
    });
    if (slider) {
      var sdown = false;
      var fromX = function(x) {
        var r = slider.getBoundingClientRect();
        return eMin + (x - r.left) / r.width * (eMax - eMin);
      };
      slider.addEventListener("pointerdown", function(e) {
        sdown = true;
        try {
          slider.setPointerCapture(e.pointerId);
        } catch (err) {
        }
        setEff2(fromX(e.clientX));
      });
      slider.addEventListener("pointermove", function(e) {
        if (sdown) setEff2(fromX(e.clientX));
      });
      slider.addEventListener("pointerup", function() {
        sdown = false;
      });
      slider.addEventListener("pointercancel", function() {
        sdown = false;
      });
      slider.addEventListener("keydown", function(e) {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          setEff2(eff - 1);
          e.preventDefault();
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          setEff2(eff + 1);
          e.preventDefault();
        }
      });
    }
    paint2();
    recompute2();
  }
  var car = root.querySelector(".v3f-ti-carousel-outer");
  if (car) {
    let step2 = function() {
      var first = track.querySelector(".v3f-ti-slide");
      if (!first) return track.clientWidth * 0.8;
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap || 20) || 20;
      return first.getBoundingClientRect().width + gap;
    }, update2 = function() {
      var max = track.scrollWidth - track.clientWidth;
      var ratio = max > 0 ? track.scrollLeft / max : 0;
      if (bar) {
        var vis = Math.max(0.12, track.clientWidth / track.scrollWidth);
        bar.style.width = vis * 100 + "%";
        bar.style.transform = "translateX(" + ratio * (100 / vis - 100) + "%)";
      }
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
    };
    var step = step2, update = update2;
    var track = car.querySelector(".v3f-ti-carousel");
    var bar = car.querySelector(".v3f-ti-car-bar");
    var prev = car.querySelector('[data-car="prev"]');
    var next = car.querySelector('[data-car="next"]');
    if (prev) prev.addEventListener("click", function() {
      track.scrollBy({ left: -step2(), behavior: "smooth" });
    });
    if (next) next.addEventListener("click", function() {
      track.scrollBy({ left: step2(), behavior: "smooth" });
    });
    track.addEventListener("scroll", function() {
      window.requestAnimationFrame(update2);
    }, { passive: true });
    window.addEventListener("resize", update2);
    var down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener("pointerdown", function(e) {
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = track.scrollLeft;
      track.classList.add("v3f-ti-dragging");
    });
    window.addEventListener("pointermove", function(e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startLeft - dx;
    });
    window.addEventListener("pointerup", function() {
      if (!down) return;
      down = false;
      track.classList.remove("v3f-ti-dragging");
    });
    track.addEventListener("click", function(e) {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, true);
    update2();
  }
})();
