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
  const cdf=new Float32Array(triCount), nrm=new Float32Array(triCount*3); let total=0
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
    total+=len*0.5*(1+F.faceBoost*face)*(1+F.curvBoost*ridge); cdf[t]=total
  }
  for(let t=0;t<triCount;t++) cdf[t]/=total
  /* smooth (area-weighted) vertex normals so the light follows the face, not the facets */
  const vn=new Float32Array(verts.length)
  for(let t=0;t<triCount;t++){ const ar=(t?cdf[t]-cdf[t-1]:cdf[0]); for(let j=0;j<3;j++){ const i=indices[t*3+j]*3; for(let k=0;k<3;k++) vn[i+k]+=nrm[t*3+k]*ar } }
  for(let i=0;i<vn.length;i+=3){ const l=Math.hypot(vn[i],vn[i+1],vn[i+2])||1; vn[i]/=l; vn[i+1]/=l; vn[i+2]/=l }
  const positions=new Float32Array(count*3),normals=new Float32Array(count*3),vis=new Float32Array(count),curv=new Float32Array(count)
  for(let s=0;s<count;s++){
    const pick=Math.random(); let lo=0,hi=triCount-1
    while(lo<hi){const mid=(lo+hi)>>1; if(cdf[mid]<pick) lo=mid+1; else hi=mid}
    const a=indices[lo*3]*3,b=indices[lo*3+1]*3,c=indices[lo*3+2]*3
    let u=Math.random(),v=Math.random(); if(u+v>1){u=1-u;v=1-v} const w=1-u-v
    for(let k=0;k<3;k++){ positions[s*3+k]=(w*verts[a+k]+u*verts[b+k]+v*verts[c+k])*radius; normals[s*3+k]=w*vn[a+k]+u*vn[b+k]+v*vn[c+k] }
    const nl=Math.hypot(normals[s*3],normals[s*3+1],normals[s*3+2])||1; normals[s*3]/=nl; normals[s*3+1]/=nl; normals[s*3+2]/=nl
    vis[s]=triVis?triVis[lo]/255:1
    curv[s]=(w*crv[a/3]+u*crv[b/3]+v*crv[c/3])/127
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
    uOpacity:{value:W0.opacity},uOpacityScatter:{value:W0.opacityScatter},uSize:{value:GALAXY_CONFIG.pointSize},uBrightness:{value:GALAXY_CONFIG.brightness},
    uScale:{value:GALAXY_CONFIG.scale},uCursor:{value:new THREE.Vector3()},
    uRepelRadius:{value:W0.pointerRadius},uRepelStrength:{value:W0.pointerStrength},uActivity:{value:0},
    uR:{value:R},uLightDir:{value:new THREE.Vector3(...W0.light).normalize()},uAmbient:{value:W0.ambient},
    uRim:{value:W0.rim},uFront:{value:W0.front},uGraze:{value:W0.graze},uStar:{value:W0.star},uOcc:{value:W0.occlusion},
    uCurv:{value:W0.curvShade},uDpr:{value:renderer.getPixelRatio()},uBackDim:{value:W0.backDim},uBreath:{value:W0.breath},
    uFormSize:{value:W0.formSize},uFlowAmount:{value:W0.flowAmount},uFlowSpeed:{value:W0.flowSpeed},
    uWaveAmp:{value:W0.waveAmp},uWaveFreq:{value:W0.waveFreq},uWaveSpeed:{value:W0.waveSpeed},
    uWisp:{value:W0.wisp},uWispDist:{value:W0.wispDist},uWispSpeed:{value:W0.wispSpeed},uBottomFade:{value:W0.bottomFade},
  }
  const mat=new THREE.ShaderMaterial({uniforms:u,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:`
      attribute vec3 aNormal;attribute vec4 aRnd;attribute float aVis;attribute float aCurv;
      uniform float uTime;uniform float uSize;uniform float uScale;uniform float uBlow;uniform float uAssemble;
      uniform vec3 uColEdge;uniform vec3 uColCore;uniform vec3 uCursor;uniform float uRepelRadius;uniform float uRepelStrength;uniform float uActivity;
      uniform float uR;uniform vec3 uLightDir;uniform float uAmbient;uniform float uRim;uniform float uBackDim;uniform float uBreath;uniform float uFront;
      uniform float uGraze;uniform float uStar;uniform float uOcc;uniform float uCurv;uniform float uDpr;uniform float uFormSize;
      uniform float uFlowAmount;uniform float uFlowSpeed;uniform float uWaveAmp;uniform float uWaveFreq;uniform float uWaveSpeed;
      uniform float uWisp;uniform float uWispDist;uniform float uWispSpeed;uniform float uBottomFade;
      uniform float uOpacity;uniform float uOpacityScatter;
      varying float vFade;varying vec3 vColor;varying float vForm;varying float vAlpha;
      void main(){
        float gRnd1=aRnd.x,gRnd2=aRnd.y,gRnd3=aRnd.z,gRnd4=aRnd.w;
        float ny=position.y/uR;
        /* flow: each point circles on the surface (like the brain), a slow wave climbs the body,
           and a few wisps lift off and fade */
        vec3 nrm=normalize(aNormal+vec3(1e-5));
        vec3 ref=abs(nrm.y)<0.95?vec3(0.0,1.0,0.0):vec3(1.0,0.0,0.0);
        vec3 tA=normalize(cross(nrm,ref)); vec3 tB=cross(nrm,tA);
        float ph=uTime*uFlowSpeed+gRnd4*6.2831853;
        vec3 rest=position+(tA*cos(ph)+tB*sin(ph))*uFlowAmount;
        rest+=nrm*(sin(position.y*uWaveFreq-uTime*uWaveSpeed+gRnd1*0.9)*uWaveAmp+sin(uTime*1.3+gRnd1*6.2831853)*uBreath);
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
        /* gentle surface light while she is formed (no hard detail) */
        vec3 n=normalize(mat3(modelMatrix)*nrm);
        vec3 v=normalize(cameraPosition-modelPosition.xyz);
        float facing=dot(n,v);
        float shade=mix(uAmbient,1.0,max(dot(n,uLightDir),0.0))+pow(1.0-abs(facing),2.0)*uRim+pow(max(facing,0.0),2.0)*uFront;
        shade*=mix(uBackDim,1.0,smoothstep(-0.15,0.15,facing));
        shade*=mix(uGraze,1.0,abs(facing));
        shade*=max(0.0,1.0+uCurv*aCurv);
        shade*=mix(1.0,aVis,uOcc);
        /* colour: the brain's cool -> warm climb while formed; the galaxy's own mix while scattered */
        float vt=clamp(smoothstep(-0.85,0.85,ny)+(gRnd2-0.5)*0.3,0.0,1.0);
        vec3 formed=mix(uColEdge,uColCore,vt)*shade;
        float galaxyR=pow(gRnd1,2.0)*60.0+pow(gRnd2,3.0)*30.0;
        vec3 scattered=mix(uColEdge,uColCore,smoothstep(80.0,0.0,galaxyR));
        vColor=mix(scattered,formed,form);
        float isOrb=step(0.98,fract(gRnd1*77.77));
        isOrb*=step(fract(gRnd2*31.7),mix(1.0,uStar,form));
        float starSize=mix(1.0,3.0,isOrb);
        vFade=mix(0.7,1.0,isOrb);
        vFade*=mix(1.0,(1.0-life)*smoothstep(0.0,0.12,life),wisp*form);
        vFade*=mix(1.0,smoothstep(-1.0,-1.0+uBottomFade,ny),form);
        vForm=form; vAlpha=mix(uOpacityScatter,uOpacity,form);
        gl_PointSize=uSize*starSize*(10.0/-mvPosition.z)*sqrt(uDpr)*mix(1.0,uFormSize,form);
        gl_PointSize=max(gl_PointSize,1.5);
        gl_Position=projectionMatrix*mvPosition;
      }`,
    fragmentShader:`
      uniform float uBrightness;uniform float uAppear;uniform float uFade;
      varying float vFade;varying vec3 vColor;varying float vForm;varying float vAlpha;
      void main(){
        vec2 xy=gl_PointCoord-0.5;
        float ll=length(xy);
        if(ll>0.5) discard;
        /* galaxy sprite while scattered, the brain's softer sprite while formed */
        float a=mix(smoothstep(0.5,0.1,ll),pow(smoothstep(0.5,0.0,ll),2.2),vForm);
        gl_FragColor=vec4(vColor*uBrightness,vFade*a*vAlpha*uAppear*uFade);
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
