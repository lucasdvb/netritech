import { useLayoutEffect, useMemo } from "react";
import { useCurrentFrame } from "remotion";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
  CatmullRomCurve3,
  Color,
  LatheGeometry,
  Matrix4,
  MeshPhysicalMaterial,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  BoxGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { cues, lin, palette } from "../theme";
import { DESK_TOP, HEADSET_BASE, LED_LOCAL, LED_POS, MIC_LOCAL } from "../lib/layout";
import { edgePositions, lineGeometry, surfaceSamples } from "../lib/geo";
import { blobTexture, glowTexture, makeBokehPointsMaterial, makeScanLineMaterial } from "../lib/materials";
import { ramp, rng } from "../lib/math";
import { worldAt } from "../lib/world";

type Part = { geo: BufferGeometry; m: Matrix4; mat: keyof ReturnType<typeof makeMaterials>; wire?: BufferGeometry; wireThreshold?: number };

const makeMaterials = () => {
  const base = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };
  return {
    anodised: new MeshPhysicalMaterial({ ...base, color: "#a3b0bc", metalness: 0.78, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.25 }),
    soft: new MeshPhysicalMaterial({ ...base, color: "#33373d", roughness: 1, sheen: 1, sheenColor: new Color("#9aa5b0"), sheenRoughness: 0.75 }),
    steel: new MeshPhysicalMaterial({ ...base, color: "#e2e6ea", metalness: 1, roughness: 0.13 }),
    foam: new MeshPhysicalMaterial({ ...base, color: "#0f1012", roughness: 0.95, sheen: 0.5, sheenColor: new Color("#2b3038") }),
    alu: new MeshPhysicalMaterial({ ...base, color: "#c4c8ce", metalness: 0.95, roughness: 0.36 }),
    desk: new MeshPhysicalMaterial({ ...base, color: "#d6d0c7", roughness: 0.5, clearcoat: 0.4, clearcoatRoughness: 0.22 }),
    leg: new MeshPhysicalMaterial({ ...base, color: "#2a2c30", metalness: 0.7, roughness: 0.42 }),
    glass: new MeshPhysicalMaterial({ ...base, color: "#e4edf2", roughness: 0.3, clearcoat: 1, transparent: true, opacity: 0.16, depthWrite: false }),
  };
};

const M = (pos: [number, number, number], rot?: Quaternion, scale?: [number, number, number]) =>
  new Matrix4().compose(new Vector3(...pos), rot ?? new Quaternion(), new Vector3(...(scale ?? [1, 1, 1])));
const qz = (a: number) => new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), a);
const qy = (a: number) => new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), a);

/** Rounded puck profile for the earcup shell, lathed around Y. */
const cupProfile = (R: number, T: number, c: number, steps: number) => {
  const pts: Vector2[] = [new Vector2(0, -T / 2)];
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
    pts.push(new Vector2(R - c + Math.cos(a) * c, -T / 2 + c + Math.sin(a) * c));
  }
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new Vector2(R - c + Math.cos(a) * c, T / 2 - c + Math.sin(a) * c));
  }
  pts.push(new Vector2(0, T / 2));
  return pts;
};

const archCurve = (rx: number, y0: number, ry: number, z: number, t0 = 0, t1 = Math.PI) => {
  const pts: Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = t0 + ((t1 - t0) * i) / 24;
    pts.push(new Vector3(rx * Math.cos(t), y0 + ry * Math.sin(t), z));
  }
  return new CatmullRomCurve3(pts);
};

