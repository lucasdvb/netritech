import { PLANE } from "../theme";
import { camAt, layerOf } from "../lib/camera";
import type { Scene } from "../lib/timeline";

/** The agents' work: one frosted panel per agent, kept above and beside them. */
export type PanelSpec = {
  who: 0 | 1 | 2;
  kind: "call" | "ticket" | "csat";
  /** intended screen position and size at t = 4.9 s */
  sx: number;
  sy: number;
  w: number;
  h: number;
  /** entrance time, s */
  t0: number;
};

export const PANELS: PanelSpec[] = [
  { who: 0, kind: "call", sx: 70, sy: 250, w: 320, h: 150, t0: 4.05 },
  { who: 1, kind: "ticket", sx: 905, sy: 70, w: 330, h: 168, t0: 4.3 },
  { who: 2, kind: "csat", sx: 1440, sy: 205, w: 320, h: 196, t0: 4.55 },
];

/** World anchor of a panel, from where it should sit on screen at t = 4.9 s. */
function panelAnchor(sx: number, sy: number, plane: number) {
  const L = layerOf(camAt(4.9), plane);
  return { wx: (sx - L.ox) / L.z, wy: (sy - L.oy) / L.z, z0: L.z };
}

const ANCHORS = PANELS.map((p) => panelAnchor(p.sx, p.sy, PLANE.panels));

/** Screen rectangle of a panel this frame (it lives on the panel plane, so it parallaxes). */
export function panelRect(s: Scene, i: number) {
  const L = s.L.panels;
  const A = ANCHORS[i];
  const k = L.z / A.z0;
  const p = PANELS[i];
  return { x: A.wx * L.z + L.ox, y: A.wy * L.z + L.oy, k, w: p.w * k, h: p.h * k };
}
