import { C, H, W, ease, rgba } from "../theme";
import { toScreen } from "../lib/camera";
import { FX } from "../lib/fx";
import { clamp, lerp, prog, type Vec } from "../lib/math";
import type { Scene } from "../lib/timeline";
import type { FxAssets } from "../lib/assets";

const draw = (ctx: CanvasRenderingContext2D, img: CanvasImageSource, s: Scene, alpha: number) => {
  if (alpha <= 0.001) return;
  const L = s.L.people;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.setTransform(L.z, 0, 0, L.z, L.ox, L.oy);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
};

/** The woman's microphone on screen: the spine of the film. */
export const micScreen = (s: Scene): Vec => toScreen(s.L.people, FX.mics.woman[0], FX.mics.woman[1]);

/**
 * The scan: a hairline neon front ripples out from the woman's microphone. Inside it the people
 * carry glowing edges, an X-ray outline and a point cloud. After the drain the linework stays as
 * the people's wireframe.
 */
export function drawScan(ctx: CanvasRenderingContext2D, s: Scene, a: FxAssets) {
  const { t, drain, diveFade } = s;
  const scanU = prog(t, 2.62, 3.55);
  if (scanU <= 0 || diveFade <= 0.001) return;
  const z = s.L.people.z;
  const mic = micScreen(s);
  const r = ease.outCubic(scanU) * 1650 * z;
  const persist = lerp(0.14, 0.85, drain);
  const outlineK = lerp(0.55, 0.9, drain);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.beginPath();
  ctx.arc(mic[0], mic[1], Math.max(1, r), 0, Math.PI * 2);
  ctx.clip();
  draw(ctx, a.edgeGlow, s, 0.55 * persist * diveFade);
  draw(ctx, a.edgesP, s, persist * diveFade);
  draw(ctx, a.outlineGlow, s, outlineK * diveFade);
  draw(ctx, a.outline, s, 0.6 * outlineK * diveFade);
  ctx.restore();

  if (scanU < 1) {
    // bright band just behind the front
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.arc(mic[0], mic[1], Math.max(1, r), 0, Math.PI * 2);
    ctx.arc(mic[0], mic[1], Math.max(0.5, r - 120 * z), 0, Math.PI * 2, true);
    ctx.clip("evenodd");
    draw(ctx, a.edgesP, s, 1 - scanU * 0.5);
    draw(ctx, a.edgeGlow, s, 1 - scanU * 0.5);
    ctx.restore();
    // the front: one hairline neon ring with a soft leading glow
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.arc(mic[0], mic[1], Math.max(1, r), 0, Math.PI * 2);
    ctx.strokeStyle = rgba(C.neon, 0.5 * (1 - scanU));
    ctx.lineWidth = 6;
    ctx.shadowColor = rgba(C.neon, 0.9);
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = rgba(C.core, 0.9 * (1 - scanU));
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }

  // point cloud on clothes and hair
  const pts = FX.people_points;
  const dotK = lerp(0.42, 0.85, drain) * diveFade;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let k = 0; k < pts.length; k++) {
    const [x, y, , l] = pts[k];
    const p = toScreen(s.L.people, x, y);
    const d = Math.hypot(p[0] - mic[0], p[1] - mic[1]);
    if (d > r) continue;
    const band = clamp(1 - (r - d) / (150 * z));
    const al = clamp(dotK * (0.45 + 0.55 * l) * (0.55 + 0.9 * band));
    ctx.fillStyle = rgba(band > 0.2 ? C.core : C.ice, al);
    ctx.fillRect(p[0] - 0.8, p[1] - 0.8, 1.6, 1.6);
  }
  ctx.restore();
}

/**
 * Room linework appears faintly as the light drains. The wall's lines sit on the wall plane and
 * the table edge on the people plane, so the wireframe keeps the same parallax as the photo.
 */
export function drawRoomLines(ctx: CanvasRenderingContext2D, s: Scene, a: FxAssets) {
  const k = ease.soft(prog(s.t, 4.95, 5.5)) * (1 - ease.soft(prog(s.t, 6.0, 6.5)));
  if (k <= 0.01) return;
  const split = 700; // image rows below this are the table edge
  const parts: [typeof s.L.wall, number, number][] = [
    [s.L.wall, 0, split],
    [s.L.people, split, H],
  ];
  for (const [L, y0, y1] of parts) {
    ctx.save();
    ctx.globalAlpha = 0.34 * k;
    ctx.setTransform(L.z, 0, 0, L.z, L.ox, L.oy);
    ctx.drawImage(a.edgesR, 0, y0, W, y1 - y0, 0, y0, W, y1 - y0);
    ctx.restore();
  }
}
