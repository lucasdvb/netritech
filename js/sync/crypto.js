// Sync encryption: everything leaves the device encrypted with a key only your devices know.
// One sync key (20 characters, about 100 bits) is stretched (PBKDF2) into a master key, and from
// that (HKDF) come four things: the AES-GCM key that seals each record, the HMAC key that gives
// each record an opaque name, and the space and password the server knows you by. The server
// can't read a record, or tell which record is which.
const enc = new TextEncoder();
const dec = new TextDecoder();
const subtle = () => globalThis.crypto.subtle;
const SALT = enc.encode('life-os sync v1');
// Crockford's base32: no I, L, O or U, so a key read aloud or typed can't be misread.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/** A new sync key, shown in groups of five: XXXXX-XXXXX-XXXXX-XXXXX. */
export function newKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const chars = [...bytes].map((b) => ALPHABET[b & 31]).join('');
  return chars.match(/.{5}/g).join('-');
}

/** The key as typed, made canonical: capitals, no spaces or dashes, O read as 0 and I/L as 1. */
export function normalize(text) {
  return String(text || '').toUpperCase().replace(/[\s-]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
}
export const isKey = (text) => new RegExp(`^[${ALPHABET}]{20}$`).test(normalize(text));

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
export const b64 = (buf) => { let s = ''; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode(...a.subarray(i, i + 0x8000)); return btoa(s); };
export const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const b64url = (buf) => b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** Everything derived from a sync key: { space, auth, name(text), seal(obj), open(text) }. */
export async function keysFrom(key) {
  const k = normalize(key);
  if (!isKey(k)) throw new Error('That isn’t a sync key.');
  const base = await subtle().importKey('raw', enc.encode(k), 'PBKDF2', false, ['deriveBits']);
  const master = await subtle().deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: SALT, iterations: 210000 }, base, 256);
  const hk = await subtle().importKey('raw', master, 'HKDF', false, ['deriveBits', 'deriveKey']);
  const info = (s) => ({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: enc.encode(s) });
  const aes = await subtle().deriveKey(info('enc'), hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const mac = await subtle().deriveKey(info('mac'), hk, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['sign']);
  const space = hex(await subtle().deriveBits(info('space'), hk, 256));
  const auth = hex(await subtle().deriveBits(info('auth'), hk, 256));
  return {
    space,
    auth,
    /** The opaque name a record goes by on the server. */
    name: async (text) => b64url(await subtle().sign('HMAC', mac, enc.encode(text))).slice(0, 43),
    /** Encrypt a value: base64 of a fresh 12-byte nonce followed by the ciphertext. */
    async seal(value) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await subtle().encrypt({ name: 'AES-GCM', iv }, aes, enc.encode(JSON.stringify(value)));
      const out = new Uint8Array(12 + ct.byteLength);
      out.set(iv);
      out.set(new Uint8Array(ct), 12);
      return b64(out);
    },
    /** Decrypt what seal made; throws if it was made with another key or was tampered with. */
    async open(text) {
      const all = unb64(text);
      const pt = await subtle().decrypt({ name: 'AES-GCM', iv: all.subarray(0, 12) }, aes, all.subarray(12));
      return JSON.parse(dec.decode(pt));
    },
  };
}
