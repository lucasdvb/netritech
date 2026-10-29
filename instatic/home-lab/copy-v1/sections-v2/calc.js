  /* ---------- savings simulator v2 (indicative %, SPM method; the base rate is not shown on the page) ---------- */
  var sim = document.querySelector('.spm2-calc');
  if (sim) {
    var BASE = 0.40, SPM_H = 40;          // average saving observed at SPM, and the 40 h week worked at SPM
    var vals = {};
    var fr = function (n, d) { return n.toLocaleString('fr-FR', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); };
    var outPct = sim.querySelector('[data-out="pct"]'), outEq = sim.querySelector('[data-out="eq"]'), outHrs = sim.querySelector('[data-out="hrs"]');
    var gauge = sim.querySelector('.spm2-gauge');
    function compute() {
      var h = vals.hours || 35, part = (vals.part || 60) / 100, posts = vals.posts || 20;
      var perPost = 1 - (1 - BASE) * (h / SPM_H);   // same work at SPM costs (1 - BASE) per post, and a post works 40 h instead of h
      var pct = Math.max(0, part * perPost);
      if (outPct) outPct.textContent = fr(Math.round(pct * 100));
      if (gauge) gauge.style.setProperty('--p', Math.round(pct * 100));
      if (outEq) outEq.textContent = fr(posts * pct, posts * pct < 10 ? 1 : 0);
      if (outHrs) outHrs.textContent = '+' + fr(Math.max(0, SPM_H - h)) + ' h';
    }
    sim.querySelectorAll('.spm2-sl').forEach(function (row) {
      var key = row.getAttribute('data-key'), min = +row.getAttribute('data-min'), max = +row.getAttribute('data-max');
      var step = +row.getAttribute('data-step') || 1, unit = row.getAttribute('data-unit') || '';
      var track = row.querySelector('.spm2-sl-track'), fill = row.querySelector('.spm2-sl-fill'), thumb = row.querySelector('.spm2-sl-thumb');
      var out = row.querySelector('.spm2-sl-v');
      function set(v) {
        v = Math.max(min, Math.min(max, Math.round(v / step) * step));
        vals[key] = v;
        var pc = (v - min) / (max - min) * 100;
        if (fill) fill.style.width = pc + '%';
        if (thumb) thumb.style.left = pc + '%';
        if (track) track.setAttribute('aria-valuenow', v);
        if (out) out.textContent = fr(v) + (key === 'posts' && v === 1 ? ' poste' : unit);
        compute();
      }
      var down = false;
      function fromX(x) { var r = track.getBoundingClientRect(); return min + (x - r.left) / r.width * (max - min); }
      track.addEventListener('pointerdown', function (e) { down = true; try { track.setPointerCapture(e.pointerId); } catch (err) {} set(fromX(e.clientX)); });
      track.addEventListener('pointermove', function (e) { if (down) set(fromX(e.clientX)); });
      track.addEventListener('pointerup', function () { down = false; });
      track.addEventListener('pointercancel', function () { down = false; });
      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { set(vals[key] - step); e.preventDefault(); }
        else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { set(vals[key] + step); e.preventDefault(); }
      });
      set(+row.getAttribute('data-val'));
    });
  }
