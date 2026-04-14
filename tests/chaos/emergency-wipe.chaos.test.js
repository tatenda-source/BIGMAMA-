// tests/chaos/emergency-wipe.chaos.test.js
//
// Scenario: whistleblower is about to be searched. They hit panic. Every
// local artifact must be annihilated — localStorage, sessionStorage,
// IndexedDB, the Cache API — and any in-flight fetch must be aborted so it
// cannot betray them mid-transmission.
//
// Invariants proven here:
//   1. emergencyWipe clears localStorage and sessionStorage completely.
//   2. It drops every IndexedDB database returned by databases().
//   3. It deletes every Cache Storage entry.
//   4. Any in-flight fetch registered via the abort registry is aborted.
//   5. The wipe is synchronous-ish: it returns a promise that resolves only
//      after all surfaces are confirmed clear.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// TODO: wire real import.
import { emergencyWipe, registerAbortable } from '../../src/lib/crypto.js';

function makeStorage(seed = {}) {
  let store = { ...seed };
  return {
    get raw() {
      return { ...store };
    },
    getItem: vi.fn((k) => (k in store ? store[k] : null)),
    setItem: vi.fn((k, v) => {
      store[k] = String(v);
    }),
    removeItem: vi.fn((k) => {
      delete store[k];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((i) => Object.keys(store)[i] ?? null),
  };
}

describe('chaos: emergency-wipe', () => {
  let localStore;
  let sessionStore;
  let idbDeletions;
  let cacheDeletions;
  let databasesMock;
  let cachesMock;

  beforeEach(() => {
    localStore = makeStorage({
      'report-draft': 'sensitive',
      'queue:v1': '[...]',
    });
    sessionStore = makeStorage({ token: 'abc' });
    vi.stubGlobal('localStorage', localStore);
    vi.stubGlobal('sessionStorage', sessionStore);

    idbDeletions = [];
    databasesMock = vi.fn(async () => [{ name: 'reports' }, { name: 'media-cache' }]);
    vi.stubGlobal('indexedDB', {
      databases: databasesMock,
      deleteDatabase: vi.fn((name) => {
        idbDeletions.push(name);
        const req = {};
        queueMicrotask(() => req.onsuccess && req.onsuccess({}));
        return req;
      }),
    });

    cacheDeletions = [];
    cachesMock = {
      keys: vi.fn(async () => ['static-v1', 'media-v1']),
      delete: vi.fn(async (k) => {
        cacheDeletions.push(k);
        return true;
      }),
    };
    vi.stubGlobal('caches', cachesMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('wipes localStorage and sessionStorage', async () => {
    await emergencyWipe();
    expect(Object.keys(localStore.raw)).toHaveLength(0);
    expect(Object.keys(sessionStore.raw)).toHaveLength(0);
  });

  it('deletes every IndexedDB database reported by databases()', async () => {
    await emergencyWipe();
    expect(idbDeletions.sort()).toEqual(['media-cache', 'reports']);
  });

  it('deletes every Cache Storage entry', async () => {
    await emergencyWipe();
    expect(cacheDeletions.sort()).toEqual(['media-v1', 'static-v1']);
  });

  it('aborts every registered in-flight fetch', async () => {
    const ac1 = new AbortController();
    const ac2 = new AbortController();
    registerAbortable(ac1);
    registerAbortable(ac2);

    await emergencyWipe();

    expect(ac1.signal.aborted).toBe(true);
    expect(ac2.signal.aborted).toBe(true);
  });

  it('is idempotent: calling twice does not throw even with nothing left', async () => {
    await emergencyWipe();
    await expect(emergencyWipe()).resolves.not.toThrow();
  });

  it('does not resolve until every surface has been cleared', async () => {
    // Introduce a delay on cache delete to prove we wait for it.
    let releaseCache;
    cachesMock.delete = vi.fn(
      () =>
        new Promise((r) => {
          releaseCache = () => r(true);
        }),
    );

    let done = false;
    const p = emergencyWipe().then(() => {
      done = true;
    });

    // Give microtasks a chance; must still be pending because cache is stuck.
    await Promise.resolve();
    await Promise.resolve();
    expect(done).toBe(false);

    releaseCache();
    await p;
    expect(done).toBe(true);
  });
});
