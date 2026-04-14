# BIGMAMA$ Submission Library

Exactly-once delivery for whistleblower reports. Composed of four small
modules with no external dependencies.

## Public API

### `idempotency.js`
- `generateIdempotencyKey(): string` — 128-bit base64url token.
- `class IdempotencyStore(storage?, ttlMs?)` with `has`, `get`, `remember`, `gc`.
- `withIdempotency(key, fn, store?)` — cache-hit short-circuit wrapper.

### `retry.js`
- `withRetry(fn, { retries, baseMs, maxMs, jitter, signal, isRetryable, rand })`
  — exponential backoff with full jitter. Honours `AbortSignal`, throws an
  aggregated error after `retries + 1` attempts.
- `defaultIsRetryable(err)` — network errors + HTTP 5xx + 429.
- `computeBackoff(attempt, baseMs, maxMs, jitter, rand?)` — deterministic
  when `rand` is provided.
- `class CircuitBreaker({ failureThreshold, cooldownMs, now? })` — closed /
  open / half-open states. `allow()`, `recordSuccess()`, `recordFailure()`.

### `offline-queue.js`
- `class OfflineQueue(storage?, key?)` with `enqueue`, `peek`, `dequeue`,
  `list`, `flush(sendFn, { signal? })`, `attachOnlineFlush(sendFn)`.
- Dedupes by `idempotencyKey`. Handles `QuotaExceededError` by evicting the
  oldest entry and calling `onEviction(item)`.

### `submit-report.js`
- `submitReport(payload, { endpoint, abortSignal, now?, store?, queue?, fetchImpl?, isOnline?, retry?, idFactory? })`
  — returns `{ status: 'delivered' | 'queued', caseId, idempotencyKey }`.

## Guarantees

1. Every submission carries a 128-bit `Idempotency-Key` header.
2. A cached `delivered` result for a key short-circuits the network.
3. Offline, or network failure after all retries, enqueues durably.
4. The queue dedupes by `idempotencyKey` — double-click safe.
5. Nothing in this library logs the payload.
6. Every async entry point accepts an `AbortSignal`.
7. No unbounded retries; no busy loops.

## Non-goals

- Encryption of the payload in the queue. Callers pass already-sanitised
  / encrypted payloads if required (see `src/lib/crypto.js`).
- Server-side idempotency. We assume the server honours `Idempotency-Key`;
  the client still guards against double-send via the local cache.
