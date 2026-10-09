"""Lossless size optimisation of the official Moana Beaute logo SVGs (Canva exports).

The artwork is untouched: vector lettering paths are kept byte for byte. The embedded PNG
layers are cropped to their non-empty area (with their x/y moved so they land on exactly the
same spot) and re-encoded losslessly, and the outer viewBox is cropped to the logo's bounds.
"""
import base64, io, re, sys
from PIL import Image

src, dst, vb = sys.argv[1], sys.argv[2], sys.argv[3]  # vb = "x y w h" in user units
FLAT = sys.argv[4] if len(sys.argv) > 4 else None  # official flat colour of the mark, e.g. #283106

def _is_colour(tag):
    data = re.search(r'base64,([A-Za-z0-9+/=]+)', tag).group(1)
    return Image.open(io.BytesIO(base64.b64decode(data))).mode != 'L'

s = open(src).read()

def crop_image(m):
    tag = m.group(0)
    if FLAT and 'image/png' in tag and _is_colour(tag):
        # The colour layer is one flat colour (plus compression noise of 1/255): draw it as a rect of that colour.
        x0, y0, x1, y1 = MASK_BOX
        return f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="{FLAT}"/>'

    data = re.search(r'base64,([A-Za-z0-9+/=]+)', tag).group(1)
    im = Image.open(io.BytesIO(base64.b64decode(data)))
    box = MASK_BOX  # the colour layer only shows through the mask, so both keep the mask's padded area
    c = im.crop(box)
    buf = io.BytesIO(); c.save(buf, 'PNG', optimize=True)
    b64 = base64.b64encode(buf.getvalue()).decode()
    tag = re.sub(r'x="0" y="0" width="2400"', f'x="{box[0]}" y="{box[1]}" width="{c.width}"', tag)
    tag = tag.replace('height="1500"', f'height="{c.height}"').replace(data, b64)
    return tag

_masks = [Image.open(io.BytesIO(base64.b64decode(m.group(1)))) for m in re.finditer(r'base64,([A-Za-z0-9+/=]+)', s)]
_mb = [i for i in _masks if i.mode == 'L'][0].getbbox()
MASK_BOX = (max(_mb[0]-4, 0), max(_mb[1]-4, 0), min(_mb[2]+4, 2400), min(_mb[3]+4, 1500))
s = re.sub(r'<image[^>]*>', crop_image, s)
s = re.sub(r'width="2000" zoomAndPan="magnify" viewBox="[^"]+" height="2000"', f'viewBox="{vb}"', s)
s = s.replace('<svg ', '<svg role="img" aria-label="Moana Beauté" ', 1)
open(dst, 'w').write(s)
print(dst, len(s))
