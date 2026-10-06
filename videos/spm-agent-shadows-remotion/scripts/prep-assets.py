#!/usr/bin/env python3
"""Prepare the Remotion public/ folder from the shared SPM Agent Shadows assets.

Local, deterministic image processing only (Pillow + NumPy). No generation APIs.

- copies the opening and closing frames and the UI font;
- builds padded plates so camera moves never reveal a border:
    wall-pad.jpg : room plate centred on a blurred, stretched copy (PAD px each side);
    desk-pad.png : desk layer with its surface extended right and down (PAD px).
"""
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

HERE = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / "spm-agent-shadows" / "assets"
PUB = HERE / "public"
W, H, PAD = 1920, 1080, 320

PUB.mkdir(exist_ok=True)

for name in ["first-frame.jpg", "last-frame.png", "bricolage.woff2"]:
    shutil.copyfile(SRC / name, PUB / name)

# padded wall: blurred stretch underneath, sharp plate on top, soft seam
wall = Image.open(SRC / "layer-wall.jpg").convert("RGB")
big = wall.resize((W + 2 * PAD, H + 2 * PAD), Image.LANCZOS).filter(ImageFilter.GaussianBlur(26))
yy, xx = np.mgrid[0:H, 0:W]
edge = np.minimum.reduce([xx, W - 1 - xx, yy, H - 1 - yy]).astype(np.float32)
m = np.clip(edge / 24.0, 0, 1)  # 24 px feather into the blurred surround
mask = Image.fromarray((m * 255).astype(np.uint8))
big.paste(wall, (PAD, PAD), mask)
big.save(PUB / "wall-pad.jpg", quality=93)

# padded desk: replicate the right column and the bottom row of the table surface
desk = Image.open(SRC / "layer-desk.png").convert("RGBA")
pad = Image.new("RGBA", (W + PAD, H + PAD), (0, 0, 0, 0))
pad.paste(desk, (0, 0))
col = desk.crop((W - 6, 795, W, H)).resize((PAD + 6, H - 795))
pad.paste(col, (W - 6, 795))
row = desk.crop((540, H - 6, W, H)).resize((W - 540 + PAD, PAD))
pad.paste(row, (540, H - 6))
corner = desk.crop((W - 6, H - 6, W, H)).resize((PAD + 6, PAD + 6))
pad.paste(corner, (W - 6, H - 6))
pad.save(PUB / "desk-pad.png", optimize=True)

print("prepared", sorted(p.name for p in PUB.iterdir()))
