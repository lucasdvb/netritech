import numpy as np, cv2, json
from PIL import Image
W,H=1920,1080; F=540/np.tan(np.radians(19))   # vertical fov 38deg
photo=np.asarray(Image.open('assets/first-frame.jpg').convert('RGB'))
wall=np.asarray(Image.open('assets/layer-wall.jpg').convert('RGB'))
names=['woman','bald','young']
masks={k:np.load(f'prep/mask_{k}.npy').astype(np.uint8) for k in names}
def poly(pts):
    m=np.zeros((H,W),np.uint8); cv2.fillPoly(m,[np.array(pts,np.int32)],1); return m
# --- room depth (metres): navy partition, pale back wall, screen ---
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
room=np.full((H,W),5.6,np.float32)
navy=(xx<545)
room[navy]=2.75+ (xx[navy]/545)*0.5          # partition angled slightly away
screen=poly([(1180,105),(1920,95),(1920,745),(1180,720)])>0
room[screen]=5.35
# --- desk plane fitted through hand-picked anchors ---
A=np.array([[1000,1060,1],[1350,905,1],[1600,800,1],[1900,800,1],[700,1080,1]],np.float32)
d=np.array([1.85,2.7,3.55,4.3,1.6],np.float32)
coef,_,_,_=np.linalg.lstsq(A,d,rcond=None)
desk=(coef[0]*xx+coef[1]*yy+coef[2]).clip(1.2,6)
deskmask=np.asarray(Image.open('assets/layer-desk.png'))[...,3]>8
# --- people: base depth per person + body bulge from the distance transform ---
base={'woman':2.0,'bald':2.78,'young':3.5}
people_depth=np.zeros((H,W),np.float32)
for k in names:
    m=masks[k]
    dt=cv2.distanceTransform(m,cv2.DIST_L2,5); dt=dt/(dt.max()+1e-6)
    people_depth[m>0]=(base[k]-0.16*np.sqrt(dt))[m>0]
# encode depth maps as 16-bit PNG (mm) for the browser
def save16(arr,path):
    v=np.clip(arr*1000,0,65535).astype(np.uint16)
    # pack into RGB8: R=hi, G=lo
    rgb=np.dstack([(v>>8).astype(np.uint8),(v&255).astype(np.uint8),np.zeros_like(v,np.uint8)])
    Image.fromarray(rgb).save(path)
roomd=room.copy(); roomd[deskmask]=desk[deskmask]
save16(roomd,'assets/3d/depth-room.png')
for k in names:
    m=masks[k].astype(np.uint8)
    _,lab=cv2.distanceTransformWithLabels(1-m,cv2.DIST_L2,5,labelType=cv2.DIST_LABEL_PIXEL)
    sy,sx=np.nonzero(m==1)
    idx=np.zeros(lab.max()+1,np.int64); zl=lab[m==1]; idx[zl]=np.arange(len(zl))
    near=idx[lab]
    filled=people_depth[sy[near],sx[near]]
    filled=np.where(m>0,people_depth,cv2.GaussianBlur(filled,(0,0),3))
    save16(filled,f'assets/3d/depth-{k}.png')
# per-person RGBA layers
# per-person layers; people further back are extended (inpainted) under the people in front of them,
# so parallax reveals plausible shirt/hair instead of holes
ext={}
order=['woman','bald','young']
for i,k in enumerate(order):
    m=masks[k].astype(np.uint8)
    nearer=np.zeros_like(m)
    for kk in order[:i]: nearer|=masks[kk].astype(np.uint8)
    grow=cv2.dilate(m,np.ones((91,91),np.uint8))
    e=(m|(nearer&grow)).astype(np.uint8)
    fill=(e&(1-m)).astype(np.uint8)
    tex=photo.copy()
    if fill.any():
        tex=cv2.inpaint(photo,(fill*255).astype(np.uint8)|((nearer*255)&(grow*255)).astype(np.uint8),9,cv2.INPAINT_TELEA)
        tex=np.where(m[...,None]>0,photo,tex)
    a=cv2.GaussianBlur(e.astype(np.float32),(0,0),1.0)
    Image.fromarray(np.dstack([tex,(a*255).astype(np.uint8)])).save(f'assets/3d/person-{k}.png')
    ext[k]=e
# --- 3D point clouds (camera space at t=0): X right, Y up, Z toward viewer (negative = in front) ---
def unproject(u,v,dd): return np.stack([(u-960)/F*dd, -(v-540)/F*dd, -dd],1)
gray=cv2.cvtColor(photo,cv2.COLOR_RGB2GRAY)
edges=cv2.Canny(cv2.GaussianBlur(gray,(0,0),1.2),40,110)
rng=np.random.default_rng(3)
out={}
allp=[]
for i,k in enumerate(names):
    m=masks[k]
    ys,xs=np.nonzero(m)
    sel=rng.random(len(xs))<0.30          # ~30% of pixels
    xs2,ys2=xs[sel],ys[sel]
    jx=xs2+rng.random(len(xs2)); jy=ys2+rng.random(len(ys2))
    P=unproject(jx,jy,people_depth[ys2,xs2])
    C=photo[ys2,xs2]/255.0
    E=(cv2.dilate(edges,np.ones((2,2),np.uint8))[ys2,xs2]>0).astype(np.float32)
    rows=np.column_stack([P,C,E,np.full(len(P),i)]).astype(np.float32)
    allp.append(rows)
    print(k,len(rows))
pts=np.concatenate(allp)
pts.tofile('assets/3d/people-points.bin')
# room edge points (for the drained world linework)
re=cv2.Canny(cv2.GaussianBlur(cv2.cvtColor(wall,cv2.COLOR_RGB2GRAY),(0,0),1.6),14,42)
ys,xs=np.nonzero(re); sel=rng.random(len(xs))<0.5; xs,ys=xs[sel],ys[sel]
P=unproject(xs+0.5,ys+0.5,roomd[ys,xs]); np.column_stack([P]).astype(np.float32).tofile('assets/3d/room-edges.bin')
print('room edge pts',len(P))
meta={'F':float(F),'counts':{'people':int(len(pts)),'room':int(len(P))},'stride_people':8,
 'base':base,'mic_woman':unproject(np.array([742.]),np.array([538.]),np.array([1.95]))[0].tolist(),
 'heads':{k:unproject(np.array([u]),np.array([v]),np.array([base[k]-0.1]))[0].tolist() for k,(u,v) in {'woman':(680,250),'bald':(1012,270),'young':(1282,360)}.items()},
 'ears':{k:unproject(np.array([u]),np.array([v]),np.array([base[k]-0.05]))[0].tolist() for k,(u,v) in {'woman':(556,258),'bald':(944,262),'young':(1222,372)}.items()},
 'desk_coef':coef.tolist()}
json.dump(meta,open('assets/3d/meta.json','w'),indent=1)
print(json.dumps(meta['heads']), meta['mic_woman'])
