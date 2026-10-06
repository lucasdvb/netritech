// Per-frame world state shared by every component (pure functions of the frame).
import { cues } from "../theme";
import { cameraAt } from "../components/CameraRig";
import { clamp01, ease, lerp, ramp, window4 } from "./math";

export const worldAt = (f: number) => {
  const warm = 1 - ramp(f, cues.drainStart, cues.drainEnd, ease.inOutSine);
  const cam = cameraAt(f);
  // lens aperture (world units) for the particle bokeh; strong for the product shot and the dive
  const aperture =
    lerp(0.03, 0.0, ramp(f, 46, 90)) + 0.016 * ramp(f, 176, 196, ease.inOutSine) * (f < cues.cut ? 1 : 0);
  // DoF pass strength (postprocessing bokeh scale)
  const dof = (1 - ramp(f, 48, 86)) * 7 + window4(f, 178, 192, 400, 401) * 2.2 * (f < cues.cut ? 1 : 0);
  const office = f < cues.cut ? 1 : 0;
  const finale = f >= cues.cut ? 1 : 0;
  // global fade to the hand-off grid
  const out = ramp(f, cues.finaleOut, cues.gridFull, ease.inOutSine);
  const pixel = 540 / Math.tan(((cam.fov * Math.PI) / 180) / 2);
  return { warm, cam, aperture, dof, office, finale, out, pixel, cool: clamp01(f / 78) };
};
export type World = ReturnType<typeof worldAt>;
