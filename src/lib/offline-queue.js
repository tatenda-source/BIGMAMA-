// SPDX-License-Identifier: TBD
/**
 * @file offline-queue.js — Durable FIFO queue for pending civic reports.
 *
 * When the browser is offline (or fetch fails permanently from a flaky
 * connection), submit-report.js enqueues the pending submission here. The
 * queue survives reloads because it lives in localStorage. On `window.online`
 * (or explicit flush) we drain it in FIFO order, stopping on the first
 * non-retryable error so nothing is silently dropped.
 *
 * De-duplication: the same idempotency key is never enqueued twice, so a
 * double-click or reload-mid-submit can't create parallel deliveries.
 */

const DEFAULT_KEY = 'bigmama:queue';

export class OfflineQueue {
  /**
   * @param {Storage} [storage=localStorage]
   * @param {string}  [key='bigmama:queue']
   */
  constructor(storage = defaultStorage(), key = DEFAULT_KEY) {
    if (!storage || typeof storage.getItem !== 'function') {
      throw new TypeError('OfflineQueue requires a Storage-like object');
    }
    if (typeof key !== 'string' || !key) {
      throw new TypeError('OfflineQueue key must be a non-empty string');
    }
    this.storage = storage;
    this.key = key;
    /** @type {((item:any)=>void)|null} */
    this.onEviction = null;
  }

  _read() {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  _write(list) {
    const payload = JSON.stringify(list);
    try {
      this.storage.setItem(this.key, payload);
    } catch (err) {
      if (isQuotaError(err)) {
        // Evict oldest until it fits, announcing each eviction.
        const working = list.slice();
        while (working.length > 1) {
          const evicted = working.shift();
          if (typeof this.onEviction === 'function') {
            try { this.onEviction(evicted); } catch { /* noop */ }
          }
          try {
            this.storage.setItem(this.key, JSON.stringify(working));
            return;
          } catch (innerErr) {
            if (!isQuotaError(innerErr)) throw innerErr;
          }
        }
        // Even a single item won't fit → clear and re-throw for the caller.
        try { this.storage.removeItem(this.key); } catch { /* noop */ }
        throw err;
      }
      throw err;
    }
  }

  /**
   * Append an item if its idempotencyKey is not already queued.
   * Returns true when a new entry was stored, false on dedupe.
   *
   * @param {{id:string, payload:any, idempotencyKey:string, createdAt:number, attempts:number}} item
   * @returns {boolean}
   */
  enqueue(item) {
    validateItem(item);
    const list = this._read();
    if (list.some((q) => q.idempotencyKey === item.idempotencyKey)) {
      return false;
    }
    list.push(item);
    this._write(list);
    return true;
  }

  /**
   * Return the head item without removing it, or null when empty.
   */
  peek() {
    const list = this._read();
    return list.length ? list[0] : null;
  }

  /**
   * Remove the entry with the given id. Returns true when something was
   * removed, false otherwise.
   * @param {string} id
   * @returns {boolean}
   */
  dequeue(id) {
    const list = this._read();
    const idx = list.findIndex((q) => q.id === id);
    if (idx < 0) return false;
    list.splice(idx, 1);
    this._write(list);
    return true;
  }

  /**
   * Return a shallow copy of the queue (safe to mutate).
   */
  list() {
    return this._read();
  }

  /**
   * Drain the queue by calling `sendFn(item)` on each head entry in turn.
   *
   * Semantics:
   *   - sendFn resolves → remove entry, continue.
   *   - sendFn rejects with `err.retryable === false` → stop, leave entry.
   *   - sendFn rejects otherwise → stop, leave entry (we'll try again on
   *     the next flush/online event). Attempts counter is incremented.
   *
   * Returns { delivered, remaining, lastError }.
   *
   * @param {(item:any, signal?:AbortSignal) => Promise<any>} sendFn
   * @param {{ signal?: AbortSignal }} [opts]
   */
  async flush(sendFn, opts = {}) {
    if (typeof sendFn !== 'function') throw new TypeError('sendFn must be a function');
    const { signal } = opts;
    let delivered = 0;
    let lastError = null;

    // Snapshot head at each step so new enqueues during flush are handled
    // in the next iteration rather than racing.
    // We loop up to current length to guarantee termination.
    const startLen = this._read().length;
    for (let i = 0; i < startLen; i++) {
      if (signal && signal.aborted) break;
      const head = this.peek();
      if (!head) break;
      try {
        await sendFn(head, signal);
        this.dequeue(head.id);
        delivered++;
      } catch (err) {
        // Bump attempts on the stored entry so callers can inspect it.
        const list = this._read();
        if (list.length && list[0].id === head.id) {
          list[0] = { ...list[0], attempts: (list[0].attempts || 0) + 1 };
          try { this._write(list); } catch { /* noop: best-effort */ }
        }
        lastError = err;
        break; // stop on first failure to preserve FIFO correctness
      }
    }
    return { delivered, remaining: this._read().length, lastError };
  }

  /**
   * Attach a `window.online` listener that calls `flush(sendFn)`. Returns a
   * detach function. No-op (returns a detach stub) when there is no window.
   *
   * @param {(item:any)=>Promise<any>} sendFn
   * @returns {() => void}
   */
  attachOnlineFlush(sendFn) {
    if (typeof sendFn !== 'function') throw new TypeError('sendFn must be a function');
    const w = typeof globalThis !== 'undefined' ? globalThis.window : null;
    if (!w || typeof w.addEventListener !== 'function') {
      return () => {};
    }
    const handler = () => {
      // Fire-and-forget; surface errors to console.warn without payload.
      this.flush(sendFn).catch((err) => {
        try { console.warn('[offline-queue] flush failed:', err && err.message); } catch { /* noop */ }
      });
    };
    w.addEventListener('online', handler);
    return () => {
      try { w.removeEventListener('online', handler); } catch { /* noop */ }
    };
  }
}

function validateItem(item) {
  if (!item || typeof item !== 'object') throw new TypeError('item must be an object');
  const required = ['id', 'payload', 'idempotencyKey', 'createdAt', 'attempts'];
  for (const k of required) {
    if (!(k in item)) throw new TypeError(`item missing field: ${k}`);
  }
  if (typeof item.idempotencyKey !== 'string' || !item.idempotencyKey) {
    throw new TypeError('item.idempotencyKey must be a non-empty string');
  }
  if (typeof item.id !== 'string' || !item.id) {
    throw new TypeError('item.id must be a non-empty string');
  }
}

function isQuotaError(err) {
  if (!err) return false;
  const name = err.name || '';
  const code = err.code;
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    code === 22 ||
    code === 1014
  );
}

function defaultStorage() {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  const mem = new Map();
  return {
    getItem: (k) => (mem.has(k) ? mem.get(k) : null),
    setItem: (k, v) => { mem.set(k, String(v)); },
    removeItem: (k) => { mem.delete(k); },
    key: (i) => Array.from(mem.keys())[i] ?? null,
    get length() { return mem.size; },
    clear: () => mem.clear(),
  };
}

export const __internals = { DEFAULT_KEY, isQuotaError };
