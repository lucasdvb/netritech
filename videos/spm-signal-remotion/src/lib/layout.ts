// World layout in metres. Floor at y = 0, windows at -Z, the hero desk at the origin.
// Everything is generated from a fixed seed so every render is identical.
import { cues } from "../theme";
import { clamp01, rng } from "./math";

export const DESK_TOP = 0.74;

/** Hero headset: base point on the desk (between the two earcups). */
export const HEADSET_BASE: [number, number, number] = [-0.16, DESK_TOP, 0.06];
/** Boom-mic tip, local to the headset base (see Headset.tsx). */
export const MIC_LOCAL: [number, number, number] = [-0.03, 0.026, 0.19];
export const MIC_TIP: [number, number, number] = [
  HEADSET_BASE[0] + MIC_LOCAL[0],
  HEADSET_BASE[1] + MIC_LOCAL[1],
  HEADSET_BASE[2] + MIC_LOCAL[2],
];
/** The incoming-call LED on the right earcup, local to the headset base. */
export const LED_LOCAL: [number, number, number] = [0.097, 0.086, 0.046];
export const LED_POS: [number, number, number] = [
  HEADSET_BASE[0] + LED_LOCAL[0],
  HEADSET_BASE[1] + LED_LOCAL[1],
  HEADSET_BASE[2] + LED_LOCAL[2],
];
export const HEADSET_CENTER: [number, number, number] = [HEADSET_BASE[0], DESK_TOP + 0.1, HEADSET_BASE[2]];

/** The convergence point of the finale, just above the glossy floor. */
export const CONVERGE: [number, number, number] = [0, 0.12, 0];

export const COL_STEP = 3.2;
export const ROW_STEP = 3.3;
export const COLS = 5; // -5..5
export const ROWS = 8; // 0..-8

export type Pod = {
  id: number;
  x: number;
  z: number;
  dist: number; // from the hero headset, on the floor plane
  scanAt: number; // frame the scan ring reaches this pod
  bloomAt: number; // frame its agent starts to bloom
  seed: number;
};

/** Scan ring radius at frame f (decelerating ripple). */
export const SCAN_MAX = 34;
export const scanRadius = (f: number) => {
  const t = clamp01((f - cues.scanStart) / (cues.scanEnd - cues.scanStart));
  return SCAN_MAX * (1 - Math.pow(1 - t, 1.8));
};
/** Inverse of scanRadius: the frame the ring reaches distance d. */
export const scanFrameAt = (d: number) => {
  const t = 1 - Math.pow(Math.max(0, 1 - d / SCAN_MAX), 1 / 1.8);
  return cues.scanStart + t * (cues.scanEnd - cues.scanStart);
};

const buildPods = (): Pod[] => {
  const r = rng(20261006);
  const pods: Pod[] = [];
  let id = 0;
  for (let j = 0; j <= ROWS; j++) {
    for (let i = -COLS; i <= COLS; i++) {
      if (i === 0) continue; // the hero desk and a central aisle leading to the windows
      const x = i * COL_STEP;
      const z = -j * ROW_STEP;
      const dist = Math.hypot(x - HEADSET_BASE[0], z - HEADSET_BASE[2]);
      const scanAt = scanFrameAt(dist);
      pods.push({ id: id++, x, z, dist, scanAt, bloomAt: scanAt + cues.agentLag + r() * 3, seed: r() });
    }
  }
  return pods;
};

export const PODS = buildPods();

/** Agent stands beside the desk, to the right of the seat, local to the pod. */
export const AGENT_LOCAL: [number, number, number] = [1.02, 0, 0.32];
export const AGENT_HEIGHT = 1.55;
/** Seat (presence column) local to the pod. */
export const SEAT_LOCAL: [number, number, number] = [0, 0, 0.5];

export const agentTop = (p: Pod): [number, number, number] => [
  p.x + AGENT_LOCAL[0],
  AGENT_HEIGHT + 0.1,
  p.z + AGENT_LOCAL[2],
];

/** Data-ribbon links between pods: the hero fans out, neighbours chain. */
export type Link = { a: [number, number, number]; b: [number, number, number]; start: number; seed: number };
const buildLinks = (): Link[] => {
  const r = rng(77);
  const links: Link[] = [];
  const hero: [number, number, number] = [HEADSET_CENTER[0], 0.95, HEADSET_CENTER[2]];
  const byIdx = (i: number, j: number) => PODS.find((p) => Math.round(p.x / COL_STEP) === i && Math.round(-p.z / ROW_STEP) === j);
  // hero fan
  const fan: [number, number][] = [[-2, 1], [1, 1], [3, 2], [-4, 3], [2, 4], [-1, 5], [4, 6], [-3, 7]];
  fan.forEach(([i, j]) => {
    const p = byIdx(i, j);
    if (!p) return;
    links.push({ a: hero, b: agentTop(p), start: Math.max(scanFrameAt(p.dist) - 2, cues.scanStart + 6), seed: r() });
  });
  // neighbour chains
  PODS.forEach((p) => {
    if (r() > 0.2) return;
    const i = Math.round(p.x / COL_STEP);
    const j = Math.round(-p.z / ROW_STEP);
    const di = r() < 0.5 ? 1 : 2;
    const dj = r() < 0.5 ? 1 : 0;
    const q = byIdx(i + (r() < 0.5 ? di : -di), j + dj);
    if (!q) return;
    links.push({ a: agentTop(p), b: agentTop(q), start: Math.max(p.bloomAt, q.bloomAt) + 2, seed: r() });
  });
  return links;
};
export const LINKS = buildLinks();

/** Plants placed in the aisles (deterministic). */
export const PLANTS: { x: number; z: number; s: number; rot: number }[] = (() => {
  const r = rng(4242);
  const out: { x: number; z: number; s: number; rot: number }[] = [];
  for (let k = 0; k < 18; k++) {
    const i = Math.floor(r() * 10) - 5;
    const j = Math.floor(r() * 8);
    out.push({ x: (i + 0.5) * COL_STEP, z: -(j + 0.5) * ROW_STEP - 0.2, s: 0.8 + r() * 0.5, rot: r() * 6.28 });
  }
  return out;
})();
