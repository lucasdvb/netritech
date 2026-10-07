// Meridian, a GetLayers gradient: "one line of light across the frame with a falloff".
// Ported from its single-HTML master with the shader and motion untouched (the contract
// preserves motion); only CONFIG is set here: the brand palette (the brand blue and a lifted,
// paler blue on a true-black stage) over GetLayers' saved 004 field, with the band moved
// low and right so the copy on the card stays on dark. Bundled with the app, so it works
// offline. It draws only while on screen, at most ~30 frames a second, a single still
// frame under reduced motion, and falls back to CSS when WebGL2 is unavailable.

const BASE = {
  // field and motion: the default roll, left as shipped
  speed: 0.33, tilt: -0.78, level: 0, arc: 0, centerX: 0, centerY: 0, sway: 0.07, core: 0.1, reach: 0.35,
  bright: 1.4, skirt: 0.28, ambient: 0.36, warp: 0.12, scale: 0.4, drift: 0.07, roughness: 0.5, lacunarity: 2,
  contrast: 1.5, midpoint: 0.42, sink: 0.12, glow: 0.18, seam: 0.15, split: 1, grain: 0.03, grainAnim: 1,
  dither: 1.5, vignette: 0.24, lift: 0.2, open: 0.3, pourRadius: 0.55, pour: 0.12, smear: 0.6, infuse: 0.06,
  cursor: 1, parallax: 0.002, maxDpr: 1,
};

/** Brand tint over the saved 004 field: a true-black stage with the band low and to the right,
 *  so card copy sits on dark; the brand blue #0071E3 lifts to #2997FF and a pale blue light. */
export const BRAND = {
  bgColor: '#000000', colorA: '#020a16', colorB: '#0071e3', colorC: '#2997ff', colorD: '#9ccaff',
  tilt: 0.72, level: -0.45, core: 0.1, reach: 0.32, bright: 1.05, skirt: 0.3, ambient: 0.06, warp: 0.18,
  contrast: 1.4, midpoint: 0.44, sink: 0.14, glow: 0.2, seam: 0.2, vignette: 0.26, grain: 0.028,
};

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
uniform vec2  iMouse;          // aspect-corrected units, same space as uv
uniform vec2  iLead;           // the pointer's lead node — ahead of iMouse while the hand moves
uniform float uPourRadius, uPour, uSmear, uInfuse;

uniform vec3  uBg, uColorA, uColorB, uColorC, uColorD;
uniform float uSpeed, uTilt, uLevel, uSway, uCore, uReach;
uniform float uBright, uSkirt, uAmbient, uWarp, uScale, uDrift;
uniform float uRoughness, uLacunarity, uContrast, uMidpoint, uSink, uGlow, uSeam, uSplit;
uniform float uGrain, uDither, uVignette, uLift, uOpen, uParallax;
uniform float uArc, uCenterX, uCenterY;

#define OCTAVES 3

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

// B and C are the two accents, and the far apart in hue they are the worse the straight
// lerp between them looks: a blue reaching a coral through the middle passes a dead
// purple-grey, and on a band that grey is a whole ring of the frame. uSeam lifts the
// crossover toward the top stop instead, so the two hues meet through LIGHT. The bump is
// zero at both ends of that mix, so nothing outside the seam moves.
//
// uSplit takes the second half of that idea further. The band is a LINE and a line has two
// sides, but the ramp only ever saw the distance to it — both flanks came out the same
// colour. side is the sign of that distance, softened over a fraction of uReach, and at
// uSplit 1 each flank collapses to ONE accent: red one side, blue the other, and the only
// way across is through the band's own light. At uSplit 0 both stops are exactly B and C
// again, so every look written before this key is untouched.
vec3 ramp4(float t, float side) {
  vec3 acc = mix(uColorB, uColorC, side);
  vec3 lo  = mix(uColorB, acc, uSplit);
  vec3 hi  = mix(uColorC, acc, uSplit);
  vec3 c = mix(uColorA, lo, smoothstep(0.00, 0.36, t));
  float k = smoothstep(0.32, 0.70, t);
  c = mix(c, hi, k);
  c = mix(c, uColorD, uSeam * 4.0 * k * (1.0 - k));
  c = mix(c, uColorD, smoothstep(0.66, 1.00, t));
  return c;
}

