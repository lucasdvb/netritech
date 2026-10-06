import numpy as np, cv2
from PIL import Image
a=np.asarray(Image.open('assets/first-frame.jpg').convert('RGB')).astype(np.float32)
p=np.asarray(Image.open('assets/plate-1k.png').convert('RGB').resize((1920,1080),Image.LANCZOS)).astype(np.float32)
u=np.asarray(Image.open('assets/people-cutout.png'))[...,3].astype(np.float32)/255
d=np.abs(a-p).mean(2)
near=cv2.dilate((u>0.3).astype(np.uint8),np.ones((41,41),np.uint8))>0
add=((d>38)&near).astype(np.uint8)
add=cv2.morphologyEx(add,cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
m=np.maximum(u,add.astype(np.float32))
m=cv2.morphologyEx((m>0.5).astype(np.uint8),cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))
# keep largest components
n,lab,st,_=cv2.connectedComponentsWithStats(m)
keep=np.zeros_like(m)
for i in range(1,n):
    if st[i,4]>3000: keep[lab==i]=1
np.save('prep/matte.npy',keep)
vis=a.copy(); vis[keep==0]*=0.25
img=Image.fromarray(vis.astype('uint8'))
from PIL import ImageDraw
dr=ImageDraw.Draw(img)
for x in range(0,1920,100): dr.line([(x,0),(x,1080)],fill=(255,0,0) if x%500==0 else (120,0,0))
for y in range(0,1080,100): dr.line([(0,y),(1920,y)],fill=(255,0,0) if y%500==0 else (120,0,0))
img.save('/tmp/claude-0/-home-user-netritech/9a4ae440-5215-5f55-9324-420bbe5c93d4/scratchpad/matte_grid.jpg',quality=85)
