import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { cues } from "../theme";
import { ease, ramp } from "../lib/math";

/**
 * DOM finishing layers above the canvas: the headline calm-zone, fine grain, and the
 * hand-off to the site's hairline grid (the exact last-frame PNG shared by the other versions).
 */
export const Grade: React.FC = () => {
  const f = useCurrentFrame();
  // centre-lower stays dark and calm from the drain onwards (where the site headline sits)
  const calm =
    ramp(f, cues.drainStart, cues.drainEnd, ease.inOutSine) * (1 - 0.55 * ramp(f, 176, 196)) * (f < cues.cut ? 1 : 0) +
    (f >= cues.cut ? 1 : 0);
  const grid = ramp(f, cues.gridIn, cues.gridFull, ease.inOutSine);
  const seed = f % 12;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          opacity: calm,
          background: "radial-gradient(ellipse 36% 27% at 50% 76%, rgba(6,10,16,0.62) 0%, rgba(6,10,16,0.34) 55%, rgba(6,10,16,0) 100%)",
        }}
      />
      <AbsoluteFill style={{ opacity: 0.05, mixBlendMode: "overlay" }}>
        <svg width="100%" height="100%">
          <filter id={`g${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#g${seed})`} />
        </svg>
      </AbsoluteFill>
      {grid > 0 && <Img src={staticFile("last-frame.png")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: grid }} />}
    </AbsoluteFill>
  );
};
