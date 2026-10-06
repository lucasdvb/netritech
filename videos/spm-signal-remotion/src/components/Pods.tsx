import { useLayoutEffect, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Euler,
  LatheGeometry,
  Material,
  Matrix4,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { cues, lin } from "../theme";
import { DESK_TOP, HEADSET_BASE, PLANTS, PODS, SEAT_LOCAL, scanFrameAt } from "../lib/layout";
import { edgePositions, lineGeometry, surfaceSamples } from "../lib/geo";
import { makeBokehPointsMaterial, makeScanLineMaterial } from "../lib/materials";
import { ramp, rng } from "../lib/math";
import { worldAt } from "../lib/world";

type Group = "desk" | "dark" | "fabric" | "screen" | "glass" | "leaf";
type Part = { geo: BufferGeometry; m: Matrix4; group: Group; wire?: boolean; pts?: number };

const T = (x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, s: [number, number, number] = [1, 1, 1]) =>
  new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(rx, ry, rz)), new Vector3(...s));

/** One call-centre pod, local to its origin (desk centre on the floor). Desk faces -Z. */
const podParts = (): Part[] => {
  const p: Part[] = [];
  p.push({ geo: new BoxGeometry(1.4, 0.028, 0.7), m: T(0, DESK_TOP - 0.014, 0), group: "desk", wire: true, pts: 70 });
  for (const s of [-1, 1]) p.push({ geo: new BoxGeometry(0.025, DESK_TOP - 0.028, 0.6), m: T(0.67 * s, (DESK_TOP - 0.028) / 2, 0), group: "dark", wire: true });
  p.push({ geo: new BoxGeometry(1.4, 0.34, 0.012), m: T(0, DESK_TOP + 0.2, -0.36), group: "glass", wire: true, pts: 22 });
  p.push({ geo: new BoxGeometry(0.6, 0.36, 0.022), m: T(0, 1.06, -0.2), group: "dark", wire: true });
  p.push({ geo: new PlaneGeometry(0.57, 0.33), m: T(0, 1.06, -0.2 + 0.0116), group: "screen", wire: true, pts: 40 });
  p.push({ geo: new BoxGeometry(0.045, 0.2, 0.02), m: T(0, 0.84, -0.225), group: "dark", wire: true });
  p.push({ geo: new BoxGeometry(0.22, 0.01, 0.15), m: T(0, DESK_TOP + 0.005, -0.21), group: "dark", wire: true });
  p.push({ geo: new BoxGeometry(0.42, 0.012, 0.13), m: T(0, DESK_TOP + 0.006, 0.1), group: "dark", wire: true });
  // the pod's own headset, resting upright on the desk
  p.push({ geo: new TorusGeometry(0.068, 0.0055, 5, 18, Math.PI), m: T(0.47, DESK_TOP + 0.045, 0.02), group: "dark", wire: true });
  for (const s of [-1, 1]) p.push({ geo: new CylinderGeometry(0.038, 0.038, 0.028, 22), m: T(0.47 + 0.068 * s, DESK_TOP + 0.04, 0.02, 0, 0, Math.PI / 2), group: "dark", wire: true });
  // chair
  p.push({ geo: new BoxGeometry(0.5, 0.07, 0.48), m: T(0, 0.47, SEAT_LOCAL[2]), group: "fabric", wire: true, pts: 18 });
  p.push({ geo: new BoxGeometry(0.48, 0.55, 0.06), m: T(0, 0.84, SEAT_LOCAL[2] + 0.25, -0.12), group: "fabric", wire: true, pts: 14 });
  p.push({ geo: new CylinderGeometry(0.025, 0.025, 0.36, 12), m: T(0, 0.27, SEAT_LOCAL[2]), group: "dark" });
  p.push({ geo: new CylinderGeometry(0.3, 0.3, 0.03, 24), m: T(0, 0.06, SEAT_LOCAL[2]), group: "dark", wire: true });
  return p;
};

const plantParts = (x: number, z: number, s: number, rot: number, seed: number): Part[] => {
  const r = rng(seed);
  const p: Part[] = [];
  p.push({ geo: new CylinderGeometry(0.2 * s, 0.15 * s, 0.44 * s, 24), m: T(x, 0.22 * s, z), group: "desk", wire: true, pts: 20 });
  const n = 11;
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2 + r() * 0.4;
    const tilt = 0.25 + r() * 0.55;
    const len = (0.34 + r() * 0.22) * s;
    const m = new Matrix4()
      .makeTranslation(x, 0.44 * s, z)
      .multiply(new Matrix4().makeRotationY(a))
      .multiply(new Matrix4().makeRotationZ(tilt))
      .multiply(new Matrix4().makeTranslation(0, len, 0))
      .multiply(new Matrix4().makeScale(0.075 * s, len, 0.012 * s));
    p.push({ geo: new SphereGeometry(1, 10, 8), m, group: "leaf", pts: 10 });
  }
  return p;
};

