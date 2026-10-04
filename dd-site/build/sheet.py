import sys,glob,re,collections
from PIL import Image
d,prefix=sys.argv[1],sys.argv[2]; cols=int(sys.argv[3]) if len(sys.argv)>3 else 2
fs=sorted(glob.glob(f'{d}/{prefix}*.jpg'))
if not fs: sys.exit('none')
w0,h0=Image.open(fs[0]).size; sc=720/w0 if w0>600 else 360/w0; tw,th=int(w0*sc),int(h0*sc)
per=cols*(2 if w0>600 else 1); outs=[]
for s in range(0,len(fs),per):
    rows=(min(per,len(fs)-s)+cols-1)//cols
    sh=Image.new('RGB',(tw*cols,th*rows),'white')
    for j,f in enumerate(fs[s:s+per]): sh.paste(Image.open(f).resize((tw,th)),((j%cols)*tw,(j//cols)*th))
    o=f'{d}/sheet-{prefix}-{s//per}.jpg'; sh.save(o,quality=70); outs.append(o)
print('\n'.join(outs))
