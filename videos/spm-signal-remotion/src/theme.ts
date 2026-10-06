// theme.ts: the single source of truth for palette, timing and easing.
// Never inline a hex colour or a beat frame in a component; read it from here.

export const FPS = 30;
export const DURATION = 240;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/** SPM palette plus the film's two light colours. Values are sRGB hex. */
export const palette = {
  inkNavy: "#0D141F",
  bleuArdoise: "#1B2A38",
  steelBlue: "#43617A",
  teal: "#22808A",
  neonTeal: "#5ED6DE", // rgb(94,214,222)
  ice: "#DCECF2", // rgb(220,236,242)
  grisPerle: "#DADDE0",
  // golden-hour only (opening + crane beats)
  sunWarm: "#FFB066",
  sunPale: "#FFD3A1",
  skyLow: "#FF8E45",
  skyHigh: "#F3C69C",
  warmHaze: "#3A2A22",
} as const;

/** Linear-light RGB triplets for shaders (HDR multipliers are applied in place). */
export const lin = {
  neonTeal: [0.111, 0.672, 0.73] as [number, number, number],
  ice: [0.716, 0.839, 0.888] as [number, number, number],
  teal: [0.016, 0.216, 0.254] as [number, number, number],
  steel: [0.056, 0.119, 0.195] as [number, number, number],
};

/** Story beats in frames (30 fps). */
export const beats = {
  hero: [0, 39],
  crane: [39, 78],
  floor: [78, 120],
  scan: [96, 138],
  drain: [138, 162],
  dive: [162, 201],
  converge: [201, 228],
  grid: [228, 240],
} as const;

/** Key event frames used across components. */
export const cues = {
  ledStart: 6,
  scanStart: 98,
  scanEnd: 140,
  agentLag: 4, // frames between the scan passing a pod and its agent blooming
  drainStart: 136,
  drainEnd: 162,
  threadsIn: 156,
  diveStart: 160,
  cut: 201,
  finaleOut: 224,
  gridIn: 226,
  gridFull: 234,
} as const;
