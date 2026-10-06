import {
  AdditiveBlending,
  Color,
  DataTexture,
  LinearFilter,
  RGBAFormat,
  ShaderMaterial,
  UnsignedByteType,
} from "three";

type RGB = [number, number, number];

/**
 * Hairline linework revealed by the scan. Each vertex carries aStart (the frame the scan reaches it).
 * It flashes bright as the ring passes, then settles to its rest colour. Additive, HDR (feeds bloom).
 */
export const makeScanLineMaterial = (color: RGB, flash: RGB, opacity = 1, far = 60) =>
  new ShaderMaterial({
    uniforms: {
      uFrame: { value: 0 },
      uColor: { value: new Color(...color) },
      uFlash: { value: new Color(...flash) },
      uOpacity: { value: opacity },
      uNear: { value: far * 0.45 },
      uFar: { value: far },
      uDim: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aStart;
      uniform float uFrame;
      varying float vT;
      varying float vDepth;
      void main() {
        vT = uFrame - aStart;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uFlash;
      uniform float uOpacity;
      uniform float uNear;
      uniform float uFar;
      uniform float uDim;
      varying float vT;
      varying float vDepth;
      void main() {
        if (vT < 0.0) discard;
        float reveal = smoothstep(0.0, 8.0, vT);
        float flash = exp(-vT / 5.0);
        float fade = 1.0 - smoothstep(uNear, uFar, vDepth);
        float nearFade = smoothstep(0.015, 0.12, vDepth);
        vec3 c = uColor * reveal + uFlash * flash;
        gl_FragColor = vec4(c * uOpacity * uDim * fade * nearFade, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });

/**
 * Soft points with a physically-motivated circle of confusion: points far from the focus plane
 * open into dim discs (bokeh), points in focus stay crisp. Deterministic drift from uFrame.
 */
export const makeBokehPointsMaterial = (color: RGB, opts: { size?: number; opacity?: number; drift?: number; gain?: number } = {}) =>
  new ShaderMaterial({
    uniforms: {
      uFrame: { value: 0 },
      uColor: { value: new Color(...color) },
      uSize: { value: opts.size ?? 0.012 },
      uOpacity: { value: opts.opacity ?? 1 },
      uDrift: { value: opts.drift ?? 0 },
      uFocus: { value: 1 },
      uAperture: { value: 0 },
      uPixel: { value: 1000 },
      uGain: { value: opts.gain ?? 1 },
      uDim: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute float aStart;
      attribute float aSize;
      attribute float aSeed;
      uniform float uFrame;
      uniform float uSize;
      uniform float uOpacity;
      uniform float uDrift;
      uniform float uFocus;
      uniform float uAperture;
      uniform float uPixel;
      uniform float uGain;
      varying float vAlpha;
      varying float vSoft;
      varying float vFlash;
      void main() {
        vec3 p = position;
        float s = aSeed * 6.2831;
        p += uDrift * vec3(
          sin(uFrame * 0.031 + s * 3.0),
          sin(uFrame * 0.023 + s * 5.0) * 0.6 + uFrame * 0.004,
          cos(uFrame * 0.027 + s * 7.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float z = max(-mv.z, 0.001);
        float base = max(uSize * aSize * uPixel / z, 1.2);
        float coc = uAperture * uPixel * abs(z - uFocus) / (z * uFocus);
        float size = min(base + coc, 220.0);
        gl_PointSize = size;
        float energy = clamp((base * base) / (size * size) * uGain, 0.0, 1.0);
        float t = uFrame - aStart;
        float reveal = smoothstep(0.0, 6.0, t);
        vFlash = t >= 0.0 ? exp(-t / 4.0) : 0.0;
        vAlpha = uOpacity * reveal * max(energy, 0.01) * smoothstep(0.02, 0.2, z);
        vSoft = clamp(coc / size * 1.6, 0.0, 1.0);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uDim;
      varying float vAlpha;
      varying float vSoft;
      varying float vFlash;
      void main() {
        vec2 q = gl_PointCoord * 2.0 - 1.0;
        float r = length(q);
        if (r > 1.0) discard;
        float g = exp(-r * r * 5.0);
        float disc = smoothstep(1.0, 0.82, r) * (0.7 + 0.3 * smoothstep(0.5, 0.95, r));
        float a = mix(g, disc, vSoft);
        gl_FragColor = vec4(uColor * a * vAlpha * uDim * (1.0 + 2.5 * vFlash), 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });

/** Radial gaussian glow texture, generated in code. */
export const glowTexture = (() => {
  const n = 128;
  const d = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const u = (x + 0.5) / n - 0.5;
      const v = (y + 0.5) / n - 0.5;
      const r = Math.sqrt(u * u + v * v) * 2;
      const a = Math.max(0, Math.exp(-r * r * 9) * 0.85 + Math.exp(-r * r * 2.2) * 0.15 - 0.002 * r);
      const i = (y * n + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = 255;
      d[i + 3] = Math.round(Math.min(1, a * (r < 1 ? 1 : 0)) * 255);
    }
  }
  const t = new DataTexture(d, n, n, RGBAFormat, UnsignedByteType);
  t.magFilter = LinearFilter;
  t.minFilter = LinearFilter;
  t.needsUpdate = true;
  return t;
})();

/** Soft shadow blob texture for product-shot contact shadows. */
export const blobTexture = (() => {
  const n = 128;
  const d = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const u = ((x + 0.5) / n - 0.5) * 2;
      const v = ((y + 0.5) / n - 0.5) * 2;
      const r = Math.sqrt(u * u + v * v);
      const a = Math.pow(Math.max(0, 1 - r), 1.8);
      const i = (y * n + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = 0;
      d[i + 3] = Math.round(a * 255);
    }
  }
  const t = new DataTexture(d, n, n, RGBAFormat, UnsignedByteType);
  t.magFilter = LinearFilter;
  t.minFilter = LinearFilter;
  t.needsUpdate = true;
  return t;
})();
