/* Water ripple: moving the cursor over a photo marked [data-ripple] sends soft rings across it, like a
   fingertip on still water (the "Moana" moment). WebGL, built only on the first hover, on devices with a
   mouse or trackpad, and never under reduced motion. Between gestures the canvas fades out and the real
   photo shows, so nothing renders while the page is still. If the image can't be used as a texture
   (cross-origin), or WebGL is missing, the photo simply stays as it is. */
(function () {
  'use strict';
  if (window.__moanaRipple) return;
  window.__moanaRipple = true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  var N = 10; // rings alive at once
  var VERT = 'attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; gl_Position = vec4(p, 0., 1.); }';
  var FRAG = [
    'precision mediump float;',
    'uniform sampler2D t; uniform vec2 res; uniform vec2 img; uniform vec4 drops[' + N + ']; varying vec2 v;',
    // object-fit: cover, so the canvas matches the photo underneath exactly
    'vec2 cover(vec2 uv){ float rc = res.x / res.y, ri = img.x / img.y; vec2 s = rc > ri ? vec2(1., ri / rc) : vec2(rc / ri, 1.); return (uv - .5) * s + .5; }',
    'void main(){',
    '  float asp = res.x / res.y; vec2 off = vec2(0.); float light = 0.;',
    '  for (int i = 0; i < ' + N + '; i++) {',
    '    vec4 d = drops[i]; if (d.w <= 0.) continue;',
    '    vec2 q = (v - d.xy) * vec2(asp, 1.); float dist = length(q);',
    '    float x = dist - d.z * .28;',                                   // the ring spreads outwards with age
    '    float wave = sin(x * 70.) * exp(-x * x * 220.) * exp(-d.z * 1.9) * d.w;',
    '    off += (q / max(dist, 1e-4)) * wave * .016 / vec2(asp, 1.);',
    '    light += wave;',
    '  }',
    '  vec4 c = texture2D(t, cover(v + off));',
    '  gl_FragColor = vec4(c.rgb + light * .07, 1.);',
    '}'
  ].join('\n');

  function init(host) {
    var photo = host.querySelector('img');
    if (!photo || host.querySelector('canvas.ripple')) return;
    var canvas = document.createElement('canvas');
    canvas.className = 'ripple';
    canvas.setAttribute('aria-hidden', 'true');
    var gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) return;
    var tex = new Image();
    tex.crossOrigin = 'anonymous';
    tex.onload = function () {
      try { setup(); } catch (e) { canvas.remove(); }
    };
    tex.src = photo.currentSrc || photo.src;

    function setup() {
      function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
      var prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link');
      gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, tex); // throws on a tainted image
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      var uRes = gl.getUniformLocation(prog, 'res'), uImg = gl.getUniformLocation(prog, 'img'), uDrops = gl.getUniformLocation(prog, 'drops');
      gl.uniform2f(uImg, tex.naturalWidth, tex.naturalHeight);
      host.appendChild(canvas);

      var drops = [], data = new Float32Array(N * 4), running = false, last = null;
      function size() {
        var r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = Math.max(1, Math.round(r.width * dpr)); canvas.height = Math.max(1, Math.round(r.height * dpr));
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.uniform2f(uRes, canvas.width, canvas.height);
      }
      size();
      new ResizeObserver(size).observe(canvas);

      function frame(now) {
        var alive = false;
        data.fill(0);
        drops = drops.filter(function (d) { return (now - d.t) / 1000 < 2.6; });
        drops.forEach(function (d, i) {
          data[i * 4] = d.x; data[i * 4 + 1] = d.y; data[i * 4 + 2] = (now - d.t) / 1000; data[i * 4 + 3] = d.s; alive = true;
        });
        gl.uniform4fv(uDrops, data);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (alive && !document.hidden) requestAnimationFrame(frame);
        else { running = false; canvas.classList.remove('is-on'); }
      }
      function drop(e, strength) {
        var r = canvas.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = 1 - (e.clientY - r.top) / r.height;
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        drops.push({ x: x, y: y, t: performance.now(), s: strength });
        if (drops.length > N) drops.shift();
        canvas.classList.add('is-on');
        if (!running) { running = true; requestAnimationFrame(frame); }
      }
      host.addEventListener('pointermove', function (e) {
        var now = performance.now();
        if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 36 && now - last.t < 140) return;
        var speed = last ? Math.min(1, Math.hypot(e.clientX - last.x, e.clientY - last.y) / 90) : .6;
        last = { x: e.clientX, y: e.clientY, t: now };
        drop(e, .45 + speed * .55);
      }, { passive: true });
      host.addEventListener('pointerdown', function (e) { drop(e, 1.4); }, { passive: true });
      host.addEventListener('pointerleave', function () { last = null; });
    }
  }

  function boot() {
    document.querySelectorAll('[data-ripple]').forEach(function (host) {
      if (host.dataset.rippleBound) return;
      host.dataset.rippleBound = '1';
      host.addEventListener('pointerenter', function () { init(host); }, { once: true });
    });
  }
  boot();
  document.addEventListener('shopify:section:load', boot);
})();
