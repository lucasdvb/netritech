import { C, rgba } from "../theme";
import { clamp, type Vec } from "./math";

export type Bezier = (u: number) => Vec;

export const cubic = (p0: Vec, p1: Vec, p2: Vec, p3: Vec): Bezier => (u) => {
  const v = 1 - u;
  return [
    v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
    v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
  ];
};

/**
 * A silk ribbon along a cubic bezier: an asymmetric filled strip whose width breathes along its
 * length (reads as a slow twist), a hairline spine, and a tapered glowing tip at the growth front.
 * `grow` 0..1 draws the ribbon out from p0. Returns the curve for packets to ride.
 */
export function ribbon(
  ctx: CanvasRenderingContext2D,
  pts: [Vec, Vec, Vec, Vec],
  wMax: number,
  alpha: number,
  grow: number,
  colA: string = C.ice,
  colB: string = C.neon,
  phase = 1.3,
): Bezier | null {
  if (alpha <= 0.002 || grow <= 0.001) return null;
  const B = cubic(...pts);
  const N = 56;
  const top: Vec[] = [];
  const bot: Vec[] = [];
  for (let k = 0; k <= N; k++) {
    const u = (k / N) * grow;
    const a = B(u);
    const b = B(Math.min(1, u + 0.01));
    let nx = -(b[1] - a[1]);
    let ny = b[0] - a[0];
    const l = Math.hypot(nx, ny) || 1;
    nx /= l;
    ny /= l;
    const along = clamp(u / Math.max(grow, 0.001));
    const w = wMax * Math.pow(Math.sin(Math.PI * along), 0.85) * (0.55 + 0.45 * Math.sin(u * 9 + phase));
    top.push([a[0] + nx * w, a[1] + ny * w]);
    bot.push([a[0] - nx * w * 0.35, a[1] - ny * w * 0.35]);
  }
  const end = B(grow);
  const g = ctx.createLinearGradient(pts[0][0], pts[0][1], end[0], end[1]);
  g.addColorStop(0, rgba(colA, 0.04 * alpha));
  g.addColorStop(0.55, rgba(colA, 0.5 * alpha));
  g.addColorStop(1, rgba(colB, 0.92 * alpha));
  ctx.beginPath();
  top.forEach((q, k) => (k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
  for (let k = bot.length - 1; k >= 0; k--) ctx.lineTo(bot[k][0], bot[k][1]);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  // hairline spine
  ctx.beginPath();
  for (let k = 0; k <= N; k++) {
    const q = B((k / N) * grow);
    if (k) ctx.lineTo(q[0], q[1]);
    else ctx.moveTo(q[0], q[1]);
  }
  ctx.strokeStyle = rgba(C.ice, 0.5 * alpha);
  ctx.lineWidth = 1;
  ctx.stroke();
  // tapered glowing tip
  glowDot(ctx, end[0], end[1], 16, alpha);
  return B;
}

export function glowDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(C.core, 0.95 * alpha));
  g.addColorStop(0.35, rgba(C.neon, 0.5 * alpha));
  g.addColorStop(1, rgba(C.neon, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

/** Light packets travelling both ways along a ribbon. Positions are a pure function of t. */
export function packets(ctx: CanvasRenderingContext2D, B: Bezier | null, t: number, alpha: number, n: number, speed: number, seed: number) {
  if (!B || alpha <= 0.01) return;
  for (let k = 0; k < n; k++) {
    const dir = k % 2 ? -1 : 1;
    const u = ((((t * speed * dir + k / n + seed) % 1) + 1) % 1);
    const q = B(u);
    const fade = Math.sin(Math.PI * u);
    glowDot(ctx, q[0], q[1], 7, alpha * fade);
  }
}

/**
 * Restrained anamorphic flare: a small hot core, a hairline horizontal streak with two softer
 * sheaths, and three faint ghosts mirrored through frame centre (as real anamorphic glass does).
 * Teal and ice only.
 */
export function anamorphicFlare(ctx: CanvasRenderingContext2D, x: number, y: number, k: number, cx = 960, cy = 540) {
  if (k <= 0.005) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  let g = ctx.createRadialGradient(x, y, 0, x, y, 150);
  g.addColorStop(0, rgba("255,255,255", 0.85 * k));
  g.addColorStop(0.1, rgba(C.neon, 0.5 * k));
  g.addColorStop(0.45, rgba(C.teal, 0.12 * k));
  g.addColorStop(1, rgba(C.teal, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 150, y - 150, 300, 300);
  const streaks: [number, number, number][] = [
    [2.2, 0.9, 950],
    [12, 0.24, 1350],
    [40, 0.07, 1700],
  ];
  for (const [hh, a, wd] of streaks) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, hh / wd);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, wd);
    g.addColorStop(0, rgba(C.ice, a * k));
    g.addColorStop(0.35, rgba(C.neon, a * 0.45 * k));
    g.addColorStop(1, rgba(C.teal, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, wd, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // ghosts on the line through the optical centre
  const ghosts: [number, number, number][] = [
    [-0.45, 26, 0.07],
    [-0.9, 54, 0.045],
    [0.35, 14, 0.06],
  ];
  for (const [s, r, a] of ghosts) {
    const gx = cx + (x - cx) * s;
    const gy = cy + (y - cy) * s;
    g = ctx.createRadialGradient(gx, gy, r * 0.6, gx, gy, r);
    g.addColorStop(0, rgba(C.neon, a * k));
    g.addColorStop(0.85, rgba(C.teal, a * 0.8 * k));
    g.addColorStop(1, rgba(C.teal, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(gx, gy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
