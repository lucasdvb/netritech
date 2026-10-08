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

/** Draw the frame at time t (ms). The same t always gives the same picture. */
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
  const i = Math.min(n - 1, Math.floor(t / CARD_MS));
  const local = t - i * CARD_MS;
  const last = i === n - 1;
  const fadeIn = ease(Math.min(1, local / 450));
  const fadeOut = last ? 1 : Math.min(1, Math.max(0, (CARD_MS - local) / 300));
  const card = film.cards[i];
  ctx.save();
  ctx.globalAlpha = Math.min(fadeIn, fadeOut);
  ctx.translate(0, (1 - fadeIn) * 30);
  // lay the card out from the bottom of its text block, centred on the screen
  const parts = [];
  ctx.textBaseline = 'alphabetic';
  if (card.eyebrow) parts.push({ font: `500 45px ${FONT}`, color: C.dim, lines: [card.eyebrow], lh: 60, after: 24 });
  if (card.big) parts.push({ font: `600 180px ${FONT}`, color: C.text, lines: [card.big], lh: 190, accent: card.accent, after: 18 });
  if (card.mid) { ctx.font = `600 96px ${FONT}`; parts.push({ font: `600 96px ${FONT}`, color: C.text, lines: wrap(ctx, card.mid, W - 144), lh: 106, after: card.accent && !card.big ? 10 : 18 }); }
  if (card.accent && !card.big) parts.push({ font: `600 96px ${FONT}`, color: C.blue, lines: [card.accent], lh: 106, after: 18 });
  if (card.small) { ctx.font = `400 51px ${FONT}`; parts.push({ font: `400 51px ${FONT}`, color: C.soft, lines: wrap(ctx, card.small, W - 144), lh: 70, after: 0 }); }
  const height = parts.reduce((a, p) => a + p.lines.length * p.lh + p.after, 0) + (card.line ? 60 : 0);
  let y = (H - height) / 2;
  for (const p of parts) {
    ctx.font = p.font;
    for (const line of p.lines) {
      y += p.lh;
      ctx.fillStyle = p.color;
      ctx.fillText(line, 72, y - p.lh * 0.18);
      if (p.accent) { const w = ctx.measureText(line).width; ctx.fillStyle = C.blue; ctx.fillText(p.accent, 72 + w, y - p.lh * 0.18); }
    }
    y += p.after;
  }
  if (card.line) { ctx.fillStyle = C.blue; ctx.fillRect(72, y + 36, 300 * ease(Math.min(1, Math.max(0, (local - 300) / 700))), 9); }
  ctx.restore();
}

/** Play a film on the ceremony stage. It ends on its last card with Save and Close. */
export function playFilm(film) {
  sound.play('moment');
  return stage({
    name: 'film',
    label: `${film.title}, your month`,
    play: (el) => {
      el.classList.add('stage--film');
      el.insertAdjacentHTML('beforeend', `<div class="film"><canvas class="film-canvas" width="${W}" height="${H}" aria-hidden="true"></canvas>
        <div class="film-actions"><button type="button" class="btn btn--soft" data-film-save>Save video</button><button type="button" class="btn btn--primary" data-stage-close>Close</button></div></div>`);
      const canvas = el.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const total = length(film);
      const t0 = performance.now();
      let done = false;
      const frame = (now) => {
        if (!canvas.isConnected) return;
        const t = done ? total : now - t0;
        drawFrame(ctx, film, t);
        if (t < total) requestAnimationFrame(frame); else { done = true; el.classList.add('is-ended'); }
      };
      requestAnimationFrame(frame);
      el.querySelector('[data-film-save]').addEventListener('click', (e) => saveFilm(film, e.currentTarget));
      return { duration: total, keep: true, animations: [{ finish: () => { done = true; drawFrame(ctx, film, total); } }] };
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
