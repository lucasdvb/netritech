import {
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  EdgesGeometry,
  Matrix4,
  Vector3,
} from "three";

/** World-space edge segments of a geometry (positions as a flat array). */
export const edgePositions = (geo: BufferGeometry, m: Matrix4, thresholdDeg = 20): number[] => {
  const e = new EdgesGeometry(geo, thresholdDeg);
  e.applyMatrix4(m);
  const arr = Array.from(e.getAttribute("position").array as Float32Array);
  e.dispose();
  return arr;
};

/** Area-weighted deterministic surface samples (world space). */
export const surfaceSamples = (geo: BufferGeometry, m: Matrix4, count: number, r: () => number): number[] => {
  const g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.applyMatrix4(m);
  const p = g.getAttribute("position");
  const tris = p.count / 3;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const areas: number[] = [];
  let total = 0;
  for (let i = 0; i < tris; i++) {
    a.fromBufferAttribute(p, i * 3);
    b.fromBufferAttribute(p, i * 3 + 1);
    c.fromBufferAttribute(p, i * 3 + 2);
    const ar = b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
    total += ar;
    areas.push(total);
  }
  const out: number[] = [];
  for (let k = 0; k < count; k++) {
    const x = r() * total;
    let lo = 0;
    let hi = tris - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (areas[mid] < x) lo = mid + 1;
      else hi = mid;
    }
    a.fromBufferAttribute(p, lo * 3);
    b.fromBufferAttribute(p, lo * 3 + 1);
    c.fromBufferAttribute(p, lo * 3 + 2);
    let u = r();
    let v = r();
    if (u + v > 1) {
      u = 1 - u;
      v = 1 - v;
    }
    out.push(
      a.x + (b.x - a.x) * u + (c.x - a.x) * v,
      a.y + (b.y - a.y) * u + (c.y - a.y) * v,
      a.z + (b.z - a.z) * u + (c.z - a.z) * v,
    );
  }
  g.dispose();
  return out;
};

/**
 * A unit-radius tube whose thickness is shaped in the vertex shader.
 * position = centre-line point, aOff = unit radial offset, aU = 0..1 along the curve, aV = 0..1 around.
 */
export const taperedTube = (pts: Vector3[], tubular = 96, radial = 10): BufferGeometry => {
  const curve = new CatmullRomCurve3(pts, false, "centripetal");
  const frames = curve.computeFrenetFrames(tubular, false);
  const pos: number[] = [];
  const off: number[] = [];
  const uu: number[] = [];
  const vv: number[] = [];
  for (let i = 0; i <= tubular; i++) {
    const u = i / tubular;
    const p = curve.getPointAt(u);
    const n = frames.normals[i];
    const bn = frames.binormals[i];
    for (let j = 0; j <= radial; j++) {
      const v = (j / radial) * Math.PI * 2;
      const s = Math.sin(v);
      const c = -Math.cos(v);
      pos.push(p.x, p.y, p.z);
      off.push(c * n.x + s * bn.x, c * n.y + s * bn.y, c * n.z + s * bn.z);
      uu.push(u);
      vv.push(j / radial);
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = (i + 1) * (radial + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("aOff", new BufferAttribute(new Float32Array(off), 3));
  g.setAttribute("aU", new BufferAttribute(new Float32Array(uu), 1));
  g.setAttribute("aV", new BufferAttribute(new Float32Array(vv), 1));
  g.setIndex(idx);
  return g;
};

/** Merge several tapered tubes into one geometry, tagging each with per-tube attributes. */
export const mergeTubes = (tubes: { g: BufferGeometry; attrs: Record<string, number> }[]): BufferGeometry => {
  let vCount = 0;
  let iCount = 0;
  tubes.forEach((t) => {
    vCount += t.g.getAttribute("position").count;
    iCount += t.g.getIndex()!.count;
  });
  const names = ["position", "aOff", "aU", "aV"];
  const sizes = [3, 3, 1, 1];
  const extra = Object.keys(tubes[0]?.attrs ?? {});
  const out: Record<string, Float32Array> = {};
  names.forEach((n, k) => (out[n] = new Float32Array(vCount * sizes[k])));
  extra.forEach((n) => (out[n] = new Float32Array(vCount)));
  const index = new Uint32Array(iCount);
  let vo = 0;
  let io = 0;
  tubes.forEach((t) => {
    const c = t.g.getAttribute("position").count;
    names.forEach((n, k) => out[n].set(t.g.getAttribute(n).array as Float32Array, vo * sizes[k]));
    extra.forEach((n) => out[n].fill(t.attrs[n], vo, vo + c));
    const src = t.g.getIndex()!.array;
    for (let i = 0; i < src.length; i++) index[io + i] = src[i] + vo;
    vo += c;
    io += src.length;
    t.g.dispose();
  });
  const g = new BufferGeometry();
  names.forEach((n, k) => g.setAttribute(n, new BufferAttribute(out[n], sizes[k])));
  extra.forEach((n) => g.setAttribute(n, new BufferAttribute(out[n], 1)));
  g.setIndex(new BufferAttribute(index, 1));
  return g;
};

/** Build a line-segment geometry with a per-vertex start frame (for scan reveal). */
export const lineGeometry = (positions: number[], starts: number[], extra?: Record<string, number[]>): BufferGeometry => {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  g.setAttribute("aStart", new BufferAttribute(new Float32Array(starts), 1));
  if (extra) Object.entries(extra).forEach(([k, v]) => g.setAttribute(k, new BufferAttribute(new Float32Array(v), 1)));
  return g;
};

export const v3 = (x: number, y: number, z: number) => new Vector3(x, y, z);
