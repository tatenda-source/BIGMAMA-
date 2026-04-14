// tests/unit/lib/idempotency.test.js
//
// Exactly-once cache semantics: hit / miss / TTL expiry / quota eviction.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateIdempotencyKey,
  IdempotencyStore,
  withIdempotency,
  __internals,
} from '../../../src/lib/idempotency.js';

/** Minimal Storage mock with ordered insertion + quota hook. */
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

describe('generateIdempotencyKey', () => {
  it('returns a base64url string at least 22 chars long (128 bits)', () => {
    const k = generateIdempotencyKey();
    expect(typeof k).toBe('string');
    expect(k).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(k.length).toBeGreaterThanOrEqual(22);
  });

  it('emits distinct keys across calls', () => {
    const seen = new Set();
    for (let i = 0; i < 256; i++) seen.add(generateIdempotencyKey());
    expect(seen.size).toBe(256);
  });
});

describe('IdempotencyStore', () => {
  let storage;
  beforeEach(() => { storage = makeStorage(); });

  it('returns false for unknown keys', () => {
    const s = new IdempotencyStore(storage);
    expect(s.has('nope')).toBe(false);
    expect(s.get('nope')).toBeNull();
  });

  it('remember + has + get round-trip', () => {
    const s = new IdempotencyStore(storage);
    s.remember('k1', { caseId: 'ZR-AAAA' });
    expect(s.has('k1')).toBe(true);
    expect(s.get('k1')).toEqual({ caseId: 'ZR-AAAA' });
  });

  it('uses the bigmama:idem: prefix', () => {
    const s = new IdempotencyStore(storage);
    s.remember('k1', 1);
    expect(storage._map.has(`${__internals.KEY_PREFIX}k1`)).toBe(true);
  });

  it('expires entries past TTL', () => {
    const s = new IdempotencyStore(storage, 1000);
    let t = 0;
    s._now = () => t;
    s.remember('k1', 'v');
    t = 500;
    expect(s.has('k1')).toBe(true);
    t = 2001;
    expect(s.has('k1')).toBe(false);
    expect(s.get('k1')).toBeNull();
  });

  it('gc() removes expired entries only', () => {
    const s = new IdempotencyStore(storage, 1000);
    let t = 0;
    s._now = () => t;
    s.remember('old', 1);
    t = 500;
    s.remember('new', 2);
    t = 1200; // old expired (age 1200>1000), new still alive (age 700<1000)
    s.gc();
    expect(s.has('old')).toBe(false);
    expect(s.has('new')).toBe(true);
  });

  it('evicts oldest entry on QuotaExceededError', () => {
    const s = new IdempotencyStore(storage);
    let t = 0;
    s._now = () => t;
    s.remember('a', 1);
    t = 10; s.remember('b', 2);
    // Now simulate quota: next set will throw once, then succeed after eviction.
    let throwOnce = true;
    storage.setItem = vi.fn((k, v) => {
      if (throwOnce) {
        throwOnce = false;
        const err = new Error('quota'); err.name = 'QuotaExceededError'; throw err;
      }
      storage._map.set(k, String(v));
    });
    t = 20;
    s.remember('c', 3);
    // 'a' (oldest) should have been evicted via removeItem.
    expect(storage.removeItem).toHaveBeenCalledWith(`${__internals.KEY_PREFIX}a`);
  });

  it('swallows non-quota storage errors silently', () => {
    const s = new IdempotencyStore(storage);
    storage.setItem = vi.fn(() => { throw new Error('disk on fire'); });
    expect(() => s.remember('k', 'v')).not.toThrow();
  });

  it('rejects non-Storage constructor args', () => {
    expect(() => new IdempotencyStore(null)).toThrow(TypeError);
    expect(() => new IdempotencyStore({}, -1)).toThrow(TypeError);
    expect(() => new IdempotencyStore(makeStorage(), 0)).toThrow(RangeError);
  });
});

describe('withIdempotency', () => {
  let storage;
  beforeEach(() => { storage = makeStorage(); });

  it('runs fn once and caches the result', async () => {
    const store = new IdempotencyStore(storage);
    const fn = vi.fn(async () => ({ caseId: 'ZR-42' }));
    const r1 = await withIdempotency('k', fn, store);
    const r2 = await withIdempotency('k', fn, store);
    expect(r1).toEqual({ caseId: 'ZR-42' });
    expect(r2).toEqual({ caseId: 'ZR-42' });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not cache rejections', async () => {
    const store = new IdempotencyStore(storage);
    let n = 0;
    const fn = vi.fn(async () => {
      n++;
      if (n === 1) throw new Error('boom');
      return 'ok';
    });
    await expect(withIdempotency('k', fn, store)).rejects.toThrow('boom');
    await expect(withIdempotency('k', fn, store)).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('validates inputs', async () => {
    await expect(withIdempotency('', async () => 1)).rejects.toThrow(TypeError);
    await expect(withIdempotency('k', null)).rejects.toThrow(TypeError);
  });
});
