#!/usr/bin/env python3
"""Build the 3D data for the SPM Agent Shadows scene from the team photo.

Local, deterministic processing only (NumPy + OpenCV + Pillow). No generation APIs.

World: metres, floor at y = 0, the photo camera at (0, CAM_Y, 0) looking down -Z with a 40 deg
vertical field of view. A pixel (u, v) at depth d unprojects to
    X = (u - 960) / F * d,   Y = CAM_Y - (v - 540) / F * d,   Z = -d
so every relief vertex lands exactly on its photo pixel from the opening camera.

Outputs (public/3d/):
  person-<name>.png    photo RGB + that person's feathered matte
  depth-<name>.png     person depth, 8-bit, decoded with scene.json depthRange
  depth-desk.png       desk / laptop-lid depth (horizontal plane, lids stood up)
  points.bin           Float32 [x, y, z, r, g, b, person, luma] for the hero point cloud
  scene.json           camera, anchors, agent templates, mic / ear / head positions
"""
import json
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = Path(__file__).resolve().parent.parent
SRC = HERE.parent / "spm-agent-shadows"
ASSETS = SRC / "assets"
PREP = SRC / "prep"
OUT = HERE / "public" / "3d"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1920, 1080
FOV = 40.0
F = (H / 2) / np.tan(np.radians(FOV / 2))
CAM_Y = 1.3
DESK_Y = 0.75
NAMES = ["woman", "bald", "young"]
BASE = {"woman": 2.0, "bald": 2.65, "young": 3.3}
BULGE = 0.22
rng = np.random.default_rng(20261006)

fxjs = (ASSETS / "fx-data.js").read_text()
FXD = json.loads(fxjs[fxjs.index("{") : fxjs.rindex("}") + 1])
photo = np.asarray(Image.open(ASSETS / "first-frame.jpg").convert("RGB"))
people_alpha = np.asarray(Image.open(ASSETS / "layer-people.png"))[..., 3].astype(np.float32) / 255


def unproject(u, v, d):
    u = np.asarray(u, np.float64)
    v = np.asarray(v, np.float64)
    d = np.asarray(d, np.float64)
    return np.stack([(u - W / 2) / F * d, CAM_Y - (v - H / 2) / F * d, -d], -1)


# ---------- people: mattes ----------
masks = {n: np.load(PREP / f"mask_{n}.npy").astype(np.uint8) for n in NAMES}
yy, xx = np.mgrid[0:H, 0:W]
pr, pg, pb = (photo[..., k].astype(int) for k in range(3))
blue = ((pb - pr) > 26) & ((pb - pg) > 8) & (pb > 150) & (pr > 110)  # his light-blue shirt; her white shirt is neutral
white = (np.minimum(np.minimum(pr, pg), pb) > 185) & ((np.maximum(np.maximum(pr, pg), pb) - np.minimum(np.minimum(pr, pg), pb)) < 30)
# the polygon split leaves the bald man's blue shirt inside the woman's matte, and a piece of the
# young man inside the bald man's; hand those pixels back to their owner
w2b = ((masks["woman"] > 0) & (xx > 600) & (yy > 330) & (yy < 760) & blue).astype(np.uint8)
# only blue regions connected to the bald man's own matte
k, lab, _, _ = cv2.connectedComponentsWithStats(w2b)
touch = np.unique(lab[(cv2.dilate(masks["bald"], np.ones((5, 5), np.uint8)) > 0) & (w2b > 0)])
w2b = np.isin(lab, touch[touch > 0])
masks["woman"][w2b] = 0
masks["bald"][w2b] = 1
b2y = (masks["bald"] > 0) & (((xx > 1145) & (yy < 440)) | ((xx > 1060) & (yy > 430) & (yy < 760) & white))
masks["bald"][b2y] = 0
masks["young"][b2y] = 1
for n in NAMES:  # drop crumbs
    k, lab, st, _ = cv2.connectedComponentsWithStats(masks[n])
    keep = np.zeros_like(masks[n])
    for c in range(1, k):
        if st[c, 4] > 1500:
            keep[lab == c] = 1
    masks[n] = keep

