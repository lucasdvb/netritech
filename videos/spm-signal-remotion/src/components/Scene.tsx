import { Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useCurrentFrame } from "remotion";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DataTexture,
  DirectionalLight,
  FogExp2,
  LinearFilter,
  MeshDepthMaterial,
  Object3D,
  RGBADepthPacking,
  RGBAFormat,
  ShaderMaterial,
  UnsignedByteType,
} from "three";
import { lin, palette } from "../theme";
import { HEADSET_CENTER } from "../lib/layout";
import { makeBokehPointsMaterial } from "../lib/materials";
import { lerp, ramp, rng } from "../lib/math";
import { worldAt } from "../lib/world";

// ---------- window wall: one procedural mask drives both the glow and the sun's shadow ----------
export const WALL_Z = -34;
const WALL_W = 84;
const WALL_H = 15;

const windowMask = (() => {
  const W = 2048;
  const Hh = 384;
  const d = new Uint8Array(W * Hh * 4);
  for (let y = 0; y < Hh; y++) {
    for (let x = 0; x < W; x++) {
      const wx = (x / W - 0.5) * WALL_W; // metres
      const wy = (y / Hh) * WALL_H;
      const col = ((wx % 3.2) + 3.2) % 3.2; // bay of 3.2 m
      const inBay = col > 0.42 && col < 2.78;
      const inH = wy > 0.35 && wy < 9.95;
      const row = ((wy - 0.35) % 3.2 + 3.2) % 3.2;
      const transom = row < 0.09;
      const mullion = Math.abs(col - 1.6) < 0.035;
      const open = inBay && inH && !transom && !mullion ? 255 : 0;
      const i = (y * W + x) * 4;
      d[i] = open; // R: window opening (glow)
      d[i + 1] = 255 - open; // G: solid wall; three's alphaMap reads G, so only the wall blocks the sun
      d[i + 2] = 0;
      d[i + 3] = 255;
    }
  }
  const t = new DataTexture(d, W, Hh, RGBAFormat, UnsignedByteType);
  t.magFilter = LinearFilter;
  t.minFilter = LinearFilter;
  t.needsUpdate = true;
  return t;
})();

