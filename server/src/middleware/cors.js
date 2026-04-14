/**
 * @file cors.js — Strict, allowlist-based CORS.
 *
 * Rules:
 *   - Origins come from env.ALLOWED_ORIGINS (comma-separated exact matches).
 *   - Unknown origins get no ACAO header at all — browsers then block them.
 *   - We never echo `*`. Wildcarding an encrypted-report endpoint would be
 *     reckless even though bodies are ciphertext.
 *   - Preflight returns the intersection of requested methods/headers with
 *     our allowlist; anything else is silently dropped.
 */

const ALLOWED_METHODS = ['POST', 'GET', 'OPTIONS'];
const ALLOWED_HEADERS = ['Content-Type', 'Idempotency-Key'];
const MAX_AGE = '600';

/**
 * @param {string|undefined} raw
 * @returns {string[]}
 */
function parseAllowed(raw) {
  if (!raw || typeof raw !== 'string') return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Extract a validated Origin (or null if not in the allowlist).
 * @param {Request} request
 * @param {{ ALLOWED_ORIGINS?: string }} env
 * @returns {string | null}
 */
export function allowedOrigin(request, env) {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  const list = parseAllowed(env.ALLOWED_ORIGINS);
  return list.includes(origin) ? origin : null;
}

/**
 * Build CORS headers for an actual (non-preflight) response.
 * @param {Request} request
 * @param {{ ALLOWED_ORIGINS?: string }} env
 * @returns {Headers}
 */
export function corsHeaders(request, env) {
  const headers = new Headers();
  const origin = allowedOrigin(request, env);
  if (origin) {
    headers.set('access-control-allow-origin', origin);
    headers.set('vary', 'Origin');
  }
  return headers;
}

/**
 * Merge CORS headers into an existing Response without mutating it.
 * @param {Response} response
 * @param {Request} request
 * @param {{ ALLOWED_ORIGINS?: string }} env
 * @returns {Response}
 */
export function withCors(response, request, env) {
  const merged = new Headers(response.headers);
  for (const [k, v] of corsHeaders(request, env)) merged.set(k, v);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: merged,
  });
}

/**
 * Handle OPTIONS preflight requests.
 * @param {Request} request
 * @param {{ ALLOWED_ORIGINS?: string }} env
 * @returns {Response}
 */
export function handlePreflight(request, env) {
  const origin = allowedOrigin(request, env);
  const headers = new Headers();
  if (origin) {
    headers.set('access-control-allow-origin', origin);
    headers.set('access-control-allow-methods', ALLOWED_METHODS.join(', '));
    headers.set('access-control-allow-headers', ALLOWED_HEADERS.join(', '));
    headers.set('access-control-max-age', MAX_AGE);
    headers.set('vary', 'Origin, Access-Control-Request-Headers');
  }
  // 204 whether allowed or not — do not leak allowlist via status codes.
  return new Response(null, { status: 204, headers });
}
