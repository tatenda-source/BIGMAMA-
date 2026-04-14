// tests/unit/lib/offline-queue.test.js
//
// FIFO, dedupe, reload-survival, partial-failure semantics.

import { describe, it, expect, vi } from 'vitest';
import { OfflineQueue } from '../../../src/lib/offline-queue.js';

function makeStorage({ quotaAfter = Infinity } = {}) {
  const map = new Map();
  let writes = 0;
  return {
    _map: map,
    getItem: vi.fn((k) => (map.has(k) ? map.get(k) : null)),
    setItem: vi.fn((k, v) => {
      writes++;
      if (writes > quotaAfter) {
        const err = new Error('quota');
        err.name = 'QuotaExceededError';
        throw err;
      }
      map.set(k, String(v));
    }),
    removeItem: vi.fn((k) => { map.delete(k); }),
    key: vi.fn((i) => Array.from(map.keys())[i] ?? null),
    get length() { return map.size; },
    clear: vi.fn(() => map.clear()),
  };
}

function mkItem(i, extra = {}) {
  return {
    id: `id-${i}`,
    payload: { n: i },
    idempotencyKey: `key-${i}`,
    createdAt: 1000 + i,
    attempts: 0,
    ...extra,
  };
}

describe('OfflineQueue.enqueue', () => {
  it('appends in FIFO order', () => {
    const q = new OfflineQueue(makeStorage());
    q.enqueue(mkItem(1));
    q.enqueue(mkItem(2));
    q.enqueue(mkItem(3));
    expect(q.list().map((x) => x.id)).toEqual(['id-1', 'id-2', 'id-3']);
  });

  it('dedupes by idempotencyKey', () => {
    const q = new OfflineQueue(makeStorage());
    expect(q.enqueue(mkItem(1))).toBe(true);
    expect(q.enqueue(mkItem(1, { id: 'other' }))).toBe(false);
    expect(q.list().length).toBe(1);
  });

  it('rejects malformed items', () => {
    const q = new OfflineQueue(makeStorage());
    expect(() => q.enqueue(null)).toThrow(TypeError);
    expect(() => q.enqueue({ id: 'x' })).toThrow(TypeError);
    expect(() => q.enqueue({ ...mkItem(1), idempotencyKey: '' })).toThrow(TypeError);
  });
});

describe('OfflineQueue.dequeue / peek / list', () => {
  it('peek returns head; dequeue removes by id', () => {
    const q = new OfflineQueue(makeStorage());
    q.enqueue(mkItem(1));
    q.enqueue(mkItem(2));
    expect(q.peek().id).toBe('id-1');
    expect(q.dequeue('id-1')).toBe(true);
    expect(q.peek().id).toBe('id-2');
    expect(q.dequeue('nope')).toBe(false);
  });
});

