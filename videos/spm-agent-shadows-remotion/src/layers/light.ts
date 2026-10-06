import { C, CX, CY, H, W, ease, rgba } from "../theme";
import { layerOf, toScreen } from "../lib/camera";
import { FX, NAMES } from "../lib/fx";
import { anamorphicFlare, packets, ribbon, type Bezier } from "../lib/draw";
import { bump, lerp, mulberry, prog, sstep, type Vec } from "../lib/math";
import type { Scene } from "../lib/timeline";
import { agentHeadScreen } from "./agents";
import { PANELS, panelRect } from "./panels-data";
import { micScreen } from "./scan";

/** Convergence point of the dive: one point of light just above centre. */
export const CONVERGE: Vec = [960, 468];

/**
 * Silk ribbons: from each headset to its agent, then a finer strand from the agent to its panel.
 * They leave from the ear side of the headset and arc up behind the head, never across a face.
 */
export function drawRibbons(ctx: CanvasRenderingContext2D, s: Scene) {
  const { t } = s;
  const ribK = s.endFade * (1 - sstep(prog(t, 6.2, 6.7)));
  if (ribK <= 0.01) return;
  const Lp = s.L.people;
  const za = s.L.agents.z;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  NAMES.forEach((nm, i) => {
    const g = ease.inOut(prog(t, 3.75 + 0.25 * i, 4.45 + 0.25 * i));
    if (g <= 0) return;
    const m = toScreen(Lp, FX.ears[nm][0], FX.ears[nm][1]);
    const a = agentHeadScreen(s, i);
    const B1 = ribbon(
      ctx,
      [m, [m[0] - 30 * Lp.z, m[1] - 190 * Lp.z], [a[0] + 150 * za, a[1] - 150 * za], a],
      13 * Lp.z,
      ribK,
      g,
      C.ice,
      C.neon,
      1.3 + i,
    );
    packets(ctx, B1, t, ribK * g, 4, 0.55, i * 0.21);
    // second strand: agent -> its panel
    const pn = PANELS[i];
    const g2 = ease.inOut(prog(t, pn.t0 - 0.05, pn.t0 + 0.5));
    if (g2 <= 0) return;
    const R = panelRect(s, i);
    const px = R.x + (i === 0 ? R.w : 0);
    const py = R.y + R.h * 0.5;
    const B2 = ribbon(
      ctx,
      [a, [lerp(a[0], px, 0.3), a[1] - 160 * za], [lerp(a[0], px, 0.7), py - 90], [px, py]],
      6 * za,
      ribK * 0.85,
      g2,
      C.ice,
      C.neon,
      0.4 + i,
    );
    packets(ctx, B2, t + 0.3, ribK * g2 * 0.8, 3, 0.7, i * 0.37);
  });
  ctx.restore();
}

const R = mulberry(20260);
const BOKEH = Array.from({ length: 30 }, () => {
  const ang = R() * Math.PI * 2;
  const rad = lerp(60, 620, Math.sqrt(R()));
  return { ang, rad, r: lerp(14, 70, R()), a: lerp(0.08, 0.26, R()), teal: R() < 0.55, k: lerp(0.6, 1.6, R()) };
});
const DUST = Array.from({ length: 280 }, () => ({
  x: lerp(-260, W + 260, R()),
  y: lerp(-260, H + 260, R()),
  p: lerp(0.35, 1.7, R()),
  r: lerp(0.5, 1.7, R()),
  a: lerp(0.25, 1, R()),
  v: lerp(4, 14, R()),
}));

/** Ribbons curling in from the frame edges toward the convergence point. */
const EDGE_STARTS: Vec[] = [
  [-120, 220],
  [-160, 760],
  [520, 1180],
  [1460, 1200],
  [2060, 820],
  [2040, 160],
  [880, -140],
];
const convergeCurve = (st: Vec, k: number): [Vec, Vec, Vec, Vec] => {
  const P = CONVERGE;
  const mid: Vec = [lerp(st[0], P[0], 0.45) + (k % 2 ? 240 : -240), lerp(st[1], P[1], 0.45) + (k % 3 ? -160 : 160)];
  return [st, mid, [lerp(mid[0], P[0], 0.6), lerp(mid[1], P[1], 0.9)], P];
};

/**
 * Inside the agent: soft bokeh discs, two hairline rings rippling like a voice, ribbons from the
 * frame edges converging on one point, and their reflection on a glossy floor.
 */
