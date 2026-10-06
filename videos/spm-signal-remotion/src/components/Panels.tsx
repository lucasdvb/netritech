import { loadFont } from "@remotion/fonts";
import React from "react";
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { cues, palette } from "../theme";
import { PODS, agentTop } from "../lib/layout";
import { clamp01, ease, ramp } from "../lib/math";
import { projectAt } from "./CameraRig";

export const UI_FONT = "Bricolage Grotesque";
loadFont({ family: UI_FONT, url: staticFile("fonts/bricolage-grotesque-036.woff2"), weight: "200 800" });

const ICE = "rgba(220,236,242,";
const podAt = (i: number, j: number) => PODS.find((p) => Math.round(p.x / 3.2) === i && Math.round(-p.z / 3.3) === j)!;

type PanelDef = { id: string; pod: [number, number]; lift: number; start: number; width: number };
const PANELS: PanelDef[] = [
  { id: "call", pod: [-3, 2], lift: 1.0, start: 108, width: 288 },
  { id: "ticket", pod: [1, 3], lift: 0.95, start: 116, width: 300 },
  { id: "csat", pod: [3, 3], lift: 0.95, start: 124, width: 264 },
];

const Label: React.FC<{ children: React.ReactNode; dot?: number }> = ({ children, dot }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600, letterSpacing: "0.14em", color: `${ICE}0.72)` }}>
    {dot !== undefined && (
      <span style={{ width: 7, height: 7, borderRadius: 7, background: palette.neonTeal, boxShadow: `0 0 ${6 + dot * 8}px rgba(94,214,222,${0.4 + dot * 0.5})`, opacity: 0.55 + dot * 0.45 }} />
    )}
    {children}
  </div>
);

const CallBody: React.FC<{ f: number; t: number }> = ({ f, t }) => {
  const secs = 38 + Math.floor((f - 108) / 30);
  const pulse = 0.5 + 0.5 * Math.sin(f * 0.21);
  const bars = Array.from({ length: 30 }, (_, i) => {
    const v = 0.5 + 0.5 * Math.sin(i * 0.9 + f * 0.33) * Math.sin(i * 0.37 - f * 0.17 + 1.3);
    const env = Math.sin((Math.PI * (i + 0.5)) / 30);
    return 0.12 + 0.88 * Math.abs(v) * env;
  });
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Label dot={pulse}>LIVE CALL</Label>
        <span style={{ fontSize: 19, fontWeight: 500, color: `${ICE}0.95)`, fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
          00:{String(Math.max(0, secs)).padStart(2, "0")}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 3, height: 40, marginTop: 14 }}>
        {bars.map((h, i) => (
          <div key={i} style={{ flex: 1, height: `${h * 100 * t}%`, minHeight: 2, borderRadius: 2, background: i % 7 === 3 ? palette.neonTeal : `${ICE}0.78)` }} />
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 13.5, fontWeight: 400, color: `${ICE}0.6)` }}>Agent + AI assist · live notes</div>
    </>
  );
};

