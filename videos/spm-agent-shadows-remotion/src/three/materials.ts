import { AdditiveBlending, NormalBlending, ShaderMaterial, Texture, Vector3, type IUniform } from "three";
import { SD, MIC } from "./world";

/**
 * Shared per-frame uniforms. Every material reads time and the scan front from here, so one
 * update per frame keeps the whole world in sync. Values are written by <World/> before R3F
 * renders the frame.
 */
export const U = {
  uTime: { value: 0 },
  uR: { value: 0 },
  uMic: { value: new Vector3(...MIC) },
  uDrain: { value: 0 },
  uFade: { value: 1 },
  uPix: { value: 1080 / (2 * Math.tan((SD.fov * Math.PI) / 360)) },
  uFogNear: { value: 14 },
  uFogFar: { value: 34 },
} satisfies Record<string, IUniform>;

/** Brand colours as linear-free raw RGB (colour management is off: bytes in, bytes out). */
const GLSL_COLORS = /* glsl */ `
  const vec3 ICE = vec3(0.863, 0.925, 0.949);
  const vec3 NEON = vec3(0.369, 0.839, 0.871);
  const vec3 TEAL = vec3(0.133, 0.502, 0.541);
  const vec3 CORE = vec3(0.925, 0.988, 1.0);
  const vec3 STEEL = vec3(0.263, 0.380, 0.478);
`;

const FOG = /* glsl */ `
  uniform float uFogNear; uniform float uFogFar;
  float fogK(float viewDist) { return 1.0 - smoothstep(uFogNear, uFogFar, viewDist); }
`;

// ---------------------------------------------------------------------------------------------
// Relief: a photo layer unprojected through the opening camera with an authored depth map.
// Behind the scan front it dissolves, leaving its point cloud.
// ---------------------------------------------------------------------------------------------
export function reliefMaterial(opts: {
  map: Texture;
  depth?: Texture;
  rect: [number, number, number, number];
  range?: [number, number];
  constDepth?: number;
}) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: true,
    uniforms: {
      ...U,
      uMap: { value: opts.map },
      uDepth: { value: opts.depth ?? null },
      uRect: { value: opts.rect },
      uRange: { value: opts.range ?? [0, 1] },
      uConst: { value: opts.constDepth ?? 0 },
      uFocal: { value: SD.focal },
      uCamY: { value: SD.camY },
      uOpacity: { value: 1 },
      uDissolve: { value: 1 },
    },
    vertexShader: /* glsl */ `
      uniform sampler2D uDepth; uniform vec4 uRect; uniform vec2 uRange; uniform float uConst;
      uniform float uFocal; uniform float uCamY;
      varying vec2 vUv; varying vec3 vWorld;
      void main() {
        vUv = uv;
        vec2 px = vec2(uRect.x + uv.x * uRect.z, uRect.y + (1.0 - uv.y) * uRect.w);
        float d = uConst;
        if (d <= 0.0) {
          vec2 duv = clamp(px / vec2(1920.0, 1080.0), 0.0, 1.0);
          d = uRange.x + texture2D(uDepth, vec2(duv.x, 1.0 - duv.y)).r * (uRange.y - uRange.x);
        }
        vec3 w = vec3((px.x - 960.0) / uFocal * d, uCamY - (px.y - 540.0) / uFocal * d, -d);
        vWorld = w;
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_COLORS}
      uniform sampler2D uMap; uniform float uOpacity; uniform float uR; uniform vec3 uMic;
      uniform float uDissolve;
      varying vec2 vUv; varying vec3 vWorld;
      void main() {
        vec4 c = texture2D(uMap, vUv);
        float dist = length(vWorld - uMic);
        float keep = mix(1.0, smoothstep(uR - 0.45, uR + 0.02, dist), uDissolve);
        float rim = uR > 0.01 ? exp(-abs(dist - uR) * 24.0) : 0.0;
        float a = c.a * uOpacity * keep;
        if (a < 0.03) discard;
        vec3 col = mix(c.rgb, NEON * 1.15, rim * 0.55 * uDissolve);
        gl_FragColor = vec4(col, a);
      }
    `,
  });
}

