import { C, FONT, rgba, ease } from "../theme";
import { clamp, prog } from "../lib/math";

/** The agents' work, drawn into canvas textures: live call, ticket resolved, CSAT rising. */
export type PanelKind = "call" | "ticket" | "csat";
export const PANEL_SIZE: Record<PanelKind, [number, number]> = {
  call: [320, 150],
  ticket: [330, 168],
  csat: [320, 196],
};
export const PANEL_SCALE = 2; // canvas px per design px

function round(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawPanel(ctx: CanvasRenderingContext2D, kind: PanelKind, t: number, t0: number) {
  const [w, h] = PANEL_SIZE[kind];
  ctx.setTransform(PANEL_SCALE, 0, 0, PANEL_SCALE, 0, 0);
  ctx.clearRect(0, 0, w, h);
  // frosted glass: deep ink with a cool sheen, a neon hairline border
  round(ctx, 1, 1, w - 2, h - 2, 14);
  ctx.fillStyle = rgba(C.ink, 0.74);
  ctx.fill();
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, rgba(C.ice, 0.14));
  g.addColorStop(0.45, rgba(C.ice, 0.03));
  g.addColorStop(1, rgba(C.teal, 0.1));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgba(C.neon, 0.7);
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.textBaseline = "top";
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = rgba(C.ice, 0.68);
  const lt = t - t0;
  if (kind === "call") {
    const pulse = 0.5 + 0.5 * Math.sin(t * 7);
    ctx.fillStyle = rgba(C.neon, 0.6 + 0.4 * pulse);
    ctx.beginPath();
    ctx.arc(26, 27, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = rgba(C.ice, 0.68);
    ctx.fillText("LIVE CALL", 40, 21);
    const secs = 134 + Math.floor(Math.max(0, lt));
    ctx.font = `500 30px ${FONT}`;
    ctx.fillStyle = rgba(C.brume, 0.95);
    ctx.fillText(`0${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`, 22, 46);
    const fill = 30 * clamp(lt / 0.6);
    for (let b = 0; b < 30; b++) {
      const amp = 0.25 + 0.75 * Math.abs(Math.sin(b * 0.9 + t * 9) * Math.sin(b * 0.37 + t * 3.1));
      const bh = 6 + 34 * amp;
      ctx.fillStyle = b < fill ? rgba(C.neon, 0.9) : rgba(C.steel, 0.65);
      ctx.fillRect(24 + b * 9.4, 122 - bh / 2, 4, bh);
    }
  } else if (kind === "ticket") {
    ctx.fillText("TICKET  #48217", 22, 21);
    [250, 210, 160].forEach((lw, r) => {
      ctx.fillStyle = rgba(C.steel, 0.8);
      ctx.fillRect(22, 52 + r * 20, lw, 7);
    });
    const done = prog(t, t0 + 0.5, t0 + 0.75);
    round(ctx, 22, 120, 140, 30, 15);
    ctx.fillStyle = done > 0 ? rgba(C.teal, 0.4 + 0.55 * done) : rgba(C.steel, 0.55);
    ctx.fill();
    ctx.font = `600 13px ${FONT}`;
    ctx.fillStyle = rgba(C.brume, 0.96);
    const resolved = done > 0.5;
    ctx.fillText(resolved ? "RESOLVED" : "IN PROGRESS", resolved ? 60 : 42, 129);
    if (resolved) {
      const dd = ease.out(clamp((done - 0.5) * 2));
      ctx.strokeStyle = rgba(C.brume, 0.96);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(38, 135);
      ctx.lineTo(38 + 5 * clamp(dd * 2), 135 + 5 * clamp(dd * 2));
      if (dd > 0.5) ctx.lineTo(43 + 9 * clamp((dd - 0.5) * 2), 140 - 10 * clamp((dd - 0.5) * 2));
      ctx.stroke();
    }
  } else {
    ctx.fillText("CSAT · THIS WEEK", 22, 21);
    const gr = ease.outCubic(prog(t, t0 + 0.15, t0 + 0.9));
    ctx.font = `500 30px ${FONT}`;
    ctx.fillStyle = rgba(C.brume, 0.95);
    ctx.fillText((4.1 + 0.8 * gr).toFixed(1), 22, 42);
    ctx.font = `600 13px ${FONT}`;
    ctx.fillStyle = rgba(C.neon, 0.95 * gr);
    ctx.fillText("▲ 18%", 92, 56);
    const hs = [0.42, 0.55, 0.5, 0.68, 0.74, 0.86, 0.97];
    hs.forEach((hv, b) => {
      const bh = 92 * hv * clamp(gr * 1.4 - b * 0.06);
      ctx.fillStyle = b === hs.length - 1 ? rgba(C.neon, 0.95) : rgba(C.steel, 0.9);
      ctx.fillRect(24 + b * 40, 182 - bh, 26, bh);
    });
  }
}
