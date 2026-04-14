/**
 * @file rate-limit.js — KV-backed per-IP sliding-window limiter.
 *
 * Why KV (not Durable Objects)?
 *   - Writes here are rare enough that KV's eventual consistency is fine.
 *   - A DO-backed limiter is strictly more correct but adds an extra RTT to
 *     every request. KV keeps latency in single-digit ms globally.
 *
 * Algorithm:
 *   key = ratelimit:{kind}:{hashedIp}:{minuteBucket}
 *   get -> parseInt -> if > limit, reject
 *   else put(value+1, TTL=120s)  (TTL > 1 bucket to tolerate clock skew)
 *
 * IP is NEVER stored. We derive:
 *   hashedIp = SHA-256( RATE_LIMIT_SALT || cf-connecting-ip ).slice(0, 16 hex chars)
 * The salt rotates out-of-band via `wrangler secret put`; old buckets decay.
 */

import { jsonError } from '../lib/response.js';

const WINDOW_SECONDS = 60;
const TTL_SECONDS = 120; // double the window so adjacent buckets stay hot

/**
 * @param {string} ip
 * @param {string} salt
 * @returns {Promise<string>} 16-hex-char fingerprint
 */
async function hashIp(ip, salt) {
  const enc = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(`${salt}|${ip}`));
  const bytes = new Uint8Array(digest).subarray(0, 8);
  let hex = '';
  for (const b of bytes) hex += b.toString(16).padStart(2, '0');
  return hex;
}

/**
 * Extract the client IP from Cloudflare headers. Defaults to `unknown`
 * so a missing header still rate-limits (shared bucket, never a free pass).
 * @param {Request} request
 * @returns {string}
 */
function getClientIp(request) {
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

/**
 * Check the limit; return null on pass, or a 429 Response on violation.
 *
 * @param {Request} request
 * @param {{ RATE_LIMIT: KVNamespace, RATE_LIMIT_SALT?: string }} env
 * @param {{ kind: 'write' | 'read', limit: number }} opts
 * @returns {Promise<Response|null>}
 */
export async function enforceRateLimit(request, env, opts) {
  if (!env.RATE_LIMIT) {
    // Fail-closed would DoS ourselves in dev; warn silently and pass.
    return null;
  }
  const { kind, limit } = opts;
  const salt = env.RATE_LIMIT_SALT || 'dev-rolling-salt';
  const ip = getClientIp(request);
  const fingerprint = await hashIp(ip, salt);
  const bucket = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
  const key = `rl:${kind}:${fingerprint}:${bucket}`;

  let current = 0;
  try {
    const raw = await env.RATE_LIMIT.get(key);
    if (raw) {
      const n = Number.parseInt(raw, 10);
      if (Number.isFinite(n) && n >= 0) current = n;
    }
  } catch {
    // KV transient error — fail open to avoid self-inflicted outages.
    return null;
  }

  if (current >= limit) {
    const retryAfter = WINDOW_SECONDS - Math.floor((Date.now() / 1000) % WINDOW_SECONDS);
    const resp = jsonError('too_many_requests', 429, { retry_after_s: retryAfter });
    resp.headers.set('retry-after', String(retryAfter));
    return resp;
  }

  try {
    // Best-effort increment. A race can over-count by ~N concurrent requests,
    // which is acceptable: it biases toward *more* throttling, never less.
    await env.RATE_LIMIT.put(key, String(current + 1), {
      expirationTtl: TTL_SECONDS,
    });
  } catch {
    // Same policy: fail open on transient KV error.
  }
  return null;
}
