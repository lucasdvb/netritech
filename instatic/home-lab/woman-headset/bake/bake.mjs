// Bake a GLB into the VBRN container used by the hero (int16 positions, uint16 indices).
import fs from 'fs'
import { MeshoptSimplifier as S } from 'meshoptimizer'
const [,, inFile, outDir, ...targets] = process.argv
const b = fs.readFileSync(inFile)
const jl = b.readUInt32LE(12), j = JSON.parse(b.subarray(20, 20 + jl).toString())
const bin = b.subarray(20 + jl + 8)
const acc = i => { const a = j.accessors[i], v = j.bufferViews[a.bufferView], off = (v.byteOffset || 0) + (a.byteOffset || 0)
  const C = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array }[a.componentType], n = a.count * ({ VEC3: 3, SCALAR: 1 }[a.type])
  return new C(bin.buffer.slice(bin.byteOffset + off, bin.byteOffset + off + n * C.BYTES_PER_ELEMENT)) }
const p = j.meshes[0].primitives[0]
const pos = acc(p.attributes.POSITION), idx = Uint32Array.from(acc(p.indices))
await S.ready
// weld duplicate positions first so the simplifier sees one connected surface
const remap = S.generatePositionRemap(pos, 3)
const welded = idx.map(i => remap[i])
// face region (front of the head) gets its own, finer budget: FACE=<tris> env
const bb0 = [1e9, 1e9, 1e9], bb1 = [-1e9, -1e9, -1e9]
for (let k = 0; k < pos.length; k += 3) for (let a = 0; a < 3; a++) { bb0[a] = Math.min(bb0[a], pos[k+a]); bb1[a] = Math.max(bb1[a], pos[k+a]) }
const ctr = bb0.map((m, a) => (m + bb1[a]) / 2), hal = Math.max(...bb1.map((m, a) => (m - bb0[a]) / 2))
const N = q => [(pos[q*3]-ctr[0])/hal, (pos[q*3+1]-ctr[1])/hal, (pos[q*3+2]-ctr[2])/hal]
const faceT = [], restT = []
for (let k = 0; k < welded.length; k += 3) {
  const A = N(welded[k]), B = N(welded[k+1]), C = N(welded[k+2])
  const cx = (A[0]+B[0]+C[0])/3, cy = (A[1]+B[1]+C[1])/3, cz = (A[2]+B[2]+C[2])/3
  const ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2],vx=C[0]-A[0],vy=C[1]-A[1],vz=C[2]-A[2]
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx, nl=Math.hypot(nx,ny,nz)||1
  const isFace = cy > -0.02 && cy < 0.82 && cz > -0.1 && Math.abs(cx) < 0.42 && nz/nl > -0.2
  ;(isFace ? faceT : restT).push(welded[k], welded[k+1], welded[k+2])
}
console.log('face tris (orig)', faceT.length/3, 'rest', restT.length/3)
const FACE = +(process.env.FACE || 0)
for (const t of targets.map(Number)) {
  let out, err
  if (FACE) {
    const [f, e1] = S.simplify(Uint32Array.from(faceT), pos, 3, FACE * 3, 0.02, ['LockBorder'])
    const [r, e2] = S.simplify(Uint32Array.from(restT), pos, 3, (t - FACE) * 3, 0.02, ['LockBorder'])
    out = new Uint32Array(f.length + r.length); out.set(f); out.set(r, f.length); err = Math.max(e1, e2)
  } else [out, err] = S.simplify(welded, pos, 3, t * 3, 0.02, ['Prune'])
  const map = new Map(), ci = new Uint32Array(out.length)
  for (let k = 0; k < out.length; k++) { if (!map.has(out[k])) map.set(out[k], map.size); ci[k] = map.get(out[k]) }
  const vc = map.size, vp = new Float32Array(vc * 3)
  for (const [s, d] of map) vp.set(pos.subarray(s * 3, s * 3 + 3), d * 3)
  // centre on the bounding box, scale so the largest half-extent is 1
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]
  for (let k = 0; k < vc; k++) for (let a = 0; a < 3; a++) { mn[a] = Math.min(mn[a], vp[k*3+a]); mx[a] = Math.max(mx[a], vp[k*3+a]) }
  const c = mn.map((m, a) => (m + mx[a]) / 2), h = Math.max(...mx.map((m, a) => (m - mn[a]) / 2))
  const buf = Buffer.alloc(16 + vc * 6 + ci.length * 2)
  buf.writeUInt32LE(0x4e524256, 0); buf.writeUInt32LE(1, 4); buf.writeUInt32LE(vc, 8); buf.writeUInt32LE(ci.length, 12)
  for (let k = 0; k < vc * 3; k++) buf.writeInt16LE(Math.round((vp[k] - c[k % 3]) / h * 32767), 16 + k * 2)
  if (vc > 65535) throw new Error('too many verts')
  for (let k = 0; k < ci.length; k++) buf.writeUInt16LE(ci[k], 16 + vc * 6 + k * 2)
  fs.writeFileSync(`${outDir}/woman-${t}${FACE?'f'+FACE:''}.vbrn`, buf)
  console.log(t, 'tris', ci.length / 3, 'verts', vc, 'err', err.toFixed(4), 'bytes', buf.length, 'b64', Math.ceil(buf.length / 3) * 4,
    'extent', mx.map((m, a) => ((m - mn[a]) / 2 / h).toFixed(2)).join(','))
}