// ---------------------------------------------------------------------------------------------
// Scanned points: appear behind the front, drift from photo colour to teal / ice.
// Used for the hero point cloud and for every figure on the floor.
// ---------------------------------------------------------------------------------------------
export function scanPointsMaterial(size: number, photoColour: boolean) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { ...U, uSize: { value: size }, uPhoto: { value: photoColour ? 1 : 0 }, uAlpha: { value: 1 } },
    vertexShader: /* glsl */ `
      ${GLSL_COLORS}
      ${FOG}
      attribute vec3 aColor; attribute float aLuma;
      uniform float uR; uniform vec3 uMic; uniform float uDrain; uniform float uSize; uniform float uPix;
      uniform float uPhoto; uniform float uTime;
      varying vec3 vCol; varying float vA;
      void main() {
        float dist = length(position - uMic);
        float inside = uR - dist;
        float on = smoothstep(0.0, 0.1, inside);
        float settle = smoothstep(0.1, 1.6, inside);
        vec3 tint = mix(TEAL * 0.9, ICE, smoothstep(0.2, 0.8, aLuma));
        vec3 col = mix(mix(tint, aColor, uPhoto), tint, clamp(settle * 0.85 + uDrain, 0.0, 1.0));
        float band = exp(-inside * inside * 18.0) * on;
        col += CORE * band * 1.2;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float vd = -mv.z;
        float px = uSize * uPix / 1000.0 / vd;
        gl_PointSize = clamp(px, 1.4, 9.0) * (1.0 + band);
        float sub = clamp(px / 1.4, 0.25, 1.0);
        vCol = col;
        vA = on * sub * fogK(vd) * smoothstep(0.35, 1.3, vd) * (0.55 + 0.45 * (1.0 - uPhoto * (1.0 - settle)));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uFade; uniform float uAlpha;
      varying vec3 vCol; varying float vA;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        float a = smoothstep(0.5, 0.1, r) * vA * uFade * uAlpha;
        gl_FragColor = vec4(vCol * a, a);
      }
    `,
  });
}

// ---------------------------------------------------------------------------------------------
// Wireframe furniture: drawn by the front with a bright flash, dims with the drain.
// ---------------------------------------------------------------------------------------------
export function scanLinesMaterial(brightness = 1) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { ...U, uBright: { value: brightness } },
    vertexShader: /* glsl */ `
      ${FOG}
      uniform float uR; uniform vec3 uMic;
      varying float vInside; varying float vFog;
      void main() {
        vInside = uR - length(position - uMic);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vFog = fogK(-mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_COLORS}
      uniform float uDrain; uniform float uFade; uniform float uBright;
      varying float vInside; varying float vFog;
      void main() {
        float on = smoothstep(0.0, 0.15, vInside);
        if (on <= 0.0) discard;
        float flash = exp(-max(vInside, 0.0) * 1.6);
        vec3 col = mix(ICE * 0.62, NEON, flash * 0.6) + CORE * flash * 0.8;
        float a = on * vFog * uFade * uBright * mix(0.75, 0.5, uDrain);
        gl_FragColor = vec4(col * a, a);
      }
    `,
  });
}

// ---------------------------------------------------------------------------------------------
// Agents: teal point clouds rising behind each figure. aT = rise start (s).
// ---------------------------------------------------------------------------------------------
const AGENT_RISE = /* glsl */ `
  attribute float aT; attribute vec3 aScatter;
  uniform float uTime; uniform float uMirror;
  float riseQ() { float q = clamp((uTime - aT) / 0.75, 0.0, 1.0); return 1.0 - pow(1.0 - q, 3.0); }
  vec3 risePos(float q) {
    vec3 p = position;
    p.y -= (1.0 - q) * 0.75;
    p += aScatter * pow(1.0 - q, 2.0) * 0.55;
    if (uMirror > 0.5) p.y = -p.y;
    return p;
  }
`;

