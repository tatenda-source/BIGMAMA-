/**
 * @file case-id.test.js — HMAC-based caseId minting.
 */
import { describe, it, expect } from 'vitest';
import { mintCaseId, isValidCaseId } from '../src/lib/case-id.js';

const SECRET = 'test-secret-32-bytes-hex-0123456789abcdef';
const OTHER_SECRET = 'other-secret-32-bytes-hex-fedcba9876543210';

describe('mintCaseId', () => {
  it('same (key, secret, bucket) produces same caseId', async () => {
    const a = await mintCaseId('abcdefghijklmnop', SECRET, 12345);
    const b = await mintCaseId('abcdefghijklmnop', SECRET, 12345);
    expect(a).toBe(b);
  });

  it('different idempotency-key -> different caseId', async () => {
    const a = await mintCaseId('key-alpha-000000', SECRET, 12345);
    const b = await mintCaseId('key-beta-00000000', SECRET, 12345);
    expect(a).not.toBe(b);
  });

  it('different secret -> different caseId (unforgeable)', async () => {
    const a = await mintCaseId('abcdefghijklmnop', SECRET, 12345);
    const b = await mintCaseId('abcdefghijklmnop', OTHER_SECRET, 12345);
    expect(a).not.toBe(b);
  });

  it('different bucket -> different caseId (rotation)', async () => {
    const a = await mintCaseId('abcdefghijklmnop', SECRET, 1);
    const b = await mintCaseId('abcdefghijklmnop', SECRET, 2);
    expect(a).not.toBe(b);
  });

  it('format: ZR- + 10 Crockford base32 chars', async () => {
    const id = await mintCaseId('abcdefghijklmnop', SECRET, 12345);
    expect(id).toMatch(/^ZR-[0-9A-HJKMNP-TV-Z]{10}$/);
    expect(isValidCaseId(id)).toBe(true);
  });

  it('rejects invalid arguments', async () => {
    await expect(mintCaseId('', SECRET, 1)).rejects.toThrow();
    await expect(mintCaseId('ok-key-0000000000', 'short', 1)).rejects.toThrow();
    // @ts-expect-error bucket undefined
    await expect(mintCaseId('ok-key-0000000000', SECRET)).rejects.toThrow();
  });
});

describe('isValidCaseId', () => {
  it('accepts correct format', () => {
    expect(isValidCaseId('ZR-0123456789')).toBe(true);
    expect(isValidCaseId('ZR-ABCDEFGHJK')).toBe(true);
  });
  it('rejects wrong prefix / length / chars', () => {
    expect(isValidCaseId('AB-0123456789')).toBe(false);
    expect(isValidCaseId('ZR-012345678')).toBe(false);   // too short
    expect(isValidCaseId('ZR-01234567890')).toBe(false); // too long
    expect(isValidCaseId('ZR-ILOUILOUIL')).toBe(false);  // ambiguous chars I,L,O,U
    expect(isValidCaseId(42)).toBe(false);
    expect(isValidCaseId(null)).toBe(false);
  });
});
