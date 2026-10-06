import { PerspectiveCamera, Vector3 } from "three";
import { H, W } from "../theme";
import { clamp, monotoneCurve, prog, sstep, type Vec } from "../lib/math";
import { DESK, ORIGIN, SD, localToWorld, type V3 } from "./world";

/**
 * One continuous camera, keyframed on position, look-at target and vertical FOV, interpolated
 * with monotone cubics (no overshoot, no wobble):
 *   0.0  the photo camera, exactly
 *   1.4  low lateral track right and slightly in (hero track)
 *   2.6  crane up and back as the scan runs
 *   3.6  high oblique, ~35 deg down, the floor revealed
 *   4.2-5.2 slow orbit while the light drains
 *   6.6  tilted to straight down, dived onto the hero desk
 */
const HERO_C = localToWorld(ORIGIN, [DESK.f - 0.35, 0, DESK.a]);

type Key = { t: number; pos: V3; tgt: V3; fov: number };
const KEYS: Key[] = [
  { t: 0.0, pos: [0, SD.camY, 0], tgt: [0, SD.camY, -3], fov: SD.fov },
  { t: 1.4, pos: [0.62, 1.36, -0.22], tgt: [0.38, 1.22, -3.0], fov: SD.fov },
  { t: 2.6, pos: [2.2, 3.5, 2.3], tgt: [0.6, 0.95, -3.0], fov: 43 },
  { t: 3.6, pos: [4.6, 7.4, 4.8], tgt: [1.5, 0.4, -4.6], fov: 46 },
  { t: 4.2, pos: [6.6, 7.8, 3.0], tgt: [1.9, 0.4, -5.0], fov: 46 },
  { t: 5.2, pos: [7.0, 8.2, -0.6], tgt: [1.4, 0.6, -3.8], fov: 46 },
  { t: 6.6, pos: [HERO_C[0], 3.3, HERO_C[2]], tgt: [HERO_C[0], 0.75, HERO_C[2]], fov: 44 },
  { t: 8.0, pos: [HERO_C[0], 2.9, HERO_C[2]], tgt: [HERO_C[0], 0.75, HERO_C[2]], fov: 44 },
];
const ts = KEYS.map((k) => k.t);
const curve = (pick: (k: Key) => number) => monotoneCurve(ts, KEYS.map(pick));
const P = [0, 1, 2].map((c) => curve((k) => k.pos[c]));
const T = [0, 1, 2].map((c) => curve((k) => k.tgt[c]));
const FOV = curve((k) => k.fov);

export type CamPose = { pos: V3; tgt: V3; up: V3; fov: number };

export function camPoseAt(t: number): CamPose {
  const pos: V3 = [P[0](t), P[1](t), P[2](t)];
  const tgt: V3 = [T[0](t), T[1](t), T[2](t)];
  // as the view pitches toward straight down, "up" hands over from world up to the travel
  // direction, so the top-down frame keeps the floor's far side at the top of the frame
  const f = new Vector3(tgt[0] - pos[0], tgt[1] - pos[1], tgt[2] - pos[2]).normalize();
  const steep = sstep(clamp((-f.y - 0.6) / 0.38));
  const fwd = new Vector3(-0.87, 0, -0.5).normalize(); // screen-up when top-down: the travel direction
  const up = new Vector3(0, 1, 0).multiplyScalar(1 - steep).add(fwd.multiplyScalar(steep)).normalize();
  // lens breathing: the field of view swells a touch as focus racks during the dive
  const breathe = 1.2 * Math.sin(Math.PI * prog(t, 5.2, 6.6));
  return { pos, tgt, up: [up.x, up.y, up.z], fov: FOV(t) + breathe };
}

export function applyPose(cam: PerspectiveCamera, p: CamPose) {
  cam.position.set(...p.pos);
  cam.up.set(...p.up);
  cam.lookAt(p.tgt[0], p.tgt[1], p.tgt[2]);
  if (cam.fov !== p.fov || cam.aspect !== W / H) {
    cam.fov = p.fov;
    cam.aspect = W / H;
    cam.updateProjectionMatrix();
  }
  cam.updateMatrixWorld(true);
}

const probe = new PerspectiveCamera(SD.fov, W / H, 0.05, 200);
/** Screen position of a world point at time t (for 2D overlays such as the flare). */
export function projectAt(t: number, p: V3): Vec & { behind?: boolean } {
  applyPose(probe, camPoseAt(t));
  const v = new Vector3(...p).project(probe);
  return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H];
}

export const HERO_CENTER = HERO_C;
