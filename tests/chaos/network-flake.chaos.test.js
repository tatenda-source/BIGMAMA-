// tests/chaos/network-flake.chaos.test.js
//
// Scenario: flaky network. Whistleblowers often submit from cell edges where
// TCP stalls, TLS renegotiates, or captive portals hijack traffic. The client
// MUST retry a bounded number of times, reuse the same idempotency key on every
// retry, surface a user-facing error when all retries fail, and never cause
// duplicate server-side side-effects.
//
// Invariants proven here:
//   1. submitReport retries exactly MAX_RETRIES times on transient failure.
//   2. The X-Idempotency-Key header is identical across every retry attempt.
//   3. After MAX_RETRIES, a typed error (NetworkExhaustedError) bubbles up.
//   4. A single eventual success (on retry k < MAX_RETRIES) produces exactly
//      one logical "accepted" signal to the caller.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// TODO: wire real import — other agent is authoring this module.
import { submitReport, MAX_RETRIES, NetworkExhaustedError } from '../../src/lib/idempotency.js';

const SAMPLE_REPORT = Object.freeze({
  title: 'Graft at the border post',
  body: 'Witnessed cash changing hands at 14:02.',
  category: 'corruption',
  attachments: [],
});

describe('chaos: network-flake', () => {
  let fetchMock;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('retries exactly MAX_RETRIES times before surfacing NetworkExhaustedError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const promise = submitReport(SAMPLE_REPORT).catch((e) => e);
    // Drain any internal backoff timers.
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(MAX_RETRIES);
    expect(result).toBeInstanceOf(NetworkExhaustedError);
  });

  it('reuses the same idempotency key across every retry', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const promise = submitReport(SAMPLE_REPORT).catch(() => null);
    await vi.runAllTimersAsync();
    await promise;

    const keys = fetchMock.mock.calls.map(([, init]) => {
      const headers = new Headers(init?.headers || {});
      return headers.get('X-Idempotency-Key');
    });

    expect(keys.length).toBe(MAX_RETRIES);
    expect(keys.every((k) => typeof k === 'string' && k.length > 0)).toBe(true);
    // All retries must share the same key — otherwise server-side dedup fails.
    const unique = new Set(keys);
    expect(unique.size).toBe(1);
  });

  it('stops retrying and resolves once a retry succeeds; single accepted signal', async () => {
    const okResponse = new Response(JSON.stringify({ accepted: true, id: 'r-123' }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    });

    // Fail twice, then succeed.
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(okResponse);

    const onAccepted = vi.fn();
    const promise = submitReport(SAMPLE_REPORT, { onAccepted });
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({ accepted: true });
    // Exactly one "accepted" side-effect even though fetch was invoked 3 times.
    expect(onAccepted).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate side-effects when all attempts fail at the transport layer', async () => {
    // Simulate body-parse style failures that still count as network failure.
    fetchMock.mockImplementation(() => Promise.reject(new TypeError('network down')));

    const onAccepted = vi.fn();
    const onPersist = vi.fn();

    const promise = submitReport(SAMPLE_REPORT, { onAccepted, onPersist }).catch(() => null);
    await vi.runAllTimersAsync();
    await promise;

    expect(onAccepted).not.toHaveBeenCalled();
    // The report may be enqueued once for later replay, but never more than once.
    expect(onPersist.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
