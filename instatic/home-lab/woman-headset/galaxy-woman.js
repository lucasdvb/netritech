/* ================================================================
   GALAXY slot -> "agent" bust (woman with headset). The point cloud is
   area-sampled from a baked mesh (same VBRN format as the brain), then
   driven by the galaxy's own shader logic: identical assemble-in from a
   scattered cloud, identical break-into-particles exit (uBlow), identical
   cursor repel and colours. Only the resting positions changed.
================================================================ */
/* Area sampling like buildBrainGeometry, but the face gets WOMAN_CONFIG.faceBoost
   times more points so it reads at hero size (points pile up on the silhouette). */
function buildWomanGeometry(buffer,count,radius){
  const mesh=decodeBrainMesh(buffer)
  const verts=mesh.positions, indices=mesh.indices, triCount=indices.length/3, F=WOMAN_CONFIG
  /* per-triangle front visibility baked after the indices ('VIS1' + one byte per triangle) */
  const vOff=16+verts.length*2+indices.length*2+4
  const triVis=buffer.byteLength>=vOff+triCount?new Uint8Array(buffer,vOff,triCount):null
  /* per-vertex signed curvature ('CRV1' + one int8 per vertex): ridges > 0, creases < 0 */
  const cOff=vOff+triCount+4, vCount=verts.length/3
  const crv=buffer.byteLength>=cOff+vCount?new Int8Array(buffer,cOff,vCount):new Int8Array(vCount)
  const cdf=new Float32Array(triCount), nrm=new Float32Array(triCount*3); let total=0,area=0
  for(let t=0;t<triCount;t++){
    const a=indices[t*3]*3,b=indices[t*3+1]*3,c=indices[t*3+2]*3
    const ux=verts[b]-verts[a],uy=verts[b+1]-verts[a+1],uz=verts[b+2]-verts[a+2]
    const vx=verts[c]-verts[a],vy=verts[c+1]-verts[a+1],vz=verts[c+2]-verts[a+2]
    const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,len=Math.hypot(nx,ny,nz)||1
    nrm[t*3]=nx/len; nrm[t*3+1]=ny/len; nrm[t*3+2]=nz/len
    const cx=(verts[a]+verts[b]+verts[c])/3,cy=(verts[a+1]+verts[b+1]+verts[c+1])/3,cz=(verts[a+2]+verts[b+2]+verts[c+2])/3
    const face=smoothstep(F.faceLow,F.faceLow+0.08,cy)*(1-smoothstep(F.faceHigh-0.08,F.faceHigh,cy))
      *smoothstep(-0.05,0.08,cz)*smoothstep(0.1,0.4,nz/len)*(1-smoothstep(0.32,0.42,Math.abs(cx)))
    const ridge=(Math.abs(crv[indices[t*3]])+Math.abs(crv[indices[t*3+1]])+Math.abs(crv[indices[t*3+2]]))/381
    area+=len*0.5; total+=len*0.5*(1+F.faceBoost*face)*(1+F.curvBoost*ridge); cdf[t]=total
  }
  for(let t=0;t<triCount;t++) cdf[t]/=total
  /* smooth (area-weighted) vertex normals so the light follows the face, not the facets */
  const vn=new Float32Array(verts.length)
  for(let t=0;t<triCount;t++){ const ar=(t?cdf[t]-cdf[t-1]:cdf[0]); for(let j=0;j<3;j++){ const i=indices[t*3+j]*3; for(let k=0;k<3;k++) vn[i+k]+=nrm[t*3+k]*ar } }
  for(let i=0;i<vn.length;i+=3){ const l=Math.hypot(vn[i],vn[i+1],vn[i+2])||1; vn[i]/=l; vn[i+1]/=l; vn[i+2]/=l }
  /* evenly spaced points (blue-noise dart throwing, like the orb's even lattice): draw extra
     candidates and keep only those not too close to an accepted one; a spatial hash keeps it fast */
  const positions=new Float32Array(count*3),normals=new Float32Array(count*3),vis=new Float32Array(count),curv=new Float32Array(count)
  const minD=Math.sqrt(area*radius*radius/count)*F.spacing, minD2=minD*minD, inv=1/minD
  const HS=1<<20, head=new Int32Array(HS).fill(-1), nextIdx=new Int32Array(count)
  const hash=(x,y,z)=>(((x*73856093)^(y*19349663)^(z*83492791))>>>0)&(HS-1)
  const cand=Math.round(count*F.oversample), tmpP=[0,0,0], tmpN=[0,0,0]
  let n=0, tries=0
  while(n<count&&tries<cand*2){
    tries++
    const pick=Math.random(); let lo=0,hi=triCount-1
    while(lo<hi){const mid=(lo+hi)>>1; if(cdf[mid]<pick) lo=mid+1; else hi=mid}
    const a=indices[lo*3]*3,b=indices[lo*3+1]*3,c=indices[lo*3+2]*3
    let u=Math.random(),v=Math.random(); if(u+v>1){u=1-u;v=1-v} const w=1-u-v
    for(let k=0;k<3;k++){ tmpP[k]=(w*verts[a+k]+u*verts[b+k]+v*verts[c+k])*radius; tmpN[k]=w*vn[a+k]+u*vn[b+k]+v*vn[c+k] }
    const cx=Math.floor(tmpP[0]*inv),cy=Math.floor(tmpP[1]*inv),cz=Math.floor(tmpP[2]*inv)
    let ok=tries>cand   // after the candidate budget, fill the rest without the spacing test
    if(!ok){
      ok=true
      for(let dx=-1;dx<=1&&ok;dx++) for(let dy=-1;dy<=1&&ok;dy++) for(let dz=-1;dz<=1&&ok;dz++){
        for(let q=head[hash(cx+dx,cy+dy,cz+dz)];q>=0;q=nextIdx[q]){
          const ex=positions[q*3]-tmpP[0],ey=positions[q*3+1]-tmpP[1],ez=positions[q*3+2]-tmpP[2]
          if(ex*ex+ey*ey+ez*ez<minD2){ ok=false; break }
        }
      }
    }
    if(!ok) continue
    positions[n*3]=tmpP[0]; positions[n*3+1]=tmpP[1]; positions[n*3+2]=tmpP[2]
    const nl=Math.hypot(tmpN[0],tmpN[1],tmpN[2])||1; normals[n*3]=tmpN[0]/nl; normals[n*3+1]=tmpN[1]/nl; normals[n*3+2]=tmpN[2]/nl
    vis[n]=triVis?triVis[lo]/255:1
    curv[n]=(w*crv[a/3]+u*crv[b/3]+v*crv[c/3])/127
    const h=hash(cx,cy,cz); nextIdx[n]=head[h]; head[h]=n; n++
  }
  const g=new THREE.BufferGeometry()
  g.setAttribute('position',new THREE.BufferAttribute(positions,3))
  g.setAttribute('aNormal',new THREE.BufferAttribute(normals,3))
  g.setAttribute('aVis',new THREE.BufferAttribute(vis,1))
  g.setAttribute('aCurv',new THREE.BufferAttribute(curv,1))
  return g
}
const Galaxy=(()=>{
  /* brain-like density: about the brain's point count, bigger and softer points */
  const count=Math.round(PARAMS.brainCount*WOMAN_CONFIG.density)
  const bin=Uint8Array.from(atob(WOMAN_MESH_B64),c=>c.charCodeAt(0))
  const geo=buildWomanGeometry(bin.buffer,count,WOMAN_CONFIG.radius)
  const rnd=new Float32Array(count*4); for(let i=0;i<rnd.length;i++) rnd[i]=Math.random()
  geo.setAttribute('aRnd',new THREE.BufferAttribute(rnd,4))
  const R=WOMAN_CONFIG.radius, W0=WOMAN_CONFIG
  const u={
    uTime:{value:0},uAppear:{value:0},uFade:{value:1},uBlow:{value:0},uAssemble:{value:1},
    uColEdge:{value:linVec(GALAXY_CONFIG.colorEdge)},uColCore:{value:linVec(GALAXY_CONFIG.colorCore)},
    uColTop:{value:linVec(ORB_CONFIG.colorTop)},uColBottom:{value:linVec(ORB_CONFIG.colorBottom)},uColRim:{value:linVec(ORB_CONFIG.colorEdge)},
    uSynapse:{value:linVec(BRAIN_CONFIG.colorSynapse)},
    uOpacity:{value:W0.opacity},uOpacityScatter:{value:W0.opacityScatter},uSize:{value:GALAXY_CONFIG.pointSize},uBrightness:{value:GALAXY_CONFIG.brightness},
    uScale:{value:GALAXY_CONFIG.scale},uCursor:{value:new THREE.Vector3()},
    uRepelRadius:{value:W0.pointerRadius},uRepelStrength:{value:W0.pointerStrength},uActivity:{value:0},
    uR:{value:R},uLightDir:{value:new THREE.Vector3(...W0.light).normalize()},uAmbient:{value:W0.ambient},
    uBackDim:{value:W0.backDim},uOcc:{value:W0.occlusion},uDpr:{value:renderer.getPixelRatio()},
    uPx:{value:W0.px},uZRef:{value:W0.zRef},uDeform:{value:W0.deform},uNoise:{value:W0.noiseScale},
    uFlowAmount:{value:W0.flowAmount},uFlowSpeed:{value:W0.flowSpeed},uSynRate:{value:W0.synapseRate},
    uWisp:{value:W0.wisp},uWispDist:{value:W0.wispDist},uWispSpeed:{value:W0.wispSpeed},uBottomFade:{value:W0.bottomFade},
  }
  const mat=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`
      attribute vec3 aNormal;attribute vec4 aRnd;attribute float aVis;attribute float aCurv;
      uniform float uTime;uniform float uSize;uniform float uScale;uniform float uBlow;uniform float uAssemble;
      uniform vec3 uColEdge;uniform vec3 uColCore;uniform vec3 uColTop;uniform vec3 uColBottom;uniform vec3 uColRim;
      uniform vec3 uCursor;uniform float uRepelRadius;uniform float uRepelStrength;uniform float uActivity;
      uniform float uR;uniform vec3 uLightDir;uniform float uAmbient;uniform float uBackDim;uniform float uOcc;uniform float uDpr;
      uniform float uPx;uniform float uZRef;uniform float uDeform;uniform float uNoise;
      uniform float uFlowAmount;uniform float uFlowSpeed;uniform float uSynRate;
      uniform float uWisp;uniform float uWispDist;uniform float uWispSpeed;uniform float uBottomFade;
      uniform float uOpacity;uniform float uOpacityScatter;
      varying float vFade;varying vec3 vColor;varying float vForm;varying float vAlpha;varying float vSpark;varying float vLit;
      ${SNOISE}
      void main(){
        float gRnd1=aRnd.x,gRnd2=aRnd.y,gRnd3=aRnd.z,gRnd4=aRnd.w;
        vec3 q=position/uR;
        vec3 nrm=normalize(aNormal+vec3(1e-5));
        /* the orb's liquid surface: two noise octaves push the points along the normal and
           light the crests; the brain's small loop keeps every point alive */
        float n1=snoise(q*1.6*uNoise+vec3(0.0,uTime*0.18,0.0));
        float n2=snoise(q*3.3*uNoise-vec3(uTime*0.12));
        float disp=n1*0.72+n2*0.28;
        float lit=smoothstep(-0.25,0.5,disp);
        vec3 ref=abs(nrm.y)<0.95?vec3(0.0,1.0,0.0):vec3(1.0,0.0,0.0);
        vec3 tA=normalize(cross(nrm,ref)); vec3 tB=cross(nrm,tA);
        float ph=uTime*uFlowSpeed+gRnd4*6.2831853;
        vec3 rest=position+nrm*disp*uDeform+(tA*cos(ph)+tB*sin(ph))*uFlowAmount;
        float wisp=step(1.0-uWisp,fract(gRnd3*13.7));
        float life=fract(uTime*uWispSpeed+gRnd2);
        rest+=(nrm*0.7+vec3(0.0,1.0,0.0))*life*uWispDist*wisp;
        vec3 galaxyPos=rest;
        /* --- verbatim galaxy assemble / blow --- */
        vec3 blowDir=normalize(vec3(gRnd1,gRnd2,gRnd3)-0.5+0.0001);
        float delay=gRnd4*0.45;
        float at=clamp((1.0-uAssemble-delay)/(1.0-delay),0.0,1.0);
        float aEase=1.0-pow(1.0-at,3.0);
        vec3 spawn=galaxyPos+blowDir*70.0+vec3(0.0,(gRnd3-0.5)*26.0,0.0);
        galaxyPos=mix(spawn,galaxyPos,aEase);
        galaxyPos+=blowDir*uBlow*90.0;
        vec3 finalPos=galaxyPos*uScale;
        vec4 modelPosition=modelMatrix*vec4(finalPos,1.0);
        vec3 toP=modelPosition.xyz-uCursor;
        float cd=length(toP);
        float fall=smoothstep(uRepelRadius,0.0,cd);
        modelPosition.xyz+=normalize(toP+vec3(0.0001))*fall*uRepelStrength*uActivity;
        vec4 mvPosition=viewMatrix*modelPosition;
        float form=aEase*(1.0-uBlow);
        /* formed colour, orb style: bottom blue -> top turquoise, deep blue at the silhouette,
           crests lit; hidden layers and the far side drop away so the front reads crisp */
        vec3 n=normalize(mat3(modelMatrix)*nrm);
        vec3 v=normalize(cameraPosition-modelPosition.xyz);
        float facing=dot(n,v);
        float vt=clamp(q.y*0.55+0.55+(gRnd2-0.5)*0.12,0.0,1.0);
        vec3 col=mix(uColBottom,uColTop,vt);
        col=mix(col,uColRim,smoothstep(0.45,0.95,1.0-abs(facing))*0.7);
        col*=(0.78+0.42*lit)*mix(uAmbient,1.0,max(dot(n,uLightDir),0.0)*0.6+0.4);
        float vis=mix(1.0,aVis,uOcc)*mix(uBackDim,1.0,smoothstep(-0.2,0.2,facing));
        /* brain-style synapse sparkles on a few points */
        float period=mix(3.0,9.0,gRnd3);
        float ft=mod(uTime+gRnd1*period,period);
        float fire=pow(clamp(1.0-ft/0.4,0.0,1.0),2.5)*step(gRnd4,uSynRate);
        /* scattered colour = the galaxy's own mix */
        float galaxyR=pow(gRnd1,2.0)*60.0+pow(gRnd2,3.0)*30.0;
        vec3 scattered=mix(uColEdge,uColCore,smoothstep(80.0,0.0,galaxyR));
        vColor=mix(scattered,col,form);
        vSpark=fire*form; vLit=lit*form;
        float isOrb=step(0.98,fract(gRnd1*77.77))*(1.0-form);
        float starSize=mix(1.0,3.0,isOrb);
        vFade=mix(0.7,1.0,isOrb);
        vFade*=mix(1.0,(1.0-life)*smoothstep(0.0,0.12,life),wisp*form);
        vFade*=mix(1.0,smoothstep(-1.0,-1.0+uBottomFade,q.y)*vis*(0.38+0.72*lit),form);
        vForm=form; vAlpha=mix(uOpacityScatter,uOpacity,form);
        /* size: the galaxy's formula while scattered; true device pixels while formed (crisp on retina) */
        float galaxySize=uSize*starSize*(10.0/-mvPosition.z);
        float formedSize=uPx*uDpr*(uZRef/-mvPosition.z)*(1.0+fire*0.9);
        gl_PointSize=max(mix(galaxySize,formedSize,form),1.5);
        gl_Position=projectionMatrix*mvPosition;
      }`,
    fragmentShader:`
      uniform float uBrightness;uniform float uAppear;uniform float uFade;uniform vec3 uSynapse;
      varying float vFade;varying vec3 vColor;varying float vForm;varying float vAlpha;varying float vSpark;varying float vLit;
      void main(){
        vec2 xy=gl_PointCoord-0.5;
        float ll=length(xy);
        if(ll>0.5) discard;
        /* orb sprite while formed: soft halo + tight bright core; galaxy sprite while scattered */
        float soft=smoothstep(0.5,0.0,ll); soft=soft*soft*1.2;
        float core=smoothstep(0.13,0.0,ll);
        float a=mix(smoothstep(0.5,0.1,ll),soft+core*0.35,vForm);
        vec3 col=vColor+core*vForm*(vec3(0.45)*smoothstep(0.5,1.0,vLit)+vec3(0.12));
        col+=uSynapse*vSpark*2.0*(soft+core);
        gl_FragColor=vec4(col*uBrightness,vFade*a*vAlpha*uAppear*uFade*(1.0+vSpark));
      }`})
  const group=new THREE.Group()
  const points=new THREE.Points(geo,mat); points.frustumCulled=false
  group.add(points); scene.add(group)
  const cursor=new THREE.Vector3(),cursorTarget=new THREE.Vector3(),ndc=new THREE.Vector3(),rayDir=new THREE.Vector3()
  const loc=new THREE.Vector3(),qInv=new THREE.Quaternion()
  const S=GALAXY_CONFIG.scale, W=WOMAN_CONFIG
  /* her front silhouette as a soft 32x32 mask (built from her own points),
     so the galaxy-style push only switches on while the cursor is over her */
  const MASK=32, mask=new Float32Array(MASK*MASK)
  {
    const pa=geo.attributes.position.array
    for(let i=0;i<pa.length;i+=3){
      const gx=Math.floor((pa[i]/R*0.5+0.5)*MASK), gy=Math.floor((pa[i+1]/R*0.5+0.5)*MASK)
      if(gx>=0&&gx<MASK&&gy>=0&&gy<MASK) mask[gy*MASK+gx]=1
    }
    const src=mask.slice()
    for(let y=0;y<MASK;y++) for(let x=0;x<MASK;x++){
      let sum=0,n=0
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++){ const xx=x+dx,yy=y+dy; if(xx>=0&&xx<MASK&&yy>=0&&yy<MASK){ sum+=src[yy*MASK+xx]; n++ } }
      mask[y*MASK+x]=sum/n
    }
  }
  const maskAt=(x,y)=>(x<0||y<0||x>=MASK||y>=MASK)?0:mask[y*MASK+x]
  const hoverAt=(nx,ny)=>{
    const fx=(nx*0.5+0.5)*MASK-0.5, fy=(ny*0.5+0.5)*MASK-0.5, x0=Math.floor(fx), y0=Math.floor(fy), tx=fx-x0, ty=fy-y0
    return lerp(lerp(maskAt(x0,y0),maskAt(x0+1,y0),tx),lerp(maskAt(x0,y0+1),maskAt(x0+1,y0+1),tx),ty)
  }
  /* critically damped springs: the follow eases in and settles with a little weight */
  const spring=(st,target,dt)=>{ const k=W.springK,c=2*Math.sqrt(k); st[1]+=((target-st[0])*k-st[1]*c)*dt; st[0]+=st[1]*dt; return st[0] }
  const sRY=[0,0],sRX=[W.tilt,0],sX=[0,0],sY=[0,0]
  let hover=0
  return{ render(t,delta){
    const state=timeline.getState()
    const appear=galaxyAppear(state),blow=galaxyBlow(state),assemble=galaxyAssemble(state)
    u.uTime.value=t; u.uAppear.value=appear; u.uBlow.value=blow; u.uFade.value=1-blow; u.uAssemble.value=assemble
    const live=PARAMS.pointerReaction&&pointerHas
    /* not hovering: she moves slightly with the cursor (turn, lift, drift); hovering: she calms
       down and the particles under the cursor part, exactly like the galaxy */
    const follow=live?1-W.hoverCalm*hover:0
    const dt=Math.min(delta,0.05)
    const ry=spring(sRY,Math.sin(t*W.turnSpeed)*W.turn*(live?0.5:1)+pointer.x*W.followYaw*follow,dt)
    const rx=spring(sRX,W.tilt-pointer.y*W.followPitch*follow,dt)
    const px=spring(sX,pointer.x*W.followShift*follow,dt)
    const py=spring(sY,pointer.y*W.followShift*0.6*follow,dt)
    group.rotation.set(rx,ry,0)
    /* rest a little low between title and paragraph; drift the face to centre as she breaks apart */
    group.position.set(px,lerp(W.restY,-W.faceY*R*S,smoothstep(0,0.7,blow))+py,0)
    /* cursor on the plane through her front surface (the galaxy used z=0, its disc plane) */
    const planeZ=W.cursorPlaneZ*R*S
    cursorTarget.set(0,0,planeZ)
    if(PARAMS.pointerReaction){
      ndc.set(pointer.x,pointer.y,0.5).unproject(camera)
      rayDir.copy(ndc).sub(camera.position).normalize()
      if(Math.abs(rayDir.z)>1e-4){const tt=(planeZ-camera.position.z)/rayDir.z; if(tt>0&&Number.isFinite(tt)) cursorTarget.copy(camera.position).addScaledVector(rayDir,tt)}
    }
    cursor.lerp(cursorTarget,0.12); u.uCursor.value.copy(cursor)
    loc.copy(cursorTarget).sub(group.position).applyQuaternion(qInv.copy(group.quaternion).invert()).divideScalar(R*S)
    const over=live&&blow<0.02?smoothstep(0.3,0.7,hoverAt(loc.x,loc.y)):0
    hover+=(over-hover)*Math.min(1,delta*5); u.uActivity.value=hover
    group.visible=(appear>0.001||assemble<0.999)&&blow<0.999
  }}
})()