export function drawDive(ctx: CanvasRenderingContext2D, s: Scene) {
  const { t, dive, endFade } = s;
  if (dive <= 0 || endFade <= 0) return;
  const P = CONVERGE;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const bk = bump(t, 5.95, 7.25) * endFade;
  for (const b of BOKEH) {
    const spread = 1 + dive * 2.4 * b.k;
    const x = CX + Math.cos(b.ang) * b.rad * spread;
    const y = CY - 40 + Math.sin(b.ang) * b.rad * spread * 0.7;
    const rr = b.r * (1 + dive * 1.4 * b.k);
    const g = ctx.createRadialGradient(x, y, rr * 0.55, x, y, rr);
    const col = b.teal ? C.neon : C.steel;
    g.addColorStop(0, rgba(col, b.a * bk));
    g.addColorStop(0.85, rgba(col, b.a * bk * 0.8));
    g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let k = 0; k < 2; k++) {
    const u = prog(t, 6.2 + k * 0.28, 7.25 + k * 0.28);
    if (u <= 0 || u >= 1) continue;
    ctx.beginPath();
    ctx.arc(P[0], P[1], 24 + ease.out(u) * 640, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(C.ice, 0.5 * (1 - u) * endFade);
    ctx.lineWidth = 1.3;
    ctx.stroke();
  }
  const g = ease.inOut(prog(t, 6.05, 7.0));
  const curves: (Bezier | null)[] = EDGE_STARTS.map((st, k) =>
    ribbon(ctx, convergeCurve(st, k), 16, endFade, g, k % 2 ? C.neon : C.ice, C.neon, 1.3 + k),
  );
  curves.forEach((B, k) => packets(ctx, B, t, endFade * g * 0.7, 2, 0.8, k * 0.13));
  ctx.restore();

  // glossy floor: a mirrored copy under a horizon, fading with distance from it
  const horizon = 700;
  const r = reflectionBuffer();
  const refl = r.canvas;
  r.setTransform(1, 0, 0, 1, 0, 0);
  r.globalCompositeOperation = "source-over";
  r.clearRect(0, 0, W, H);
  r.translate(0, horizon * 2);
  r.scale(1, -1);
  r.globalCompositeOperation = "lighter";
  EDGE_STARTS.forEach((st, k) => ribbon(r, convergeCurve(st, k), 16, endFade, g, k % 2 ? C.neon : C.ice, C.neon, 1.3 + k));
  r.setTransform(1, 0, 0, 1, 0, 0);
  const fade = r.createLinearGradient(0, horizon, 0, horizon + 300);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  r.globalCompositeOperation = "destination-in";
  r.fillStyle = fade;
  r.fillRect(0, 0, W, H);
  r.globalCompositeOperation = "destination-out";
  r.fillRect(0, 0, W, horizon);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.24 * g;
  ctx.drawImage(refl, 0, 0);
  // the floor's specular hairline
  const hl = ctx.createLinearGradient(P[0] - 700, 0, P[0] + 700, 0);
  hl.addColorStop(0, rgba(C.ice, 0));
  hl.addColorStop(0.5, rgba(C.ice, 0.35 * endFade));
  hl.addColorStop(1, rgba(C.ice, 0));
  ctx.globalAlpha = g;
  ctx.fillStyle = hl;
  ctx.fillRect(P[0] - 700, horizon, 1400, 1);
  ctx.restore();
}

let reflCanvas: HTMLCanvasElement | null = null;
function reflectionBuffer() {
  if (!reflCanvas) {
    reflCanvas = document.createElement("canvas");
    reflCanvas.width = W;
    reflCanvas.height = H;
  }
  return reflCanvas.getContext("2d") as CanvasRenderingContext2D;
}

/** Dust in depth: planes from 0.35 (far) to 1.7 (in front of the lens, soft). */
export function drawDust(ctx: CanvasRenderingContext2D, s: Scene) {
  const k = lerp(0.18, 0.75, s.drain) * s.endFade * ease.soft(prog(s.t, 0.03, 0.8));
  if (k <= 0.005) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const d of DUST) {
    const L = layerOf(s.cam, d.p);
    const [x, y] = toScreen(L, d.x, d.y - s.t * d.v);
    if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
    const rr = d.r * Math.min(3, Math.sqrt(L.z));
    if (d.p > 1.3) {
      // out of focus foreground mote
      const R2 = rr * 3.2;
      const g = ctx.createRadialGradient(x, y, 0, x, y, R2);
      g.addColorStop(0, rgba(C.ice, k * d.a * 0.32));
      g.addColorStop(1, rgba(C.ice, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - R2, y - R2, R2 * 2, R2 * 2);
    } else {
      ctx.fillStyle = rgba(C.ice, k * d.a * 0.6);
      ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
  }
  ctx.restore();
}

/** The two anamorphic flares: scan birth on the microphone, and the convergence. */
export function drawFlares(ctx: CanvasRenderingContext2D, s: Scene) {
  const m = micScreen(s);
  anamorphicFlare(ctx, m[0], m[1], bump(s.t, 2.5, 3.15) * 0.95);
  anamorphicFlare(ctx, CONVERGE[0], CONVERGE[1], bump(s.t, 6.85, 7.5) * 0.9);
}
