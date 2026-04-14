// SPDX-License-Identifier: TBD
/**
 * @file retry.js — Exponential-backoff retry with full jitter + circuit breaker.
 *
 * Used by submit-report.js to wrap fetch. Never retries forever, always
 * honours AbortSignal, and never retries non-retryable errors (e.g. 4xx
 * other than 429). The circuit breaker protects the server from a client
 * storm when the endpoint is demonstrably unhealthy.
 */

const DEFAULT_RETRIES = 4;
const DEFAULT_BASE_MS = 300;
const DEFAULT_MAX_MS = 8000;

/**
 * Default retry predicate: retry network errors and HTTP 5xx / 429 responses.
 * Any error with a `.status` numeric field is treated as an HTTP response.
 *
 * @param {unknown} err
 * @returns {boolean}
 */
export function defaultIsRetryable(err) {
  if (!err) return false;
  if (err && typeof err.status === 'number') {
    if (err.status === 429) return true;
    if (err.status >= 500 && err.status <= 599) return true;
    return false;
  }
  // Network-ish errors: TypeError from fetch, abort != retryable
  if (err && err.name === 'AbortError') return false;
  if (err instanceof TypeError) return true;
  // Anything with a network-y code
  const code = err && (err.code || err.errno);
  if (code && typeof code === 'string' && /^(ECONN|ETIMEDOUT|ENETUNREACH|EAI_AGAIN|ENOTFOUND)/.test(code)) {
    return true;
  }
  return false;
}

/**
 * Compute full-jitter backoff in ms for a given attempt index (0-based),
 * capped at `maxMs`. When `jitter` is false, returns the raw backoff.
 *
 * @param {number} attempt 0-based attempt index (0 = first retry wait)
 * @param {number} baseMs
 * @param {number} maxMs
 * @param {boolean} jitter
 * @param {() => number} [rand=Math.random]
 * @returns {number}
 */
export function computeBackoff(attempt, baseMs, maxMs, jitter, rand = Math.random) {
  const raw = Math.min(maxMs, baseMs * Math.pow(2, attempt));
  if (!jitter) return raw;
  return Math.floor(rand() * raw);
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) {
      reject(abortError(signal));
      return;
    }
    const t = setTimeout(() => {
      if (signal) signal.removeEventListener?.('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      reject(abortError(signal));
    };
    if (signal) signal.addEventListener?.('abort', onAbort, { once: true });
  });
}

function abortError(signal) {
  const reason = signal && signal.reason;
  if (reason instanceof Error) return reason;
  const err = new Error('Aborted');
  err.name = 'AbortError';
  return err;
}

/**
 * Retry `fn` with exponential backoff + full jitter.
 *
 * @template T
 * @param {(attempt: number) => Promise<T>} fn called with 1-based attempt index
 * @param {object} [opts]
 * @param {number} [opts.retries=4]    maximum retries AFTER the initial attempt
 * @param {number} [opts.baseMs=300]
 * @param {number} [opts.maxMs=8000]
 * @param {boolean} [opts.jitter=true]
 * @param {AbortSignal} [opts.signal]
 * @param {(err:unknown)=>boolean} [opts.isRetryable]
 * @param {() => number} [opts.rand]   injectable RNG for deterministic tests
 * @returns {Promise<T>}
 */
export async function withRetry(fn, opts = {}) {
  const {
    retries = DEFAULT_RETRIES,
    baseMs = DEFAULT_BASE_MS,
    maxMs = DEFAULT_MAX_MS,
    jitter = true,
    signal,
    isRetryable = defaultIsRetryable,
    rand = Math.random,
  } = opts;

  if (typeof fn !== 'function') throw new TypeError('fn must be a function');
  if (!Number.isInteger(retries) || retries < 0) {
    throw new RangeError('retries must be a non-negative integer');
  }

  const errors = [];
  const maxAttempts = retries + 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (signal && signal.aborted) throw abortError(signal);
    try {
      return await fn(attempt);
    } catch (err) {
      errors.push(err);
      if (err && err.name === 'AbortError') throw err;
      if (attempt === maxAttempts) break;
      if (!isRetryable(err)) {
        const wrap = new Error(`Non-retryable failure on attempt ${attempt}: ${describe(err)}`);
        wrap.cause = err;
        wrap.attempts = attempt;
        wrap.errors = errors;
        throw wrap;
      }
      const waitMs = computeBackoff(attempt - 1, baseMs, maxMs, jitter, rand);
      await sleep(waitMs, signal);
    }
  }
  const last = errors[errors.length - 1];
  const wrap = new Error(`Retry exhausted after ${maxAttempts} attempts: ${describe(last)}`);
  wrap.cause = last;
  wrap.attempts = maxAttempts;
  wrap.errors = errors;
  throw wrap;
}

function describe(err) {
  if (!err) return 'unknown';
  if (err.message) return err.message;
  try { return String(err); } catch { return 'unknown'; }
}

/**
 * Simple circuit breaker. Closed → open after `failureThreshold` consecutive
 * failures. Open → half-open after `cooldownMs`. Half-open → closed on one
 * success, back to open on one failure.
 */
export class CircuitBreaker {
  constructor({ failureThreshold = 5, cooldownMs = 30_000, now = () => Date.now() } = {}) {
    if (!Number.isInteger(failureThreshold) || failureThreshold <= 0) {
      throw new RangeError('failureThreshold must be a positive integer');
    }
    if (!Number.isFinite(cooldownMs) || cooldownMs < 0) {
      throw new RangeError('cooldownMs must be a non-negative finite number');
    }
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
    this._now = now;
    this.state = 'closed';
    this.failures = 0;
    this.openedAt = 0;
  }

  /**
   * Should the caller attempt the operation right now?
   * Transitions open → half-open once cooldown has elapsed.
   * @returns {boolean}
   */
  allow() {
    if (this.state === 'open') {
      if (this._now() - this.openedAt >= this.cooldownMs) {
        this.state = 'half-open';
        return true;
      }
      return false;
    }
    return true; // closed or half-open
  }

  recordSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure() {
    if (this.state === 'half-open') {
      this.state = 'open';
      this.openedAt = this._now();
      this.failures = this.failureThreshold;
      return;
    }
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      this.openedAt = this._now();
    }
  }
}
