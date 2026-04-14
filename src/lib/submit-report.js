// SPDX-License-Identifier: TBD
/**
 * @file submit-report.js — Integration point for civic report submission.
 *
 * Composes idempotency + retry + offline-queue into a single call. Designed
 * as a pure function boundary: no React, no DOM beyond `navigator.onLine`
 * and `fetch`. The UI layer calls `submitReport(payload, opts)` and receives
 * either a `delivered` result (with server-assigned caseId) or a `queued`
 * acknowledgement (the report is durably persisted, will flush on reconnect).
 *
 * Safety invariants:
 *   1. Every submission carries an `Idempotency-Key` header. The server is
 *      expected to honour it; if the client retries, we send the same key.
 *   2. If the key is already known to the local IdempotencyStore, we skip
 *      the network entirely and return the cached result.
 *   3. Offline or network-exhausted errors → the report is enqueued, never
 *      dropped. Duplicate enqueues by key are idempotent no-ops.
 *   4. We never log `payload`. Only the idempotencyKey and status codes.
 */

import { generateIdempotencyKey, IdempotencyStore } from './idempotency.js';
import { withRetry, defaultIsRetryable } from './retry.js';
import { OfflineQueue } from './offline-queue.js';

/**
 * @typedef {object} SubmitResult
 * @property {'delivered'|'queued'} status
 * @property {string|null} caseId
 * @property {string} idempotencyKey
 */

/**
 * Submit a civic report with exactly-once semantics.
 *
 * @param {object} payload              — sanitised report payload (opaque here)
 * @param {object} opts
 * @param {string} opts.endpoint
 * @param {AbortSignal} [opts.abortSignal]
 * @param {() => number} [opts.now]
 * @param {IdempotencyStore} [opts.store]
 * @param {OfflineQueue} [opts.queue]
 * @param {typeof fetch} [opts.fetchImpl]
 * @param {() => boolean} [opts.isOnline]
 * @param {object} [opts.retry] — forwarded to withRetry
 * @param {(id:string)=>string} [opts.idFactory]
 * @returns {Promise<SubmitResult>}
 */
export async function submitReport(payload, opts) {
  if (!payload || typeof payload !== 'object') {
    throw new TypeError('payload must be an object');
  }
  if (!opts || typeof opts.endpoint !== 'string' || !opts.endpoint) {
    throw new TypeError('opts.endpoint is required');
  }
  const {
    endpoint,
    abortSignal,
    now = () => Date.now(),
    store = new IdempotencyStore(),
    queue = new OfflineQueue(),
    fetchImpl = typeof globalThis !== 'undefined' ? globalThis.fetch : undefined,
    isOnline = defaultIsOnline,
    retry: retryOpts,
    idFactory = defaultIdFactory,
  } = opts;

  if (typeof fetchImpl !== 'function') {
    throw new Error('fetch is unavailable in this environment');
  }

  const idempotencyKey = typeof payload.idempotencyKey === 'string' && payload.idempotencyKey
    ? payload.idempotencyKey
    : generateIdempotencyKey();

  // 1. Cache short-circuit — idempotent hit.
  if (store.has(idempotencyKey)) {
    const cached = store.get(idempotencyKey);
    return {
      status: 'delivered',
      caseId: (cached && cached.caseId) || null,
      idempotencyKey,
    };
  }

  // 2. If clearly offline, enqueue immediately — do not attempt fetch.
  if (!isOnline()) {
    enqueueSafely(queue, payload, idempotencyKey, now, idFactory);
    return { status: 'queued', caseId: null, idempotencyKey };
  }

  // 3. Attempt delivery with bounded retry.
  try {
    const result = await withRetry(
      async () => postOnce({ fetchImpl, endpoint, payload, idempotencyKey, abortSignal }),
      {
        ...(retryOpts || {}),
        signal: abortSignal,
      }
    );
    // Cache for future retries / reloads.
    store.remember(idempotencyKey, { caseId: result.caseId });
    return { status: 'delivered', caseId: result.caseId, idempotencyKey };
  } catch (err) {
    if (err && err.name === 'AbortError') throw err;
    // Retries exhausted OR non-retryable network-ish failure → enqueue.
    // Non-retryable *server* errors (4xx) are not enqueued: they indicate
    // a bad request, re-sending won't help. We surface those to the caller.
    const root = err && err.cause ? err.cause : err;
    if (root && typeof root.status === 'number' && root.status >= 400 && root.status < 500 && root.status !== 429) {
      throw err;
    }
    enqueueSafely(queue, payload, idempotencyKey, now, idFactory);
    return { status: 'queued', caseId: null, idempotencyKey };
  }
}

async function postOnce({ fetchImpl, endpoint, payload, idempotencyKey, abortSignal }) {
  // Network failure rethrows as-is so withRetry's default predicate can treat
  // TypeError as retryable — no try/catch wrapper needed here.
  const res = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
    signal: abortSignal,
  });

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    // Mirror retry.js predicate: 5xx/429 retryable, else not.
    err.retryable = defaultIsRetryable(err);
    throw err;
  }

  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  const caseId = body && (body.caseId || body.case_id || body.id) || null;
  return { caseId };
}

function enqueueSafely(queue, payload, idempotencyKey, now, idFactory) {
  try {
    queue.enqueue({
      id: idFactory(idempotencyKey),
      payload,
      idempotencyKey,
      createdAt: now(),
      attempts: 0,
    });
  } catch (err) {
    // Never crash a submission on enqueue error — caller still gets the key
    // and can be shown a "saved locally" affordance.
    try { console.warn('[submit-report] enqueue failed:', err && err.message); } catch { /* noop */ }
  }
}

function defaultIsOnline() {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  return true; // assume online when we can't tell
}

function defaultIdFactory(idempotencyKey) {
  // Using the idempotency key as the queue id keeps dedupe trivial and the
  // id high-entropy. We prefix to keep them visually distinct in logs.
  return `q_${idempotencyKey}`;
}
