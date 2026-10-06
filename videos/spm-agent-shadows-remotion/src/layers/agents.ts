import { C, H, W, rgba } from "../theme";
import { agentPt, agentXform, CUT, CUT_FADE, toScreen } from "../lib/camera";
import { FX, NAMES } from "../lib/fx";
import { clamp, lerp, mulberry, type Vec } from "../lib/math";
import type { Scene } from "../lib/timeline";
import type { FxAssets } from "../lib/assets";

/** Each point starts from a seeded scatter and assembles into the silhouette. */
const SCATTER = FX.agents.map((a, i) => {
  const r = mulberry(100 + i);
  return a.points.map(() => [lerp(-1, 1, r()), lerp(-1, 1, r()), r()] as const);
});

let tmp: HTMLCanvasElement | null = null;
const scratch = () => {
  if (!tmp) {
    tmp = document.createElement("canvas");
    tmp.width = W;
    tmp.height = H;
  }
  return tmp.getContext("2d") as CanvasRenderingContext2D;
};

/** Screen position of an agent's point while it rises (`rise` px below its final place). */
const agentScreen = (s: Scene, i: number, x: number, y: number, rise = 0): Vec => {
  const a = agentPt(i, x, y);
  return toScreen(s.L.agents, a[0], a[1] + rise);
};

/** Where the ribbons land on each agent (just behind the head). */
export const agentHeadScreen = (s: Scene, i: number): Vec => {
  const hd = FX.heads[NAMES[i]];
  return agentScreen(s, i, hd[0] - 10, hd[1] + 10);
};

/**
 * Three teal agents, each its person's own head and shoulders: point cloud, horizontal scan
 * slices, a neon outline and a soft core. They build bottom-to-top while rising into place.
 */