/** Builds the headset (local to its base point), laptop and desk (local to the hero desk). */
const buildHero = () => {
  const parts: Part[] = [];
  const hb = HEADSET_BASE;
  const H = (p: [number, number, number]): [number, number, number] => [p[0] + hb[0], p[1] + hb[1], p[2] + hb[2]];
  const oval: [number, number, number] = [1, 1.18, 1];
  for (const s of [-1, 1]) {
    const cx = 0.088 * s;
    const cy = 0.061;
    // shell (lathe axis Y -> X)
    const shell = new LatheGeometry(cupProfile(0.05, 0.05, 0.016, 8), 72);
    const shellWire = new LatheGeometry(cupProfile(0.05, 0.05, 0.016, 3), 18);
    const mShell = new Matrix4().multiplyMatrices(M(H([cx, cy, 0]), undefined, oval), M([0, 0, 0], qz(-Math.PI / 2)));
    parts.push({ geo: shell, m: mShell, mat: "anodised", wire: shellWire, wireThreshold: 8 });
    // cushion faces the other cup
    const cush = new TorusGeometry(0.034, 0.011, 20, 64);
    const cushWire = new TorusGeometry(0.034, 0.011, 6, 18);
    const mC = new Matrix4().multiplyMatrices(M(H([cx - s * 0.03, cy, 0]), undefined, oval), M([0, 0, 0], qy(Math.PI / 2)));
    parts.push({ geo: cush, m: mC, mat: "soft", wire: cushWire, wireThreshold: 8 });
    // yoke stem
    parts.push({ geo: new CapsuleGeometry(0.0046, 0.022, 6, 16), m: M(H([cx, 0.134, 0])), mat: "steel" });
  }
  // headband rods and canopy
  for (const z of [-0.011, 0.011]) {
    const c = archCurve(0.088, 0.14, 0.098, z);
    parts.push({ geo: new TubeGeometry(c, 64, 0.0027, 10), m: M(H([0, 0, 0])), mat: "steel", wire: new TubeGeometry(c, 16, 0.0027, 3), wireThreshold: 30 });
  }
  const canopy = archCurve(0.079, 0.136, 0.088, 0, 0.12 * Math.PI, 0.88 * Math.PI);
  parts.push({ geo: new TubeGeometry(canopy, 64, 0.0058, 12), m: M(H([0, 0, 0]), undefined, [1, 1, 3.1]), mat: "soft", wire: new TubeGeometry(canopy, 14, 0.0058, 4), wireThreshold: 20 });
  // boom mic from the left cup
  const boomPts = [
    new Vector3(-0.108, 0.046, 0.028),
    new Vector3(-0.114, 0.04, 0.085),
    new Vector3(-0.09, 0.032, 0.145),
    new Vector3(MIC_LOCAL[0] - 0.012, MIC_LOCAL[1] + 0.001, MIC_LOCAL[2] - 0.006),
  ];
  const boom = new CatmullRomCurve3(boomPts);
  parts.push({ geo: new TubeGeometry(boom, 64, 0.0024, 10), m: M(H([0, 0, 0])), mat: "leg", wire: new TubeGeometry(boom, 12, 0.0024, 3), wireThreshold: 30 });
  const tan = boom.getTangentAt(1).normalize();
  const qMic = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), tan);
  parts.push({ geo: new CapsuleGeometry(0.0068, 0.014, 8, 20), m: M(H(MIC_LOCAL), qMic), mat: "foam", wire: new CapsuleGeometry(0.0068, 0.014, 3, 8), wireThreshold: 10 });
  // laptop (closed) beside the headset
  const qLap = qy(-0.14);
  parts.push({ geo: new RoundedBoxGeometry(0.304, 0.0155, 0.212, 3, 0.0045), m: M([0.24, DESK_TOP + 0.0078, 0.02], qLap), mat: "alu", wire: new BoxGeometry(0.304, 0.0155, 0.212), wireThreshold: 20 });
  // desk
  parts.push({ geo: new RoundedBoxGeometry(1.5, 0.028, 0.74, 3, 0.007), m: M([0, DESK_TOP - 0.014, 0]), mat: "desk", wire: new BoxGeometry(1.5, 0.028, 0.74), wireThreshold: 20 });
  for (const s of [-1, 1]) {
    parts.push({ geo: new BoxGeometry(0.026, DESK_TOP - 0.028, 0.64), m: M([0.71 * s, (DESK_TOP - 0.028) / 2, 0]), mat: "leg", wire: new BoxGeometry(0.026, DESK_TOP - 0.028, 0.64), wireThreshold: 20 });
  }
  parts.push({ geo: new BoxGeometry(1.46, 0.34, 0.012), m: M([0, DESK_TOP + 0.2, -0.375]), mat: "glass", wire: new BoxGeometry(1.46, 0.34, 0.012), wireThreshold: 20 });
  return parts;
};

