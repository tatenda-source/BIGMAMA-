/**
 * @file rate-limit.test.js — sliding-window per-IP throttling.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index.js';
import {
  applyMigrations,
  makeCiphertextBody,
  makeIdempotencyKey,
} from './helpers.js';

beforeAll(async () => {
  await applyMigrations();
});

beforeEach(async () => {
  await applyMigrations();
  await env.DB.exec('DELETE FROM reports');
  // Purge KV entries so each test starts fresh.
  // @ts-expect-error: list is available on bindings in miniflare.
  const keys = await env.RATE_LIMIT.list();
  await Promise.all(keys.keys.map((k) => env.RATE_LIMIT.delete(k.name)));
  // @ts-expect-error: same for IDEMPOTENCY.
  const ikeys = await env.IDEMPOTENCY.list();
  await Promise.all(ikeys.keys.map((k) => env.IDEMPOTENCY.delete(k.name)));
});

/**
 * Build a fresh POST request with a unique idempotency key so we ONLY trip
 * the rate limiter (not the duplicate ledger).
 * @param {string} ip
 */
function freshRequest(ip) {
  return new Request('https://test.bigmama.local/api/reports', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': makeIdempotencyKey(),
      'cf-connecting-ip': ip,
    },
    body: JSON.stringify(makeCiphertextBody()),
  });
}

describe('rate limiting', () => {
  it('returns 429 after exceeding 10 writes/min from one IP', async () => {
    const ip = '203.0.113.42';
    const results = [];
    for (let i = 0; i < 11; i++) {
      const ctx = createExecutionContext();
      const res = await worker.fetch(freshRequest(ip), env, ctx);
      await waitOnExecutionContext(ctx);
      results.push(res.status);
    }
    // First 10 should succeed (201), 11th should be 429.
    expect(results.slice(0, 10).every((s) => s === 201)).toBe(true);
    expect(results[10]).toBe(429);
  });

  it('429 response includes retry_after_s and retry-after header', async () => {
    const ip = '203.0.113.43';
    // Exhaust the window.
    for (let i = 0; i < 10; i++) {
      const ctx = createExecutionContext();
      const res = await worker.fetch(freshRequest(ip), env, ctx);
      await waitOnExecutionContext(ctx);
      expect(res.status).toBe(201);
    }
    const ctx = createExecutionContext();
    const res = await worker.fetch(freshRequest(ip), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).not.toBeNull();
    const body = await res.json();
    expect(body.error).toBe('too_many_requests');
    expect(typeof body.retry_after_s).toBe('number');
  });

  it('separate IPs do not share a bucket', async () => {
    // IP A burns its budget.
    for (let i = 0; i < 10; i++) {
      const ctx = createExecutionContext();
      await worker.fetch(freshRequest('198.51.100.10'), env, ctx);
      await waitOnExecutionContext(ctx);
    }
    const ctx = createExecutionContext();
    const res = await worker.fetch(freshRequest('198.51.100.11'), env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
  });
});
