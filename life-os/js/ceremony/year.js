// Your year as artwork (G6): one ray a day around a circle, its length from that day's score, a
// blue point where the day was sealed, the months marked inside. It's a fixed function of your
// data (no randomness), so the same year always makes the same picture. Prints at 12 × 15 in.
import { stage } from './stage.js';

const C = { paper: '#FFFFFF', ink: '#1D1D1F', grey: '#6E6E73', faint: '#DADADD', blue: '#0071E3' };
const FONT = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
export const PRINT = { w: 3600, h: 4500 };   // 12 × 15 in at 300 dpi, inside every phone's canvas limit

/** Draw the year's circle into a square of side `size` at (x, y). `progress` 0–1 reveals it day by day. */
export function drawArt(ctx, data, { x = 0, y = 0, size, progress = 1 } = {}) {
  const n = data.days.length;
  const cx = x + size / 2, cy = y + size / 2;
  const r0 = size * 0.17, span = size * 0.31;
  const lw = Math.max(1, size / 380);
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const p = Math.max(0, Math.min(1, progress * n * 1.15 - i));
    if (p <= 0) break;
    const d = data.days[i];
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(a), sin = Math.sin(a);
    const len = d.future ? size * 0.012 : d.ratio == null ? size * 0.02 : size * 0.025 + span * d.ratio;
    const r1 = r0 + len * p;
    ctx.strokeStyle = d.future || d.ratio == null ? C.faint : C.ink;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(cx + cos * r0, cy + sin * r0);
    ctx.lineTo(cx + cos * r1, cy + sin * r1);
    ctx.stroke();
    if (d.sealed && p >= 1) {
      ctx.fillStyle = C.blue;
      ctx.beginPath();
      ctx.arc(cx + cos * (r1 + size * 0.012), cy + sin * (r1 + size * 0.012), size * 0.0042, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = C.grey;
  for (let m = 0; m < 12; m++) {
    const a = (m / 12) * Math.PI * 2 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r0 * 0.78, cy + Math.sin(a) * r0 * 0.78, size * 0.0042, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The print: the circle, the year, and its totals, on white. */
export function drawPrint(ctx, data, { w = PRINT.w, h = PRINT.h } = {}) {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, w, h);
  const size = w * 0.86;
  drawArt(ctx, data, { x: (w - size) / 2, y: h * 0.06, size });
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.font = `600 ${Math.round(w * 0.11)}px ${FONT}`;
  ctx.fillText(String(data.year), w / 2, h * 0.87);
  ctx.fillStyle = C.grey;
  ctx.font = `400 ${Math.round(w * 0.028)}px ${FONT}`;
  ctx.fillText(`${data.logged} days you showed up · ${data.sealed} sealed${data.name ? ` · ${data.name}` : ''}`, w / 2, h * 0.92);
}

/** Save the print as a PNG (share sheet where there is one, otherwise a download). */
export async function savePrint(data) {
  const canvas = document.createElement('canvas');
  canvas.width = PRINT.w; canvas.height = PRINT.h;
  drawPrint(canvas.getContext('2d'), data);
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  const name = `life-os-${data.year}.png`;
  const file = new File([blob], name, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: `Your ${data.year}` }).catch(() => {}); return blob; }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  return blob;
}

/** Watch the year draw itself, day by day (a ceremony, at your request). */
export function playYear(data) {
  return stage({
    name: 'year',
    tone: 'paper',
    label: `Your ${data.year}`,
    play: (el) => {
      el.insertAdjacentHTML('beforeend', `<div class="cer cer-year"><canvas class="year-canvas" aria-hidden="true"></canvas><p class="cer-title">${data.year}</p>
        <p class="cer-eyebrow">${data.logged} days you showed up · ${data.sealed} sealed</p>
        <div class="cer-actions"><button type="button" class="btn btn--soft" data-year-save>Save print</button><button type="button" class="btn btn--primary" data-stage-close>Close</button></div></div>`);
      el.querySelector('[data-year-save]').addEventListener('click', () => savePrint(data).catch(() => {}));
      const canvas = el.querySelector('canvas');
      const css = Math.min(innerWidth - 48, 420);
      const dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = canvas.height = Math.round(css * dpr);
      canvas.style.width = canvas.style.height = `${css}px`;
      const ctx = canvas.getContext('2d');
      const dur = 2600, t0 = performance.now();
      let done = false;
      const frame = (now) => {
        if (!canvas.isConnected) return;
        const p = done ? 1 : Math.min(1, (now - t0) / dur);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawArt(ctx, data, { size: canvas.width, progress: p });
        if (p < 1) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
      const list = [el.querySelector('.cer-title').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 2300, fill: 'both' }),
        el.querySelector('.cer-eyebrow').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: 2600, fill: 'both' }),
        el.querySelector('.cer-actions').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 3000, fill: 'both' })];
      list.push({ finish: () => { done = true; } });
      return { duration: 3600, animations: list, keep: true };
    },
    still: (el) => {
      el.insertAdjacentHTML('beforeend', `<div class="cer cer-year"><canvas class="year-canvas" aria-hidden="true"></canvas><p class="cer-title">${data.year}</p></div>`);
      const canvas = el.querySelector('canvas');
      canvas.width = canvas.height = 840;
      canvas.style.width = canvas.style.height = '320px';
      drawArt(canvas.getContext('2d'), data, { size: 840 });
    },
  });
}
