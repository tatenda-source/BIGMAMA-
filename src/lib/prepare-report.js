/**
 * Turn a raw form payload into a ciphertext struct the server will accept.
 *
 * The flow:
 *   1. validateReport() — length bounds + proto-pollution guard + sanitisation
 *   2. encryptAesGcm()  — AES-GCM-256 under a per-report 32-byte random key
 *   3. pack into `{v:1, iv, salt, ct}` (server contract in server/src/lib/validate.js)
 *
 * The per-report key is intentionally **not stored**. For the current
 * whistleblower MVP, reports are write-once tips: the reporter never needs to
 * decrypt them again, but server operators who hold no key cannot decrypt
 * either (compelled-disclosure resistance). Readable review by trusted
 * parties is a deliberate future feature that will introduce server/authority
 * public-key wrapping (see docs/roadmap.md).
 */

import { validateReport } from '../utils/validation.js';
import { encryptAesGcm, randomId } from './crypto.js';

/**
 * @param {object} form
 * @returns {Promise<{ ok: true, ciphertext: object } | { ok: false, errors: Record<string,string> }>}
 */
export async function prepareReport(form) {
  const { isValid, errors, sanitized } = validateReport(form);
  if (!isValid) return { ok: false, errors };

  const password = randomId(32);
  const ciphertext = await encryptAesGcm(JSON.stringify(sanitized), password);
  return { ok: true, ciphertext };
}
