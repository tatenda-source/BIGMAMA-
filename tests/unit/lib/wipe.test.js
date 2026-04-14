import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { emergencyWipe, registerAbortable } from '../../../src/lib/wipe.js';

function mockStorage() {
  const store = new Map();
  return {
    clear: vi.fn(() => store.clear()),
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    _store: store,
  };
}

describe('wipe.emergencyWipe — happy path', () => {
  let originals;

  beforeEach(() => {
    originals = {
      localStorage: globalThis.localStorage,
      sessionStorage: globalThis.sessionStorage,
      indexedDB: globalThis.indexedDB,
      caches: globalThis.caches,
      navigator: globalThis.navigator,
    };

    const ls = mockStorage();
    const ss = mockStorage();
    ls.setItem('a', '1');
    ss.setItem('b', '2');

    Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true });
    Object.defineProperty(globalThis, 'sessionStorage', { value: ss, configurable: true });

    const deleteDatabase = vi.fn((_name) => {
      const req = {};
      setTimeout(() => req.onsuccess && req.onsuccess(), 0);
      return req;
    });
    const idb = {
      databases: vi.fn(async () => [{ name: 'bigmama' }, { name: 'reports' }]),
      deleteDatabase,
    };
    Object.defineProperty(globalThis, 'indexedDB', { value: idb, configurable: true });

    const caches = {
      keys: vi.fn(async () => ['v1', 'v2']),
      delete: vi.fn(async () => true),
    };
    Object.defineProperty(globalThis, 'caches', { value: caches, configurable: true });

    const regs = [{ unregister: vi.fn(async () => true) }, { unregister: vi.fn(async () => true) }];
    const navigator = {
      serviceWorker: {
        getRegistrations: vi.fn(async () => regs),
      },
    };
    Object.defineProperty(globalThis, 'navigator', { value: navigator, configurable: true });
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(originals)) {
      if (v === undefined) delete globalThis[k];
      else Object.defineProperty(globalThis, k, { value: v, configurable: true });
    }
  });

  it('clears every subsystem and returns empty failed[]', async () => {
    const ctrl = new AbortController();
    const deregister = registerAbortable(ctrl);
    expect(typeof deregister).toBe('function');

    const result = await emergencyWipe();
    expect(result.failed).toEqual([]);
    expect(result.cleared).toEqual(
      expect.arrayContaining([
        'localStorage',
        'sessionStorage',
        'indexedDB',
        'caches',
        'serviceWorkers',
        'abortables',
      ])
    );

    expect(globalThis.localStorage.clear).toHaveBeenCalled();
    expect(globalThis.sessionStorage.clear).toHaveBeenCalled();
    expect(globalThis.indexedDB.deleteDatabase).toHaveBeenCalledWith('bigmama');
    expect(globalThis.indexedDB.deleteDatabase).toHaveBeenCalledWith('reports');
    expect(globalThis.caches.delete).toHaveBeenCalledWith('v1');
    expect(globalThis.caches.delete).toHaveBeenCalledWith('v2');
    expect(ctrl.signal.aborted).toBe(true);
  });
});

describe('wipe.emergencyWipe — graceful degradation', () => {
  let originals;

  beforeEach(() => {
    originals = {
      localStorage: globalThis.localStorage,
      sessionStorage: globalThis.sessionStorage,
      indexedDB: globalThis.indexedDB,
      caches: globalThis.caches,
      navigator: globalThis.navigator,
    };

    // localStorage throws on clear
    const ls = { clear: vi.fn(() => { throw new Error('boom'); }) };
    const ss = mockStorage();
    Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true });
    Object.defineProperty(globalThis, 'sessionStorage', { value: ss, configurable: true });

    // indexedDB without databases() support
    Object.defineProperty(globalThis, 'indexedDB', {
      value: { deleteDatabase: vi.fn() },
      configurable: true,
    });

    // caches missing
    Object.defineProperty(globalThis, 'caches', { value: undefined, configurable: true });

    // navigator without serviceWorker
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(originals)) {
      if (v === undefined) delete globalThis[k];
      else Object.defineProperty(globalThis, k, { value: v, configurable: true });
    }
  });

  it('never throws, reports failures, keeps clearing other subsystems', async () => {
    const result = await emergencyWipe();
    expect(result.failed).toContain('localStorage');
    expect(result.failed).toContain('indexedDB');
    expect(result.cleared).toContain('sessionStorage');
    expect(result.cleared).toContain('caches'); // no-op when missing = success
    expect(result.cleared).toContain('serviceWorkers');
    expect(result.cleared).toContain('abortables');
  });
});

describe('wipe.registerAbortable', () => {
  it('rejects non-AbortController input', () => {
    expect(() => registerAbortable(null)).toThrow(TypeError);
    expect(() => registerAbortable({})).toThrow(TypeError);
  });

  it('deregister removes the controller so emergencyWipe does not abort it', async () => {
    const ctrl = new AbortController();
    const deregister = registerAbortable(ctrl);
    deregister();
    await emergencyWipe();
    expect(ctrl.signal.aborted).toBe(false);
  });
});