describe('OfflineQueue.flush', () => {
  it('delivers all on success', async () => {
    const q = new OfflineQueue(makeStorage());
    q.enqueue(mkItem(1)); q.enqueue(mkItem(2)); q.enqueue(mkItem(3));
    const sendFn = vi.fn(async () => ({ ok: true }));
    const res = await q.flush(sendFn);
    expect(res.delivered).toBe(3);
    expect(res.remaining).toBe(0);
    expect(sendFn).toHaveBeenCalledTimes(3);
  });

  it('stops on first failure, leaves remainder for next flush', async () => {
    const q = new OfflineQueue(makeStorage());
    q.enqueue(mkItem(1)); q.enqueue(mkItem(2)); q.enqueue(mkItem(3));
    let n = 0;
    const sendFn = vi.fn(async () => {
      n++;
      if (n === 2) { const e = new Error('flaky'); e.status = 503; throw e; }
      return { ok: true };
    });
    const res = await q.flush(sendFn);
    expect(res.delivered).toBe(1);
    expect(res.remaining).toBe(2);
    expect(q.list()[0].id).toBe('id-2');
    expect(q.list()[0].attempts).toBe(1); // attempts bumped for the failed head
  });

  it('survives a simulated reload via a shared storage', async () => {
    const storage = makeStorage();
    const q1 = new OfflineQueue(storage);
    q1.enqueue(mkItem(1));
    q1.enqueue(mkItem(2));
    // "reload": construct a new queue over the same storage.
    const q2 = new OfflineQueue(storage);
    expect(q2.list().map((x) => x.id)).toEqual(['id-1', 'id-2']);

    const delivered = [];
    const res = await q2.flush(async (item) => { delivered.push(item.id); });
    expect(delivered).toEqual(['id-1', 'id-2']);
    expect(res.delivered).toBe(2);

    // A third reload should see an empty queue.
    const q3 = new OfflineQueue(storage);
    expect(q3.list()).toEqual([]);
  });

  it('honours AbortSignal', async () => {
    const q = new OfflineQueue(makeStorage());
    q.enqueue(mkItem(1)); q.enqueue(mkItem(2));
    const ctrl = new AbortController();
    const sendFn = vi.fn(async () => { ctrl.abort(); });
    const res = await q.flush(sendFn, { signal: ctrl.signal });
    // First call resolves so we dequeue id-1, then signal aborts before id-2.
    expect(res.delivered).toBe(1);
    expect(q.list().map((x) => x.id)).toEqual(['id-2']);
  });

  it('rejects non-function sendFn', async () => {
    const q = new OfflineQueue(makeStorage());
    await expect(q.flush(null)).rejects.toThrow(TypeError);
  });
});

describe('OfflineQueue quota eviction', () => {
  it('evicts oldest and notifies onEviction when storage is full', () => {
    const storage = makeStorage();
    // First two writes (one per enqueue) succeed; third throws QuotaExceeded.
    let n = 0;
    const origSet = storage.setItem;
    storage.setItem = vi.fn((k, v) => {
      n++;
      if (n === 3) { const err = new Error('quota'); err.name = 'QuotaExceededError'; throw err; }
      origSet(k, v);
    });

    const q = new OfflineQueue(storage);
    const evictions = [];
    q.onEviction = (it) => evictions.push(it.id);
    q.enqueue(mkItem(1));
    q.enqueue(mkItem(2));
    // Third write throws QuotaExceeded once; eviction retry (setItem call #4)
    // succeeds via the mock's default branch.
    q.enqueue(mkItem(3));

    // Queue should contain id-2 and id-3 (id-1 evicted).
    expect(q.list().map((x) => x.id)).toEqual(['id-2', 'id-3']);
    expect(evictions).toEqual(['id-1']);
  });
});

describe('OfflineQueue.attachOnlineFlush', () => {
  it('attaches and detaches a window-online listener', () => {
    const handlers = new Map();
    const fakeWindow = {
      addEventListener: vi.fn((ev, h) => { handlers.set(ev, h); }),
      removeEventListener: vi.fn((ev) => { handlers.delete(ev); }),
    };
    const origWindow = globalThis.window;
    globalThis.window = fakeWindow;
    try {
      const q = new OfflineQueue(makeStorage());
      const detach = q.attachOnlineFlush(async () => ({ ok: true }));
      expect(fakeWindow.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(handlers.has('online')).toBe(true);
      detach();
      expect(fakeWindow.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    } finally {
      globalThis.window = origWindow;
    }
  });

  it('is a no-op when there is no window', () => {
    const origWindow = globalThis.window;
    // @ts-ignore
    delete globalThis.window;
    try {
      const q = new OfflineQueue(makeStorage());
      const detach = q.attachOnlineFlush(async () => 1);
      expect(typeof detach).toBe('function');
      expect(() => detach()).not.toThrow();
    } finally {
      globalThis.window = origWindow;
    }
  });

  it('rejects non-function sendFn', () => {
    const q = new OfflineQueue(makeStorage());
    expect(() => q.attachOnlineFlush(null)).toThrow(TypeError);
  });
});
