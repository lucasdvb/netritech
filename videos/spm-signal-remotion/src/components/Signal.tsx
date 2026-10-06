import { useLayoutEffect, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  PlaneGeometry,
  ShaderMaterial,
} from "three";
import { cues, lin } from "../theme";
import { HEADSET_BASE, MIC_TIP, SCAN_MAX, scanRadius } from "../lib/layout";
import { glowTexture, makeBokehPointsMaterial } from "../lib/materials";
import { ease, ramp, rng, window4 } from "../lib/math";
import { worldAt } from "../lib/world";

/** The call made visible: the scan ring on the floor, the signal threads, the mic's sound rings. */

const ringMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uR: { value: 0 },
      uAlpha: { value: 0 },
      uCenter: { value: [HEADSET_BASE[0], HEADSET_BASE[2]] },
      uRing: { value: new Color(...lin.neonTeal).multiplyScalar(4.5) },
      uWash: { value: new Color(...lin.teal).multiplyScalar(1.4) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform float uR;
      uniform float uAlpha;
      uniform vec2 uCenter;
      uniform vec3 uRing;
      uniform vec3 uWash;
      varying vec3 vW;
      void main() {
        float d = length(vW.xz - uCenter);
        float w = 0.035 + uR * 0.0045;
        float x = (d - uR) / w;
        float ring = exp(-x * x);
        float behind = d < uR ? exp(-(uR - d) / 2.6) * 0.22 : 0.0;
        // two faint echo rings trailing the front
        float e1 = exp(-pow((d - uR * 0.82) / (w * 0.7), 2.0)) * 0.18;
        float e2 = exp(-pow((d - uR * 0.66) / (w * 0.6), 2.0)) * 0.08;
        vec3 c = uRing * (ring + e1 + e2) + uWash * behind;
        gl_FragColor = vec4(c * uAlpha, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });

const curtainMaterial = () =>
  new ShaderMaterial({
    uniforms: { uAlpha: { value: 0 }, uColor: { value: new Color(...lin.neonTeal).multiplyScalar(0.9) } },
    vertexShader: /* glsl */ `
      varying float vY;
      void main() { vY = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uAlpha;
      uniform vec3 uColor;
      varying float vY;
      void main() { gl_FragColor = vec4(uColor * pow(1.0 - vY, 3.0) * uAlpha, 1.0); }`,
    transparent: true,
    depthWrite: false,
    side: 2,
    blending: AdditiveBlending,
    toneMapped: false,
  });

const threadMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uFrame: { value: 0 },
      uDim: { value: 0 },
      uIce: { value: new Color(...lin.ice).multiplyScalar(1.3) },
      uTeal: { value: new Color(...lin.neonTeal).multiplyScalar(1.2) },
    },
    vertexShader: /* glsl */ `
      attribute float aV;
      attribute float aSeed;
      attribute float aStart;
      uniform float uFrame;
      varying float vV;
      varying float vSeed;
      varying float vT;
      varying float vDepth;
      void main() {
        vV = aV; vSeed = aSeed; vT = uFrame - aStart;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uIce;
      uniform vec3 uTeal;
      uniform float uDim;
      uniform float uFrame;
      varying float vV;
      varying float vSeed;
      varying float vT;
      varying float vDepth;
      void main() {
        if (vT < 0.0) discard;
        float grow = smoothstep(vV - 0.05, vV + 0.02, vT / 22.0);
        float ends = pow(sin(3.14159 * vV), 0.7);
        float p = fract(vSeed * 7.0 + vT * 0.035);
        float pk = exp(-pow((vV - p) * 14.0, 2.0));
        float near = smoothstep(0.02, 0.4, vDepth);
        vec3 c = mix(uTeal, uIce, vSeed) * (0.32 + 2.2 * pk);
        gl_FragColor = vec4(c * ends * grow * near * uDim, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });

const circle = (n: number) => {
  const p = new Float32Array((n + 1) * 3);
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    p.set([Math.cos(a), 0, Math.sin(a)], i * 3);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(p, 3));
  return g;
};

export const Signal: React.FC = () => {
  const frame = useCurrentFrame();
  const w = worldAt(frame);
  const ringMat = useMemo(ringMaterial, []);
  const curtMat = useMemo(curtainMaterial, []);
  const thrMat = useMemo(threadMaterial, []);
  const ringGeo = useMemo(() => new PlaneGeometry(SCAN_MAX * 2.4, SCAN_MAX * 2.4).rotateX(-Math.PI / 2), []);
  const curtGeo = useMemo(() => new CylinderGeometry(1, 1, 1, 160, 1, true), []);
  const circ = useMemo(() => circle(192), []);

  const threads = useMemo(() => {
    const r = rng(808);
    const pos: number[] = [];
    const v: number[] = [];
    const sd: number[] = [];
    const st: number[] = [];
    const N = 170;
    const SEG = 24; // segmented so packets and fades resolve along each line
    for (let i = 0; i < N; i++) {
      const rad = 0.06 + Math.pow(r(), 1.6) * 3.2;
      const a = r() * Math.PI * 2;
      const x = MIC_TIP[0] + Math.cos(a) * rad;
      const z = MIC_TIP[2] + Math.sin(a) * rad;
      const y0 = MIC_TIP[1] + 0.05 + r() * 0.3;
      const y1 = y0 + 1.6 + r() * 8.5;
      const seed = r();
      const start = cues.threadsIn + rad * 3 + r() * 4;
      for (let k = 0; k < SEG; k++) {
        const t0 = k / SEG;
        const t1 = (k + 1) / SEG;
        pos.push(x, y0 + (y1 - y0) * t0, z, x, y0 + (y1 - y0) * t1, z);
        v.push(t0, t1);
        sd.push(seed, seed);
        st.push(start, start);
      }
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute("aV", new BufferAttribute(new Float32Array(v), 1));
    g.setAttribute("aSeed", new BufferAttribute(new Float32Array(sd), 1));
    g.setAttribute("aStart", new BufferAttribute(new Float32Array(st), 1));
    return g;
  }, []);

  // bokeh: motes the camera falls through on the dive
  const bokehGeo = useMemo(() => {
    const r = rng(616);
    const N = 420;
    const p = new Float32Array(N * 3);
    const st = new Float32Array(N);
    const sz = new Float32Array(N);
    const sd = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const rad = 0.05 + Math.pow(r(), 0.8) * 1.4;
      const a = r() * Math.PI * 2;
      p.set([MIC_TIP[0] + Math.cos(a) * rad, MIC_TIP[1] + 0.12 + Math.pow(r(), 1.5) * 4.5, MIC_TIP[2] + Math.sin(a) * rad], i * 3);
      st[i] = -100;
      sz[i] = 0.5 + r() * 1.2;
      sd[i] = r();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(p, 3));
    g.setAttribute("aStart", new BufferAttribute(st, 1));
    g.setAttribute("aSize", new BufferAttribute(sz, 1));
    g.setAttribute("aSeed", new BufferAttribute(sd, 1));
    return g;
  }, []);
  const bokehMat = useMemo(() => makeBokehPointsMaterial([lin.neonTeal[0] * 1.4, lin.neonTeal[1] * 1.4, lin.neonTeal[2] * 1.4], { size: 0.004, opacity: 0.9, drift: 0.01, gain: 6 }), []);

  const R = scanRadius(frame);
  const scanAlpha = window4(frame, cues.scanStart, cues.scanStart + 3, cues.scanEnd - 8, cues.scanEnd + 2);
  useLayoutEffect(() => {
    ringMat.uniforms.uR.value = R;
    ringMat.uniforms.uAlpha.value = scanAlpha * w.office;
    curtMat.uniforms.uAlpha.value = scanAlpha * 0.55 * w.office * (1 - ramp(R, 4, 30));
    bokehMat.uniforms.uFrame.value = frame;
    bokehMat.uniforms.uFocus.value = w.cam.focus;
    bokehMat.uniforms.uAperture.value = w.aperture;
    bokehMat.uniforms.uPixel.value = w.pixel;
    bokehMat.uniforms.uDim.value = w.office * ramp(frame, 164, 178);
    thrMat.uniforms.uFrame.value = frame;
    thrMat.uniforms.uDim.value = w.office * ramp(frame, cues.threadsIn, cues.threadsIn + 10);
  });

  // the mic answers: two hairline rings ripple out like sound, and the tip begins to glow
  const rings = [180, 189].map((t0) => {
    const t = frame - t0;
    const r = t < 0 ? 0 : 0.01 + t * 0.0042 + t * t * 0.00006;
    const a = t < 0 ? 0 : Math.exp(-t / 22) * ramp(t, 0, 3);
    return { r, a };
  });
  const micGlow = ramp(frame, 166, 200, ease.inQuad) * w.office;
  const ringColor = useMemo(() => new Color(...lin.ice), []);

  return (
    <group visible={w.office > 0}>
      <mesh geometry={ringGeo} material={ringMat} position={[HEADSET_BASE[0], 0.004, HEADSET_BASE[2]]} frustumCulled={false} />
      <mesh geometry={curtGeo} material={curtMat} position={[HEADSET_BASE[0], 0.32, HEADSET_BASE[2]]} scale={[Math.max(R, 0.01), 0.64, Math.max(R, 0.01)]} frustumCulled={false} />
      <lineSegments geometry={threads} material={thrMat} frustumCulled={false} />
      <points geometry={bokehGeo} material={bokehMat} frustumCulled={false} />
      {rings.map((r, i) => (
        <lineLoop key={i} geometry={circ} position={MIC_TIP} scale={[Math.max(r.r, 0.001), 1, Math.max(r.r, 0.001)]} frustumCulled={false}>
          <lineBasicMaterial color={ringColor.clone().multiplyScalar(2.6 * r.a)} blending={AdditiveBlending} transparent depthWrite={false} toneMapped={false} />
        </lineLoop>
      ))}
      <sprite position={MIC_TIP} scale={[0.022 + micGlow * 0.012, 0.022 + micGlow * 0.012, 1]}>
        <spriteMaterial map={glowTexture} color={new Color(...lin.neonTeal).multiplyScalar(0.4 + micGlow * 2.2)} blending={AdditiveBlending} depthWrite={false} transparent toneMapped={false} />
      </sprite>
    </group>
  );
};
