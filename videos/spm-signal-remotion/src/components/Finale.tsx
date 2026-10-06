import { useLayoutEffect, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { AdditiveBlending, Color, PlaneGeometry, ShaderMaterial, Vector3 } from "three";
import { cues, lin } from "../theme";
import { CONVERGE } from "../lib/layout";
import { mergeTubes, taperedTube } from "../lib/geo";
import { ease, ramp, rng, window4 } from "../lib/math";
import { worldAt } from "../lib/world";

/**
 * Beat 7: soft, smoky, tapered ribbons swirl in radially to one point just above the glossy floor
 * (their mirror image comes from the floor's MeshReflectorMaterial). An anamorphic teal-white
 * flare marks the convergence. Every value is a function of the frame.
 */
const smokeMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uFrame: { value: 0 },
      uFade: { value: 1 },
      uIce: { value: new Color(...lin.ice).multiplyScalar(1.05) },
      uTeal: { value: new Color(...lin.neonTeal).multiplyScalar(0.95) },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aOff;
      attribute float aU;
      attribute float aV;
      attribute float aStart;
      attribute float aSeed;
      attribute float aLen;
      attribute float aWidth;
      uniform float uFrame;
      varying float vS;
      varying float vU;
      varying float vV;
      varying float vSeed;
      varying float vVis;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        float t = clamp((uFrame - aStart) / 24.0, 0.0, 1.25);
        float head = 1.0 - pow(1.0 - clamp(t, 0.0, 1.0), 2.4);
        head += max(t - 1.0, 0.0) * 0.6;
        float tail = head - aLen;
        float s = (aU - tail) / max(aLen, 0.001);       // 0 at the tail, 1 at the head
        vVis = (aU <= head && aU >= tail && aU <= 1.0) ? 1.0 : 0.0;
        float sc = clamp(s, 0.0, 1.0);
        float wobble = 0.75 + 0.25 * sin(aU * 23.0 + aSeed * 40.0 + uFrame * 0.09);
        float r = aWidth * pow(1.0 - sc, 0.85) * smoothstep(0.0, 0.25, sc) * wobble * vVis;
        // the closer to the point, the thinner the whole ribbon gets
        r *= 0.35 + 0.65 * (1.0 - aU);
        vec3 p = position + aOff * r;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * aOff);
        vView = normalize(-mv.xyz);
        vS = sc; vU = aU; vV = aV; vSeed = aSeed;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uFrame;
      uniform float uFade;
      uniform vec3 uIce;
      uniform vec3 uTeal;
      varying float vS;
      varying float vU;
      varying float vV;
      varying float vSeed;
      varying float vVis;
      varying vec3 vN;
      varying vec3 vView;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
      }
      void main() {
        if (vVis < 0.5) discard;
        float facing = abs(dot(normalize(vN), normalize(vView)));
        float soft = pow(facing, 3.0);
        float smoke = noise(vec2(vU * 9.0 - uFrame * 0.05, vV * 3.0 + vSeed * 10.0)) * 0.6
                    + noise(vec2(vU * 22.0 + vSeed * 5.0, vV * 6.0 - uFrame * 0.03)) * 0.4;
        float body = smoothstep(0.0, 0.45, vS) * (0.45 + 0.75 * smoke);
        float tip = smoothstep(0.7, 1.0, vS) * 1.6;
        vec3 col = mix(uTeal, uIce, clamp(vSeed * 0.8 + vS * 0.5, 0.0, 1.0));
        gl_FragColor = vec4(col * soft * (body + tip) * 0.42 * uFade, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });

const flareMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uI: { value: 0 },
      uCore: { value: new Color(...lin.ice).multiplyScalar(5) },
      uStreak: { value: new Color(...lin.neonTeal).multiplyScalar(2.2) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vP;
      void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uI;
      uniform vec3 uCore;
      uniform vec3 uStreak;
      varying vec2 vP;
      void main() {
        float y = vP.y;
        float x = vP.x;
        float streak = exp(-pow(y / 0.0085, 2.0)) * exp(-abs(x) / 0.9);
        float wide = exp(-pow(y / 0.03, 2.0)) * exp(-abs(x) / 0.35) * 0.35;
        float core = exp(-dot(vP, vP) / 0.0009);
        vec3 c = uStreak * (streak + wide) + uCore * core;
        gl_FragColor = vec4(c * uI, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });

export const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const w = worldAt(frame);
  const geo = useMemo(() => {
    const r = rng(2026);
    const P = new Vector3(...CONVERGE);
    const tubes = [];
    const N = 22;
    for (let k = 0; k < N; k++) {
      // spread around the upper half and the flanks; the lower centre stays empty
      const th0 = -0.22 + (k / (N - 1)) * (Math.PI + 0.44) + (r() - 0.5) * 0.18;
      const R0 = 2.4 + r() * 2.2;
      const z0 = (r() - 0.5) * 3.2;
      const dir = r() < 0.5 ? -1 : 1;
      const swirl = dir * (0.9 + r() * 0.8);
      const pts: Vector3[] = [];
      for (let i = 0; i <= 28; i++) {
        const u = i / 28;
        const rad = R0 * Math.pow(1 - u, 1.35);
        const th = th0 + swirl * u;
        const y = Math.max(0.035, P.y + Math.sin(th) * rad * 0.8);
        pts.push(new Vector3(P.x + Math.cos(th) * rad, y, P.z + z0 * Math.pow(1 - u, 1.7)));
      }
      tubes.push({
        g: taperedTube(pts, 140, 10),
        attrs: { aStart: cues.cut - 6 + r() * 12, aSeed: r(), aLen: 0.5 + r() * 0.25, aWidth: 0.11 + r() * 0.12 },
      });
    }
    return mergeTubes(tubes);
  }, []);
  const mat = useMemo(smokeMaterial, []);
  const flare = useMemo(flareMaterial, []);
  const flareGeo = useMemo(() => new PlaneGeometry(7, 0.5), []);
  const arrive = window4(frame, 210, 219, 226, 234, ease.inOutSine);
  const fade = 1 - ramp(frame, cues.finaleOut, cues.gridIn + 4, ease.inOutSine);
  useLayoutEffect(() => {
    mat.uniforms.uFrame.value = frame;
    mat.uniforms.uFade.value = fade * w.finale;
    flare.uniforms.uI.value = (0.15 * ramp(frame, cues.cut, cues.cut + 6) + 0.85 * arrive) * w.finale;
  });
  return (
    <group visible={w.finale > 0}>
      <mesh geometry={geo} material={mat} frustumCulled={false} />
      <mesh geometry={flareGeo} material={flare} position={CONVERGE} frustumCulled={false} />
    </group>
  );
};
