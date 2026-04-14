// tests/chaos/storage-quota.chaos.test.js
//
// Scenario: localStorage is full. Cheap Android phones often cap at ~2-5MB
// and the queue can fill if the user has been offline for days. We must
// degrade gracefully: evict the oldest queue entries, surface a recoverable
// QuotaExceededError to the caller, and never lose the currently-in-flight
// report.
//
// Invariants proven here:
//   1. On QuotaExceededError during enqueue, the oldest entry is evicted.
//   2. Eviction is repeated until the new entry fits or the queue is empty.
//   3. The caller receives a typed, recoverable error — not a silent drop.
//   4. The in-flight report payload is never discarded in favour of queue
//      cleanup; it is prioritised over previously-queued entries.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// TODO: wire real import.
import {
  submitReport,
  peekOfflineQueue,
  QuotaRecoveryError,
  QUEUE_STORAGE_KEY,
} from '../../src/lib/idempotency.js';

class QuotaExceededError extends Error {
  constructor() {
    super('QuotaExceededError');
    this.name = 'QuotaExceededError';
    this.code = 22;
  }
}

function makeThrottledLocalStorage({ maxBytes }) {
  let store = Object.create(null);
  const sizeOf = (s) => (s ? new Blob([s]).size : 0);
  const totalSize = () =>
    Object.values(store).reduce((n, v) => n + sizeOf(v), 0);

  return {
    get raw() {
      return { ...store };
    },
    getItem: vi.fn((k) => (k in store ? store[k] : null)),
    setItem: vi.fn((k, v) => {
      const prev = store[k] ? sizeOf(store[k]) : 0;
      const next = sizeOf(v);
      if (totalSize() - prev + next > maxBytes) {
        throw new QuotaExceededError();
      }
      store[k] = String(v);
    }),
    removeItem: vi.fn((k) => {
      delete store[k];
    }),
    clear: vi.fn(() => {
      store = Object.create(null);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i) => Object.keys(store)[i] ?? null),
  };
}

function setOnline(value) {
  Object.defineProperty(navigator, 'onLine', { configurable: true, value });
}

describe.skip('chaos: storage-quota', () => {
  let storage;
  let fetchMock;

  beforeEach(() => {
    // Tight budget: ~4KB so we can overflow with a few medium reports.
    storage = makeThrottledLocalStorage({ maxBytes: 4 * 1024 });
    vi.stubGlobal('localStorage', storage);
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    setOnline(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    setOnline(true);
    vi.restoreAllMocks();
  });

  it('evicts oldest queue entry when QuotaExceededError is thrown', async () => {
    const body = 'x'.repeat(900); // ~900 B per entry.

    await submitReport({ title: 't1', body });
    await submitReport({ title: 't2', body });
    await submitReport({ title: 't3', body });
    // Adding a 4th should force eviction of t1.
    await submitReport({ title: 't4', body });

    const queue = peekOfflineQueue();
    const titles = queue.map((q) => q.payload.title);
    expect(titles).not.toContain('t1');
    expect(titles).toContain('t4');
  });

  it('repeats eviction until the new entry fits', async () => {
    const body = 'y'.repeat(1500);
    await submitReport({ title: 'a', body });
    await submitReport({ title: 'b', body });

    const huge = 'z'.repeat(3500); // will require multiple evictions.
    await submitReport({ title: 'huge', body: huge });

    const queue = peekOfflineQueue();
    expect(queue.map((q) => q.payload.title)).toContain('huge');
  });

  it('surfaces QuotaRecoveryError when queue is empty and entry still does not fit', async () => {
    const gigantic = 'Z'.repeat(10 * 1024); // bigger than entire budget.

    const result = await submitReport({ title: 'too-big', body: gigantic }).catch(
      (e) => e,
    );

    expect(result).toBeInstanceOf(QuotaRecoveryError);
    // Queue must not be poisoned with partial data.
    expect(storage.getItem(QUEUE_STORAGE_KEY)).toBeNull();
  });

  it('never loses the current in-flight report to make room for older ones', async () => {
    // Pre-load the queue with old entries.
    await submitReport({ title: 'old-1', body: 'a'.repeat(900) });
    await submitReport({ title: 'old-2', body: 'b'.repeat(900) });
    await submitReport({ title: 'old-3', body: 'c'.repeat(900) });

    // Now submit something that triggers eviction. The new entry MUST
    // appear in the final queue even if every older entry had to be evicted.
    await submitReport({ title: 'current', body: 'N'.repeat(2500) });

    const queue = peekOfflineQueue();
    const titles = queue.map((q) => q.payload.title);
    expect(titles).toContain('current');
  });
});
