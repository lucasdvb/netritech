import { useLayoutEffect, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, ShaderMaterial } from "three";
import { lin } from "../theme";
import { AGENT_LOCAL, PODS } from "../lib/layout";
import { ramp, rng } from "../lib/math";
import { worldAt } from "../lib/world";

/**
 * The AI agent at every pod: an abstract spindle of three helices of light with a halo of
 * points where a head would be, and a ring on the floor. No face, no limbs: a presence, not a robot.
 * It blooms upward and outward a few frames after the scan ring passes its pod.
 */
const HELIX_N = 44;
const HALO_N = 26;
const BASE_N = 40;

type Vtx = { lx: number; ly: number; lz: number; h: number; kind: number };

const agentTemplate = () => {
  const pts: Vtx[] = [];
  const segs: [number, number][] = [];
  const radius = (h: number) => 0.05 + 0.085 * Math.pow(Math.sin(Math.PI * Math.min(h * 1.08, 1)), 0.8) - 0.02 * h;
  for (let k = 0; k < 3; k++) {
    const start = pts.length;
    for (let i = 0; i < HELIX_N; i++) {
      const h = i / (HELIX_N - 1);
      const a = (k * Math.PI * 2) / 3 + h * Math.PI * 2.3;
      const r = radius(h);
      pts.push({ lx: Math.cos(a) * r, ly: 0.06 + h * 1.36, lz: Math.sin(a) * r, h, kind: 0 });
      if (i > 0) segs.push([start + i - 1, start + i]);
    }
  }
  // halo: a ring of light in place of a head
  const hs = pts.length;
  for (let i = 0; i < HALO_N; i++) {
    const a = (i / HALO_N) * Math.PI * 2;
    pts.push({ lx: Math.cos(a) * 0.072, ly: 1.56, lz: Math.sin(a) * 0.072, h: 1, kind: 1 });
    segs.push([hs + i, hs + ((i + 1) % HALO_N)]);
  }
  // floor ring
  const bs = pts.length;
  for (let i = 0; i < BASE_N; i++) {
    const a = (i / BASE_N) * Math.PI * 2;
    pts.push({ lx: Math.cos(a) * 0.28, ly: 0.012, lz: Math.sin(a) * 0.28, h: 0, kind: 2 });
    segs.push([bs + i, bs + ((i + 1) % BASE_N)]);
  }
  return { pts, segs };
};

const vertexCommon = /* glsl */ `
  attribute vec3 aLocal;
  attribute float aH;
  attribute float aKind;
  attribute float aStart;
  attribute float aSeed;
  uniform float uFrame;
  varying float vA;
  varying float vKind;
  vec3 agentPos() {
    float b = clamp((uFrame - aStart) / 18.0, 0.0, 1.0);
    float eb = 1.0 - pow(1.0 - b, 3.0);
    vec3 l = aLocal;
    float ang = (1.0 - eb) * 2.2 + uFrame * 0.014 + aSeed * 6.2831;
    float s = sin(ang), c = cos(ang);
    float rs = aKind == 2.0 ? eb : (0.25 + 0.75 * eb);
    vec2 xz = vec2(c * l.x - s * l.z, s * l.x + c * l.z) * rs;
    float y = aKind == 0.0 ? l.y * (0.12 + 0.88 * eb) : l.y;
    // visibility: helices draw upwards, the halo lands last, the floor ring flashes then settles
    float vis = aKind == 0.0 ? smoothstep(aH - 0.04, aH + 0.02, eb * 1.06)
              : aKind == 1.0 ? smoothstep(0.78, 1.0, eb)
              : (b > 0.0 ? 0.35 + 0.65 * exp(-(uFrame - aStart) / 10.0) : 0.0);
    // a slow breath travelling up the figure once it has formed
    float breath = 0.82 + 0.18 * sin(uFrame * 0.11 - aH * 5.0 + aSeed * 9.0);
    vA = vis * breath * step(0.0, uFrame - aStart);
    vKind = aKind;
    return position + vec3(xz.x, y, xz.y);
  }`;

const makeMaterial = (points: boolean) =>
  new ShaderMaterial({
    uniforms: {
      uFrame: { value: 0 },
      uTeal: { value: new Color(...lin.neonTeal).multiplyScalar(2.4) },
      uIce: { value: new Color(...lin.ice).multiplyScalar(2.2) },
      uPixel: { value: 1000 },
      uDim: { value: 1 },
    },
    vertexShader:
      vertexCommon +
      /* glsl */ `
      uniform float uPixel;
      void main() {
        vec3 p = agentPos();
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        ${points ? "gl_PointSize = clamp(0.016 * uPixel / -mv.z, 1.4, 7.0);" : ""}
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTeal;
      uniform vec3 uIce;
      uniform float uDim;
      varying float vA;
      varying float vKind;
      void main() {
        ${points ? "vec2 q = gl_PointCoord * 2.0 - 1.0; float r = dot(q, q); if (r > 1.0) discard; float g = exp(-r * 3.5);" : "float g = 0.38;"}
        vec3 c = vKind == 1.0 ? uIce : uTeal;
        gl_FragColor = vec4(c * g * vA * uDim, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });

export const Agents: React.FC = () => {
  const frame = useCurrentFrame();
  const { pointsGeo, linesGeo } = useMemo(() => {
    const t = agentTemplate();
    const r = rng(314);
    const n = PODS.length;
    const build = (verts: number[]) => {
      const N = verts.length * n;
      const pos = new Float32Array(N * 3);
      const loc = new Float32Array(N * 3);
      const h = new Float32Array(N);
      const kind = new Float32Array(N);
      const st = new Float32Array(N);
      const sd = new Float32Array(N);
      let o = 0;
      PODS.forEach((p) => {
        const seed = r();
        verts.forEach((vi) => {
          const v = t.pts[vi];
          pos.set([p.x + AGENT_LOCAL[0], 0, p.z + AGENT_LOCAL[2]], o * 3);
          loc.set([v.lx, v.ly, v.lz], o * 3);
          h[o] = v.h;
          kind[o] = v.kind;
          st[o] = p.bloomAt;
          sd[o] = seed;
          o++;
        });
      });
      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(pos, 3));
      g.setAttribute("aLocal", new BufferAttribute(loc, 3));
      g.setAttribute("aH", new BufferAttribute(h, 1));
      g.setAttribute("aKind", new BufferAttribute(kind, 1));
      g.setAttribute("aStart", new BufferAttribute(st, 1));
      g.setAttribute("aSeed", new BufferAttribute(sd, 1));
      return g;
    };
    const pointsGeo = build(t.pts.map((_, i) => i));
    const linesGeo = build(t.segs.flat());
    return { pointsGeo, linesGeo };
  }, []);
  const pMat = useMemo(() => makeMaterial(true), []);
  const lMat = useMemo(() => makeMaterial(false), []);
  const w = worldAt(frame);
  useLayoutEffect(() => {
    [pMat, lMat].forEach((m) => {
      m.uniforms.uFrame.value = frame;
      m.uniforms.uPixel.value = w.pixel;
      m.uniforms.uDim.value = w.office * (1 - 0.6 * ramp(frame, 186, 200));
    });
  });
  return (
    <group visible={w.office > 0}>
      <lineSegments geometry={linesGeo} material={lMat} frustumCulled={false} />
      <points geometry={pointsGeo} material={pMat} frustumCulled={false} />
    </group>
  );
};
