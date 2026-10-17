/* hlab-webgl-scene.js — the hero's WebGL scene (three.js), split out of
   hlab-hero-vesper.js so it can render in a Web Worker on an OffscreenCanvas:
   the page's main thread stays free while the context is created and the shaders
   compile. The scene code is the original, verbatim; it reads the window size and
   pointer from the page's per-frame state instead of the DOM. Built by
   instatic/home-lab/perf/build.py; do not edit by hand. */

/* The two baked meshes (VBRN containers) are stored losslessly as RGB PNGs in the media
   library: a 4-byte length, then the bytes, three per pixel. */
async function pngBytes(url){
  const buf=await (await fetch(url)).arrayBuffer()
  let px
  if(typeof DecompressionStream!=='undefined'){
    const v=new DataView(buf), u8=new Uint8Array(buf), idat=[]
    let w=0,h=0,ct=2,o=8
    while(o<u8.length){
      const len=v.getUint32(o), type=String.fromCharCode(u8[o+4],u8[o+5],u8[o+6],u8[o+7])
      if(type==='IHDR'){ w=v.getUint32(o+8); h=v.getUint32(o+12); ct=u8[o+17] }
      else if(type==='IDAT') idat.push(u8.subarray(o+8,o+8+len))
      o+=12+len
    }
    const raw=new Uint8Array(await new Response(new Blob(idat).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer())
    const bpp=ct===6?4:3, stride=w*bpp, out=new Uint8Array(w*h*bpp)
    for(let y=0;y<h;y++){
      const f=raw[y*(stride+1)], src=y*(stride+1)+1, dst=y*stride
      for(let x=0;x<stride;x++){
        const a=x>=bpp?out[dst+x-bpp]:0, b=y?out[dst-stride+x]:0, c=(x>=bpp&&y)?out[dst-stride+x-bpp]:0
        let r=raw[src+x]
        if(f===1) r+=a; else if(f===2) r+=b; else if(f===3) r+=(a+b)>>1
        else if(f===4){ const p=a+b-c, pa=Math.abs(p-a), pb=Math.abs(p-b), pc=Math.abs(p-c); r+=(pa<=pb&&pa<=pc)?a:(pb<=pc?b:c) }
        out[dst+x]=r&255
      }
    }
    if(bpp===3) px=out; else { px=new Uint8Array(w*h*3); for(let i=0,j=0;i<out.length;i+=4,j+=3){ px[j]=out[i]; px[j+1]=out[i+1]; px[j+2]=out[i+2] } }
  } else {
    const bmp=await createImageBitmap(new Blob([buf]),{premultiplyAlpha:'none',colorSpaceConversion:'none'})
    const cv=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(bmp.width,bmp.height):Object.assign(document.createElement('canvas'),{width:bmp.width,height:bmp.height})
    const g=cv.getContext('2d'); g.drawImage(bmp,0,0)
    const d=g.getImageData(0,0,bmp.width,bmp.height).data
    px=new Uint8Array(bmp.width*bmp.height*3); for(let i=0,j=0;i<d.length;i+=4,j+=3){ px[j]=d[i]; px[j+1]=d[i+1]; px[j+2]=d[i+2] }
  }
  const n=px[0]|px[1]<<8|px[2]<<16|px[3]<<24
  return px.slice(4,4+n).buffer
}
/* three.js comes from the URL the page passes (Instatic's own copy, see the page's import map) */
export async function loadScene(threeUrl,meshUrls){
const [__THREE,womanMesh,brainMesh]=await Promise.all([import(threeUrl),pngBytes(meshUrls.woman),pngBytes(meshUrls.brain)])
const MESHES={woman:womanMesh,brain:brainMesh}
const {HalfFloatType,NoBlending,Timer,Vector2,WebGLRenderTarget}=__THREE
const {ShaderMaterial,UniformsUtils}=__THREE
const {BufferGeometry,Float32BufferAttribute,OrthographicCamera,Mesh}=__THREE
const {Color}=__THREE
const {AdditiveBlending,Color:Color3,HalfFloatType:HalfFloatType2,MeshBasicMaterial,ShaderMaterial:ShaderMaterial2,UniformsUtils:UniformsUtils2,Vector2:Vector22,Vector3,WebGLRenderTarget:WebGLRenderTarget2}=__THREE
const {Color:Color2}=__THREE
const {ColorManagement,RawShaderMaterial,UniformsUtils:UniformsUtils3,LinearToneMapping,ReinhardToneMapping,CineonToneMapping,AgXToneMapping,ACESFilmicToneMapping,NeutralToneMapping,CustomToneMapping,SRGBTransfer}=__THREE
const THREE=__THREE


var CopyShader = {
  name: "CopyShader",
  uniforms: {
    "tDiffuse": { value: null },
    "opacity": { value: 1 }
  },
  vertexShader: (
    /* glsl */
    `

    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`
  ),
  fragmentShader: (
    /* glsl */
    `

    uniform float opacity;

    uniform sampler2D tDiffuse;

    varying vec2 vUv;

    void main() {

      vec4 texel = texture2D( tDiffuse, vUv );
      gl_FragColor = opacity * texel;

    }`
  )
};

var Pass = class {
  constructor() {
    this.isPass = true;
    this.enabled = true;
    this.needsSwap = true;
    this.clear = false;
    this.renderToScreen = false;
  }
  setSize() {
  }
  render() {
    console.error("THREE.Pass: .render() must be implemented in derived pass.");
  }
  dispose() {
  }
};
var _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
var FullscreenTriangleGeometry = class extends BufferGeometry {
  constructor() {
    super();
    this.setAttribute("position", new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
    this.setAttribute("uv", new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
  }
};
var _geometry = new FullscreenTriangleGeometry();
var FullScreenQuad = class {
  constructor(material) {
    this._mesh = new Mesh(_geometry, material);
  }
  dispose() {
    this._mesh.geometry.dispose();
  }
  render(renderer) {
    renderer.render(this._mesh, _camera);
  }
  get material() {
    return this._mesh.material;
  }
  set material(value) {
    this._mesh.material = value;
  }
};

var ShaderPass = class extends Pass {
  constructor(shader, textureID = "tDiffuse") {
    super();
    this.textureID = textureID;
    this.uniforms = null;
    this.material = null;
    if (shader instanceof ShaderMaterial) {
      this.uniforms = shader.uniforms;
      this.material = shader;
    } else if (shader) {
      this.uniforms = UniformsUtils.clone(shader.uniforms);
      this.material = new ShaderMaterial({
        name: shader.name !== void 0 ? shader.name : "unspecified",
        defines: Object.assign({}, shader.defines),
        uniforms: this.uniforms,
        vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader
      });
    }
    this._fsQuad = new FullScreenQuad(this.material);
  }
  render(renderer, writeBuffer, readBuffer) {
    if (this.uniforms[this.textureID]) {
      this.uniforms[this.textureID].value = readBuffer.texture;
    }
    this._fsQuad.material = this.material;
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this._fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
      this._fsQuad.render(renderer);
    }
  }
  dispose() {
    this.material.dispose();
    this._fsQuad.dispose();
  }
};

var MaskPass = class extends Pass {
  constructor(scene, camera) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.clear = true;
    this.needsSwap = false;
    this.inverse = false;
  }
  render(renderer, writeBuffer, readBuffer) {
    const context = renderer.getContext();
    const state = renderer.state;
    state.buffers.color.setMask(false);
    state.buffers.depth.setMask(false);
    state.buffers.color.setLocked(true);
    state.buffers.depth.setLocked(true);
    let writeValue, clearValue;
    if (this.inverse) {
      writeValue = 0;
      clearValue = 1;
    } else {
      writeValue = 1;
      clearValue = 0;
    }
    state.buffers.stencil.setTest(true);
    state.buffers.stencil.setOp(context.REPLACE, context.REPLACE, context.REPLACE);
    state.buffers.stencil.setFunc(context.ALWAYS, writeValue, 4294967295);
    state.buffers.stencil.setClear(clearValue);
    state.buffers.stencil.setLocked(true);
    renderer.setRenderTarget(readBuffer);
    if (this.clear) renderer.clear();
    renderer.render(this.scene, this.camera);
    renderer.setRenderTarget(writeBuffer);
    if (this.clear) renderer.clear();
    renderer.render(this.scene, this.camera);
    state.buffers.color.setLocked(false);
    state.buffers.depth.setLocked(false);
    state.buffers.color.setMask(true);
    state.buffers.depth.setMask(true);
    state.buffers.stencil.setLocked(false);
    state.buffers.stencil.setFunc(context.EQUAL, 1, 4294967295);
    state.buffers.stencil.setOp(context.KEEP, context.KEEP, context.KEEP);
    state.buffers.stencil.setLocked(true);
  }
};
var ClearMaskPass = class extends Pass {
  constructor() {
    super();
    this.needsSwap = false;
  }
  render(renderer) {
    renderer.state.buffers.stencil.setLocked(false);
    renderer.state.buffers.stencil.setTest(false);
  }
};

var EffectComposer = class {
  constructor(renderer, renderTarget) {
    this.renderer = renderer;
    this._pixelRatio = renderer.getPixelRatio();
    if (renderTarget === void 0) {
      const size = renderer.getSize(new Vector2());
      this._width = size.width;
      this._height = size.height;
      renderTarget = new WebGLRenderTarget(this._width * this._pixelRatio, this._height * this._pixelRatio, { type: HalfFloatType });
      renderTarget.texture.name = "EffectComposer.rt1";
    } else {
      this._width = renderTarget.width;
      this._height = renderTarget.height;
    }
    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();
    this.renderTarget2.texture.name = "EffectComposer.rt2";
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;
    this.renderToScreen = true;
    this.passes = [];
    this.copyPass = new ShaderPass(CopyShader);
    this.copyPass.material.blending = NoBlending;
    this.timer = new Timer();
  }
  swapBuffers() {
    const tmp = this.readBuffer;
    this.readBuffer = this.writeBuffer;
    this.writeBuffer = tmp;
  }
  addPass(pass) {
    this.passes.push(pass);
    pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }
  insertPass(pass, index) {
    this.passes.splice(index, 0, pass);
    pass.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
  }
  removePass(pass) {
    const index = this.passes.indexOf(pass);
    if (index !== -1) {
      this.passes.splice(index, 1);
    }
  }
  isLastEnabledPass(passIndex) {
    for (let i = passIndex + 1; i < this.passes.length; i++) {
      if (this.passes[i].enabled) {
        return false;
      }
    }
    return true;
  }
  render(deltaTime) {
    this.timer.update();
    if (deltaTime === void 0) {
      deltaTime = this.timer.getDelta();
    }
    const currentRenderTarget = this.renderer.getRenderTarget();
    let maskActive = false;
    for (let i = 0, il = this.passes.length; i < il; i++) {
      const pass = this.passes[i];
      if (pass.enabled === false) continue;
      pass.renderToScreen = this.renderToScreen && this.isLastEnabledPass(i);
      pass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime, maskActive);
      if (pass.needsSwap) {
        if (maskActive) {
          const context = this.renderer.getContext();
          const stencil = this.renderer.state.buffers.stencil;
          stencil.setFunc(context.NOTEQUAL, 1, 4294967295);
          this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, deltaTime);
          stencil.setFunc(context.EQUAL, 1, 4294967295);
        }
        this.swapBuffers();
      }
      if (MaskPass !== void 0) {
        if (pass instanceof MaskPass) {
          maskActive = true;
        } else if (pass instanceof ClearMaskPass) {
          maskActive = false;
        }
      }
    }
    this.renderer.setRenderTarget(currentRenderTarget);
  }
  reset(renderTarget) {
    if (renderTarget === void 0) {
      const size = this.renderer.getSize(new Vector2());
      this._pixelRatio = this.renderer.getPixelRatio();
      this._width = size.width;
      this._height = size.height;
      renderTarget = this.renderTarget1.clone();
      renderTarget.setSize(this._width * this._pixelRatio, this._height * this._pixelRatio);
    }
    this.renderTarget1.dispose();
    this.renderTarget2.dispose();
    this.renderTarget1 = renderTarget;
    this.renderTarget2 = renderTarget.clone();
    this.writeBuffer = this.renderTarget1;
    this.readBuffer = this.renderTarget2;
  }
  setSize(width, height) {
    this._width = width;
    this._height = height;
    const effectiveWidth = this._width * this._pixelRatio;
    const effectiveHeight = this._height * this._pixelRatio;
    this.renderTarget1.setSize(effectiveWidth, effectiveHeight);
    this.renderTarget2.setSize(effectiveWidth, effectiveHeight);
    for (let i = 0; i < this.passes.length; i++) {
      this.passes[i].setSize(effectiveWidth, effectiveHeight);
    }
  }
  setPixelRatio(pixelRatio) {
    this._pixelRatio = pixelRatio;
    this.setSize(this._width, this._height);
  }
  dispose() {
    this.renderTarget1.dispose();
    this.renderTarget2.dispose();
    this.copyPass.dispose();
  }
};

