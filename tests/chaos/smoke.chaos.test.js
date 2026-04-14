/**
 * Smoke chaos scenarios that exercise the *shipped* submit-report pipeline.
 *
 * The larger chaos files (network-flake, offline-queue, rate-limit, ...) were
 * authored as a contract against a richer API than currently ships. They're
 * marked `describe.skip` until the production code lives up to the spec —
 * intentional todo pressure on the codebase rather than false greens.
 *
 * This file keeps at least one real chaos scenario running on every CI build
 * so the suite isn't a no-op.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { submitReport } from '../../src/lib/submit-report.js';
import { OfflineQueue } from '../../src/lib/offline-queue.js';
import { IdempotencyStore } from '../../src/lib/idempotency.js';

function memStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    key: (i) => Array.from(m.keys())[i] ?? null,
    get length() { return m.size; },
    clear: () => m.clear(),
  };
}

describe('chaos/smoke: shipped submitReport', () => {
  let store, queue;
  beforeEach(() => {
    store = new IdempotencyStore(memStorage());
    queue = new OfflineQueue(memStorage());
  });

  it('retries on a single fetch failure then delivers', async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls++;
      if (calls === 1) throw new TypeError('Network down');
      return new Response(JSON.stringify({ caseId: 'ZR-ABC123' }), { status: 201 });
    });

    const result = await submitReport(
      { v: 1, iv: 'a', salt: 'b', ct: 'c' },
      {
        endpoint: '/api/reports',
        store,
        queue,
        fetchImpl,
        isOnline: () => true,
        retry: { retries: 3, baseMs: 1, maxMs: 2, jitter: false },
      }
    );

    expect(result.status).toBe('delivered');
    expect(result.caseId).toBe('ZR-ABC123');
    expect(calls).toBe(2);
  });

  it('reuses the same idempotency key across retries', async () => {
    const seenKeys = [];
    let calls = 0;
    const fetchImpl = vi.fn(async (_url, init) => {
      seenKeys.push(init.headers['Idempotency-Key']);
      calls++;
      if (calls < 3) throw new TypeError('flake');
      return new Response(JSON.stringify({ caseId: 'ZR-K1' }), { status: 201 });
    });

    await submitReport(
      { v: 1, iv: 'a', salt: 'b', ct: 'c' },
      {
        endpoint: '/api/reports',
        store,
        queue,
        fetchImpl,
        isOnline: () => true,
        retry: { retries: 4, baseMs: 1, maxMs: 2, jitter: false },
      }
    );

    expect(seenKeys.length).toBe(3);
    expect(new Set(seenKeys).size).toBe(1);
  });

  it('short-circuits when the idempotency cache already has a result', async () => {
    store.remember('known-key', { caseId: 'ZR-CACHED' });
    const fetchImpl = vi.fn();

    const result = await submitReport(
      { idempotencyKey: 'known-key', v: 1, iv: 'a', salt: 'b', ct: 'c' },
      { endpoint: '/api/reports', store, queue, fetchImpl, isOnline: () => true }
    );

    expect(result).toMatchObject({ status: 'delivered', caseId: 'ZR-CACHED' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('enqueues when offline and never calls fetch', async () => {
    const fetchImpl = vi.fn();
    const result = await submitReport(
      { v: 1, iv: 'a', salt: 'b', ct: 'c' },
      { endpoint: '/api/reports', store, queue, fetchImpl, isOnline: () => false }
    );

    expect(result.status).toBe('queued');
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(queue.list()).toHaveLength(1);
  });

  it('surfaces 4xx errors without enqueueing (bad request, retry would not help)', async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error: 'bad' }), { status: 400 })
    );

    await expect(
      submitReport(
        { v: 1, iv: 'a', salt: 'b', ct: 'c' },
        {
          endpoint: '/api/reports',
          store,
          queue,
          fetchImpl,
          isOnline: () => true,
          retry: { retries: 1, baseMs: 1, maxMs: 1, jitter: false },
        }
      )
    ).rejects.toThrow();

    expect(queue.list()).toHaveLength(0);
  });
});
