import { useLayoutEffect, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { AdditiveBlending, Color, ShaderMaterial, Vector3 } from "three";
import { lin } from "../theme";
import { LINKS } from "../lib/layout";
import { mergeTubes, taperedTube } from "../lib/geo";
import { ramp } from "../lib/math";
import { worldAt } from "../lib/world";

/**
 * Tapered glowing tubes. Thickness is shaped in the vertex shader from aU (0..1 along the curve):
 * a draw-on head, tapered ends, and a minimum on-screen width (with matching alpha falloff)
 * so sub-pixel tubes never shimmer. Light packets travel along each tube.
 */
export const makeRibbonMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uFrame: { value: 0 },
      uPixel: { value: 1000 },
      uRadius: { value: 0.011 },
      uCore: { value: new Color(...lin.neonTeal).multiplyScalar(1.15) },
      uPacket: { value: new Color(...lin.ice).multiplyScalar(3.2) },
      uDim: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aOff;
      attribute float aU;
      attribute float aStart;
      attribute float aSeed;
      uniform float uFrame;
      uniform float uPixel;
      uniform float uRadius;
      varying float vU;
      varying float vAlpha;
      varying float vT;
      varying float vSeed;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float t = uFrame - aStart;
        float head = clamp(t / 16.0, 0.0, 1.0);
        head = 1.0 - pow(1.0 - head, 2.0);
        float taper = pow(sin(3.14159 * clamp(aU, 0.0, 1.0)), 0.45);
        float drawn = smoothstep(head + 0.001, head - 0.05, aU);
        vec4 c = modelViewMatrix * vec4(position, 1.0);
        float z = max(-c.z, 0.01);
        float r = uRadius * taper * drawn;
        float rMin = 1.1 * z / uPixel;
        float rEff = max(r, rMin * step(0.0001, r));
        vAlpha = r > 0.0 ? r / rEff : 0.0;
        vec3 p = position + aOff * rEff;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vN = normalize(normalMatrix * aOff);
        vV = normalize(-mv.xyz);
        vU = aU;
        vT = t;
        vSeed = aSeed;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uCore;
      uniform vec3 uPacket;
      uniform float uDim;
      varying float vU;
      varying float vAlpha;
      varying float vT;
      varying float vSeed;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        if (vAlpha <= 0.0) discard;
        float facing = pow(abs(dot(normalize(vN), normalize(vV))), 1.4);
        float pk = 0.0;
        for (int k = 0; k < 3; k++) {
          float p = fract(vSeed + float(k) / 3.0 + vT * 0.022);
          float d = (vU - p) * 26.0;
          pk += exp(-d * d);
        }
        vec3 col = uCore * (0.25 + 0.55 * facing) + uPacket * pk * facing;
        gl_FragColor = vec4(col * vAlpha * uDim, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });

export const Ribbons: React.FC = () => {
  const frame = useCurrentFrame();
  const geo = useMemo(() => {
    const tubes = LINKS.map((l) => {
      const a = new Vector3(...l.a);
      const b = new Vector3(...l.b);
      const d = a.distanceTo(b);
      const h = 0.7 + d * 0.16;
      const side = new Vector3().subVectors(b, a).cross(new Vector3(0, 1, 0)).normalize().multiplyScalar(d * 0.08 * (l.seed - 0.5));
      const pts: Vector3[] = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        pts.push(new Vector3().lerpVectors(a, b, t).add(new Vector3(0, 4 * h * t * (1 - t), 0)).addScaledVector(side, Math.sin(Math.PI * t)));
      }
      return { g: taperedTube(pts, Math.max(48, Math.round(d * 8)), 6), attrs: { aStart: l.start, aSeed: l.seed } };
    });
    return mergeTubes(tubes);
  }, []);
  const mat = useMemo(makeRibbonMaterial, []);
  const w = worldAt(frame);
  useLayoutEffect(() => {
    mat.uniforms.uFrame.value = frame;
    mat.uniforms.uPixel.value = w.pixel;
    mat.uniforms.uDim.value = w.office * (1 - 0.7 * ramp(frame, 184, 200));
  });
  return <mesh geometry={geo} material={mat} frustumCulled={false} visible={w.office > 0} />;
};