// triangular-PDF dither — the only reliable cure for 8-bit gradient banding
float triDither(vec2 fc) {
  float a = fract(sin(dot(fc, vec2(12.9898, 78.233))) * 43758.5453);
  float b = fract(sin(dot(fc + 17.0, vec2(12.9898, 78.233))) * 43758.5453);
  return (a + b - 1.0) / 255.0;
}

vec2 rot(vec2 p, float a) { float s = sin(a), c = cos(a); return mat2(c, -s, s, c) * p; }


// ONE BAND. Not a source with a falloff — a LINE with one, which is why nothing here is round
// and why most of the frame is empty. Two exponentials do all of it: a tight one for the core
// and a wide one for the part that carries into the dark, and the only reason the band is not
// a ruler is that the distance it is measured from has a slow field added to it.

// ---- house grain. ONE look across the collection: an integer hash (no sin() streaks),
// triangular so it reads as film rather than static, weighted into the midtones so it
// never crusts a black or a white. Static by default; uGrainAnim re-seeds it 24×/s.
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


  // ---- transfusion. The hand is not a lens and not a shift: it is a pour. Across a wide,
  // soft well the field's own coordinates are drawn INTO the cursor, so colour pools there
  // instead of sliding past; the stroke (lead minus body) drags that pool along the line
  // of travel, like pigment pulled by a wet brush; and the tone under the hand is infused
  // with the top of the palette. All of it rides on iMouse's lag, which is what makes it
  // arrive a beat late and settle — felt, not tracked.
  vec2 tfD = uv - iMouse;
  vec2 tfStroke = iLead - iMouse;
  float tfR2 = max(1e-4, uPourRadius * uPourRadius);
  float tfWell = exp(-dot(tfD, tfD) / tfR2);
  float tfWide = exp(-dot(tfD, tfD) / (tfR2 * 3.0));
  vec2 tfPour = -tfD * tfWell * uPour + tfStroke * tfWide * uSmear;
  float tfInfuse = tfWide * uInfuse * (0.55 + 0.45 * smoothstep(0.0, 0.12, length(tfStroke)));
  vec2 p = uv + tfPour - iMouse * uParallax;
  vec2 n = vec2(-sin(uTilt), cos(uTilt));

  vec2 q = p - vec2(uCenterX, uCenterY);

  float air = fbm(p * uScale + vec2(-t * uDrift, t * uDrift * 0.5));
  float lvl = uLevel + sin(t * 0.13) * uSway + iMouse.y * uLift;
  // the same two falloffs, only the distance they are measured from changes: a line at
  // uArc 0, a circle of radius lvl at uArc 1 — and a circle of radius 0 is a bloom, so
  // the ring and the round glow are the same key. level doubles as that radius.
  float d = mix(dot(q, n) - lvl, length(q) - max(0.0, lvl), uArc) + air * uWarp;

  float w = max(0.004, uCore * (1.0 + iMouse.x * uOpen));
  float band = exp(-(d * d) / (w * w));
  float wide = exp(-abs(d) / max(0.02, uReach));

  float f = uAmbient + uBright * band + uSkirt * wide + tfInfuse;
  f = clamp((f - uMidpoint) * uContrast + 0.5, 0.0, 1.0);


  // the hue swap is as soft as the band is wide, so the two accents change hands UNDER
  // the light rather than beside it — no edge of red ever touches an edge of blue
  float side = smoothstep(-1.0, 1.0, d / max(0.03, uCore + uReach * 0.35));
  vec3 col = ramp4(f, side);
  col += uColorD * uGlow * pow(f, 4.0);
  col = mix(uBg, col, smoothstep(0.0, max(0.01, uSink), f) * 0.90 + 0.10);

  col *= 1.0 - uVignette * dot(uv, uv);
  { float hgL = clamp(dot(col, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    col += houseGrain(gl_FragCoord.xy) * uGrain * mix(1.0, 4.0 * hgL * (1.0 - hgL), 0.6); }
  col += triDither(gl_FragCoord.xy) * uDither;

  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const hexToVec3 = (hex) => { const n = parseInt(hex.slice(1), 16); return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const UNIFORMS = { bgColor: 'uBg', colorA: 'uColorA', colorB: 'uColorB', colorC: 'uColorC', colorD: 'uColorD' };
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Mount the gradient inside `host` (an empty, positioned element). Returns null on fallback. */
export function mount(host, palette = BRAND) {
  if (host.dataset.meridian) return null;
  host.dataset.meridian = 'on';
  const CONFIG = { ...BASE, ...palette };
  const canvas = document.createElement('canvas');
  canvas.className = 'meridian-canvas';
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) { host.classList.add('is-fallback'); return null; }
  host.appendChild(canvas);

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
  } catch (err) {
    console.warn('meridian', err);
    canvas.remove();
    host.classList.add('is-fallback');
    return null;
  }
  gl.useProgram(program);
  gl.bindVertexArray(gl.createVertexArray());
  const LOC = {};
  const loc = (n) => (n in LOC ? LOC[n] : (LOC[n] = gl.getUniformLocation(program, n)));
  const u1f = (n, v) => gl.uniform1f(loc(n), v);
  const u2f = (n, x, y) => gl.uniform2f(loc(n), x, y);
  const uName = (k) => UNIFORMS[k] || `u${k[0].toUpperCase()}${k.slice(1)}`;
  for (const [k, v] of Object.entries(CONFIG)) {
    if (k === 'cursor' || k === 'maxDpr') continue;
    if (typeof v === 'string') { const c = hexToVec3(v); gl.uniform3f(loc(uName(k)), c[0], c[1], c[2]); } else u1f(uName(k), v);
  }

  let w = 0, h = 0;
  const resize = () => {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
    const nw = Math.max(1, Math.round(r.width * dpr)), nh = Math.max(1, Math.round(r.height * dpr));
    if (nw === w && nh === h) return;
    w = nw; h = nh; canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    u2f('iResolution', w, h);
  };
  resize();
  const ro = new ResizeObserver(() => { resize(); if (still) draw(); });
  ro.observe(host);

  // the pointer, relative to this card; integrated in the loop exactly as the master does
  const mouse = { x: 0, y: 0, ax: 0, ay: 0, tx: 0, ty: 0 };
  const aim = (e) => {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * (r.width / r.height);
    mouse.ty = 0.5 - (e.clientY - r.top) / r.height;
  };
  addEventListener('pointermove', aim, { passive: true });
  addEventListener('pointerdown', aim, { passive: true });

  let visible = true;
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 });
  io.observe(host);

  let clock = 0, prevT = performance.now(), lastDraw = 0, raf = 0, dead = false;
  const still = reduceMotion();
  const draw = () => {
    u1f('iTime', clock);
    u2f('iMouse', mouse.x, mouse.y);
    u2f('iLead', mouse.ax, mouse.ay);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const stop = () => {
    if (dead) return;
    dead = true;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    removeEventListener('pointermove', aim);
    removeEventListener('pointerdown', aim);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
  canvas.addEventListener('webglcontextlost', () => { stop(); host.classList.add('is-fallback'); });

  const frame = (now) => {
    if (!canvas.isConnected) { stop(); return; }
    raf = requestAnimationFrame(frame);
    const raw = now - prevT;
    prevT = now;
    if (!visible || document.hidden) return;
    const ms = raw > 50 ? 50 : raw < 4.167 ? 4.167 : raw;
    const s = ms > 36.7 ? 2.2 : ms * 0.06;
    clock += ms * 0.001;
    const kLead = 0.105 * s, kBody = 0.043 * s;
    mouse.ax += (mouse.tx - mouse.ax) * kLead;
    mouse.ay += (mouse.ty - mouse.ay) * kLead;
    mouse.x += (mouse.ax - mouse.x) * kBody;
    mouse.y += (mouse.ay - mouse.y) * kBody;
    if (now - lastDraw < 31) return; // ~30 fps is plenty for a band this slow, and kinder to the battery
    lastDraw = now;
    draw();
  };

  clock = 7; // start mid-sway rather than on the first frame of the loop
  draw();
  host.classList.add('is-live');
  if (still) {
    // one still frame; keep it if the card resizes, release it when the card leaves the page
    const watch = setInterval(() => { if (!canvas.isConnected) { clearInterval(watch); stop(); } }, 4000);
    return { stop };
  }
  raf = requestAnimationFrame(frame);
  return { stop };
}

/** Mount every `.meridian` placeholder under `root` that isn't running yet. */
export function enhance(root) {
  root.querySelectorAll('.meridian:not([data-meridian])').forEach((el) => mount(el));
}
