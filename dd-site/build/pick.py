import sys
from PIL import Image
out=sys.argv[1]; fs=sys.argv[2:]; cols=2
w0,h0=Image.open(fs[0]).size; sc=720/w0 if w0>600 else 360/w0; tw,th=int(w0*sc),int(h0*sc)
if w0<600: cols=4
rows=(len(fs)+cols-1)//cols
sh=Image.new('RGB',(tw*cols,th*rows),'white')
for j,f in enumerate(fs): sh.paste(Image.open(f).resize((tw,th)),((j%cols)*tw,(j//cols)*th))
sh.save(out,quality=72)
