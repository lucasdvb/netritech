import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { spring as springAt } from "remotion";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  LinearFilter,
  NoColorSpace,
  PerspectiveCamera,
  PlaneGeometry,
  ShaderMaterial,
  type Texture,
} from "three";
import { FPS, spring, ease } from "../theme";
import { clamp, lerp, prog, sstep } from "../lib/math";
import { applyPose, camPoseAt, HERO_CENTER } from "./cameraPath";
import {
  agentLinesMaterial,
  agentGlowMaterial,
  agentPointsMaterial,
  floorMaterial,
  reliefMaterial,
  ribbonMaterial,
  scanLinesMaterial,
  scanPointsMaterial,
  U,
} from "./materials";
import {
  AGENT_SLOTS,
  RIBBONS,
  agentGeometry,
  figurePointsGeometry,
  furnitureGeometry,
  heroPointsGeometry,
  ribbonGeometry,
} from "./geometry";
import { drawPanel, PANEL_SCALE, PANEL_SIZE, type PanelKind } from "./panelCanvas";
import { PODS, SD, revealAt, localToWorld, DESK, scanRadius, type V3 } from "./world";
import type { WorldAssets } from "./useWorldAssets";

/** World timeline values (seconds). */
export const WT = {
  drain: (t: number) => sstep(prog(t, 4.2, 5.2)),
  fade3d: (t: number) => 1 - sstep(prog(t, 6.45, 7.05)),
};

const PAD = 320;

// ---------- relief ----------
const Relief: React.FC<{ assets: WorldAssets; t: number }> = ({ assets, t }) => {
  const parts = useMemo(() => {
    const plane = new PlaneGeometry(1, 1, 192, 108);
    const hi = new PlaneGeometry(1, 1, 320, 180);
    return [
      { key: "wall", geo: plane, order: 0, mat: reliefMaterial({ map: assets.wall, rect: [-PAD, -PAD, 1920 + 2 * PAD, 1080 + 2 * PAD], constDepth: 6.0 }) },
      {
        key: "desk",
        geo: hi,
        order: 1,
        mat: reliefMaterial({ map: assets.desk, depth: assets.deskDepth, rect: [0, 0, 1920 + PAD, 1080 + PAD], range: SD.depthRange.desk }),
      },
      ...(["young", "bald", "woman"] as const).map((n, k) => {
        const i = ["woman", "bald", "young"].indexOf(n);
        return {
          key: n,
          geo: hi,
          order: 2 + k,
          mat: reliefMaterial({ map: assets.people[i], depth: assets.depths[i], rect: [0, 0, 1920, 1080], range: SD.depthRange[n] }),
        };
      }),
    ];
  }, [assets]);
  // painter's order (wall, desk, young, bald, woman) exactly like the photo's own layering;
  // whatever the scan front has not reached by 2.45 s goes with the room
  const gone = 1 - sstep(prog(t, 1.95, 2.45));
  for (const p of parts) {
    p.mat.depthTest = false;
    p.mat.depthWrite = false;
    p.mat.uniforms.uOpacity.value = gone;
  }
  if (gone <= 0) return null;
  return (
    <>
      {parts.map((p) => (
        <mesh key={p.key} geometry={p.geo} material={p.mat} renderOrder={p.order} frustumCulled={false} />
      ))}
    </>
  );
};

// ---------- panels ----------
type PanelSpec = { kind: PanelKind; pos: V3; t0: number; size: number; hero: boolean };
const up = (v: V3, k: number): V3 => [v[0], v[1] + k, v[2]];

const PANEL_SPECS: PanelSpec[] = (() => {
  const heads = AGENT_SLOTS.filter((s) => s.seat.hero).map((s) => s.head);
  const ax = SD.axis;
  const specs: PanelSpec[] = [
    { kind: "call", pos: up([heads[0][0] - ax[0] * 0.75, heads[0][1], heads[0][2] - ax[2] * 0.75], 0.62), t0: 2.95, size: 1.65, hero: true },
    { kind: "ticket", pos: up(heads[1], 0.95), t0: 3.15, size: 1.65, hero: true },
    { kind: "csat", pos: up([heads[2][0] + ax[0] * 0.8, heads[2][1], heads[2][2] + ax[2] * 0.8], 0.7), t0: 3.35, size: 1.65, hero: true },
  ];
  // the same work happening at other pods across the floor
  const kinds: PanelKind[] = ["csat", "call", "ticket", "call", "ticket", "csat"];
  const picks: [number, number][] = [[1, -1], [2, 0], [-1, -1], [3, -2], [1, -2], [2, 1]];
  picks.forEach(([i, j], k) => {
    const pod = PODS.find((p) => p.i === i && p.j === j);
    if (!pod) return;
    const pos = up(localToWorld(pod.origin, [DESK.f, 0, DESK.a + (k % 2 ? 0.8 : -0.8)]), 2.9);
    specs.push({ kind: kinds[k], pos, t0: revealAt(pos) + 0.55, size: 1.25, hero: false });
  });
  return specs;
})();