/** Foreground props the crane sweeps past (glass partition, plants, a monitor). */
const fgParts = (): Part[] => {
  const p: Part[] = [];
  // glass partition behind the opening camera
  p.push({ geo: new BoxGeometry(2.6, 1.42, 0.02), m: T(1.15, 0.71, 3.15), group: "glass", wire: true, pts: 40 });
  p.push({ geo: new BoxGeometry(2.6, 0.035, 0.035), m: T(1.15, 1.43, 3.15), group: "dark", wire: true });
  // tall plants flanking the crane path
  p.push(...plantParts(1.25, 1.9, 1.55, 0.3, 501));
  p.push(...plantParts(-0.9, 2.6, 1.3, 1.1, 502));
  // a second-row monitor, back to the hero desk
  p.push({ geo: new BoxGeometry(0.6, 0.36, 0.022), m: T(0.5, 1.08, 1.45, 0, Math.PI + 0.25, 0), group: "dark", wire: true });
  p.push({ geo: new BoxGeometry(0.045, 0.24, 0.02), m: T(0.5, 0.86, 1.46), group: "dark", wire: true });
  p.push({ geo: new BoxGeometry(1.2, 0.028, 0.6), m: T(0.5, 0.72, 1.62), group: "desk", wire: true });
  return p;
};

const materials = () => {
  const base = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
  return {
    desk: new MeshPhysicalMaterial({ ...base, color: "#d4cec5", roughness: 0.55, clearcoat: 0.25, clearcoatRoughness: 0.3 }),
    dark: new MeshStandardMaterial({ ...base, color: "#24272c", roughness: 0.5, metalness: 0.4 }),
    fabric: new MeshStandardMaterial({ ...base, color: "#2c3036", roughness: 0.9 }),
    screen: new MeshStandardMaterial({ ...base, color: "#06090c", roughness: 0.25, emissive: new Color("#3a5462"), emissiveIntensity: 0.45 }),
    glass: new MeshPhysicalMaterial({ ...base, color: "#e6eef3", roughness: 0.28, clearcoat: 1, transparent: true, opacity: 0.14, depthWrite: false }),
    leaf: new MeshStandardMaterial({ ...base, color: "#26331f", roughness: 0.65 }),
  } as Record<Group, MeshStandardMaterial>;
};

const presenceMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uFrame: { value: 0 },
      uColor: { value: new Color(1.0, 0.86, 0.68) },
      uAmount: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      attribute float aStart;
      uniform float uFrame;
      varying vec3 vN;
      varying vec3 vV;
      varying float vY;
      varying float vA;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz);
        vY = position.y;
        vA = smoothstep(0.0, 18.0, uFrame - aStart) * (0.85 + 0.15 * sin(uFrame * 0.07 + aSeed * 6.28));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uAmount;
      varying vec3 vN;
      varying vec3 vV;
      varying float vY;
      varying float vA;
      void main() {
        float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        float rim = pow(f, 2.2);
        float h = smoothstep(1.38, 0.5, vY) * smoothstep(0.0, 0.25, vY);
        float a = (rim * 0.55 + 0.22) * h * vA * uAmount;
        gl_FragColor = vec4(uColor * a, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
  });

const presenceProfile = () => {
  const pts: Vector2[] = [];
  const prof: [number, number][] = [[0.15, 0], [0.18, 0.3], [0.2, 0.62], [0.21, 0.9], [0.19, 1.08], [0.13, 1.22], [0.06, 1.3], [0.0, 1.32]];
  prof.forEach(([r, y]) => pts.push(new Vector2(r, y)));
  return new LatheGeometry(pts, 28);
};

