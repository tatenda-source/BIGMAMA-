/**
 * Cross-package contract test: verifies that ciphertext produced by the
 * frontend's prepareReport() is accepted by the server's validateReportBody().
 *
 * This is the exact schema drift that killed deploys everywhere else. Running
 * the real client encryption against the real server validator here catches
 * it before ever leaving the unit suite.
 */
import { describe, it, expect } from 'vitest';
import { prepareReport } from '../../src/lib/prepare-report.js';
import { validateReportBody, isValidIdempotencyKey } from '../../server/src/lib/validate.js';
import { generateIdempotencyKey } from '../../src/lib/idempotency.js';

describe('contract: client ciphertext ↔ server validator', () => {
  it('prepareReport output is accepted by the server schema', async () => {
    const prepared = await prepareReport({
      title: 'Suspected illegal land clearing',
      description: 'Plot 22 in Borrowdale East. Heavy machinery observed after hours.',
    });
    expect(prepared.ok).toBe(true);

    const result = validateReportBody(prepared.ciphertext);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.body.v).toBe(1);
    }
  });

  it('rejects the exact output shape as a plain object (no extra keys)', async () => {
    const prepared = await prepareReport({
      title: 'Valid title here',
      description: 'Valid description, long enough to pass.',
    });
    if (!prepared.ok) throw new Error('prepare failed');

    const withExtra = { ...prepared.ciphertext, extra: 'no' };
    expect(validateReportBody(withExtra).ok).toBe(false);
  });

  it('idempotency keys generated client-side match the server regex', () => {
    for (let i = 0; i < 20; i++) {
      const key = generateIdempotencyKey();
      expect(isValidIdempotencyKey(key)).toBe(true);
    }
  });

  it('oversized description still produces a ct within server CT_MAX', async () => {
    const prepared = await prepareReport({
      title: 'long payload',
      description: 'x'.repeat(4800), // close to client DESCRIPTION_MAX
    });
    if (!prepared.ok) throw new Error('prepare failed');

    const result = validateReportBody(prepared.ciphertext);
    expect(result.ok).toBe(true);
  });
});