export function drawAgents(ctx: CanvasRenderingContext2D, s: Scene) {
  const { t } = s;
  const glowK = 1 + s.drain;
  const a2 = scratch();
  FX.agents.forEach((A, i) => {
    const q = s.q[i];
    if (q <= 0.001) return;
    a2.globalCompositeOperation = "source-over";
    a2.clearRect(0, 0, W, H);
    const T = agentXform(i);
    const z = s.L.agents.z;
    const rise = (1 - q) * 170;
    const sc = SCATTER[i];
    const bottom = T.ay + T.dy;
    const span = T.h * T.s;
    const level = bottom - span * clamp(q * 1.25); // build front, world y
    const P = (x: number, y: number) => agentScreen(s, i, x, y, rise);
    const hd = FX.heads[NAMES[i]];

    // soft inner core
    const c = P(hd[0], hd[1] + 230);
    let g = a2.createRadialGradient(c[0], c[1], 0, c[0], c[1], 340 * z);
    g.addColorStop(0, rgba(C.teal, 0.34 * q));
    g.addColorStop(0.6, rgba(C.teal, 0.1 * q));
    g.addColorStop(1, rgba(C.teal, 0));
    a2.fillStyle = g;
    a2.fillRect(c[0] - 400 * z, c[1] - 400 * z, 800 * z, 800 * z);

    // horizontal scan slices, like a 3D scan
    a2.lineWidth = 1;
    a2.strokeStyle = rgba(C.neon, 0.22 * q);
    a2.beginPath();
    for (const [x1, y, x2] of A.slices) {
      if (agentPt(i, x1, y)[1] < level) continue;
      const p1 = P(x1, y);
      const p2 = P(x2, y);
      a2.moveTo(p1[0], p1[1]);
      a2.lineTo(p2[0], p2[1]);
    }
    a2.stroke();

    // point cloud assembling from scatter
    const spread = Math.pow(1 - clamp(q * 1.3), 2) * 140 * z;
    for (let k = 0; k < A.points.length; k++) {
      const [x, y, m] = A.points[k];
      if (agentPt(i, x, y)[1] < level) continue;
      const p = P(x, y);
      const sk = sc[k];
      const px = p[0] + sk[0] * spread;
      const py = p[1] + sk[1] * spread;
      const al = (0.35 + 0.65 * m) * q * (0.78 + 0.22 * Math.sin(t * 5 + sk[2] * 20));
      const hot = m > 0.55;
      a2.fillStyle = hot ? rgba(C.core, al) : rgba(C.neon, al * 0.85);
      const r = hot ? 1.7 : 1.25;
      a2.fillRect(px - r / 2, py - r / 2, r, r);
    }

    // neon silhouette: wide glow, then a thin ice core line
    a2.beginPath();
    A.contour.forEach(([x, y], k) => {
      const p = P(x, y);
      if (k) a2.lineTo(p[0], p[1]);
      else a2.moveTo(p[0], p[1]);
    });
    a2.closePath();
    a2.save();
    a2.shadowColor = rgba(C.neon, 0.9 * q * glowK);
    a2.shadowBlur = 22;
    a2.strokeStyle = rgba(C.neon, 0.88 * q);
    a2.lineWidth = 2;
    a2.stroke();
    a2.restore();
    a2.strokeStyle = rgba(C.core, 0.65 * q);
    a2.lineWidth = 0.8;
    a2.stroke();

    // the printing edge while it builds
    if (q < 0.97) {
      const yl = toScreen(s.L.agents, 0, level + rise)[1];
      const x0 = P(T.ax - 330, 0)[0];
      const x1 = P(T.ax + 330, 0)[0];
      const lg = a2.createLinearGradient(x0, 0, x1, 0);
      lg.addColorStop(0, rgba(C.neon, 0));
      lg.addColorStop(0.5, rgba(C.core, 0.8 * (1 - q)));
      lg.addColorStop(1, rgba(C.neon, 0));
      a2.fillStyle = lg;
      a2.fillRect(x0, yl - 1, x1 - x0, 2);
    }

    // a slow scan band drifting down through the finished agent
    if (q > 0.6) {
      const yb = P(0, hd[1] - 120 + ((t * 0.55 + i * 0.37) % 1) * (CUT[i] + 120))[1];
      const bg = a2.createLinearGradient(0, yb - 26, 0, yb + 26);
      bg.addColorStop(0, rgba(C.neon, 0));
      bg.addColorStop(0.5, rgba(C.core, 0.22 * q));
      bg.addColorStop(1, rgba(C.neon, 0));
      a2.globalCompositeOperation = "source-atop";
      a2.fillStyle = bg;
      a2.fillRect(0, yb - 26, W, 52);
    }

    // upper-body mask: the agent echoes head and shoulders, never the arms
    const yc = P(0, hd[1] + CUT[i])[1];
    const yf = P(0, hd[1] + CUT[i] + CUT_FADE)[1];
    const mg = a2.createLinearGradient(0, yc, 0, yf);
    mg.addColorStop(0, "rgba(0,0,0,1)");
    mg.addColorStop(1, "rgba(0,0,0,0)");
    a2.globalCompositeOperation = "destination-in";
    a2.fillStyle = mg;
    a2.fillRect(0, 0, W, H);
    a2.globalCompositeOperation = "source-over";

    ctx.globalCompositeOperation = "lighter";
    ctx.drawImage(a2.canvas, 0, 0);
  });
  ctx.globalCompositeOperation = "source-over";
}

/**
 * Light wrap: the agents' teal light bleeding over the people's silhouette edges in front of
 * them, so the two layers sit in one space instead of being pasted.
 */
export function drawLightWrap(ctx: CanvasRenderingContext2D, s: Scene, assets: FxAssets) {
  const k = Math.max(...s.q) * s.diveFade;
  if (k <= 0.01) return;
  const glow = scratch();
  glow.globalCompositeOperation = "source-over";
  glow.clearRect(0, 0, W, H);
  glow.globalCompositeOperation = "lighter";
  FX.agents.forEach((_, i) => {
    const q = s.q[i];
    if (q <= 0.01) return;
    const c = agentScreen(s, i, FX.heads[NAMES[i]][0], FX.heads[NAMES[i]][1] + 140);
    const r = 420 * s.L.agents.z;
    const g = glow.createRadialGradient(c[0], c[1], 0, c[0], c[1], r);
    const a = q * lerp(0.55, 0.85, s.drain);
    g.addColorStop(0, rgba(C.neon, a));
    g.addColorStop(0.5, rgba(C.teal, a * 0.5));
    g.addColorStop(1, rgba(C.teal, 0));
    glow.fillStyle = g;
    glow.fillRect(c[0] - r, c[1] - r, r * 2, r * 2);
  });
  glow.globalCompositeOperation = "source-over";
  // rim of the people matte on the people plane, coloured by the agents' light
  const L = s.L.people;
  ctx.setTransform(L.z, 0, 0, L.z, L.ox, L.oy);
  ctx.drawImage(assets.peopleRim, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-in";
  ctx.drawImage(glow.canvas, 0, 0);
  ctx.globalCompositeOperation = "source-over";
}
