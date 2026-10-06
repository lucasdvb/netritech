import raw from "../data/fx-data.json";

/** Geometry extracted from the team photo (image coordinates, 1920x1080). */
export type AgentGeo = {
  name: string;
  /** x, y, w, h */
  bbox: [number, number, number, number];
  contour: [number, number][];
  /** x, y, magnitude 0..1 */
  points: [number, number, number][];
  /** x1, y, x2 */
  slices: [number, number, number][];
};

export type FxData = {
  /** x, y, personIdx, luma */
  people_points: [number, number, number, number][];
  agents: AgentGeo[];
  ears: Record<PersonName, [number, number]>;
  mics: Record<PersonName, [number, number]>;
  heads: Record<PersonName, [number, number]>;
};

export const NAMES = ["woman", "bald", "young"] as const;
export type PersonName = (typeof NAMES)[number];

export const FX = raw as unknown as FxData;
