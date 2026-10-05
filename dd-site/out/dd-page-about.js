// Disruptive Dodo · about page.
// Rendered by src/scripts/dd-core.js into #dd-root (shared nav, footer, styles and
// motion live there). Edit copy in `html` below. {{ar}} is the arrow icon.
const DD = (window.__DD = window.__DD || { pages: {} });
DD.pages["about"] = {
  path: "/about",
  title: "About Disruptive Dodo · Growth agency in Mauritius",
  description: "Disruptive Dodo is a Mauritian growth agency. One local team builds and runs your website, marketing and follow-up as one system.",
  ld: null,
  css: `.abh .d1{max-width:22ch}
.abh .d1 .mu{color:rgba(243,241,234,.5)}
.rules{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:48px var(--gap)}
.rules li{padding-top:28px;border-top:1px solid var(--ls)}
.rules .h3{font-size:clamp(28px,2.6vw,42px);letter-spacing:-.035em}
.rules .tx{max-width:36ch}
@media (max-width:899px){.rules{grid-template-columns:1fr}
}
.glance{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--gap)}
.glance .stat{display:flex;flex-direction:column;justify-content:space-between;min-height:clamp(260px,22vw,340px);padding:28px;border-radius:var(--r2);background:var(--card);border:1px solid var(--ln);box-shadow:var(--sh1)}
.glance .stat:nth-child(2){background:#f3f1ea;color:#0c0c0e;--fg:#0c0c0e;--mu:#62615b;border-color:transparent}
.glance .stat:nth-child(3){background:#0b0b0d url(/uploads/1qEcUtH4lHDuqfDdPiAdS-svc-01.webp) center/cover}
.glance .lab{margin-top:0}
.glance .stat{position:relative}
.gx{position:absolute;right:24px;bottom:24px;width:48px;height:48px;color:var(--fg);overflow:visible}
.gx .gt{fill:none;stroke:currentColor;stroke-opacity:.16;stroke-width:2}
.gx .gr{fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round}
.gx .gh{stroke:currentColor;stroke-width:2.4;stroke-linecap:round;transform-origin:32px 32px}
.gx .go{transform-origin:32px 32px}
.gx .gq{fill:currentColor;transform-box:fill-box;transform-origin:center}
.gx .gb1,.gx .gb2{transform-box:fill-box;transform-origin:center}
@media (max-width:1023px){.glance{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(240px,72%);overflow-x:auto;scroll-snap-type:x mandatory;margin-inline:calc(var(--gt) * -1);padding:4px var(--gt) 24px;scrollbar-width:none}
.glance::-webkit-scrollbar{display:none}
.glance .stat{scroll-snap-align:start}
}
.tgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--gap)}
@media (max-width:1023px){.tgrid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
.tcard{position:relative;aspect-ratio:2/3;border-radius:var(--r2);overflow:hidden;background:#151518;box-shadow:var(--sh1);isolation:isolate}
.tcard img{width:100%;height:100%;object-fit:cover;transition:transform 1.4s var(--e),filter 1s var(--e);filter:grayscale(1) contrast(1.02)}
.tcard::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(0,0,0,.72));transition:opacity .6s}
.tcard figcaption{position:absolute;left:20px;right:20px;bottom:18px;z-index:1;color:#f3f1ea}
.tcard .n{display:block;font-size:clamp(20px,1.6vw,24px);letter-spacing:-.02em}
.tcard .ro{display:block;font-size:13.5px;color:rgba(243,241,234,.7);margin-top:2px;transform:translateY(6px);opacity:.8;transition:transform .6s var(--e),opacity .6s}
.tcard:hover img{transform:scale(1.05)}
.tcard:hover .ro{transform:none;opacity:1}
.tjoin{display:flex;flex-direction:column;justify-content:space-between;aspect-ratio:2/3;padding:28px;border-radius:var(--r2);background:#0c0c0e;color:#f3f1ea;--fg:#f3f1ea;--mu:#8c8b84;box-shadow:var(--sh2)}
.tjoin h3{font-size:clamp(28px,2.4vw,38px);font-weight:var(--w-dsp);line-height:1;letter-spacing:-.035em;max-width:10ch}
.tjoin .tx{margin-top:20px}
.tjoin .lnk{align-self:flex-start}
.made{align-items:center}
.made .dodo img{width:min(460px,90%);margin-inline:auto;filter:drop-shadow(0 50px 70px rgba(0,0,0,.7))}
.made .glow{position:relative}
.made .glow::before{content:"";position:absolute;inset:10% 0 0;background:radial-gradient(closest-side,rgba(215,213,205,.16),transparent);z-index:-1}`,
  html: `<main>
  <section class="hero short abh">
    <div class="hero-bg"></div>
    <p class="kick">About Disruptive Dodo</p>
    <h1 class="d1 mt-24"><span class="mu">We're a Mauritian growth agency built on one idea:</span> your website, your marketing and your follow-up should work as one.</h1>
  </section>

  <section class="sheet lt sec" aria-labelledby="believe-h">
    <div class="ph r21x9" data-r="x"><div class="lb"><b>Team photo</b><span>The team together, in the office or on a shoot</span><i>21:9</i></div></div>
    <div class="head mt-128"><div><p class="kick">What we believe</p><h2 class="h2 mt-24" id="believe-h">Three rules we work by.</h2></div></div>
    <ol class="rules mt-64" data-r="s">
      <li><p class="cap">(01)</p><h3 class="h3 mt-24">Find the problem first.</h3><p class="tx mt-16">Before we recommend anything, we look at your marketing, sales, systems and operations to find where growth is getting stuck.</p></li>
      <li><p class="cap">(02)</p><h3 class="h3 mt-24">Do it once, do it right.</h3><p class="tx mt-16">Built properly the first time. One team, no wasted spend, nothing to redo later.</p></li>
      <li><p class="cap">(03)</p><h3 class="h3 mt-24">Measure what matters.</h3><p class="tx mt-16">More enquiries. More sales. Less wasted time. We focus on the numbers that actually move your business forward.</p></li>
    </ol>
  </section>

  <section class="sheet dk sec" aria-labelledby="glance-h">
    <div class="head"><h2 class="kick" id="glance-h">At a glance</h2><a class="lnk" href="mailto:info@disruptivedodo.mu">info@disruptivedodo.mu{{ar}}</a></div>
    <div class="glance mt-48" data-r="s">
      <div class="stat"><svg class="gx" viewBox="0 0 64 64" aria-hidden="true"><circle class="gt" cx="32" cy="32" r="26"/><circle class="gr" pathLength="1" stroke-dasharray="1" cx="32" cy="32" r="26" transform="rotate(-90 32 32)"/><line class="gh" x1="32" y1="32" x2="32" y2="15"/><circle cx="32" cy="32" r="2.6" fill="currentColor"/></svg><p class="fig">1 hr</p><p class="lab">Every enquiry answered within a business hour</p></div>
      <div class="stat"><svg class="gx" viewBox="0 0 64 64" aria-hidden="true"><circle class="gt" cx="32" cy="32" r="24"/><g class="go"><circle cx="32" cy="8" r="4.5" fill="currentColor"/></g><circle cx="32" cy="32" r="6" fill="none" stroke="currentColor" stroke-width="2"/></svg><p class="fig">24/7</p><p class="lab">Automated follow-up that never sleeps</p></div>
      <div class="stat"><svg class="gx" viewBox="0 0 64 64" aria-hidden="true"><rect class="gq" x="10" y="10" width="20" height="20" rx="5"/><rect class="gq" x="34" y="10" width="20" height="20" rx="5"/><rect class="gq" x="10" y="34" width="20" height="20" rx="5"/><rect class="gq" x="34" y="34" width="20" height="20" rx="5"/></svg><p class="fig">4</p><p class="lab">Growth stages, handled by one team</p></div>
      <div class="stat"><svg class="gx" viewBox="0 0 64 64" aria-hidden="true"><g class="gb1"><path d="M8 12h30a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6H20l-8 7v-7H8a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6z" fill="currentColor"/></g><g class="gb2"><path d="M26 26h30a6 6 0 0 1 6 6v12a6 6 0 0 1-6 6h-4v7l-8-7H26a6 6 0 0 1-6-6V32a6 6 0 0 1 6-6z" fill="none" stroke="currentColor" stroke-width="2.2"/></g></svg><p class="fig">EN·FR·KR</p><p class="lab">We work in English, French and Creole</p></div>
    </div>
  </section>

  <section class="sheet lt sec" aria-labelledby="team-h">
    <div class="head"><div><p class="kick">Our team</p><h2 class="h2 mt-24" id="team-h" style="max-width:14ch">The team doing the actual work.</h2></div>
      <p class="lead fg">Local team. Real specialists. No outsourcing.</p></div>
    <div class="tgrid mt-64" data-r="s">
      <figure class="tcard"><img src="/uploads/VxKLOkHcsbq18S-g9CxP9-team-lucas.webp" alt="Lucas" width="400" height="600" loading="lazy"><figcaption><span class="n">Lucas</span><span class="ro">Creative Director</span></figcaption></figure>
      <figure class="tcard"><img src="/uploads/psReDm2EvFIPMWKDtl_W6-team-jean-claude.webp" alt="Jean-Claude" width="400" height="600" loading="lazy"><figcaption><span class="n">Jean-Claude</span><span class="ro">Technology Director</span></figcaption></figure>
      <figure class="tcard"><img src="/uploads/ac4eJpQFBHbU6W8ToNFk7-team-kipchoge.webp" alt="Kipchoge" width="400" height="600" loading="lazy"><figcaption><span class="n">Kipchoge</span><span class="ro">Content Strategist &amp; Copywriter</span></figcaption></figure>
      <figure class="tcard"><img src="/uploads/qZbOLp5Sdl92rE4eTsAKn-team-karen.webp" alt="Karen" width="400" height="600" loading="lazy"><figcaption><span class="n">Karen</span><span class="ro">Admin Manager</span></figcaption></figure>
      <figure class="tcard"><img src="/uploads/ctcTzB-_AQJ2WqckaQUsh-team-ali.webp" alt="Ali" width="512" height="768" loading="lazy"><figcaption><span class="n">Ali</span><span class="ro">Automations Specialist</span></figcaption></figure>
      <figure class="tcard"><img src="/uploads/4Ur1DibNeUPgkczTSysdt-team-nigel.webp" alt="Nigel" width="400" height="600" loading="lazy"><figcaption><span class="n">Nigel</span><span class="ro">Global Business Developer</span></figcaption></figure>
      <figure class="tcard"><img src="/uploads/TNLv57W53is5HT2vkH3Ak-team-amara.webp" alt="Amara" width="400" height="600" loading="lazy"><figcaption><span class="n">Amara</span><span class="ro">Graphic Designer</span></figcaption></figure>
      <div class="tjoin">
        <div><h3>Want to join the team?</h3><p class="tx">Send us your work at <span class="todo">[careers email, to confirm]</span>.</p></div>
        <a class="lnk" href="/contact">Say hello{{ar}}</a>
      </div>
    </div>
  </section>

  <section class="sheet dk sec" aria-labelledby="made-h">
    <div class="g12 made">
      <div class="c1-5 glow" data-r="u"><div class="dodo"><img src="/uploads/8hzVIXmhSCC0RLLMXrB-F-hero-dodo.webp" alt="Disruptive Dodo mascot" width="921" height="1228" loading="lazy"></div></div>
      <div class="c7-12">
        <h2 class="d2" id="made-h">Built in Mauritius. Made to grow.</h2>
        <p class="lead mt-32">We're based in Mauritius and work with businesses here and abroad, in English, French and Creole.</p>
        <div class="btn-row mt-48"><a class="btn btn-p" href="/contact">Book a free growth call{{ar}}</a><a class="btn" href="/work">See our work</a></div>
      </div>
    </div>
  </section>
</main>`,
  // Live motion: looping scenes played by dd-core's motion engine (see motion()).
  motion: [
 {
  "root": ".glance",
  "D": 6000,
  "still": 0.5,
  "tracks": [
   [
    ".gr",
    0,
    [
     [
      300,
      5200,
      {
       "strokeDashoffset": 1
      },
      {
       "strokeDashoffset": 0
      },
      "io"
     ],
     [
      5400,
      5900,
      {},
      {
       "strokeDashoffset": 1
      },
      "io"
     ]
    ]
   ],
   [
    ".gh",
    0,
    [
     [
      300,
      5200,
      {
       "transform": "rotate(0deg)"
      },
      {
       "transform": "rotate(360deg)"
      },
      "io"
     ]
    ]
   ],
   [
    ".go",
    0,
    [
     [
      0,
      6000,
      {
       "transform": "rotate(0deg)"
      },
      {
       "transform": "rotate(360deg)"
      },
      "l"
     ]
    ]
   ],
   [
    ".gq",
    260,
    [
     [
      400,
      800,
      {
       "opacity": 0.16,
       "transform": "scale(.8)"
      },
      {
       "opacity": 1,
       "transform": "scale(1)"
      },
      "sp"
     ],
     [
      4600,
      5200,
      {},
      {
       "opacity": 0.16,
       "transform": "scale(.8)"
      },
      "io"
     ]
    ]
   ],
   [
    ".gb1",
    0,
    [
     [
      600,
      1000,
      {
       "opacity": 0.25,
       "transform": "translateY(4px)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sp"
     ],
     [
      3200,
      3600,
      {},
      {
       "opacity": 0.25,
       "transform": "translateY(4px)"
      },
      "io"
     ]
    ]
   ],
   [
    ".gb2",
    0,
    [
     [
      1800,
      2200,
      {
       "opacity": 0.25,
       "transform": "translateY(4px)"
      },
      {
       "opacity": 1,
       "transform": "none"
      },
      "sp"
     ],
     [
      4400,
      4800,
      {},
      {
       "opacity": 0.25,
       "transform": "translateY(4px)"
      },
      "io"
     ]
    ]
   ]
  ]
 }
],
  // Hero gradient: GetLayers "antumbra", tinted greyscale through its CONFIG. The shader is untouched.
  gl: { cfg: {"bgColor":"#08080a","colorA":"#121211","colorB":"#343332","colorC":"#7f7e7a","colorD":"#f3f1ea"}, poster: "", mount: function(canvas, __ovr, __opts) {
 const __dummy = {
  style: {},
  textContent: ""
 };
 const __R = () => canvas.getBoundingClientRect();
 const __W = () => canvas.clientWidth || 1;
 const __H = () => canvas.clientHeight || 1;
 const CONFIG = {
  bgColor: "#04050a",
  colorA: "#0d1020",
  colorB: "#2b3050",
  colorC: "#6f79a8",
  colorD: "#e8ecff",
  scale: 1.15,
  speed: .33,
  occScale: 1.3,
  roughness: .55,
  lacunarity: 2.05,
  solid: .56,
  throwStep: .085,
  softness: .075,
  shadow: .72,
  ambient: .24,
  nearFade: .2,
  lampGain: 1.35,
  fall: 2.2,
  exposure: 1.1,
  contrast: 1.05,
  midpoint: .46,
  glow: .26,
  sink: .24,
  grain: 0,
  grainAnim: 0,
  dither: 1.2,
  vignette: .3,
  cursor: 1,
  pointerRadius: .3,
  pointerStrength: .35,
  pointerLift: .35,
  parallax: .0017,
  maxDpr: 1
 };
 Object.assign(CONFIG, __ovr || {});
 function hexToVec3(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [ (n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255 ];
 }
 const gl = canvas.getContext("webgl2", {
  alpha: false,
  antialias: false,
  depth: false,
  stencil: false,
  powerPreference: "high-performance"
 });
 if (!gl) return null;
 const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
 const FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2  iResolution;
uniform float iTime;
uniform vec2  iMouse;
uniform vec2  iLag;
uniform vec2  iTail;
uniform float iEnergy;
uniform float iIntro;
uniform vec3  uBgColor, uColorA, uColorB, uColorC, uColorD;
uniform float uScale, uSpeed, uOccScale, uRoughness, uLacunarity, uSolid, uThrowStep, uSoftness;
uniform float uShadow, uAmbient, uNearFade, uLampGain, uFall, uExposure, uContrast, uMidpoint;
uniform float uGlow, uSink, uGrain, uDither, uVignette, uPointerRadius, uPointerStrength, uPointerLift;
uniform float uParallax;
#define TAU 6.28318530718
float hash1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}
float snoise(vec2 p) {
  const float K1 = 0.366025404, K2 = 0.211324865;
  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  float m = step(a.y, a.x);
  vec2 o = vec2(m, 1.0 - m);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n = h * h * h * h * vec3(dot(a, hash2(i)), dot(b, hash2(i + o)), dot(c, hash2(i + 1.0)));
  return dot(n, vec3(70.0));
}
#define OCT 5
float fbm(vec2 p, float gain, float lac) {
  float v = 0.0, amp = 0.5;
  for (int i = 0; i < OCT; i++) { v += amp * snoise(p); p *= lac; amp *= gain; }
  return v;
}
#define OCT3 3
float fbm3(vec2 p, float gain, float lac) {
  float v = 0.0, amp = 0.5;
  for (int i = 0; i < OCT3; i++) { v += amp * snoise(p); p *= lac; amp *= gain; }
  return v;
}
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
vec3 ramp4(float t) {
  vec3 c = mix(uColorA, uColorB, smoothstep(0.00, 0.36, t));
  c = mix(c, uColorC, smoothstep(0.32, 0.70, t));
  c = mix(c, uColorD, smoothstep(0.66, 1.00, t));
  return c;
}
float triDither(vec2 fc) {
  float a = fract(sin(dot(fc, vec2(12.9898, 78.233))) * 43758.5453);
  float b = fract(sin(dot(fc + 17.0, vec2(12.9898, 78.233))) * 43758.5453);
  return (a + b - 1.0) / 255.0;
}
float occluder(vec2 q, float t) {
  return fbm3(q * uOccScale + vec2(t * 0.035, -t * 0.028), uRoughness, uLacunarity) * 0.5 + 0.5;
}
uniform float uGrainAnim;
float houseGrain(vec2 fc) {
  uvec2 q = uvec2(fc) * uvec2(1597334677u, 3812015801u)
          + uint(floor(iTime * 24.0 * uGrainAnim)) * 2654435769u;
  uint n = q.x ^ q.y; n = n * 1664525u + 1013904223u; n ^= n >> 16u; n *= 2246822519u; n ^= n >> 13u;
  float a = float(n & 0xffffu) / 65535.0;
  n *= 3266489917u; n ^= n >> 16u;
  float b = float(n & 0xffffu) / 65535.0;
  return a + b - 1.0;
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution) / iResolution.y;
  float t = iTime * uSpeed;
  vec2 p = (uv - iMouse * uParallax) * uScale;
  vec2 toLamp = iMouse - uv;
  float dl = length(toLamp);
  vec2 dir = toLamp / (dl + 1e-4);
  float shade = 0.0;
  for (int i = 1; i <= 3; i++) {
    float fi = float(i);
    float h = occluder(p + dir * (fi * uThrowStep) * uScale, t);
    float band = uSoftness * fi;
    float blocked = smoothstep(uSolid - band, uSolid + band, h);
    shade = max(shade, blocked * (1.0 - (fi - 1.0) * 0.16));
  }
  shade *= smoothstep(0.0, uNearFade, dl);
  float lamp = uLampGain / (1.0 + dl * dl * uFall);
  lamp += exp(-dot(toLamp, toLamp) / max(1e-4, uPointerRadius * uPointerRadius)) * uPointerLift;
  lamp *= mix(1.0, 0.55 + 0.45 * iEnergy, uPointerStrength) * iIntro;
  float tooth = occluder(p * 1.7 + vec2(4.2, 1.1), t * 0.6);
  float lit = 1.0 - exp(-((lamp * (1.0 - shade * uShadow) + uAmbient) * (0.7 + 0.6 * tooth)) * uExposure);
  float g = clamp((lit - uMidpoint) * uContrast + 0.5, 0.0, 1.0);
  vec3 col = ramp4(g);
  col += uColorD * uGlow * pow(g, 6.0);
  col = mix(uBgColor, col, smoothstep(0.0, max(0.01, uSink), g) * 0.90 + 0.10);
  col *= 1.0 - uVignette * dot(uv, uv);
  { float hgL = clamp(dot(col, vec3(0.299, 0.587, 0.114)), 0.0, 1.0);
    col += houseGrain(gl_FragCoord.xy) * uGrain * mix(1.0, 4.0 * hgL * (1.0 - hgL), 0.6); }
  col += triDither(gl_FragCoord.xy) * uDither;
  fragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;
 function compile(type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh));
  return sh;
 }
 const program = gl.createProgram();
 gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
 gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
 gl.linkProgram(program);
 if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
 gl.useProgram(program);
 gl.bindVertexArray(gl.createVertexArray());
 const LOC = {};
 const loc = n => n in LOC ? LOC[n] : LOC[n] = gl.getUniformLocation(program, n);
 const u1f = (n, v) => gl.uniform1f(loc(n), v);
 const u2f = (n, x, y) => gl.uniform2f(loc(n), x, y);
 const u3c = (n, hex) => {
  const c = hexToVec3(hex);
  gl.uniform3f(loc(n), c[0], c[1], c[2]);
 };
 function applyConfig() {
  gl.useProgram(program);
  for (const k in CONFIG) {
   if (k === "maxDpr") continue;
   const n = "u" + k[0].toUpperCase() + k.slice(1);
   if (typeof CONFIG[k] === "string") u3c(n, CONFIG[k]); else u1f(n, CONFIG[k]);
  }
  resize();
 }
 let dpr = 1;
 function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
  const w = Math.max(1, Math.round(__W() * dpr));
  const h = Math.max(1, Math.round(__H() * dpr));
  if (canvas.width !== w || canvas.height !== h) {
   canvas.width = w;
   canvas.height = h;
  }
  gl.viewport(0, 0, w, h);
  gl.useProgram(program);
  u2f("iResolution", w, h);
 }
 let resizeQueued = false;
 addEventListener("resize", () => {
  if (resizeQueued) return;
  resizeQueued = true;
  requestAnimationFrame(() => {
   resizeQueued = false;
   resize();
  });
 }, {
  passive: true
 });
 const P = {
  tx: 0,
  ty: 0,
  hx: 0,
  hy: 0,
  mx: 0,
  my: 0,
  sx: 0,
  sy: 0,
  e: 0
 };
 let seeded = false;
 const aim = e => {
  const a = __W() / __H();
  P.tx = ((e.clientX - __R().left) / __W() - .5) * a;
  P.ty = .5 - (e.clientY - __R().top) / __H();
  if (!seeded) {
   seeded = true;
   P.hx = P.mx = P.sx = P.tx;
   P.hy = P.my = P.sy = P.ty;
  }
 };
 addEventListener("pointermove", aim, {
  passive: true
 });
 addEventListener("pointerdown", aim, {
  passive: true
 });
 const fadeEl = __dummy;
 const fpsEl = __dummy;
 let visible = true;
 new IntersectionObserver(es => {
  visible = es[0].isIntersecting;
 }, {
  threshold: 0
 }).observe(canvas);
 let prevT = performance.now(), clock = 0, intro = 0, fpsT = prevT, fpsN = 0;
 function frame(now) {
  requestAnimationFrame(frame);
  const raw = now - prevT;
  prevT = now;
  if (!visible || document.hidden) return;
  const dt = raw > 50 ? .05 : raw < .001 ? .001 : raw * .001;
  clock += dt;
  const kh = 1 - Math.exp(-6 * dt);
  const km = 1 - Math.exp(-2.6 * dt);
  const ks = 1 - Math.exp(-1.25 * dt);
  P.hx += (P.tx - P.hx) * kh;
  P.hy += (P.ty - P.hy) * kh;
  P.mx += (P.hx - P.mx) * km;
  P.my += (P.hy - P.my) * km;
  P.sx += (P.mx - P.sx) * ks;
  P.sy += (P.my - P.sy) * ks;
  const ex = P.hx - P.sx, ey = P.hy - P.sy;
  const want = Math.min(Math.sqrt(ex * ex + ey * ey) * 5.5, 1);
  P.e += (want - P.e) * (1 - Math.exp(-(want > P.e ? 5 : .4) * dt));
  intro += ((seeded ? 1 : 0) - intro) * (1 - Math.exp(-3 * dt));
  u1f("iTime", clock);
  u1f("iEnergy", P.e);
  u1f("iIntro", intro);
  P.rest === undefined ? P.rest = {
   x: P.tx,
   y: P.ty
  } : 0;
  if (!CONFIG.cursor) {
   P.tx = P.rest.x;
   P.ty = P.rest.y;
  }
  u2f("iMouse", P.hx, P.hy);
  u2f("iLag", P.mx, P.my);
  u2f("iTail", P.sx, P.sy);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  fpsN++;
  if (now - fpsT > 500) {
   fpsEl.textContent = Math.round(fpsN * 1e3 / (now - fpsT)) + " fps · " + dpr.toFixed(1) + "×";
   fpsT = now;
   fpsN = 0;
  }
 }
 applyConfig();
 gl.drawArrays(gl.TRIANGLES, 0, 3);
 fadeEl.style.opacity = 0;
 new ResizeObserver(() => resize()).observe(canvas);
 if (__opts && __opts.still) {
  gl.useProgram(program);
  u1f("iTime", __opts.t || 6);
  u1f("iIntro", 1);
  u2f("iMouse", 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
 } else requestAnimationFrame(frame);
 return {
  gl: gl
 };
} },
};
DD.current = "about";
if (DD.mount) DD.mount();