const Panels3D: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const { camera } = useThree();
  const items = useMemo(
    () =>
      PANEL_SPECS.map((s) => {
        const [w, h] = PANEL_SIZE[s.kind];
        const canvas = document.createElement("canvas");
        canvas.width = w * PANEL_SCALE;
        canvas.height = h * PANEL_SCALE;
        const texture = new CanvasTexture(canvas);
        texture.colorSpace = NoColorSpace;
        texture.minFilter = LinearFilter;
        texture.generateMipmaps = false;
        const mat = new ShaderMaterial({
          transparent: true,
          depthTest: false,
          depthWrite: false,
          side: DoubleSide,
          uniforms: { uMap: { value: texture as Texture }, uOpacity: { value: 0 } },
          vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
          fragmentShader: `uniform sampler2D uMap; uniform float uOpacity; varying vec2 vUv;
            void main(){ vec4 c = texture2D(uMap, vUv); gl_FragColor = vec4(c.rgb, c.a * uOpacity); }`,
        });
        return { s, canvas, texture, mat, aspect: h / w };
      }),
    [],
  );
  const exit = 1 - sstep(prog(t, 6.05, 6.45));
  return (
    <>
      {items.map(({ s, canvas, texture, mat, aspect }, k) => {
        const local = frame - s.t0 * FPS;
        if (local < 0 || exit <= 0) return null;
        const pop = springAt({ frame: local, fps: FPS, config: spring.pop });
        const ctx = canvas.getContext("2d");
        if (ctx) drawPanel(ctx, s.kind, t, s.t0);
        texture.needsUpdate = true;
        mat.uniforms.uOpacity.value = clamp(pop) * exit * (1 - WT.drain(t) * (s.hero ? 0 : 0.35));
        const sc = s.size * lerp(0.86, 1, pop);
        return (
          <mesh
            key={k}
            position={[s.pos[0], s.pos[1] + (1 - pop) * -0.25, s.pos[2]]}
            quaternion={camera.quaternion.clone()}
            scale={[sc, sc * aspect, 1]}
            renderOrder={40}
            frustumCulled={false}
          >
            <planeGeometry args={[1, 1]} />
            <primitive object={mat} attach="material" />
          </mesh>
        );
      })}
    </>
  );
};

