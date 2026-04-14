/**
 * @file reports.js — POST /api/reports.
 *
 * Flow:
 *   1. Validate Content-Type is application/json (else 415).
 *   2. Enforce max body size via Content-Length + streamed byte counter (413).
 *   3. Require & validate Idempotency-Key header (400).
 *   4. Parse JSON safely (400 on malformed).
 *   5. Strict-schema the body — exact { v:1, iv, salt, ct } (400).
 *   6. Check KV idempotency ledger.
 *        - If hit: return the original caseId with status:'duplicate' (200).
 *   7. Mint unforgeable caseId via HMAC.
 *   8. Insert row into D1.
 *   9. Record ledger entry with 7-day TTL.
 *  10. Return 201 { caseId, status:'received' }.
 *
 * Logging discipline:
 *   - NEVER log ciphertext, iv, salt, idempotency-key, or IP.
 *   - Emit one structured line with caseId + status + duration_ms only.
 */

import { json, jsonError } from '../lib/response.js';
import { enforceRateLimit } from '../middleware/rate-limit.js';
import { mintCaseId } from '../lib/case-id.js';
import { isValidIdempotencyKey, validateReportBody } from '../lib/validate.js';

/** One hour in seconds — HMAC bucket cadence. */
const CASE_ID_BUCKET_SECONDS = 3600;

/**
 * @param {Request} request
 * @param {{
 *   DB: D1Database,
 *   IDEMPOTENCY: KVNamespace,
 *   RATE_LIMIT: KVNamespace,
 *   SERVER_SECRET?: string,
 *   RATE_LIMIT_SALT?: string,
 *   MAX_BODY_BYTES?: string,
 *   WRITE_RPM_PER_IP?: string,
 *   IDEMPOTENCY_TTL_SECONDS?: string,
 * }} env
 * @param {ExecutionContext} ctx
 * @returns {Promise<Response>}
 */
export async function handleCreateReport(request, env, ctx) {
  const start = Date.now();

  // --- Rate limit first (cheapest rejection path) --------------------------
  const writeLimit = Number.parseInt(env.WRITE_RPM_PER_IP || '10', 10);
  const rl = await enforceRateLimit(request, env, { kind: 'write', limit: writeLimit });
  if (rl) return rl;

  // --- Content-Type --------------------------------------------------------
  const ct = request.headers.get('content-type') || '';
  if (!/^application\/json(?:\s*;.*)?$/i.test(ct)) {
    return jsonError('unsupported_media_type', 415);
  }

  // --- Body size (defense vs. oversize payload) ----------------------------
  const maxBytes = Number.parseInt(env.MAX_BODY_BYTES || '262144', 10);
  const declaredLen = Number.parseInt(request.headers.get('content-length') || '0', 10);
  if (Number.isFinite(declaredLen) && declaredLen > maxBytes) {
    return jsonError('payload_too_large', 413, { max_bytes: maxBytes });
  }

  // --- Idempotency-Key -----------------------------------------------------
  const idempotencyKey = request.headers.get('idempotency-key');
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return jsonError('idempotency_key_invalid', 400);
  }

  // --- Read body with hard cap --------------------------------------------
  let raw;
  try {
    raw = await readWithLimit(request, maxBytes);
  } catch (err) {
    if (err && /** @type {any} */ (err).code === 'payload_too_large') {
      return jsonError('payload_too_large', 413, { max_bytes: maxBytes });
    }
    return jsonError('bad_request', 400);
  }

  // --- Parse JSON ----------------------------------------------------------
  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return jsonError('invalid_json', 400);
  }

  // --- Strict schema validation -------------------------------------------
  const result = validateReportBody(parsed);
  if (!result.ok) {
    return jsonError('invalid_body', 400, { detail: result.error });
  }
  const body = result.body;

  // --- Idempotency ledger hit? --------------------------------------------
  const ledgerKey = `idem:${idempotencyKey}`;
  try {
    const existing = await env.IDEMPOTENCY.get(ledgerKey, 'json');
    if (existing && typeof existing === 'object' && typeof existing.caseId === 'string') {
      logEvent({ caseId: existing.caseId, status: 'duplicate', ms: Date.now() - start });
      return json({ caseId: existing.caseId, status: 'duplicate' }, 200);
    }
  } catch {
    // KV read error is non-fatal — worst case we mint a fresh caseId.
  }

  // --- Mint caseId ---------------------------------------------------------
  const secret = env.SERVER_SECRET;
  if (!secret || secret.length < 16) {
    // Misconfigured environment — refuse rather than issue predictable IDs.
    return jsonError('server_misconfigured', 500);
  }
  const bucket = Math.floor(Date.now() / 1000 / CASE_ID_BUCKET_SECONDS);
  const caseId = await mintCaseId(idempotencyKey, secret, bucket);

  // --- Persist to D1 -------------------------------------------------------
  const createdAt = Date.now();
  try {
    await env.DB.prepare(
      'INSERT INTO reports (case_id, ciphertext_b64, iv_b64, salt_b64, created_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(caseId, body.ct, body.iv, body.salt, createdAt)
      .run();
  } catch (err) {
    const msg = String(err && /** @type {any} */ (err).message || err);
    // A unique-constraint hit means two concurrent submits won the race under
    // the same idempotency bucket. Treat as duplicate rather than error.
    if (/UNIQUE|PRIMARY KEY/i.test(msg)) {
      logEvent({ caseId, status: 'duplicate_race', ms: Date.now() - start });
      return json({ caseId, status: 'duplicate' }, 200);
    }
    logEvent({ caseId, status: 'db_error', ms: Date.now() - start });
    return jsonError('storage_unavailable', 503);
  }

  // --- Idempotency ledger write (best-effort, after durable insert) --------
  const ttl = Number.parseInt(env.IDEMPOTENCY_TTL_SECONDS || '604800', 10);
  const writeLedger = env.IDEMPOTENCY.put(
    ledgerKey,
    JSON.stringify({ caseId, createdAt }),
    { expirationTtl: ttl }
  ).catch(() => {
    // If KV write fails, the D1 row is still safe. Retries may create a
    // second row — we accept that; civic reports must never be lost.
  });
  // Don't block the response on KV write.
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(writeLedger);

  logEvent({ caseId, status: 'received', ms: Date.now() - start });
  return json({ caseId, status: 'received' }, 201);
}

/**
 * Read the request body as text, aborting if it exceeds `maxBytes`.
 * Streaming guard protects against Content-Length spoofing.
 *
 * @param {Request} request
 * @param {number} maxBytes
 * @returns {Promise<string>}
 */
async function readWithLimit(request, maxBytes) {
  const reader = request.body ? request.body.getReader() : null;
  if (!reader) return '';
  let received = 0;
  const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      try { await reader.cancel(); } catch { /* noop */ }
      const err = new Error('payload_too_large');
      /** @type {any} */ (err).code = 'payload_too_large';
      throw err;
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

/**
 * Structured log emit. ONLY caseId + status + duration_ms.
 * @param {{ caseId: string, status: string, ms: number }} ev
 */
function logEvent(ev) {
  console.log(JSON.stringify({ evt: 'report', ...ev }));
}
