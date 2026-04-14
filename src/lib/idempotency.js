// SPDX-License-Identifier: TBD
/**
 * @file idempotency.js — Exactly-once submission helpers for BIGMAMA$.
 *
 * Whistleblower reports MUST be delivered exactly once. This module provides
 * the primitives:
 *
 *   - generateIdempotencyKey(): a 128-bit random, base64url-encoded token
 *     suitable for the `Idempotency-Key` HTTP header.
 *   - IdempotencyStore: a TTL-bounded localStorage-backed cache mapping
 *     idempotency-key → server result, so retries and reloads can short-
 *     circuit instead of re-POSTing.
 *   - withIdempotency(key, fn): convenience wrapper that runs `fn` exactly
 *     once per key (until TTL expiry) and caches its result.
 *
 * Notes:
 *   - Keys are opaque. We never log or derive anything from the payload.
 *   - Storage is best-effort: quota errors trigger oldest-first eviction,
 *     never a hard failure (the network layer stays authoritative).
 */

import { randomId as _randomIdFromCrypto } from './crypto.js';

const KEY_PREFIX = 'bigmama:idem:';
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Generate a 128-bit random idempotency key, base64url-encoded.
 * Delegates to crypto.js `randomId(16)` when available; otherwise falls back
 * to WebCrypto directly. Throws if neither is usable — we refuse to emit a
 * weak key.
 *
 * @returns {string}
 */
export function generateIdempotencyKey() {
  if (typeof _randomIdFromCrypto === 'function') {
    return _randomIdFromCrypto(16);
  }
  const c = globalThis.crypto;
  if (!c || typeof c.getRandomValues !== 'function') {
    throw new Error('CSPRNG unavailable: cannot generate idempotency key.');
  }
  const bytes = new Uint8Array(16);
  c.getRandomValues(bytes);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = typeof btoa === 'function'
    ? btoa(bin)
    : Buffer.from(bin, 'binary').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * TTL-bounded key/result store backed by any Web Storage-compatible object.
 *
 * Entries are stored under `bigmama:idem:<key>` as JSON:
 *   { result: any, ts: number }
 */
export class IdempotencyStore {
  /**
   * @param {Storage} [storage=localStorage] any Web Storage-compatible object
   * @param {number}  [ttlMs=7d] time-to-live per entry
   */
  constructor(storage = defaultStorage(), ttlMs = DEFAULT_TTL_MS) {
    if (!storage || typeof storage.getItem !== 'function') {
      throw new TypeError('IdempotencyStore requires a Storage-like object');
    }
    if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
      throw new RangeError('ttlMs must be a positive, finite number');
    }
    this.storage = storage;
    this.ttlMs = ttlMs;
    this._now = () => Date.now();
  }

  _k(key) {
    return KEY_PREFIX + String(key);
  }

  _readRaw(key) {
    try {
      const raw = this.storage.getItem(this._k(key));
      if (raw === null || raw === undefined) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.ts !== 'number') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Is a fresh (unexpired) entry present for this key?
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    const entry = this._readRaw(key);
    if (!entry) return false;
    if (this._now() - entry.ts > this.ttlMs) {
      try { this.storage.removeItem(this._k(key)); } catch { /* noop */ }
      return false;
    }
    return true;
  }

  /**
   * Return the cached result for `key` if still fresh, else null.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    const entry = this._readRaw(key);
    if (!entry) return null;
    if (this._now() - entry.ts > this.ttlMs) {
      try { this.storage.removeItem(this._k(key)); } catch { /* noop */ }
      return null;
    }
    return entry.result;
  }

  /**
   * Store a result under `key`. On quota errors, evicts oldest entries and
   * retries once. If still failing, silently drops — callers rely on the
   * network layer for correctness, this cache is an optimisation.
   *
   * @param {string} key
   * @param {any} result
   */
  remember(key, result) {
    const payload = JSON.stringify({ result, ts: this._now() });
    try {
      this.storage.setItem(this._k(key), payload);
    } catch (err) {
      if (isQuotaError(err)) {
        this._evictOldest(1);
        try {
          this.storage.setItem(this._k(key), payload);
        } catch {
          // Give up silently — this is an optimisation cache.
        }
      }
      // Other errors: swallow; do not crash a submission over cache writes.
    }
  }

  /**
   * Remove all entries whose `ts + ttl` is in the past.
   */
  gc() {
    const now = this._now();
    const keys = this._listStoredKeys();
    for (const storageKey of keys) {
      try {
        const raw = this.storage.getItem(storageKey);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed.ts !== 'number' || now - parsed.ts > this.ttlMs) {
          this.storage.removeItem(storageKey);
        }
      } catch {
        // Corrupt entry → drop it.
        try { this.storage.removeItem(storageKey); } catch { /* noop */ }
      }
    }
  }

  _listStoredKeys() {
    const out = [];
    const len = typeof this.storage.length === 'number' ? this.storage.length : 0;
    for (let i = 0; i < len; i++) {
      const k = this.storage.key ? this.storage.key(i) : null;
      if (typeof k === 'string' && k.startsWith(KEY_PREFIX)) out.push(k);
    }
    return out;
  }

  _evictOldest(n = 1) {
    const entries = [];
    for (const k of this._listStoredKeys()) {
      try {
        const raw = this.storage.getItem(k);
        const parsed = raw ? JSON.parse(raw) : null;
        const ts = parsed && typeof parsed.ts === 'number' ? parsed.ts : 0;
        entries.push({ k, ts });
      } catch {
        entries.push({ k, ts: 0 }); // corrupt → evict first
      }
    }
    entries.sort((a, b) => a.ts - b.ts);
    for (let i = 0; i < Math.min(n, entries.length); i++) {
      try { this.storage.removeItem(entries[i].k); } catch { /* noop */ }
    }
  }
}

/**
 * Run `fn` exactly once per `key`. If a cached result exists for the key,
 * returns it without calling `fn`. Otherwise runs `fn`, caches its resolved
 * value, and returns it. Rejections are NOT cached (callers retry).
 *
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} fn
 * @param {IdempotencyStore} [store]
 * @returns {Promise<T>}
 */
export async function withIdempotency(key, fn, store = new IdempotencyStore()) {
  if (typeof key !== 'string' || key.length === 0) {
    throw new TypeError('idempotency key must be a non-empty string');
  }
  if (typeof fn !== 'function') throw new TypeError('fn must be a function');
  if (store.has(key)) {
    return store.get(key);
  }
  const result = await fn();
  store.remember(key, result);
  return result;
}

function defaultStorage() {
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage;
  }
  // Minimal in-memory fallback so the module is importable in non-DOM envs
  // (SSR, node tests without jsdom). Tests should always pass an explicit
  // storage mock.
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

export const __internals = { KEY_PREFIX, DEFAULT_TTL_MS, isQuotaError };