# ---------- people: occlusion fill + depth with a body bulge ----------
# Each person behind another is extended under the front person (colours inpainted from their own
# pixels), so the camera's parallax reveals more of them instead of a hole.
FRONT = {"woman": [], "bald": ["woman"], "young": ["woman", "bald"]}
ell = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (201, 201))
depth_maps = {}
person_info = {}
for name in NAMES:
    m = masks[name]
    occl = np.zeros_like(m)
    for f in FRONT[name]:
        occl |= masks[f]
    ext = cv2.dilate(m, ell) & occl
    # only the body continues behind the person in front; above the shoulders it is the wall
    ext[: {"woman": 0, "bald": 360, "young": 440}[name]] = 0
    full = (m | ext).astype(np.uint8)
    # colour of the hidden part: the nearest pixel of this same person, softened
    _, (iy, ix) = ndimage.distance_transform_edt(1 - m, return_indices=True)
    colour = cv2.GaussianBlur(photo[iy, ix], (0, 0), 5)
    dt = cv2.distanceTransform(full, cv2.DIST_L2, 5)
    dtn = np.sqrt(dt / max(dt.max(), 1))
    dtn = cv2.GaussianBlur(dtn.astype(np.float32), (0, 0), 6)
    d = BASE[name] - BULGE * dtn
    depth_maps[name] = d
    soft = cv2.GaussianBlur(cv2.dilate(m, np.ones((3, 3), np.uint8)).astype(np.float32), (0, 0), 1.1)
    # close pin-holes in the matte (headset highlights, scalp) so the wall never shows through
    holes = ndimage.binary_fill_holes(m) & (m == 0)
    hl, hn = ndimage.label(holes)
    sizes = ndimage.sum(holes, hl, range(1, hn + 1))
    small = np.isin(hl, 1 + np.flatnonzero(sizes < 600))
    solid = cv2.erode((m | small).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
    a = np.clip(np.maximum.reduce([people_alpha * soft, ext.astype(np.float32), solid]), 0, 1)
    rgb = np.where(m[..., None] > 0, photo, colour)
    Image.fromarray(np.dstack([rgb, (a * 255).astype(np.uint8)])).save(OUT / f"person-{name}.png", optimize=True)
    lo, hi = BASE[name] - 0.4, BASE[name] + 0.1
    enc = np.clip((d - lo) / (hi - lo), 0, 1)
    Image.fromarray((enc * 255).astype(np.uint8)).save(OUT / f"depth-{name}.png")
    person_info[name] = {"range": [lo, hi], "mask": m, "alpha": np.clip(people_alpha * soft, 0, 1)}

# ---------- desk: horizontal plane, laptop lids stood up at their hinge depth ----------
def poly(pts):
    mm = np.zeros((H, W), np.uint8)
    cv2.fillPoly(mm, [np.array(pts, np.int32)], 1)
    return mm


def plane_depth(v):
    dv = np.maximum((np.asarray(v, np.float64) - H / 2) / F, 1e-3)
    return (CAM_Y - DESK_Y) / dv


vv = np.repeat(np.arange(H)[:, None], W, 1).astype(np.float64)
desk_d = np.clip(plane_depth(vv), 1.0, 7.0)
lids = [
    [(1240, 1080), (1480, 750), (1520, 740), (1335, 1080)],
    [(1395, 972), (1610, 680), (1658, 668), (1450, 975)],
    [(1540, 885), (1660, 640), (1696, 630), (1592, 888)],
]
laptops = []
for lid in lids:
    lm = poly(lid)
    ys, xs = np.nonzero(lm)
    # depth of the hinge (lowest lid pixel) in each column
    for x in np.unique(xs):
        col = ys[xs == x]
        desk_d[col, x] = plane_depth(col.max())
    hinge = max(p[1] for p in lid)
    cx = np.mean([p[0] for p in lid])
    laptops.append(unproject(cx, hinge - 2, plane_depth(hinge - 2)).tolist())
DESK_RANGE = [1.0, 7.0]
Image.fromarray((np.clip((desk_d - 1.0) / 6.0, 0, 1) * 255).astype(np.uint8)).save(OUT / "depth-desk.png")

# ---------- hero point cloud ----------
rows = []
for pi, name in enumerate(NAMES):
    a = person_info[name]["alpha"]
    step = 3
    ys, xs = np.mgrid[0:H:step, 0:W:step]
    ys = (ys + rng.integers(0, step, ys.shape)).clip(0, H - 1)
    xs = (xs + rng.integers(0, step, xs.shape)).clip(0, W - 1)
    keep = (a[ys, xs] > 0.6) & (person_info[name]["mask"][ys, xs] > 0)
    ys, xs = ys[keep], xs[keep]
    # a little depth thickness so the cloud reads as a volume, not a sheet, from above
    d = depth_maps[name][ys, xs] + np.clip(rng.normal(0, 0.055, len(xs)), -0.14, 0.14)
    P = unproject(xs, ys, d)
    col = photo[ys, xs].astype(np.float32) / 255
    luma = col @ np.array([0.299, 0.587, 0.114])
    rows.append(np.column_stack([P, col, np.full(len(xs), pi), luma]))
desk_rgba = np.asarray(Image.open(ASSETS / "layer-desk.png"))
ys, xs = np.mgrid[0:H:5, 0:W:5]
keep = desk_rgba[ys, xs, 3] > 160
ys, xs = ys[keep], xs[keep]
P = unproject(xs, ys, desk_d[ys, xs])
col = photo[ys, xs].astype(np.float32) / 255
rows.append(np.column_stack([P, col, np.full(len(xs), 3), col @ np.array([0.299, 0.587, 0.114])]))
pts = np.concatenate(rows).astype(np.float32)
pts.tofile(OUT / "points.bin")

# ---------- anchors and the hero pod frame ----------
heads3 = {n: unproject(*FXD["heads"][n], BASE[n] - BULGE * 0.6).tolist() for n in NAMES}
mics3 = {n: unproject(*FXD["mics"][n], BASE[n] - 0.3).tolist() for n in NAMES}
ears3 = {n: unproject(*FXD["ears"][n], BASE[n] - 0.1).tolist() for n in NAMES}
lap = np.array(laptops)
axis = lap[2] - lap[0]
axis[1] = 0
axis /= np.linalg.norm(axis)
# the team faces their laptops: the horizontal direction from the woman's head to her laptop
face = lap[0] - np.array(heads3["woman"])
face[1] = 0
face -= axis * face.dot(axis)  # square to the desk
face /= np.linalg.norm(face)
seats = {n: [heads3[n][0], 0.0, heads3[n][2]] for n in NAMES}

# ---------- agent templates (local to the seat: e1 = face, e2 = up, e3 = axis) ----------
CUT = {"woman": 300, "bald": 290, "young": 262}
CUT_FADE = 170


def to_local(P, seat):
    rel = np.asarray(P) - np.asarray(seat)
    return np.stack([rel @ face, rel[..., 1], rel @ axis], -1)


def depth_at(name, x, y):
    x = np.clip(np.asarray(x).astype(int), 0, W - 1)
    y = np.clip(np.asarray(y).astype(int), 0, H - 1)
    return depth_maps[name][y, x]


agents = []
figures = []
for i, name in enumerate(NAMES):
    A = FXD["agents"][i]
    hy = FXD["heads"][name][1]
    p = np.array(A["points"], np.float64)
    lim = hy + CUT[name] + CUT_FADE * rng.random(len(p))
    p = p[p[:, 1] < lim]
    P = unproject(p[:, 0], p[:, 1], depth_at(name, p[:, 0], p[:, 1]) + rng.uniform(-0.12, 0.12, len(p)))
    agent_pts = np.column_stack([to_local(P, seats[name]), p[:, 2]])
    c = np.array(A["contour"], np.float64)
    c3 = to_local(unproject(c[:, 0], c[:, 1], depth_at(name, c[:, 0], c[:, 1]) + 0.02), seats[name])
    cut_y = (CAM_Y - (hy + CUT[name] + 60 - H / 2) / F * BASE[name])
    s = np.array(A["slices"], np.float64)
    s = s[s[:, 1] < hy + CUT[name] + 40]
    s1 = to_local(unproject(s[:, 0], s[:, 1], np.full(len(s), BASE[name] - 0.05)), seats[name])
    s2 = to_local(unproject(s[:, 2], s[:, 1], np.full(len(s), BASE[name] - 0.05)), seats[name])
    agents.append(
        {
            "points": np.round(agent_pts, 4).tolist(),
            "contour": np.round(c3, 4).tolist(),
            "cutY": float(cut_y),
            "slices": np.round(np.concatenate([s1, s2], 1), 4).tolist(),
        }
    )
    # a lighter figure template for the floor: every 4th hero point of this person, local
    hp = pts[pts[:, 6] == i]
    sel = hp[rng.permutation(len(hp))[: max(1500, len(hp) // 5)]]
    figures.append(np.round(np.column_stack([to_local(sel[:, :3], seats[name]), sel[:, 7]]), 4).tolist())

scene = {
    "fov": FOV,
    "camY": CAM_Y,
    "deskY": DESK_Y,
    "focal": float(F),
    "depthRange": {**{n: person_info[n]["range"] for n in NAMES}, "desk": DESK_RANGE},
    "heads": heads3,
    "mics": mics3,
    "ears": ears3,
    "seats": seats,
    "laptops": lap.tolist(),
    "axis": axis.tolist(),
    "face": face.tolist(),
    "agents": agents,
    "figures": figures,
    "points": int(len(pts)),
}
(HERE / "src" / "data" / "scene.json").write_text(json.dumps(scene, separators=(",", ":")))
print("points", len(pts), "axis", axis.round(3), "face", face.round(3))
print("seats", {k: np.round(v, 2).tolist() for k, v in seats.items()})
print("heads", {k: np.round(v, 2).tolist() for k, v in heads3.items()})
print("laptops", lap.round(2).tolist())
print("agent pts", [len(a["points"]) for a in agents], "figure pts", [len(f) for f in figures])
