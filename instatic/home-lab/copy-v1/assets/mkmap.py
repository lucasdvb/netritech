import math, io, time, urllib.request, sys
from PIL import Image, ImageOps, ImageDraw, ImageFilter
UA = "SPM-site-build/1.0 (l.bransbury@disruptivedodo.mu)"
Z = 16; CW, CH = 600, 315; SCALE = 2
def px(lat, lon, z):
    n = 2 ** z * 256
    x = (lon + 180) / 360 * n
    y = (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2 * n
    return x, y
def tile(z, x, y):
    req = urllib.request.Request(f"https://tile.openstreetmap.org/{z}/{x}/{y}.png", headers={"User-Agent": UA})
    data = urllib.request.urlopen(req, timeout=30).read(); time.sleep(0.15)
    return Image.open(io.BytesIO(data)).convert("RGB")
def build(name, lat, lon):
    cx, cy = px(lat, lon, Z)
    x0, y0 = int(cx - CW / 2), int(cy - CH / 2)
    tx0, ty0, tx1, ty1 = x0 // 256, y0 // 256, (x0 + CW) // 256, (y0 + CH) // 256
    canvas = Image.new("RGB", ((tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256))
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            canvas.paste(tile(Z, tx, ty), ((tx - tx0) * 256, (ty - ty0) * 256))
    ox, oy = x0 - tx0 * 256, y0 - ty0 * 256
    m = canvas.crop((ox, oy, ox + CW, oy + CH)).resize((CW * SCALE, CH * SCALE), Image.LANCZOS)
    g = ImageOps.autocontrast(ImageOps.grayscale(m), cutoff=1)
    # duotone in the site palette: ink-steel for roads/labels, mist for the ground
    m = ImageOps.colorize(g, black="#1b2a38", white="#f1f4f6", mid="#9fb0bf")
    W, H = m.size; c = (W // 2, H // 2)
    # soft teal glow under the pin
    glow = Image.new("RGBA", m.size, (0, 0, 0, 0)); gd = ImageDraw.Draw(glow)
    gd.ellipse((c[0] - 120, c[1] - 120, c[0] + 120, c[1] + 120), fill=(34, 128, 138, 70))
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    m = Image.alpha_composite(m.convert("RGBA"), glow)
    d = ImageDraw.Draw(m)
    # pin: teal ring, white halo, teal core (same language as the site's .ct-pin)
    d.ellipse((c[0] - 42, c[1] - 42, c[0] + 42, c[1] + 42), outline=(34, 128, 138, 235), width=8)
    d.ellipse((c[0] - 20, c[1] - 20, c[0] + 20, c[1] + 20), fill=(255, 255, 255, 255))
    d.ellipse((c[0] - 13, c[1] - 13, c[0] + 13, c[1] + 13), fill=(34, 128, 138, 255))
    m.convert("RGB").save(f"{name}.webp", "WEBP", quality=84, method=6)
    print(name, m.size)
build("spm-carte-port-louis", -20.1678304, 57.5007173)
build("spm-carte-lyon-dardilly", 45.8131728, 4.7608091)
build("spm-carte-aix-rousset", 43.4660316, 5.6104430)
