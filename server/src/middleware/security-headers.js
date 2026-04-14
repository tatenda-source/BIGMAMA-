/**
 * @file security-headers.js — Defense-in-depth response headers.
 *
 * Applied to every API response by the top-level router. These headers
 * harden the browser-facing contract even though API responses are not
 * HTML:
 *   - HSTS preload: forces HTTPS everywhere (worker is HTTPS-only anyway,
 *     but the header propagates to any proxy/mirror).
 *   - nosniff: stops content-type confusion attacks on blobs ever served.
 *   - no-referrer: prevents leakage of caseId via Referer on cross-origin
 *     redirects.
 *   - CORP same-origin: stops embedders from reading responses.
 *   - no-store: API data is sensitive; caches must not retain.
 *   - noindex/nofollow: keep us off search engines and crawlers entirely.
 */

const SECURITY_HEADERS = Object.freeze({
  'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'cross-origin-resource-policy': 'same-origin',
  'cache-control': 'no-store',
  'x-robots-tag': 'noindex, nofollow, noarchive',
});

/**
 * Return a new Response with the security headers applied (body/status preserved).
 * @param {Response} response
 * @returns {Response}
 */
export function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
