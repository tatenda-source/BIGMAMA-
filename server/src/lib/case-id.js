/**
 * @file case-id.js — Deterministic, unforgeable case-ID minting.
 *
 * HMAC-SHA256 over (idempotencyKey || serverSecret || bucket) using
 * WebCrypto's SubtleCrypto. The first 10 chars of Crockford Base32 give
 * ~50 bits — collision-resistant for civic-reporting scale and still
 * human-pronounceable. Prefixed with `ZR-` to match the frontend format.
 *
 * Properties:
 *   - Same (key, secret, bucket) -> same caseId (retries idempotent).
 *   - Different key or different secret -> different caseId (unforgeable).
 *   - Caller controls the `bucket` (e.g. a coarse timestamp) so the ID
 *     space can be rotated without breaking in-flight retries.
 */

import { crockfordEncode } from './base32.js';

/**
 * @param {string} idempotencyKey  Client-provided Idempotency-Key (validated upstream)
 * @param {string} secret          Long random server secret (>= 32 bytes hex/base64)
 * @param {string|number} bucket   Any stable scalar (caller decides rotation cadence)
 * @returns {Promise<string>}      `ZR-` + 10 Crockford-Base32 chars
 */
export async function mintCaseId(idempotencyKey, secret, bucket) {
  if (typeof idempotencyKey !== 'string' || idempotencyKey.length === 0) {
    throw new TypeError('mintCaseId: idempotencyKey must be a non-empty string');
  }
  if (typeof secret !== 'string' || secret.length < 16) {
    throw new TypeError('mintCaseId: secret must be a string of length >= 16');
  }
  if (bucket === undefined || bucket === null) {
    throw new TypeError('mintCaseId: bucket is required');
  }

  const enc = new TextEncoder();
  const keyBytes = enc.encode(secret);
  const msg = enc.encode(`${idempotencyKey}|${String(bucket)}`);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, msg);
  const sig = new Uint8Array(sigBuf);

  // 7 bytes = 56 bits -> 12 chars of base32; slice to 10 for ~50 bits.
  const encoded = crockfordEncode(sig.subarray(0, 7)).slice(0, 10);
  return `ZR-${encoded}`;
}

/**
 * Validate an externally-supplied caseId is syntactically correct.
 * Does NOT verify HMAC — that check only matters on mint.
 * @param {unknown} id
 * @returns {boolean}
 */
export function isValidCaseId(id) {
  return typeof id === 'string' && /^ZR-[0-9A-HJKMNP-TV-Z]{10}$/.test(id);
}
