/**
 * @file wipe.js — Real emergency wipe for BIGMAMA$.
 *
 * Civic-reporting apps can be operated under duress. This module destroys
 * every browser-side artifact we can reach, best-effort, and never throws.
 * The return value tells the caller exactly what survived.
 */

/** @type {Set<AbortController>} */
const abortables = new Set();

/**
 * Register an AbortController so that {@link emergencyWipe} will abort it.
 * Returns a deregister function — call it when the controller's work is done
 * to avoid leaking references.
 *
 * @param {AbortController} controller
 * @returns {() => void} deregister
 */
export function registerAbortable(controller) {
  if (!controller || typeof controller.abort !== 'function') {
    throw new TypeError('registerAbortable requires an AbortController');
  }
  abortables.add(controller);
  return () => {
    abortables.delete(controller);
  };
}

/**
 * Internal: run a best-effort async step. Never throws.
 * @template T
 * @param {string} label
 * @param {() => Promise<T> | T} fn
 * @param {string[]} cleared
 * @param {string[]} failed
 */
async function step(label, fn, cleared, failed) {
  try {
    await fn();
    cleared.push(label);
  } catch {
    failed.push(label);
  }
}

/**
 * Emergency-wipe all browser-side persistence we can access.
 *
 * Clears:
 *   - localStorage, sessionStorage
 *   - every IndexedDB database (when `indexedDB.databases()` is supported)
 *   - every Cache API cache
 *   - every active service worker registration
 *   - every registered AbortController (see {@link registerAbortable})
 *
 * Best-effort: a failure in one subsystem does not stop the others, and the
 * function never rejects. Inspect the returned `failed` array to see what
 * could not be cleared.
 *
 * @returns {Promise<{cleared: string[], failed: string[]}>}
 */
export async function emergencyWipe() {
  /** @type {string[]} */
  const cleared = [];
  /** @type {string[]} */
  const failed = [];

  // 1. localStorage
  await step('localStorage', () => {
    if (typeof globalThis.localStorage !== 'undefined' && globalThis.localStorage) {
      globalThis.localStorage.clear();
    }
  }, cleared, failed);

  // 2. sessionStorage
  await step('sessionStorage', () => {
    if (typeof globalThis.sessionStorage !== 'undefined' && globalThis.sessionStorage) {
      globalThis.sessionStorage.clear();
    }
  }, cleared, failed);

  // 3. IndexedDB
  await step('indexedDB', async () => {
    const idb = globalThis.indexedDB;
    if (!idb) return;
    if (typeof idb.databases !== 'function') {
      // Firefox (pre-126) lacks databases(); we can't enumerate. Caller
      // should delete known DBs by name in their own wiring.
      throw new Error('indexedDB.databases() unsupported');
    }
    const dbs = await idb.databases();
    await Promise.all(
      (dbs || []).map((db) => {
        if (!db || !db.name) return Promise.resolve();
        return new Promise((resolve, reject) => {
          const req = idb.deleteDatabase(db.name);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error || new Error('deleteDatabase failed'));
          req.onblocked = () => resolve(); // best-effort
        });
      })
    );
  }, cleared, failed);

  // 4. Cache API
  await step('caches', async () => {
    const caches = globalThis.caches;
    if (!caches || typeof caches.keys !== 'function') return;
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }, cleared, failed);

  // 5. Service workers
  await step('serviceWorkers', async () => {
    const nav = globalThis.navigator;
    if (!nav || !nav.serviceWorker || typeof nav.serviceWorker.getRegistrations !== 'function') {
      return;
    }
    const regs = await nav.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));
  }, cleared, failed);

  // 6. AbortControllers
  await step('abortables', () => {
    for (const c of abortables) {
      try {
        c.abort();
      } catch {
        // swallow individual abort failures
      }
    }
    abortables.clear();
  }, cleared, failed);

  return { cleared, failed };
}
