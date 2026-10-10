// Speaking instead of typing: the browser's own speech recognition (on iPhone, the same dictation
// as the keyboard's microphone). Where a browser has none, the microphone button isn't shown and
// the keyboard's microphone still works.
const Recognition = () => globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition || null;
export const canListen = () => !!Recognition();

/** Listen once. onText gets the words so far; onEnd runs when listening stops. Returns stop(). */
export function listen({ onText, onEnd, lang = navigator.language || 'en-GB' } = {}) {
  const R = Recognition();
  if (!R) { onEnd?.('unsupported'); return () => {}; }
  const rec = new R();
  rec.lang = lang;
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let ended = false;
  rec.onresult = (e) => onText?.([...e.results].map((r) => r[0].transcript).join(' ').replace(/\s+/g, ' ').trim());
  const finish = (why) => { if (ended) return; ended = true; onEnd?.(why); };
  rec.onerror = (e) => finish(e.error || 'error');
  rec.onend = () => finish('done');
  try { rec.start(); } catch { finish('error'); }
  return () => { try { rec.stop(); } catch { /* already stopped */ } };
}
