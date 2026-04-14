/**
 * @file reports.test.js — POST /api/reports behavior matrix.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index.js';
import {
  applyMigrations,
  makeCiphertextBody,
  makeIdempotencyKey,
  makeReportRequest,
} from './helpers.js';

beforeAll(async () => {
  await applyMigrations();
});

beforeEach(async () => {
  // applyMigrations is idempotent — ensures the schema exists even when
  // the pool runs this file before any beforeAll hook has fired.
  await applyMigrations();
  await env.DB.exec('DELETE FROM reports');
});

describe('POST /api/reports', () => {
  it('happy path: returns 201 { caseId, status: "received" }', async () => {
    const req = makeReportRequest({ idempotencyKey: makeIdempotencyKey() });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe('received');
    expect(body.caseId).toMatch(/^ZR-[0-9A-HJKMNP-TV-Z]{10}$/);
    // Security headers should be present.
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('duplicate idempotency key returns the same caseId', async () => {
    const key = makeIdempotencyKey();
    const ctx1 = createExecutionContext();
    const body = makeCiphertextBody();
    const r1 = await worker.fetch(makeReportRequest({ idempotencyKey: key, body }), env, ctx1);
    await waitOnExecutionContext(ctx1);
    const j1 = await r1.json();

    const ctx2 = createExecutionContext();
    const r2 = await worker.fetch(
      makeReportRequest({ idempotencyKey: key, body: makeCiphertextBody() }),
      env,
      ctx2
    );
    await waitOnExecutionContext(ctx2);
    const j2 = await r2.json();

    expect(r2.status).toBe(200);
    expect(j2.status).toBe('duplicate');
    expect(j2.caseId).toBe(j1.caseId);
  });

  it('malformed body returns 400 invalid_json', async () => {
    const req = makeReportRequest({
      idempotencyKey: makeIdempotencyKey(),
      body: '{not json',
    });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_json');
  });

  it('schema violation (extra key) returns 400 invalid_body', async () => {
    const bad = { ...makeCiphertextBody(), extra: 'nope' };
    const req = makeReportRequest({ idempotencyKey: makeIdempotencyKey(), body: bad });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('invalid_body');
  });

  it('oversize body returns 413 payload_too_large', async () => {
    // Body ciphertext is 340_001 chars -> exceeds schema ct cap AND/OR body cap.
    const bigCt = 'A'.repeat(340_001);
    const body = JSON.stringify({ ...makeCiphertextBody(), ct: bigCt });
    const req = new Request('https://test.bigmama.local/api/reports', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': makeIdempotencyKey(),
        // Declare honest content-length so the fast path rejects.
        'content-length': String(new TextEncoder().encode(body).length),
      },
      body,
    });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(413);
    expect((await res.json()).error).toBe('payload_too_large');
  });

  it('wrong content-type returns 415 unsupported_media_type', async () => {
    const req = makeReportRequest({
      idempotencyKey: makeIdempotencyKey(),
      contentType: 'text/plain',
    });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(415);
    expect((await res.json()).error).toBe('unsupported_media_type');
  });

  it('missing idempotency-key returns 400', async () => {
    const req = makeReportRequest(); // no idempotencyKey
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('idempotency_key_invalid');
  });

  it('malformed idempotency-key returns 400', async () => {
    const req = makeReportRequest({ idempotencyKey: 'short' });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(400);
  });

  it('never echoes origin for unknown origin', async () => {
    const req = new Request('https://test.bigmama.local/api/reports', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': makeIdempotencyKey(),
        origin: 'https://evil.example',
      },
      body: JSON.stringify(makeCiphertextBody()),
    });
    const ctx = createExecutionContext();
    const res = await worker.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });
});

describe('GET /api/health', () => {
  it('returns 200 with version', async () => {
    const res = await worker.fetch(
      new Request('https://test.bigmama.local/api/health'),
      env,
      createExecutionContext()
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(typeof body.version).toBe('string');
  });
});

describe('unknown route', () => {
  it('returns 404', async () => {
    const res = await worker.fetch(
      new Request('https://test.bigmama.local/nope'),
      env,
      createExecutionContext()
    );
    expect(res.status).toBe(404);
  });
});
