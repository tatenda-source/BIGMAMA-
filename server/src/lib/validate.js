/**
 * @file validate.js — Strict schema validation for encrypted report bodies.
 *
 * The server never decrypts. It just stores. That makes validation *very*
 * narrow: we accept exactly the shape produced by `src/lib/crypto.js` on
 * the frontend. Everything else is rejected so adversarial payloads can
 * never slip ancillary fields past the worker into D1.
 *
 * Schema:
 *   { v: 1, iv: base64url(12B), salt: base64url(16B), ct: base64url(<= ~256KB) }
 *
 * - Exactly 4 keys; no extras. Prototype pollution refused.
 * - Byte lengths enforced through base64url-length arithmetic:
 *     12 bytes -> ceil(12*4/3) = 16 chars (no padding)
 *     16 bytes -> ceil(16*4/3) = 22 chars (no padding)
 *     ct up to 256 KiB -> ceil(262144*4/3) ~= 349525 chars — we cap at 340_000
 *       to leave headroom below the 256 KB hard body cap.
 */

const ALLOWED_KEYS = ['v', 'iv', 'salt', 'ct'];
const IV_B64U_LEN = 16;
const SALT_B64U_LEN = 22;
const CT_MIN = 1;
const CT_MAX = 340_000;

const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

/**
 * @typedef {{ v: 1, iv: string, salt: string, ct: string }} ReportBody
 * @typedef {{ ok: true, body: ReportBody } | { ok: false, error: string }} ValidateResult
 */

/**
 * @param {unknown} obj
 * @returns {ValidateResult}
 */
export function validateReportBody(obj) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return { ok: false, error: 'body_not_object' };
  }
  // Reject prototype tampering.
  if (Object.getPrototypeOf(obj) !== Object.prototype) {
    return { ok: false, error: 'body_bad_prototype' };
  }

  const keys = Object.keys(obj);
  if (keys.length !== ALLOWED_KEYS.length) {
    return { ok: false, error: 'body_key_count' };
  }
  for (const k of keys) {
    if (!ALLOWED_KEYS.includes(k)) {
      return { ok: false, error: `body_unknown_key:${k}` };
    }
  }

  const { v, iv, salt, ct } = /** @type {Record<string, unknown>} */ (obj);

  if (v !== 1) return { ok: false, error: 'bad_version' };

  if (typeof iv !== 'string' || iv.length !== IV_B64U_LEN || !BASE64URL_RE.test(iv)) {
    return { ok: false, error: 'bad_iv' };
  }
  if (typeof salt !== 'string' || salt.length !== SALT_B64U_LEN || !BASE64URL_RE.test(salt)) {
    return { ok: false, error: 'bad_salt' };
  }
  if (
    typeof ct !== 'string' ||
    ct.length < CT_MIN ||
    ct.length > CT_MAX ||
    !BASE64URL_RE.test(ct)
  ) {
    return { ok: false, error: 'bad_ct' };
  }

  return { ok: true, body: { v: 1, iv, salt, ct } };
}

/**
 * Idempotency-Key format check (must match RFC-style token).
 * @param {unknown} s
 * @returns {boolean}
 */
export function isValidIdempotencyKey(s) {
  return typeof s === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(s);
}