var RenderPass = class extends Pass {
  constructor(scene, camera, overrideMaterial = null, clearColor = null, clearAlpha = null) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.overrideMaterial = overrideMaterial;
    this.clearColor = clearColor;
    this.clearAlpha = clearAlpha;
    this.clear = true;
    this.clearDepth = false;
    this.needsSwap = false;
    this.isRenderPass = true;
    this._oldClearColor = new Color();
  }
  render(renderer, writeBuffer, readBuffer) {
    const oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    let oldClearAlpha, oldOverrideMaterial;
    if (this.overrideMaterial !== null) {
      oldOverrideMaterial = this.scene.overrideMaterial;
      this.scene.overrideMaterial = this.overrideMaterial;
    }
    if (this.clearColor !== null) {
      renderer.getClearColor(this._oldClearColor);
      renderer.setClearColor(this.clearColor, renderer.getClearAlpha());
    }
    if (this.clearAlpha !== null) {
      oldClearAlpha = renderer.getClearAlpha();
      renderer.setClearAlpha(this.clearAlpha);
    }
    if (this.clearDepth == true) {
      renderer.clearDepth();
    }
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    if (this.clear === true) {
      renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
    }
    renderer.render(this.scene, this.camera);
    if (this.clearColor !== null) {
      renderer.setClearColor(this._oldClearColor);
    }
    if (this.clearAlpha !== null) {
      renderer.setClearAlpha(oldClearAlpha);
    }
    if (this.overrideMaterial !== null) {
      this.scene.overrideMaterial = oldOverrideMaterial;
    }
    renderer.autoClear = oldAutoClear;
  }
};

var LuminosityHighPassShader = {
  name: "LuminosityHighPassShader",
  uniforms: {
    "tDiffuse": { value: null },
    "luminosityThreshold": { value: 1 },
    "smoothWidth": { value: 1 },
    "defaultColor": { value: new Color2(0) },
    "defaultOpacity": { value: 0 }
  },
  vertexShader: (
    /* glsl */
    `

    varying vec2 vUv;

    void main() {

      vUv = uv;

      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`
  ),
  fragmentShader: (
    /* glsl */
    `

    uniform sampler2D tDiffuse;
    uniform vec3 defaultColor;
    uniform float defaultOpacity;
    uniform float luminosityThreshold;
    uniform float smoothWidth;

    varying vec2 vUv;

    void main() {

      vec4 texel = texture2D( tDiffuse, vUv );

      float v = luminance( texel.xyz );

      vec4 outputColor = vec4( defaultColor.rgb, defaultOpacity );

      float alpha = smoothstep( luminosityThreshold, luminosityThreshold + smoothWidth, v );

      gl_FragColor = mix( outputColor, texel, alpha );

    }`
  )
};

var UnrealBloomPass = class _UnrealBloomPass extends Pass {
  constructor(resolution, strength = 1, radius, threshold) {
    super();
    this.strength = strength;
    this.radius = radius;
    this.threshold = threshold;
    this.resolution = resolution !== void 0 ? new Vector22(resolution.x, resolution.y) : new Vector22(256, 256);
    this.clearColor = new Color3(0, 0, 0);
    this.needsSwap = false;
    this.renderTargetsHorizontal = [];
    this.renderTargetsVertical = [];
    this.nMips = 5;
    let resx = Math.round(this.resolution.x / 2);
    let resy = Math.round(this.resolution.y / 2);
    this.renderTargetBright = new WebGLRenderTarget2(resx, resy, { type: HalfFloatType2 });
    this.renderTargetBright.texture.name = "UnrealBloomPass.bright";
    this.renderTargetBright.texture.generateMipmaps = false;
    for (let i = 0; i < this.nMips; i++) {
      const renderTargetHorizontal = new WebGLRenderTarget2(resx, resy, { type: HalfFloatType2 });
      renderTargetHorizontal.texture.name = "UnrealBloomPass.h" + i;
      renderTargetHorizontal.texture.generateMipmaps = false;
      this.renderTargetsHorizontal.push(renderTargetHorizontal);
      const renderTargetVertical = new WebGLRenderTarget2(resx, resy, { type: HalfFloatType2 });
      renderTargetVertical.texture.name = "UnrealBloomPass.v" + i;
      renderTargetVertical.texture.generateMipmaps = false;
      this.renderTargetsVertical.push(renderTargetVertical);
      resx = Math.round(resx / 2);
      resy = Math.round(resy / 2);
    }
    const highPassShader = LuminosityHighPassShader;
    this.highPassUniforms = UniformsUtils2.clone(highPassShader.uniforms);
    this.highPassUniforms["luminosityThreshold"].value = threshold;
    this.highPassUniforms["smoothWidth"].value = 0.01;
    this.materialHighPassFilter = new ShaderMaterial2({
      uniforms: this.highPassUniforms,
      vertexShader: highPassShader.vertexShader,
      fragmentShader: highPassShader.fragmentShader
    });
    this.separableBlurMaterials = [];
    const kernelSizeArray = [6, 10, 14, 18, 22];
    resx = Math.round(this.resolution.x / 2);
    resy = Math.round(this.resolution.y / 2);
    for (let i = 0; i < this.nMips; i++) {
      this.separableBlurMaterials.push(this._getSeparableBlurMaterial(kernelSizeArray[i]));
      this.separableBlurMaterials[i].uniforms["invSize"].value = new Vector22(1 / resx, 1 / resy);
      resx = Math.round(resx / 2);
      resy = Math.round(resy / 2);
    }
    this.compositeMaterial = this._getCompositeMaterial(this.nMips);
    this.compositeMaterial.uniforms["blurTexture1"].value = this.renderTargetsVertical[0].texture;
    this.compositeMaterial.uniforms["blurTexture2"].value = this.renderTargetsVertical[1].texture;
    this.compositeMaterial.uniforms["blurTexture3"].value = this.renderTargetsVertical[2].texture;
    this.compositeMaterial.uniforms["blurTexture4"].value = this.renderTargetsVertical[3].texture;
    this.compositeMaterial.uniforms["blurTexture5"].value = this.renderTargetsVertical[4].texture;
    this.compositeMaterial.uniforms["bloomStrength"].value = strength;
    this.compositeMaterial.uniforms["bloomRadius"].value = 0.1;
    const bloomFactors = [1, 0.8, 0.6, 0.4, 0.2];
    this.compositeMaterial.uniforms["bloomFactors"].value = bloomFactors;
    this.bloomTintColors = [new Vector3(1, 1, 1), new Vector3(1, 1, 1), new Vector3(1, 1, 1), new Vector3(1, 1, 1), new Vector3(1, 1, 1)];
    this.compositeMaterial.uniforms["bloomTintColors"].value = this.bloomTintColors;
    this.copyUniforms = UniformsUtils2.clone(CopyShader.uniforms);
    this.blendMaterial = new ShaderMaterial2({
      uniforms: this.copyUniforms,
      vertexShader: CopyShader.vertexShader,
      fragmentShader: CopyShader.fragmentShader,
      premultipliedAlpha: true,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true
    });
    this._oldClearColor = new Color3();
    this._oldClearAlpha = 1;
    this._basic = new MeshBasicMaterial();
    this._fsQuad = new FullScreenQuad(null);
  }
  dispose() {
    for (let i = 0; i < this.renderTargetsHorizontal.length; i++) {
      this.renderTargetsHorizontal[i].dispose();
    }
    for (let i = 0; i < this.renderTargetsVertical.length; i++) {
      this.renderTargetsVertical[i].dispose();
    }
    this.renderTargetBright.dispose();
    for (let i = 0; i < this.separableBlurMaterials.length; i++) {
      this.separableBlurMaterials[i].dispose();
    }
    this.compositeMaterial.dispose();
    this.blendMaterial.dispose();
    this._basic.dispose();
    this._fsQuad.dispose();
  }
  setSize(width, height) {
    let resx = Math.round(width / 2);
    let resy = Math.round(height / 2);
    this.renderTargetBright.setSize(resx, resy);
    for (let i = 0; i < this.nMips; i++) {
      this.renderTargetsHorizontal[i].setSize(resx, resy);
      this.renderTargetsVertical[i].setSize(resx, resy);
      this.separableBlurMaterials[i].uniforms["invSize"].value = new Vector22(1 / resx, 1 / resy);
      resx = Math.round(resx / 2);
      resy = Math.round(resy / 2);
    }
  }
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    renderer.getClearColor(this._oldClearColor);
    this._oldClearAlpha = renderer.getClearAlpha();
    const oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setClearColor(this.clearColor, 0);
    if (maskActive) renderer.state.buffers.stencil.setTest(false);
    if (this.renderToScreen) {
      this._fsQuad.material = this._basic;
      this._basic.map = readBuffer.texture;
      renderer.setRenderTarget(null);
      renderer.clear();
      this._fsQuad.render(renderer);
    }
    this.highPassUniforms["tDiffuse"].value = readBuffer.texture;
    this.highPassUniforms["luminosityThreshold"].value = this.threshold;
    this._fsQuad.material = this.materialHighPassFilter;
    renderer.setRenderTarget(this.renderTargetBright);
    renderer.clear();
    this._fsQuad.render(renderer);
    let inputRenderTarget = this.renderTargetBright;
    for (let i = 0; i < this.nMips; i++) {
      this._fsQuad.material = this.separableBlurMaterials[i];
      this.separableBlurMaterials[i].uniforms["colorTexture"].value = inputRenderTarget.texture;
      this.separableBlurMaterials[i].uniforms["direction"].value = _UnrealBloomPass.BlurDirectionX;
      renderer.setRenderTarget(this.renderTargetsHorizontal[i]);
      renderer.clear();
      this._fsQuad.render(renderer);
      this.separableBlurMaterials[i].uniforms["colorTexture"].value = this.renderTargetsHorizontal[i].texture;
      this.separableBlurMaterials[i].uniforms["direction"].value = _UnrealBloomPass.BlurDirectionY;
      renderer.setRenderTarget(this.renderTargetsVertical[i]);
      renderer.clear();
      this._fsQuad.render(renderer);
      inputRenderTarget = this.renderTargetsVertical[i];
    }
    this._fsQuad.material = this.compositeMaterial;
    this.compositeMaterial.uniforms["bloomStrength"].value = this.strength;
    this.compositeMaterial.uniforms["bloomRadius"].value = this.radius;
    this.compositeMaterial.uniforms["bloomTintColors"].value = this.bloomTintColors;
    renderer.setRenderTarget(this.renderTargetsHorizontal[0]);
    renderer.clear();
    this._fsQuad.render(renderer);
    this._fsQuad.material = this.blendMaterial;
    this.copyUniforms["tDiffuse"].value = this.renderTargetsHorizontal[0].texture;
    if (maskActive) renderer.state.buffers.stencil.setTest(true);
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this._fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(readBuffer);
      this._fsQuad.render(renderer);
    }
    renderer.setClearColor(this._oldClearColor, this._oldClearAlpha);
    renderer.autoClear = oldAutoClear;
  }
  // internals
  _getSeparableBlurMaterial(kernelRadius) {
    const coefficients = [];
    const sigma = kernelRadius / 3;
    for (let i = 0; i < kernelRadius; i++) {
      coefficients.push(0.39894 * Math.exp(-0.5 * i * i / (sigma * sigma)) / sigma);
    }
    return new ShaderMaterial2({
      defines: {
        "KERNEL_RADIUS": kernelRadius
      },
      uniforms: {
        "colorTexture": { value: null },
        "invSize": { value: new Vector22(0.5, 0.5) },
        // inverse texture size
        "direction": { value: new Vector22(0.5, 0.5) },
        "gaussianCoefficients": { value: coefficients }
        // precomputed Gaussian coefficients
      },
      vertexShader: (
        /* glsl */
        `

        varying vec2 vUv;

        void main() {

          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

        }`
      ),
      fragmentShader: (
        /* glsl */
        `

        #include <common>

        varying vec2 vUv;

        uniform sampler2D colorTexture;
        uniform vec2 invSize;
        uniform vec2 direction;
        uniform float gaussianCoefficients[KERNEL_RADIUS];

        void main() {

          float weightSum = gaussianCoefficients[0];
          vec3 diffuseSum = texture2D( colorTexture, vUv ).rgb * weightSum;

          for ( int i = 1; i < KERNEL_RADIUS; i ++ ) {

            float x = float( i );
            float w = gaussianCoefficients[i];
            vec2 uvOffset = direction * invSize * x;
            vec3 sample1 = texture2D( colorTexture, vUv + uvOffset ).rgb;
            vec3 sample2 = texture2D( colorTexture, vUv - uvOffset ).rgb;
            diffuseSum += ( sample1 + sample2 ) * w;

          }

          gl_FragColor = vec4( diffuseSum, 1.0 );

        }`
      )
    });
  }
  _getCompositeMaterial(nMips) {
    return new ShaderMaterial2({
      defines: {
        "NUM_MIPS": nMips
      },
      uniforms: {
        "blurTexture1": { value: null },
        "blurTexture2": { value: null },
        "blurTexture3": { value: null },
        "blurTexture4": { value: null },
        "blurTexture5": { value: null },
        "bloomStrength": { value: 1 },
        "bloomFactors": { value: null },
        "bloomTintColors": { value: null },
        "bloomRadius": { value: 0 }
      },
      vertexShader: (
        /* glsl */
        `

        varying vec2 vUv;

        void main() {

          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

        }`
      ),
      fragmentShader: (
        /* glsl */
        `

        varying vec2 vUv;

        uniform sampler2D blurTexture1;
        uniform sampler2D blurTexture2;
        uniform sampler2D blurTexture3;
        uniform sampler2D blurTexture4;
        uniform sampler2D blurTexture5;
        uniform float bloomStrength;
        uniform float bloomRadius;
        uniform float bloomFactors[NUM_MIPS];
        uniform vec3 bloomTintColors[NUM_MIPS];

        float lerpBloomFactor( const in float factor ) {

          float mirrorFactor = 1.2 - factor;
          return mix( factor, mirrorFactor, bloomRadius );

        }

        void main() {

          // 3.0 for backwards compatibility with previous alpha-based intensity
          vec3 bloom = 3.0 * bloomStrength * (
            lerpBloomFactor( bloomFactors[ 0 ] ) * bloomTintColors[ 0 ] * texture2D( blurTexture1, vUv ).rgb +
            lerpBloomFactor( bloomFactors[ 1 ] ) * bloomTintColors[ 1 ] * texture2D( blurTexture2, vUv ).rgb +
            lerpBloomFactor( bloomFactors[ 2 ] ) * bloomTintColors[ 2 ] * texture2D( blurTexture3, vUv ).rgb +
            lerpBloomFactor( bloomFactors[ 3 ] ) * bloomTintColors[ 3 ] * texture2D( blurTexture4, vUv ).rgb +
            lerpBloomFactor( bloomFactors[ 4 ] ) * bloomTintColors[ 4 ] * texture2D( blurTexture5, vUv ).rgb
          );

          float bloomAlpha = max( bloom.r, max( bloom.g, bloom.b ) );
          gl_FragColor = vec4( bloom, bloomAlpha );

        }`
      )
    });
  }
};
UnrealBloomPass.BlurDirectionX = new Vector22(1, 0);
UnrealBloomPass.BlurDirectionY = new Vector22(0, 1);