const TicketBody: React.FC<{ f: number }> = ({ f }) => {
  const done = ramp(f, 131, 137, ease.outCubic);
  const draw = ramp(f, 134, 144, ease.outCubic);
  return (
    <>
      <Label>TICKET #4821</Label>
      <div style={{ marginTop: 10, fontSize: 19, fontWeight: 500, color: `${ICE}0.95)`, letterSpacing: "-0.01em" }}>Billing address update</div>
      <div style={{ marginTop: 14, position: "relative", height: 30 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 8, opacity: 1 - done, transform: `translateY(${-8 * done}px)` }}>
          <span style={{ padding: "5px 11px", borderRadius: 20, border: `1px solid ${ICE}0.3)`, fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", color: `${ICE}0.75)` }}>IN PROGRESS</span>
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 8, opacity: done, transform: `translateY(${8 * (1 - done)}px)` }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px 5px 9px", borderRadius: 20, background: "rgba(34,128,138,0.32)", border: "1px solid rgba(94,214,222,0.55)", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: palette.ice }}>
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M2.5 7.4 L5.6 10.3 L11.5 3.8" fill="none" stroke={palette.neonTeal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="14" strokeDashoffset={14 * (1 - draw)} />
            </svg>
            RESOLVED
          </span>
          <span style={{ fontSize: 12.5, color: `${ICE}0.55)`, opacity: draw }}>in 3 min 12 s</span>
        </div>
      </div>
    </>
  );
};

const CsatBody: React.FC<{ f: number }> = ({ f }) => {
  const k = ramp(f, 126, 150, ease.outCubic);
  const value = 4.2 + 0.7 * k;
  const pts = [0.38, 0.46, 0.42, 0.55, 0.6, 0.57, 0.7, 0.78, 0.86, 0.97];
  const W = 224;
  const H = 46;
  const poly = pts.map((v, i) => `${(i / (pts.length - 1)) * W},${H - v * H}`).join(" ");
  const len = 300;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Label>CSAT</Label>
        <span style={{ fontSize: 26, fontWeight: 600, color: palette.ice, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
          {value.toFixed(1)}
          <span style={{ fontSize: 14, fontWeight: 400, color: `${ICE}0.5)` }}> / 5</span>
        </span>
      </div>
      <svg width={W} height={H + 4} style={{ marginTop: 10, overflow: "visible" }}>
        <polyline points={poly} fill="none" stroke={palette.neonTeal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - k)} />
        <circle cx={W * k} cy={H - (0.38 + 0.59 * k) * H} r={3.2} fill={palette.ice} opacity={k > 0.02 ? 1 : 0} />
      </svg>
    </>
  );
};

export const Panels: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  if (frame < 100 || frame > 178) return null;
  // panels leave as the camera pitches over for the dive
  const exit = ramp(frame, 162, 172, ease.inCubic);
  return (
    <AbsoluteFill style={{ fontFamily: UI_FONT, pointerEvents: "none" }}>
      {PANELS.map((p, idx) => {
        const pod = podAt(...p.pod);
        const top = agentTop(pod);
        const anchor: [number, number, number] = [top[0], top[1] + p.lift, top[2]];
        const a = projectAt(frame, anchor, width, height);
        const g = projectAt(frame, top, width, height);
        const ref = projectAt(120, anchor, width, height);
        const scale = Math.min(1.25, Math.max(0.85, ref.depth / a.depth));
        const s = spring({ frame: frame - p.start, fps, config: { damping: 200, stiffness: 120, mass: 0.9 } });
        const vis = s * (1 - exit);
        if (vis <= 0.001 || !a.visible) return null;
        const blur = interpolate(s, [0, 1], [10, 0]) + exit * 6;
        const leader = Math.max(0, g.y - a.y);
        const body = p.id === "call" ? <CallBody f={frame} t={clamp01(s)} /> : p.id === "ticket" ? <TicketBody f={frame} /> : <CsatBody f={frame} />;
        return (
          <div key={p.id} style={{ position: "absolute", left: a.x, top: a.y, transform: `translate(-50%, -100%) scale(${scale})`, transformOrigin: "50% 100%" }}>
            {/* hairline leader to the agent it belongs to */}
            <div style={{ position: "absolute", left: "50%", top: "100%", width: 1, height: leader * vis, background: `linear-gradient(${ICE}0.55), ${ICE}0))`, opacity: vis }} />
            <div
              style={{
                width: p.width,
                padding: "16px 18px 16px",
                borderRadius: 16,
                background: `linear-gradient(180deg, ${ICE}0.16), ${ICE}0.06))`,
                border: `1px solid ${ICE}0.24)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 18px 40px rgba(0,0,0,0.35)`,
                backdropFilter: "blur(18px) saturate(140%)",
                WebkitBackdropFilter: "blur(18px) saturate(140%)",
                opacity: vis,
                filter: `blur(${blur}px)`,
                transform: `translateY(${interpolate(s, [0, 1], [14, 0]) - exit * 24}px) scale(${interpolate(s, [0, 1], [0.94, 1])})`,
                transformOrigin: "50% 100%",
                color: palette.ice,
                marginBottom: 14,
              }}
            >
              {body}
            </div>
            <span style={{ display: "none" }}>{idx}</span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

export const PANEL_CUES = cues;
