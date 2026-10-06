import { C, CX, CY, H, W, ease, rgba } from "../theme";
import { anamorphicFlare, packets, ribbon, type Bezier } from "../lib/draw";
import { bump, lerp, mulberry, prog, sstep, type Vec } from "../lib/math";
import { projectAt } from "../three/cameraPath";
import { MIC } from "../three/world";

/**
 * Screen-space light: the two anamorphic flares, star-like dust, and the finale (bokeh,
 * smoky tapered ribbons swirling to one point just above centre, mirrored on a glossy floor).
 */
export const CONVERGE: Vec = [960, 468];

export function drawFlares(ctx: CanvasRenderingContext2D, t: number) {
  const k1 = bump(t, 1.3, 2.05) * 0.95;
  if (k1 > 0.005) {
    const m = projectAt(t, MIC);
    anamorphicFlare(ctx, m[0], m[1], k1);
  }
  anamorphicFlare(ctx, CONVERGE[0], CONVERGE[1], bump(t, 6.95, 7.55) * 0.9);
}

const R = mulberry(20260);
const DUST = Array.from({ length: 260 }, () => ({
  x: R() * W,
  y: R() * H,
  z: lerp(0.3, 1.6, R()),
  r: lerp(0.5, 1.6, R()),
  a: lerp(0.25, 1, R()),
  v: lerp(6, 22, R()),
  ph: R() * Math.PI * 2,
}));

/** Fine dust drifting in depth once the light has drained; near motes are soft. */
export function drawDust(ctx: CanvasRenderingContext2D, t: number, k: number) {
  if (k <= 0.005) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const d of DUST) {
    const x = (((d.x + Math.sin(t * 0.7 + d.ph) * 14 * d.z) % W) + W) % W;
    const y = (((d.y - t * d.v * d.z) % H) + H) % H;
    const tw = 0.7 + 0.3 * Math.sin(t * 3 + d.ph);
    if (d.z > 1.25) {
      const rr = d.r * 4.2 * d.z;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, rgba(C.ice, k * d.a * 0.22));
      g.addColorStop(1, rgba(C.ice, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    } else {
      ctx.fillStyle = rgba(C.ice, k * d.a * 0.55 * tw);
      const rr = d.r * d.z;
      ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
  }
  ctx.restore();
}

const BOKEH = Array.from({ length: 30 }, () => {
  const ang = R() * Math.PI * 2;
  const rad = lerp(60, 620, Math.sqrt(R()));
  return { ang, rad, r: lerp(14, 70, R()), a: lerp(0.08, 0.24, R()), teal: R() < 0.55, k: lerp(0.6, 1.6, R()) };
});
const STARTS: Vec[] = [
  [-140, 200],
  [-180, 640],
  [-60, 1060],
  [520, 1200],
  [1420, 1220],
  [2080, 900],
  [2100, 420],
  [1700, -150],
  [860, -170],
  [260, -120],
];
/** A swirl: every ribbon enters on a curl, all turning the same way round the point. */
const swirl = (st: Vec, k: number): [Vec, Vec, Vec, Vec] => {
  const P = CONVERGE;
  const dx = P[0] - st[0];
  const dy = P[1] - st[1];
  const curl = 0.55 + 0.1 * (k % 3);
  const m1: Vec = [st[0] + dx * 0.35 - dy * curl, st[1] + dy * 0.35 + dx * curl * 0.6];
  const m2: Vec = [P[0] - dx * 0.25 - dy * 0.35, P[1] - dy * 0.25 + dx * 0.2];
  return [st, m1, m2, P];
};

let refl: HTMLCanvasElement | null = null;
const reflCtx = () => {
  if (!refl) {
    refl = document.createElement("canvas");
    refl.width = W;
    refl.height = H;
  }
  return refl.getContext("2d") as CanvasRenderingContext2D;
};

export function drawFinale(ctx: CanvasRenderingContext2D, t: number) {
  const end = 1 - sstep(prog(t, 7.25, 7.6));
  const dive = prog(t, 6.1, 7.3);
  if (dive <= 0 || end <= 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const bk = bump(t, 6.1, 7.45) * end;
  for (const b of BOKEH) {
    const spread = 1 + dive * 2.2 * b.k;
    const x = CX + Math.cos(b.ang) * b.rad * spread;
    const y = CY - 40 + Math.sin(b.ang) * b.rad * spread * 0.7;
    const rr = b.r * (1 + dive * 1.3 * b.k);
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
  const g = ease.inOut(prog(t, 6.4, 7.15));
  const curves: (Bezier | null)[] = STARTS.map((st, k) =>
    ribbon(ctx, swirl(st, k), 22, end * 0.9, g, k % 2 ? C.neon : C.ice, C.neon, 1.3 + k),
  );
  curves.forEach((B, k) => packets(ctx, B, t, end * g * 0.7, 2, 0.8, k * 0.13));
  ctx.restore();

  // glossy floor: the ribbons mirrored under a horizon, fading with distance from it
  const horizon = 700;
  const r = reflCtx();
  r.setTransform(1, 0, 0, 1, 0, 0);
  r.globalCompositeOperation = "source-over";
  r.clearRect(0, 0, W, H);
  r.translate(0, horizon * 2);
  r.scale(1, -1);
  r.globalCompositeOperation = "lighter";
  STARTS.forEach((st, k) => ribbon(r, swirl(st, k), 22, end * 0.9, g, k % 2 ? C.neon : C.ice, C.neon, 1.3 + k));
  r.setTransform(1, 0, 0, 1, 0, 0);
  const fade = r.createLinearGradient(0, horizon, 0, horizon + 320);
  fade.addColorStop(0, "rgba(0,0,0,1)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  r.globalCompositeOperation = "destination-in";
  r.fillStyle = fade;
  r.fillRect(0, 0, W, H);
  r.globalCompositeOperation = "destination-out";
  r.fillRect(0, 0, W, horizon);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.26 * g;
  ctx.drawImage(r.canvas, 0, 0);
  const hl = ctx.createLinearGradient(CONVERGE[0] - 700, 0, CONVERGE[0] + 700, 0);
  hl.addColorStop(0, rgba(C.ice, 0));
  hl.addColorStop(0.5, rgba(C.ice, 0.3 * end));
  hl.addColorStop(1, rgba(C.ice, 0));
  ctx.globalAlpha = g;
  ctx.fillStyle = hl;
  ctx.fillRect(CONVERGE[0] - 700, horizon, 1400, 1);
  ctx.restore();
}

/** Seeded 256px grain tile as a data URL (generated once per tab). */
let grain: string | null = null;
export function grainUrl() {
  if (grain) return grain;
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const id = g.createImageData(256, 256);
  const r = mulberry(77);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 128 + (r() - 0.5) * 255;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  grain = c.toDataURL("image/png");
  return grain;
}
