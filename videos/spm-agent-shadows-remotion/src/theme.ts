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

/** Beat boundaries in seconds (storyboard v3, 3D lorry structure). */
export const BEAT = {
  heroTrack: [0, 1.4],
  scanCrane: [1.4, 2.6],
  floor: [2.6, 4.2],
  drain: [4.2, 5.2],
  dive: [5.2, 6.6],
  converge: [6.6, 7.6],
  grid: [7.6, 8.0],
} as const;

/** Frames 228-239 must equal the supplied last frame. */
export const LOCK_FROM = 228;

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
