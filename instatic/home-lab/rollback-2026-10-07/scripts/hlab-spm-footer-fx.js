/* hlab: Home Lab page only, inert on every other page */
(function () {
if (!document.querySelector('[class*="hlab-"]') || window.self !== window.top || !/\/home-lab(\/|\.html)?$/.test(location.pathname)) return;
// SPM footer background — branching-veins gradient (WebGL2),
// tinted to SPM brand blues (base #0d141f, ramp #1b2a38 -> #43617a -> steel -> Gris Perle).
// Shader (VERT/FRAG) unchanged; CONFIG colours are SPM, all other
// params exactly as specified. Pointer is mapped to the footer canvas so the branches lean
// toward the cursor over the footer. On-screen-gated + maxDpr 1; reduced-motion draws once.
(function () {
  function init() {
    var host = document.querySelector('.hlab-spmf2');
    if (!host || host.querySelector('.hlab-spmf2-fx')) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'hlab-spmf2-fx';
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, host.firstChild);

    var gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
    if (!gl) { canvas.remove(); return; }

    var CONFIG = {
      bgColor: '#0d141f', colorA: '#1b2a38', colorB: '#43617a', colorC: '#8ea6bd', colorD: '#dadde0',
      scale: 0.2, speed: 0.33, veinScale: 0.85, roughness: 0.56, lacunarity: 2.15,
      drift: 0.1, sharp: 1.8, veinGain: 0.7, feather: 0.75,
      pulseWidth: 0.2, pulseGain: 0.85, pulseReach: 1.4,
      contrast: 1.02, midpoint: 0.58, glow: 0.24, sink: 0.18,
      grain: 0, grainAnim: 0, dither: 1.2, vignette: 0.3,
      cursor: 1, pointerRadius: 0.45, pointerStrength: 0.3, pointerLift: 0.16, parallax: 0.002,
      maxDpr: 1
    };

    function hexToVec3(hex) { var n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }

    var VERT = '#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.0-1.0,0.0,1.0);}';

    var FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  iResolution;
uniform float iTime;
uniform vec2  iMouse;
uniform vec2  iLag;
uniform vec2  iTail;
uniform float iEnergy;
uniform float iIntro;

uniform vec3  uBgColor, uColorA, uColorB, uColorC, uColorD;
uniform float uScale, uSpeed, uVeinScale, uRoughness, uLacunarity, uDrift, uSharp, uVeinGain;
uniform float uFeather, uPulseWidth, uPulseGain, uPulseReach, uContrast, uMidpoint, uGlow;
uniform float uSink, uGrain, uDither, uVignette, uPointerRadius, uPointerStrength, uPointerLift;
uniform float uParallax;

#define TAU 6.28318530718

float hash1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

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

#define OCT 5
float fbm(vec2 p, float gain, float lac) {
  float v = 0.0, amp = 0.5;
  for (int i = 0; i < OCT; i++) { v += amp * snoise(p); p *= lac; amp *= gain; }
  return v;
}
#define OCT3 3
float fbm3(vec2 p, float gain, float lac) {
  float v = 0.0, amp = 0.5;
  for (int i = 0; i < OCT3; i++) { v += amp * snoise(p); p *= lac; amp *= gain; }
  return v;
}

vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }

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

float ridged(vec2 p, float gain, float lac) {
  float v = 0.0, amp = 0.5, prev = 1.0;
  for (int i = 0; i < 3; i++) {
    float n = 1.0 - abs(snoise(p));
    n *= n;
    v += amp * n * prev;
    prev = clamp(n, 0.0, 1.0);
    p *= lac;
    amp *= gain;
  }
  return v;
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

  vec2 dh = uv - iMouse;
  float near = exp(-dot(dh, dh) / max(1e-4, uPointerRadius * uPointerRadius));
  vec2 p = (uv - dh * near * uPointerStrength * iIntro - iMouse * uParallax) * uScale;

  float veins = ridged(p * uVeinScale + vec2(t * uDrift, -t * uDrift * 0.7), uRoughness, uLacunarity);
  veins = pow(clamp(veins, 0.0, 1.0), uSharp);
  veins *= uVeinGain;

  float wash = pow(clamp(ridged(p * uVeinScale * 0.45 - vec2(t * uDrift * 0.4, 0.0), 0.55, 2.0), 0.0, 1.0), 1.4) * uFeather;

  float rl = length(uv - iTail);
  float front = iEnergy * uPulseReach;
  float pulse = exp(-abs(rl - front) / max(1e-3, uPulseWidth)) * iEnergy * uPulseGain * iIntro;

  float lit = veins * (1.0 + pulse * 2.2) + wash * 0.6 + near * uPointerLift * iIntro;

  float g = clamp((lit - uMidpoint) * uContrast + 0.5, 0.0, 1.0);
  vec3 col = ramp4(g);
  col += uColorD * uGlow * pow(g, 6.0);
  col = mix(uBgColor, col, smoothstep(0.0, max(0.01, uSink), g) * 0.90 + 0.10);

  col *= 1.0 - uVignette * dot(uv, uv);
  { float hgL = clamp(dot(col, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    col += houseGrain(gl_FragCoord.xy) * uGrain * mix(1.0, 4.0 * hgL * (1.0 - hgL), 0.6); }
  col += triDither(gl_FragCoord.xy) * uDither;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

    function compile(type, src) { var sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; }
    var program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { canvas.remove(); return; }
    gl.useProgram(program);
    gl.bindVertexArray(gl.createVertexArray());

    var LOC = {};
    var loc = function (n) { return (n in LOC ? LOC[n] : (LOC[n] = gl.getUniformLocation(program, n))); };
    var u1f = function (n, v) { gl.uniform1f(loc(n), v); };
    var u2f = function (n, x, y) { gl.uniform2f(loc(n), x, y); };
    var u3c = function (n, hex) { var c = hexToVec3(hex); gl.uniform3f(loc(n), c[0], c[1], c[2]); };

    var dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
      var cw = host.clientWidth || canvas.clientWidth || host.offsetWidth || 0;
      var chh = host.clientHeight || canvas.clientHeight || host.offsetHeight || 0;
      var w = Math.max(1, Math.round(cw * dpr));
      var h = Math.max(1, Math.round(chh * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      gl.viewport(0, 0, w, h);
      gl.useProgram(program);
      u2f('iResolution', w, h);
    }
    function applyConfig() {
      gl.useProgram(program);
      for (var k in CONFIG) {
        if (k === 'maxDpr') continue;
        var n = 'u' + k[0].toUpperCase() + k.slice(1);
        if (typeof CONFIG[k] === 'string') u3c(n, CONFIG[k]); else u1f(n, CONFIG[k]);
      }
      resize();
    }

    if (window.ResizeObserver) { new ResizeObserver(function () { resize(); }).observe(host); }
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('load', resize);
    setTimeout(resize, 300); setTimeout(resize, 1200);

    var visible = true;
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
    }
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // pointer rig — mapped to the footer canvas (branches lean toward the cursor over the footer)
    var P = { tx: 0, ty: 0, hx: 0, hy: 0, mx: 0, my: 0, sx: 0, sy: 0, e: 0 };
    var seeded = false;
    function aim(e) {
      var r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
      if (fx < 0 || fx > 1 || fy < 0 || fy > 1) return;
      var a = r.width / r.height;
      P.tx = (fx - 0.5) * a; P.ty = 0.5 - fy;
      if (!seeded) { seeded = true; P.hx = P.mx = P.sx = P.tx; P.hy = P.my = P.sy = P.ty; }
    }
    window.addEventListener('pointermove', aim, { passive: true });
    window.addEventListener('pointerdown', aim, { passive: true });

    var prevT = performance.now(), clock = 0, intro = 0;
    function frame(now) {
      requestAnimationFrame(frame);
      var raw = now - prevT; prevT = now;
      if (!visible || document.hidden) return;
      var dt = raw > 50 ? 0.05 : raw < 0.001 ? 0.001 : raw * 0.001;
      clock += dt;

      var kh = 1 - Math.exp(-6.0 * dt), km = 1 - Math.exp(-2.6 * dt), ks = 1 - Math.exp(-1.25 * dt);
      P.hx += (P.tx - P.hx) * kh; P.hy += (P.ty - P.hy) * kh;
      P.mx += (P.hx - P.mx) * km; P.my += (P.hy - P.my) * km;
      P.sx += (P.mx - P.sx) * ks; P.sy += (P.my - P.sy) * ks;

      var ex = P.hx - P.sx, ey = P.hy - P.sy;
      var want = Math.min(Math.sqrt(ex * ex + ey * ey) * 5.5, 1);
      P.e += (want - P.e) * (1 - Math.exp(-(want > P.e ? 5.0 : 0.40) * dt));
      intro += ((seeded ? 1 : 0) - intro) * (1 - Math.exp(-3.0 * dt));

      u1f('iTime', clock);
      u1f('iEnergy', P.e);
      u1f('iIntro', intro);
      u2f('iMouse', P.hx, P.hy);
      u2f('iLag', P.mx, P.my);
      u2f('iTail', P.sx, P.sy);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    applyConfig();
    u1f('iTime', 0); u1f('iEnergy', 0); u1f('iIntro', 0);
    u2f('iMouse', 0, 0); u2f('iLag', 0, 0); u2f('iTail', 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

})();
