/**
 * @file response.js — Consistent JSON response helpers.
 *
 * All API responses MUST:
 *   - Use `application/json; charset=utf-8`
 *   - Pass through security headers + CORS in index.js
 *   - Never leak stack traces, PII, ciphertext, or internal identifiers
 */

/**
 * Build a JSON response. Additional headers are merged.
 * @param {unknown} data
 * @param {number} [status=200]
 * @param {HeadersInit} [extraHeaders]
 * @returns {Response}
 */
export function json(data, status = 200, extraHeaders) {
  const headers = new Headers(extraHeaders);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify(data), { status, headers });
}

/**
 * Build a JSON error response with a short machine code + optional retry hint.
 * @param {string} code        e.g. 'too_many_requests', 'bad_request'
 * @param {number} status
 * @param {Record<string, unknown>} [extra]
 * @returns {Response}
 */
export function jsonError(code, status, extra) {
  return json({ error: code, ...(extra || {}) }, status);
}
