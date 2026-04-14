/**
 * @file case-status.js — GET /api/case/:id/status.
 *
 * Returns ONLY a coarse status: `received` | `confirmed` | `not_found`.
 * Never returns ciphertext, iv, salt, or created_at. That is by design —
 * this endpoint is a receipt lookup, not a read API.
 *
 * Guessing attacks: case IDs are ~50 bits. Still, we rate-limit this
 * endpoint harder (read quota) and refuse malformed IDs with 400 so brute
 * force is expensive even before KV is touched.
 */

import { json, jsonError } from '../lib/response.js';
import { enforceRateLimit } from '../middleware/rate-limit.js';
import { isValidCaseId } from '../lib/case-id.js';

/**
 * @param {Request} request
 * @param {{
 *   DB: D1Database,
 *   RATE_LIMIT: KVNamespace,
 *   RATE_LIMIT_SALT?: string,
 *   READ_RPM_PER_IP?: string,
 * }} env
 * @param {string} caseId
 * @returns {Promise<Response>}
 */
export async function handleCaseStatus(request, env, caseId) {
  const limit = Number.parseInt(env.READ_RPM_PER_IP || '60', 10);
  const rl = await enforceRateLimit(request, env, { kind: 'read', limit });
  if (rl) return rl;

  if (!isValidCaseId(caseId)) {
    return jsonError('invalid_case_id', 400);
  }

  try {
    const row = await env.DB.prepare(
      'SELECT status FROM reports WHERE case_id = ? LIMIT 1'
    )
      .bind(caseId)
      .first();
    if (!row) return json({ status: 'not_found' }, 404);
    const status = row.status === 'confirmed' ? 'confirmed' : 'received';
    return json({ status }, 200);
  } catch {
    // Do not echo DB error detail. Treat as lookup unavailable.
    return jsonError('storage_unavailable', 503);
  }
}
