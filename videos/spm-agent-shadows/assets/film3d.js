// SPM — Agent Shadows, 3D build. Every frame is a pure function of time t (seconds).
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

const W = 1920, H = 1080, PAD = 320, DUR = 8;
const ICE = new THREE.Color(0.86, 0.93, 0.95), NEONC = new THREE.Color(0.37, 0.84, 0.87), TEALC = new THREE.Color(0.133, 0.5, 0.54);

// ---------- helpers ----------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const sstep = (u) => u * u * (3 - 2 * u);
const easeOut = (u) => 1 - Math.pow(1 - u, 3);
const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
function mulberry(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hermite(keys) { // keys: [[t, v], ...] monotone cubic
  const n = keys.length, xs = keys.map((k) => k[0]), ys = keys.map((k) => k[1]);
  const d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = 0; m[n - 1] = 0;
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (t) => {
    if (t <= xs[0]) return ys[0];
    if (t >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (t > xs[i + 1]) i++;
    const hh = xs[i + 1] - xs[i], u = (t - xs[i]) / hh, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * hh * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * hh * m[i + 1];
  };
}
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const loadBin = (src) => fetch(src).then((r) => r.arrayBuffer()).then((b) => new Float32Array(b));

// ---------- renderer ----------
const glCanvas = document.getElementById("gl");
const fx = document.getElementById("fx").getContext("2d");
const firstImg = document.getElementById("first"), lastImg = document.getElementById("last");
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping;
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020304);
const camera = new THREE.PerspectiveCamera(38, W / H, 0.02, 300);
const composer = new EffectComposer(renderer);
composer.setPixelRatio(1); composer.setSize(W, H);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.0, 0.55, 0.62);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// shared uniforms
const U = {
  uScanC: { value: new THREE.Vector3() }, uScanR: { value: 0 }, uDrain: { value: 0 }, uTime: { value: 0 },
  uPhotoK: { value: 1 }, uTech: { value: 0 }, uPx: { value: 1 },
};

// ---------- scene construction (after assets load) ----------
let META, F, ready = false;
const world = new THREE.Group(); scene.add(world);
const agentsGroup = new THREE.Group(); world.add(agentsGroup);
let roomMats = [], peopleMats = [], ribbonMats = [], agentMats = [], panels = [], podGroups = [];
let heroAgentHeads = [], floorAxis, floorN, deskInfo;

function unproject(u, v, d) { return new THREE.Vector3(((u - 960) / F) * d, (-(v - 540) / F) * d, -d); }
function readDepth(img) {
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, img.width, img.height).data, out = new Float32Array(img.width * img.height);
  for (let i = 0; i < out.length; i++) out[i] = (data[i * 4] * 256 + data[i * 4 + 1]) / 1000;
  return out;
}

