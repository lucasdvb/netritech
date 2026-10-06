// Pure, deterministic helpers. Everything in the film is a function of the frame number.

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Ease = (t: number) => number;
export const ease = {
  smooth: ((t) => t * t * (3 - 2 * t)) as Ease,
  smoother: ((t) => t * t * t * (t * (t * 6 - 15) + 10)) as Ease,
  inOutCubic: ((t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)) as Ease,
  inOutSine: ((t) => -(Math.cos(Math.PI * t) - 1) / 2) as Ease,
  outCubic: ((t) => 1 - Math.pow(1 - t, 3)) as Ease,
  outQuart: ((t) => 1 - Math.pow(1 - t, 4)) as Ease,
  outExpo: ((t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))) as Ease,
  inCubic: ((t) => t * t * t) as Ease,
  inQuad: ((t) => t * t) as Ease,
};

/** Eased 0..1 progress of `f` across [a, b], clamped on both sides. */
export const ramp = (f: number, a: number, b: number, e: Ease = ease.smooth) =>
  e(clamp01((f - a) / (b - a)));

/** Rise over [a,b], hold, fall over [c,d]. */
export const window4 = (f: number, a: number, b: number, c: number, d: number, e: Ease = ease.smooth) =>
  ramp(f, a, b, e) * (1 - ramp(f, c, d, e));

/** Seeded PRNG (mulberry32). Never use Math.random in this project. */
export const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type Vec = number[];
export type Key = { f: number; v: Vec };

/**
 * Time-aware cubic Hermite spline through keys (Catmull-Rom tangents scaled by key spacing).
 * Velocity is continuous through every key; the first and last keys ease in/out (zero tangent).
 */
export const spline = (keys: Key[], f: number): Vec => {
  const n = keys.length;
  if (f <= keys[0].f) return keys[0].v.slice();
  if (f >= keys[n - 1].f) return keys[n - 1].v.slice();
  let i = 0;
  while (i < n - 2 && f > keys[i + 1].f) i++;
  const k0 = keys[i];
  const k1 = keys[i + 1];
  const dt = k1.f - k0.f;
  const tan = (j: number) => {
    if (j === 0 || j === n - 1) return keys[j].v.map(() => 0);
    if (keys[j].f === keys[j - 1].f || keys[j].f === keys[j + 1].f) return keys[j].v.map(() => 0);
    const a = keys[j - 1];
    const b = keys[j + 1];
    // zero tangent if the key is a local extremum per component keeps holds clean
    return keys[j].v.map((_, c) => {
      const d0 = keys[j].v[c] - a.v[c];
      const d1 = b.v[c] - keys[j].v[c];
      if (d0 * d1 <= 0) return 0;
      return (b.v[c] - a.v[c]) / (b.f - a.f);
    });
  };
  const m0 = tan(i);
  const m1 = tan(i + 1);
  const t = (f - k0.f) / dt;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return k0.v.map((p0, c) => h00 * p0 + h10 * dt * m0[c] + h01 * k1.v[c] + h11 * dt * m1[c]);
};

/** Smooth deterministic 1D value noise in [-1, 1]. */
export const vnoise = (x: number, seed = 0) => {
  const h = (n: number) => {
    const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  const i = Math.floor(x);
  const fr = x - i;
  const u = fr * fr * (3 - 2 * fr);
  return lerp(h(i), h(i + 1), u);
};
