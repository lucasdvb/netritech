// The monthly recap film (G10): the month as a short story, one card at a time with a bar for
// each across the top. It's drawn on a canvas, frame by frame from the time alone, so the same
// frames can be recorded and saved as a video. Tap to skip to the end; Save keeps it.
import { stage } from './stage.js';
import * as sound from '../ui/sound.js';

export const W = 1080, H = 1920, CARD_MS = 2200;
const C = { bg: '#000000', text: '#FFFFFF', dim: '#86868B', soft: '#F5F5F7', bar: '#2C2C2E', blue: '#0071E3' };
const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
const ease = (p) => 1 - (1 - p) ** 3;

/** Words wrapped to a width, for a given font already set on the context. */
function wrap(ctx, text, width) {
  const lines = [];
  let line = '';
  for (const w of String(text).split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > width && line) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** The length of a film in milliseconds. */
export const length = (film) => film.cards.length * CARD_MS;

/** Where the film is at time t: which card, how far into it, and its fade. */
function moment(film, t) {
  const n = film.cards.length;
  const total = n * CARD_MS;
  t = Math.max(0, Math.min(total, t));
  const i = Math.min(n - 1, Math.floor(t / CARD_MS));
  const local = t - i * CARD_MS;
  const fadeIn = ease(Math.min(1, local / 450));
  const fadeOut = i === n - 1 ? 1 : Math.min(1, Math.max(0, (CARD_MS - local) / 300));
  return { n, t, i, local, alpha: Math.min(fadeIn, fadeOut), dy: (1 - fadeIn) * 30 };
}

/** One card at full strength on black: its words and, if it has one, the blue line growing. */
function paintCard(ctx, film, i, local) {
  const card = film.cards[i];
  const layer = cardLayer(film, i);
  const top = (H - layer.height) / 2;
  ctx.drawImage(layer.canvas, 0, top - PAD);
  if (card.line) { ctx.fillStyle = C.blue; ctx.fillRect(72, top + layer.textHeight + 36, 300 * ease(Math.min(1, Math.max(0, (local - 300) / 700))), 9); }
}

/** Draw the frame at time t (ms), bars and fade included, as a saved video shows it. The same t always gives the same picture. */
export function drawFrame(ctx, film, t) {
  const n = film.cards.length;
  const total = n * CARD_MS;
  t = Math.max(0, Math.min(total, t));
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  // a bar for each card
  const gap = 12, x0 = 72, bw = (W - 2 * x0 - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * (bw + gap);
    ctx.fillStyle = C.bar;
    ctx.fillRect(x, 120, bw, 8);
    const p = Math.max(0, Math.min(1, (t - i * CARD_MS) / CARD_MS));
    if (p > 0) { ctx.fillStyle = C.text; ctx.fillRect(x, 120, bw * p, 8); }
  }
  const m = moment(film, t);
  ctx.save();
  ctx.globalAlpha = m.alpha;
  ctx.translate(0, m.dy);
  paintCard(ctx, film, m.i, m.local);
  ctx.restore();
}

// A card's words are set once, on their own small canvas, and each frame only places and fades
// it: wrapping and drawing large text every frame was the costly part on a phone.
const PAD = 48;
const layers = new WeakMap();
function cardLayer(film, i) {
  const cached = layers.get(film);
  if (cached?.i === i) return cached;
  const card = film.cards[i];
  const canvas = document.createElement('canvas');
  canvas.width = W;
  const c = canvas.getContext('2d');
  // lay the card out from the bottom of its text block; the block is centred on the screen
  const parts = [];
  if (card.eyebrow) parts.push({ font: `500 45px ${FONT}`, color: C.dim, lines: [card.eyebrow], lh: 60, after: 24 });
  if (card.big) parts.push({ font: `600 180px ${FONT}`, color: C.text, lines: [card.big], lh: 190, accent: card.accent, after: 18 });
  if (card.mid) { c.font = `600 96px ${FONT}`; parts.push({ font: `600 96px ${FONT}`, color: C.text, lines: wrap(c, card.mid, W - 144), lh: 106, after: card.accent && !card.big ? 10 : 18 }); }
  if (card.accent && !card.big) parts.push({ font: `600 96px ${FONT}`, color: C.blue, lines: [card.accent], lh: 106, after: 18 });
  if (card.small) { c.font = `400 51px ${FONT}`; parts.push({ font: `400 51px ${FONT}`, color: C.soft, lines: wrap(c, card.small, W - 144), lh: 70, after: 0 }); }
  const textHeight = parts.reduce((a, p) => a + p.lines.length * p.lh + p.after, 0);
  canvas.height = Math.ceil(textHeight + 2 * PAD); // resizing clears the context, so draw after
  c.textBaseline = 'alphabetic';
  let y = PAD;
  for (const p of parts) {
    c.font = p.font;
    for (const line of p.lines) {
      y += p.lh;
      c.fillStyle = p.color;
      c.fillText(line, 72, y - p.lh * 0.18);
      if (p.accent) { const w = c.measureText(line).width; c.fillStyle = C.blue; c.fillText(p.accent, 72 + w, y - p.lh * 0.18); }
    }
    y += p.after;
  }
  const layer = { i, canvas, textHeight, height: textHeight + (card.line ? 60 : 0) };
  // Kept only once Inter has loaded, so a card set in a fallback font is set again next frame.
  if (!document.fonts || parts.every((p) => document.fonts.check(p.font))) layers.set(film, layer);
  return layer;
}

/** Play a film on the ceremony stage. It ends on its last card with Save and Close. */
export function playFilm(film) {
  sound.play('moment');
  return stage({
    name: 'film',
    label: `${film.title}, your month`,
    play: (el) => {
      el.classList.add('stage--film');
      el.insertAdjacentHTML('beforeend', `<div class="film"><div class="film-frame"><canvas class="film-canvas" width="${W}" height="${H}" aria-hidden="true"></canvas>
        <div class="film-bars" aria-hidden="true">${film.cards.map(() => '<i><b></b></i>').join('')}</div></div>
        <div class="film-actions"><button type="button" class="btn btn--soft" data-film-save>Save video</button><button type="button" class="btn btn--primary" data-stage-close>Close</button></div></div>`);
      const canvas = el.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const bars = [...el.querySelectorAll('.film-bars b')];
      const total = length(film);
      const t0 = performance.now();
      let done = false;
      let painted = -1;
      // On screen the canvas holds one card at full strength, redrawn only when the card changes
      // (or its line is growing); the fade and the bars are left to the compositor.
      const show = (t) => {
        const m = moment(film, t);
        const card = film.cards[m.i];
        if (m.i !== painted || (card.line && m.local < 1100)) {
          ctx.fillStyle = C.bg;
          ctx.fillRect(0, 0, W, H);
          paintCard(ctx, film, m.i, m.local);
          painted = m.i;
        }
        canvas.style.opacity = m.alpha.toFixed(3);
        canvas.style.transform = m.dy ? `translateY(${((m.dy / H) * 100).toFixed(3)}%)` : '';
        bars.forEach((b, k) => { b.style.transform = `scaleX(${Math.max(0, Math.min(1, (m.t - k * CARD_MS) / CARD_MS)).toFixed(4)})`; });
      };
      const frame = (now) => {
        if (!canvas.isConnected) return;
        const t = done ? total : now - t0;
        show(t);
        if (t < total) requestAnimationFrame(frame); else { done = true; el.classList.add('is-ended'); }
      };
      requestAnimationFrame(frame);
      el.querySelector('[data-film-save]').addEventListener('click', (e) => saveFilm(film, e.currentTarget));
      return { duration: total, keep: true, animations: [{ finish: () => { done = true; show(total); } }] };
    },
    still: (el) => {
      el.insertAdjacentHTML('beforeend', `<div class="cer">${film.cards.map((c) => `<div class="cer-card"><p class="cer-eyebrow">${esc(c.eyebrow || '')}</p><p class="cer-film-line">${esc([c.big, c.mid].filter(Boolean).join(' '))}${c.accent ? `<span class="cer-blue">${esc(c.accent)}</span>` : ''}</p>${c.small ? `<p class="cer-line">${esc(c.small)}</p>` : ''}</div>`).join('')}</div>`);
    },
  });
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** The best video format this browser can record. */
export function videoType() {
  if (typeof MediaRecorder === 'undefined') return null;
  return ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) => MediaRecorder.isTypeSupported?.(t)) || null;
}

