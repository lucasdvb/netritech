/*
  Moana wash: the GetLayers "Feather" gradient (a wash drying on unsized paper), ported for the theme.
  One fullscreen triangle, one fragment shader, plain WebGL2, no library.

  The shader is the library's, unchanged (its contract preserves the motion). Only the CONFIG tint is ours,
  set per canvas through data attributes: data-bg, data-a, data-b, data-c, data-d (brand palette tints).

  Changes from the gallery file: it draws into its own section rather than the window; it is paused when off
  screen or in a background tab; under prefers-reduced-motion it paints a single still frame; the pointer is
  read relative to the canvas; the authoring panel and storage are removed. Without WebGL2 the section keeps
  its CSS fallback ground.
*/
(() => {
  const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  iResolution;
uniform float iTime;
uniform vec2  iMouse;

uniform vec3  uBg, uColorA, uColorB, uColorC, uColorD;
uniform float uScale, uSpeed, uFlow, uWarp, uWarpScale, uRoughness;
uniform float uLacunarity, uBias, uBiasAngle, uRim, uRimStep, uRimCurve;
uniform float uAbsorb, uTooth, uToothScale, uContrast, uMidpoint, uSink;
uniform float uGlow, uGrain, uDither, uVignette, uDamp, uPointerRadius;
uniform float uDrift, uParallax;

#define OCTAVES 4

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float snoise(vec2 p) {
  const float K1 = 0.366025404, K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  float m = step(a.y, a.x);
  vec2 o = vec2(m, 1.0 - m);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h * vec3(dot(a, hash2(i)), dot(b, hash2(i + o)), dot(c, hash2(i + 1.0)));
  return dot(n, vec3(70.0));
}

float fbm(vec2 p) {
  float v = 0.0, amp = 0.5;
  for (int i = 0; i < OCTAVES; i++) {
    v += amp * snoise(p);
    p *= uLacunarity;
    amp *= uRoughness;
  }
  return v;
}

vec3 ramp4(float t) {
  vec3 c = mix(uColorA, uColorB, smoothstep(0.00, 0.36, t));
  c = mix(c, uColorC, smoothstep(0.32, 0.70, t));
  c = mix(c, uColorD, smoothstep(0.66, 1.00, t));
  return c;
}

float triDither(vec2 fc) {
  float a = fract(sin(dot(fc, vec2(12.9898, 78.233))) * 43758.5453);
  float b = fract(sin(dot(fc + 17.0, vec2(12.9898, 78.233))) * 43758.5453);
  return (a + b - 1.0) / 255.0;
}

float wash(vec2 base, float t) {
  vec2 x = base + vec2(t * 0.13, -t * 0.10);
  return 0.5 + dot(base, vec2(cos(uBiasAngle), sin(uBiasAngle))) * uBias + fbm(x) * uAbsorb;
}

uniform float uGrainAnim;
float houseGrain(vec2 fc) {
  uvec2 q = uvec2(fc) * uvec2(1597334677u, 3812015801u)
          + uint(floor(iTime * 24.0 * uGrainAnim)) * 2654435769u;
  uint n = q.x ^ q.y; n = n * 1664525u + 1013904223u; n ^= n >> 16u; n *= 2246822519u; n ^= n >> 13u;
  float a = float(n & 0xffffu) / 65535.0;
  n *= 3266489917u; n ^= n >> 16u;
  float b = float(n & 0xffffu) / 65535.0;
  return a + b - 1.0;
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution) / iResolution.y;
  float t = iTime * uSpeed;

  vec2 dm = uv - iMouse;
  float wetter = uDamp * exp(-dot(dm, dm) / max(1e-4, uPointerRadius * uPointerRadius));

  vec2 p = (uv - iMouse * uParallax) * uScale + dm * wetter * 0.6 + iMouse * uDrift * 0.25;

  vec2 q = vec2(fbm(p * uWarpScale + vec2(0.0, t * uFlow)),
                fbm(p * uWarpScale + vec2(5.2, 1.3) - t * uFlow * 0.7));
  vec2 base = p + uWarp * q;

  float e = max(0.002, uRimStep);
  float f0 = wash(base, t);
  float fx = wash(base + vec2(e, 0.0), t);
  float fy = wash(base + vec2(0.0, e), t);
  float slope = length(vec2(fx - f0, fy - f0)) / e;

  float f = f0 - uRim * smoothstep(0.0, max(0.05, uRimCurve), slope);
  f += uTooth * snoise(p * uToothScale) * 0.5;

  f = clamp((f - uMidpoint) * uContrast + 0.5, 0.0, 1.0);

  vec3 col = ramp4(f);
  col += uColorD * uGlow * pow(f, 4.0);
  col = mix(uBg, col, smoothstep(0.0, max(0.01, uSink), f) * 0.90 + 0.10);

  col *= 1.0 - uVignette * dot(uv, uv);
  { float hgL = clamp(dot(col, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    col += houseGrain(gl_FragCoord.xy) * uGrain * mix(1.0, 4.0 * hgL * (1.0 - hgL), 0.6); }
  col += triDither(gl_FragCoord.xy) * uDither;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

  // The library's "light indigo" roll (feather-003) for the field, motion values untouched; the tint is per canvas.
  const BASE = {
    bgColor: '#ffffff', colorA: '#f3f5ec', colorB: '#d1d9be', colorC: '#c7c2ab', colorD: '#abb086',
    scale: 0.2, speed: 0.06, flow: 0.39, warp: 1.38, warpScale: 2.63, roughness: 0.36, lacunarity: 1.92,
    bias: 0.84, biasAngle: 3.54, rim: 0.74, rimStep: 0.061, rimCurve: 1.45, absorb: 0.75,
    tooth: 0.098, toothScale: 35, contrast: 2.48, midpoint: 0.59, sink: 0.26, glow: 0.12,
    grain: 0.06, grainAnim: 0, dither: 1.54, vignette: 0, damp: 0.06, cursor: 1,
    pointerRadius: 0.71, drift: 0.02, parallax: 0.008, maxDpr: 1,
    resolution: 0.5,   // the wash is all soft edges: half-resolution, upscaled by CSS, is indistinguishable and 4x cheaper
    fps: 30            // it moves at a fifth of the house speed; 30 frames a second is plenty
  };

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const hex = (h) => { const n = parseInt(h.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };

  function start(canvas) {
    if (canvas.dataset.washReady) return;
    canvas.dataset.washReady = '1';
    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
    if (!gl) return;

    const CONFIG = Object.assign({}, BASE);
    const d = canvas.dataset;
    if (d.bg) CONFIG.bgColor = d.bg;
    if (d.a) CONFIG.colorA = d.a;
    if (d.b) CONFIG.colorB = d.b;
    if (d.c) CONFIG.colorC = d.c;
    if (d.d) CONFIG.colorD = d.d;

    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
      return sh;
    };
    let program;
    try {
      program = gl.createProgram();
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch (e) { return; }
    gl.useProgram(program);
    gl.bindVertexArray(gl.createVertexArray());

    const LOC = {};
    const loc = (n) => (n in LOC ? LOC[n] : (LOC[n] = gl.getUniformLocation(program, n)));
    const u1 = (n, v) => gl.uniform1f(loc(n), v);
    const u3 = (n, h) => { const c = hex(h); gl.uniform3f(loc(n), c[0], c[1], c[2]); };

    u3('uBg', CONFIG.bgColor); u3('uColorA', CONFIG.colorA); u3('uColorB', CONFIG.colorB); u3('uColorC', CONFIG.colorC); u3('uColorD', CONFIG.colorD);
    const map = { uScale: 'scale', uSpeed: 'speed', uFlow: 'flow', uWarp: 'warp', uWarpScale: 'warpScale', uRoughness: 'roughness',
      uLacunarity: 'lacunarity', uBias: 'bias', uBiasAngle: 'biasAngle', uRim: 'rim', uRimStep: 'rimStep', uRimCurve: 'rimCurve',
      uAbsorb: 'absorb', uTooth: 'tooth', uToothScale: 'toothScale', uContrast: 'contrast', uMidpoint: 'midpoint', uSink: 'sink',
      uGlow: 'glow', uGrain: 'grain', uGrainAnim: 'grainAnim', uDither: 'dither', uVignette: 'vignette', uDamp: 'damp',
      uPointerRadius: 'pointerRadius', uDrift: 'drift', uParallax: 'parallax' };
    for (const k in map) u1(k, CONFIG[map[k]]);

    let w = 0, h = 0, visible = false, running = false, prev = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr) * CONFIG.resolution;
      const r = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(r.width * dpr)); h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(loc('iResolution'), w, h);
    };
    resize();
    new ResizeObserver(() => { resize(); if (!running) draw(); }).observe(canvas);

    // pointer: aspect-corrected, relative to the canvas, followed through two damped poles (library values)
    const mouse = { x: 0, y: 0, ax: 0, ay: 0, tx: 0, ty: 0 };
    const host = canvas.parentElement;
    const aim = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * (r.width / r.height);
      mouse.ty = 0.5 - (e.clientY - r.top) / r.height;
    };
    host.addEventListener('pointermove', aim, { passive: true });

    let clock = 4.0; // a settled moment of the wash, so the still frame under reduced motion is a good one
    const draw = () => {
      gl.uniform1f(loc('iTime'), clock);
      gl.uniform2f(loc('iMouse'), mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // Software GL (no GPU: some laptops, VMs, headless test browsers) or a slow first frame: keep a still image.
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    let still = /swiftshader|llvmpipe|software|basic render/i.test(renderer);

    const frame = (now) => {
      if (!visible || document.hidden || reduce.matches || still) { running = false; return; }
      requestAnimationFrame(frame);
      if (now - prev < 1000 / CONFIG.fps - 2) return;
      const raw = now - prev; prev = now;
      const ms = raw > 50 ? 50 : raw < 4.167 ? 4.167 : raw;
      const s = ms > 36.7 ? 2.2 : ms * 0.06;
      clock += ms * 0.001;
      const kLead = 0.105 * s, kBody = 0.043 * s;
      mouse.ax += (mouse.tx - mouse.ax) * kLead; mouse.ay += (mouse.ty - mouse.ay) * kLead;
      mouse.x += (mouse.ax - mouse.x) * kBody; mouse.y += (mouse.ay - mouse.y) * kBody;
      draw();
    };
    const run = () => {
      if (running || !visible || document.hidden || reduce.matches || still) return;
      running = true; prev = performance.now(); requestAnimationFrame(frame);
    };

    // re-tint on request (the routine finder shifts the wash with each answer): a 900 ms blend between palettes
    const cur = { uBg: hex(CONFIG.bgColor), uColorA: hex(CONFIG.colorA), uColorB: hex(CONFIG.colorB), uColorC: hex(CONFIG.colorC), uColorD: hex(CONFIG.colorD) };
    const keys = { bg: 'uBg', a: 'uColorA', b: 'uColorB', c: 'uColorC', d: 'uColorD' };
    let tween = 0;
    canvas.addEventListener('wash:tint', (ev) => {
      const from = {}, to = {};
      for (const k in keys) { const u = keys[k]; from[u] = cur[u].slice(); to[u] = ev.detail && ev.detail[k] ? hex(ev.detail[k]) : cur[u]; }
      const t1 = performance.now(), dur = reduce.matches ? 0 : 900, id = ++tween;
      const stepT = (now) => {
        if (id !== tween) return;
        const k = dur ? Math.min(1, (now - t1) / dur) : 1, e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        for (const u in to) { for (let i = 0; i < 3; i++) cur[u][i] = from[u][i] + (to[u][i] - from[u][i]) * e; gl.uniform3f(loc(u), cur[u][0], cur[u][1], cur[u][2]); }
        if (!running) draw();
        if (k < 1) requestAnimationFrame(stepT);
      };
      requestAnimationFrame(stepT);
    });

    const t0 = performance.now();
    draw();
    gl.finish();
    if (performance.now() - t0 > 40) still = true;
    canvas.classList.add('is-ready');

    new IntersectionObserver((es) => { visible = es[0].isIntersecting; run(); }, { rootMargin: '80px' }).observe(canvas);
    document.addEventListener('visibilitychange', run);
    reduce.addEventListener?.('change', () => { if (reduce.matches) draw(); else run(); });
  }

  // Nothing is compiled until the section is about to scroll into view, then only when the main thread is idle,
  // so the wash never competes with the first paint or with input.
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1));
  const near = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { near.unobserve(e.target); idle(() => start(e.target), { timeout: 1200 }); } });
  }, { rootMargin: '400px 0px' }) : null;
  const boot = () => document.querySelectorAll('canvas[data-wash]').forEach((c) => (near ? near.observe(c) : start(c)));
  boot();
  // sections re-rendered in the theme editor
  document.addEventListener('shopify:section:load', boot);
})();
