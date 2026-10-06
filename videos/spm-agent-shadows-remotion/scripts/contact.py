#!/usr/bin/env python3
"""3-column contact sheet with a time label per tile: contact.py out.jpg f000.png f021.png ..."""
import re
import sys
from PIL import Image, ImageDraw, ImageFont

out, files = sys.argv[1], sys.argv[2:]
TW, TH, COLS, GAP = 640, 360, 3, 8
rows = (len(files) + COLS - 1) // COLS
sheet = Image.new("RGB", (COLS * TW + (COLS + 1) * GAP, rows * TH + (rows + 1) * GAP), (13, 20, 31))
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
except OSError:
    font = ImageFont.load_default()
for k, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((TW, TH), Image.LANCZOS)
    x, y = GAP + (k % COLS) * (TW + GAP), GAP + (k // COLS) * (TH + GAP)
    sheet.paste(im, (x, y))
    m = re.search(r"f(\d+)", f.rsplit("/", 1)[-1])
    fr = int(m.group(1)) if m else 0
    label = f"{fr / 30:.2f}s  f{fr:03d}"
    d = ImageDraw.Draw(sheet)
    d.rectangle([x + 8, y + 8, x + 8 + 150, y + 36], fill=(13, 20, 31))
    d.text((x + 14, y + 11), label, fill=(220, 236, 242), font=font)
sheet.save(out, quality=88)
print(out, sheet.size)
