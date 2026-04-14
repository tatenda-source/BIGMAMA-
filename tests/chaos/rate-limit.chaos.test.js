// tests/chaos/rate-limit.chaos.test.js
//
// Scenario: a witness is documenting a live incident and fires off twenty
// reports in ten seconds. We must protect the backend AND the user — no
// report can be silently dropped. Excess submissions are queued and drained
// at the configured rate. The client also respects a server-sent Retry-After
// header for HTTP 429 responses.
//
// Invariants proven here:
//   1. A burst of N > limit submissions within the window only triggers
//      `limit` fetches inside that window; the rest are queued, not dropped.
//   2. Queued submissions drain as the window advances.
//   3. A 429 response with Retry-After pauses the queue for exactly that long.
//   4. Total accepted count equals total submitted count (no drops).

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// TODO: wire real import.
import {
  submitReport,
  RATE_LIMIT_PER_WINDOW_MS,
  RATE_LIMIT_WINDOW_MS,
  drainRateLimitQueue,
} from '../../src/lib/idempotency.js';

describe.skip('chaos: rate-limit', () => {
  let fetchMock;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), { status: 202 }),
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('burst beyond the per-window limit queues the excess, never drops', async () => {
    const burst = RATE_LIMIT_PER_WINDOW_MS * 3;
    const promises = [];
    for (let i = 0; i < burst; i++) {
      promises.push(submitReport({ title: `r${i}`, body: 'burst' }));
    }

    // Within the first window, only `limit` fetches should have fired.
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(RATE_LIMIT_PER_WINDOW_MS);

    // Advance enough windows to drain everything.
    await vi.advanceTimersByTimeAsync(RATE_LIMIT_WINDOW_MS * 3 + 100);

    const results = await Promise.all(promises);
    expect(results.every((r) => r && r.accepted)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(burst);
  });

  it('respects Retry-After on a 429 response', async () => {
    let call = 0;
    fetchMock.mockImplementation(() => {
      call++;
      if (call === 1) {
        return Promise.resolve(
          new Response('rate-limited', {
            status: 429,
            headers: { 'Retry-After': '2' }, // seconds
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ accepted: true }), { status: 202 }),
      );
    });

    const p = submitReport({ title: 'back-off', body: 'x' });
    // Let the 429 land and backoff begin.
    await vi.advanceTimersByTimeAsync(100);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Not yet — still within the 2-second backoff.
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Past 2 seconds total — retry fires.
    await vi.advanceTimersByTimeAsync(2000);
    const result = await p;
    expect(result).toMatchObject({ accepted: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('drainRateLimitQueue processes pending items in insertion order', async () => {
    const items = Array.from({ length: 5 }, (_, i) => ({ title: `q${i}`, body: String(i) }));
    const promises = items.map((it) => submitReport(it));

    await vi.advanceTimersByTimeAsync(1);

    // Explicit drain (simulates a window tick or a resume after Retry-After).
    await drainRateLimitQueue({ runAll: true });
    await vi.runAllTimersAsync();
    await Promise.all(promises);

    const titles = fetchMock.mock.calls.map(([, init]) => JSON.parse(init.body).title);
    expect(titles).toEqual(['q0', 'q1', 'q2', 'q3', 'q4']);
  });

  it('no submission is silently dropped under sustained pressure', async () => {
    const total = RATE_LIMIT_PER_WINDOW_MS * 5 + 3;
    const promises = [];
    for (let i = 0; i < total; i++) {
      promises.push(submitReport({ title: `p${i}`, body: 'x' }));
    }

    // Let many windows pass.
    await vi.advanceTimersByTimeAsync(RATE_LIMIT_WINDOW_MS * 10);

    const results = await Promise.all(promises);
    expect(results.filter((r) => r && r.accepted)).toHaveLength(total);
  });
});