const photoVS = `
  varying vec2 vUv; varying vec3 vW;
  void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const photoFS = `
  uniform sampler2D map; uniform vec3 uScanC; uniform float uScanR; uniform float uDrain; uniform float uPhotoK; uniform float uDissolve; uniform float uCut;
  varying vec2 vUv; varying vec3 vW;
  void main(){
    vec4 c = texture2D(map, vUv);
    if (c.a < uCut) discard;
    float d = distance(vW, uScanC);
    float keep = mix(1.0, smoothstep(uScanR - 0.45, uScanR - 0.02, d), uDissolve);
    float ring = exp(-pow((d - uScanR) / 0.022, 2.0)) * step(0.001, uScanR);
    vec3 col = c.rgb * (1.0 - uDrain);
    col += vec3(0.55, 0.95, 1.0) * ring * 0.55 * uDissolve;
    float a = c.a * keep * uPhotoK;
    if (a < 0.01) discard;
    gl_FragColor = vec4(col, a);
  }`;
function photoMaterial(tex, dissolve, cut) {
  const m = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, uScanC: U.uScanC, uScanR: U.uScanR, uDrain: U.uDrain, uPhotoK: U.uPhotoK, uDissolve: { value: dissolve }, uCut: { value: cut } },
    vertexShader: photoVS, fragmentShader: photoFS, transparent: true, depthWrite: true,
  });
  return m;
}
// relief mesh: a grid in pixel space, every vertex unprojected with its depth
function relief(tex, depthAt, u0, v0, u1, v1, step, dissolve, cut) {
  const nx = Math.ceil((u1 - u0) / step), ny = Math.ceil((v1 - v0) / step);
  const pos = new Float32Array((nx + 1) * (ny + 1) * 3), uv = new Float32Array((nx + 1) * (ny + 1) * 2), idx = [];
  const tw = tex.image.width, th = tex.image.height, ou = tex.userData.ou || 0, ov = tex.userData.ov || 0;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const u = Math.min(u1, u0 + i * step), v = Math.min(v1, v0 + j * step), k = j * (nx + 1) + i;
    const p = unproject(u, v, depthAt(u, v));
    pos.set([p.x, p.y, p.z], k * 3);
    uv.set([(u + ou) / tw, 1 - (v + ov) / th], k * 2);
  }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  const mat = photoMaterial(tex, dissolve, cut);
  return new THREE.Mesh(g, mat);
}

// points: photo colour -> scan ice/teal, revealed by the scan front
const pointVS = `
  attribute vec3 color; attribute float edge; attribute float rnd;
  uniform vec3 uScanC; uniform float uScanR; uniform float uPx; uniform float uTech; uniform float uDrain; uniform float uTime; uniform float uAlpha; uniform float uSize; uniform vec3 uTint; uniform float uTintK;
  varying vec3 vC; varying float vA;
  void main(){
    vec4 w = modelMatrix * vec4(position,1.0);
    float d = distance(w.xyz, uScanC);
    float seen = smoothstep(uScanR + 0.02, uScanR - 0.25, d);
    float front = exp(-pow((d - uScanR)/0.18, 2.0));
    float tech = clamp(smoothstep(uScanR - 0.2, uScanR - 1.4, d) * uTech + uDrain, 0.0, 1.0);
    vec3 scanCol = mix(vec3(0.30,0.70,0.76), vec3(0.88,0.97,1.0), edge);
    vec3 base = mix(color, scanCol, tech);
    base = mix(base, uTint, uTintK);
    vC = base + vec3(0.6,0.95,1.0) * front * 1.2;
    float tw = 0.75 + 0.25 * sin(uTime * 6.0 + rnd * 40.0);
    vA = seen * uAlpha * mix(1.0, (0.35 + 0.65 * edge) * tw, tech);
    vec4 mv = viewMatrix * w;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPx * (1.0 + edge * 0.8 + front * 1.5) * (2.2 / max(0.25, -mv.z));
  }`;
const pointFS = `
  varying vec3 vC; varying float vA;
  void main(){ vec2 q = gl_PointCoord - 0.5; float r = dot(q,q); if (r > 0.25) discard; gl_FragColor = vec4(vC, vA * smoothstep(0.25, 0.05, r)); }`;
function pointMaterial(opts) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uScanC: U.uScanC, uScanR: U.uScanR, uPx: U.uPx, uTech: U.uTech, uDrain: U.uDrain, uTime: U.uTime,
      uAlpha: { value: opts.alpha ?? 1 }, uSize: { value: opts.size ?? 1.6 }, uTint: { value: opts.tint ?? new THREE.Color(1, 1, 1) }, uTintK: { value: opts.tintK ?? 0 },
    },
    vertexShader: pointVS, fragmentShader: pointFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}
function pointsFrom(arr, stride, filter, everyN = 1) {
  const n = arr.length / stride, P = [], C = [], E = [], R = [];
  const rr = mulberry(9);
  for (let i = 0; i < n; i += everyN) {
    const o = i * stride;
    if (filter && !filter(arr, o)) continue;
    P.push(arr[o], arr[o + 1], arr[o + 2]); C.push(arr[o + 3], arr[o + 4], arr[o + 5]); E.push(arr[o + 6]); R.push(rr());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute("edge", new THREE.Float32BufferAttribute(E, 1));
  g.setAttribute("rnd", new THREE.Float32BufferAttribute(R, 1));
  return g;
}

// wireframe lines revealed by the scan
const lineVS = `uniform vec3 uScanC; uniform float uScanR; varying float vA; varying float vF;
  void main(){ vec4 w = modelMatrix * vec4(position,1.0); float d = distance(w.xyz,uScanC);
    vA = smoothstep(uScanR + 0.05, uScanR - 0.6, d); vF = exp(-pow((d-uScanR)/0.25,2.0));
    gl_Position = projectionMatrix * viewMatrix * w; }`;
const lineFS = `uniform vec3 uCol; uniform float uAlpha; varying float vA; varying float vF;
  void main(){ gl_FragColor = vec4(uCol + vec3(0.5,0.9,1.0)*vF, (vA*0.55 + vF*0.9) * uAlpha); }`;
const lineMat = (col, alpha) => new THREE.ShaderMaterial({
  uniforms: { uScanC: U.uScanC, uScanR: U.uScanR, uCol: { value: col }, uAlpha: { value: alpha } },
  vertexShader: lineVS, fragmentShader: lineFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});

// ribbon tube shader: tapered, flowing light, grows along its length
const ribVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const ribFS = `uniform float uGrow; uniform float uAlpha; uniform float uTime; uniform float uSeed; varying vec2 vUv;
  void main(){ float u = vUv.x; if (u > uGrow) discard;
    float taper = pow(sin(3.14159 * clamp(u / max(uGrow,0.001), 0.0, 1.0)), 0.7);
    float flow = 0.35 + 0.65 * pow(0.5 + 0.5 * sin((u * 9.0 - uTime * 5.0 + uSeed) * 3.14159), 6.0);
    float tip = exp(-pow((u - uGrow) / 0.03, 2.0));
    vec3 col = mix(vec3(0.16,0.55,0.6), vec3(0.8,0.95,1.0), flow * 0.8) + tip * 1.2;
    gl_FragColor = vec4(col, (taper * flow * 0.6 + tip * 0.8) * uAlpha); }`;
function ribbon(points, radius, seed) {
  const curve = new THREE.CatmullRomCurve3(points);
  const g = new THREE.TubeGeometry(curve, 96, radius, 6, false);
  const m = new THREE.ShaderMaterial({
    uniforms: { uGrow: { value: 0 }, uAlpha: { value: 0 }, uTime: U.uTime, uSeed: { value: seed } },
    vertexShader: ribVS, fragmentShader: ribFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  ribbonMats.push(m);
  return new THREE.Mesh(g, m);
}

// frosted UI panels (canvas textures, redrawn per frame)
function makePanel(kind, w, h) {
  const c = document.createElement("canvas"); c.width = 640; c.height = Math.round(640 * h / w);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
  panels.push({ kind, c, tex, mesh });
  return mesh;
}
function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function drawPanel(p, t, t0) {
  const g = p.c.getContext("2d"), w = p.c.width, h = p.c.height, s = w / 320;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, w, h); g.scale(s, s);
  const pw = 320, ph = h / s;
  rr(g, 1, 1, pw - 2, ph - 2, 14); g.fillStyle = "rgba(13,20,31,0.78)"; g.fill();
  const gg = g.createLinearGradient(0, 0, pw, ph); gg.addColorStop(0, "rgba(220,236,242,0.12)"); gg.addColorStop(1, "rgba(34,128,138,0.08)");
  g.fillStyle = gg; g.fill(); g.strokeStyle = "rgba(94,214,222,0.75)"; g.lineWidth = 1.4; g.stroke();
  g.textBaseline = "top"; g.font = "600 13px Bricolage"; g.fillStyle = "rgba(220,236,242,0.7)";
  if (p.kind === "call") {
    g.fillStyle = `rgba(94,214,222,${0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 7))})`; g.beginPath(); g.arc(24, 27, 5, 0, 7); g.fill();
    g.fillStyle = "rgba(220,236,242,0.75)"; g.fillText("LIVE CALL", 38, 20);
    const secs = 134 + Math.max(0, Math.floor(t - t0));
    g.font = "500 30px Bricolage"; g.fillStyle = "rgba(249,250,251,0.97)"; g.fillText(`0${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`, 22, 46);
    for (let b = 0; b < 30; b++) {
      const amp = 0.25 + 0.75 * Math.abs(Math.sin(b * 0.9 + t * 9) * Math.sin(b * 0.37 + t * 3.1)), bh = 6 + 34 * amp;
      g.fillStyle = "rgba(94,214,222,0.9)"; g.fillRect(24 + b * 9.4, 122 - bh / 2, 4, bh);
    }
  } else if (p.kind === "ticket") {
    g.fillText("TICKET  #48217", 22, 20);
    for (let r = 0; r < 3; r++) { g.fillStyle = "rgba(67,97,122,0.85)"; g.fillRect(22, 52 + r * 20, [250, 210, 160][r], 7); }
    const done = prog(t, t0 + 0.45, t0 + 0.7);
    rr(g, 22, 120, 138, 30, 15); g.fillStyle = done > 0 ? `rgba(34,128,138,${0.4 + 0.55 * done})` : "rgba(67,97,122,0.6)"; g.fill();
    g.fillStyle = "rgba(249,250,251,0.97)"; g.font = "600 13px Bricolage"; g.fillText(done > 0.5 ? "✓  RESOLVED" : "IN PROGRESS", done > 0.5 ? 40 : 40, 129);
  } else {
    g.fillText("CSAT · THIS WEEK", 22, 20);
    const k = easeOut(prog(t, t0 + 0.1, t0 + 0.85));
    g.font = "500 30px Bricolage"; g.fillStyle = "rgba(249,250,251,0.97)"; g.fillText((4.1 + 0.8 * k).toFixed(1), 22, 42);
    g.font = "600 13px Bricolage"; g.fillStyle = "rgba(94,214,222,0.95)"; g.fillText("▲ 18%", 92, 56);
    [0.42, 0.55, 0.5, 0.68, 0.74, 0.86, 0.97].forEach((hv, b, arr) => {
      const bh = 92 * hv * clamp(k * 1.4 - b * 0.06);
      g.fillStyle = b === arr.length - 1 ? "rgba(94,214,222,0.97)" : "rgba(67,97,122,0.9)"; g.fillRect(24 + b * 40, 182 - bh, 26, bh);
    });
  }
  p.tex.needsUpdate = true;
}

// soft vertical glass mullion close to the lens (foreground wipe)
function makeMullion() {
  const c = document.createElement("canvas"); c.width = 128; c.height = 8;
  const g = c.getContext("2d"), gr = g.createLinearGradient(0, 0, 128, 0);
  gr.addColorStop(0, "rgba(10,16,24,0)"); gr.addColorStop(0.3, "rgba(10,16,24,0.55)"); gr.addColorStop(0.62, "rgba(18,30,42,0.6)");
  gr.addColorStop(0.7, "rgba(200,225,235,0.35)"); gr.addColorStop(0.76, "rgba(10,16,24,0.8)"); gr.addColorStop(1, "rgba(10,16,24,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 8);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  return m;
}

// ---------- build ----------
let CHAIR_SIDE = 1, mullion, heroPoints, floorGrid, roomEdges, heroDesk = new THREE.Group();
async function build() {
  META = await fetch("assets/3d/meta.json").then((r) => r.json());
  F = META.F;
  const [wallI, deskI, wI, bI, yI, dRoomI, dWI, dBI, dYI, pts, roomE] = await Promise.all([
    loadImg("assets/layer-wall-pad.jpg"), loadImg("assets/layer-desk.png"),
    loadImg("assets/3d/person-woman.png"), loadImg("assets/3d/person-bald.png"), loadImg("assets/3d/person-young.png"),
    loadImg("assets/3d/depth-room.png"), loadImg("assets/3d/depth-woman.png"), loadImg("assets/3d/depth-bald.png"), loadImg("assets/3d/depth-young.png"),
    loadBin("assets/3d/people-points.bin"), loadBin("assets/3d/room-edges.bin"),
    document.fonts.load("500 30px Bricolage"), document.fonts.load("600 13px Bricolage"),
  ]);
  const DR = readDepth(dRoomI), DPS = [readDepth(dWI), readDepth(dBI), readDepth(dYI)];
  const dr = (u, v) => DR[Math.round(clamp(v, 0, H - 1)) * W + Math.round(clamp(u, 0, W - 1))];
  const tex = (img, ou = 0, ov = 0) => { const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; t.userData = { ou, ov }; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; return t; };

  // room: padded back plate + desk, both relief
  const wallTex = tex(wallI, PAD, PAD);
  const inScreen = (u, v) => u >= 1180 && v >= 100 && v <= 735;
  const wallDepth = (u, v) => { const uu = clamp(u, 0, W - 1), vv = clamp(v, 0, H - 1); return uu < 545 ? 2.75 + (uu / 545) * 0.5 : inScreen(uu, vv) ? 5.35 : 5.6; };
  const wallMesh = relief(wallTex, (u, v) => { const uu = clamp(u, 0, W - 1), vv = clamp(v, 0, H - 1); return inScreen(uu, vv) ? 5.35 : 5.6; }, 330, -PAD, W + PAD, H + PAD, 10, 1, 0.0);
  const partMesh = relief(wallTex, (u, v) => 2.75 + (clamp(u, 0, 548) / 545) * 0.5, -PAD, -PAD, 552, H + PAD, 8, 1, 0.0);
  partMesh.renderOrder = 1; world.add(partMesh); roomMats.push(partMesh.material);
  // the wall plate must sit behind the desk everywhere: use room depth but push desk area back to the wall
  world.add(wallMesh); roomMats.push(wallMesh.material);
  const deskMesh = relief(tex(deskI), dr, 0, 0, W, H, 8, 1, 0.35);
  world.add(deskMesh); roomMats.push(deskMesh.material);
  // people: each its own relief so silhouettes never rubber-sheet
  const base = META.base, names = ["woman", "bald", "young"], imgs = [wI, bI, yI];
  names.forEach((k, i) => {
    const DPk = DPS[i];
    const m = relief(tex(imgs[i]), (u, v) => { const d = DPk[Math.round(clamp(v, 0, H - 1)) * W + Math.round(clamp(u, 0, W - 1))]; return d > 0 ? d : base[k]; }, 0, 0, W, H, 4, 1, 0.45);
    m.renderOrder = 2; world.add(m); peopleMats.push(m.material);
  });

  // hero point cloud (all three people)
  heroPoints = new THREE.Points(pointsFrom(pts, 8, null, 1), pointMaterial({ size: 1.05, alpha: 0.5 }));
  heroPoints.renderOrder = 5; world.add(heroPoints);
  roomEdges = new THREE.Points((() => { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(roomE, 3));
    const n = roomE.length / 3; g.setAttribute("color", new THREE.Float32BufferAttribute(new Array(n * 3).fill(0.8), 3));
    g.setAttribute("edge", new THREE.Float32BufferAttribute(new Array(n).fill(1), 1)); g.setAttribute("rnd", new THREE.Float32BufferAttribute(Array.from({ length: n }, (_, i) => (i * 0.618) % 1), 1)); return g; })(),
    pointMaterial({ size: 1.2, alpha: 0.6 }));
  world.add(roomEdges);

  // ----- floor frame from the hero row -----
  const H3 = META.heads, hW = new THREE.Vector3(...H3.woman), hY = new THREE.Vector3(...H3.young);
  floorAxis = new THREE.Vector3(hY.x - hW.x, 0, hY.z - hW.z).normalize();       // along the row (they face this way)
  floorN = new THREE.Vector3(-floorAxis.z, 0, floorAxis.x);                        // across the row
  const FLOOR_Y = -1.3, DESK_Y = -0.56;
  const laptops = [[1150, 1010], [1420, 900], [1600, 820]].map(([u, v]) => unproject(u, v, dr(u, v)));
  const deskC = laptops[0].clone().add(laptops[2]).multiplyScalar(0.5); deskC.y = DESK_Y;
  deskInfo = { deskC, FLOOR_Y, DESK_Y, laptops };
  const yaw = Math.atan2(floorAxis.x, floorAxis.z);
  const localX = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  CHAIR_SIDE = Math.sign(new THREE.Vector3(...H3.bald).sub(deskC).setY(0).dot(localX)) < 0 ? 1 : -1;

  // a pod = desk + 3 laptops + 3 chairs (wireframe), positioned in the floor frame
  const icy = new THREE.Color(0.75, 0.9, 0.95);
  function podWire(center, mirrored) {
    const grp = new THREE.Group();
    const add = (geo, pos, rotY = 0, alpha = 0.9) => {
      const l = new THREE.LineSegments(new THREE.EdgesGeometry(geo), lineMat(icy, alpha));
      l.position.copy(pos); l.rotation.y = rotY; grp.add(l); return l;
    };
    add(new THREE.BoxGeometry(0.8, 0.04, 3.4), new THREE.Vector3(0, DESK_Y - center.y, 0));
    add(new THREE.BoxGeometry(0.05, 0.72, 0.05), new THREE.Vector3(0.3, (DESK_Y + FLOOR_Y) / 2 - center.y, 1.6), 0, 0.5);
    add(new THREE.BoxGeometry(0.05, 0.72, 0.05), new THREE.Vector3(-0.3, (DESK_Y + FLOOR_Y) / 2 - center.y, -1.6), 0, 0.5);
    for (let s = -1; s <= 1; s++) {
      add(new THREE.BoxGeometry(0.34, 0.02, 0.24), new THREE.Vector3(-0.05, DESK_Y - center.y + 0.03, s * 1.05));
      const lid = add(new THREE.BoxGeometry(0.34, 0.24, 0.01), new THREE.Vector3(-0.05, DESK_Y - center.y + 0.15, s * 1.05 + 0.12));
      lid.rotation.x = -0.25;
      add(new THREE.BoxGeometry(0.46, 0.06, 0.46), new THREE.Vector3(-0.75, -0.85 - center.y, s * 1.05), 0, 0.6);
      add(new THREE.BoxGeometry(0.46, 0.5, 0.05), new THREE.Vector3(-0.98, -0.6 - center.y, s * 1.05), Math.PI / 2, 0.6);
    }
    grp.position.copy(center); grp.rotation.y = yaw;
    if (CHAIR_SIDE < 0) grp.scale.x = -1;
    return grp;
  }

  // other pods across the floor, each carrying point-cloud people and their agents
  const sparse = pointsFrom(pts, 8, null, 7);
  const heroAnchor = deskC.clone();
  const rng = mulberry(42);
  const podSlots = [];
  for (let a = -2; a <= 3; a++) for (let b = -2; b <= 2; b++) {
    if (a === 0 && b === 0) continue;
    if (Math.abs(b) === 2 && Math.abs(a) >= 3) continue;
    podSlots.push([a, b]);
  }
  // hero desk wireframe too
  const heroWire = podWire(new THREE.Vector3(deskC.x, deskC.y, deskC.z), false); world.add(heroWire);
  podSlots.forEach(([a, b], idx) => {
    const off = floorAxis.clone().multiplyScalar(a * 4.6).add(floorN.clone().multiplyScalar(b * 2.7));
    const mirrored = (b % 2 !== 0);
    const grp = new THREE.Group();
    grp.add(podWire(heroAnchor.clone().add(off), false));
    // people clone: same relative arrangement as the hero team
    const p = new THREE.Points(sparse, pointMaterial({ size: 1.3, alpha: 0.5 }));
    p.position.copy(off);
    grp.add(p);
    grp.userData = { off, mirrored, dist: off.length(), phase: rng() };
    world.add(grp); podGroups.push(grp);
  });

  // agents: teal point echo of each person's head and shoulders, standing behind the chair
  const back = floorAxis.clone().multiplyScalar(-0.42);
  const headY = { 0: H3.woman[1], 1: H3.bald[1], 2: H3.young[1] };
  const agentGeo = pointsFrom(pts, 8, (arr, o) => arr[o + 1] > headY[arr[o + 7]] - 0.5, 2);
  const agentGeoSparse = pointsFrom(pts, 8, (arr, o) => arr[o + 1] > headY[arr[o + 7]] - 0.5, 9);
  function agentObj(geo, offset) {
    const m = pointMaterial({ size: 1.9, tint: new THREE.Color(0.2, 0.85, 0.9), tintK: 1.0, alpha: 0 });
    const o = new THREE.Points(geo, m); o.position.copy(offset).add(back).add(new THREE.Vector3(0, 0.34, 0)); o.scale.setScalar(1.0);
    o.userData = { base: o.position.clone() }; agentMats.push({ m, o }); agentsGroup.add(o); return o;
  }
  const heroAgent = agentObj(agentGeo, new THREE.Vector3());
  heroAgent.userData.dist = 0; heroAgent.userData.hero = true;
  podGroups.forEach((g) => { const ag = agentObj(agentGeoSparse, g.userData.off); ag.userData.dist = g.userData.dist; });
  heroAgentHeads = ["woman", "bald", "young"].map((k) => new THREE.Vector3(...H3[k]).add(back).add(new THREE.Vector3(0, 0.34, 0)));

  // ribbons: hero ear -> its agent; then a network linking agents across the floor
  ["woman", "bald", "young"].forEach((k, i) => {
    const e = new THREE.Vector3(...META.ears[k]), a = heroAgentHeads[i];
    const mid = e.clone().lerp(a, 0.5).add(new THREE.Vector3(0, 0.35, 0));
    const r = ribbon([e, mid, a], 0.005, i * 1.7); r.userData = { start: 2.95 + i * 0.12, dur: 0.6 }; world.add(r);
  });
  const netR = mulberry(7);
  const heads = podGroups.map((g) => g.userData.off.clone().add(new THREE.Vector3(0, 0.75, 0)).add(heroAnchor).setY(0.75));
  const heroHub = heroAgentHeads[1].clone();
  for (let k = 0; k < 16; k++) {
    const A = k < 6 ? heroHub : heads[Math.floor(netR() * heads.length)], B = heads[Math.floor(netR() * heads.length)];
    if (A.distanceTo(B) < 1) continue;
    const mid = A.clone().lerp(B, 0.5); mid.y += 1.2 + A.distanceTo(B) * 0.18;
    const r = ribbon([A, mid, B], 0.0065, k * 2.3); r.userData = { start: 3.15 + 0.05 * k + A.distanceTo(heroHub) * 0.04, dur: 0.75 }; world.add(r);
  }

  // panels floating above the hero pod
  const pc = heroAgentHeads[1].clone().add(new THREE.Vector3(0, 0.62, 0));
  [["call", -1.3, 0.05, 3.3], ["ticket", 0.0, 0.35, 3.5], ["csat", 1.3, 0.05, 3.7]].forEach(([kind, s, dy, t0]) => {
    const m = makePanel(kind, 1.05, kind === "csat" ? 0.64 : 0.5);
    m.position.copy(pc).add(floorN.clone().multiplyScalar(-s)).add(new THREE.Vector3(0, dy, 0));
    m.userData = { t0 }; world.add(m);
  });

  // floor grid (the data floor that becomes the final grid)
  floorGrid = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShaderMaterial({
    uniforms: { uScanC: U.uScanC, uScanR: U.uScanR, uDrain: U.uDrain, uAlpha: { value: 1 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uScanC; uniform float uScanR; uniform float uAlpha; varying vec3 vW;
      void main(){ vec2 g = abs(fract(vW.xz / 0.6) - 0.5); float l = 1.0 - smoothstep(0.0, 0.012, min(g.x, g.y));
        float d = distance(vW, uScanC); float seen = smoothstep(uScanR + 0.1, uScanR - 1.2, d); float front = exp(-pow((d-uScanR)/0.35,2.0));
        float fade = 1.0 - smoothstep(9.0, 26.0, length(vW.xz));
        gl_FragColor = vec4(vec3(0.55,0.75,0.82) + front*vec3(0.4,0.9,1.0), (l*0.10*seen + front*0.22*l + front*0.025) * fade * uAlpha); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  floorGrid.rotation.x = -Math.PI / 2; floorGrid.position.y = FLOOR_Y; world.add(floorGrid);

  mullion = makeMullion(); mullion.position.set(0.62, 0, -0.9); world.add(mullion);
  ready = true;
}

// ---------- camera path ----------
const CK = [
  // t, position, target
  [0.0, [0, 0, 0], [0, 0, -3]],
  [1.4, [0.24, 0.04, -0.2], [0.14, -0.03, -3.25]],
  [2.6, [1.15, 1.05, 0.5], [0.3, -0.42, -3.0]],
  [4.2, [3.4, 4.7, 2.3], [0.25, -0.95, -3.7]],
  [5.2, [2.0, 5.4, 0.2], [0.2, -1.05, -3.0]],
  [6.6, [0.12, 1.05, -2.45], [0.1, -1.3, -2.62]],
  [7.6, [0.1, 0.18, -2.58], [0.1, -1.3, -2.6]],
  [8.0, [0.1, 0.12, -2.59], [0.1, -1.3, -2.6]],
];
const ch = (k, i) => hermite(CK.map((c) => [c[0], c[k][i]]));
const PX = [ch(1, 0), ch(1, 1), ch(1, 2)], TX = [ch(2, 0), ch(2, 1), ch(2, 2)];
const FOV = hermite([[0, 38], [5.2, 38], [6.6, 50], [8, 58]]);

// ---------- 2D overlay pieces (flares, finale ribbons, bokeh, rings, grain) ----------
const R2 = mulberry(2026);
const BOKEH = Array.from({ length: 34 }, () => ({ ang: R2() * Math.PI * 2, rad: lerp(60, 640, Math.sqrt(R2())), r: lerp(14, 72, R2()), a: lerp(0.08, 0.26, R2()), teal: R2() < 0.55, k: lerp(0.6, 1.6, R2()) }));
const grain = (() => { const c = document.createElement("canvas"); c.width = c.height = 256; const g = c.getContext("2d"), id = g.createImageData(256, 256), r = mulberry(77);
  for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (r() - 0.5) * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; } g.putImageData(id, 0, 0); return c; })();
function flare(x, y, k) {
  if (k <= 0.01) return;
  fx.save(); fx.globalCompositeOperation = "lighter";
  let g = fx.createRadialGradient(x, y, 0, x, y, 160);
  g.addColorStop(0, `rgba(255,255,255,${0.9 * k})`); g.addColorStop(0.12, `rgba(94,214,222,${0.55 * k})`); g.addColorStop(1, "rgba(34,128,138,0)");
  fx.fillStyle = g; fx.fillRect(x - 160, y - 160, 320, 320);
  for (const [hh, a, wd] of [[3, 0.85, 950], [16, 0.22, 1350], [46, 0.07, 1650]]) {
    fx.save(); fx.translate(x, y); fx.scale(1, hh / wd);
    g = fx.createRadialGradient(0, 0, 0, 0, 0, wd);
    g.addColorStop(0, `rgba(220,236,242,${a * k})`); g.addColorStop(0.4, `rgba(94,214,222,${a * 0.45 * k})`); g.addColorStop(1, "rgba(34,128,138,0)");
    fx.fillStyle = g; fx.beginPath(); fx.arc(0, 0, wd, 0, Math.PI * 2); fx.fill(); fx.restore();
  }
  fx.restore();
}
function smokeRibbon(p0, p1, p2, p3, wMax, alpha, grow, warm) {
  if (alpha <= 0.002 || grow <= 0.001) return;
  const N = 56, top = [], bot = [];
  const B = (u) => { const v = 1 - u; return [v*v*v*p0[0] + 3*v*v*u*p1[0] + 3*v*u*u*p2[0] + u*u*u*p3[0], v*v*v*p0[1] + 3*v*v*u*p1[1] + 3*v*u*u*p2[1] + u*u*u*p3[1]]; };
  for (let k = 0; k <= N; k++) {
    const u = (k / N) * grow, a = B(u), b = B(Math.min(1, u + 0.01));
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const w = wMax * Math.pow(Math.sin(Math.PI * clamp(u / grow) * 0.98 + 0.02), 0.9) * (0.6 + 0.4 * Math.sin(u * 7 + 1.1)) * (1 - 0.85 * (u / grow));
    top.push([a[0] + nx * w, a[1] + ny * w]); bot.push([a[0] - nx * w * 0.5, a[1] - ny * w * 0.5]);
  }
  const tip = B(grow);
  const g = fx.createLinearGradient(p0[0], p0[1], tip[0], tip[1]);
  g.addColorStop(0, `rgba(120,150,170,0)`); g.addColorStop(0.5, `rgba(${warm ? "190,215,225" : "94,180,195"},${0.2 * alpha})`); g.addColorStop(1, `rgba(235,248,252,${0.95 * alpha})`);
  fx.beginPath(); top.forEach((q, k) => (k ? fx.lineTo(q[0], q[1]) : fx.moveTo(q[0], q[1])));
  for (let k = bot.length - 1; k >= 0; k--) fx.lineTo(bot[k][0], bot[k][1]);
  fx.closePath(); fx.fillStyle = g; fx.fill();
  const tg = fx.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 14);
  tg.addColorStop(0, `rgba(255,255,255,${alpha})`); tg.addColorStop(1, "rgba(94,214,222,0)"); fx.fillStyle = tg; fx.fillRect(tip[0] - 14, tip[1] - 14, 28, 28);
}
const SMOKE = Array.from({ length: 11 }, (_, k) => {
  const ang = (k / 11) * Math.PI * 2 + 0.3, r = 1250;
  return { s: [960 + Math.cos(ang) * r, 520 + Math.sin(ang) * r * 0.75], curl: (k % 2 ? 1 : -1) * lerp(0.35, 0.7, (k * 0.37) % 1), w: lerp(46, 96, (k * 0.61) % 1), warm: k % 3 === 0 };
});
function project(v) { const p = v.clone().project(camera); return [(p.x * 0.5 + 0.5) * W, (-p.y * 0.5 + 0.5) * H, p.z]; }

// ---------- the frame ----------
let lastT = -1;
function renderAt(t) {
  t = clamp(t, 0, DUR);
  if (!ready) return;
  lastT = t;
  // camera
  camera.position.set(PX[0](t), PX[1](t), PX[2](t));
  const target = new THREE.Vector3(TX[0](t), TX[1](t), TX[2](t));
  const upK = sstep(prog(t, 5.0, 6.5));
  camera.up.set(0, 1 - upK, -upK).normalize();
  camera.lookAt(target);
  camera.fov = FOV(t); camera.updateProjectionMatrix();

  // scan, drain, phases
  const scanU = prog(t, 1.5, 4.3);
  U.uScanR.value = scanU <= 0 ? 0 : lerp(0, 5.2, easeOut(prog(t, 1.5, 2.65))) + lerp(0, 17, easeInOut(prog(t, 2.65, 4.3)));
  U.uScanC.value.set(...META.mic_woman);
  U.uTime.value = t; U.uTech.value = sstep(prog(t, 1.6, 3.0));
  const drain = sstep(prog(t, 4.2, 5.2)); U.uDrain.value = drain;
  U.uPhotoK.value = 1;
  const fadeAll = 1 - sstep(prog(t, 7.1, 7.6));
  bloom.strength = lerp(0.0, 0.62, sstep(prog(t, 1.5, 2.6))) * fadeAll;
  bloom.threshold = lerp(0.9, 0.5, sstep(prog(t, 1.5, 3.5))); bloom.radius = 0.38;

  // hero points: fade during the dive
  heroPoints.material.uniforms.uAlpha.value = lerp(0.62, 0.34, sstep(prog(t, 2.6, 3.4))) * (1 - sstep(prog(t, 5.75, 6.2)));
  roomEdges.material.uniforms.uAlpha.value = 0.55 * sstep(prog(t, 2.2, 3.2)) * (1 - sstep(prog(t, 5.6, 6.4)));
  podGroups.forEach((g) => g.children.forEach((c) => { if (c.isPoints) c.material.uniforms.uAlpha.value = 0.5 * (1 - sstep(prog(t, 5.5, 6.1))); }));
  // pod wire alpha is per child lineMat
  world.traverse((o) => { if (o.isLineSegments) o.material.uniforms.uAlpha.value = (o.userData.a0 ??= o.material.uniforms.uAlpha.value) * (1 - sstep(prog(t, 5.6, 6.3))) * lerp(1, 0.75, drain); });
  floorGrid.material.uniforms.uAlpha.value = 1 - sstep(prog(t, 5.7, 6.25));

  // agents rise in a wave behind the scan front
  agentMats.forEach(({ m, o }) => {
    const t0 = 2.85 + (o.userData.hero ? 0 : 0.35 + o.userData.dist * 0.06);
    const q = easeOut(prog(t, t0, t0 + 0.7));
    o.position.copy(o.userData.base).add(new THREE.Vector3(0, -0.55 * (1 - q), 0));
    m.uniforms.uAlpha.value = q * (o.userData.hero ? 0.75 : 0.95) * (1 - sstep(prog(t, o.userData.hero ? 6.0 : 5.6, o.userData.hero ? 6.4 : 6.2)));
    m.uniforms.uTintK.value = 1.0;
  });
  // ribbons grow then breathe; fade before the finale
  world.children.forEach((o) => {
    if (!o.isMesh || !o.material.uniforms || !o.material.uniforms.uGrow) return;
    const { start, dur } = o.userData;
    o.material.uniforms.uGrow.value = easeInOut(prog(t, start, start + dur));
    o.material.uniforms.uAlpha.value = sstep(prog(t, start, start + 0.15)) * (1 - sstep(prog(t, 5.9, 6.4)));
  });
  // panels: pop in, face the camera, sweep past in the dive
  panels.forEach((p) => {
    const t0 = p.mesh.userData.t0, u = prog(t, t0, t0 + 0.4);
    p.mesh.material.opacity = easeOut(u) * (1 - sstep(prog(t, 6.0, 6.4)));
    p.mesh.scale.setScalar(lerp(0.85, 1, easeOut(u)));
    p.mesh.quaternion.copy(camera.quaternion);
    if (p.mesh.material.opacity > 0.01) drawPanel(p, t, t0);
  });
  // mullion only matters early
  mullion.visible = t < 2.2;
  // room photo dissolves behind the scan; extra drain
  roomMats.forEach((m) => { m.uniforms.uPhotoK.value = 1 - drain; });
  peopleMats.forEach((m) => { m.uniforms.uPhotoK.value = 1 - drain; });

  composer.render();

  // ----- 2D overlay -----
  fx.setTransform(1, 0, 0, 1, 0, 0); fx.clearRect(0, 0, W, H); fx.globalAlpha = 1; fx.globalCompositeOperation = "source-over";
  // scan-birth flare on the woman's microphone, tracked in 3D
  const mic = project(new THREE.Vector3(...META.mic_woman));
  flare(mic[0], mic[1], Math.sin(Math.PI * prog(t, 1.4, 2.1)) * 0.95);
  // dive: bokeh and rings
  const dive = prog(t, 5.6, 7.0), P = [960, 500];
  if (dive > 0 && fadeAll > 0) {
    const bk = Math.sin(Math.PI * clamp(prog(t, 5.6, 7.4))) * fadeAll;
    fx.save(); fx.globalCompositeOperation = "lighter";
    for (const b of BOKEH) {
      const spread = 1 + dive * 2.4 * b.k, x = 960 + Math.cos(b.ang) * b.rad * spread, y = 500 + Math.sin(b.ang) * b.rad * spread * 0.7, r = b.r * (1 + dive * 1.4 * b.k);
      const g = fx.createRadialGradient(x, y, r * 0.55, x, y, r), col = b.teal ? "94,214,222" : "120,150,178";
      g.addColorStop(0, `rgba(${col},${b.a * bk})`); g.addColorStop(0.85, `rgba(${col},${b.a * bk * 0.8})`); g.addColorStop(1, `rgba(${col},0)`);
      fx.fillStyle = g; fx.beginPath(); fx.arc(x, y, r, 0, Math.PI * 2); fx.fill();
    }
    for (let k = 0; k < 2; k++) {
      const u = prog(t, 6.1 + k * 0.28, 7.2 + k * 0.28); if (u <= 0 || u >= 1) continue;
      fx.beginPath(); fx.arc(P[0], P[1], 24 + easeOut(u) * 680, 0, Math.PI * 2);
      fx.strokeStyle = `rgba(220,236,242,${0.5 * (1 - u) * fadeAll})`; fx.lineWidth = 1.3; fx.stroke();
    }
    fx.restore();
  }
  // finale: smoky ribbons swirl to one point, mirrored on a glossy floor
  const fin = easeInOut(prog(t, 6.2, 7.15));
  if (fin > 0 && fadeAll > 0) {
    const draw = (alphaMul) => SMOKE.forEach((s) => {
      const c = s.curl, mid = [lerp(s.s[0], P[0], 0.45) + (P[1] - s.s[1]) * c * 0.5, lerp(s.s[1], P[1], 0.45) - (P[0] - s.s[0]) * c * 0.35];
      smokeRibbon(s.s, mid, [lerp(mid[0], P[0], 0.65), lerp(mid[1], P[1], 0.85)], P, s.w, fadeAll * alphaMul, fin, s.warm);
    });
    fx.save(); fx.globalCompositeOperation = "lighter"; draw(1);
    const horizon = 700; fx.beginPath(); fx.rect(0, horizon, W, H - horizon); fx.clip(); fx.translate(0, horizon * 2); fx.scale(1, -1); draw(0.2);
    fx.restore();
    const hz = fx.createLinearGradient(0, 700, 0, H); hz.addColorStop(0, "rgba(2,2,2,0)"); hz.addColorStop(1, "rgba(2,2,2,0.85)");
    fx.fillStyle = hz; fx.fillRect(0, 700, W, H - 700);
  }
  flare(P[0], P[1], Math.sin(Math.PI * prog(t, 6.95, 7.55)) * 0.9);
  // vignette + grain (never on the exact first/last frames)
  const vig = Math.min(prog(t, 0.6, 2.0), 1 - prog(t, 7.0, 7.5)) * 0.5;
  if (vig > 0.01) { const vg = fx.createRadialGradient(960, 540, 520, 960, 540, 1180); vg.addColorStop(0, "rgba(2,4,8,0)"); vg.addColorStop(1, `rgba(2,4,8,${vig})`); fx.fillStyle = vg; fx.fillRect(0, 0, W, H); }
  const gk = Math.min(prog(t, 0.4, 0.9), 1 - prog(t, 7.1, 7.55)) * 0.045;
  if (gk > 0.002) { fx.save(); fx.globalAlpha = gk; fx.globalCompositeOperation = "overlay"; const f = Math.floor(t * 30); fx.translate(-((f * 97) % 256), -((f * 61) % 256)); fx.fillStyle = fx.createPattern(grain, "repeat"); fx.fillRect(0, 0, W + 256, H + 256); fx.restore(); }
  // exact first and last frames
  firstImg.style.opacity = String(1 - sstep(prog(t, 0.04, 0.35)));
  lastImg.style.opacity = String(sstep(prog(t, 7.05, 7.6)));
}

window.__spmRender = renderAt;
window.addEventListener("hf-seek", (e) => renderAt(e.detail && typeof e.detail.time === "number" ? e.detail.time : 0));
const buildP = build().then(() => renderAt(window.__hfThreeTime || window.__spmT || 0));
window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {};
window.__hf.buildReady["spm-agent-shadows-3d"] = buildP;