/** Record the film in real time and hand the file over (share sheet, or a download). */
export async function recordFilm(film, onProgress = () => {}) {
  const type = videoType();
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  if (!type || !canvas.captureStream) throw new Error('unsupported');
  const ctx = canvas.getContext('2d');
  drawFrame(ctx, film, 0);
  const stream = canvas.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6_000_000 });
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise((r) => { rec.onstop = r; });
  rec.start(250);
  const total = length(film) + 400;
  const t0 = performance.now();
  await new Promise((resolve) => {
    const tick = () => {
      const t = performance.now() - t0;
      drawFrame(ctx, film, t);
      onProgress(Math.min(1, t / total));
      if (t < total) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });
  rec.stop();
  await stopped;
  stream.getTracks().forEach((tr) => tr.stop());
  return new Blob(chunks, { type: type.split(';')[0] });
}

async function saveFilm(film, btn) {
  const { app } = await import('../ui/app-api.js');
  if (!videoType()) { app.toast('This browser can’t record video. The film still plays here any time.'); return; }
  btn.disabled = true;
  const label = btn.textContent;
  try {
    const blob = await recordFilm(film, (p) => { btn.textContent = `Saving… ${Math.round(p * 100)}%`; });
    const name = `life-os-${film.month}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;
    const file = new File([blob], name, { type: blob.type });
    if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: film.title }).catch(() => {}); }
    else {
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: name });
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    }
    app.toast('Your film is saved', { icon: 'check' });
  } catch {
    app.toast('The video couldn’t be saved this time. Try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = label;
  }
}
