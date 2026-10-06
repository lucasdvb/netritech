import { CX, CY, PLANE } from "../theme";
import { clamp, lerp, monotoneCurve, prog, sstep, type Vec } from "./math";
import { FX } from "./fx";

/**
 * 2.5D camera. The camera looks at a focus point (x, y) on the people plane with a zoom z.
 * A plane with parallax p sees a proportionally smaller move and zoom, so the wall (p 0.5)
 * slides half as far as the people (p 1.0) and dust at p 1.7 rushes past in front.
 *
 * Moves, in cinematography terms:
 *   0.0-1.4  lateral dolly right with a hint of push (establish)
 *   1.4-2.6  crane up while still trucking right, the lens tilts down (high three-quarter)
 *   2.6-4.9  near-locked hold with a slow creep, so the scan and agents read
 *   4.9-5.9  a settling drift left as the light drains
 *   5.9-7.0  decelerating push into the woman's agent
 */
export type Cam = { x: number; y: number; z: number };
export type Layer = { z: number; ox: number; oy: number; p: number };

/** Agent i = its person's silhouette, scaled about the feet and lifted up and back. */
export const AGENT_SCALE = [1.07, 1.07, 1.07];
export const AGENT_SHIFT: Vec[] = [
  [-112, -66],
  [-86, -74],
  [-70, -72],
];
/** Keep head and shoulders only: fade out below head_y + CUT over CUT_FADE px. */
export const CUT = [300, 290, 262];
export const CUT_FADE = 170;

export function agentXform(i: number) {
  const [x, y, w, h] = FX.agents[i].bbox;
  return { ax: x + w / 2, ay: y + h, s: AGENT_SCALE[i], dx: AGENT_SHIFT[i][0], dy: AGENT_SHIFT[i][1], top: y, h };
}

/** Photo coordinates -> agent world coordinates (on the agent plane). */
export function agentPt(i: number, px: number, py: number): Vec {
  const T = agentXform(i);
  return [(px - T.ax) * T.s + T.ax + T.dx, (py - T.ay) * T.s + T.ay + T.dy];
}

/** Dive target: just below the woman's agent's head, expressed as a people-plane focus. */
const DIVE = (() => {
  const hd = FX.heads.woman;
  const [ax, ay] = agentPt(0, hd[0] + 10, hd[1] + 150);
  const zA = 7.2; // zoom of the agent plane at the end of the dive
  const z = 1 + (zA - 1) / PLANE.agents;
  return { x: CX + (ax - CX) / PLANE.agents, y: CY + (ay - CY) / PLANE.agents, lz: Math.log(z) };
})();

const KF: [number, number, number, number][] = [
  // t,   focus x, focus y, log zoom
  [0.0, 960, 540, Math.log(1.0)],
  [1.4, 1075, 530, Math.log(1.05)],
  [2.6, 1132, 404, Math.log(1.1)],
  [3.5, 1142, 384, Math.log(1.12)],
  [4.9, 1114, 372, Math.log(1.15)],
  [5.9, 1062, 362, Math.log(1.22)],
  [7.0, DIVE.x, DIVE.y, DIVE.lz],
  [8.0, DIVE.x, DIVE.y, DIVE.lz],
];
const ts = KF.map((k) => k[0]);
const camX = monotoneCurve(ts, KF.map((k) => k[1]));
const camY = monotoneCurve(ts, KF.map((k) => k[2]));
const camLZ = monotoneCurve(ts, KF.map((k) => k[3]));

export function camAt(t: number): Cam {
  return { x: camX(t), y: camY(t), z: Math.exp(camLZ(t)) };
}

export function layerOf(cam: Cam, p: number): Layer {
  const z = 1 + (cam.z - 1) * p;
  const fx = CX + (cam.x - CX) * p;
  const fy = CY + (cam.y - CY) * p;
  return { z, ox: CX - fx * z, oy: CY - fy * z, p };
}

/** World -> screen on a layer. */
export const toScreen = (L: Layer, x: number, y: number): Vec => [x * L.z + L.ox, y * L.z + L.oy];

/** CSS transform placing a world-space 1:1 element on a layer (transform-origin 0 0). */
export const layerCss = (L: Layer, dx = 0, dy = 0) =>
  `translate(${(L.ox + dx * L.z).toFixed(3)}px, ${(L.oy + dy * L.z).toFixed(3)}px) scale(${L.z.toFixed(5)})`;

/**
 * Lens: tilt (degrees, negative = looking down) from the crane, plus lens breathing, the small
 * field-of-view shift a real lens shows while focus racks from the people to the agents and,
 * during the dive, into the agent. Both are 0 / 1 on frame 0 and on the grid.
 */
export function lensAt(t: number) {
  const tiltIn = sstep(prog(t, 1.35, 2.75));
  const tiltOut = sstep(prog(t, 5.6, 6.8));
  const tilt = -4.2 * tiltIn * (1 - tiltOut);
  // focus racks: people -> agents (3.4-4.4), agents -> inside the agent (5.9-6.9)
  const rack1 = sstep(prog(t, 3.4, 4.4));
  const rack2 = sstep(prog(t, 5.9, 6.9));
  const breathe = 1 + 0.009 * rack1 * (1 - rack2) + 0.014 * Math.sin(Math.PI * rack2);
  // overscan hides the keystone corners that the tilt opens
  const overscan = 1 + 0.0078 * Math.abs(tilt);
  return { tilt, scale: breathe * overscan, rack1, rack2 };
}

/** Depth of field: px of blur on each plane. Focus sits on the people, then the agents. */
export function dofAt(t: number) {
  const { rack1, rack2 } = lensAt(t);
  return {
    wall: clamp(lerp(0, 2.2, sstep(prog(t, 1.2, 2.8))) + 1.2 * rack1, 0, 6),
    people: clamp(1.2 * rack1 * (1 - sstep(prog(t, 4.9, 5.4))) + 7 * rack2, 0, 8),
  };
}
