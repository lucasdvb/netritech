// SPM hero #6 — Origami Office. A flat printed sheet folds itself into a paper office; four paper teammates
// flip up; a teal paper crane (the AI) flies desk to desk and brings each role to life.
//
// Rendering: a tiny orthographic 3D painter in SVG. Orthographic projection keeps every planar face affine,
// so the CAST characters (2D SVG) map onto their paper cards with a plain matrix(). paint(t) is a pure
// function of t; the HyperFrames/GSAP timeline drives it through the clock setter in index.html.
(() => {
  const { P, person, SPECS, shade, f } = CAST;
  const W = 1920, H = 1080, DUR = 10;
  const ez = (name) => gsap.parseEase(name);
  const E = { io: ez('power2.inOut'), io3: ez('power3.inOut'), out: ez('power3.out'), back: ez('back.out(1.6)'), back2: ez('back.out(2.4)'), el: ez('elastic.out(1, 0.55)') };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const D2R = Math.PI / 180;

  // ------------------------------------------------------------------ vectors
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  // a frame: origin O, axes U (right), D (up the sheet), N (out of the sheet). point(u, d, e)
  const at = (F, u, d, e = 0) => add(add(add(F.O, mul(F.U, u)), mul(F.D, d)), mul(F.N, e));
  const frame = (O, U, D) => ({ O, U, D, N: norm(cross(U, D)) });

  // ------------------------------------------------------------------ camera (set per frame)
  let CAM;
  function setCam(yawDeg, pitchDeg, S, focus, cx = W / 2, cy = H / 2) {
    const y = yawDeg * D2R, p = pitchDeg * D2R;
    CAM = { cy_: Math.cos(y), sy_: Math.sin(y), cp: Math.cos(p), sp: Math.sin(p), S, F: focus, cx, cy };
    CAM.fwd = [CAM.sy_ * CAM.cp, CAM.cy_ * CAM.cp, -CAM.sp];   // direction the camera looks (away from viewer)
  }
  function proj(q) {
    const x = q[0] - CAM.F[0], y = q[1] - CAM.F[1], z = q[2] - CAM.F[2];
    const xr = x * CAM.cy_ - y * CAM.sy_, yr = x * CAM.sy_ + y * CAM.cy_;
    return [CAM.cx + CAM.S * xr, CAM.cy - CAM.S * (yr * CAM.sp + z * CAM.cp)];
  }
  const depth = (q) => dot(q, CAM.fwd);
  // linear part of the projection (for affine-mapping 2D art onto a face)
  const projV = (v) => { const a = proj(v), o = proj([0, 0, 0]); return [a[0] - o[0], a[1] - o[1]]; };

  // ------------------------------------------------------------------ paper shading
  const LIGHT = norm([-0.45, -0.7, 0.85]);
  function lit(base, n, twoSided = true) {
    let nn = n;
    if (twoSided && dot(nn, CAM.fwd) > 0) nn = mul(nn, -1);
    const k = dot(nn, LIGHT);                         // -1..1
    return shade(base, k >= 0 ? 0.1 * k : 0.16 * k);
  }
  const ptsAttr = (pts) => pts.map((q) => { const s = proj(q); return f(s[0]) + ',' + f(s[1]); }).join(' ');
  const poly = (pts, fill, extra = '') => `<polygon points="${ptsAttr(pts)}" fill="${fill}" ${extra}/>`;
  const faceNormal = (pts) => norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
  const facing = (pts) => dot(faceNormal(pts), CAM.fwd) < 0;

  // a box standing on a frame: footprint centred at (u, d) in frame F, size w × l, height h (along N)
  function box(F, u, d, w, l, h, col, opts = {}) {
    const c = (a, b, e) => at(F, u + a, d + b, e);
    const hw = w / 2, hl = l / 2;
    const v = [c(-hw, -hl, 0), c(hw, -hl, 0), c(hw, hl, 0), c(-hw, hl, 0), c(-hw, -hl, h), c(hw, -hl, h), c(hw, hl, h), c(-hw, hl, h)];
    const faces = [[4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    const cols = opts.cols || [];
    let s = '';
    const vis = faces.map((fc, i) => ({ fc, i, pts: fc.map((k) => v[k]) })).filter((o) => o.i === 0 ? h > 0.01 || true : h > 0.5 && facing(o.pts));
    vis.sort((a, b) => depthOf(b.pts) - depthOf(a.pts));
    for (const o of vis) {
      if (o.i !== 0 && !facing(o.pts)) continue;
      s += poly(o.pts, lit(cols[o.i] || col, faceNormal(o.pts), true), opts.stroke ? `stroke="${opts.stroke}" stroke-width="1"` : '');
    }
    return { svg: s, top: (a, b, e = 0) => c(a, b, h + e), v };
  }
  const depthOf = (pts) => pts.reduce((s, q) => s + depth(q), 0) / pts.length;

  // extrude a planar 2D polygon (frame coords [u, d]) out of frame F by thickness e0→e1
  function extrude(F, pts2, e, col, sideCol) {
    if (e <= 0.05) return poly(pts2.map(([u, d]) => at(F, u, d, 0.5)), col);
    const fr = pts2.map(([u, d]) => at(F, u, d, e)), bk = pts2.map(([u, d]) => at(F, u, d, 0));
    let s = '';
    const sides = [];
    for (let i = 0; i < pts2.length; i++) {
      const j = (i + 1) % pts2.length, q = [bk[i], bk[j], fr[j], fr[i]];
      if (facing(q) || facing([...q].reverse())) sides.push(q);
    }
    sides.sort((a, b) => depthOf(b) - depthOf(a));
    for (const q of sides) s += poly(q, lit(sideCol || shade(col, -0.15), faceNormal(q)));
    s += poly(fr, lit(col, F.N));
    return s;
  }
  // map 2D art (u right, v down, origin = art origin) onto frame F at (u0, d0), k world units per art unit
  function artOn(F, u0, d0, k, svg, e = 0.6, attrs = '') {
    const o = proj(at(F, u0, d0, e)), U = projV(mul(F.U, k)), Dn = projV(mul(F.D, -k));
    return `<g transform="matrix(${f(U[0])} ${f(U[1])} ${f(Dn[0])} ${f(Dn[1])} ${f(o[0])} ${f(o[1])})" ${attrs}>${svg}</g>`;
  }
  // rounded rectangle / bubble outlines as 2D point lists
  function rrect(cx, cy, w, h, r, n = 4) {
    const pts = [], cs = [[cx + w / 2 - r, cy + h / 2 - r, 0], [cx - w / 2 + r, cy + h / 2 - r, 90], [cx - w / 2 + r, cy - h / 2 + r, 180], [cx + w / 2 - r, cy - h / 2 + r, 270]];
    for (const [x, y, a0] of cs) for (let i = 0; i <= n; i++) { const a = (a0 + (90 * i) / n) * D2R; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); }
    return pts;
  }
  function circle2(cx, cy, r, n = 18) { const p = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return p; }

  // ------------------------------------------------------------------ the room
  const RW = 1100, RL = 800, WH = 430;                     // room width (x), depth (y), wall height
  const PAPER = '#EDEFF1', FLOOR = '#DEE1E4', LINE = P.steel;
  // stations: back-left Support (bubbles on the left wall), back-right Sales (chart on the back wall above),
  // front-left Admin (paper stack on the desk), front-right Recruitment (profile cards pop up on the desk)
  const ST = {
    support:   { key: 'support',   x: -270, y: 80,   idx: 0 },
    sales:     { key: 'sales',     x: 250,  y: 80,   idx: 1 },
    admin:     { key: 'admin',     x: -250, y: -220, idx: 2 },
    recruiter: { key: 'recruiter', x: 270,  y: -220, idx: 3 },
  };
  const STATIONS = [ST.support, ST.sales, ST.admin, ST.recruiter];
  const DESK_H = 96;

  // timings (seconds). The crane's arrival at each stop IS that role's activation time.
  const T = { foldB: [0.0, 1.15], foldL: [0.3, 1.45], cam: [0.0, 2.8], drift: [2.8, 9.0],
    cards: [1.15, 0.15], desks: [1.75, 0.14], crane: 2.55, perch: 8.35 };
  ST.support.t = 3.35; ST.admin.t = 4.45; ST.recruiter.t = 5.55; ST.sales.t = 6.65;

  // crane path: keyframes [t, x, y, z]; each stop has an arrive and a leave key a little apart (a hover)
  const PERCH = [-150, 404, 474];
  // hover points solved in screen space: each sits beside its payoff and >= 150 px from every face
  const PATH = [
    [2.55, -415, -300, 6], [2.95, -420, -220, 330],            // lifts off its print on the sheet (front-left)
    [3.35, -390, 0, 420], [3.75, -394, -10, 414],               // Support: beside the left-wall bubbles
    [4.45, -370, -395, 220], [4.85, -364, -400, 210],           // Admin: front-left of the paper stack
    [5.2, -60, -500, 200],                                      // low pass in front of the desks
    [5.55, 170, -390, 272], [5.95, 176, -384, 266],             // Recruitment: in front of her desk cards
    [6.3, 120, -60, 540],
    [6.65, 180, 260, 400], [7.05, 172, 262, 394],               // Sales: in front of the wall chart
    [7.7, -20, 330, 560], [8.35, PERCH[0], PERCH[1], PERCH[2] + 18], [8.65, PERCH[0], PERCH[1], PERCH[2] - 6],
    [8.95, ...PERCH], [10.2, ...PERCH],
  ];
  function pathAt(t) {
    const K = PATH, n = K.length;
    if (t <= K[0][0]) return K[0].slice(1);
    if (t >= K[n - 1][0]) return K[n - 1].slice(1);
    let i = 0; while (i < n - 2 && t > K[i + 1][0]) i++;
    const p0 = K[Math.max(0, i - 1)], p1 = K[i], p2 = K[i + 1], p3 = K[Math.min(n - 1, i + 2)];
    const u = (t - p1[0]) / (p2[0] - p1[0]);
    const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
    return [1, 2, 3].map((k) => cr(p0[k], p1[k], p2[k], p3[k]));
  }

  // ------------------------------------------------------------------ the crane (AI) — local: x forward, y left, z up
  function cranePolys(pos, heading, flap, scale, roll = 0) {
    const cr_ = Math.cos(roll), sr_ = Math.sin(roll);
    const ch = Math.cos(heading), sh = Math.sin(heading);
    const X = (q0) => {
      const q = [q0[0], q0[1] * cr_ - q0[2] * sr_, q0[1] * sr_ + q0[2] * cr_];   // roll about the body axis
      return [pos[0] + scale * (q[0] * ch - q[1] * sh), pos[1] + scale * (q[0] * sh + q[1] * ch), pos[2] + scale * q[2]];
    };
    const wy = 88 * Math.cos(flap), wz = 88 * Math.sin(flap);
    const tris = [
      [[-40, 0, 0], [40, 0, 0], [0, -10, -30], P.teal],
      [[-40, 0, 0], [40, 0, 0], [0, 10, -30], P.teal],
      [[22, 0, -2], [74, 0, 58], [34, 0, -12], '#1C6E77'],
      [[74, 0, 58], [94, 0, 49], [72, 0, 47], '#1C6E77'],
      [[-22, 0, -2], [-80, 0, 52], [-34, 0, -12], '#1C6E77'],
      [[-30, 0, 2], [32, 0, 2], [-4, wy, wz + 6], '#2B9AA5'],
      [[-30, 0, 2], [32, 0, 2], [-4, -wy, wz + 6], '#2B9AA5'],
    ];
    return tris.map(([a, b, c, col]) => ({ pts: [X(a), X(b), X(c)], col }));
  }
  // before take-off the crane is printed flat on the sheet: a teal dashed fold-mark (it is the AI, so teal is allowed)
  const P0 = PATH[0].slice(1), H0 = Math.atan2(PATH[1][2] - PATH[0][2], PATH[1][1] - PATH[0][1]);
  function cranePrint(t) {
    if (t >= T.crane + 0.2) return '';
    let svg = '';
    for (const o of cranePolys([P0[0], P0[1], 0.6], H0, 90 * D2R, 1.35, -90 * D2R)) svg += poly(o.pts, P.teal, `fill-opacity="0.14" stroke="${P.teal}" stroke-width="2" stroke-dasharray="7 6" stroke-linejoin="round"`);
    return svg;
  }
  function crane(t) {
    if (t < T.crane) return null;
    const p = pathAt(t);
    // heading from a wide window so hovers don't spin; held once perched
    const tt = Math.min(t, T.perch);
    const a = pathAt(tt - 0.15), b = pathAt(tt + 0.15);
    let heading = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const settle = E.io(seg(t, T.perch, T.perch + 0.6));
    const above = clamp((480 - p[2]) / 60);                   // no floor shadow once above the walls
    heading = lerp(heading, 0, settle);                       // perched facing along the wall
    // wings: ~2.2 Hz beat in flight, settling into a folded V on the perch
    const beat = (24 + 30 * Math.sin(2 * Math.PI * 2.2 * (t - T.crane))) * D2R;
    const flap = lerp(beat, 46 * D2R, settle);
    const fold = E.out(seg(t, T.crane, T.crane + 0.3));                // folds up out of the print as it lifts
    const tris = cranePolys(p, heading, lerp(90 * D2R, flap, fold), 1.35, lerp(-90 * D2R, 0, fold));
    let svg = '';
    const ds = tris.map((o) => ({ ...o, d: depthOf(o.pts) })).sort((x, y) => y.d - x.d);
    for (const o of ds) svg += poly(o.pts, lit(o.col, faceNormal(o.pts)), `stroke="${shade(o.col, -0.2)}" stroke-width="0.8" stroke-linejoin="round"`);
    // soft shadow on the floor only while the crane is over the floor, fading with height
    let shadow = '';
    const sx = p[0] - p[2] * 0.22, sy = p[1] - p[2] * 0.3;
    if (Math.abs(sx) < RW / 2 - 60 && Math.abs(sy) < RL / 2 - 60 && settle < 0.5) {
      const op = clamp(0.16 - p[2] / 5000, 0.04, 0.12) * (1 - settle * 2) * above;
      shadow = poly(circle2(0, 0, 64, 16).map(([u, d]) => [sx + u, sy + d * 0.65, 0.3]), P.ink, `opacity="${f(op)}" filter="url(#soft)"`);
    }
    // perched: a small contact shadow on the wall top so it sits, not hovers
    if (settle > 0.01) svg = poly(circle2(0, 0, 34, 14).map(([u, d]) => [PERCH[0] + u * 1.4, PERCH[1] + d * 0.25, 431]), P.ink, `opacity="${f(0.18 * settle)}" filter="url(#soft)"`) + svg;
    return { svg, shadow, d: depth(p) - 60, p };
  }

  // ------------------------------------------------------------------ paint(t)
  const svgEl = () => document.getElementById('stage');
  function paint(t) {
    // camera: moving from frame 0 — a top view of the flat sheet swings into a 3/4 diorama, drifts, then rests
    const cm = E.io3(seg(t, T.cam[0], T.cam[1]));
    const drift = E.io(seg(t, T.drift[0], T.drift[1]));
    const yaw = lerp(8, -34, cm) - 3 * drift;
    const pitch = lerp(86, 33, cm) + 2 * drift;
    const S = lerp(0.64, 0.8, cm) * (1 + 0.025 * drift);
    const fm = E.out(seg(t, 0, 1.6));                          // keep the sheet centred while it folds
    const focus = [lerp(-210, 10, fm), lerp(210, 10, fm), lerp(0, 175, cm)];
    setCam(yaw, pitch, S, focus, W / 2, lerp(H / 2 + 40, H / 2 + 30, cm));

    const fb = 90 * E.back(seg(t, T.foldB[0], T.foldB[1])) * D2R;
    const fl = 90 * E.back(seg(t, T.foldL[0], T.foldL[1])) * D2R;
    const FL = frame([0, 0, 0], [1, 0, 0], [0, 1, 0]);
    const BWin = { O: [0, RL / 2, 0], U: [1, 0, 0], D: [0, Math.cos(fb), Math.sin(fb)], N: [0, -Math.sin(fb), Math.cos(fb)] };
    const LWin = { O: [-RW / 2, 0, 0], U: [0, -1, 0], D: [-Math.cos(fl), 0, Math.sin(fl)], N: [Math.sin(fl), 0, Math.cos(fl)] };

    let g = '';
    // contact shadow under the whole paper model
    g += poly([at(FL, -RW / 2 - 18, -RL / 2 - 24, 0), at(FL, RW / 2 + 18, -RL / 2 - 24, 0), at(FL, RW / 2 + 18, RL / 2 + 10, 0), at(FL, -RW / 2 - 18, RL / 2 + 10, 0)],
      P.steel, `opacity="0.45" filter="url(#soft)"`);
    g += poly([at(FL, -RW / 2, -RL / 2), at(FL, RW / 2, -RL / 2), at(FL, RW / 2, RL / 2), at(FL, -RW / 2, RL / 2)], FLOOR);
    g += poly(rrect(0, -70, 880, 580, 60).map(([u, d]) => at(FL, u, d, 0.2)), shade(FLOOR, -0.03));
    g += cranePrint(t);

    const walls = [
      { F: LWin, u0: -RL / 2, u1: RL / 2, name: 'L' },
      { F: BWin, u0: -RW / 2, u1: RW / 2, name: 'B' },
    ].map((w) => ({ ...w, pts: [at(w.F, w.u0, 0), at(w.F, w.u1, 0), at(w.F, w.u1, WH), at(w.F, w.u0, WH)] }));
    walls.sort((a, b) => depthOf(b.pts) - depthOf(a.pts));
    for (const w of walls) {
      g += poly(w.pts, lit(PAPER, w.F.N));
      if (Math.abs(dot(w.F.N, CAM.fwd)) > 0.18) g += `<polyline points="${ptsAttr([w.pts[2], w.pts[3]])}" fill="none" stroke="${P.grey}" stroke-width="2"/>`;
      g += w.name === 'B' ? backWallArt(t, w.F) : leftWallArt(t, w.F);
    }

    // creases: dashed fold lines draw on from frame 0 and retire as the folds close
    const ld = 1;
    const lf = 1 - seg(t, T.foldL[1] - 0.3, T.foldL[1] + 0.2);
    if (lf > 0) {
      const crease = (a, b) => `<line x1="${f(proj(a)[0])}" y1="${f(proj(a)[1])}" x2="${f(proj(b)[0])}" y2="${f(proj(b)[1])}" stroke="${P.navy}" stroke-width="3" stroke-dasharray="12 10" stroke-linecap="round" opacity="${f(0.9 * lf * ld)}"/>`;
      g += crease([-RW / 2, -RL / 2, 0.5], [-RW / 2, RL / 2, 0.5]) + crease([RW / 2, RL / 2, 0.5], [-RW / 2, RL / 2, 0.5]);
    }

    // stations and the crane, depth-sorted together (far → near)
    const cr = crane(t);
    if (cr) g += cr.shadow;
    const items = STATIONS.map((s) => ({ d: depth([s.x, s.y, 120]), svg: () => station(t, s, FL) }));
    if (cr) items.push({ d: cr.d, svg: () => cr.svg });
    items.sort((a, b) => b.d - a.d);
    for (const it of items) g += it.svg();
    svgEl().querySelector('#world').innerHTML = g;
  }

  // activation of a role when the crane arrives (0→1 with a paper overshoot)
  const act = (t, s, dt = 0, dur = 0.45) => E.back(seg(t, s.t + dt, s.t + dt + dur));
  const tick = (x, y, k, r = 28) => k > 0.001 ? `<g transform="translate(${f(x)} ${f(y)}) scale(${f(k)})"><circle r="${r}" fill="${P.teal}"/>
      <path d="M${-r * 0.4} 0 L${-r * 0.1} ${r * 0.3} L${r * 0.42} ${-r * 0.3}" fill="none" stroke="#fff" stroke-width="${f(r * 0.24)}" stroke-linecap="round" stroke-linejoin="round"/></g>` : '';

  // ------------------------------------------------------------------ a station: paper teammate + desk + monitor + prop
  function station(t, s, FL) {
    let g = '';
    const a = act(t, s, 0.05);
    const t0 = T.cards[0] + s.idx * T.cards[1];
    const up = E.back2(seg(t, t0, t0 + 0.7));
    const b = 90 * up * D2R, k = 0.64;
    const base = [s.x, s.y + 30, 0];
    const CF = { O: base, U: [1, 0, 0], D: [0, Math.cos(b), Math.sin(b)], N: [0, -Math.sin(b), Math.cos(b)] };
    g += poly(circle2(0, 0, 70, 16).map(([u, d]) => [s.x + u * 1.2, s.y + 46 + d * 0.5, 0.3]), P.ink, `opacity="${f(0.10 * up)}" filter="url(#soft)"`);
    // pose: neutral until the crane arrives, then each role gets its own gesture (and it settles still)
    const since = t - s.t, live = since > 0 ? 1 : 0;
    const wob = live ? Math.sin(since * 10) * Math.exp(-since * 2.2) : 0;
    const P0 = { l: CAST.ARM_REST.l, r: CAST.ARM_REST.r };
    const G = {
      support:   { r: { x: 76, y: -352, bend: 34 } },                          // hand to the headset
      admin:     { r: { x: 128, y: -392, bend: 24 } },                          // a wave
      recruiter: { l: { x: -124, y: -398, bend: -22 }, r: { x: 124, y: -398, bend: 22 } },   // both hands up
      sales:     { r: { x: 160, y: -430, bend: -14 } },                           // points up at the chart
    }[s.key];
    const mixArm = (rest, tgt) => (tgt ? { x: lerp(rest.x, tgt.x, clamp(a)) + 8 * wob, y: lerp(rest.y, tgt.y, clamp(a)) + 10 * wob, bend: lerp(rest.bend, tgt.bend, clamp(a)) } : rest);
    const pose = {
      mood: since > 0.18 ? 'happy' : since > 0.05 ? 'calm' : 'neutral', noShadow: true,
      armL: mixArm(P0.l, G.l), armR: mixArm(P0.r, G.r),
      acc: { headset: s.key === 'support' ? act(t, s, 0.0, 0.35) : 0 },
      blink: Math.abs(((t * 0.7 + s.idx * 0.37) % 3) - 1.5) < 0.04 ? 1 : 0,
    };
    const art = person(SPECS[s.key], pose);
    // the die-cut paper silhouette is printed on the sheet; the colour comes up with the flip
    g += artOn(CF, 0, 0, k, art, 0.6, `filter="url(#paper)"`);
    const ink = E.io(seg(t, t0 + 0.12, t0 + 0.3));
    if (ink > 0.001) g += artOn(CF, 0, 0, k, art, 0.8, ink < 0.999 ? `opacity="${f(ink)}"` : '');

    // desk rises out of the floor in front of the teammate
    const dt0 = T.desks[0] + s.idx * T.desks[1];
    const dk = E.back(seg(t, dt0, dt0 + 0.55));
    const dh = DESK_H * dk;
    if (dk > 0.001) g += box(FL, s.x, s.y - 60, 250, 120, dh, '#FFFFFF', { cols: ['#FFFFFF', P.grey, P.grey, P.grey, P.grey] }).svg;
    const mk = E.back(seg(t, dt0 + 0.4, dt0 + 0.85));
    if (dk > 0.98 && mk > 0.001) {
      const TF = { O: [0, 0, dh], U: [1, 0, 0], D: [0, 1, 0], N: [0, 0, 1] };
      g += box(TF, s.x - 64, s.y - 40, 18, 24, 10 * mk, P.ink).svg;
      g += box(TF, s.x - 64, s.y - 40, 104, 12, 62 * mk, P.steel, { cols: [shade(P.steel, 0.1), P.steel, P.navy, P.steel, P.navy] }).svg;
      g += box(TF, s.x + 34, s.y - 96, 84, 24, 5 * mk, P.grey).svg;
      if (s.key === 'admin') g += adminStack(t, s, TF);
      if (s.key === 'recruiter') g += deskCards(t, s, TF);
    }
    return g;
  }

  // admin: loose sheets drop onto the desk and square up; a teal tick lands on top
  function adminStack(t, s, TF) {
    let g = '';
    for (let j = 0; j < 4; j++) {
      const k = E.back(seg(t, s.t + j * 0.07, s.t + 0.35 + j * 0.07));
      if (k <= 0.001) continue;
      const loose = (1 - E.io(seg(t, s.t + 0.45, s.t + 0.9))) * [12, -9, 7, 0][j];
      const BF = { O: [0, 0, TF.O[2] + j * 8 + 40 * (1 - k)], U: [1, 0, 0], D: [0, 1, 0], N: [0, 0, 1] };
      g += box(BF, s.x - 92 + loose, s.y - 64 + loose * 0.5, 66, 84, 7, '#FFFFFF', { cols: ['#FFFFFF', P.steel, P.grey, P.steel, P.grey] }).svg;
    }
    const p = proj([s.x - 92, s.y - 64, TF.O[2] + 82]);
    g += tick(p[0], p[1], E.back2(seg(t, s.t + 0.75, s.t + 1.1)));
    return g;
  }
  // recruitment: three profile cards pop up from the desk top; the chosen one rises and gets the tick
  function deskCards(t, s, TF) {
    let g = '';
    for (const j of [0, 2, 1]) {
      const k = E.back2(seg(t, s.t + j * 0.09, s.t + 0.45 + j * 0.09));
      if (k <= 0.001) continue;
      const pick = j === 1 ? E.back2(seg(t, s.t + 0.6, s.t + 0.95)) : 0;
      const b = 78 * k * D2R, cx = s.x + 40 + (j - 1) * 52;
      const F = { O: [cx, s.y - 92, TF.O[2] + 18 * pick], U: [1, 0, 0], D: [0, Math.cos(b), Math.sin(b)], N: [0, -Math.sin(b), Math.cos(b)] };
      const card = `<rect x="-34" y="-96" width="68" height="94" rx="10" fill="#fff" stroke="${j === 1 && pick > 0.5 ? P.teal : P.steel}" stroke-width="3"/>
        <circle cx="0" cy="-64" r="15" fill="${[P.steel, P.navy, P.steel][j]}"/>
        <path d="M-20 -34 H20 M-14 -20 H14" stroke="${P.grey}" stroke-width="6" stroke-linecap="round"/>`;
      g += artOn(F, 0, 0, 1, card, 0.4);
      if (j === 1) { const p = proj(at(F, 30, 92, 4)); g += tick(p[0], p[1], pick, 22); }
    }
    return g;
  }

  // ------------------------------------------------------------------ wall art
  // back wall (u: x, d: up): a quiet window on the left; Sales' chart on the right, above the Sales desk
  function backWallArt(t, F) {
    let g = '';
    // window: a paper frame with two panes (no motion, it anchors the composition)
    g += extrude(F, rrect(-300, 250, 250, 170, 16), 6, '#FFFFFF', P.grey);
    g += poly(rrect(-300, 250, 222, 142, 10).map(([u, d]) => at(F, u, d, 6.5)), '#E6E9EC');
    g += poly([[-302, 179], [-298, 179], [-298, 321], [-302, 321]].map(([u, d]) => at(F, u, d, 7)), '#FFFFFF');
    const s = ST.sales, as = act(t, s, 0.05);
    g += extrude(F, rrect(235, 240, 340, 250, 22), 2 + 6 * clamp(as), '#FFFFFF', P.grey);
    [0.35, 0.55, 0.72, 1].forEach((hh, j) => {
      const k = E.back(seg(t, s.t + 0.1 + j * 0.16, s.t + 0.75 + j * 0.16));
      const h0 = 22 + 150 * hh * k, x = 130 + j * 70;
      const pts = [[x - 22, 140], [x + 22, 140], [x + 22, 140 + h0], [x - 22, 140 + h0]];
      g += extrude(F, pts, 6 + 18 * k, k > 0.01 ? (j === 3 ? P.teal : P.steel) : P.grey);
    });
    const tl = E.io(seg(t, s.t + 0.7, s.t + 1.5));
    if (tl > 0.001) {
      const L = [[105, 210], [175, 250], [245, 240], [335, 330]].map(([u, d]) => proj(at(F, u, d, 30)));
      g += `<path d="M${L.map((q) => f(q[0]) + ' ' + f(q[1])).join(' L')}" fill="none" stroke="${P.teal}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" pathLength="100" style="stroke-dasharray:${f(100 * tl)} 200"/>`;
    }
    return g;
  }
  // left wall (u: along -y, d up): Support's conversation — a question, an answer, a teal tick
  function leftWallArt(t, F) {
    let g = '';
    const s = ST.support;
    const bubbles = [
      { cx: -60, cy: 300, w: 210, h: 92, col: shade(P.grey, 0.12), side: -1, at: 0.0 },
      { cx: 60, cy: 186, w: 210, h: 92, col: P.steel, side: 1, at: 0.3 },
    ];
    for (const b of bubbles) {
      const k = act(t, s, b.at, 0.4);
      // grows out of its tail point
      const tx = b.cx + b.side * (b.w / 2 - 40), ty = b.cy - b.h / 2 - 26;
      const sc = (q) => [tx + (q[0] - tx) * Math.max(k, 0.0001), ty + (q[1] - ty) * Math.max(k, 0.0001)];
      if (k <= 0.001) { g += poly(rrect(b.cx, b.cy, b.w, b.h, 30, 5).map(([u, d]) => at(F, u, d, 0.5)), shade(PAPER, -0.04)); continue; }
      const e = 4 + 16 * clamp(k);
      g += extrude(F, rrect(b.cx, b.cy, b.w, b.h, 30, 5).map(sc), e, b.col);
      g += extrude(F, [[tx - 16, b.cy - b.h / 2 + 4], [tx + 16, b.cy - b.h / 2 + 4], [tx + b.side * 18, ty]].map(sc), e, b.col);
      const resolved = b.at > 0 ? E.back2(seg(t, s.t + 1.0, s.t + 1.3)) : 0;
      for (let j = 0; j < 3; j++) {
        const bounce = b.at > 0 && resolved < 0.01 ? 8 * Math.max(0, Math.sin((t - s.t) * 9 - j * 0.9)) : 0;
        const r = 11 * (1 - resolved);
        if (r > 0.5) g += poly(circle2(b.cx - 44 + j * 44, b.cy + bounce, r, 12).map(sc).map(([u, d]) => at(F, u, d, e + 0.5)), b.at > 0 ? '#FFFFFF' : P.steel);
      }
      if (resolved > 0.001) { const p = proj(at(F, b.cx, b.cy, e + 1)); g += tick(p[0], p[1], resolved, 30); }
    }
    return g;
  }

  window.ORIGAMI = { paint, DUR };
})();
