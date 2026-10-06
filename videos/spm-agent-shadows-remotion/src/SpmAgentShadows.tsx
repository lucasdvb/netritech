import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, H, W, ease, rgba } from "./theme";
import { layerCss, type Layer } from "./lib/camera";
import { useFxAssets, type FxAssets } from "./lib/assets";
import { lerp, prog, sstep } from "./lib/math";
import { sceneAt, type Scene } from "./lib/timeline";
import { FxCanvas } from "./components/FxCanvas";
import { Panels } from "./components/Panels";
import { drawAgents, drawLightWrap } from "./layers/agents";
import { drawRoomLines, drawScan } from "./layers/scan";
import { drawDive, drawDust, drawFlares, drawRibbons } from "./layers/light";

const PAD = 320; // wall-pad.jpg carries PAD px of soft surround on every side

/** A photographic plate placed on a parallax layer. */
const Plate: React.FC<{
  name: string;
  src: string;
  L: Layer;
  offset?: number;
  size?: [number, number];
  opacity?: number;
  filter?: string;
}> = ({ name, src, L, offset = 0, size = [W, H], opacity = 1, filter }) => {
  if (opacity <= 0.001) return null;
  return (
    <Img
      data-layer={name}
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: size[0],
        height: size[1],
        maxWidth: "none",
        transformOrigin: "0 0",
        transform: layerCss(L, offset, offset),
        opacity,
        filter: filter || undefined,
      }}
    />
  );
};

const blurCss = (px: number) => (px > 0.05 ? `blur(${px.toFixed(2)}px)` : "");

/** The people as a dark ink silhouette (keeps occlusion once the daylight has gone). */
const Silhouette: React.FC<{ L: Layer; opacity: number }> = ({ L, opacity }) => {
  if (opacity <= 0.001) return null;
  const mask = `url(${staticFile("layer-people.png")})`;
  return (
    <div
      data-layer="people-silhouette"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: W,
        height: H,
        transformOrigin: "0 0",
        transform: layerCss(L),
        opacity,
        background: `linear-gradient(180deg, rgb(${C.ardoise}) 0%, rgb(9,14,21) 55%)`,
        WebkitMaskImage: mask,
        maskImage: mask,
        WebkitMaskSize: `${W}px ${H}px`,
        maskSize: `${W}px ${H}px`,
      }}
    />
  );
};

/** Daylight drains from the frame edges inward to Ink navy (on the room, under the agents). */
const DrainVeil: React.FC<{ s: Scene }> = ({ s }) => {
  if (s.drain <= 0.001) return null;
  const inner = lerp(115, -10, s.drain);
  return (
    <AbsoluteFill
      data-layer="drain-veil"
      style={{
        background: `radial-gradient(ellipse 70% 75% at 46% 42%, ${rgba(C.ink, 0)} ${inner}%, ${rgba(C.ink, 0.96)} ${inner + 38}%)`,
        opacity: sstep(Math.min(1, s.drain * 1.6)),
      }}
    />
  );
};

/** Colour grade, vignette and film grain. All exactly 0 on frame 0 and on the locked end. */
const Finish: React.FC<{ s: Scene; assets: FxAssets }> = ({ s, assets }) => {
  if (s.finish <= 0) return null;
  const vig = s.finish * lerp(0.42, 0.62, s.drain);
  return (
    <>
      <AbsoluteFill
        data-layer="vignette"
        style={{
          background: `radial-gradient(ellipse 78% 82% at 50% 48%, ${rgba("2,4,8", 0)} 55%, ${rgba("2,4,8", 1)} 140%)`,
          opacity: vig,
        }}
      />
      <AbsoluteFill
        data-layer="grain"
        style={{
          backgroundImage: `url(${assets.grainUrl})`,
          backgroundSize: "256px 256px",
          backgroundPosition: `${(s.frame * 97) % 256}px ${(s.frame * 61) % 256}px`,
          mixBlendMode: "overlay",
          opacity: 0.05 * s.finish,
        }}
      />
    </>
  );
};

const Grade: React.FC<{ s: Scene }> = ({ s }) => {
  if (s.finish <= 0) return null;
  return (
    <>
      {/* deepen shadows toward Ink navy, a whisper of teal in the mids */}
      <AbsoluteFill data-layer="grade-ink" style={{ background: `rgb(${C.ink})`, mixBlendMode: "soft-light", opacity: 0.16 * s.finish }} />
      <AbsoluteFill data-layer="grade-teal" style={{ background: `rgb(${C.teal})`, mixBlendMode: "soft-light", opacity: 0.06 * s.finish }} />
    </>
  );
};

