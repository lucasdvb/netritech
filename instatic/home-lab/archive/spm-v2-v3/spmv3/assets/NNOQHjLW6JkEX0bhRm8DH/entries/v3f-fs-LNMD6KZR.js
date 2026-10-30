// src/scripts/v3f-fs.js
(function() {
  var wrap = document.querySelector(".v3f-ti-intro .v3f-ti-sticky-wrap");
  if (!wrap) return;
  var list = wrap.querySelector(".v3f-ti-feature-list");
  var media = wrap.querySelector(".v3f-ti-sticky-media");
  if (!list || !media) return;
  var items = Array.prototype.slice.call(list.querySelectorAll(".v3f-ti-feature"));
  var N = items.length;
  if (N < 2) return;
  var mq = matchMedia("(max-width: 1024px)");
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cur = 0, seen = false, built = false, scrollRaf = 0, lock = 0;
  var head, bar, prev, next, counters = [];
  var ARROW_L = '<svg width="10" height="18" viewBox="0 0 10 18" fill="none" aria-hidden="true"><path d="M8.072 1.943 1.058 8.857l7.014 6.915" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="round"/></svg>';
  var ARROW_R = '<svg width="10" height="18" viewBox="0 0 10 18" fill="none" aria-hidden="true"><path d="m1.928 1.943 7.014 6.914-7.014 6.915" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="round"/></svg>';
  function build() {
    if (built) return;
    built = true;
    head = document.createElement("div");
    head.className = "v3f-fs-count";
    head.setAttribute("aria-hidden", "true");
    for (var i = 0; i < N; i++) {
      var c = document.createElement("span");
      c.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);
      head.appendChild(c);
      counters.push(c);
    }
    list.parentNode.insertBefore(head, list);
    bar = document.createElement("div");
    bar.className = "v3f-fs-bar";
    bar.setAttribute("aria-hidden", "true");
    bar.innerHTML = "<i></i>";
    bar.style.setProperty("--fs-n", N);
    list.parentNode.insertBefore(bar, list.nextSibling);
    var btns = document.createElement("div");
    btns.className = "v3f-fs-btns";
    btns.innerHTML = '<button type="button" class="v3f-fs-btn" aria-label="Point pr\xE9c\xE9dent">' + ARROW_L + '</button><button type="button" class="v3f-fs-btn" aria-label="Point suivant">' + ARROW_R + "</button>";
    media.appendChild(btns);
    prev = btns.children[0];
    next = btns.children[1];
    prev.addEventListener("click", function() {
      go(cur - 1, true);
    });
    next.addEventListener("click", function() {
      go(cur + 1, true);
    });
    list.addEventListener("scroll", onScroll, { passive: true });
    list.setAttribute("tabindex", "0");
    list.setAttribute("aria-roledescription", "carrousel");
  }
  function step() {
    return items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : list.clientWidth;
  }
  function setActive(i) {
    for (var k = 0; k < N; k++) {
      var on = k === i && seen;
      items[k].classList.toggle("v3f-fs-on", on);
      items[k].setAttribute("aria-hidden", k === i ? "false" : "true");
      counters[k].classList.toggle("is-on", k === i);
    }
    prev.disabled = i === 0;
    next.disabled = i === N - 1;
    bar.style.setProperty("--fs-i", i);
    notch(i);
  }
  function go(i, scroll) {
    i = Math.max(0, Math.min(N - 1, i));
    if (i === cur && !scroll) return;
    cur = i;
    setActive(i);
    if (scroll) {
      lock = performance.now() + 700;
      list.scrollTo({ left: step() * i, behavior: reduce ? "auto" : "smooth" });
    }
  }
  function onScroll() {
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(function() {
      scrollRaf = 0;
      if (performance.now() < lock) return;
      var s = step();
      if (s > 0) go(Math.round(list.scrollLeft / s), false);
    });
  }
  var DEPTH = 20;
  function notch(i) {
    var w = media.offsetWidth, h = media.offsetHeight;
    if (!w || !h) return;
    var pos = 0.3 + 0.4 * (N > 1 ? i / (N - 1) : 0);
    var cx = pos * w, span = Math.min(w * 0.4, 260), ramp = DEPTH * 2.5;
    var outer = span / 2, inner = outer - ramp, y = h - DEPTH, k = ramp * 0.55;
    var f = function(n) {
      return n.toFixed(1);
    };
    media.style.clipPath = "path('M0,0 H" + f(w) + " V" + f(h) + " H" + f(cx + outer) + " C" + f(cx + outer - k) + "," + f(h) + " " + f(cx + inner + k) + "," + f(y) + " " + f(cx + inner) + "," + f(y) + " H" + f(cx - inner) + " C" + f(cx - inner - k) + "," + f(y) + " " + f(cx - outer + k) + "," + f(h) + " " + f(cx - outer) + "," + f(h) + " H0 Z')";
  }
  function bleed() {
    var r = wrap.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    wrap.style.setProperty("--fs-gut-l", Math.max(0, r.left) + "px");
    wrap.style.setProperty("--fs-gut-r", Math.max(0, vw - r.right) + "px");
  }
  function enable() {
    build();
    wrap.classList.add("v3f-fs-h");
    bleed();
    list.scrollLeft = step() * cur;
    setActive(cur);
  }
  function disable() {
    wrap.classList.remove("v3f-fs-h");
    media.style.clipPath = "";
    items.forEach(function(it) {
      it.classList.remove("v3f-fs-on");
      it.removeAttribute("aria-hidden");
    });
  }
  function apply() {
    if (mq.matches) enable();
    else if (built) disable();
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function(es, io) {
      es.forEach(function(e) {
        if (e.isIntersecting) {
          seen = true;
          io.disconnect();
          if (built && mq.matches) {
            bleed();
            setActive(cur);
          }
        }
      });
    }, { threshold: 0.35 }).observe(list);
  } else {
    seen = true;
  }
  apply();
  if (mq.addEventListener) mq.addEventListener("change", apply);
  else if (mq.addListener) mq.addListener(apply);
  window.addEventListener("load", function() {
    if (mq.matches && built) {
      bleed();
      notch(cur);
    }
  });
  var rz = 0;
  window.addEventListener("resize", function() {
    if (rz || !mq.matches) return;
    rz = requestAnimationFrame(function() {
      rz = 0;
      bleed();
      list.scrollLeft = step() * cur;
      notch(cur);
    });
  }, { passive: true });
})();
