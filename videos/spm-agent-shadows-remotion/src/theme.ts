import { Easing } from "remotion";

/** Single source of truth: palette, beats, easing curves, parallax planes. */

export const W = 1920;
export const H = 1080;
export const CX = W / 2;
export const CY = H / 2;
export const FPS = 30;
export const DURATION = 240;

/** RGB triplets for canvas strings, `rgba(${C.neon},a)`. */
export const C = {
  ink: "13,20,31", // #0D141F Ink navy
  ardoise: "27,42,56", // #1B2A38 Bleu Ardoise
  steel: "67,97,122", // #43617A Steel blue
  teal: "34,128,138", // #22808A Teal
  neon: "94,214,222", // neon teal glow
  ice: "220,236,242", // linework, scan, ribbons
  core: "236,252,255", // hottest point of a glow
  perle: "218,221,224", // #DADDE0 Gris Perle
  brume: "249,250,251", // #F9FAFB Blanc brume
} as const;

export const rgba = (c: string, a: number) => `rgba(${c},${Math.max(0, Math.min(1, a)).toFixed(4)})`;

/** Beat boundaries in seconds (storyboard v2). */
export const BEAT = {
  establish: [0, 1.4],
  rise: [1.4, 2.6],
  scan: [2.6, 3.5],
  agents: [3.5, 4.9],
  drain: [4.9, 5.9],
  dive: [5.9, 7.0],
  grid: [7.0, 8.0],
} as const;

/** Frames 228-239 must equal the supplied last frame. */
export const LOCK_FROM = 228;

/** Parallax planes: 0 = infinitely far, 1 = the people/desk plane. */
export const PLANE = {
  wall: 0.5,
  roomLines: 0.5,
  agents: 0.85,
  panels: 0.9,
  people: 1.0,
} as const;

export const ease = {
  /** easeOutExpo-like: entrances, pops. */
  out: Easing.bezier(0.16, 1, 0.3, 1),
  /** cubic out: builds, rises. */
  outCubic: Easing.bezier(0.33, 1, 0.68, 1),
  /** symmetric, for travelling things (ribbon growth). */
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  /** smoothstep-like grade moves. */
  soft: Easing.bezier(0.45, 0, 0.55, 1),
  /** exits only. */
  in: Easing.bezier(0.7, 0, 0.84, 0),
} as const;

export const spring = {
  pop: { damping: 16, stiffness: 170, mass: 0.6 },
  smooth: { damping: 22, stiffness: 90, mass: 1 },
} as const;

export const FONT = "Bricolage";
