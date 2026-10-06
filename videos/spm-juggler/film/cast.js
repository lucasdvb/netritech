// SPM cast: flat, rubber-hose cartoon people drawn as SVG strings. Pure functions of their pose (no state),
// so the same pose always paints the same pixels. Shared by both hero films (juggler + origami).
//
//   CAST.person(spec, pose) → '<g …>' with the feet centre at the local origin, ~430 units tall.
//   pose: { x, y, s, lean, armL:{x,y,bend}, armR:{x,y,bend}, mood:'stress'|'neutral'|'happy'|'calm',
//           blink:0..1, look:-1..1, tilt:deg, squash:0..1, acc:{headset:p, glasses:1}, legs:{l,r} }
(() => {
  const P = {
    ink: '#0D141F', navy: '#1B2A38', steel: '#43617A', teal: '#22808A', grey: '#DADDE0', white: '#FFFFFF',
    tealLite: '#5FB3BA', tealPale: '#CFE7E9', cheek: '#E58F7F',
  };
  const f = (n) => (Math.round(n * 100) / 100).toString();
  // darken / lighten a #rrggbb by k in [-1, 1]
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = k < 0 ? 0 : 255, a = Math.abs(k);
    r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  // A rubber-hose limb: quadratic from a to b, bent sideways by `bend` (px, signed) at the middle.
  function hose(ax, ay, bx, by, bend, w, col) {
    const mx = (ax + bx) / 2, my = (ay + by) / 2, dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    const cx = mx + (-dy / L) * bend, cy = my + (dx / L) * bend;
    return `<path d="M${f(ax)} ${f(ay)} Q${f(cx)} ${f(cy)} ${f(bx)} ${f(by)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  }

  const HEAD = { x: 0, y: -366, r: 54 };
  const SH = { l: [-60, -292], r: [60, -292] };                       // shoulders
  const ARM_REST = { l: { x: -98, y: -170, bend: -20 }, r: { x: 98, y: -170, bend: 20 } };

  // hair: [back layer (behind head), front layer (over head)]
  function hair(style, col) {
    const { x, y, r } = HEAD;
    switch (style) {
      case 'short':
        return ['', `<path d="M${x - r - 1} ${y + 2} C${x - r - 4} ${y - 52} ${x - 18} ${y - r - 18} ${x + 8} ${y - r - 10}
                C${x + 40} ${y - r - 6} ${x + r + 6} ${y - 30} ${x + r + 1} ${y + 2}
                C${x + 36} ${y - 26} ${x + 14} ${y - 30} ${x - 6} ${y - 24} C${x - 24} ${y - 20} ${x - 38} ${y - 14} ${x - r - 1} ${y + 2}Z" fill="${col}"/>`];
      case 'sidepart':
        return ['', `<path d="M${x - r - 2} ${y + 4} C${x - r - 6} ${y - 50} ${x - 10} ${y - r - 16} ${x + 18} ${y - r - 8}
                C${x + 44} ${y - r} ${x + r + 6} ${y - 24} ${x + r + 2} ${y + 6}
                C${x + 40} ${y - 20} ${x + 30} ${y - 30} ${x + 12} ${y - 34} C${x - 8} ${y - 20} ${x - 30} ${y - 14} ${x - r - 2} ${y + 4}Z" fill="${col}"/>`];
      case 'curly': {
        let s = '';
        const pts = [[-42, -8], [-40, -30], [-28, -46], [-8, -54], [14, -53], [32, -44], [43, -26], [45, -6], [-20, -36], [6, -40], [26, -30]];
        const k = r / 47;
        for (const [dx, dy] of pts) s += `<circle cx="${f(x + dx * k)}" cy="${f(y + dy * k)}" r="${f(17 * k)}" fill="${col}"/>`;
        return ['', s];
      }
      case 'bun':
        return [`<circle cx="${x + 4}" cy="${y - r - 14}" r="22" fill="${col}"/>`,
          `<path d="M${x - r - 1} ${y + 6} C${x - r - 2} ${y - 46} ${x - 20} ${y - r - 8} ${x + 2} ${y - r - 6}
                C${x + 30} ${y - r - 6} ${x + r + 2} ${y - 40} ${x + r + 1} ${y + 6}
                C${x + 30} ${y - 22} ${x + 10} ${y - 30} ${x - 2} ${y - 30} C${x - 20} ${y - 28} ${x - 36} ${y - 16} ${x - r - 1} ${y + 6}Z" fill="${col}"/>`];
      case 'long':
        return [`<path d="M${x - r - 6} ${y - 6} C${x - r - 14} ${y + 50} ${x - r - 10} ${y + 96} ${x - 26} ${y + 104}
                Q${x} ${y + 112} ${x + 26} ${y + 104} C${x + r + 10} ${y + 96} ${x + r + 14} ${y + 50} ${x + r + 6} ${y - 6}Z" fill="${col}"/>`,
          `<path d="M${x - r - 3} ${y + 12} C${x - r - 8} ${y - 50} ${x - 16} ${y - r - 14} ${x + 4} ${y - r - 10}
                C${x + 34} ${y - r - 8} ${x + r + 8} ${y - 46} ${x + r + 3} ${y + 12}
                C${x + 34} ${y - 14} ${x + 22} ${y - 30} ${x + 4} ${y - 34} C${x - 6} ${y - 18} ${x - 30} ${y - 6} ${x - r - 3} ${y + 12}Z" fill="${col}"/>`];
      default:
        return ['', ''];
    }
  }

  function face(pose, skin) {
    const { x, y } = HEAD, lk = (pose.look || 0) * 7, m = pose.mood || 'neutral';
    const ex = 18, ey = y + 2;
    let s = '';
    // cheeks
    s += `<ellipse cx="${x - 31 + lk}" cy="${y + 20}" rx="9" ry="5" fill="${P.cheek}" opacity="0.28"/>`;
    s += `<ellipse cx="${x + 31 + lk}" cy="${y + 20}" rx="9" ry="5" fill="${P.cheek}" opacity="0.28"/>`;
    const bl = Math.min(1, Math.max(0, pose.blink || 0));
    if (m === 'happy' || m === 'calm') {
      // closed, content eyes ^ ^
      const d = m === 'happy' ? 6 : 3.5;
      for (const sx of [-1, 1]) s += `<path d="M${f(x + sx * ex - 7 + lk)} ${f(ey + 2)} Q${f(x + sx * ex + lk)} ${f(ey - d)} ${f(x + sx * ex + 7 + lk)} ${f(ey + 2)}" fill="none" stroke="${P.ink}" stroke-width="3.6" stroke-linecap="round"/>`;
    } else {
      const ry = 6.4 * (1 - 0.9 * bl), rx = m === 'stress' ? 5.2 : 4.6;
      for (const sx of [-1, 1]) s += `<ellipse cx="${f(x + sx * ex + lk)}" cy="${f(ey)}" rx="${rx}" ry="${f(Math.max(0.8, ry))}" fill="${P.ink}"/>`;
    }
    // brows
    if (m === 'stress') {
      s += `<path d="M${f(x - 25 + lk)} ${y - 12} L${f(x - 9 + lk)} ${y - 17}" stroke="${P.ink}" stroke-width="3.4" stroke-linecap="round"/>`;
      s += `<path d="M${f(x + 25 + lk)} ${y - 12} L${f(x + 9 + lk)} ${y - 17}" stroke="${P.ink}" stroke-width="3.4" stroke-linecap="round"/>`;
    }
    // mouth
    const mx = x + lk * 0.8, my = y + 27;
    if (m === 'stress') s += `<ellipse cx="${f(mx)}" cy="${my + 1}" rx="6" ry="7.5" fill="${P.ink}"/>`;
    else if (m === 'happy') s += `<path d="M${f(mx - 11)} ${my - 3} Q${f(mx)} ${my + 11} ${f(mx + 11)} ${my - 3}Z" fill="${P.ink}"/>`;
    else s += `<path d="M${f(mx - 9)} ${my - 1} Q${f(mx)} ${my + 7} ${f(mx + 9)} ${my - 1}" fill="none" stroke="${P.ink}" stroke-width="3.4" stroke-linecap="round"/>`;
    return s;
  }

  function headset(p) {
    if (!(p > 0.001)) return '';
    const { x, y, r } = HEAD, k = Math.min(1, p);
    // the band drops onto the head: scale from the crown
    return `<g transform="translate(${x} ${y - r}) scale(${f(0.6 + 0.4 * k)}) translate(${-x} ${-(y - r)})">
      <path d="M${x - r - 4} ${y} C${x - r - 6} ${y - 72} ${x + r + 6} ${y - 72} ${x + r + 4} ${y}" fill="none" stroke="${P.ink}" stroke-width="10" stroke-linecap="round"/>
      <rect x="${x - r - 16}" y="${y - 18}" width="24" height="38" rx="10" fill="${P.ink}"/>
      <rect x="${x + r - 8}" y="${y - 18}" width="24" height="38" rx="10" fill="${P.ink}"/>
      <path d="M${x - r - 4} ${y + 14} Q${x - r + 2} ${y + 40} ${x - 18} ${y + 34}" fill="none" stroke="${P.ink}" stroke-width="6" stroke-linecap="round"/>
      <circle cx="${x - 16}" cy="${y + 34}" r="8.5" fill="${P.teal}"/>
    </g>`;
  }
  function glasses() {
    const { x, y } = HEAD;
    return `<g fill="none" stroke="${P.ink}" stroke-width="3.2"><circle cx="${x - 18}" cy="${y + 2}" r="14"/><circle cx="${x + 18}" cy="${y + 2}" r="14"/>
      <path d="M${x - 4} ${y} Q${x} ${y - 4} ${x + 4} ${y}"/></g>`;
  }

  function torso(spec) {
    const top = spec.top, d = shade(top, -0.18);
    let s = `<path d="M-46 -312 C-70 -312 -74 -298 -74 -280 L-66 -176 C-64 -158 -54 -150 -36 -150 L36 -150 C54 -150 64 -158 66 -176 L74 -280 C74 -298 70 -312 46 -312Z" fill="${top}"/>`;
    if (spec.topStyle === 'blazer') {
      const inner = spec.inner || P.grey;
      s += `<path d="M-22 -312 L0 -246 L22 -312Z" fill="${inner}"/>`;
      s += `<path d="M-24 -312 L-4 -246 L-14 -234 L-38 -300Z" fill="${d}"/><path d="M24 -312 L4 -246 L14 -234 L38 -300Z" fill="${d}"/>`;
    } else if (spec.topStyle === 'tie') {
      s += `<path d="M-20 -313 L0 -292 L20 -313Z" fill="${shade(top, 0.25)}"/>`;
      s += `<path d="M-7 -294 L7 -294 L10 -214 L0 -202 L-10 -214Z" fill="${spec.tie || P.ink}" transform="rotate(${f(spec.tieSwing || 0)} 0 -294)"/>`;
    } else {
      s += `<path d="M-24 -313 C-18 -292 18 -292 24 -313Z" fill="${d}"/>`;
    }
    s += `<rect x="-64" y="-166" width="128" height="20" rx="9" fill="${spec.trousers}"/>`;
    return s;
  }

  /** Draw a person. Order: shadow, legs, back hair, torso, neck, head, face, front hair, accessories, arms, hands. */
  function person(spec, pose = {}) {
    const x = pose.x || 0, y = pose.y || 0, s = pose.s || 1, lean = pose.lean || 0, sq = pose.squash || 0;
    const skin = spec.skin, top = spec.top, tr = spec.trousers;
    let out = `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s * (1 + 0.06 * sq))} ${f(s * (1 - 0.06 * sq))})">`;
    if (!pose.noShadow) out += `<ellipse cx="0" cy="2" rx="92" ry="13" fill="${P.grey}" opacity="0.75"/>`;
    // legs + shoes
    const lg = pose.legs || {};
    out += hose(-24, -158, -26 + (lg.l || 0), -16, 4, 34, tr) + hose(24, -158, 26 + (lg.r || 0), -16, -4, 34, tr);
    out += `<ellipse cx="${f(-32 + (lg.l || 0))}" cy="-9" rx="26" ry="12" fill="${P.ink}"/><ellipse cx="${f(32 + (lg.r || 0))}" cy="-9" rx="26" ry="12" fill="${P.ink}"/>`;
    // upper body leans around the hips
    out += `<g transform="rotate(${f(lean)} 0 -160)">`;
    const [hb, hf] = hair(spec.hair, spec.hairCol || P.ink);
    out += `<g transform="rotate(${f(pose.tilt || 0)} 0 -318)">${hb}</g>`;
    out += torso(spec);
    out += `<rect x="-12" y="-330" width="24" height="30" rx="8" fill="${shade(skin, -0.12)}"/>`;
    out += `<g transform="rotate(${f(pose.tilt || 0)} 0 -318)">`;
    out += `<circle cx="${HEAD.x - HEAD.r + 1}" cy="${HEAD.y + 6}" r="10" fill="${shade(skin, -0.06)}"/><circle cx="${HEAD.x + HEAD.r - 1}" cy="${HEAD.y + 6}" r="10" fill="${shade(skin, -0.06)}"/>`;
    out += `<circle cx="${HEAD.x}" cy="${HEAD.y}" r="${HEAD.r}" fill="${skin}"/>`;
    out += face(pose, skin) + hf;
    const acc = pose.acc || {};
    if (spec.glasses || acc.glasses) out += glasses();
    out += headset(acc.headset || 0);
    if (pose.sweat) out += sweat(pose.sweat);
    out += `</g>`;
    // arms (shoulders at ±60, -312) → hands in local coords
    const aL = pose.armL || ARM_REST.l, aR = pose.armR || ARM_REST.r;
    const sleeve = spec.sleeve || shade(top, top === P.grey ? -0.08 : 0.1);
    out += hose(SH.l[0], SH.l[1], aL.x, aL.y, aL.bend ?? -14, 27, sleeve) + hose(SH.r[0], SH.r[1], aR.x, aR.y, aR.bend ?? 14, 27, sleeve);
    out += `<circle cx="${f(aL.x)}" cy="${f(aL.y)}" r="14" fill="${skin}"/><circle cx="${f(aR.x)}" cy="${f(aR.y)}" r="14" fill="${skin}"/>`;
    out += `</g></g>`;
    return out;
  }

  function sweat(k) {
    const { x, y, r } = HEAD;
    return `<g opacity="${f(Math.min(1, k))}" fill="${P.tealPale}" stroke="${P.steel}" stroke-width="2">
      <path d="M${x + r + 10} ${y - 30} q 9 14 0 20 q -9 -6 0 -20Z"/><path d="M${x - r - 12} ${y - 22} q 7 11 0 16 q -7 -5 0 -16Z"/></g>`;
  }

  // ------------------------------------------------------------------ the five people
  const SPECS = {
    owner:     { skin: '#D9A988', hair: 'short',    hairCol: P.ink,     top: P.steel, topStyle: 'tie', tie: P.ink, trousers: P.navy },
    support:   { skin: '#8A5A3E', hair: 'curly',    hairCol: P.ink,     top: P.navy,  topStyle: 'crew', trousers: P.ink },
    admin:     { skin: '#F2D3BC', hair: 'bun',      hairCol: '#4A3426', top: P.ink,   topStyle: 'blazer', inner: P.grey, trousers: P.steel, glasses: true },
    sales:     { skin: '#C68E6A', hair: 'sidepart', hairCol: P.ink,     top: P.navy,  topStyle: 'blazer', inner: P.white, trousers: P.steel },
    recruiter: { skin: '#6E4532', hair: 'long',     hairCol: P.ink,     top: '#2F4455', topStyle: 'crew', trousers: P.navy },
  };

  // ------------------------------------------------------------------ icons (drawn in a 100×100 box centred on 0,0)
  const ICON = {
    headset: (c) => `<path d="M-24 6 C-26 -34 26 -34 24 6" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
      <rect x="-31" y="-4" width="14" height="24" rx="6" fill="${c}"/><rect x="17" y="-4" width="14" height="24" rx="6" fill="${c}"/>
      <path d="M-24 18 Q-22 30 -6 28" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
    doc: (c) => `<path d="M-18 -26 L8 -26 L20 -14 L20 26 L-18 26Z" fill="none" stroke="${c}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M-8 -6 L10 -6 M-8 6 L10 6 M-8 17 L4 17" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`,
    chart: (c) => `<path d="M-24 22 L24 22" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
      <rect x="-21" y="2" width="10" height="16" rx="3" fill="${c}"/><rect x="-5" y="-10" width="10" height="28" rx="3" fill="${c}"/><rect x="11" y="-24" width="10" height="42" rx="3" fill="${c}"/>`,
    cv: (c) => `<circle cx="0" cy="-10" r="11" fill="none" stroke="${c}" stroke-width="6"/>
      <path d="M-20 24 C-20 4 20 4 20 24" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>`,
  };

  window.CAST = { P, shade, hose, person, SPECS, ICON, HEAD, SH, ARM_REST, f };
})();
