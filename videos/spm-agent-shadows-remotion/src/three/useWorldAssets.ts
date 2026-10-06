import { useEffect, useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";
import { LinearFilter, NoColorSpace, Texture, TextureLoader } from "three";
import { FONT } from "../theme";

export type WorldAssets = {
  wall: Texture;
  desk: Texture;
  people: Texture[];
  depths: Texture[];
  deskDepth: Texture;
  points: Float32Array;
};

const loader = new TextureLoader();
const tex = (src: string) =>
  loader.loadAsync(staticFile(src)).then((t) => {
    t.colorSpace = NoColorSpace; // bytes in, bytes out: the relief must reproduce the photo
    t.minFilter = LinearFilter;
    t.generateMipmaps = false;
    return t;
  });

let cache: Promise<WorldAssets> | null = null;
function loadAll() {
  if (cache) return cache;
  const font = new FontFace(FONT, `url(${staticFile("bricolage.woff2")}) format("woff2")`, { weight: "200 800" });
  cache = Promise.all([
    tex("wall-pad.jpg"),
    tex("desk-pad.png"),
    Promise.all(["woman", "bald", "young"].map((n) => tex(`3d/person-${n}.png`))),
    Promise.all(["woman", "bald", "young"].map((n) => tex(`3d/depth-${n}.png`))),
    tex("3d/depth-desk.png"),
    fetch(staticFile("3d/points.bin")).then((r) => r.arrayBuffer()),
    font.load().then((f) => {
      document.fonts.add(f);
    }),
  ]).then(([wall, desk, people, depths, deskDepth, buf]) => ({
    wall,
    desk,
    people,
    depths,
    deskDepth,
    points: new Float32Array(buf),
  }));
  return cache;
}

/** Blocks rendering until the relief textures, depth maps, point cloud and UI font are ready. */
export function useWorldAssets() {
  const [handle] = useState(() => delayRender("SPM 3D world assets"));
  const [assets, setAssets] = useState<WorldAssets | null>(null);
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
