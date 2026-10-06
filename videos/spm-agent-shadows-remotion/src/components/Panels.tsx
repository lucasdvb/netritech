import React from "react";
import { spring as springAt, interpolate } from "remotion";
import { C, FONT, FPS, ease, rgba, spring } from "../theme";
import { clamp, prog, sstep } from "../lib/math";
import type { Scene } from "../lib/timeline";
import { PANELS, panelRect, type PanelSpec } from "../layers/panels-data";

const label: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: "0.14em",
  color: rgba(C.ice, 0.62),
  lineHeight: 1,
};
const big: React.CSSProperties = {
  fontFamily: FONT,
  fontWeight: 500,
  fontSize: 30,
  letterSpacing: "-0.01em",
  color: rgba(C.brume, 0.95),
  fontVariantNumeric: "tabular-nums",
  lineHeight: 1,
};

/** Live call: pulse, timer, voice waveform filling in as the agent listens. */
const CallBody: React.FC<{ t: number; p: PanelSpec }> = ({ t, p }) => {
  const pulse = 0.5 + 0.5 * Math.sin(t * 7);
  const secs = 134 + Math.floor(t - p.t0);
  const fill = 30 * clamp((t - p.t0) / 0.6);
  return (
    <>
      <div style={{ position: "absolute", left: 22, top: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            background: rgba(C.neon, 0.6 + 0.4 * pulse),
            boxShadow: `0 0 ${6 + 8 * pulse}px ${rgba(C.neon, 0.8)}`,
          }}
        />
        <div style={label}>LIVE CALL</div>
      </div>
      <div style={{ ...big, position: "absolute", left: 22, top: 46 }}>
        {`0${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`}
      </div>
      {Array.from({ length: 30 }, (_, b) => {
        const amp = 0.25 + 0.75 * Math.abs(Math.sin(b * 0.9 + t * 9) * Math.sin(b * 0.37 + t * 3.1));
        const bh = 6 + 34 * amp;
        return (
          <div
            key={b}
            style={{
              position: "absolute",
              left: 24 + b * 9.4,
              top: 122 - bh / 2,
              width: 4,
              height: bh,
              borderRadius: 2,
              background: b < fill ? rgba(C.neon, 0.88) : rgba(C.steel, 0.6),
            }}
          />
        );
      })}
    </>
  );
};

/** Ticket: IN PROGRESS resolves to RESOLVED with a drawn check. */
const TicketBody: React.FC<{ t: number; p: PanelSpec }> = ({ t, p }) => {
  const done = prog(t, p.t0 + 0.5, p.t0 + 0.75);
  const resolved = done > 0.5;
  const check = ease.out(clamp((done - 0.5) * 2));
  return (
    <>
      <div style={{ ...label, position: "absolute", left: 22, top: 20 }}>TICKET&nbsp;&nbsp;#48217</div>
      {[250, 210, 160].map((w, r) => (
        <div
          key={r}
          style={{ position: "absolute", left: 22, top: 52 + r * 20, width: w, height: 7, borderRadius: 4, background: rgba(C.steel, 0.75) }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 22,
          top: 120,
          width: 132,
          height: 30,
          borderRadius: 15,
          background: done > 0 ? rgba(C.teal, 0.35 + 0.55 * done) : rgba(C.steel, 0.5),
          boxShadow: resolved ? `0 0 18px ${rgba(C.neon, 0.35 * check)}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {resolved ? (
          <svg width={14} height={12} viewBox="0 0 14 12" style={{ marginLeft: -6 }}>
            <path
              d="M1 6.5 L5 10.5 L13 1.5"
              fill="none"
              stroke={rgba(C.brume, 0.95)}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - check}
            />
          </svg>
        ) : null}
        <div style={{ ...label, color: rgba(C.brume, 0.95), letterSpacing: "0.1em" }}>{resolved ? "RESOLVED" : "IN PROGRESS"}</div>
      </div>
    </>
  );
};

/** CSAT: bars rise as the score counts from 4.1 to 4.9. */
const CsatBody: React.FC<{ t: number; p: PanelSpec }> = ({ t, p }) => {
  const g = ease.outCubic(prog(t, p.t0 + 0.15, p.t0 + 0.9));
  const hs = [0.42, 0.55, 0.5, 0.68, 0.74, 0.86, 0.97];
  return (
    <>
      <div style={{ ...label, position: "absolute", left: 22, top: 20 }}>CSAT · THIS WEEK</div>
      <div style={{ ...big, position: "absolute", left: 22, top: 42 }}>{(4.1 + 0.8 * g).toFixed(1)}</div>
      <div style={{ ...label, position: "absolute", left: 92, top: 56, color: rgba(C.neon, 0.92), opacity: sstep(g) }}>▲ 18%</div>
      {hs.map((hv, b) => {
        const bh = 92 * hv * clamp(g * 1.4 - b * 0.06);
        const last = b === hs.length - 1;
        return (
          <div
            key={b}
            style={{
              position: "absolute",
              left: 24 + b * 40,
              top: 182 - bh,
              width: 26,
              height: bh,
              borderRadius: "3px 3px 0 0",
              background: last ? rgba(C.neon, 0.95) : rgba(C.steel, 0.85),
              boxShadow: last ? `0 0 16px ${rgba(C.neon, 0.45)}` : "none",
            }}
          />
        );
      })}
    </>
  );
};

/**
 * Frosted-glass panels: the agents' work. They pop in with a spring (scale + rise + fade),
 * staggered, live on their own parallax plane, and sweep outward past the lens in the dive.
 */
export const Panels: React.FC<{ s: Scene }> = ({ s }) => {
  const { t, frame } = s;
  const exit = 1 - sstep(prog(t, 6.15, 6.55));
  if (exit <= 0.001) return null;
  return (
    <>
      {PANELS.map((p, i) => {
        const local = frame - p.t0 * FPS;
        if (local < 0) return null;
        const pop = springAt({ frame: local, fps: FPS, config: spring.pop });
        const R = panelRect(s, i);
        const blur = interpolate(t, [6.0, 6.5], [0, 10], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease.in });
        const Body = p.kind === "call" ? CallBody : p.kind === "ticket" ? TicketBody : CsatBody;
        return (
          <div
            key={p.kind}
            data-panel={p.kind}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: p.w,
              height: p.h,
              transformOrigin: "0 0",
              translate: `${R.x.toFixed(2)}px ${(R.y + (1 - pop) * 18).toFixed(2)}px`,
              scale: (R.k * interpolate(pop, [0, 1], [0.92, 1])).toFixed(5),
              opacity: clamp(pop) * exit,
              filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined,
              borderRadius: 14,
              overflow: "hidden",
              background: `linear-gradient(135deg, ${rgba(C.ice, 0.1)}, ${rgba(C.teal, 0.06)}), ${rgba(C.ink, 0.62)}`,
              backdropFilter: "blur(14px) saturate(130%)",
              border: `1px solid ${rgba(C.neon, 0.5)}`,
              boxShadow: `0 0 28px ${rgba(C.neon, 0.16)}, inset 0 1px 0 ${rgba(C.brume, 0.14)}`,
            }}
          >
            {/* glass sheen */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(180deg, ${rgba(C.brume, 0.08)} 0%, transparent 38%)`,
              }}
            />
            <Body t={t} p={p} />
          </div>
        );
      })}
    </>
  );
};