export function agentPointsMaterial(size: number, mirror = false) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { ...U, uSize: { value: size }, uMirror: { value: mirror ? 1 : 0 }, uAlpha: { value: mirror ? 0.16 : 1 } },
    vertexShader: /* glsl */ `
      ${GLSL_COLORS}
      ${FOG}
      ${AGENT_RISE}
      attribute float aM;
      uniform float uSize; uniform float uPix;
      varying vec3 vCol; varying float vA;
      void main() {
        float q = riseQ();
        vec4 mv = modelViewMatrix * vec4(risePos(q), 1.0);
        float vd = -mv.z;
        float px = uSize * uPix / 1000.0 / vd;
        gl_PointSize = clamp(px, 1.6, 12.0);
        float hot = step(0.78, aM);
        vCol = mix(NEON, CORE, hot * 0.7);
        float twinkle = 0.8 + 0.2 * sin(uTime * 5.0 + aScatter.x * 40.0);
        vA = q * (0.45 + 0.55 * aM) * twinkle * fogK(vd) * clamp(px / 1.6, 0.4, 1.0) * smoothstep(0.35, 1.3, vd);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uFade; uniform float uAlpha;
      varying vec3 vCol; varying float vA;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        if (r > 0.5) discard;
        float a = smoothstep(0.5, 0.0, r) * vA * uFade * uAlpha;
        gl_FragColor = vec4(vCol * a, a);
      }
    `,
  });
}

export function agentLinesMaterial(alpha: number, mirror = false) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { ...U, uMirror: { value: mirror ? 1 : 0 }, uAlpha: { value: alpha * (mirror ? 0.16 : 1) } },
    vertexShader: /* glsl */ `
      ${FOG}
      ${AGENT_RISE}
      attribute float aKind;
      varying float vA;
      void main() {
        float q = riseQ();
        vec4 mv = modelViewMatrix * vec4(risePos(q), 1.0);
        vA = q * fogK(-mv.z) * mix(1.0, 0.22, aKind) * smoothstep(0.35, 1.3, -mv.z);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_COLORS}
      uniform float uFade; uniform float uAlpha;
      varying float vA;
      void main() {
        float a = vA * uFade * uAlpha;
        gl_FragColor = vec4(mix(NEON, CORE, 0.2) * a, a);
      }
    `,
  });
}

