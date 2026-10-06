import { ease, LOCK_FROM, FPS, PLANE } from "../theme";
import { camAt, layerOf, lensAt, dofAt, type Cam, type Layer } from "./camera";
import { clamp, prog, sstep } from "./math";

/**
 * Every value the layers need for one frame, derived from time alone.
 * Keeping it in one place makes the beat structure readable and keeps layers in sync.
 */
export type Scene = {
  t: number;
  frame: number;
  cam: Cam;
  L: { wall: Layer; agents: Layer; panels: Layer; people: Layer };
  lens: ReturnType<typeof lensAt>;
  dof: ReturnType<typeof dofAt>;
  /** opening photo on top, 1 on frame 0 */
  photo: number;
  /** daylight drain 0..1 (4.9-5.9 s) */
  drain: number;
  /** photo layers survive the start of the dive, then go */
  diveFade: number;
  /** dive progress 0..1 (5.9-7.0 s) */
  dive: number;
  /** everything except the grid fades for the end lock */
  endFade: number;
  /** agent build progress per person */
  q: [number, number, number];
  agentFade: number;
  /** grid (supplied last frame) opacity, exactly 1 from LOCK_FROM */
  grid: number;
  /** grain, vignette and grade: exactly 0 on frame 0 and from LOCK_FROM */
  finish: number;
};

export function sceneAt(frame: number): Scene {
  const t = frame / FPS;
  const cam = camAt(t);
  const drain = sstep(prog(t, 4.9, 5.9));
  const q: [number, number, number] = [0, 1, 2].map((i) =>
    ease.outCubic(prog(t, 3.5 + 0.25 * i, 4.35 + 0.25 * i)),
  ) as [number, number, number];
  const grid = frame >= LOCK_FROM ? 1 : sstep(prog(t, 7.0, LOCK_FROM / FPS));
  const finish =
    frame === 0 || frame >= LOCK_FROM
      ? 0
      : Math.min(ease.soft(prog(t, 0.0, 0.5)), 1 - ease.soft(prog(t, 7.0, 7.45)));
  return {
    t,
    frame,
    cam,
    L: {
      wall: layerOf(cam, PLANE.wall),
      agents: layerOf(cam, PLANE.agents),
      panels: layerOf(cam, PLANE.panels),
      people: layerOf(cam, PLANE.people),
    },
    lens: lensAt(t),
    dof: dofAt(t),
    photo: frame === 0 ? 1 : 1 - sstep(prog(t, 0.05, 0.42)),
    drain,
    diveFade: 1 - sstep(prog(t, 5.95, 6.45)),
    dive: prog(t, 5.9, 7.0),
    endFade: 1 - sstep(prog(t, 7.05, 7.55)),
    q,
    agentFade: 1 - sstep(prog(t, 6.55, 6.95)),
    grid,
    finish: clamp(finish),
  };
}
