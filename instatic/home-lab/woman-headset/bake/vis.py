# Append per-triangle front visibility (uint8) to a VBRN file: VBRN + 'VIS1' + tri bytes.
import numpy as np, struct, sys
src, out = sys.argv[1], sys.argv[2]
b = open(src, 'rb').read(); vc, ic = struct.unpack('<II', b[8:16])
p = np.frombuffer(b[16:16+vc*6], dtype='<i2').reshape(-1, 3) / 32767
t = np.frombuffer(b[16+vc*6:16+vc*6+ic*2], dtype='<u2').reshape(-1, 3).astype(int)
N = 720; CAM = 5.5          # camera distance in mesh units (hero: ~40 world / 7.2)
bary = np.array([[1/3,1/3,1/3],[.7,.15,.15],[.15,.7,.15],[.15,.15,.7],[.45,.45,.1],[.1,.45,.45],[.45,.1,.45]])
vis = np.zeros(len(t))
yaws = [-0.3, -0.15, 0, 0.15, 0.3]
for yaw in yaws:
    c, s = np.cos(yaw), np.sin(yaw)
    q = p @ np.array([[c, 0, -s], [0, 1, 0], [s, 0, c]])      # rotate about y
    # perspective from the camera on +z
    w = CAM / (CAM - q[:, 2]); sx = (q[:, 0] * w * 0.5 + 0.5) * (N - 1); sy = (-q[:, 1] * w * 0.5 + 0.5) * (N - 1)
    depth = q[:, 2]
    zb = np.full((N, N), -1e9)
    for tri in t:
        X, Y, Z = sx[tri], sy[tri], depth[tri]
        x0, x1 = int(max(0, np.floor(X.min()))), int(min(N - 1, np.ceil(X.max())))
        y0, y1 = int(max(0, np.floor(Y.min()))), int(min(N - 1, np.ceil(Y.max())))
        if x1 < x0 or y1 < y0: continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
        d = (Y[1]-Y[2])*(X[0]-X[2]) + (X[2]-X[1])*(Y[0]-Y[2])
        if abs(d) < 1e-12: continue
        l0 = ((Y[1]-Y[2])*(gx-X[2]) + (X[2]-X[1])*(gy-Y[2])) / d
        l1 = ((Y[2]-Y[0])*(gx-X[2]) + (X[0]-X[2])*(gy-Y[2])) / d
        l2 = 1 - l0 - l1
        m = (l0 >= -0.02) & (l1 >= -0.02) & (l2 >= -0.02)
        z = l0*Z[0] + l1*Z[1] + l2*Z[2]
        sub = zb[y0:y1+1, x0:x1+1]; np.maximum(sub, np.where(m, z, -1e9), out=sub)
    # test sample points of every triangle against the buffer
    P = np.einsum('kj,tjd->tkd', bary, np.stack([sx[t], sy[t], depth[t]], -1))
    ix = np.clip(np.round(P[..., 0]).astype(int), 0, N-1); iy = np.clip(np.round(P[..., 1]).astype(int), 0, N-1)
    # neighbourhood max to be robust at edges
    zmax = zb[iy, ix]
    vis += (P[..., 2] >= zmax - 0.02).mean(1)
vis /= len(yaws)
print('visible mean', vis.mean().round(3), 'fully hidden', (vis < 0.05).mean().round(3))
open(out, 'wb').write(b + b'VIS1' + (np.round(vis * 255).astype(np.uint8)).tobytes())
