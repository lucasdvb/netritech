#!/usr/bin/env python3
"""Labelled 3-column contact sheet: contact.py <out.jpg> <img>... (frame number read from the file name)."""
import re
import sys
from PIL import Image, ImageDraw, ImageFont

out, files = sys.argv[1], sys.argv[2:]
TW, TH, PAD, LAB = 640, 360, 8, 30
cols = 3
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (TW + PAD) + PAD, rows * (TH + LAB + PAD) + PAD), (20, 22, 26))
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
except OSError:
    font = ImageFont.load_default()
d = ImageDraw.Draw(sheet)
for k, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((TW, TH), Image.LANCZOS)
    x = PAD + (k % cols) * (TW + PAD)
    y = PAD + (k // cols) * (TH + LAB + PAD)
    m = re.findall(r"(\d+)", f.split("/")[-1])
    fr = int(m[-1]) if m else k
    d.text((x + 4, y + 5), f"frame {fr}  ({fr / 30:.2f}s)", fill=(220, 236, 242), font=font)
    sheet.paste(im, (x, y + LAB))
sheet.save(out, quality=88)
print(out, sheet.size)
