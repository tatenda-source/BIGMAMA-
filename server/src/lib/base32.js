/**
 * @file base32.js — Crockford Base32 encoder (no padding, uppercase).
 *
 * Crockford's alphabet excludes visually ambiguous glyphs (I, L, O, U), so
 * case IDs read cleanly over the phone and in handwritten notes. Output is
 * deterministic; input is byte-exact — no ambiguity in decode.
 *
 * Ref: https://www.crockford.com/base32.html
 */

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Encode bytes as Crockford Base32 (uppercase, no padding).
 * @param {Uint8Array} bytes
 * @returns {string}
 */
export function crockfordEncode(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('crockfordEncode requires a Uint8Array');
  }
  let bits = 0;
  let value = 0;
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      out += CROCKFORD_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    out += CROCKFORD_ALPHABET[(value << (5 - bits)) & 31];
  }
  return out;
}
