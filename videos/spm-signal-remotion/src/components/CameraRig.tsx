import { useThree } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import { useCurrentFrame } from "remotion";
import { PerspectiveCamera, Vector3 } from "three";
import { cues } from "../theme";
import { CONVERGE, MIC_TIP } from "../lib/layout";
import { Key, clamp01, ease, lerp, ramp, spline } from "../lib/math";

export type CameraPose = {
  pos: [number, number, number];
  target: [number, number, number];
  up: [number, number, number];
  fov: number;
  /** World focus distance for the depth-of-field pass. */
  focus: number;
};

const M = MIC_TIP;

// One continuous move from the hero shot to the top of the dive (velocity-continuous Hermite).
const POS: Key[] = [
  { f: 0, v: [-0.52, 0.83, 0.98] },
  { f: 38, v: [-0.2, 0.835, 0.92] }, // low lateral track
  { f: 56, v: [0.55, 1.55, 2.1] }, // crane begins: rise + pull back past the props
  { f: 78, v: [4.2, 5.4, 7.2] },
  { f: 104, v: [8.4, 9.4, 6.6] }, // high oblique over the floor
  { f: 138, v: [10.0, 10.5, 6.0] },
  { f: cues.diveStart, v: [10.3, 10.7, 5.9] },
  { f: 176, v: [M[0] + 1.1, 5.4, M[2] + 2.3] }, // pitch over and fall
  { f: 191, v: [M[0] + 0.05, 1.55, M[2] + 0.12] },
  { f: 200, v: [M[0], M[1] + 0.2, M[2] + 0.004] },
];
const TGT: Key[] = [
  { f: 0, v: [-0.3, 0.84, 0.06] },
  { f: 38, v: [-0.06, 0.845, 0.04] },
  { f: 56, v: [0.0, 0.9, -1.6] },
  { f: 78, v: [0.9, 0.4, -4.6] },
  { f: 104, v: [2.0, 0.0, -6.4] },
  { f: 138, v: [2.5, 0.0, -7.0] },
  { f: cues.diveStart, v: [2.6, 0.0, -7.2] },
  { f: 176, v: [M[0] + 0.1, M[1], M[2] - 0.3] },
  { f: 191, v: [M[0], M[1], M[2]] },
  { f: 200, v: [M[0], M[1], M[2]] },
];
const FOV: Key[] = [
  { f: 0, v: [28] },
  { f: 38, v: [28] },
  { f: 78, v: [36] },
  { f: 104, v: [44] },
  { f: cues.diveStart, v: [44] },
  { f: 200, v: [52] },
];

/** The camera pose at any frame. Pure: used by the 3D rig and by the DOM panels. */
export const cameraAt = (f: number): CameraPose => {
  if (f >= cues.cut) {
    // Finale: low, frontal, slow push towards the convergence point just above the floor.
    const t = ramp(f, cues.cut, 240, ease.outCubic);
    const z = lerp(5.6, 4.9, t);
    return {
      pos: [0, lerp(0.54, 0.5, t), z],
      target: [0, lerp(-0.02, 0.0, t), 0],
      up: [0, 1, 0],
      fov: 34,
      focus: z,
    };
  }
  const pos = spline(POS, f) as [number, number, number];
  const target = spline(TGT, f) as [number, number, number];
  const fov = spline(FOV, f)[0];
  // As the camera pitches to straight down, screen-up rotates towards -Z (the windows).
  const k = ramp(f, 168, 192, ease.inOutSine);
  const up: [number, number, number] = [0, 1 - k, -k];
  const dx = target[0] - pos[0];
  const dy = target[1] - pos[1];
  const dz = target[2] - pos[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  // focus: on the headset during the hero and crane, the mic during the dive
  const heroFocus = Math.hypot(pos[0] - M[0], pos[1] - M[1], pos[2] - M[2] + 0.13);
  const focus = f < 80 ? heroFocus : f < cues.diveStart ? dist : lerp(dist, Math.hypot(pos[0] - M[0], pos[1] - M[1], pos[2] - M[2]), clamp01((f - cues.diveStart) / 20));
  return { pos, target, up, fov, focus };
};

/** Project a world point to pixel coordinates for a 1920x1080 frame (DOM overlays). */
const projCam = new PerspectiveCamera(30, 1920 / 1080, 0.02, 400);
const tmp = new Vector3();
export const projectAt = (f: number, p: [number, number, number], w = 1920, h = 1080) => {
  const c = cameraAt(f);
  projCam.fov = c.fov;
  projCam.aspect = w / h;
  projCam.updateProjectionMatrix();
  projCam.position.set(...c.pos);
  projCam.up.set(...c.up).normalize();
  projCam.lookAt(...c.target);
  projCam.updateMatrixWorld(true);
  tmp.set(...p);
  const viewZ = tmp.clone().applyMatrix4(projCam.matrixWorldInverse).z;
  tmp.project(projCam);
  return { x: (tmp.x * 0.5 + 0.5) * w, y: (-tmp.y * 0.5 + 0.5) * h, depth: -viewZ, visible: viewZ < 0 };
};

/** Applies the pose to the R3F default camera before Remotion's advance() renders the frame. */
export const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useLayoutEffect(() => {
    const c = cameraAt(frame);
    camera.fov = c.fov;
    camera.near = frame >= 180 && frame < cues.cut ? 0.01 : 0.03;
    camera.far = 260;
    camera.position.set(...c.pos);
    camera.up.set(...c.up).normalize();
    camera.lookAt(...c.target);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
  }, [frame, camera]);
  return null;
};

export const CONVERGE_POINT = CONVERGE;
