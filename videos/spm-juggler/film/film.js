// SPM hero #10 — The Juggler. One continuous shot, silent, no text (docs/shotlist.md).
// The whole frame is one SVG string painted from t: pure function of time, no state between frames.
(() => {
  const { W, H, sp, trk, seg, clamp, lerp, ease, bt, put, el, reg, scene } = C;
  const { P, person, SPECS, ICON, f } = CAST;

  // ------------------------------------------------------------------ helpers
  const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const after = (t, beat, preset) => sp(t, beat, preset);                       // 0→1 spring from a beat
  const sec = (beat) => bt(beat);
  const mix2 = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });
  function bez(p0, c, p1, v) {
    const u = 1 - v;
    return { x: u * u * p0.x + 2 * u * v * c.x + v * v * p1.x, y: u * u * p0.y + 2 * u * v * c.y + v * v * p1.y };
  }
  // deterministic blinks: short closes at fixed seconds per person
  const blinkAt = (t, times) => { let b = 0; for (const s of times) { const d = Math.abs(t - s); if (d < 0.09) b = Math.max(b, 1 - d / 0.09); } return b; };

  // ------------------------------------------------------------------ world layout (16:9 world = 1920×1080 at camera s = 1)
  const OWNER = { x: 960, y: 930, s: 1.15 };
  const TEAM = [
    { key: 'support',   ball: 3, x: 300,  y: 950, s: 1.0, side: 1,  m: 'sup' },
    { key: 'admin',     ball: 0, x: 595,  y: 985, s: 1.0, side: 1,  m: 'adm' },
    { key: 'sales',     ball: 1, x: 1325, y: 985, s: 1.0, side: -1, m: 'sal' },
    { key: 'recruiter', ball: 2, x: 1620, y: 950, s: 1.0, side: -1, m: 'rec' },
  ];
  const ICONS = ['doc', 'chart', 'cv', 'headset'];   // by ball index
  const toWorld = (who, lx, ly) => ({ x: who.x + who.s * lx, y: who.y + who.s * ly });

  // ------------------------------------------------------------------ juggling (closed form)
  const D = 0.326, CYC = 4 * D;                         // throw interval, one ball's full cycle (L→R→L)
  const BALL_R = 40, HOLD = -48;                       // ball sits this far above the palm
  const theta = (t) => (2 * Math.PI * t) / D;
  const bob = (t) => 5 * Math.sin(theta(t) + 0.6);
  // owner's juggling hands, local coords (loop amplitude fades out after the last catch)
  function jugHand(t, side) {
    const a = 1 - smooth((t - sec('relax')) / 0.5);
    return { x: side * (132 - 16 * a * Math.cos(theta(t))), y: -300 + 20 * a * Math.sin(theta(t)) };
  }
  function handWorld(t, side) { const h = jugHand(t, side); return { x: OWNER.x + OWNER.s * h.x, y: OWNER.y + OWNER.s * (bob(t) + h.y + HOLD) }; }
  function jugglePos(i, t) {
    const off = i * D, ph = (t + off) / CYC, k = Math.floor(ph), u = ph - k, t0 = k * CYC - off;
    const leg = (ua, ub, from, to, apex) => {
      const ta = t0 + ua * CYC, tb = t0 + ub * CYC, v = (t - ta) / (tb - ta);
      const a = handWorld(ta, from), b = handWorld(tb, to);
      return { x: lerp(a.x, b.x, v), y: lerp(a.y, b.y, v) - 4 * apex * v * (1 - v), spin: (to - from) * 9 * Math.sin(Math.PI * v) };
    };
    if (u < 0.4) return leg(0, 0.4, -1, 1, 340);
    if (u < 0.5) return { ...handWorld(t, 1), spin: 0 };
    if (u < 0.9) return leg(0.5, 0.9, 1, -1, 190);
    return { ...handWorld(t, -1), spin: 0 };
  }

  // ------------------------------------------------------------------ hand-offs: a real throw out of the pattern
  // Each ball leaves from the owner's hand on its catcher's side, at that ball's first throw after <role>_in + 0.5 s,
  // and flies a gravity arc for THROW_T seconds into the catcher's raised hand. Catch times are derived, not marked.
  const THROW_T = 0.62;
  for (const m of TEAM) {
    const u = m.side > 0 ? 0 : 0.5, off = m.ball * D, earliest = sec(m.m + '_in') + 0.5;
    const k = Math.ceil((earliest + off - u * CYC) / CYC - 1e-9);
    m.from = m.side > 0 ? -1 : 1;
    m.tr = k * CYC + u * CYC - off; m.tc = m.tr + THROW_T; m.catchBeat = C.beatAt(m.tc);
  }

  // ------------------------------------------------------------------ teammates: orb → reveal → person → reach → catch → prop
  const FLY = 0.6;                                     // seconds the ball travels from pattern to catcher
  const REACH = (m) => ({ x: m.side * 150, y: -390 });  // catching hand (local), toward the owner
  function hold(m) {                                    // where the catching hand rests with the prop (local)
    switch (m.key) {
      case 'support':   return { x: m.side * 84, y: -350, bend: m.side * 30 };   // touching the headset
      case 'admin':     return { x: m.side * 92, y: -238, bend: m.side * 26 };
      case 'sales':     return { x: m.side * 40, y: -176, bend: m.side * 34 };
      default:          return { x: m.side * 52, y: -172, bend: m.side * 30 };
    }
  }
  function mateState(m, t) {
    const inB = m.m + '_in', catchB = m.catchBeat;
    const tc = m.tc;
    const grow = after(t, inB, 'default');
    // near hand: rest → reach (from in+0.5) → hold after the catch
    const reach = sp(t, C.beatAt(m.tc - 0.5), 'default');      // hand is up a few frames before the ball
    const settle = sp(t, catchB, 'default');
    const rest = m.side > 0 ? CAST.ARM_REST.r : CAST.ARM_REST.l;
    const R = REACH(m), Hd = hold(m);
    let near = mix2(mix2({ x: m.side * Math.abs(rest.x), y: rest.y }, R, reach), Hd, settle);
    // catch impact: the hand dips with the ball's weight
    const dip = t > tc ? Math.exp(-(t - tc) * 9) * Math.sin((t - tc) * 22) * 14 : 0;
    let bend = lerp(m.side * 20, Hd.bend, settle) * (1 - 0.6 * reach * (1 - settle));
    if (m.key === 'support') {                           // headset on → the hand drops back to the side
      const back = sp(t, catchB + 1.7, 'default');
      near = mix2(near, { x: m.side * 96, y: -176 }, back); bend = lerp(bend, m.side * 20, back);
    }
    near = { x: near.x, y: near.y + dip, bend };
    return { grow, reach, settle, near, tc, caught: t >= tc };
  }

  // ------------------------------------------------------------------ the AI orb
  function orb(x, y, r, a = 1) {
    if (r <= 0.5 || a <= 0.001) return '';
    return `<g opacity="${f(a)}">
      <circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#orb)"/>
      <ellipse cx="${f(x - r * 0.32)}" cy="${f(y - r * 0.38)}" rx="${f(r * 0.34)}" ry="${f(r * 0.2)}" fill="#fff" opacity="0.55" transform="rotate(-30 ${f(x - r * 0.32)} ${f(y - r * 0.38)})"/></g>`;
  }
  function ball(i, x, y, s = 1, spin = 0, tint = 0) {
    if (s <= 0.01) return '';
    const fill = tint > 0 ? CAST.shade(P.navy, 0) : P.navy;
    return `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)}) rotate(${f(spin)})">
      <circle r="${BALL_R}" fill="${fill}" stroke="#fff" stroke-width="6"/>${tint > 0.01 ? `<circle r="${BALL_R + 5}" fill="none" stroke="${P.teal}" stroke-width="5" opacity="${f(tint)}"/>` : ''}
      <g transform="scale(0.78)">${ICON[ICONS[i]]('#fff')}</g></g>`;
  }

  // ------------------------------------------------------------------ props (drawn in the teammate's local space)
  function propSupport(t, m, k, live) {
    // speech bubble that types, then resolves to a teal tick
    if (live <= 0.001) return '';
    const bx = m.side * 120, by = -500, s = 0.85 + 0.15 * live;
    const dots = [0, 1, 2].map((j) => {
      const ph = Math.sin((t - sec('work')) * 9 - j * 0.9);
      return `<circle cx="${-22 + j * 22}" cy="${f(-2 - 5 * Math.max(0, ph))}" r="6.5" fill="#fff"/>`;
    }).join('');
    const tick = sp(t, C.beatOf('work') + 2, 'snappy');
    const body = tick > 0.02
      ? `<path d="M-16 0 L-4 12 L18 -12" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="60" stroke-dashoffset="${f(60 * (1 - tick))}"/>`
      : dots;
    return `<g transform="translate(${bx} ${by}) scale(${f(0.5 * s + 0.5 * live * s)})">
      <path d="M-62 -36 Q-62 -54 -44 -54 L44 -54 Q62 -54 62 -36 L62 22 Q62 40 44 40 L${m.side > 0 ? -18 : 18} 40 L${m.side > 0 ? -40 : 40} 62 L${m.side > 0 ? -34 : 34} 40 L-44 40 Q-62 40 -62 22Z" fill="${P.teal}"/>
      ${body}</g>`;
  }
  function propAdmin(t, m, k, live, hand) {
    // stack of papers on the palm; on 'work' the loose sheets square up and a teal tick lands
    if (k <= 0.001) return '';
    const sq = sp(t, C.beatOf('work') + 0.5, 'default');
    const tick = sp(t, C.beatOf('work') + 1.25, 'snappy');
    const offs = [[-16, 9, -9], [14, -6, 7], [-6, 3, -4], [0, 0, 0]];
    let s = '';
    offs.forEach(([dx, dy, r], j) => {
      const yy = -j * 10;
      s += `<g transform="translate(${f(dx * (1 - sq))} ${f(yy + dy * (1 - sq))}) rotate(${f(r * (1 - sq))})">
        <rect x="-46" y="-60" width="92" height="66" rx="8" fill="#fff" stroke="${P.steel}" stroke-width="3.5"/>
        ${j === 3 ? `<path d="M-30 -42 H22 M-30 -28 H30 M-30 -14 H10" stroke="${P.steel}" stroke-width="6" stroke-linecap="round"/>` : ''}</g>`;
    });
    s += tick > 0.01 ? `<g transform="translate(40 -84) scale(${f(0.8 + 0.2 * tick)})" opacity="${f(clamp(tick * 5))}"><circle r="22" fill="${P.teal}"/>
      <path d="M-9 0 L-2 7 L10 -7" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>` : '';
    return `<g transform="translate(${f(hand.x - m.side * 6)} ${f(hand.y - 4)}) scale(${f(0.45 + 0.55 * k)})">${s}</g>`;
  }
  function propSales(t, m, k, live, hand) {
    if (k <= 0.001) return '';
    const bars = [0.42, 0.62, 1].map((hgt, j) => {
      const g = sp(t, C.beatOf('work') + 1 + j * 0.25, 'snappy');
      const h = 18 + 70 * hgt * g;
      return `<rect x="${-46 + j * 34}" y="${f(34 - h)}" width="24" height="${f(h)}" rx="5" fill="${j === 2 ? P.teal : P.steel}"/>`;
    }).join('');
    const ar = sp(t, C.beatOf('work') + 2, 'default');
    const arrow = ar > 0.01 ? `<path d="M-40 -16 L-10 -34 L10 -22 L40 -58" fill="none" stroke="${P.teal}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="110" stroke-dashoffset="${f(110 * (1 - ar))}"/>
      <path d="M26 -60 L42 -60 L42 -44" fill="none" stroke="${P.teal}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="${f(clamp((ar - 0.7) * 5))}"/>` : '';
    return `<g transform="translate(${f(hand.x - m.side * 30)} ${f(hand.y - 52)}) rotate(${f(m.side * -4)}) scale(${f(0.78 * (0.45 + 0.55 * k))})">
      <rect x="-66" y="-80" width="132" height="130" rx="18" fill="#fff" stroke="${P.grey}" stroke-width="3"/>
      <path d="M-50 36 H50" stroke="${P.grey}" stroke-width="4" stroke-linecap="round"/>${bars}${arrow}</g>`;
  }
  function propRecruiter(t, m, k, live, hand) {
    if (k <= 0.001) return '';
    const fan = sp(t, C.beatOf('work') + 1.5, 'default');
    const pick = sp(t, C.beatOf('work') + 2.25, 'snappy');
    const card = (j) => {
      const r = (j - 1) * 16 * fan, lift = j === 1 ? -14 * pick : 0;
      return `<g transform="rotate(${f(r)} 0 40) translate(0 ${f(lift)})">
        <rect x="-38" y="-56" width="76" height="100" rx="12" fill="#fff" stroke="${j === 1 && pick > 0.5 ? P.teal : P.grey}" stroke-width="3"/>
        <circle cx="0" cy="-22" r="14" fill="${[P.steel, P.navy, P.grey][j]}"/>
        <path d="M-22 12 H22 M-16 26 H16" stroke="${P.grey}" stroke-width="6" stroke-linecap="round"/></g>`;
    };
    const tick = pick > 0.01 ? `<g transform="translate(${f(-m.side * 44)} ${f(-46 - 14 * pick)}) scale(${f(0.8 + 0.2 * pick)})" opacity="${f(clamp(pick * 5))}"><circle r="18" fill="${P.teal}"/>
      <path d="M-7 0 L-1 6 L8 -6" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></g>` : '';
    return `<g transform="translate(${f(hand.x - m.side * 18)} ${f(hand.y - 50)}) scale(${f(0.84 * (0.45 + 0.55 * k))})">${card(0)}${card(2)}${card(1)}${tick}</g>`;
  }
  const PROPS = { support: propSupport, admin: propAdmin, sales: propSales, recruiter: propRecruiter };

  // ------------------------------------------------------------------ the shot
  scene({
    name: 'juggler', from: 'hook', to: 'done',
    build(root, S) {
      root.style.background = '#fff';
      root.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0">
        <defs>
          <radialGradient id="orb" cx="0.38" cy="0.34" r="0.75"><stop offset="0" stop-color="#7CC6CC"/><stop offset="0.55" stop-color="${P.teal}"/><stop offset="1" stop-color="#17616A"/></radialGradient>
          <radialGradient id="halo"><stop offset="0.45" stop-color="${P.teal}" stop-opacity="0.22"/><stop offset="1" stop-color="${P.teal}" stop-opacity="0"/></radialGradient>
          <radialGradient id="disc"><stop offset="0" stop-color="${P.teal}" stop-opacity="0.16"/><stop offset="0.8" stop-color="${P.teal}" stop-opacity="0.10"/><stop offset="1" stop-color="${P.teal}" stop-opacity="0"/></radialGradient>
        </defs><g id="world"></g></svg>`;
      S.world = reg(root.querySelector('#world'));
    },
    run(t, b, S) {
      // camera: close on the owner, ease back to reveal the room, then a slow push on the resting frame
      const pull = ease.inOut(seg(t, 'pull', 'pulled'));
      const push = ease.inOut(seg(t, 'push', 'done'));
      const cs = lerp(1.32, 1.0, pull) * (1 + 0.045 * push);
      const fx = 960, fy = lerp(470, 615, pull) - 10 * push;
      let g = '';

      // teammates (back row first) + their orbs
      const order = [TEAM[0], TEAM[3], null, TEAM[1], TEAM[2]];   // null = owner
      const states = TEAM.map((m) => mateState(m, t));
      const caughtBy = [null, null, null, null];
      let fg = '';                                                  // balls + orbs over everything

      // orb hover spots (world) for the link arcs
      const hover = TEAM.map((m, j) => {
        const st = states[j], ob = m.m + '_orb', inB = m.m + '_in';
        // the orb drops straight to its spot above the teammate's head (never across a face), then bobs
        const spot = toWorld(m, -m.side * 34, -548);
        const drop = after(t, ob, 'default');
        const by = 6 * Math.sin(t * 2.6 + j * 1.7) * drop;
        const pos = { x: spot.x, y: lerp(-140, spot.y, drop) + by };
        const ring = clamp((t - sec(inB) + 0.05) / 0.7);
        const pulse = sp(t, 'link', 'snappy') - sp(t, C.beatOf('link') + 0.5, 'default');
        return { pos, r: (t >= sec(ob) ? 19 : 0) * (1 + 0.25 * pulse), ring, visible: t >= sec(ob) };
      });

      // the link: thin teal arcs between the hovering orbs, drawn on
      const ln = ease.inOut(seg(t, 'link', C.beatOf('link') + 2.5));
      if (ln > 0.001) {
        const pts = hover.map((h) => h.pos);
        let d = `M${f(pts[0].x)} ${f(pts[0].y)}`;
        for (let j = 1; j < 4; j++) {
          const a = pts[j - 1], c = pts[j], mxp = (a.x + c.x) / 2, myp = Math.min(a.y, c.y) - (j === 2 ? 120 : 46);
          d += ` Q${f(mxp)} ${f(myp)} ${f(c.x)} ${f(c.y)}`;
        }
        g += `<path d="${d}" fill="none" stroke="${P.teal}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="2 13" pathLength="1600"
          stroke-dashoffset="0" opacity="0.75" style="clip-path: inset(0 ${f(100 - 100 * ln)}% 0 0)"/>`;
      }

      // a thin teal ring travels out of each orb as its teammate is revealed: behind everyone, thinning to nothing
      for (const h of hover) if (h.ring > 0 && h.ring < 1) {
        const e = ease.out(h.ring);
        g += `<circle cx="${f(h.pos.x)}" cy="${f(h.pos.y)}" r="${f(20 + 240 * e)}" fill="none" stroke="${P.teal}" stroke-width="${f(5 * (1 - e))}" opacity="0.75"/>`;
      }
      for (const m of order) {
        if (!m) { g += drawOwner(t); continue; }
        const j = TEAM.indexOf(m), st = states[j], h = hover[j];
        if (st.grow > 0.001) {
          const s = m.s * (0.86 + 0.14 * st.grow);
          const happy = sp(t, m.catchBeat + 0.3, 'snappy') > 0.5;
          const rest = m.side > 0 ? CAST.ARM_REST.l : CAST.ARM_REST.r;   // far arm stays at rest
          const far = { x: -m.side * Math.abs(rest.x), y: rest.y, bend: -m.side * 20 };
          const near = st.near;
          const k = sp(t, m.catchBeat + 0.5, 'snappy');      // prop grows out from under the ball
          const live = sp(t, 'work', 'snappy');
          const pose = {
            x: m.x, y: m.y + 230 * s * (1 - st.grow) * 0, s, mood: happy ? 'happy' : 'neutral',
            look: m.side * (st.caught ? 0.2 : 0.9), blink: blinkAt(t, [3.9 + j * 0.7, 8.6 + j * 0.45]),
            armL: m.side > 0 ? far : near, armR: m.side > 0 ? near : far,
            acc: { headset: m.key === 'support' ? sp(t, m.catchBeat + 0.9, 'snappy') : 0 },
            squash: st.caught ? Math.exp(-(t - st.tc) * 10) * 0.6 : 0,
          };
          // revealed by a circle that opens out of the orb (full opacity, never a fade), growing 0.9 → 1
          const cx = m.x, cy = m.y - 230 * m.s, gs = 0.9 + 0.1 * st.grow;
          const rr = 640 * ease.out(clamp(st.grow * 1.15));
          const clip = st.grow < 0.999 ? `clip-path="url(#rv${j})"` : '';
          if (clip) g += `<clipPath id="rv${j}"><circle cx="${f(h.pos.x)}" cy="${f(h.pos.y)}" r="${f(rr)}"/></clipPath>`;
          g += `<g ${clip}><g transform="translate(${f(cx)} ${f(cy)}) scale(${f(gs)}) translate(${f(-cx)} ${f(-cy)})">`;
          g += person(SPECS[m.key], { ...pose, s: m.s });
          const handL = { x: near.x, y: near.y };
          g += `<g transform="translate(${m.x} ${m.y}) scale(${m.s})">${PROPS[m.key](t, m, k, live, handL)}</g>`;
          g += `</g></g>`;
        }
        if (h.visible) fg += orb(h.pos.x, h.pos.y, h.r, 1);
      }

      // balls: pattern → arc to the catcher → shrink into the prop
      for (let i = 0; i < 4; i++) {
        const m = TEAM.find((q) => q.ball === i), st = states[TEAM.indexOf(m)];
                let p = jugglePos(i, t), s = 1, spin = p.spin, tint = 0;
        if (t > m.tr) {
          const p0 = handWorld(m.tr, m.from);
          const target = toWorld(m, REACH(m).x, REACH(m).y + HOLD * 0.8);
          const v = clamp((t - m.tr) / THROW_T);
          const A = 150 + Math.abs(p0.y - target.y) / 2;               // apex well above the higher end
          p = { x: lerp(p0.x, target.x, v), y: lerp(p0.y, target.y, v) - 4 * A * v * (1 - v) };
          spin = -m.side * 14 * Math.sin(Math.PI * v);
          tint = 1;                                                    // the hand-off reads the moment it leaves the owner
          if (t >= m.tc) p = toWorld(m, st.near.x, st.near.y + HOLD * 0.8);
          s = 1 - sp(t, m.catchBeat + (m.key === 'support' ? 1.0 : 0.65), 'snappy');
        }
        fg += ball(i, p.x, p.y, s, spin, tint);
      }

      g += fg;
      const tf = `translate(${W / 2} ${H / 2}) scale(${cs.toFixed(6)}) translate(${(-fx).toFixed(3)} ${(-fy).toFixed(3)})`;
      put(S.world, { html: `<g transform="${tf}">${g}</g>` });
    },
  });

  // ------------------------------------------------------------------ the owner
  function drawOwner(t) {
    const relax = sp(t, 'relax', 'heavy');
    const hL = jugHand(t, -1), hR = jugHand(t, 1);
    const restL = { x: -96, y: -176 }, cupR = { x: 108, y: -232 };
    const toCup = sp(t, 'coffee', 'default');
    const L = mix2(hL, restL, relax), Rr = mix2(mix2(hR, { x: 98, y: -176 }, relax), cupR, toCup);
    const stressed = t < sec('relax') + 0.2;
    const look = trk(t, [[0, 0], ['sup_orb', -0.8], ['adm_orb', -0.6], ['sal_orb', 0.6], ['rec_orb', 0.8], ['relax', 0, 'heavy']]);
    const exhale = sp(t, 'relax', 'default') - sp(t, C.beatOf('relax') + 0.7, 'heavy');
    const pose = {
      x: OWNER.x, y: OWNER.y + OWNER.s * (bob(t) * (1 - relax) + 6 * exhale), s: OWNER.s,
      mood: stressed ? 'stress' : (t < sec('coffee') + 0.6 ? 'calm' : 'happy'),
      look: stressed ? look : 0, blink: blinkAt(t, [1.7, 4.2, 9.4]),
      armL: { x: L.x, y: L.y, bend: lerp(-34, -20, relax) }, armR: { x: Rr.x, y: Rr.y, bend: lerp(34, 26, relax) },
      sweat: (1 - smooth((t - sec('relax') + 0.1) / 0.15)) * (0.75 + 0.25 * Math.sin(t * 7)),
      tilt: stressed ? 3 * Math.sin(theta(t) / 2) : -4 * relax,
      squash: exhale * 0.5,
    };
    let s = person({ ...SPECS.owner, tieSwing: stressed ? 9 * Math.sin(theta(t)) : 0 }, pose);
    // coffee mug grows into the right hand, steam curls up
    const mug = sp(t, 'coffee', 'default');
    if (mug > 0.001) {
      const mx = OWNER.x + OWNER.s * (Rr.x + 4), my = pose.y + OWNER.s * (Rr.y - 30), ms = OWNER.s * mug;
      const steam = [0, 1].map((j) => {
        const ph = t * 1.6 + j * 1.3, a = clamp((t - sec('coffee') - 0.2) * 2);
        const y0 = -44, d = `M${-8 + j * 14} ${y0} c ${f(-10 + 4 * Math.sin(ph))} -14 ${f(12 + 4 * Math.sin(ph + 1))} -22 0 -38 c ${f(-12 + 3 * Math.sin(ph + 2))} -14 ${f(10)} -22 0 -36`;
        return `<path d="${d}" fill="none" stroke="${P.steel}" stroke-width="7" stroke-linecap="round" opacity="${f(a * (0.38 + 0.12 * Math.sin(ph * 1.7)))}"/>`;
      }).join('');
      s += `<g transform="translate(${f(mx)} ${f(my)}) scale(${f(ms)})">${steam}
        <path d="M22 -16 q 22 0 22 16 q 0 16 -22 16" fill="none" stroke="${P.navy}" stroke-width="7"/>
        <rect x="-28" y="-36" width="54" height="66" rx="12" fill="${P.navy}"/><rect x="-28" y="-36" width="54" height="10" rx="5" fill="${P.ink}"/>
        </g>`;
    }
    return s;
  }

  C.start();
})();
