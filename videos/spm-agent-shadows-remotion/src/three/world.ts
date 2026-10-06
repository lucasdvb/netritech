import { ease } from "../theme";
import { clamp, lerp, mulberry, prog } from "../lib/math";
import raw from "../data/scene.json";

/**
 * The 3D world, in metres. Floor at y = 0; the photo camera sits at (0, camY, 0) looking down -Z.
 * Built by scripts/prep-3d.py from the team photo and its person mattes.
 */
export type V3 = [number, number, number];
type Names = "woman" | "bald" | "young";
export type AgentTemplate = {
  /** local [face, up, axis, magnitude] relative to the seat on the floor */
  points: [number, number, number, number][];
  contour: V3[];
  slices: [number, number, number, number, number, number][];
  cutY: number;
};
export type SceneData = {
  fov: number;
  camY: number;
  deskY: number;
  focal: number;
  depthRange: Record<Names | "desk", [number, number]>;
  heads: Record<Names, V3>;
  mics: Record<Names, V3>;
  ears: Record<Names, V3>;
  seats: Record<Names, V3>;
  laptops: V3[];
  axis: V3;
  face: V3;
  agents: AgentTemplate[];
  /** local [face, up, axis, luma] figure point templates */
  figures: [number, number, number, number][][];
  points: number;
};

export const SD = raw as unknown as SceneData;
export const NAMES3: Names[] = ["woman", "bald", "young"];

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dist3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

/** Pod frame: e1 = face direction, e2 = up, e3 = desk axis. Origin = the woman's seat. */
export const FACE = SD.face;
export const AXIS = SD.axis;
export const ORIGIN = SD.seats.woman;

/** Local [f, y, a] -> world, for a pod whose origin is `o`, optionally turned 180 deg. */
export const localToWorld = (o: V3, l: V3, flip = false): V3 => {
  const s = flip ? -1 : 1;
  return add(o, add(add(mul(FACE, l[0] * s), [0, l[1], 0]), mul(AXIS, l[2] * s)));
};
/** World -> local relative to the hero pod origin. */
export const worldToLocal = (p: V3): V3 => {
  const r: V3 = [p[0] - ORIGIN[0], p[1] - ORIGIN[1], p[2] - ORIGIN[2]];
  return [r[0] * FACE[0] + r[2] * FACE[2], r[1], r[0] * AXIS[0] + r[2] * AXIS[2]];
};

export const SEAT_L: V3[] = NAMES3.map((n) => worldToLocal(SD.seats[n]));
export const LAPTOP_L: V3[] = SD.laptops.map(worldToLocal);
/** Desk of a pod, local: centre (f, a), half sizes. */
export const DESK = (() => {
  const f = LAPTOP_L.reduce((s, l) => s + l[0], 0) / 3 + 0.22;
  const a = (SEAT_L[0][2] + SEAT_L[2][2]) / 2;
  return { f, a, hf: 0.48, ha: 1.95, y: SD.deskY };
})();

/** Agent placement relative to its figure: a head taller, a step behind. */
export const AGENT_SCALE = 1.12;
export const AGENT_BACK = 0.5;
export const AGENT_UP = 0.16;
/** Local agent position for a template point, relative to the seat. */
export const agentLocal = (p: V3): V3 => [p[0] * AGENT_SCALE - AGENT_BACK, p[1] * AGENT_SCALE + AGENT_UP, p[2] * AGENT_SCALE];

/** Head point of each hero template (local to its seat), where ribbons land on an agent. */
export const HEAD_L: V3[] = NAMES3.map((n, i) => {
  const h = worldToLocal(SD.heads[n]);
  return [h[0] - SEAT_L[i][0], h[1], h[2] - SEAT_L[i][2]];
});

// ---------- the floor of pods ----------
export type Seat = {
  /** template index 0 woman, 1 bald, 2 young */
  tpl: number;
  /** world position of the seat */
  pos: V3;
  flip: boolean;
  scale: number;
  hero: boolean;
};
export type Pod = { i: number; j: number; origin: V3; hero: boolean; seats: Seat[] };

export const POD_A = 5.4; // pitch along the desk axis
export const POD_B = 4.6; // pitch across rows

export const PODS: Pod[] = (() => {
  const r = mulberry(4242);
  const pods: Pod[] = [];
  for (let j = -2; j <= 1; j++) {
    for (let i = -1; i <= 3; i++) {
      const origin = add(add(ORIGIN, mul(AXIS, i * POD_A)), mul(FACE, j * POD_B));
      const hero = i === 0 && j === 0;
      const seats: Seat[] = [];
      for (let k = 0; k < 3; k++) {
        const near = localToWorld(origin, SEAT_L[k]);
        seats.push({ tpl: hero ? k : Math.floor(r() * 3), pos: near, flip: false, scale: hero ? 1 : lerp(0.94, 1.04, r()), hero });
        if (!hero) {
          // the facing side of the desk, mirrored across the desk centre line
          const l: V3 = [2 * DESK.f - SEAT_L[k][0], 0, SEAT_L[k][2] + lerp(-0.25, 0.25, r())];
          seats.push({ tpl: Math.floor(r() * 3), pos: localToWorld(origin, l), flip: true, scale: lerp(0.94, 1.04, r()), hero });
        }
      }
      pods.push({ i, j, origin, hero, seats });
    }
  }
  return pods;
})();

// ---------- the scan front ----------
export const MIC: V3 = SD.mics.woman;
const SCAN_T0 = 1.45;
/** Radius of the spherical scan front around the woman's microphone, metres. */
export function scanRadius(t: number) {
  return 4.4 * ease.outCubic(prog(t, SCAN_T0, 2.3)) + 38 * ease.inOut(prog(t, 2.3, 4.5));
}
const LUT = Array.from({ length: 1201 }, (_, k) => scanRadius(SCAN_T0 + (k / 1200) * 3.2));
/** Time at which the front reaches distance d from the microphone. */
export function revealTime(d: number) {
  if (d <= 0) return SCAN_T0;
  for (let k = 1; k < LUT.length; k++) {
    if (LUT[k] >= d) {
      const u = (d - LUT[k - 1]) / Math.max(1e-6, LUT[k] - LUT[k - 1]);
      return SCAN_T0 + ((k - 1 + u) / 1200) * 3.2;
    }
  }
  return 99;
}
export const revealAt = (p: V3) => revealTime(dist3(p, MIC));

/** Hero agents rise in a stagger once the team is scanned. */
export const HERO_AGENT_T = [2.35, 2.55, 2.75];
export const agentTime = (seat: Seat, i: number) =>
  seat.hero ? HERO_AGENT_T[i] : Math.max(2.6, revealAt(seat.pos) + 0.3);

export const clamp01 = (v: number) => clamp(v);