var OutputShader = {
  name: "OutputShader",
  uniforms: {
    "tDiffuse": { value: null },
    "toneMappingExposure": { value: 1 }
  },
  vertexShader: (
    /* glsl */
    `
    precision highp float;

    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    attribute vec3 position;
    attribute vec2 uv;

    varying vec2 vUv;

    void main() {

      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

    }`
  ),
  fragmentShader: (
    /* glsl */
    `

    precision highp float;

    uniform sampler2D tDiffuse;

    #include <tonemapping_pars_fragment>
    #include <colorspace_pars_fragment>

    varying vec2 vUv;

    void main() {

      gl_FragColor = texture2D( tDiffuse, vUv );

      // tone mapping

      #ifdef LINEAR_TONE_MAPPING

        gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );

      #elif defined( REINHARD_TONE_MAPPING )

        gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );

      #elif defined( CINEON_TONE_MAPPING )

        gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );

      #elif defined( ACES_FILMIC_TONE_MAPPING )

        gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );

      #elif defined( AGX_TONE_MAPPING )

        gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );

      #elif defined( NEUTRAL_TONE_MAPPING )

        gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );

      #elif defined( CUSTOM_TONE_MAPPING )

        gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );

      #endif

      // color space

      #ifdef SRGB_TRANSFER

        gl_FragColor = sRGBTransferOETF( gl_FragColor );

      #endif

    }`
  )
};

var OutputPass = class extends Pass {
  constructor() {
    super();
    this.isOutputPass = true;
    this.uniforms = UniformsUtils3.clone(OutputShader.uniforms);
    this.material = new RawShaderMaterial({
      name: OutputShader.name,
      uniforms: this.uniforms,
      vertexShader: OutputShader.vertexShader,
      fragmentShader: OutputShader.fragmentShader
    });
    this._fsQuad = new FullScreenQuad(this.material);
    this._outputColorSpace = null;
    this._toneMapping = null;
  }
  render(renderer, writeBuffer, readBuffer) {
    this.uniforms["tDiffuse"].value = readBuffer.texture;
    this.uniforms["toneMappingExposure"].value = renderer.toneMappingExposure;
    if (this._outputColorSpace !== renderer.outputColorSpace || this._toneMapping !== renderer.toneMapping) {
      this._outputColorSpace = renderer.outputColorSpace;
      this._toneMapping = renderer.toneMapping;
      this.material.defines = {};
      if (ColorManagement.getTransfer(this._outputColorSpace) === SRGBTransfer) this.material.defines.SRGB_TRANSFER = "";
      if (this._toneMapping === LinearToneMapping) this.material.defines.LINEAR_TONE_MAPPING = "";
      else if (this._toneMapping === ReinhardToneMapping) this.material.defines.REINHARD_TONE_MAPPING = "";
      else if (this._toneMapping === CineonToneMapping) this.material.defines.CINEON_TONE_MAPPING = "";
      else if (this._toneMapping === ACESFilmicToneMapping) this.material.defines.ACES_FILMIC_TONE_MAPPING = "";
      else if (this._toneMapping === AgXToneMapping) this.material.defines.AGX_TONE_MAPPING = "";
      else if (this._toneMapping === NeutralToneMapping) this.material.defines.NEUTRAL_TONE_MAPPING = "";
      else if (this._toneMapping === CustomToneMapping) this.material.defines.CUSTOM_TONE_MAPPING = "";
      this.material.needsUpdate = true;
    }
    if (this.renderToScreen === true) {
      renderer.setRenderTarget(null);
      this._fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear(renderer.autoClearColor, renderer.autoClearDepth, renderer.autoClearStencil);
      this._fsQuad.render(renderer);
    }
  }
  dispose() {
    this.material.dispose();
    this._fsQuad.dispose();
  }
};