// ---------- the near glass mullion of the hero track ----------
const Mullion: React.FC<{ t: number; frame: number }> = ({ t, frame }) => {
  const mat = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 8;
    const g = c.getContext("2d") as CanvasRenderingContext2D;
    const gr = g.createLinearGradient(0, 0, 256, 0);
    gr.addColorStop(0, "rgba(13,20,31,0)");
    gr.addColorStop(0.3, "rgba(13,20,31,0.55)");
    gr.addColorStop(0.46, "rgba(27,42,56,0.9)");
    gr.addColorStop(0.5, "rgba(220,236,242,0.55)");
    gr.addColorStop(0.54, "rgba(27,42,56,0.9)");
    gr.addColorStop(0.7, "rgba(13,20,31,0.55)");
    gr.addColorStop(1, "rgba(13,20,31,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 8);
    const tex = new CanvasTexture(c);
    tex.colorSpace = NoColorSpace;
    return new ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uMap: { value: tex as Texture }, uOpacity: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D uMap; uniform float uOpacity; varying vec2 vUv;
        void main(){ vec4 c = texture2D(uMap, vUv); float v = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
        gl_FragColor = vec4(c.rgb, c.a * uOpacity * mix(0.6, 1.0, v)); }`,
    });
  }, []);
  const k = frame === 0 ? 0 : ease.soft(prog(t, 0.0, 0.25)) * (1 - sstep(prog(t, 1.0, 1.5)));
  mat.uniforms.uOpacity.value = 0.62 * k;
  if (k <= 0) return null;
  return (
    <mesh position={[-0.34, 1.3, -0.82]} scale={[0.16, 3.2, 1]} renderOrder={60} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};

// ---------- ripple rings on the hero desk (the dive) ----------
const Rings: React.FC<{ t: number }> = ({ t }) => {
  const mat = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uR1: { value: 0 }, uR2: { value: 0 }, uA1: { value: 0 }, uA2: { value: 0 } },
        vertexShader: `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform float uR1; uniform float uR2; uniform float uA1; uniform float uA2; varying vec2 vP;
          void main(){ float r = length(vP);
            float a = uA1 * exp(-abs(r - uR1) * 140.0) + uA2 * exp(-abs(r - uR2) * 140.0);
            vec3 ice = vec3(0.863, 0.925, 0.949);
            gl_FragColor = vec4(ice * a, a); }`,
      }),
    [],
  );
  const u1 = prog(t, 5.75, 6.9);
  const u2 = prog(t, 6.0, 7.05);
  mat.uniforms.uR1.value = 0.15 + ease.out(u1) * 3.2;
  mat.uniforms.uR2.value = 0.15 + ease.out(u2) * 3.2;
  mat.uniforms.uA1.value = u1 > 0 && u1 < 1 ? 0.75 * (1 - u1) : 0;
  mat.uniforms.uA2.value = u2 > 0 && u2 < 1 ? 0.6 * (1 - u2) : 0;
  if (u1 <= 0) return null;
  return (
    <mesh position={[HERO_CENTER[0], SD.deskY + 0.01, HERO_CENTER[2]]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={30} frustumCulled={false}>
      <planeGeometry args={[8, 8]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
};

/**
 * The whole 3D world for one frame. Uniforms and the camera are written during render (a pure
 * function of the frame), before @remotion/three advances the R3F renderer.
 */
export const World: React.FC<{ frame: number; assets: WorldAssets }> = ({ frame, assets }) => {
  const t = frame / FPS;
  const { camera, scene } = useThree();
  applyPose(camera as PerspectiveCamera, camPoseAt(t));

  const drain = WT.drain(t);
  const fade = WT.fade3d(t);
  U.uTime.value = t;
  U.uR.value = scanRadius(t);
  U.uDrain.value = drain;
  U.uFade.value = fade;
  // the background sinks from Ink navy toward black as the light drains and the world fades
  const bg = lerp(1, 0.45, drain) * fade;
  if (!(scene.background instanceof Color)) scene.background = new Color();
  (scene.background as Color).setRGB((13 / 255) * bg, (20 / 255) * bg, (31 / 255) * bg);

  const built = useMemo(() => {
    const agents = agentGeometry();
    const ribHero = ribbonGeometry(RIBBONS.hero, 56, 6);
    const ribFloor = ribbonGeometry([...RIBBONS.floor, ...RIBBONS.network], 36, 5);
    return {
      heroPts: heroPointsGeometry(assets.points),
      heroMat: scanPointsMaterial(5.2, true),
      figPts: figurePointsGeometry(),
      figMat: scanPointsMaterial(5.0, false),
      furniture: furnitureGeometry(),
      furnMat: scanLinesMaterial(1),
      agentPts: agents.points,
      agentLines: agents.lines,
      agentPtsMat: agentPointsMaterial(10),
      agentPtsMirror: agentPointsMaterial(10, true),
      agentGlow: agents.glow,
      agentGlowMat: agentGlowMaterial(1.5, 0.3),
      agentLinesMat: agentLinesMaterial(0.9),
      agentLinesMirror: agentLinesMaterial(0.9, true),
      ribHero,
      ribFloor,
      ribCore: ribbonMaterial(0.01, 1),
      ribHalo: ribbonMaterial(0.04, 0.22),
      ribCoreF: ribbonMaterial(0.01, 0.85),
      ribHaloF: ribbonMaterial(0.04, 0.18),
      ribMirror: ribbonMaterial(0.01, 1, true),
      floor: floorMaterial(),
    };
  }, [assets]);

  // the glossy floor shows its reflections only once the room is gone
  const mirrorK = sstep(prog(t, 2.6, 3.4));
  built.agentPtsMirror.uniforms.uAlpha.value = 0.16 * mirrorK;
  built.agentLinesMirror.uniforms.uAlpha.value = 0.14 * mirrorK;
  built.ribMirror.uniforms.uAlpha.value = 0.16 * mirrorK;
  // hero flare marks: the scan front's own glow is enough after the drain
  built.heroMat.uniforms.uAlpha.value = 1 - 0.25 * drain;

  return (
    <>
      <Relief assets={assets} t={t} />
      <mesh position={[HERO_CENTER[0], 0, HERO_CENTER[2] - 4]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5} frustumCulled={false}>
        <planeGeometry args={[90, 90]} />
        <primitive object={built.floor} attach="material" />
      </mesh>
      <lineSegments geometry={built.furniture} material={built.furnMat} renderOrder={10} frustumCulled={false} />
      <points geometry={built.figPts} material={built.figMat} renderOrder={11} frustumCulled={false} />
      <points geometry={built.heroPts} material={built.heroMat} renderOrder={12} frustumCulled={false} />
      <points geometry={built.agentPts} material={built.agentPtsMirror} renderOrder={13} frustumCulled={false} />
      <lineSegments geometry={built.agentLines} material={built.agentLinesMirror} renderOrder={13} frustumCulled={false} />
      <mesh geometry={built.ribFloor} material={built.ribMirror} renderOrder={13} frustumCulled={false} />
      <points geometry={built.agentGlow} material={built.agentGlowMat} renderOrder={14} frustumCulled={false} />
      <points geometry={built.agentPts} material={built.agentPtsMat} renderOrder={14} frustumCulled={false} />
      <lineSegments geometry={built.agentLines} material={built.agentLinesMat} renderOrder={14} frustumCulled={false} />
      <mesh geometry={built.ribFloor} material={built.ribHaloF} renderOrder={15} frustumCulled={false} />
      <mesh geometry={built.ribFloor} material={built.ribCoreF} renderOrder={16} frustumCulled={false} />
      <mesh geometry={built.ribHero} material={built.ribHalo} renderOrder={17} frustumCulled={false} />
      <mesh geometry={built.ribHero} material={built.ribCore} renderOrder={18} frustumCulled={false} />
      <Rings t={t} />
      <Panels3D t={t} frame={frame} />
      <Mullion t={t} frame={frame} />
    </>
  );
};