// ---------------------------------------------------------------------------------------------
// Ribbons: tapered tubes that grow from their source, carry light packets and glow at the tip.
// Geometry carries the centre line (position), a radial unit offset (aOff) and arc length (aU).
// ---------------------------------------------------------------------------------------------
export function ribbonMaterial(width: number, alpha: number, mirror = false) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { ...U, uWidth: { value: width }, uAlpha: { value: alpha * (mirror ? 0.18 : 1) }, uMirror: { value: mirror ? 1 : 0 } },
    vertexShader: /* glsl */ `
      ${FOG}
      attribute vec3 aOff; attribute float aU; attribute vec2 aGrow; attribute float aSeed;
      uniform float uTime; uniform float uWidth; uniform float uMirror;
      varying float vU; varying float vGrow; varying float vSeed; varying float vFog; varying float vEdge;
      void main() {
        float g = clamp((uTime - aGrow.x) / aGrow.y, 0.0, 1.0);
        g = g < 0.5 ? 4.0 * g * g * g : 1.0 - pow(-2.0 * g + 2.0, 3.0) / 2.0;
        float rel = aU / max(g, 0.001);
        float taper = pow(sin(3.14159 * clamp(rel, 0.0, 1.0)), 0.7) * (0.6 + 0.4 * sin(aU * 9.0 + aSeed * 6.0));
        float w = uWidth * taper * step(aU, g);
        vec3 p = position + aOff * w;
        if (uMirror > 0.5) p.y = -p.y;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vU = aU; vGrow = g; vSeed = aSeed; vFog = fogK(-mv.z) * smoothstep(0.7, 2.4, -mv.z);
        vEdge = taper;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_COLORS}
      uniform float uTime; uniform float uFade; uniform float uAlpha; uniform float uDrain;
      varying float vU; varying float vGrow; varying float vSeed; varying float vFog; varying float vEdge;
      void main() {
        if (vU > vGrow || vGrow <= 0.0) discard;
        float rel = vU / max(vGrow, 0.001);
        float tip = exp(-(1.0 - rel) * 14.0) * step(vGrow, 0.995) + exp(-(1.0 - rel) * 30.0) * 0.4;
        float flow = fract(vU * 3.0 - uTime * 0.7 + vSeed);
        float packet = smoothstep(0.93, 1.0, flow) * 1.6;
        vec3 col = mix(ICE, NEON, smoothstep(0.2, 1.0, rel)) * (0.35 + 0.5 * rel) + CORE * (tip + packet);
        float a = (0.25 + 0.75 * rel) * vFog * uFade * uAlpha * (0.6 + 0.4 * vEdge);
        gl_FragColor = vec4(col * a, a);
      }
    `,
  });
}

// ---------------------------------------------------------------------------------------------
// Floor: a dark glossy slab drawn by the scan, with a faint hairline lattice of the pod grid.
// ---------------------------------------------------------------------------------------------
export function floorMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
    uniforms: { ...U },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_COLORS}
      uniform float uR; uniform vec3 uMic; uniform float uDrain; uniform float uFade; uniform float uTime;
      varying vec3 vWorld;
      void main() {
        float inside = uR - length(vWorld - uMic);
        float on = smoothstep(0.0, 0.6, inside);
        float far = 1.0 - smoothstep(6.0, 30.0, length(vWorld.xz - uMic.xz));
        float sheen = 0.5 + 0.5 * far;
        vec3 base = mix(vec3(0.106, 0.165, 0.22), vec3(0.051, 0.078, 0.122), 0.4 + 0.6 * uDrain);
        float ring = exp(-abs(inside) * 3.0) * 0.18 * step(0.0, inside) * (1.0 - smoothstep(3.9, 4.4, uTime));
        vec3 col = base * sheen + NEON * ring;
        gl_FragColor = vec4(col, on * far * uFade * 0.9);
      }
    `,
  });
}

// ---------------------------------------------------------------------------------------------
// Agent glow: one soft teal sprite per agent, sized in metres (a cheap, stable bloom).
// ---------------------------------------------------------------------------------------------
export function agentGlowMaterial(sizeM: number, alpha: number) {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { ...U, uSize: { value: sizeM }, uAlpha: { value: alpha }, uMirror: { value: 0 } },
    vertexShader: /* glsl */ `
      ${FOG}
      ${AGENT_RISE}
      uniform float uSize; uniform float uPix;
      varying float vA;
      void main() {
        float q = riseQ();
        vec4 mv = modelViewMatrix * vec4(risePos(q), 1.0);
        float vd = -mv.z;
        gl_PointSize = clamp(uSize * uPix / vd, 2.0, 900.0);
        vA = q * fogK(vd) * smoothstep(0.6, 2.5, vd);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      ${GLSL_COLORS}
      uniform float uFade; uniform float uAlpha;
      varying float vA;
      void main() {
        float r = length(gl_PointCoord - 0.5) * 2.0;
        float a = exp(-r * r * 4.0) * (1.0 - r) * vA * uFade * uAlpha;
        if (a <= 0.0) discard;
        gl_FragColor = vec4(mix(TEAL, NEON, 0.5) * a, a);
      }
    `,
  });
}
