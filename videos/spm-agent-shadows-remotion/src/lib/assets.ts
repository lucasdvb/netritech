import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { C, FONT, H, W } from "../theme";
import { mulberry } from "./math";

/**
 * Images the canvas layers draw from, plus derived canvases prepared once per tab:
 * tinted glow copies of the linework, a rim band of the people matte (for light wrap)
 * and a seeded grain tile.
 */
export type FxAssets = {
  people: HTMLImageElement;
  edgesP: HTMLImageElement;
  outline: HTMLImageElement;
  edgesR: HTMLImageElement;
  edgeGlow: HTMLCanvasElement;
  outlineGlow: HTMLCanvasElement;
  peopleRim: HTMLCanvasElement;
  grainUrl: string;
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load ${src}`));
    img.src = src;
  });

export const makeCanvas = (w = W, h = H) => {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
};

const ctx2d = (c: HTMLCanvasElement) => {
  const g = c.getContext("2d");
  if (!g) throw new Error("2D canvas unavailable");
  return g;
};

function tintedGlow(src: CanvasImageSource, blur: number) {
  const c = makeCanvas();
  const g = ctx2d(c);
  g.filter = `blur(${blur}px)`;
  g.drawImage(src, 0, 0);
  g.filter = "none";
  g.globalCompositeOperation = "source-in";
  g.fillStyle = `rgb(${C.neon})`;
  g.fillRect(0, 0, W, H);
  return c;
}

/** Inner rim of the people matte: alpha high within ~12px of a silhouette edge. */
function rimOf(people: HTMLImageElement) {
  const c = makeCanvas();
  const g = ctx2d(c);
  g.drawImage(people, 0, 0);
  g.globalCompositeOperation = "destination-out";
  g.filter = "blur(10px)";
  g.drawImage(people, 0, 0);
  g.filter = "none";
  return c;
}

function grainTile() {
  const c = makeCanvas(256, 256);
  const g = ctx2d(c);
  const id = g.createImageData(256, 256);
  const r = mulberry(77);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = 128 + (r() - 0.5) * 255;
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  return c.toDataURL("image/png");
}

let cache: Promise<FxAssets> | null = null;

function loadAll(): Promise<FxAssets> {
  if (cache) return cache;
  const font = new FontFace(FONT, `url(${staticFile("bricolage.woff2")}) format("woff2")`, {
    weight: "200 800",
  });
  cache = Promise.all([
    loadImage(staticFile("layer-people.png")),
    loadImage(staticFile("fx-edges-people.png")),
    loadImage(staticFile("fx-outline-people.png")),
    loadImage(staticFile("fx-edges-room.png")),
    font.load().then((f) => {
      document.fonts.add(f);
    }),
  ]).then(([people, edgesP, outline, edgesR]) => ({
    people,
    edgesP,
    outline,
    edgesR,
    edgeGlow: tintedGlow(edgesP, 5),
    outlineGlow: tintedGlow(outline, 9),
    peopleRim: rimOf(people),
    grainUrl: grainTile(),
  }));
  return cache;
}

/** Blocks the render until every FX asset and the UI font are ready. */
export function useFxAssets(): FxAssets | null {
  const [handle] = useState(() => delayRender("SPM FX assets"));
  const [assets, setAssets] = useState<FxAssets | null>(null);
  useEffect(() => {
    loadAll()
      .then((a) => {
        setAssets(a);
        continueRender(handle);
      })
      .catch((e) => cancelRender(e));
  }, [handle]);
  return assets;
}
