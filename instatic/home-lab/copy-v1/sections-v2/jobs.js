  /* Métiers externalisables: selector list drives the featured panel; auto-advances while in view */
  document.querySelectorAll('[data-mx]').forEach(function (mx) {
    var tabs = [].slice.call(mx.querySelectorAll('.spm2-mx-t'));
    var panels = [].slice.call(mx.querySelectorAll('.spm2-mx-p'));
    var stage = mx.querySelector('.spm2-mx-stage');
    var list = mx.querySelector('.spm2-mx-list');
    if (!tabs.length || !stage) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cur = 0, timer = 0, inView = false, hold = false, touched = false;
    var DUR = 6500;
    mx.classList.add('is-js');

    function show(i, focus) {
      i = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panels[k].classList.toggle('is-on', on);
      });
      // restart the progress bar
      var bar = tabs[i].querySelector('.spm2-mx-bar');
      if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
      if (list.scrollWidth > list.clientWidth + 4) {
        var dl = tabs[i].getBoundingClientRect().left - list.getBoundingClientRect().left;
        list.scrollTo({ left: list.scrollLeft + dl - parseFloat(getComputedStyle(list).paddingLeft), behavior: reduce ? 'auto' : 'smooth' });
      }
      if (focus) tabs[i].focus();
      cur = i;
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      var auto = inView && !hold && !touched && !reduce;
      mx.classList.toggle('is-auto', auto);
      if (auto) timer = setTimeout(function () { show(cur + 1); }, DUR);
    }

    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { touched = true; show(k); });
      t.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) { touched = true; show(k); } });
      t.addEventListener('keydown', function (e) {
        var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
        if (d) { e.preventDefault(); touched = true; show(cur + d, true); }
        else if (e.key === 'Home') { e.preventDefault(); touched = true; show(0, true); }
        else if (e.key === 'End') { e.preventDefault(); touched = true; show(tabs.length - 1, true); }
      });
    });
    mx.addEventListener('mouseenter', function () { hold = true; mx.classList.add('is-hold'); schedule(); });
    mx.addEventListener('mouseleave', function () { hold = false; mx.classList.remove('is-hold'); schedule(); });
    mx.addEventListener('focusin', function () { hold = true; schedule(); });
    mx.addEventListener('focusout', function () { hold = false; schedule(); });

    // swipe on the panel (touch)
    var sx = 0, sy = 0;
    stage.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) { touched = true; show(cur + (dx < 0 ? 1 : -1)); }
    }, { passive: true });

    // pointer: glow follows, panel tilts slightly, index numeral drifts
    if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var raf = 0, px = 0.7, py = 0.2;
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        px = (e.clientX - r.left) / r.width; py = (e.clientY - r.top) / r.height;
        if (!raf) raf = requestAnimationFrame(function () {
          raf = 0;
          stage.style.setProperty('--mx-gx', (px * 100).toFixed(1) + '%');
          stage.style.setProperty('--mx-gy', (py * 100).toFixed(1) + '%');
          stage.style.setProperty('--mx-ry', ((px - 0.5) * 4).toFixed(2) + 'deg');
          stage.style.setProperty('--mx-rx', ((0.5 - py) * 3).toFixed(2) + 'deg');
          stage.style.setProperty('--mx-nx', ((px - 0.5) * -24).toFixed(1) + 'px');
          stage.style.setProperty('--mx-ny', ((py - 0.5) * -16).toFixed(1) + 'px');
        });
      });
      stage.addEventListener('pointerleave', function () {
        ['--mx-gx', '--mx-gy', '--mx-rx', '--mx-ry', '--mx-nx', '--mx-ny'].forEach(function (p) { stage.style.removeProperty(p); });
      });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        inView = es[0].isIntersecting; schedule();
      }, { threshold: 0.35 }).observe(mx);
    }
  });