function createScene(canvas, init, emit) {
  const ENV = { w: init.w, h: init.h, dpr: init.dpr };
  const window = { get innerWidth() {
    return ENV.w;
  }, get innerHeight() {
    return ENV.h;
  }, get devicePixelRatio() {
    return ENV.dpr;
  }, __hlabNoLite: !!init.noLite };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (a, b, x) => {
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const smootherstep = (x) => {
    const t = clamp01(x);
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  const linVec = (hex) => {
    const c = new THREE.Color(hex);
    return new THREE.Vector3(c.r, c.g, c.b);
  };
  const ORB = {
    bg: "#0D141F",
    flameA: "#2F5E9E",
    flameB: "#1FA39C",
    flameAmt: 0.5,
    atmo: "#DCEBF2",
    atmoSpread: 2.2,
    atmoFadeNear: 2,
    atmoFadeFar: 3.2,
    atmoAlpha: 0.5
  };
  const GALAXY = {
    bg: "#0D141F",
    flameA: "#2F5E9E",
    flameB: "#1FA39C",
    flameAmt: 0.195,
    atmo: "#DCEBF2",
    atmoSpread: 4,
    atmoFadeNear: 5,
    atmoFadeFar: 6.5,
    atmoAlpha: 0.6
  };
  const SCENE_BACKGROUND = ORB.bg;
  const ORB_CONFIG = {
    colorTop: "#45D6C4",
    colorBottom: "#3A6FD0",
    colorEdge: "#2B4F9A",
    deform: 0.135,
    brightness: 1.24,
    opacity: 1,
    spin: 0.17,
    tilt: 0.39,
    pointerRadius: 1.76,
    oilBulge: 0.46,
    oilRipple: 0.34,
    oilDrag: 0.95,
    rippleFreq: 11,
    rippleSpeed: 4,
    iridescence: 0.25,
    radius: 1,
    approach: 2.6,
    distortGain: 3.4
  };
  const GALAXY_CONFIG = {
    colorEdge: "#3A6FD0",
    colorCore: "#45D6C4",
    opacity: 0.55,
    pointSize: 6,
    brightness: 1.02,
    armSpin: 0.4,
    tilt: -0.5,
    scale: 0.18,
    cameraZ: 48,
    dive: 30,
    diveTilt: 0.5,
    parallax: 4,
    pointerRadius: 5,
    pointerStrength: 2
  };
  const WOMAN_CONFIG = { radius: 84, opacity: 1.15, faceY: 0.4, faceZ: 0.15, coreRadius: 0.5, ambient: 0.9, rim: 0.3, backDim: 0.3, breath: 0.4, turn: 0.22, turnSpeed: 0.22, tilt: 0.04, restY: -4.6, dive: 8, graze: 0.8, star: 0.5, faceLow: 0.05, faceHigh: 0.78, faceBoost: 2, curvBoost: 0, curvShade: 0.25, occlusion: 0.9, pointerRadius: 4.2, pointerStrength: 1.2, light: [-0.75, 0.45, 0.5], front: 0.25, density: 0.95, cursorPlaneZ: 0.2, followYaw: 0.38, followPitch: 0.14, followShift: 0.7, hoverCalm: 0.6, springK: 14, opacityScatter: 1.7, formSize: 3.4, flowAmount: 0.8, flowSpeed: 1.6, waveAmp: 1.3, waveFreq: 0.12, waveSpeed: 1.6, wisp: 0.05, wispDist: 22, wispSpeed: 0.12, bottomFade: 0.45, px: 3.8, zRef: 42, deform: 3, noiseScale: 1.2, synapseRate: 0.08, spacing: 0.75, oversample: 2.5, headColor: "#3D5F7E", headAmt: 1, faceDim: 0.62, pulse: 3.2, pulseAmt: 0.9, orbR: 1.1, ripK: 2.2, ripS: 5, ripAmp: 0.45, trails: [[0.035, 0.5], [0.07, 0.3], [0.105, 0.16]], camPush: 9, camPull: 4, camLook: 0.6, sweepAmt: 0.9, sweepEvery: 7, curvFace: 1.3, faceSpacing: 0.62 };
  const BRAIN_CONFIG = {
    colorCool: "#3A6FD0",
    colorWarm: "#45D6C4",
    colorEdge: "#2B4F9A",
    colorCenter: "#0D141F",
    colorSynapse: "#DCEBF2",
    colorDeep: "#0D141F",
    colorCursor: "#5ED6DE",
    centerRadius: 0.37,
    centerFalloff: 4,
    size: 0.067,
    synapseRate: 0.1,
    flowSpeed: 2.3,
    flowAmount: 0.025,
    glow: 1.4,
    depthDarkness: 1,
    radius: 1.15,
    count: 14e4,
    cursorTilt: 0.22,
    scrollSpin: 2.4,
    baseRotationY: -1.309 - 1.5708,
    approach: 2.5
  };
  const ORB_PARALLAX = 0.35;
  const INTRO_DOLLY = 10;
  const ADAPTIVE = [
    { point: Infinity, orbCount: 23e3, orbPointSize: 28, orbCameraZ: 3.8, orbMoveY: 0.8, galaxyWidthSegments: 160, galaxyHeightSegments: 420, brainCount: 13e4, atmoCount: 260, atmoSize: 23, pointerReaction: true, dpr: [1, 2], progressLerp: 0.07, bloom: true },
    { point: 1440, orbCount: 17e3, orbPointSize: 27, orbCameraZ: 3.8, orbMoveY: 0.8, galaxyWidthSegments: 130, galaxyHeightSegments: 330, brainCount: 9e4, atmoCount: 210, atmoSize: 22, pointerReaction: true, dpr: [1, 1.75], progressLerp: 0.08, bloom: true },
    { point: 1024, orbCount: 11e3, orbPointSize: 24, orbCameraZ: 4.5, orbMoveY: 0.9, galaxyWidthSegments: 100, galaxyHeightSegments: 250, brainCount: 5e4, atmoCount: 150, atmoSize: 20, pointerReaction: false, dpr: [0.9, 1.25], progressLerp: 0.13, bloom: true },
    { point: 640, orbCount: 6500, orbPointSize: 21, orbCameraZ: 5.4, orbMoveY: 1, galaxyWidthSegments: 70, galaxyHeightSegments: 170, brainCount: 26e3, atmoCount: 90, atmoSize: 18, pointerReaction: false, dpr: [0.75, 1.1], progressLerp: 0.15, bloom: false }
  ];
  const getParams = (w) => {
    let r = ADAPTIVE[0];
    for (const e of ADAPTIVE) if (w <= e.point) r = e;
    return r;
  };
  const PARAMS = { ...getParams(window.innerWidth) };
  if (window.innerHeight > window.innerWidth * 1.15) PARAMS.orbCameraZ = Math.max(PARAMS.orbCameraZ, 7.2);
  const KEYFRAMES = [
    { orbOut: 0, galaxyIn: 0, galaxyOut: 0, galaxyDive: 0 },
    { orbOut: 1, galaxyIn: 1, galaxyOut: 0, galaxyDive: 0.5 },
    { orbOut: 1, galaxyIn: 1, galaxyOut: 0.5, galaxyDive: 1 },
    { orbOut: 1, galaxyIn: 1, galaxyOut: 1, galaxyDive: 1 },
    { orbOut: 1, galaxyIn: 1, galaxyOut: 1, galaxyDive: 1 }
  ];
  const KEYS = ["orbOut", "galaxyIn", "galaxyOut", "galaxyDive"];
  const TIMELINE_END = 4;
  const sampleScene = (g) => {
    const c = clamp(g, 0, TIMELINE_END);
    const lower = Math.min(Math.floor(c), KEYFRAMES.length - 2);
    const t = c - lower, from = KEYFRAMES[lower], to = KEYFRAMES[lower + 1], out = {};
    for (const k of KEYS) out[k] = lerp(from[k], to[k], t);
    return out;
  };
  const orbDissolve = (s) => smootherstep(s.orbOut);
  const orbAlpha = (s) => 1 - orbDissolve(s);
  const orbCoreOpen = (p) => smoothstep(2.9, 3.6, p);
  const orbApproach = (p) => smoothstep(3.4, 4, p);
  const galaxyAppear = (s) => smootherstep(smoothstep(0.55, 0.95, s.galaxyIn));
  const galaxyAssemble = (s) => 1 - smootherstep(smoothstep(0.5, 1, s.galaxyIn));
  const galaxyBlow = (s) => smootherstep(clamp01((s.galaxyOut - 0.5) * 2));
  const galaxyPresence = (s) => galaxyAppear(s) * (1 - galaxyBlow(s));
  const brainAppear = (p) => smootherstep(smoothstep(2.6, 3.4, p));
  const timeline = {
    tracks: [0, 0, 0, 0],
    state: { ...KEYFRAMES[0] },
    target: 0,
    progress: 0,
    smoothing: PARAMS.progressLerp,
    setTrack(i, v) {
      this.tracks[i] = v;
      let s = 0;
      for (const t of this.tracks) s += t;
      this.target = s;
    },
    advance(dt) {
      const dist = this.target - this.progress;
      if (Math.abs(dist) < 5e-5) {
        if (this.progress !== this.target) this.progress = this.target;
      } else if (this.smoothing >= 1) {
        this.progress = this.target;
      } else {
        const a = 1 - Math.pow(1 - this.smoothing, dt * 60);
        this.progress += dist * a;
      }
      Object.assign(this.state, sampleScene(this.progress));
    },
    getState() {
      return this.state;
    },
    getProgress() {
      return this.progress;
    }
  };
  const INTRO_DURATION_MS = 2900;
  let introStart = null;
  const startIntro = () => {
    if (introStart === null) introStart = performance.now();
  };
  const getIntro = () => {
    if (introStart === null) return 0;
    const t = clamp01((performance.now() - introStart) / INTRO_DURATION_MS);
    return 1 - Math.pow(1 - t, 3);
  };
  let outro = 0;
  const setOutro = (v) => {
    outro = v;
  };
  const getOutro = () => outro;
  let DPR_SCALE = 1;
  const clampDpr = () => {
    const d = window.devicePixelRatio || 1;
    const [lo, hi] = PARAMS.dpr;
    return Math.min(Math.max(d, lo), hi) * DPR_SCALE;
  };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(clampDpr());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SCENE_BACKGROUND);
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 0, PARAMS.orbCameraZ + INTRO_DOLLY);
  scene.add(camera);
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.62,
    // strength — soft teal nebula wash, not a green blow-out
    0.6,
    // radius
    0.6
  );
  const outputPass = new OutputPass();
  if (PARAMS.bloom) {
    composer.addPass(bloomPass);
    composer.addPass(outputPass);
  } else {
    composer.addPass(outputPass);
  }
  const pointer = new THREE.Vector2(0, 0);
  let pointerHas = false;
  const SNOISE = `
  vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }`;
  const WARP3D = `
  vec3 warp3d(vec3 pos, float t){
    float curv = 0.8, a = 1.9, b = 0.7;
    pos *= 2.0;
    pos.x += curv*sin(t + a*pos.y) + t*b; pos.y += curv*cos(t + a*pos.x);
    pos.y += curv*sin(t + a*pos.z) + t*b; pos.z += curv*cos(t + a*pos.y);
    pos.z += curv*sin(t + a*pos.x) + t*b; pos.x += curv*cos(t + a*pos.z);
    return 0.5 + 0.5*cos(pos.xyz + vec3(1, 2, 4));
  }`;
  const Backdrop = (() => {
    const orb = { bg: linVec(ORB.bg), flameA: linVec(ORB.flameA), flameB: linVec(ORB.flameB), flameAmt: ORB.flameAmt };
    const gal = { bg: linVec(GALAXY.bg), flameA: linVec(GALAXY.flameA), flameB: linVec(GALAXY.flameB), flameAmt: GALAXY.flameAmt };
    const u = {
      iTime: { value: 0 },
      uBg: { value: orb.bg.clone() },
      uFlameA: { value: orb.flameA.clone() },
      uFlameB: { value: orb.flameB.clone() },
      uFlameAmt: { value: orb.flameAmt }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: u,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`,
      fragmentShader: `uniform float iTime;uniform vec3 uBg;uniform vec3 uFlameA;uniform vec3 uFlameB;uniform float uFlameAmt;varying vec2 vUv;
      ${WARP3D}
      void main(){
        vec2 uv=2.0*vUv-1.0;
        vec3 w=pow(warp3d(vec3(uv.x,sin(uv.y),uv.y),iTime*1.5),vec3(1.5));
        vec3 flame=1.5*uFlameA*w.x; flame*=w.y; flame+=uFlameB*w.z;
        flame*=smoothstep(0.25,1.0,abs(uv.y));
        float md=smoothstep(-0.7,1.0,-uv.y*uv.x); flame*=md*md;
        vec3 bg=uBg*(1.0-0.4*length(uv));
        gl_FragColor=vec4(bg+flame*uFlameAmt,1.0);
      }`
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -1;
    scene.add(mesh);
    return { render(t) {
      const p = galaxyPresence(timeline.getState());
      u.iTime.value = t;
      u.uBg.value.lerpVectors(orb.bg, gal.bg, p);
      u.uFlameA.value.lerpVectors(orb.flameA, gal.flameA, p);
      u.uFlameB.value.lerpVectors(orb.flameB, gal.flameB, p);
      u.uFlameAmt.value = orb.flameAmt + (gal.flameAmt - orb.flameAmt) * p;
    } };
  })();
  const HeroLine = (() => {
    const u = { uY: { value: 0.33 }, uThickness: { value: 15e-4 }, uMaskRadius: { value: 0.2 }, uAlpha: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.0);}`,
      fragmentShader: `uniform float uY;uniform float uThickness;uniform float uMaskRadius;uniform float uAlpha;varying vec2 vUv;
      void main(){
        float d=abs(vUv.y-uY);
        float line=1.0-smoothstep(0.0,uThickness,d);
        float side=smoothstep(uMaskRadius*0.6,uMaskRadius,abs(vUv.x-0.5));
        gl_FragColor=vec4(vec3(1.0),line*side*0.2*uAlpha);
      }`
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = -0.5;
    scene.add(mesh);
    const DESIGN_WIDTH = 1440, LINE_FROM_BOTTOM = 264;
    return { render() {
      const w = window.innerWidth, h = window.innerHeight;
      const intro = getIntro(), clock = timeline.getProgress();
      const fromBottomPx = LINE_FROM_BOTTOM * w / DESIGN_WIDTH;
      u.uY.value = Math.min(Math.max(fromBottomPx / Math.max(1, h), 0.02), 0.95);
      u.uThickness.value = 0.6 / Math.max(1, h);
      u.uMaskRadius.value = 0.36 * h / Math.max(1, w);
      const revealed = clamp01((intro - 0.35) / 0.65), gone = clamp01((clock - 0.08) / 0.2);
      u.uAlpha.value = revealed * (1 - gone);
      mesh.visible = u.uAlpha.value > 2e-3;
    } };
  })();
  const oilPointer = ((radius) => {
    const smooth = new THREE.Vector3(0, 0, radius), prev = new THREE.Vector3(0, 0, radius);
    const velocity = new THREE.Vector3(), rawVel = new THREE.Vector3();
    const ndc = new THREE.Vector3(), dir = new THREE.Vector3(), o2c = new THREE.Vector3();
    const target = new THREE.Vector3(), radial = new THREE.Vector3(), ptr = new THREE.Vector2();
    const st = { energy: 0, idle: 0 };
    return {
      cursor: smooth,
      velocity,
      get energy() {
        return st.energy;
      },
      step(cam, pn, centre, enabled, delta) {
        const ease = (b) => 1 - Math.pow(1 - b, delta * 60);
        ptr.lerp(pn, ease(0.11));
        target.copy(smooth);
        if (enabled) {
          ndc.set(ptr.x, ptr.y, 0.5).unproject(cam);
          dir.copy(ndc).sub(cam.position).normalize();
          o2c.copy(cam.position).sub(centre);
          const b = 2 * dir.dot(o2c), c = o2c.lengthSq() - radius * radius, disc = b * b - 4 * c;
          if (disc >= 0) {
            const t = (-b - Math.sqrt(disc)) / 2;
            target.copy(o2c).addScaledVector(dir, t);
          } else {
            const tc = Math.max(0, -dir.dot(o2c));
            target.copy(o2c).addScaledVector(dir, tc).normalize().multiplyScalar(radius);
          }
        }
        prev.copy(smooth);
        smooth.lerp(target, ease(0.1));
        rawVel.subVectors(smooth, prev).multiplyScalar(2.5);
        radial.copy(smooth).normalize();
        rawVel.addScaledVector(radial, -rawVel.dot(radial));
        if (rawVel.length() > 0.6) rawVel.setLength(0.6);
        velocity.lerp(rawVel, ease(0.16));
        const speed = smooth.distanceTo(prev);
        const drive = clamp(speed * 8, 0, 1);
        if (drive > st.energy) st.energy += (drive - st.energy) * ease(0.08);
        else st.energy *= Math.pow(0.97, delta * 60);
        st.idle = speed < 5e-4 ? st.idle + delta : 0;
        if (!enabled || st.idle > 2.5) st.energy *= Math.pow(0.9, delta * 60);
      }
    };
  })(ORB_CONFIG.radius);
  const Orb = (() => {
    const count = PARAMS.orbCount, radius = ORB_CONFIG.radius;
    const positions = new Float32Array(count * 3), randoms = new Float32Array(count * 3);
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - i / (count - 1) * 2, r = Math.sqrt(Math.max(0, 1 - y * y)), th = golden * i;
      positions[i * 3] = Math.cos(th) * r * radius;
      positions[i * 3 + 1] = y * radius;
      positions[i * 3 + 2] = Math.sin(th) * r * radius;
      randoms[i * 3] = Math.random() - 0.5;
      randoms[i * 3 + 1] = Math.random() - 0.5;
      randoms[i * 3 + 2] = Math.random() - 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 3));
    const u = {
      uTime: { value: 0 },
      uPR: { value: renderer.getPixelRatio() },
      uSize: { value: PARAMS.orbPointSize },
      uDeform: { value: ORB_CONFIG.deform },
      uOut: { value: 0 },
      uAssemble: { value: 0 },
      uCore: { value: 0 },
      uCentre: { value: new THREE.Vector3() },
      uCamLocal: { value: new THREE.Vector3(0, 0, 1) },
      uColTop: { value: linVec(ORB_CONFIG.colorTop) },
      uColBottom: { value: linVec(ORB_CONFIG.colorBottom) },
      uColEdge: { value: linVec(ORB_CONFIG.colorEdge) },
      uBrightness: { value: ORB_CONFIG.brightness },
      uOpacity: { value: ORB_CONFIG.opacity },
      uAppear: { value: 0 },
      uCursor: { value: new THREE.Vector3(0, 0, ORB_CONFIG.radius) },
      uCursorVel: { value: new THREE.Vector3() },
      uEnergy: { value: 0 },
      uPointerRadius: { value: ORB_CONFIG.pointerRadius },
      uOilBulge: { value: ORB_CONFIG.oilBulge },
      uOilRipple: { value: ORB_CONFIG.oilRipple },
      uOilDrag: { value: ORB_CONFIG.oilDrag },
      uRippleFreq: { value: ORB_CONFIG.rippleFreq },
      uRippleSpeed: { value: ORB_CONFIG.rippleSpeed },
      uIri: { value: ORB_CONFIG.iridescence }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
      uniform float uTime;uniform float uSize;uniform float uPR;uniform float uDeform;
      uniform float uOut;uniform float uAssemble;uniform float uCore;
      uniform vec3 uCentre;uniform vec3 uCamLocal;uniform vec3 uCursor;uniform vec3 uCursorVel;
      uniform float uEnergy;uniform float uPointerRadius;uniform float uOilBulge;uniform float uOilRipple;
      uniform float uOilDrag;uniform float uRippleFreq;uniform float uRippleSpeed;
      attribute vec3 aRandom;
      varying float vAlpha;varying float vLit;varying float vVert;varying float vSide;varying float vOil;
      ${SNOISE}
      void main(){
        vec3 p=position;
        float n1=snoise(p*1.6+vec3(0.0,uTime*0.18,0.0));
        float n2=snoise(p*3.3-vec3(uTime*0.12));
        float disp=n1*0.72+n2*0.28;
        vec3 pos=p*(1.0+uDeform*disp);
        float lit=smoothstep(-0.25,0.5,disp); vLit=lit;
        vec3 axis=normalize(uCamLocal);
        float axial=dot(pos,axis);
        float radial=length(pos-axis*axial);
        float bore=mix(0.36,0.56,uCore)*(1.0+disp*0.55);
        float hole=smoothstep(bore,bore+0.10,radial);
        float delay=(aRandom.z+0.5)*0.55;
        float t=clamp((uAssemble-delay)/(1.0-delay),0.0,1.0);
        float ease=1.0-pow(1.0-t,3.0);
        vec3 spawn=uCamLocal*0.92+vec3(aRandom.x*1.9,-1.7+aRandom.y*1.3,0.0);
        pos=mix(spawn,pos,ease);
        float assembleFade=ease;
        float out2=uOut*uOut;
        vec3 flow=normalize(p+aRandom*0.4);
        float sheet=snoise(p*1.9+vec3(uTime*0.25));
        float ripple=sin(length(p)*6.0-uTime*1.6+sheet*3.0);
        float travel=out2*(9.0+sheet*5.0+ripple*1.6);
        pos+=flow*travel;
        pos+=vec3(sheet,ripple,sheet*ripple)*uOut*0.55;
        vec4 wpos=modelMatrix*vec4(pos,1.0);
        vec3 wN=normalize(wpos.xyz-uCentre);
        float ang=acos(clamp(dot(wN,normalize(uCursor)),-1.0,1.0));
        float fall=smoothstep(uPointerRadius,0.0,ang);
        float bulge=fall*fall;
        float oilRipple=sin(ang*uRippleFreq-uTime*uRippleSpeed)*fall;
        float oil=(bulge*uOilBulge+oilRipple*uOilRipple)*uEnergy;
        wpos.xyz+=wN*oil;
        wpos.xyz+=uCursorVel*fall*uOilDrag*uEnergy;
        vOil=(bulge+max(oilRipple,0.0)*0.5)*uEnergy;
        vec4 mv=viewMatrix*wpos;
        gl_Position=projectionMatrix*mv;
        gl_PointSize=uSize*uPR*(1.0/max(0.1,-mv.z));
        vVert=mv.y; vSide=abs(mv.x);
        float depth=pos.z*0.5+0.5;
        float outFade=1.0-smoothstep(0.0,0.92,uOut);
        vAlpha=hole*(0.28+0.32*depth)*(0.38+0.72*lit)*outFade*assembleFade;
      }`,
      fragmentShader: `
      precision highp float;
      uniform vec3 uColTop;uniform vec3 uColBottom;uniform vec3 uColEdge;
      uniform float uBrightness;uniform float uOpacity;uniform float uAppear;uniform float uIri;
      varying float vAlpha;varying float vLit;varying float vVert;varying float vSide;varying float vOil;
      void main(){
        vec2 uv=gl_PointCoord-0.5;
        float d=length(uv);
        if(d>0.5) discard;
        float soft=smoothstep(0.5,0.0,d);
        soft=soft*soft*1.2;
        float core=smoothstep(0.13,0.0,d);
        float vt=clamp(vVert*0.5+0.5,0.0,1.0);
        vec3 col=mix(uColBottom,uColTop,vt);
        col=mix(col,uColEdge,smoothstep(0.72,1.15,vSide));
        col*=(0.78+0.42*vLit);
        col+=smoothstep(0.6,1.0,vLit)*core*vec3(0.45);
        float cap=smoothstep(0.55,1.05,abs(vVert));
        col+=col*cap*1.1;
        float capA=1.0+0.6*cap;
        float oilMask=clamp(vOil,0.0,1.0);
        vec3 iri=0.5+0.5*cos(6.2831853*(vOil*2.4+abs(vVert)*0.3+vec3(0.0,0.33,0.67)));
        col=mix(col,iri,oilMask*uIri);
        col+=oilMask*0.3;
        col*=uBrightness;
        gl_FragColor=vec4(col,soft*vAlpha*capA*uOpacity*uAppear*(1.0+oilMask*0.5));
      }`
    });
    const group = new THREE.Group();
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    group.add(points);
    scene.add(group);
    const centre = new THREE.Vector3(), camLocal = new THREE.Vector3();
    return { render(t, delta) {
      const state = timeline.getState(), progress = timeline.getProgress(), intro = getIntro();
      const handoff = 1 - getOutro();
      u.uTime.value = t;
      u.uPR.value = renderer.getPixelRatio();
      u.uAppear.value = handoff;
      u.uAssemble.value = intro;
      u.uOut.value = orbDissolve(state);
      u.uCore.value = orbCoreOpen(progress);
      points.rotation.y = t * ORB_CONFIG.spin;
      points.rotation.x = Math.sin(t * 0.1) * ORB_CONFIG.tilt;
      const approach = orbApproach(progress);
      group.position.z = PARAMS.orbMoveY * ORB_CONFIG.approach * approach;
      u.uDeform.value = ORB_CONFIG.deform * (1 + approach * ORB_CONFIG.distortGain);
      points.updateMatrixWorld();
      camLocal.copy(camera.position);
      points.worldToLocal(camLocal);
      u.uCamLocal.value.copy(camLocal);
      centre.set(0, group.position.y, 0);
      u.uCentre.value.copy(centre);
      oilPointer.step(camera, pointer, centre, PARAMS.pointerReaction, delta);
      u.uCursor.value.copy(oilPointer.cursor);
      u.uCursorVel.value.copy(oilPointer.velocity);
      u.uEnergy.value = oilPointer.energy;
      group.visible = intro > 1e-3 && handoff > 2e-3 && orbAlpha(state) > 2e-3;
    } };
  })();
  const WOMAN_MIC = [0.08, 0.18, 0.27], WOMAN_CUP = [0.44, 0.26, -0.2];
  function womanPart(x, y, z, nz) {
    const M = WOMAN_MIC, C = WOMAN_CUP;
    if (Math.hypot(x - M[0], y - M[1], z - M[2]) < 0.055) return 3;
    const ax = C[0] - M[0], ay = C[1] - M[1], az = C[2] - M[2], L = ax * ax + ay * ay + az * az;
    const t = Math.min(1, Math.max(0, ((x - M[0]) * ax + (y - M[1]) * ay + (z - M[2]) * az) / L));
    const boom = Math.hypot(x - M[0] - ax * t, y - M[1] - ay * t, z - M[2] - az * t) < 0.035;
    const cup = Math.hypot((x - C[0]) / 0.09, (y - C[1]) / 0.12, (z - C[2]) / 0.12) < 1;
    const e = Math.hypot(x / 0.475, (y - 0.28) / 0.7);
    const band = Math.abs(e - 1) < 0.045 && y > 0.25 && Math.abs(z + 0.17) < 0.12;
    if (boom || cup || band) return 2;
    if (y > 0.08 && y < 0.78 && Math.abs(x) < 0.34 && z > 0 && nz > 0.2) return 1;
    return 0;
  }
  let perfN = 0, LITE = false;
  const perfAcc = [];
  function perfSample(dt) {
    if (LITE || perfN > 150 || window.__hlabNoLite) return;
    perfN++;
    if (perfN <= 30) return;
    perfAcc.push(dt);
    if (perfAcc.length === 110) {
      perfAcc.sort((a, b) => a - b);
      if (perfAcc[55] > 1 / 30) {
        LITE = true;
        DPR_SCALE = 0.8;
        resize();
        Galaxy.setLite(true);
        if (Brain.setLite) Brain.setLite(true);
      }
    }
  }
  function buildWomanGeometry(buffer, count, radius) {
    const mesh = decodeBrainMesh(buffer);
    const verts = mesh.positions, indices = mesh.indices, triCount = indices.length / 3, F = WOMAN_CONFIG;
    const vOff = 16 + verts.length * 2 + indices.length * 2 + 4;
    const triVis = buffer.byteLength >= vOff + triCount ? new Uint8Array(buffer, vOff, triCount) : null;
    const cOff = vOff + triCount + 4, vCount = verts.length / 3;
    const crv = buffer.byteLength >= cOff + vCount ? new Int8Array(buffer, cOff, vCount) : new Int8Array(vCount);
    const cdf = new Float32Array(triCount), nrm = new Float32Array(triCount * 3);
    let total = 0, area = 0;
    for (let t = 0; t < triCount; t++) {
      const a = indices[t * 3] * 3, b = indices[t * 3 + 1] * 3, c = indices[t * 3 + 2] * 3;
      const ux = verts[b] - verts[a], uy = verts[b + 1] - verts[a + 1], uz = verts[b + 2] - verts[a + 2];
      const vx = verts[c] - verts[a], vy = verts[c + 1] - verts[a + 1], vz = verts[c + 2] - verts[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, len = Math.hypot(nx, ny, nz) || 1;
      nrm[t * 3] = nx / len;
      nrm[t * 3 + 1] = ny / len;
      nrm[t * 3 + 2] = nz / len;
      const cx = (verts[a] + verts[b] + verts[c]) / 3, cy = (verts[a + 1] + verts[b + 1] + verts[c + 1]) / 3, cz = (verts[a + 2] + verts[b + 2] + verts[c + 2]) / 3;
      const face = smoothstep(F.faceLow, F.faceLow + 0.08, cy) * (1 - smoothstep(F.faceHigh - 0.08, F.faceHigh, cy)) * smoothstep(-0.05, 0.08, cz) * smoothstep(0.1, 0.4, nz / len) * (1 - smoothstep(0.32, 0.42, Math.abs(cx)));
      const ridge = (Math.abs(crv[indices[t * 3]]) + Math.abs(crv[indices[t * 3 + 1]]) + Math.abs(crv[indices[t * 3 + 2]])) / 381;
      area += len * 0.5;
      total += len * 0.5 * (1 + F.faceBoost * face) * (1 + F.curvBoost * ridge);
      cdf[t] = total;
    }
    for (let t = 0; t < triCount; t++) cdf[t] /= total;
    const vn = new Float32Array(verts.length);
    for (let t = 0; t < triCount; t++) {
      const ar = t ? cdf[t] - cdf[t - 1] : cdf[0];
      for (let j = 0; j < 3; j++) {
        const i = indices[t * 3 + j] * 3;
        for (let k = 0; k < 3; k++) vn[i + k] += nrm[t * 3 + k] * ar;
      }
    }
    for (let i = 0; i < vn.length; i += 3) {
      const l = Math.hypot(vn[i], vn[i + 1], vn[i + 2]) || 1;
      vn[i] /= l;
      vn[i + 1] /= l;
      vn[i + 2] /= l;
    }
    const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3), vis = new Float32Array(count), curv = new Float32Array(count), parts = new Float32Array(count);
    const minD = Math.sqrt(area * radius * radius / count) * F.spacing, minD2 = minD * minD, inv = 1 / minD;
    const HS = 1 << 20, head = new Int32Array(HS).fill(-1), nextIdx = new Int32Array(count);
    const hash = (x, y, z) => (x * 73856093 ^ y * 19349663 ^ z * 83492791) >>> 0 & HS - 1;
    const cand = Math.round(count * F.oversample), tmpP = [0, 0, 0], tmpN = [0, 0, 0];
    let n = 0, tries = 0;
    while (n < count && tries < cand * 2) {
      tries++;
      const pick = Math.random();
      let lo = 0, hi = triCount - 1;
      while (lo < hi) {
        const mid = lo + hi >> 1;
        if (cdf[mid] < pick) lo = mid + 1;
        else hi = mid;
      }
      const a = indices[lo * 3] * 3, b = indices[lo * 3 + 1] * 3, c = indices[lo * 3 + 2] * 3;
      let u = Math.random(), v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const w = 1 - u - v;
      for (let k = 0; k < 3; k++) {
        tmpP[k] = (w * verts[a + k] + u * verts[b + k] + v * verts[c + k]) * radius;
        tmpN[k] = w * vn[a + k] + u * vn[b + k] + v * vn[c + k];
      }
      const cx = Math.floor(tmpP[0] * inv), cy = Math.floor(tmpP[1] * inv), cz = Math.floor(tmpP[2] * inv);
      const nlen = Math.hypot(tmpN[0], tmpN[1], tmpN[2]) || 1;
      const part = womanPart(tmpP[0] / radius, tmpP[1] / radius, tmpP[2] / radius, tmpN[2] / nlen);
      const lim2 = part === 1 ? minD2 * F.faceSpacing * F.faceSpacing : minD2;
      let ok = tries > cand;
      if (!ok) {
        ok = true;
        for (let dx = -1; dx <= 1 && ok; dx++) for (let dy = -1; dy <= 1 && ok; dy++) for (let dz = -1; dz <= 1 && ok; dz++) {
          for (let q = head[hash(cx + dx, cy + dy, cz + dz)]; q >= 0; q = nextIdx[q]) {
            const ex = positions[q * 3] - tmpP[0], ey = positions[q * 3 + 1] - tmpP[1], ez = positions[q * 3 + 2] - tmpP[2];
            if (ex * ex + ey * ey + ez * ez < lim2) {
              ok = false;
              break;
            }
          }
        }
      }
      if (!ok) continue;
      positions[n * 3] = tmpP[0];
      positions[n * 3 + 1] = tmpP[1];
      positions[n * 3 + 2] = tmpP[2];
      const nl = Math.hypot(tmpN[0], tmpN[1], tmpN[2]) || 1;
      normals[n * 3] = tmpN[0] / nl;
      normals[n * 3 + 1] = tmpN[1] / nl;
      normals[n * 3 + 2] = tmpN[2] / nl;
      vis[n] = triVis ? triVis[lo] / 255 : 1;
      curv[n] = (w * crv[a / 3] + u * crv[b / 3] + v * crv[c / 3]) / 127;
      parts[n] = part;
      const h = hash(cx, cy, cz);
      nextIdx[n] = head[h];
      head[h] = n;
      n++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aNormal", new THREE.BufferAttribute(normals, 3));
    g.setAttribute("aVis", new THREE.BufferAttribute(vis, 1));
    g.setAttribute("aCurv", new THREE.BufferAttribute(curv, 1));
    g.setAttribute("aPart", new THREE.BufferAttribute(parts, 1));
    return g;
  }
  const Galaxy = (() => {
    const count = Math.round(PARAMS.brainCount * WOMAN_CONFIG.density);
    const bin = new Uint8Array(MESHES.woman);
    const geo = buildWomanGeometry(bin.buffer, count, WOMAN_CONFIG.radius);
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
    geo.setAttribute("aRnd", new THREE.BufferAttribute(rnd, 4));
    const R = WOMAN_CONFIG.radius, W0 = WOMAN_CONFIG;
    const u = {
      uTime: { value: 0 },
      uAppear: { value: 0 },
      uFade: { value: 1 },
      uBlow: { value: 0 },
      uAssemble: { value: 1 },
      uColEdge: { value: linVec(GALAXY_CONFIG.colorEdge) },
      uColCore: { value: linVec(GALAXY_CONFIG.colorCore) },
      uColTop: { value: linVec(ORB_CONFIG.colorTop) },
      uColBottom: { value: linVec(ORB_CONFIG.colorBottom) },
      uColRim: { value: linVec(ORB_CONFIG.colorEdge) },
      uSynapse: { value: linVec(BRAIN_CONFIG.colorSynapse) },
      uOpacity: { value: W0.opacity },
      uOpacityScatter: { value: W0.opacityScatter },
      uSize: { value: GALAXY_CONFIG.pointSize },
      uBrightness: { value: GALAXY_CONFIG.brightness },
      uScale: { value: GALAXY_CONFIG.scale },
      uCursor: { value: new THREE.Vector3() },
      uRepelRadius: { value: W0.pointerRadius },
      uRepelStrength: { value: W0.pointerStrength },
      uActivity: { value: 0 },
      uR: { value: R },
      uLightDir: { value: new THREE.Vector3(...W0.light).normalize() },
      uAmbient: { value: W0.ambient },
      uBackDim: { value: W0.backDim },
      uOcc: { value: W0.occlusion },
      uDpr: { value: renderer.getPixelRatio() },
      uPx: { value: W0.px },
      uZRef: { value: W0.zRef },
      uDeform: { value: W0.deform },
      uNoise: { value: W0.noiseScale },
      uFlowAmount: { value: W0.flowAmount },
      uFlowSpeed: { value: W0.flowSpeed },
      uSynRate: { value: W0.synapseRate },
      uWisp: { value: W0.wisp },
      uWispDist: { value: W0.wispDist },
      uWispSpeed: { value: W0.wispSpeed },
      uBottomFade: { value: W0.bottomFade },
      uColHead: { value: linVec(W0.headColor) },
      uHeadAmt: { value: W0.headAmt },
      uFaceDim: { value: W0.faceDim },
      uSweepY: { value: -2 },
      uSweepAmt: { value: 0 },
      uMic: { value: new THREE.Vector3(...WOMAN_MIC) },
      uPulse: { value: W0.pulse },
      uPulseAmt: { value: W0.pulseAmt },
      uOrigin: { value: new THREE.Vector3() },
      uOrbR: { value: ORB_CONFIG.radius * W0.orbR / GALAXY_CONFIG.scale },
      uHandIn: { value: 0 },
      uHandOut: { value: 0 },
      uHandFade: { value: 1 },
      uBrainR: { value: BRAIN_CONFIG.radius * 0.9 / GALAXY_CONFIG.scale },
      uCurvFace: { value: W0.curvFace },
      uRipK: { value: W0.ripK },
      uRipS: { value: W0.ripS },
      uRipAmp: { value: W0.ripAmp },
      uTrail: { value: 0 },
      uTrailAlpha: { value: 1 }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
      attribute vec3 aNormal;attribute vec4 aRnd;attribute float aVis;attribute float aCurv;attribute float aPart;
      uniform vec3 uColHead;uniform float uHeadAmt;uniform float uFaceDim;uniform float uSweepY;uniform float uSweepAmt;uniform vec3 uMic;uniform float uPulse;uniform float uPulseAmt;
      uniform vec3 uOrigin;uniform float uOrbR;uniform float uHandIn;uniform float uHandOut;uniform float uHandFade;uniform float uBrainR;
      uniform float uCurvFace;uniform float uRipK;uniform float uRipS;uniform float uRipAmp;uniform float uTrail;
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
        /* hand-off in: most points start on the orb's shell, where the orb was */
        vec3 sdir=normalize(vec3(gRnd2,gRnd3,gRnd1)-0.5+0.0001);
        float fromOrb=uHandIn*step(gRnd2,0.7);
        spawn=mix(spawn,uOrigin+sdir*uOrbR*(0.92+0.16*gRnd4),fromOrb);
        galaxyPos=mix(spawn,galaxyPos,aEase);
        float blowEff=max(uBlow-uTrail,0.0);   // trail copies run a little behind
        galaxyPos+=blowDir*blowEff*90.0;
        /* hand-off out: a quarter of the points gather where the brain forms */
        float toBrain=step(gRnd3,0.25)*smoothstep(0.35,0.9,blowEff)*uHandOut;
        vec3 bdir=normalize(vec3(gRnd4,gRnd1,gRnd2)-0.5+0.0001);
        galaxyPos=mix(galaxyPos,uOrigin+bdir*uBrainR*pow(gRnd2,0.33),toBrain);
        vec3 finalPos=galaxyPos*uScale;
        vec4 modelPosition=modelMatrix*vec4(finalPos,1.0);
        vec3 n=normalize(mat3(modelMatrix)*nrm);
        /* hover: the galaxy's push plus ripples spreading out from the cursor */
        vec3 toP=modelPosition.xyz-uCursor;
        float cd=length(toP);
        float fall=smoothstep(uRepelRadius,0.0,cd);
        float rip=sin(cd*uRipK-uTime*uRipS)*fall;
        modelPosition.xyz+=normalize(toP+vec3(0.0001))*fall*uRepelStrength*uActivity+n*rip*uRipAmp*uActivity;
        float vRip=max(rip,0.0)*uActivity;
        vec4 mvPosition=viewMatrix*modelPosition;
        float form=aEase*(1.0-uBlow);
        /* formed colour, orb style: bottom blue -> top turquoise, deep blue at the silhouette,
           crests lit; hidden layers and the far side drop away so the front reads crisp */
        vec3 v=normalize(cameraPosition-modelPosition.xyz);
        float facing=dot(n,v);
        float vt=clamp(q.y*0.55+0.55+(gRnd2-0.5)*0.12,0.0,1.0);
        vec3 col=mix(uColBottom,uColTop,vt);
        col=mix(col,uColRim,smoothstep(0.45,0.95,1.0-abs(facing))*0.7);
        col*=(0.78+0.42*lit)*mix(uAmbient,1.0,max(dot(n,uLightDir),0.0)*0.6+0.4);
        float isFace=step(0.5,aPart)*step(aPart,1.5), isHead=step(1.5,aPart)*step(aPart,2.5), isMic=step(2.5,aPart);
        col*=max(0.15,1.0+uCurvFace*aCurv*isFace);                // face: creases (eyes, smile) fall darker so features read
        col=mix(col,uColHead*(0.8+0.4*lit),isHead*uHeadAmt);   // headset: darker steel blue, reads as an object
        col=mix(col,uColTop*1.15,isMic);                         // mic tip: small turquoise light
        float sweep=exp(-pow((q.y-uSweepY)/0.07,2.0))*uSweepAmt; // light sweep up the body
        col+=uColTop*sweep*1.1;
        float pt=fract(uTime/uPulse);                            // signal rings from the mic
        float ring=exp(-pow((length(q-uMic)-pt*1.5)/0.04,2.0))*(1.0-pt)*uPulseAmt*(1.0-isHead);
        col+=uColTop*ring*1.3;
        col+=uColTop*vRip*0.8;
        float vis=mix(1.0,aVis,uOcc)*mix(uBackDim,1.0,smoothstep(-0.2,0.2,facing));
        /* brain-style synapse sparkles on a few points */
        float period=mix(3.0,9.0,gRnd3);
        float ft=mod(uTime+gRnd1*period,period);
        float fire=pow(clamp(1.0-ft/0.4,0.0,1.0),2.5)*step(gRnd4,uSynRate);
        /* scattered colour = the galaxy's own mix */
        float galaxyR=pow(gRnd1,2.0)*60.0+pow(gRnd2,3.0)*30.0;
        vec3 scattered=mix(uColEdge,uColCore,smoothstep(80.0,0.0,galaxyR));
        vColor=mix(scattered,col,form);
        vSpark=fire*form*(1.0-isHead); vLit=lit*form*(1.0-isFace*0.75)*(1.0-isHead);   // no white cores washing out the face
        float isOrb=step(0.98,fract(gRnd1*77.77))*(1.0-form);
        float starSize=mix(1.0,3.0,isOrb);
        vFade=mix(0.7,1.0,isOrb);
        vFade*=mix(1.0,(1.0-life)*smoothstep(0.0,0.12,life),wisp*form);
        vFade*=mix(1.0,smoothstep(-1.0,-1.0+uBottomFade,q.y)*vis*(0.38+0.72*lit)*mix(1.0,uFaceDim,isFace)*(1.0+isHead*0.2+isMic*0.15),form);
        vFade*=1.0-toBrain*(1.0-uHandFade);
        vForm=form; vAlpha=mix(uOpacityScatter,uOpacity,form)*mix(1.0,mix(0.22,1.0,aEase),fromOrb);   // faint while still on the orb's shell
        /* size: the galaxy's formula while scattered; true device pixels while formed (crisp on retina) */
        float galaxySize=uSize*starSize*(10.0/-mvPosition.z)*(1.0-toBrain*0.5);
        float formedSize=uPx*uDpr*(uZRef/-mvPosition.z)*(1.0+fire*0.9);
        gl_PointSize=max(mix(galaxySize,formedSize,form),1.5);
        gl_Position=projectionMatrix*mvPosition;
      }`,
      fragmentShader: `
      uniform float uBrightness;uniform float uAppear;uniform float uFade;uniform vec3 uSynapse;uniform float uTrailAlpha;
      varying float vFade;varying vec3 vColor;varying float vForm;varying float vAlpha;varying float vSpark;varying float vLit;
      void main(){
        vec2 xy=gl_PointCoord-0.5;
        float ll=length(xy);
        if(ll>0.5) discard;
        /* formed: the brain's sharply peaked dot with a small bright core; galaxy sprite while scattered */
        float soft=pow(smoothstep(0.5,0.0,ll),2.2);
        float core=smoothstep(0.13,0.0,ll);
        float a=mix(smoothstep(0.5,0.1,ll),soft+core*0.3,vForm);
        vec3 col=vColor+core*vForm*(vec3(0.45)*smoothstep(0.5,1.0,vLit)+vec3(0.12));
        col+=uSynapse*vSpark*2.0*(soft+core);
        gl_FragColor=vec4(col*uBrightness,vFade*a*vAlpha*uAppear*uFade*(1.0+vSpark)*uTrailAlpha);
      }`
    });
    const group = new THREE.Group();
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    group.add(points);
    scene.add(group);
    const trails = W0.trails.map(([lag, alpha]) => {
      const m = new THREE.ShaderMaterial({
        uniforms: { ...u, uTrail: { value: lag }, uTrailAlpha: { value: alpha } },
        vertexShader: mat.vertexShader,
        fragmentShader: mat.fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const tp = new THREE.Points(geo, m);
      tp.frustumCulled = false;
      tp.visible = false;
      group.add(tp);
      return tp;
    });
    let lite = false;
    const origin = new THREE.Vector3(), faceW = new THREE.Vector3(), faceNdc = new THREE.Vector3();
    let glowChars = null, glowRects = [], glowFrame = 0, glowW = 0, glowH = 0;
    const cursor = new THREE.Vector3(), cursorTarget = new THREE.Vector3(), ndc = new THREE.Vector3(), rayDir = new THREE.Vector3();
    const loc = new THREE.Vector3(), qInv = new THREE.Quaternion();
    const S = GALAXY_CONFIG.scale, W = WOMAN_CONFIG;
    const MASK = 32, mask = new Float32Array(MASK * MASK);
    {
      const pa = geo.attributes.position.array;
      for (let i = 0; i < pa.length; i += 3) {
        const gx = Math.floor((pa[i] / R * 0.5 + 0.5) * MASK), gy = Math.floor((pa[i + 1] / R * 0.5 + 0.5) * MASK);
        if (gx >= 0 && gx < MASK && gy >= 0 && gy < MASK) mask[gy * MASK + gx] = 1;
      }
      const src = mask.slice();
      for (let y = 0; y < MASK; y++) for (let x = 0; x < MASK; x++) {
        let sum = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && xx < MASK && yy >= 0 && yy < MASK) {
            sum += src[yy * MASK + xx];
            n++;
          }
        }
        mask[y * MASK + x] = sum / n;
      }
    }
    const maskAt = (x, y) => x < 0 || y < 0 || x >= MASK || y >= MASK ? 0 : mask[y * MASK + x];
    const hoverAt = (nx, ny) => {
      const fx = (nx * 0.5 + 0.5) * MASK - 0.5, fy = (ny * 0.5 + 0.5) * MASK - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      return lerp(lerp(maskAt(x0, y0), maskAt(x0 + 1, y0), tx), lerp(maskAt(x0, y0 + 1), maskAt(x0 + 1, y0 + 1), tx), ty);
    };
    const spring = (st, target, dt) => {
      const k = W.springK, c = 2 * Math.sqrt(k);
      st[1] += ((target - st[0]) * k - st[1] * c) * dt;
      st[0] += st[1] * dt;
      return st[0];
    };
    const sRY = [0, 0], sRX = [W.tilt, 0], sX = [0, 0], sY = [0, 0];
    let hover = 0;
    const camPush = (p) => smoothstep(0.55, 1.55, p), camPull = (p) => smoothstep(1.55, 2.05, p);
    return {
      camZ(p) {
        return GALAXY_CONFIG.cameraZ - W.camPush * camPush(p) + W.camPull * camPull(p);
      },
      lookY(p) {
        return (group.position.y + W.faceY * R * S) * W.camLook * camPush(p) * (1 - 0.5 * camPull(p));
      },
      setLite(on) {
        lite = on;
        geo.setDrawRange(0, on ? Math.floor(count * 0.65) : Infinity);
      },
      render(t, delta) {
        const state = timeline.getState(), progress = timeline.getProgress();
        const appear = galaxyAppear(state), blow = galaxyBlow(state), assemble = galaxyAssemble(state);
        u.uTime.value = t;
        u.uAppear.value = appear;
        u.uBlow.value = blow;
        u.uFade.value = 1 - blow;
        u.uAssemble.value = assemble;
        const live = PARAMS.pointerReaction && pointerHas;
        const follow = live ? 1 - W.hoverCalm * hover : 0;
        const dt = Math.min(delta, 0.05);
        const ry = spring(sRY, Math.sin(t * W.turnSpeed) * W.turn * (live ? 0.5 : 1) + pointer.x * W.followYaw * follow, dt);
        const rx = spring(sRX, W.tilt - pointer.y * W.followPitch * follow, dt);
        const px = spring(sX, pointer.x * W.followShift * follow, dt);
        const py = spring(sY, pointer.y * W.followShift * 0.6 * follow, dt);
        group.rotation.set(rx, ry, 0);
        group.position.set(px, lerp(W.restY, -W.faceY * R * S, smoothstep(0, 0.7, blow)) + py, 0);
        const planeZ = W.cursorPlaneZ * R * S;
        cursorTarget.set(0, 0, planeZ);
        if (PARAMS.pointerReaction) {
          ndc.set(pointer.x, pointer.y, 0.5).unproject(camera);
          rayDir.copy(ndc).sub(camera.position).normalize();
          if (Math.abs(rayDir.z) > 1e-4) {
            const tt = (planeZ - camera.position.z) / rayDir.z;
            if (tt > 0 && Number.isFinite(tt)) cursorTarget.copy(camera.position).addScaledVector(rayDir, tt);
          }
        }
        cursor.lerp(cursorTarget, 0.12);
        u.uCursor.value.copy(cursor);
        loc.copy(cursorTarget).sub(group.position).applyQuaternion(qInv.copy(group.quaternion).invert()).divideScalar(R * S);
        const over = live && blow < 0.02 ? smoothstep(0.3, 0.7, hoverAt(loc.x, loc.y)) : 0;
        hover += (over - hover) * Math.min(1, delta * 5);
        u.uActivity.value = hover;
        group.visible = (appear > 1e-3 || assemble < 0.999) && blow < 0.999;
        u.uDpr.value = renderer.getPixelRatio();
        group.updateMatrixWorld();
        origin.set(0, 0, 0);
        group.worldToLocal(origin);
        u.uOrigin.value.copy(origin).divideScalar(S);
        u.uHandFade.value = 1 - brainAppear(progress);
        const st = clamp01((progress - 0.95) / 0.6), idle = t % W.sweepEvery / 1.6;
        const once = Math.sin(Math.PI * st) * W.sweepAmt, rep2 = idle < 1 ? Math.sin(Math.PI * idle) * W.sweepAmt * 0.45 : 0;
        if (once >= rep2) {
          u.uSweepY.value = lerp(-1.2, 1.3, st);
          u.uSweepAmt.value = once;
        } else {
          u.uSweepY.value = lerp(-1.2, 1.3, idle);
          u.uSweepAmt.value = rep2;
        }
        const trailsOn = !lite && PARAMS.bloom && blow > 0.01 && blow < 0.999;
        for (const tp of trails) tp.visible = trailsOn;
        const shine = appear * (1 - blow) * (1 - assemble);
        if (++glowFrame % 2 === 0) {
          faceW.set(0, W.faceY * R * S, W.faceZ * R * S);
          group.localToWorld(faceW);
          faceNdc.copy(faceW).project(camera);
          emit("glow", { x: faceNdc.x * 0.5 + 0.5, y: -faceNdc.y * 0.5 + 0.5, shine, sweep: u.uSweepAmt.value });
        }
      }
    };
  })();
  function decodeBrainMesh(buffer) {
    const view = new DataView(buffer);
    const MAGIC = 1314013782, HEADER_BYTES = 16, QUANT = 32767;
    if (view.getUint32(0, true) !== MAGIC) throw new Error("brain mesh: bad magic");
    if (view.getUint32(4, true) !== 1) throw new Error("brain mesh: bad version");
    const vertexCount = view.getUint32(8, true), indexCount = view.getUint32(12, true);
    const quant = new Int16Array(buffer, HEADER_BYTES, vertexCount * 3);
    const positions = new Float32Array(vertexCount * 3);
    for (let i = 0; i < positions.length; i++) positions[i] = quant[i] / QUANT;
    const indexBase = HEADER_BYTES + vertexCount * 3 * 2;
    const indices = new Uint16Array(buffer.slice(indexBase, indexBase + indexCount * 2));
    return { positions, indices };
  }
  function buildBrainGeometry(mesh, count, radius) {
    const verts = mesh.positions, indices = mesh.indices, triCount = indices.length / 3;
    const cdf = new Float32Array(triCount);
    let total = 0;
    for (let t = 0; t < triCount; t++) {
      const a = indices[t * 3] * 3, b = indices[t * 3 + 1] * 3, c = indices[t * 3 + 2] * 3;
      const ux = verts[b] - verts[a], uy = verts[b + 1] - verts[a + 1], uz = verts[b + 2] - verts[a + 2];
      const vx = verts[c] - verts[a], vy = verts[c + 1] - verts[a + 1], vz = verts[c + 2] - verts[a + 2];
      total += Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) * 0.5;
      cdf[t] = total;
    }
    for (let t = 0; t < triCount; t++) cdf[t] /= total;
    const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3);
    const seeds = new Float32Array(count), occl = new Float32Array(count);
    for (let s = 0; s < count; s++) {
      const pick = Math.random();
      let lo = 0, hi = triCount - 1;
      while (lo < hi) {
        const mid = lo + hi >> 1;
        if (cdf[mid] < pick) lo = mid + 1;
        else hi = mid;
      }
      const a = indices[lo * 3] * 3, b = indices[lo * 3 + 1] * 3, c = indices[lo * 3 + 2] * 3;
      let u = Math.random(), v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      const w = 1 - u - v;
      positions[s * 3] = (w * verts[a] + u * verts[b] + v * verts[c]) * radius;
      positions[s * 3 + 1] = (w * verts[a + 1] + u * verts[b + 1] + v * verts[c + 1]) * radius;
      positions[s * 3 + 2] = (w * verts[a + 2] + u * verts[b + 2] + v * verts[c + 2]) * radius;
      const e1x = verts[b] - verts[a], e1y = verts[b + 1] - verts[a + 1], e1z = verts[b + 2] - verts[a + 2];
      const e2x = verts[c] - verts[a], e2y = verts[c + 1] - verts[a + 1], e2z = verts[c + 2] - verts[a + 2];
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      const len = Math.hypot(nx, ny, nz) || 1;
      normals[s * 3] = nx / len;
      normals[s * 3 + 1] = ny / len;
      normals[s * 3 + 2] = nz / len;
      seeds[s] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aNormal", new THREE.BufferAttribute(normals, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    g.setAttribute("aOcclusion", new THREE.BufferAttribute(occl, 1));
    return g;
  }
  const Brain = (() => {
    const count = PARAMS.brainCount, radius = BRAIN_CONFIG.radius;
    const bin = new Uint8Array(MESHES.brain);
    const mesh = decodeBrainMesh(bin.buffer);
    const geo = buildBrainGeometry(mesh, count, radius);
    const u = {
      iTime: { value: 0 },
      iAlpha: { value: 0 },
      iResolutionY: { value: window.innerHeight * renderer.getPixelRatio() },
      uCool: { value: linVec(BRAIN_CONFIG.colorCool) },
      uWarm: { value: linVec(BRAIN_CONFIG.colorWarm) },
      uEdgeColor: { value: linVec(BRAIN_CONFIG.colorEdge) },
      uCenterColor: { value: linVec(BRAIN_CONFIG.colorCenter) },
      uSynapse: { value: linVec(BRAIN_CONFIG.colorSynapse) },
      uDeepColor: { value: linVec(BRAIN_CONFIG.colorDeep) },
      uCursorColor: { value: linVec(BRAIN_CONFIG.colorCursor) },
      uHighlightColor: { value: linVec("#22808A") },
      uCenterRadius: { value: BRAIN_CONFIG.centerRadius },
      uCenterFalloff: { value: BRAIN_CONFIG.centerFalloff },
      uSize: { value: BRAIN_CONFIG.size },
      uSynapseRate: { value: BRAIN_CONFIG.synapseRate },
      uFlowSpeed: { value: BRAIN_CONFIG.flowSpeed },
      uFlowAmount: { value: BRAIN_CONFIG.flowAmount },
      uGlow: { value: BRAIN_CONFIG.glow },
      uDepthDarkness: { value: BRAIN_CONFIG.depthDarkness },
      uOcclusionStrength: { value: 0 },
      uHighlightPos: { value: new THREE.Vector3() },
      uHighlightRadius: { value: 0.6 },
      uHighlightStrength: { value: 0 },
      uFocusFadeStrength: { value: 0.55 },
      uIsolateStrength: { value: 0.88 },
      uExplode: { value: 1 },
      uExplodeDist: { value: 5 },
      uMouse: { value: new THREE.Vector2(-10, -10) },
      uCursor: { value: 0 },
      uAspect: { value: 1 },
      uCursorRadius: { value: 0.1 }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
      attribute float aSeed;attribute float aOcclusion;attribute vec3 aNormal;
      uniform float iTime;uniform float iResolutionY;uniform float uSize;uniform float uSynapseRate;
      uniform float uCenterRadius;uniform float uFlowSpeed;uniform float uFlowAmount;
      uniform vec3 uHighlightPos;uniform float uHighlightRadius;uniform float uHighlightStrength;
      uniform float uExplode;uniform float uExplodeDist;
      uniform vec2 uMouse;uniform float uCursor;uniform float uAspect;uniform float uCursorRadius;
      varying float vSeed;varying float vSynapse;varying float vHemi;varying float vDepth;
      varying float vFrontness;varying float vCenterness;varying float vOcclusion;varying float vHighlight;
      varying float vFar;varying float vCursor;varying vec3 vWorldPos;
      void main(){
        vSeed=aSeed; vOcclusion=aOcclusion;
        vec3 p=position; vWorldPos=p; vHemi=step(0.0,p.x);
        vHighlight=(1.0-smoothstep(0.0,uHighlightRadius,distance(position,uHighlightPos)))*uHighlightStrength;
        vec3 focalDir=normalize(uHighlightPos+vec3(1e-5));
        float align=dot(normalize(position+vec3(1e-5)),focalDir);
        vFar=smoothstep(0.55,-0.35,align);
        vec3 rad=normalize(p+vec3(1e-5));
        float breathe=sin(iTime*1.6+aSeed*6.0)*0.012;
        p+=rad*breathe;
        vec3 nrm=normalize(aNormal+vec3(1e-5));
        vec3 ref=abs(nrm.y)<0.95?vec3(0.0,1.0,0.0):vec3(1.0,0.0,0.0);
        vec3 tA=normalize(cross(nrm,ref));
        vec3 tB=cross(nrm,tA);
        float ph=iTime*uFlowSpeed+aSeed*6.2831;
        vec3 loopDir=tA*cos(ph)+tB*sin(ph);
        p+=loopDir*uFlowAmount;
        vec3 exDir=normalize(rad+vec3(sin(aSeed*41.0),cos(aSeed*57.0),sin(aSeed*73.0))*0.45);
        p+=exDir*uExplode*uExplodeDist;
        float period=mix(3.0,9.0,aSeed);
        float firePhase=aSeed*period;
        float ft=mod(iTime+firePhase,period);
        float fire=pow(clamp(1.0-ft/0.4,0.0,1.0),2.5);
        if(aSeed>uSynapseRate) fire=0.0;
        vSynapse=fire;
        vec4 mv=modelViewMatrix*vec4(p,1.0);
        vec4 centerMv=modelViewMatrix*vec4(0.0,0.0,0.0,1.0);
        float rel=centerMv.z-mv.z;
        vFrontness=clamp(rel*0.6+0.5,0.0,1.0);
        gl_Position=projectionMatrix*mv;
        vec4 centerClip=projectionMatrix*centerMv;
        vec2 centerNDC=centerClip.xy/max(0.0001,centerClip.w);
        vec2 pNDC=gl_Position.xy/max(0.0001,gl_Position.w);
        float screenDist=length(pNDC-centerNDC);
        vCenterness=1.0-clamp(screenDist/max(0.05,uCenterRadius),0.0,1.0);
        vec2 dMouse=pNDC-uMouse; dMouse.x*=uAspect;
        vCursor=(1.0-smoothstep(0.0,uCursorRadius,length(dMouse)))*uCursor;
        float baseSize=uSize*(iResolutionY/720.0)*(200.0/-mv.z);
        gl_PointSize=baseSize*(1.0+fire*0.8+vHighlight*1.8+vCursor*1.3);
        vDepth=-mv.z;
      }`,
      fragmentShader: `
      uniform vec3 uCool;uniform vec3 uWarm;uniform vec3 uEdgeColor;uniform vec3 uCenterColor;
      uniform float uCenterFalloff;uniform vec3 uSynapse;uniform float iAlpha;uniform float uGlow;
      uniform float uDepthDarkness;uniform vec3 uDeepColor;uniform float uOcclusionStrength;
      uniform vec3 uHighlightColor;uniform float uHighlightStrength;uniform float uFocusFadeStrength;
      uniform float uIsolateStrength;uniform float uExplode;uniform vec3 uCursorColor;
      varying float vSeed;varying float vSynapse;varying float vHemi;varying float vDepth;
      varying float vFrontness;varying float vCenterness;varying float vOcclusion;varying float vHighlight;
      varying float vFar;varying float vCursor;varying vec3 vWorldPos;
      void main(){
        vec2 p=gl_PointCoord-0.5;
        float r=length(p);
        if(r>0.5) discard;
        float core=pow(smoothstep(0.5,0.0,r),2.2);
        float t=pow(vCenterness,max(0.05,uCenterFalloff));
        float vt=clamp(smoothstep(-0.7,0.9,vWorldPos.y)+vSeed*0.12,0.0,1.0);
        vec3 grad=mix(uCool,uWarm,vt);
        vec3 base=mix(grad,uCenterColor,t);
        base=mix(base,uEdgeColor,(1.0-t)*0.18);
        base=mix(base,uDeepColor,clamp(vOcclusion*uOcclusionStrength,0.0,1.0));
        vec3 col=base+uSynapse*vSynapse*2.0;
        col=mix(col,uHighlightColor,vHighlight*0.5);
        col+=uHighlightColor*vHighlight*0.7;
        float nonFocus=(1.0-vHighlight)*uHighlightStrength;
        col=mix(col,uDeepColor,nonFocus*uIsolateStrength);
        float depthMul=mix(1.0-uDepthDarkness,1.0,vFrontness);
        col*=depthMul;
        float alphaOut=core*iAlpha*mix(1.0-uDepthDarkness*0.7,1.0,vFrontness);
        alphaOut*=1.0+vHighlight*0.8;
        float focusDim=1.0-uHighlightStrength*uFocusFadeStrength*vFar;
        col*=focusDim; alphaOut*=focusDim;
        col+=uCursorColor*vCursor*0.8;
        alphaOut+=vCursor*core*0.32;
        alphaOut*=1.0-smoothstep(0.0,1.0,uExplode)*0.8;
        gl_FragColor=vec4(col*uGlow,alphaOut);
      }`
    });
    const group = new THREE.Group();
    group.visible = false;
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    group.add(points);
    scene.add(group);
    const par = { ry: 0, rx: 0 };
    return { setLite(on) {
      geo.setDrawRange(0, on ? Math.floor(count * 0.6) : Infinity);
    }, render(t) {
      const progress = timeline.getProgress(), appear = brainAppear(progress), o = getOutro();
      const exit = smoothstep(0.12, 1, o);
      u.iTime.value = t;
      u.iAlpha.value = appear * (1 - smoothstep(0.55, 1, o));
      u.uExplode.value = Math.max(1 - appear, exit);
      group.position.z = exit * BRAIN_CONFIG.approach;
      u.iResolutionY.value = window.innerHeight * renderer.getPixelRatio();
      u.uAspect.value = window.innerWidth / Math.max(1, window.innerHeight);
      u.uCursorRadius.value = clamp(0.1 * 4.6 / camera.position.length(), 0.04, 0.13);
      if (PARAMS.pointerReaction) {
        u.uMouse.value.x += (pointer.x - u.uMouse.value.x) * 0.18;
        u.uMouse.value.y += (pointer.y - u.uMouse.value.y) * 0.18;
      }
      const cursorTarget = PARAMS.pointerReaction ? 1 : 0;
      u.uCursor.value += (cursorTarget - u.uCursor.value) * 0.1;
      const spin = clamp((progress - 2.7) / 1.3, 0, 1) * BRAIN_CONFIG.scrollSpin;
      const cursor = u.uCursor.value;
      const targetRy = clamp(pointer.x, -1, 1) * BRAIN_CONFIG.cursorTilt * cursor;
      const targetRx = -clamp(pointer.y, -1, 1) * BRAIN_CONFIG.cursorTilt * 0.65 * cursor;
      par.ry += (targetRy - par.ry) * 0.05;
      par.rx += (targetRx - par.rx) * 0.05;
      group.rotation.y = BRAIN_CONFIG.baseRotationY + spin + par.ry;
      group.rotation.x = par.rx;
      group.visible = appear > 1e-3 && o < 0.998;
    } };
  })();
  const Atmosphere = (() => {
    const N = PARAMS.atmoCount;
    const positions = new Float32Array(N * 3), sizes = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      positions[i * 3] = 2 * Math.random() - 1;
      positions[i * 3 + 1] = 2 * Math.random() - 1;
      positions[i * 3 + 2] = 2 * Math.random() - 1;
      sizes[i] = PARAMS.atmoSize * (0.4 + Math.random());
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    const orbColor = linVec(ORB.atmo), galColor = linVec(GALAXY.atmo);
    const u = {
      uTime: { value: 0 },
      uColor: { value: orbColor.clone() },
      uAlpha: { value: ORB.atmoAlpha },
      uSpread: { value: ORB.atmoSpread },
      uFadeNear: { value: ORB.atmoFadeNear },
      uFadeFar: { value: ORB.atmoFadeFar },
      uRes: { value: new THREE.Vector2(1, 1) }
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: u,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `
      attribute float size;uniform float uTime;uniform vec2 uRes;uniform float uSpread;uniform float uFadeNear;uniform float uFadeFar;
      varying float vA;
      vec3 warp(vec3 p,float t){
        float c=0.9,a=1.9,b=0.02,s=0.05; p*=2.0;
        p.x+=c*sin(s*t+a*p.y)+t*b; p.y+=c*cos(s*t+a*p.x);
        p.y+=c*sin(s*t+a*p.z)+t*b; p.z+=c*cos(s*t+a*p.y);
        p.z+=c*sin(s*t+a*p.x)+t*b; p.x+=c*cos(s*t+a*p.z);
        return cos(p+vec3(1,2,4));
      }
      void main(){
        vec3 v=position*uSpread+warp(position,uTime)*(uSpread*0.28);
        vec4 mv=modelViewMatrix*vec4(v,1.0);
        float r=length(v);
        float farF=1.0-smoothstep(uFadeNear,uFadeFar,r);
        float nearF=smoothstep(0.0,0.3,-mv.z);
        vA=farF*nearF;
        gl_PointSize=size*uRes.y/900.0/-mv.z; gl_PointSize=max(gl_PointSize,1.0);
        gl_Position=projectionMatrix*mv;
      }`,
      fragmentShader: `
      uniform vec3 uColor;uniform float uAlpha;varying float vA;
      void main(){
        vec2 p=gl_PointCoord-0.5; float l=length(p);
        if(l>0.5) discard;
        float tex=smoothstep(0.5,0.0,l);
        gl_FragColor=vec4(uColor*tex,tex*vA*uAlpha);
      }`
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    scene.add(points);
    return { render(t) {
      const p = galaxyPresence(timeline.getState()), dpr = renderer.getPixelRatio();
      u.uTime.value = t * 8;
      u.uRes.value.set(window.innerWidth * dpr, window.innerHeight * dpr);
      u.uColor.value.lerpVectors(orbColor, galColor, p);
      u.uAlpha.value = lerp(ORB.atmoAlpha, GALAXY.atmoAlpha, p);
      u.uSpread.value = lerp(ORB.atmoSpread, GALAXY.atmoSpread, p);
      u.uFadeNear.value = lerp(ORB.atmoFadeNear, GALAXY.atmoFadeNear, p);
      u.uFadeFar.value = lerp(ORB.atmoFadeFar, GALAXY.atmoFadeFar, p);
      points.position.copy(camera.position);
    } };
  })();
  const CameraRig = { update(delta) {
    const state = timeline.getState(), presence = galaxyPresence(state);
    const intro = getIntro(), eased = 1 - Math.pow(1 - intro, 2);
    const galaxyZ = Galaxy.camZ(timeline.getProgress());
    const targetZ = lerp(PARAMS.orbCameraZ, galaxyZ, presence) + (1 - eased) * INTRO_DOLLY;
    camera.position.z += (targetZ - camera.position.z) * Math.min(1, delta * 8);
    const sway = lerp(ORB_PARALLAX, GALAXY_CONFIG.parallax, presence);
    const targetX = PARAMS.pointerReaction ? pointer.x * sway * eased : 0;
    const targetY = PARAMS.pointerReaction ? pointer.y * sway * 0.55 * eased : 0;
    const follow = Math.min(1, delta * 3);
    camera.position.x += (targetX - camera.position.x) * follow;
    camera.position.y += (targetY - camera.position.y) * follow;
    camera.lookAt(0, Galaxy.lookY(timeline.getProgress()) * presence, 0);
  } };
  function resize() {
    const w = ENV.w, hh = ENV.h;
    renderer.setPixelRatio(clampDpr());
    renderer.setSize(w, hh, false);
    composer.setPixelRatio(clampDpr());
    composer.setSize(w, hh);
    bloomPass.setSize(w, hh);
    camera.aspect = w / hh;
    camera.updateProjectionMatrix();
  }
  resize();
  let loaded = false, framesDrawn = 0, lastNow = null;
  function onReady() {
    if (loaded) return;
    startIntro();
    loaded = true;
    emit("ready");
  }
  function frame(st) {
    const now = st.now;
    const dt = lastNow === null ? 1 / 60 : Math.min(0.05, Math.max(1e-3, (now - lastNow) / 1e3));
    lastNow = now;
    const t = now / 1e3;
    pointer.set(st.px, st.py);
    pointerHas = st.ph;
    timeline.progress = st.progress;
    Object.assign(timeline.state, sampleScene(st.progress));
    setOutro(st.outro);
    if (loaded) perfSample(dt);
    CameraRig.update(dt);
    Backdrop.render(t);
    HeroLine.render();
    Orb.render(t, dt);
    Galaxy.render(t, dt);
    Brain.render(t);
    Atmosphere.render(t);
    composer.render();
    if (!loaded && ++framesDrawn === 2) setTimeout(onReady, 120);
  }
  return { frame, resize(w, h, dpr) {
    ENV.w = w;
    ENV.h = h;
    ENV.dpr = dpr;
    resize();
  } };
}

return createScene
}

/* Worker mode: the page transfers its canvas and sends one state message per frame. */
if(typeof document==='undefined'&&typeof self!=='undefined'&&typeof self.postMessage==='function'){
  let scene=null
  const emit=(type,data)=>self.postMessage({type,data})
  self.onmessage=e=>{
    const m=e.data
    if(m.type==='init'){
      loadScene(m.threeUrl,m.meshUrls).then(create=>{ scene=create(m.canvas,m.init,emit) }).catch(err=>emit('fail',String(err&&err.message||err)))
    }
    else if(m.type==='frame'){ if(scene) scene.frame(m.st); emit('drawn') }
    else if(m.type==='resize'&&scene) scene.resize(m.w,m.h,m.dpr)
  }
} else if(typeof window!=='undefined') window.__hlabLoadScene=loadScene
