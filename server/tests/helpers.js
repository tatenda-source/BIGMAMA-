/**
 * @file helpers.js — Test utilities shared across spec files.
 *
 * Provides:
 *   - applyMigrations(): runs migrations/0001_init.sql against the test D1.
 *   - makeIdempotencyKey(): returns a schema-valid Idempotency-Key.
 *   - makeCiphertextBody(): shapes a valid encrypted-report payload.
 *   - randomBase64Url(n): random base64url string of exactly `n` chars.
 */
import { env } from 'cloudflare:test';

const INIT_SQL = `
CREATE TABLE IF NOT EXISTS reports (
  case_id        TEXT PRIMARY KEY,
  ciphertext_b64 TEXT NOT NULL,
  iv_b64         TEXT NOT NULL,
  salt_b64       TEXT NOT NULL,
  created_at     INTEGER NOT NULL,
  status         TEXT NOT NULL DEFAULT 'received',
  confirmed_at   INTEGER
);
CREATE INDEX IF NOT EXISTS idx_reports_created ON reports(created_at);
`;

let migrated = false;

/** Run schema once per suite. */
export async function applyMigrations() {
  if (migrated) return;
  // exec() splits on ';' — statements end with ; above.
  await env.DB.exec(INIT_SQL.replace(/\n/g, ' ').trim());
  migrated = true;
}

/**
 * Generate a random string from the base64url alphabet of exact length `n`.
 * @param {number} n
 */
export function randomBase64Url(n) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < n; i++) out += alphabet[bytes[i] & 63];
  return out;
}

/** @param {number} [n=32] */
export function makeIdempotencyKey(n = 32) {
  return randomBase64Url(n);
}

/**
 * Produce a valid { v, iv, salt, ct } payload. `ctLen` lets a test stress
 * oversize without blowing the 256KB body cap of the request itself.
 * @param {number} [ctLen=64]
 */
export function makeCiphertextBody(ctLen = 64) {
  return {
    v: 1,
    iv: randomBase64Url(16),
    salt: randomBase64Url(22),
    ct: randomBase64Url(ctLen),
  };
}

/**
 * Build a standard POST /api/reports Request.
 * @param {object} [opts]
 * @param {object|string} [opts.body]
 * @param {string} [opts.idempotencyKey]
 * @param {string} [opts.contentType]
 */
export function makeReportRequest(opts = {}) {
  const body =
    typeof opts.body === 'string'
      ? opts.body
      : JSON.stringify(opts.body ?? makeCiphertextBody());
  /** @type {Record<string,string>} */
  const headers = {
    'content-type': opts.contentType ?? 'application/json',
  };
  if (opts.idempotencyKey !== undefined) {
    headers['idempotency-key'] = opts.idempotencyKey;
  }
  return new Request('https://test.bigmama.local/api/reports', {
    method: 'POST',
    headers,
    body,
  });
}
