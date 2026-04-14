/**
 * Legacy compatibility shim.
 *
 * The former `encryptData` was Base64 wearing a trench-coat. Real primitives
 * now live in `src/lib/`:
 *   - crypto:   AES-GCM-256 + PBKDF2-SHA256  (src/lib/crypto.js)
 *   - sanitize: adversarial XSS / bidi / proto-pollution (src/lib/sanitize.js)
 *   - case-id:  CSPRNG-minted report id      (src/lib/case-id.js)
 *
 * This module re-exports a minimal API so in-flight imports keep working while
 * callers migrate. New code should import from `src/lib/*` directly. See
 * docs/security.md for the full threat model.
 */

import { encryptAesGcm, randomCaseId } from '../lib/crypto.js';
import { sanitizeText } from '../lib/sanitize.js';

/**
 * Encrypt a JSON-serialisable payload under a password using AES-GCM-256.
 * Returns the `{v,iv,salt,ct}` struct from the lib.
 *
 * @deprecated Import `encryptAesGcm` from `src/lib/crypto.js` directly.
 */
export const encryptData = async (data, password) => {
  if (typeof password !== 'string' || password.length < 1) {
    throw new Error('encryptData requires a non-empty password');
  }
  return encryptAesGcm(JSON.stringify(data), password);
};

/**
 * Sanitize a free-text user input for safe storage/render. Rejects non-strings.
 *
 * @deprecated Import `sanitizeText` from `src/lib/sanitize.js` directly.
 */
export const sanitizeInput = (text) => sanitizeText(text);

/**
 * Mint a new case id. Unforgeable (CSPRNG).
 *
 * @deprecated Import `randomCaseId` from `src/lib/case-id.js` directly.
 */
export const generateCaseId = () => randomCaseId();
