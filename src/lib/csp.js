/**
 * @file csp.js — Content Security Policy builder for BIGMAMA$.
 *
 * Pure function; no side effects. Emits the CSP string you'd put in a
 * `<meta http-equiv="Content-Security-Policy">` tag or a `Content-Security-
 * Policy` response header.
 */

/**
 * Build a CSP string for BIGMAMA$.
 *
 * @param {{nonce: string}} options
 *   `nonce` must be a per-response random value (base64 or hex). It is
 *   interpolated into `script-src` to allow only specifically-tagged
 *   inline scripts during the migration off inline scripts.
 * @returns {string} The serialized CSP.
 */
export default function buildCspMeta({ nonce } = {}) {
  if (typeof nonce !== 'string' || nonce.length === 0) {
    throw new TypeError('buildCspMeta requires a non-empty string nonce');
  }
  // Nonces must be plain base64url/hex; reject anything that could break out.
  if (!/^[A-Za-z0-9_\-+/=]+$/.test(nonce)) {
    throw new TypeError('nonce contains invalid characters');
  }

  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}'`,
    // TODO: tighten style-src once Vite's inline styles are eliminated.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `connect-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ];

  return directives.join('; ');
}