export const SpmAgentShadows: React.FC = () => {
  const frame = useCurrentFrame();
  const assets = useFxAssets();
  const s = sceneAt(frame);
  const { L, lens, dof, drain, diveFade, t } = s;

  // the room falls to near-black ink navy, then to the grid's black
  const bg = 1 - sstep(prog(t, 5.6, 7.4));
  const bgColor = `rgb(${Math.round(13 * bg)},${Math.round(20 * bg)},${Math.round(31 * bg)})`;
  const photoGrade = drain > 0 ? `brightness(${lerp(1, 0.3, drain).toFixed(3)}) saturate(${lerp(1, 0.35, drain).toFixed(3)})` : "";
  const deskGrade = drain > 0 ? `brightness(${lerp(1, 0.1, drain).toFixed(3)}) saturate(${lerp(1, 0.3, drain).toFixed(3)})` : "";
  const identity = lens.tilt === 0 && lens.scale === 1;
  const agentBlur = Math.max(0, (s.cam.z - 1.8) * 1.6);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      <AbsoluteFill
        data-layer="lens"
        style={{
          backgroundColor: bgColor,
          transformOrigin: "50% 50%",
          transform: identity ? "none" : `perspective(2200px) rotateX(${lens.tilt.toFixed(4)}deg) scale(${lens.scale.toFixed(5)})`,
        }}
      >
        <Plate
          name="wall"
          src="wall-pad.jpg"
          L={L.wall}
          offset={-PAD}
          size={[W + 2 * PAD, H + 2 * PAD]}
          opacity={diveFade}
          filter={[blurCss(dof.wall), photoGrade].join(" ").trim()}
        />
        <DrainVeil s={s} />
        {assets ? <FxCanvas name="room-lines" draw={(c) => drawRoomLines(c, s, assets)} /> : null}
        {assets ? (
          <FxCanvas
            name="agents"
            draw={(c) => drawAgents(c, s)}
            halation={[
              { blur: 8, alpha: 0.55 },
              { blur: 32, alpha: 0.4 },
            ]}
            style={{ opacity: s.agentFade, filter: blurCss(agentBlur) || undefined }}
          />
        ) : null}
        <Plate name="desk" src="desk-pad.png" L={L.people} size={[W + PAD, H + PAD]} opacity={diveFade} filter={[blurCss(dof.people), deskGrade].join(" ").trim()} />
        <Plate name="people" src="layer-people.png" L={L.people} opacity={(1 - drain) * diveFade} filter={blurCss(dof.people)} />
        <Silhouette L={L.people} opacity={drain * diveFade} />
        {assets ? <FxCanvas name="light-wrap" draw={(c) => drawLightWrap(c, s, assets)} style={{ opacity: diveFade }} /> : null}
        <Plate name="opening-photo" src="first-frame.jpg" L={L.people} opacity={s.photo} />
        {assets ? (
          <FxCanvas name="scan" draw={(c) => drawScan(c, s, assets)} halation={[{ blur: 10, alpha: 0.35 }]} />
        ) : null}
        {assets ? (
          <FxCanvas name="ribbons" draw={(c) => drawRibbons(c, s)} halation={[{ blur: 6, alpha: 0.6 }, { blur: 22, alpha: 0.35 }]} />
        ) : null}
        <Panels s={s} />
        {assets ? (
          <FxCanvas name="dive" draw={(c) => drawDive(c, s)} halation={[{ blur: 8, alpha: 0.5 }, { blur: 30, alpha: 0.35 }]} />
        ) : null}
        {assets ? <FxCanvas name="dust" draw={(c) => drawDust(c, s)} /> : null}
        {assets ? <FxCanvas name="flares" draw={(c) => drawFlares(c, s)} /> : null}
      </AbsoluteFill>
      <Grade s={s} />
      {s.grid > 0 ? (
        <Img
          data-layer="grid"
          src={staticFile("last-frame.png")}
          style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: s.grid }}
        />
      ) : null}
      {assets ? <Finish s={s} assets={assets} /> : null}
    </AbsoluteFill>
  );
};

/** Ease used by the opening hold, exported for the Studio's sake. */
export const openingEase = ease.soft;
