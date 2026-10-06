import numpy as np, cv2, json
from PIL import Image
W,H=1920,1080
rng=np.random.default_rng(7)
photo=np.asarray(Image.open('assets/first-frame.jpg').convert('RGB'))
gray=cv2.cvtColor(photo,cv2.COLOR_RGB2GRAY)
plate=np.asarray(Image.open('assets/layer-wall.jpg').convert('L'))
names=['woman','bald','young']
masks={k:np.load(f'prep/mask_{k}.npy').astype(np.uint8) for k in names}
full=np.clip(sum(masks.values()),0,1).astype(np.uint8)
# --- edge images (white linework on transparent) ---
def edge_png(src,mask,lo,hi,out,blur=1.2):
    g=cv2.GaussianBlur(src,(0,0),blur)
    e=cv2.Canny(g,lo,hi)
    if mask is not None: e=e*(mask>0)
    e=cv2.dilate(e,np.ones((2,2),np.uint8))
    a=cv2.GaussianBlur(e.astype(np.float32),(0,0),0.6)
    a=np.clip(a*1.6,0,255).astype(np.uint8)
    rgb=np.zeros((H,W,3),np.uint8); rgb[:]= (226,240,246)
    Image.fromarray(np.dstack([rgb,a])).save(out)
    return e
fm=cv2.dilate(full,np.ones((5,5),np.uint8))
pe=edge_png(gray,fm,40,110,'assets/fx-edges-people.png')
# silhouette outline drawn stronger
outline=np.zeros((H,W),np.uint8)
cs,_=cv2.findContours(full,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
cv2.drawContours(outline,cs,-1,255,2)
rgb=np.zeros((H,W,3),np.uint8); rgb[:]=(226,240,246)
Image.fromarray(np.dstack([rgb,cv2.GaussianBlur(outline,(0,0),0.7)])).save('assets/fx-outline-people.png')
re=edge_png(plate,1-cv2.dilate(full,np.ones((9,9),np.uint8)),14,42,'assets/fx-edges-room.png',blur=1.6)
# --- point cloud on people (clothes, hair, skin): jittered grid weighted by local texture ---
gx=cv2.Sobel(cv2.GaussianBlur(gray,(0,0),1.5),cv2.CV_32F,1,0); gy=cv2.Sobel(cv2.GaussianBlur(gray,(0,0),1.5),cv2.CV_32F,0,1)
mag=np.sqrt(gx*gx+gy*gy); mag=mag/np.percentile(mag[full>0],98)
pts=[]
step=7
for y in range(0,H,step):
    for x in range(0,W,step):
        jx=int(x+rng.integers(0,step)); jy=int(y+rng.integers(0,step))
        if jx>=W or jy>=H or not full[jy,jx]: continue
        w=0.18+0.82*min(1,mag[jy,jx])
        if rng.random()<w:
            who=next(i for i,k in enumerate(names) if masks[k][jy,jx])
            pts.append([jx,jy,who,round(float(gray[jy,jx])/255,2)])
print('people points',len(pts))
# --- agents: per-person silhouette contour + interior cloud + horizontal scan slices ---
agents=[]
for i,k in enumerate(names):
    m=masks[k]
    cs,_=cv2.findContours(m,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    c=max(cs,key=cv2.contourArea)
    c=cv2.approxPolyDP(c,1.5,True)[:,0,:].tolist()
    x,y,w,h=cv2.boundingRect(m)
    # interior: denser where the photo has texture (hair, beard, collar), so each agent is recognisably that person
    ip=[]
    st=5
    for yy in range(y,y+h,st):
        for xx in range(x,x+w,st):
            jx=int(xx+rng.integers(0,st)); jy=int(yy+rng.integers(0,st))
            if jx>=W or jy>=H or not m[jy,jx]: continue
            wgt=0.16+0.84*min(1,mag[jy,jx]*1.2)
            if rng.random()<wgt: ip.append([jx,jy,round(float(min(1,mag[jy,jx])),2)])
    # slices every 12px: segments of the mask on that row
    sl=[]
    for yy in range(y+4,y+h,12):
        row=m[yy,:]
        on=np.flatnonzero(np.diff(np.concatenate([[0],row,[0]])))
        for a,b in zip(on[::2],on[1::2]):
            if b-a>6: sl.append([int(a),int(yy),int(b-1)])
    agents.append({'name':k,'bbox':[x,y,w,h],'contour':c,'points':ip,'slices':sl})
    print(k,'contour',len(c),'points',len(ip),'slices',len(sl))
data={'people_points':pts,'agents':agents,
      'ears':{'woman':[556,258],'bald':[944,262],'young':[1222,372]},'mics':{'woman':[742,538],'bald':[1080,442],'young':[1322,512]},
      'heads':{'woman':[680,250],'bald':[1012,270],'young':[1282,360]}}
open('assets/fx-data.js','w').write('window.SPM_FX='+json.dumps(data,separators=(',',':'))+';')
import os; print('fx-data.js KB',os.path.getsize('assets/fx-data.js')//1024)
