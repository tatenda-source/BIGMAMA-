/**
 * @file crypto.js — Real WebCrypto primitives for BIGMAMA$.
 *
 * Replaces the cosmetic Base64 "simulated AES-256" in src/utils/security.js
 * with genuine authenticated encryption. All operations use the platform
 * WebCrypto API (SubtleCrypto + getRandomValues). No Math.random, no hand-
 * rolled crypto, no hardcoded salts.
 *
 * Threat model notes:
 *   - Passwords are stretched with PBKDF2-SHA256 @ 250,000 iterations.
 *   - AES-GCM provides confidentiality + integrity (AEAD).
 *   - Every encryption uses fresh random salt (16B) and IV (12B).
 *   - Payloads are versioned (v:1) so we can migrate without data loss.
 */

const PBKDF2_ITERATIONS = 250_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const KEY_BITS = 256;
const PAYLOAD_VERSION = 1;

/**
 * Resolve the SubtleCrypto instance, or throw with a useful error.
 * @returns {SubtleCrypto}
 */
function requireSubtle() {
  const c = globalThis.crypto;
  if (!c || !c.subtle || typeof c.getRandomValues !== 'function') {
    throw new Error(
      'WebCrypto is unavailable. BIGMAMA$ requires a secure context ' +
        '(HTTPS or localhost) and a modern browser with SubtleCrypto.'
    );
  }
  return c.subtle;
}

/**
 * Fill a new Uint8Array of length `n` with CSPRNG bytes.
 * @param {number} n
 * @returns {Uint8Array}
 */
function randomBytes(n) {
  const c = globalThis.crypto;
  if (!c || typeof c.getRandomValues !== 'function') {
    throw new Error('CSPRNG unavailable: crypto.getRandomValues missing.');
  }
  const out = new Uint8Array(n);
  c.getRandomValues(out);
  return out;
}

/**
 * base64url encode a Uint8Array (no padding).
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function b64uEncode(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = typeof btoa === 'function'
    ? btoa(bin)
    : Buffer.from(bin, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * base64url decode to Uint8Array.
 * @param {string} str
 * @returns {Uint8Array}
 */
function b64uDecode(str) {
  if (typeof str !== 'string') throw new TypeError('base64url input must be a string');
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = typeof atob === 'function'
    ? atob(b64)
    : Buffer.from(b64, 'base64').toString('binary');
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Derive a 256-bit AES-GCM key from a password + salt using PBKDF2-SHA256.
 * @param {string} password
 * @param {Uint8Array} salt
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(password, salt) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new TypeError('password must be a non-empty string');
  }
  const subtle = requireSubtle();
  const enc = new TextEncoder();
  const baseKey = await subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_BITS },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a UTF-8 string with AES-GCM-256 under a password-derived key.
 *
 * @param {string} plaintext
 * @param {string} password
 * @returns {Promise<{v:number, iv:string, salt:string, ct:string}>}
 *   All byte fields are base64url-encoded. `v` is the payload version.
 */
export async function encryptAesGcm(plaintext, password) {
  if (typeof plaintext !== 'string') throw new TypeError('plaintext must be a string');
  const subtle = requireSubtle();
  const salt = randomBytes(SALT_BYTES);
  const iv = randomBytes(IV_BYTES);
  const key = await deriveKey(password, salt);
  const ctBuf = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  return {
    v: PAYLOAD_VERSION,
    iv: b64uEncode(iv),
    salt: b64uEncode(salt),
    ct: b64uEncode(new Uint8Array(ctBuf)),
  };
}

/**
 * Decrypt a payload produced by {@link encryptAesGcm}.
 * Throws on wrong password, tampered ciphertext, or malformed input.
 *
 * @param {{v:number, iv:string, salt:string, ct:string}} payload
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function decryptAesGcm(payload, password) {
  if (!payload || typeof payload !== 'object') {
    throw new TypeError('payload must be an object');
  }
  if (payload.v !== PAYLOAD_VERSION) {
    throw new Error(`Unsupported payload version: ${payload.v}`);
  }
  const subtle = requireSubtle();
  const iv = b64uDecode(payload.iv);
  const salt = b64uDecode(payload.salt);
  const ct = b64uDecode(payload.ct);
  const key = await deriveKey(password, salt);
  const ptBuf = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(ptBuf);
}

/**
 * Generate a cryptographically-random identifier, base64url-encoded.
 * Default 16 bytes (128 bits) — collision-resistant for any app scale.
 *
 * @param {number} [bytes=16]
 * @returns {string}
 */
export function randomId(bytes = 16) {
  if (!Number.isInteger(bytes) || bytes < 1 || bytes > 1024) {
    throw new RangeError('bytes must be an integer in [1, 1024]');
  }
  return b64uEncode(randomBytes(bytes));
}

/**
 * RFC 4648 Base32 alphabet (Crockford-compatible uppercase w/o padding).
 * Excludes visually ambiguous chars naturally via Crockford; we stick with
 * RFC 4648 for simplicity. Ten chars give ~50 bits of entropy.
 */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encode bytes as RFC 4648 Base32 (no padding), uppercase.
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function base32Encode(bytes) {
  let bits = 0;
  let value = 0;
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}

/**
 * Generate a human-readable, unguessable case ID for civic reports.
 * Format: `ZR-XXXXXXXXXX` (10 base32 chars → ~50 bits of entropy).
 *
 * Uses CSPRNG only — no Math.random.
 * @returns {string}
 */
export function randomCaseId() {
  // 7 bytes = 56 bits → 12 base32 chars; slice to 10 for ~50 bits.
  const bytes = randomBytes(7);
  const encoded = base32Encode(bytes).slice(0, 10);
  return `ZR-${encoded}`;
}
