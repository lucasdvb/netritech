# Append per-vertex signed curvature (int8) after VIS: ... 'CRV1' + vc bytes (+ pad).
import numpy as np, struct, sys
src, out = sys.argv[1], sys.argv[2]
b = open(src, 'rb').read(); vc, ic = struct.unpack('<II', b[8:16])
p = np.frombuffer(b[16:16+vc*6], dtype='<i2').reshape(-1, 3) / 32767
t = np.frombuffer(b[16+vc*6:16+vc*6+ic*2], dtype='<u2').reshape(-1, 3).astype(int)
fn = np.cross(p[t[:, 1]] - p[t[:, 0]], p[t[:, 2]] - p[t[:, 0]])
vn = np.zeros_like(p); [np.add.at(vn, t[:, j], fn) for j in range(3)]
vn /= np.linalg.norm(vn, axis=1, keepdims=True) + 1e-12
# uniform Laplacian over edges
e = np.concatenate([t[:, [0, 1]], t[:, [1, 2]], t[:, [2, 0]]]); e = np.unique(np.sort(e, 1), axis=0)
acc = np.zeros_like(p); deg = np.zeros(vc)
for a, c in ((0, 1), (1, 0)):
    np.add.at(acc, e[:, a], p[e[:, c]]); np.add.at(deg, e[:, a], 1)
L = acc / np.maximum(deg, 1)[:, None] - p
el = np.linalg.norm(p[e[:, 0]] - p[e[:, 1]], axis=1); ml = np.zeros(vc); np.add.at(ml, e[:, 0], el); np.add.at(ml, e[:, 1], el)
ml /= np.maximum(deg, 1)
k = -(L * vn).sum(1) / (ml + 1e-9)          # >0 convex ridge, <0 concave crease
for _ in range(1):                           # one smoothing pass
    s = np.zeros(vc); np.add.at(s, e[:, 0], k[e[:, 1]]); np.add.at(s, e[:, 1], k[e[:, 0]]); k = 0.5 * k + 0.5 * s / np.maximum(deg, 1)
sc = np.percentile(np.abs(k), 95); q = np.clip(np.round(k / sc * 127), -127, 127).astype(np.int8)
print('curv p5/p50/p95', np.percentile(k / sc, [5, 50, 95]).round(2))
blob = b + b'CRV1' + q.tobytes()
blob += b'\0' * ((-len(blob)) % 4)
open(out, 'wb').write(blob)
