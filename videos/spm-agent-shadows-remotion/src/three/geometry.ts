import { BufferAttribute, BufferGeometry, Vector3 } from "three";
import { lerp, mulberry } from "../lib/math";
import {
  AXIS,
  DESK,
  FACE,
  HEAD_L,
  LAPTOP_L,
  NAMES3,
  PODS,
  SD,
  agentLocal,
  agentTime,
  localToWorld,
  revealAt,
  type Pod,
  type Seat,
  type V3,
} from "./world";

const attr = (g: BufferGeometry, name: string, data: number[] | Float32Array, size: number) =>
  g.setAttribute(name, new BufferAttribute(data instanceof Float32Array ? data : new Float32Array(data), size));

/** Hero point cloud from points.bin: [x, y, z, r, g, b, person, luma]. Desk points (person 3) included. */
export function heroPointsGeometry(bin: Float32Array) {
  const n = bin.length / 8;
  const pos = new Float32Array(n * 3);
  const col = new Float32Array(n * 3);
  const luma = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    pos.set(bin.subarray(k * 8, k * 8 + 3), k * 3);
    col.set(bin.subarray(k * 8 + 3, k * 8 + 6), k * 3);
    luma[k] = bin[k * 8 + 7];
  }
  const g = new BufferGeometry();
  attr(g, "position", pos, 3);
  attr(g, "aColor", col, 3);
  attr(g, "aLuma", luma, 1);
  return g;
}

const seatWorld = (s: Seat, l: V3): V3 => localToWorld(s.pos, [l[0] * s.scale, l[1] * s.scale, l[2] * s.scale], s.flip);

/** Every seated figure on the floor (not the hero three), as a light point cloud. */
export function figurePointsGeometry() {
  const pos: number[] = [];
  const luma: number[] = [];
  for (const pod of PODS) {
    if (pod.hero) continue;
    for (const s of pod.seats) {
      const tpl = SD.figures[s.tpl];
      for (let k = 0; k < tpl.length; k += 2) {
        const p = tpl[k];
        pos.push(...seatWorld(s, [p[0], p[1], p[2]]));
        luma.push(p[3]);
      }
    }
  }
  const g = new BufferGeometry();
  attr(g, "position", pos, 3);
  attr(g, "aColor", new Float32Array(pos.length), 3);
  attr(g, "aLuma", luma, 1);
  return g;
}