export const Headset: React.FC = () => {
  const frame = useCurrentFrame();
  const mats = useMemo(makeMaterials, []);
  const parts = useMemo(buildHero, []);

  // wireframe twin + point cloud, revealed from the LED outwards
  const { lineGeo, lineMat, ptsGeo, ptsMat } = useMemo(() => {
    const led = new Vector3(...LED_POS);
    const pos: number[] = [];
    const starts: number[] = [];
    const reveal = (x: number, y: number, z: number) => cues.scanStart - 3 + Math.min(led.distanceTo(new Vector3(x, y, z)) * 34, 22);
    parts.forEach((p) => {
      if (!p.wire) return;
      const e = edgePositions(p.wire, p.m, p.wireThreshold ?? 20);
      for (let i = 0; i < e.length; i += 6) {
        // both ends of a segment share one start so segments never draw half-lit
        const s = reveal((e[i] + e[i + 3]) / 2, (e[i + 1] + e[i + 4]) / 2, (e[i + 2] + e[i + 5]) / 2);
        pos.push(e[i], e[i + 1], e[i + 2], e[i + 3], e[i + 4], e[i + 5]);
        starts.push(s, s);
      }
    });
    const lg = lineGeometry(pos, starts);
    const lm = makeScanLineMaterial([lin.ice[0] * 1.6, lin.ice[1] * 1.6, lin.ice[2] * 1.6], [3, 4.2, 4.4], 1, 40);
    // points on the headset + laptop + desk top surfaces
    const r = rng(9);
    const pp: number[] = [];
    const ps: number[] = [];
    const sz: number[] = [];
    const sd: number[] = [];
    parts.forEach((p, k) => {
      const n = p.mat === "desk" ? 900 : p.mat === "glass" ? 260 : p.mat === "alu" ? 220 : p.mat === "leg" && k < 14 ? 60 : 160;
      const s = surfaceSamples(p.geo, p.m, n, r);
      for (let i = 0; i < s.length; i += 3) {
        pp.push(s[i], s[i + 1], s[i + 2]);
        ps.push(reveal(s[i], s[i + 1], s[i + 2]) + 2);
        sz.push(0.6 + r() * 0.8);
        sd.push(r());
      }
    });
    const pg = new BufferGeometry();
    pg.setAttribute("position", new BufferAttribute(new Float32Array(pp), 3));
    pg.setAttribute("aStart", new BufferAttribute(new Float32Array(ps), 1));
    pg.setAttribute("aSize", new BufferAttribute(new Float32Array(sz), 1));
    pg.setAttribute("aSeed", new BufferAttribute(new Float32Array(sd), 1));
    const pm = makeBokehPointsMaterial([lin.ice[0] * 1.2, lin.ice[1] * 1.2, lin.ice[2] * 1.2], { size: 0.0016, opacity: 0.55 });
    return { lineGeo: lg, lineMat: lm, ptsGeo: pg, ptsMat: pm };
  }, [parts]);

  const ledMat = useMemo(() => new MeshPhysicalMaterial({ color: "#0b2a2d", emissive: new Color(...lin.neonTeal), emissiveIntensity: 0, roughness: 0.2 }), []);
  const ledGeo = useMemo(() => new SphereGeometry(0.0021, 16, 12), []);

  const w = worldAt(frame);
  // incoming call: a slow, breathing pulse (no flicker), building to the release of the scan
  const t = frame - cues.ledStart;
  const breath = t < 0 ? 0 : Math.pow(0.5 - 0.5 * Math.cos((t / 22) * Math.PI * 2), 1.6);
  const onset = ramp(frame, cues.ledStart, cues.ledStart + 10);
  const release = Math.exp(-Math.pow((frame - cues.scanStart) / 4, 2));
  const steady = ramp(frame, cues.scanStart, cues.scanStart + 6);
  const led = onset * (0.25 + 0.75 * breath) * (1 - steady) + steady * 0.8 + release * 2.5;
  const camDist = new Vector3(...w.cam.pos).distanceTo(new Vector3(...LED_POS));
  const glowSize = Math.max(0.016, camDist * 0.016) * (1 + release * 2.5);

  useLayoutEffect(() => {
    lineMat.uniforms.uFrame.value = frame;
    lineMat.uniforms.uDim.value = w.office;
    ptsMat.uniforms.uFrame.value = frame;
    ptsMat.uniforms.uFocus.value = w.cam.focus;
    ptsMat.uniforms.uAperture.value = w.aperture;
    ptsMat.uniforms.uPixel.value = w.pixel;
    ptsMat.uniforms.uDim.value = w.office;
    ledMat.emissiveIntensity = 3 + led * 14;
    // solids fade to depth-only occluders once the world has drained
    Object.values(mats).forEach((m) => {
      const base = m === mats.glass ? 0.16 : 1;
      m.transparent = m === mats.glass || w.warm < 0.999;
      m.opacity = base * Math.max(w.warm, 0);
      m.needsUpdate = m.userData.t !== m.transparent;
      m.userData.t = m.transparent;
    });
  });

  const tealGlow = useMemo(() => new Color(...lin.neonTeal), []);
  return (
    <group visible={w.office > 0}>
      {parts.map((p, i) => (
        <mesh key={i} geometry={p.geo} material={mats[p.mat]} matrixAutoUpdate={false} matrix={p.m} castShadow receiveShadow renderOrder={-1} />
      ))}
      {/* product-shot contact shadows */}
      <group position={[0, DESK_TOP + 0.0006, 0]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[HEADSET_BASE[0] + 0.088 * s, 0, HEADSET_BASE[2]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
            <planeGeometry args={[0.1, 0.16]} />
            <meshBasicMaterial map={blobTexture} transparent opacity={0.75 * w.warm} depthWrite={false} />
          </mesh>
        ))}
        <mesh position={[0.24, 0, 0.02]} rotation={[-Math.PI / 2, 0, -0.14]} renderOrder={-1}>
          <planeGeometry args={[0.42, 0.3]} />
          <meshBasicMaterial map={blobTexture} transparent opacity={0.55 * w.warm} depthWrite={false} />
        </mesh>
      </group>
      <lineSegments geometry={lineGeo} material={lineMat} frustumCulled={false} />
      <points geometry={ptsGeo} material={ptsMat} frustumCulled={false} />
      {/* the incoming-call LED */}
      <mesh geometry={ledGeo} material={ledMat} position={LED_POS} scale={[1, 0.55, 1]} />
      <sprite position={LED_POS} scale={[glowSize, glowSize, 1]}>
        <spriteMaterial map={glowTexture} color={tealGlow.clone().multiplyScalar(0.6 + led * 2.2)} blending={AdditiveBlending} depthWrite={false} transparent toneMapped={false} />
      </sprite>
    </group>
  );
};

export const HEADSET_LED_COLOR = palette.neonTeal;
export const LED_OFFSET = LED_LOCAL;
