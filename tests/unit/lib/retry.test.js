// tests/unit/lib/retry.test.js
//
// Exponential-backoff retry primitives.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  withRetry,
  defaultIsRetryable,
  computeBackoff,
  CircuitBreaker,
} from '../../../src/lib/retry.js';

describe('defaultIsRetryable', () => {
  it('retries 5xx and 429', () => {
    expect(defaultIsRetryable({ status: 500 })).toBe(true);
    expect(defaultIsRetryable({ status: 503 })).toBe(true);
    expect(defaultIsRetryable({ status: 429 })).toBe(true);
  });
  it('does not retry other 4xx', () => {
    expect(defaultIsRetryable({ status: 400 })).toBe(false);
    expect(defaultIsRetryable({ status: 404 })).toBe(false);
    expect(defaultIsRetryable({ status: 409 })).toBe(false);
  });
  it('retries TypeError (fetch network failure)', () => {
    expect(defaultIsRetryable(new TypeError('Failed to fetch'))).toBe(true);
  });
  it('does not retry AbortError', () => {
    const e = new Error('abort'); e.name = 'AbortError';
    expect(defaultIsRetryable(e)).toBe(false);
  });
});

describe('computeBackoff', () => {
  it('matches 300/600/1200/2400 schedule without jitter', () => {
    expect(computeBackoff(0, 300, 8000, false)).toBe(300);
    expect(computeBackoff(1, 300, 8000, false)).toBe(600);
    expect(computeBackoff(2, 300, 8000, false)).toBe(1200);
    expect(computeBackoff(3, 300, 8000, false)).toBe(2400);
  });
  it('caps at maxMs', () => {
    expect(computeBackoff(10, 300, 8000, false)).toBe(8000);
  });
  it('applies full jitter in [0, backoff) when enabled', () => {
    const v = computeBackoff(2, 300, 8000, true, () => 0.5);
    expect(v).toBe(Math.floor(0.5 * 1200));
  });
});

describe('withRetry', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('returns immediately on first success', async () => {
    const fn = vi.fn(async () => 'ok');
    const p = withRetry(fn, { retries: 3, jitter: false });
    await expect(p).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('succeeds after N retries', async () => {
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls < 3) { const e = new Error('flaky'); e.status = 503; throw e; }
      return 'ok';
    });
    const p = withRetry(fn, { retries: 4, baseMs: 10, maxMs: 40, jitter: false });
    await vi.runAllTimersAsync();
    await expect(p).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('gives up after max attempts with aggregated error', async () => {
    const fn = vi.fn(async () => { const e = new Error('5xx'); e.status = 500; throw e; });
    const p = withRetry(fn, { retries: 2, baseMs: 1, maxMs: 4, jitter: false });
    const settled = p.catch((e) => e);
    await vi.runAllTimersAsync();
    const err = await settled;
    expect(err).toMatchObject({ attempts: 3, errors: expect.any(Array) });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('stops immediately when isRetryable returns false', async () => {
    const fn = vi.fn(async () => { throw new Error('fatal'); });
    const p = withRetry(fn, { retries: 5, baseMs: 1, jitter: false, isRetryable: () => false });
    await expect(p).rejects.toThrow(/Non-retryable/);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('aborts mid-retry via AbortSignal', async () => {
    const ctrl = new AbortController();
    let calls = 0;
    const fn = vi.fn(async () => {
      calls++;
      if (calls === 1) { const e = new Error('5xx'); e.status = 500; throw e; }
      return 'never';
    });
    const p = withRetry(fn, {
      retries: 5,
      baseMs: 1000,
      jitter: false,
      signal: ctrl.signal,
    });
    // Catch so rejection during microtask flushing isn't unhandled.
    const settled = p.catch((e) => e);
    // Let first attempt run and schedule the backoff sleep, then abort.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    ctrl.abort();
    const err = await settled;
    expect(err).toMatchObject({ name: 'AbortError' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid params', async () => {
    await expect(withRetry(null)).rejects.toThrow(TypeError);
    await expect(withRetry(async () => 1, { retries: -1 })).rejects.toThrow(RangeError);
  });
});

describe('CircuitBreaker', () => {
  it('opens after threshold failures and blocks calls', () => {
    const t = 0;
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000, now: () => t });
    expect(cb.allow()).toBe(true);
    cb.recordFailure(); cb.recordFailure(); cb.recordFailure();
    expect(cb.state).toBe('open');
    expect(cb.allow()).toBe(false);
  });

  it('transitions to half-open after cooldown, then closed on success', () => {
    let t = 0;
    const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000, now: () => t });
    cb.recordFailure(); cb.recordFailure();
    expect(cb.allow()).toBe(false);
    t = 1500;
    expect(cb.allow()).toBe(true);
    expect(cb.state).toBe('half-open');
    cb.recordSuccess();
    expect(cb.state).toBe('closed');
  });

  it('half-open failure returns to open immediately', () => {
    let t = 0;
    const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000, now: () => t });
    cb.recordFailure(); cb.recordFailure();
    t = 1500;
    cb.allow(); // → half-open
    cb.recordFailure();
    expect(cb.state).toBe('open');
    expect(cb.allow()).toBe(false);
  });

  it('recordSuccess resets the failure counter', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });
    cb.recordFailure(); cb.recordFailure();
    cb.recordSuccess();
    cb.recordFailure(); cb.recordFailure();
    expect(cb.state).toBe('closed');
  });

  it('rejects invalid params', () => {
    expect(() => new CircuitBreaker({ failureThreshold: 0 })).toThrow(RangeError);
    expect(() => new CircuitBreaker({ cooldownMs: -1 })).toThrow(RangeError);
  });
});