export const Pods: React.FC = () => {
  const frame = useCurrentFrame();
  const mats = useMemo(materials, []);

  const built = useMemo(() => {
    const groups: Record<Group, BufferGeometry[]> = { desk: [], dark: [], fabric: [], screen: [], glass: [], leaf: [] };
    const lpos: number[] = [];
    const lst: number[] = [];
    const pp: number[] = [];
    const ps: number[] = [];
    const psz: number[] = [];
    const psd: number[] = [];
    const r = rng(1234);
    const base = podParts();
    const addParts = (parts: Part[], world: Matrix4, scanAt: number) => {
      parts.forEach((part) => {
        const m = new Matrix4().multiplyMatrices(world, part.m);
        const g = part.geo.clone().applyMatrix4(m);
        if (g.index === null) throw new Error("expected indexed geometry");
        groups[part.group].push(g);
        if (part.wire) {
          const e = edgePositions(part.geo, m, 20);
          for (let i = 0; i < e.length; i += 6) {
            const y = (e[i + 1] + e[i + 4]) / 2;
            const s = scanAt + y * 2.5;
            lpos.push(...e.slice(i, i + 6));
            lst.push(s, s);
          }
        }
        if (part.pts) {
          const s = surfaceSamples(part.geo, m, part.pts, r);
          for (let i = 0; i < s.length; i += 3) {
            pp.push(s[i], s[i + 1], s[i + 2]);
            ps.push(scanAt + 2 + r() * 3);
            psz.push(0.5 + r());
            psd.push(r());
          }
        }
      });
    };
    PODS.forEach((pod) => addParts(base, new Matrix4().makeTranslation(pod.x, 0, pod.z), pod.scanAt));
    PLANTS.forEach((pl, k) => {
      const d = Math.hypot(pl.x - HEADSET_BASE[0], pl.z - HEADSET_BASE[2]);
      addParts(plantParts(pl.x, pl.z, pl.s, pl.rot, 900 + k), new Matrix4(), scanFrameAt(d));
    });
    addParts(fgParts(), new Matrix4(), cues.scanStart + 3);

    const merged = {} as Record<Group, BufferGeometry>;
    (Object.keys(groups) as Group[]).forEach((k) => {
      const gs = groups[k].map((g) => {
        // keep attribute sets identical for merging
        const keep = new BufferGeometry();
        keep.setIndex(g.index);
        keep.setAttribute("position", g.getAttribute("position"));
        keep.setAttribute("normal", g.getAttribute("normal"));
        return keep;
      });
      merged[k] = mergeGeometries(gs, false)!;
    });

    const lineGeo = lineGeometry(lpos, lst);
    const ptsGeo = new BufferGeometry();
    ptsGeo.setAttribute("position", new BufferAttribute(new Float32Array(pp), 3));
    ptsGeo.setAttribute("aStart", new BufferAttribute(new Float32Array(ps), 1));
    ptsGeo.setAttribute("aSize", new BufferAttribute(new Float32Array(psz), 1));
    ptsGeo.setAttribute("aSeed", new BufferAttribute(new Float32Array(psd), 1));

    // presence columns at every seat
    const col = presenceProfile();
    const cols: BufferGeometry[] = [];
    PODS.forEach((pod) => {
      const g = col.clone().applyMatrix4(new Matrix4().makeTranslation(pod.x + SEAT_LOCAL[0], 0.02, pod.z + SEAT_LOCAL[2]));
      const n = g.getAttribute("position").count;
      g.setAttribute("aSeed", new BufferAttribute(new Float32Array(n).fill(pod.seed), 1));
      g.setAttribute("aStart", new BufferAttribute(new Float32Array(n).fill(62 + pod.dist * 0.9), 1));
      g.deleteAttribute("uv");
      cols.push(g);
    });
    const presenceGeo = mergeGeometries(cols, false)!;
    return { merged, lineGeo, ptsGeo, presenceGeo };
  }, []);

  const lineMat = useMemo(
    () => makeScanLineMaterial([lin.ice[0] * 0.55 + lin.neonTeal[0] * 0.35, lin.ice[1] * 0.55 + lin.neonTeal[1] * 0.35, lin.ice[2] * 0.55 + lin.neonTeal[2] * 0.35], [lin.neonTeal[0] * 4, lin.neonTeal[1] * 4, lin.neonTeal[2] * 4], 1, 70),
    [],
  );
  const ptsMat = useMemo(() => makeBokehPointsMaterial([lin.ice[0] * 1.1, lin.ice[1] * 1.1, lin.ice[2] * 1.1], { size: 0.009, opacity: 0.6 }), []);
  const presMat = useMemo(presenceMaterial, []);

  const w = worldAt(frame);
  useLayoutEffect(() => {
    lineMat.uniforms.uFrame.value = frame;
    lineMat.uniforms.uDim.value = w.office;
    ptsMat.uniforms.uFrame.value = frame;
    ptsMat.uniforms.uFocus.value = w.cam.focus;
    ptsMat.uniforms.uAperture.value = w.aperture;
    ptsMat.uniforms.uPixel.value = w.pixel;
    ptsMat.uniforms.uDim.value = w.office;
    presMat.uniforms.uFrame.value = frame;
    // the presence of a person at every seat: warm ivory in daylight, cool ice after the drain
    presMat.uniforms.uAmount.value = (0.26 * w.warm + 0.3 * (1 - w.warm)) * w.office * (1 - ramp(frame, 180, 196));
    presMat.uniforms.uColor.value.setRGB(1.0, 0.86, 0.68).lerp(new Color(...lin.ice), 1 - w.warm);
    (mats.screen as MeshStandardMaterial).emissiveIntensity = 0.45 * w.warm;
    (Object.keys(mats) as Group[]).forEach((k) => {
      const m = mats[k] as Material;
      const baseOp = k === "glass" ? 0.14 : 1;
      const tr = k === "glass" || w.warm < 0.999;
      m.opacity = baseOp * w.warm;
      if (m.transparent !== tr) {
        m.transparent = tr;
        m.needsUpdate = true;
      }
    });
  });

  return (
    <group visible={w.office > 0}>
      {(Object.keys(built.merged) as Group[]).map((k) => (
        <mesh key={k} geometry={built.merged[k]} material={mats[k]} castShadow={k !== "glass" && k !== "screen"} receiveShadow renderOrder={-1} />
      ))}
      <lineSegments geometry={built.lineGeo} material={lineMat} frustumCulled={false} />
      <points geometry={built.ptsGeo} material={ptsMat} frustumCulled={false} />
      <mesh geometry={built.presenceGeo} material={presMat} frustumCulled={false} />
    </group>
  );
};