const wallMaterial = () =>
  new ShaderMaterial({
    uniforms: {
      uMask: { value: windowMask },
      uWarm: { value: 1 },
      uLow: { value: new Color(palette.skyLow) },
      uHigh: { value: new Color(palette.skyHigh) },
      uWall: { value: new Color("#120d0a") },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMask;
      uniform float uWarm;
      uniform vec3 uLow;
      uniform vec3 uHigh;
      uniform vec3 uWall;
      varying vec2 vUv;
      void main() {
        float open = texture2D(uMask, vUv).r;
        vec2 m = vec2((vUv.x - 0.5) * ${WALL_W.toFixed(1)}, vUv.y * ${WALL_H.toFixed(1)});
        vec3 sky = mix(uLow, uHigh, smoothstep(0.0, 10.0, m.y));
        // the low sun sits behind the left bays
        float sun = exp(-length((m - vec2(-8.5, 8.2)) * vec2(0.22, 0.3)));
        sky = sky * (0.72 + 3.4 * sun);
        vec3 c = mix(uWall * 0.6, sky, open);
        gl_FragColor = vec4(c * uWarm, 1.0);
      }`,
    toneMapped: false,
    fog: false,
  });

// ---------- floating dust (golden motes near the hero, cool dust across the floor) ----------
const dustGeometry = (n: number, box: [number, number, number, number, number, number], seed: number) => {
  const r = rng(seed);
  const p = new Float32Array(n * 3);
  const st = new Float32Array(n);
  const sz = new Float32Array(n);
  const sd = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    p[i * 3] = lerp(box[0], box[3], r());
    p[i * 3 + 1] = lerp(box[1], box[4], r());
    p[i * 3 + 2] = lerp(box[2], box[5], r());
    st[i] = -100;
    sz[i] = 0.4 + Math.pow(r(), 3) * 1.6;
    sd[i] = r();
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(p, 3));
  g.setAttribute("aStart", new BufferAttribute(st, 1));
  g.setAttribute("aSize", new BufferAttribute(sz, 1));
  g.setAttribute("aSeed", new BufferAttribute(sd, 1));
  return g;
};

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const w = worldAt(frame);
  const scene = useThree((s) => s.scene);
  const sun = useRef<DirectionalLight>(null);
  const sunTarget = useMemo(() => new Object3D(), []);
  const wallMat = useMemo(wallMaterial, []);
  const wallDepth = useMemo(
    () => new MeshDepthMaterial({ depthPacking: RGBADepthPacking, alphaMap: windowMask, alphaTest: 0.5 }),
    [],
  );
  const hc = HEADSET_CENTER;
  const motes = useMemo(() => dustGeometry(520, [hc[0] - 0.9, 0.76, hc[2] - 1.6, hc[0] + 0.9, 1.5, hc[2] + 0.75], 31), [hc]);
  const dust = useMemo(() => dustGeometry(2600, [-22, 0.2, -32, 22, 10, 9], 57), []);
  const moteMat = useMemo(() => makeBokehPointsMaterial([2.2, 1.45, 0.8], { size: 0.0011, opacity: 0.55, drift: 0.012, gain: 2.5 }), []);
  const dustMat = useMemo(() => makeBokehPointsMaterial([lin.ice[0], lin.ice[1], lin.ice[2]], { size: 0.012, opacity: 0.38, drift: 0.12, gain: 2 }), []);

  // Color(hex) converts sRGB to the linear working space
  const warmBg = useMemo(() => new Color(palette.warmHaze), []);
  const inkBg = useMemo(() => new Color(palette.inkNavy), []);
  const bg = useMemo(() => new Color(), []);
  const sunColor = useMemo(() => new Color(), []);
  const fog = useMemo(() => new FogExp2("#000", 0.02), []);

  useLayoutEffect(() => {
    // background + haze drain from golden-hour to ink navy
    bg.copy(inkBg).lerp(warmBg, w.warm * w.office);
    if (w.finale) bg.copy(inkBg).multiplyScalar(0.5);
    scene.background = bg;
    fog.color.copy(bg);
    fog.density = w.office ? lerp(0.006, 0.017, w.warm) : 0.0;
    scene.fog = fog;
    scene.environmentIntensity = 0.75 * w.warm * w.office;
    // warm-to-cool: the sun cools slightly as the camera leaves the desk
    sunColor.set(palette.sunWarm).lerp(new Color(palette.sunPale), w.cool * 0.6);
    if (sun.current) {
      sun.current.color.copy(sunColor);
      sun.current.intensity = 7.5 * w.warm * w.office;
    }
    wallMat.uniforms.uWarm.value = w.warm * w.office;
    [moteMat, dustMat].forEach((m) => {
      m.uniforms.uFrame.value = frame;
      m.uniforms.uFocus.value = w.cam.focus;
      m.uniforms.uAperture.value = w.aperture;
      m.uniforms.uPixel.value = w.pixel;
    });
    // motes catch the backlight; dust takes over once the floor is revealed
    moteMat.uniforms.uDim.value = w.warm * w.office * (1 - ramp(frame, 40, 62));
    dustMat.uniforms.uDim.value = (0.35 + 0.65 * (1 - w.warm)) * (1 - w.out);
    dustMat.uniforms.uColor.value.setRGB(...lin.ice).lerp(new Color(1.6, 1.15, 0.7), w.warm * 0.7);
  });

  // sun direction of travel: from the windows towards +Z, low and slightly from the left
  const D = [0.22, -0.45, 1];
  const len = Math.hypot(D[0], D[1], D[2]);
  const sunPos: [number, number, number] = [-(D[0] / len) * 70, -(D[1] / len) * 70, -(D[2] / len) * 70 - 6];

  return (
    <>
      <Environment frames={1} resolution={256}>
        <color attach="background" args={["#030405"]} />
        <Lightformer form="rect" intensity={5} color={palette.sunWarm} position={[0, 1.2, -6]} scale={[14, 2.6, 1]} />
        <Lightformer form="rect" intensity={2.4} color={palette.sunPale} position={[-3, 5, -3]} scale={[8, 1.2, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#dbe8f0" position={[-1, 2.6, 5]} scale={[9, 3.5, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#e9f1f6" position={[0, 6, 1]} scale={[5, 5, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#d8e6ee" position={[6, 3, 1]} scale={[3, 6, 1]} />
        <Lightformer form="rect" intensity={1.3} color="#f1ede8" position={[-5, 1.2, -1]} scale={[2.5, 5, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#cfe0ea" position={[5, 1.0, 1.5]} scale={[2, 4, 1]} />
      </Environment>

      {/* lights only the floor once the solids have faded: the reflector multiplies its reflection into the albedo */}
      <ambientLight intensity={w.finale ? 1.7 : 1.5 * ramp(frame, 148, 162)} color="#ffffff" />
      <hemisphereLight args={["#9cb3c4", "#2c2018", 0.2 * w.warm * w.office]} />
      <directionalLight position={[-3, 2.2, 4]} intensity={0.45 * w.warm * w.office} color="#a8c6d6" />
      <spotLight position={[hc[0] + 0.05, 1.25, hc[2] - 1.1]} target-position={hc} angle={0.5} penumbra={1} intensity={5 * w.warm * w.office} color={palette.sunPale} distance={4} decay={2} />
      <primitive object={sunTarget} position={[0, 0, -6]} />
      <directionalLight
        ref={sun}
        position={sunPos}
        target={sunTarget}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-left={-34}
        shadow-camera-right={34}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-near={30}
        shadow-camera-far={130}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />

      {/* window wall */}
      <mesh position={[0, WALL_H / 2, WALL_Z]} material={wallMat} customDepthMaterial={wallDepth} castShadow visible={w.office > 0}>
        <planeGeometry args={[WALL_W, WALL_H]} />
      </mesh>

      {/* polished floor with real reflections */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <MeshReflectorMaterial
          resolution={768}
          blur={[420, 120]}
          mixBlur={1}
          mixStrength={w.finale ? 1.5 : lerp(0.7, 1.6, 1 - w.warm)}
          mixContrast={1}
          mirror={w.finale ? 1 : lerp(0.25, 1, 1 - w.warm)}
          depthScale={w.finale ? 0 : 0.6}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.3}
          roughness={w.finale ? 1 : 0.7}
          metalness={0.15}
          color={new Color("#4f463f").lerp(new Color("#b9c6cf"), 1 - w.warm * w.office)}
        />
      </mesh>

      <points geometry={motes} material={moteMat} frustumCulled={false} />
      <points geometry={dust} material={dustMat} frustumCulled={false} />
    </>
  );
};