// ---------- wireframe furniture ----------
type Box = { c: V3; h: V3 }; // local centre and half sizes along (face, up, axis)
const BOX_EDGES: [number, number][] = [
  [0, 1], [1, 3], [3, 2], [2, 0],
  [4, 5], [5, 7], [7, 6], [6, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

function pushBox(out: number[], origin: V3, b: Box, flip: boolean) {
  const corners: V3[] = [];
  for (let k = 0; k < 8; k++) {
    const l: V3 = [b.c[0] + (k & 1 ? 1 : -1) * b.h[0], b.c[1] + (k & 2 ? 1 : -1) * b.h[1], b.c[2] + (k & 4 ? 1 : -1) * b.h[2]];
    corners.push(localToWorld(origin, l, flip));
  }
  for (const [a, c] of BOX_EDGES) out.push(...corners[a], ...corners[c]);
}

/** A pod: one long desk, a chair per seat, a monitor (or the hero's laptops) per seat. */
type BoxGroup = { boxes: Box[]; origin: V3; flip: boolean };

function podBoxes(pod: Pod): BoxGroup[] {
  const out: BoxGroup[] = [];
  const desk: Box[] = [
    { c: [DESK.f, DESK.y - 0.02, DESK.a], h: [DESK.hf, 0.02, DESK.ha] },
    { c: [DESK.f, DESK.y / 2, DESK.a - DESK.ha + 0.04], h: [DESK.hf - 0.05, DESK.y / 2, 0.02] },
    { c: [DESK.f, DESK.y / 2, DESK.a + DESK.ha - 0.04], h: [DESK.hf - 0.05, DESK.y / 2, 0.02] },
  ];
  // a low privacy screen down the desk's centre line
  if (!pod.hero) desk.push({ c: [DESK.f, DESK.y + 0.2, DESK.a], h: [0.01, 0.2, DESK.ha - 0.1] });
  out.push({ boxes: desk, origin: pod.origin, flip: false });
  for (const s of pod.seats) {
    const seatL: Box[] = [
      { c: [-0.12, 0.47, 0], h: [0.24, 0.035, 0.24] },
      { c: [-0.38, 0.82, 0], h: [0.03, 0.3, 0.23] },
      { c: [-0.12, 0.22, 0], h: [0.02, 0.22, 0.02] },
    ];
    if (!s.hero) {
      seatL.push({ c: [0.62, DESK.y + 0.3, 0.05], h: [0.015, 0.2, 0.3] }); // monitor
      seatL.push({ c: [0.66, DESK.y + 0.06, 0.05], h: [0.06, 0.06, 0.02] }); // stand
    }
    out.push({ boxes: seatL, origin: s.pos, flip: s.flip });
  }
  if (pod.hero) {
    // the three laptops of the photo
    const lap: Box[] = LAPTOP_L.map((l) => ({ c: [l[0] + 0.05, DESK.y + 0.012, l[2]], h: [0.17, 0.012, 0.24] }));
    out.push({ boxes: lap, origin: pod.origin, flip: false });
  }
  return out;
}

export function furnitureGeometry() {
  const pos: number[] = [];
  for (const pod of PODS) {
    for (const group of podBoxes(pod)) {
      for (const b of group.boxes) pushBox(pos, group.origin, b, group.flip);
    }
  }
  const g = new BufferGeometry();
  attr(g, "position", pos, 3);
  return g;
}

// ---------- agents ----------
export type AgentSlot = { seat: Seat; tpl: number; t: number; head: V3 };

export const AGENT_SLOTS: AgentSlot[] = (() => {
  const slots: AgentSlot[] = [];
  for (const pod of PODS) {
    pod.seats.forEach((s, k) => {
      const idx = pod.hero ? k : slots.length;
      slots.push({ seat: s, tpl: s.tpl, t: agentTime(s, pod.hero ? k : idx), head: seatWorld(s, agentLocal(HEAD_L[s.tpl])) });
    });
  }
  return slots;
})();

export function agentGeometry() {
  const r = mulberry(909);
  const pts: number[] = [];
  const pt: number[] = [];
  const pm: number[] = [];
  const ps: number[] = [];
  const lines: number[] = [];
  const lt: number[] = [];
  const ls: number[] = [];
  const lk: number[] = [];
  const glow: number[] = [];
  const gt: number[] = [];
  for (const slot of AGENT_SLOTS) {
    const tpl = SD.agents[slot.tpl];
    const step = slot.seat.hero ? 1 : 2;
    for (let k = 0; k < tpl.points.length; k += step) {
      const p = tpl.points[k];
      pts.push(...seatWorld(slot.seat, agentLocal([p[0], p[1], p[2]])));
      pt.push(slot.t);
      pm.push(p[3]);
      ps.push(lerp(-1, 1, r()), lerp(-0.3, 1, r()), lerp(-1, 1, r()));
    }
    // neon outline (head and shoulders only) and horizontal scan slices
    const c = tpl.contour;
    for (let k = 0; k < c.length; k++) {
      const a = c[k];
      const b = c[(k + 1) % c.length];
      if (a[1] < tpl.cutY && b[1] < tpl.cutY) continue;
      lines.push(...seatWorld(slot.seat, agentLocal(a)), ...seatWorld(slot.seat, agentLocal(b)));
      lt.push(slot.t, slot.t);
      ls.push(0, 0, 0, 0, 0, 0);
      lk.push(0, 0);
    }
    for (const s of tpl.slices) {
      if (!slot.seat.hero && r() < 0.5) continue;
      lines.push(...seatWorld(slot.seat, agentLocal([s[0], s[1], s[2]])), ...seatWorld(slot.seat, agentLocal([s[3], s[4], s[5]])));
      lt.push(slot.t + 0.1, slot.t + 0.1);
      ls.push(0, 0, 0, 0, 0, 0);
      lk.push(1, 1);
    }
    glow.push(slot.head[0], slot.head[1] - 0.22, slot.head[2]);
    gt.push(slot.t);
  }
  const gp = new BufferGeometry();
  attr(gp, "position", pts, 3);
  attr(gp, "aT", pt, 1);
  attr(gp, "aM", pm, 1);
  attr(gp, "aScatter", ps, 3);
  const gl = new BufferGeometry();
  attr(gl, "position", lines, 3);
  attr(gl, "aT", lt, 1);
  attr(gl, "aScatter", ls, 3);
  attr(gl, "aKind", lk, 1);
  const gg = new BufferGeometry();
  attr(gg, "position", glow, 3);
  attr(gg, "aT", gt, 1);
  attr(gg, "aScatter", new Float32Array(glow.length), 3);
  return { points: gp, lines: gl, glow: gg };
}

// ---------- ribbons ----------
export type RibbonSpec = { p: [V3, V3, V3, V3]; t0: number; dur: number; seed: number; width: number };

const bez = (p: [V3, V3, V3, V3], u: number): Vector3 => {
  const v = 1 - u;
  const a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u;
  return new Vector3(
    a * p[0][0] + b * p[1][0] + c * p[2][0] + d * p[3][0],
    a * p[0][1] + b * p[1][1] + c * p[2][1] + d * p[3][1],
    a * p[0][2] + b * p[1][2] + c * p[2][2] + d * p[3][2],
  );
};

const up = (v: V3, k: number): V3 => [v[0], v[1] + k, v[2]];
const along = (v: V3, dir: V3, k: number): V3 => [v[0] + dir[0] * k, v[1] + dir[1] * k, v[2] + dir[2] * k];

export const RIBBONS: { hero: RibbonSpec[]; floor: RibbonSpec[]; network: RibbonSpec[] } = (() => {
  const r = mulberry(31337);
  const hero: RibbonSpec[] = [];
  const floor: RibbonSpec[] = [];
  const network: RibbonSpec[] = [];
  AGENT_SLOTS.forEach((slot, k) => {
    if (slot.seat.hero) {
      const ear = SD.ears[NAMES3[slot.tpl]];
      const head = slot.head;
      hero.push({
        p: [ear, along(up(ear, 0.75), FACE, -0.25), along(up(head, 0.6), FACE, 0.2), head],
        t0: slot.t + 0.1,
        dur: 0.7,
        seed: slot.tpl * 0.31,
        width: 0.012,
      });
    } else {
      const mic = seatWorld(slot.seat, [0.12, 1.45, 0.05]);
      floor.push({
        p: [mic, up(mic, 0.55), up(slot.head, 0.45), slot.head],
        t0: slot.t + 0.05,
        dur: 0.55,
        seed: r(),
        width: 0.01,
      });
    }
  });
  // the network: pod hubs above the desks, linked to their neighbours in high arcs
  const hub = (pod: Pod): V3 => up(localToWorld(pod.origin, [DESK.f - 0.3, 0, DESK.a]), 2.35);
  const at = (i: number, j: number) => PODS.find((p) => p.i === i && p.j === j);
  for (const pod of PODS) {
    for (const [di, dj] of [[1, 0], [0, 1], [1, 1]] as const) {
      const other = at(pod.i + di, pod.j + dj);
      if (!other || (di === 1 && dj === 1 && r() < 0.55)) continue;
      const a = hub(pod);
      const b = hub(other);
      const lift = 1.2 + r() * 1.4;
      network.push({
        p: [a, up(along(a, AXIS, 0), lift), up(b, lift), b],
        t0: Math.max(revealAt(a), revealAt(b)) + 0.35,
        dur: 0.8,
        seed: r(),
        width: 0.03,
      });
    }
    // hub to each of its agents
    for (const s of pod.seats) {
      const slot = AGENT_SLOTS.find((x) => x.seat === s);
      if (!slot) continue;
      const a = hub(pod);
      network.push({ p: [slot.head, up(slot.head, 0.6), up(a, 0.5), a], t0: slot.t + 0.35, dur: 0.6, seed: r(), width: 0.012 });
    }
  }
  return { hero, floor, network };
})();

/** Tube geometry along cubic beziers, tapering done in the shader. */
export function ribbonGeometry(specs: RibbonSpec[], N = 40, radial = 5) {
  const pos: number[] = [];
  const off: number[] = [];
  const uu: number[] = [];
  const grow: number[] = [];
  const seed: number[] = [];
  const idx: number[] = [];
  let base = 0;
  for (const s of specs) {
    for (let k = 0; k <= N; k++) {
      const u = k / N;
      const c = bez(s.p, u);
      const tan = bez(s.p, Math.min(1, u + 0.01)).sub(bez(s.p, Math.max(0, u - 0.01))).normalize();
      let n = new Vector3(0, 1, 0).cross(tan);
      if (n.lengthSq() < 1e-6) n = new Vector3(1, 0, 0).cross(tan);
      n.normalize();
      const b = tan.clone().cross(n).normalize();
      for (let q = 0; q < radial; q++) {
        const ang = (q / radial) * Math.PI * 2;
        const o = n.clone().multiplyScalar(Math.cos(ang)).add(b.clone().multiplyScalar(Math.sin(ang)));
        pos.push(c.x, c.y, c.z);
        off.push(o.x * s.width / 0.01, o.y * s.width / 0.01, o.z * s.width / 0.01);
        uu.push(u);
        grow.push(s.t0, s.dur);
        seed.push(s.seed);
      }
    }
    for (let k = 0; k < N; k++) {
      for (let q = 0; q < radial; q++) {
        const a = base + k * radial + q;
        const b2 = base + k * radial + ((q + 1) % radial);
        const c = a + radial;
        const d = b2 + radial;
        idx.push(a, c, b2, b2, c, d);
      }
    }
    base += (N + 1) * radial;
  }
  const g = new BufferGeometry();
  attr(g, "position", pos, 3);
  attr(g, "aOff", off, 3);
  attr(g, "aU", uu, 1);
  attr(g, "aGrow", grow, 2);
  attr(g, "aSeed", seed, 1);
  g.setIndex(idx);
  return g;
}
