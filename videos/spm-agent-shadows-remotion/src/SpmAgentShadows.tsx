import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { ColorManagement } from "three";
import { C, FPS, H, LOCK_FROM, W, ease, rgba } from "./theme";
import { lerp, prog, sstep } from "./lib/math";
import { FxCanvas } from "./components/FxCanvas";
import { World, WT } from "./three/World";
import { useWorldAssets } from "./three/useWorldAssets";
import { SD } from "./three/world";
import { drawDust, drawFinale, drawFlares, grainUrl } from "./overlay/overlay";

// Bytes in, bytes out: the relief must reproduce the photo's pixel values exactly.
ColorManagement.enabled = false;

/** Grain, vignette and grade: exactly 0 on frame 0 and on the locked end frames. */
const finishAt = (frame: number) => {
  if (frame === 0 || frame >= LOCK_FROM) return 0;
  const t = frame / FPS;
  return Math.min(ease.soft(prog(t, 0, 0.5)), 1 - ease.soft(prog(t, 7.0, 7.45)));
};

const Finish: React.FC<{ frame: number; drain: number }> = ({ frame, drain }) => {
  const k = finishAt(frame);
  if (k <= 0) return null;
  return (
    <>
      <AbsoluteFill
        data-layer="vignette"
        style={{
          background: `radial-gradient(ellipse 78% 82% at 50% 48%, ${rgba("2,4,8", 0)} 55%, ${rgba("2,4,8", 1)} 140%)`,
          opacity: k * lerp(0.42, 0.62, drain),
        }}
      />
      <AbsoluteFill
        data-layer="grain"
        style={{
          backgroundImage: `url(${grainUrl()})`,
          backgroundSize: "256px 256px",
          backgroundPosition: `${(frame * 97) % 256}px ${(frame * 61) % 256}px`,
          mixBlendMode: "overlay",
          opacity: 0.05 * k,
        }}
      />
    </>
  );
};

export const SpmAgentShadows: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const assets = useWorldAssets();
  const drain = WT.drain(t);
  const finish = finishAt(frame);
  const grid = frame >= LOCK_FROM ? 1 : sstep(prog(t, 7.0, LOCK_FROM / FPS));
  // the headline zone (centre-lower) is kept dark from 4.2 s on
  const headline = sstep(prog(t, 3.9, 4.5)) * (1 - grid);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* mounted only once assets are in: R3F renders on frame changes, not on late state */}
      {assets ? (
      <ThreeCanvas
        width={W}
        height={H}
        linear
        flat
        gl={{ antialias: true, preserveDrawingBuffer: true, alpha: false }}
        camera={{ fov: SD.fov, near: 0.05, far: 250, position: [0, SD.camY, 0] }}
      >
        <World frame={frame} assets={assets} />
      </ThreeCanvas>
      ) : null}
      <FxCanvas
        name="dust"
        draw={(c) => drawDust(c, t, lerp(0.15, 0.7, drain) * sstep(prog(t, 2.4, 3.2)) * (1 - sstep(prog(t, 7.1, 7.5))))}
      />
      <FxCanvas
        name="finale"
        draw={(c) => drawFinale(c, t)}
        halation={[
          { blur: 8, alpha: 0.5 },
          { blur: 30, alpha: 0.35 },
        ]}
      />
      <FxCanvas name="flares" draw={(c) => drawFlares(c, t)} />
      {headline > 0 ? (
        <AbsoluteFill
          data-layer="headline-zone"
          style={{
            background: `radial-gradient(ellipse 48% 34% at 50% 80%, ${rgba("4,7,11", 0.82)} 0%, ${rgba("4,7,11", 0.55)} 45%, ${rgba("4,7,11", 0)} 100%)`,
            opacity: headline,
          }}
        />
      ) : null}
      {finish > 0 ? (
        <>
          <AbsoluteFill data-layer="grade-ink" style={{ background: `rgb(${C.ink})`, mixBlendMode: "soft-light", opacity: 0.14 * finish }} />
          <AbsoluteFill data-layer="grade-teal" style={{ background: `rgb(${C.teal})`, mixBlendMode: "soft-light", opacity: 0.05 * finish }} />
        </>
      ) : null}
      {/* the exact opening photo, crossfading into its 3D relief */}
      {frame === 0 || t < 0.3 ? (
        <Img
          data-layer="opening-photo"
          src={staticFile("first-frame.jpg")}
          style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: frame === 0 ? 1 : 1 - sstep(prog(t, 0, 0.3)) }}
        />
      ) : null}
      {grid > 0 ? (
        <Img data-layer="grid" src={staticFile("last-frame.png")} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: grid }} />
      ) : null}
      <Finish frame={frame} drain={drain} />
    </AbsoluteFill>
  );
};
