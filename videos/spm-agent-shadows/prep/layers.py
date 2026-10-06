import numpy as np, cv2, json
from PIL import Image
W,H=1920,1080
photo=np.asarray(Image.open('assets/first-frame.jpg').convert('RGB'))
plate=np.asarray(Image.open('assets/plate-1k.png').convert('RGB').resize((W,H),Image.LANCZOS))
matte=np.load('prep/matte.npy').astype(np.uint8)
# drop the stray wall blob between the two men
def poly(pts): 
    m=np.zeros((H,W),np.uint8); cv2.fillPoly(m,[np.array(pts,np.int32)],1); return m
woman_p=poly([(0,0),(860,0),(860,260),(830,350),(805,440),(795,520),(790,565),(655,560),(645,620),(690,700),(715,800),(730,925),(900,935),(1100,930),(1170,960),(1260,1080),(0,1080)])
bald_p=poly([(860,0),(1150,0),(1185,330),(1185,470),(1060,480),(1040,620),(1040,770),(1060,830),(1250,850),(1350,840),(1380,990),(1100,1000),(640,1000),(640,480),(780,480),(780,330),(860,330)])
persons={}
persons['woman']=matte*woman_p
persons['bald']=matte*bald_p*(1-woman_p)
persons['young']=matte*(1-woman_p)*(1-bald_p)
for k,v in persons.items():
    n,lab,st,_=cv2.connectedComponentsWithStats(v)
    keep=np.zeros_like(v)
    for i in range(1,n):
        if st[i,4]>2500: keep[lab==i]=1
    persons[k]=keep
full=np.clip(sum(persons.values()),0,1).astype(np.uint8)
# base composite: photo outside a slightly dilated matte, plate inside
dil=cv2.dilate(full,np.ones((41,41),np.uint8)).astype(np.float32)
dil=cv2.GaussianBlur(dil,(0,0),6)[...,None]
base=(photo*(1-dil)+plate*dil).astype(np.uint8)
# desk polygon (top surface + three lids), from the plate geometry
desk=poly([(540,1080),(1170,812),(1920,795),(1920,1080)])
for lid in [[(1240,1080),(1480,750),(1520,740),(1335,1080)],[(1395,972),(1610,680),(1658,668),(1450,975)],[(1540,885),(1660,640),(1696,630),(1592,888)]]:
    desk|=poly(lid)
deskf=cv2.GaussianBlur(desk.astype(np.float32),(0,0),1.2)
# wall layer: inpaint the desk area so parallax never reveals a second desk edge
surf=poly([(540,1080),(1170,812),(1920,795),(1920,1080)])
lids=np.clip(desk-surf,0,1).astype(np.uint8)
wall=cv2.inpaint(base,cv2.dilate(lids,np.ones((13,13),np.uint8))*255,15,cv2.INPAINT_TELEA)
ds=cv2.dilate(surf,np.ones((15,15),np.uint8))
src=wall.copy()
for x in range(W):
    col=np.flatnonzero(ds[:,x])
    if len(col)==0: continue
    y0=max(0,col[0]-3)
    wall[y0:,x]=src[y0,x]
blurred=cv2.GaussianBlur(wall,(0,0),9)
wall=np.where(ds[...,None]>0, blurred, wall).astype(np.uint8)
Image.fromarray(wall).save('assets/layer-wall.jpg',quality=94)
Image.fromarray(np.dstack([base,(deskf*255).astype(np.uint8)])).save('assets/layer-desk.png')
alpha=cv2.GaussianBlur(full.astype(np.float32),(0,0),1.1)
Image.fromarray(np.dstack([photo,(alpha*255).astype(np.uint8)])).save('assets/layer-people.png')
for k,v in persons.items(): np.save(f'prep/mask_{k}.npy',v)
# composite check at t=0
comp=wall.astype(np.float32)
comp=comp*(1-deskf[...,None])+base*deskf[...,None]
comp=comp*(1-alpha[...,None])+photo*alpha[...,None]
print('t0 mean abs diff vs photo', np.abs(comp-photo).mean())
Image.fromarray(comp.astype(np.uint8)).resize((960,540)).save('/tmp/claude-0/-home-user-netritech/9a4ae440-5215-5f55-9324-420bbe5c93d4/scratchpad/t0.jpg')
vis=np.zeros((H,W,3),np.uint8); cols={'woman':(255,80,80),'bald':(80,255,80),'young':(80,120,255)}
for k,v in persons.items(): vis[v>0]=cols[k]
Image.fromarray(vis).resize((960,540)).save('/tmp/claude-0/-home-user-netritech/9a4ae440-5215-5f55-9324-420bbe5c93d4/scratchpad/split.jpg')
Image.fromarray(wall).resize((960,540)).save('/tmp/claude-0/-home-user-netritech/9a4ae440-5215-5f55-9324-420bbe5c93d4/scratchpad/wall.jpg')
