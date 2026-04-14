/**
 * @file validate.test.js — Strict schema acceptance / adversarial rejection.
 */
import { describe, it, expect } from 'vitest';
import { validateReportBody, isValidIdempotencyKey } from '../src/lib/validate.js';
import { makeCiphertextBody, randomBase64Url } from './helpers.js';

describe('validateReportBody — acceptance', () => {
  it('accepts a minimal well-formed body', () => {
    const r = validateReportBody(makeCiphertextBody());
    expect(r.ok).toBe(true);
  });

  it('accepts ct up to the 340_000 char cap', () => {
    const body = { ...makeCiphertextBody(), ct: randomBase64Url(340_000) };
    const r = validateReportBody(body);
    expect(r.ok).toBe(true);
  });
});

describe('validateReportBody — rejection', () => {
  it('rejects null/array/primitive', () => {
    expect(validateReportBody(null).ok).toBe(false);
    expect(validateReportBody([]).ok).toBe(false);
    expect(validateReportBody('string').ok).toBe(false);
    expect(validateReportBody(42).ok).toBe(false);
  });

  it('rejects wrong version', () => {
    const body = { ...makeCiphertextBody(), v: 2 };
    expect(validateReportBody(body).ok).toBe(false);
  });

  it('rejects extra keys (strict schema)', () => {
    const body = { ...makeCiphertextBody(), sneaky: 'payload' };
    const r = validateReportBody(body);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe('body_key_count');
  });

  it('rejects bad iv length', () => {
    const body = { ...makeCiphertextBody(), iv: randomBase64Url(15) };
    expect(validateReportBody(body).ok).toBe(false);
  });

  it('rejects bad salt length', () => {
    const body = { ...makeCiphertextBody(), salt: randomBase64Url(21) };
    expect(validateReportBody(body).ok).toBe(false);
  });

  it('rejects non-base64url characters', () => {
    const body = { ...makeCiphertextBody(), ct: '!!!not valid!!!' };
    expect(validateReportBody(body).ok).toBe(false);
  });

  it('rejects oversize ct', () => {
    const body = { ...makeCiphertextBody(), ct: 'A'.repeat(340_001) };
    expect(validateReportBody(body).ok).toBe(false);
  });

  it('rejects empty ct', () => {
    const body = { ...makeCiphertextBody(), ct: '' };
    expect(validateReportBody(body).ok).toBe(false);
  });

  it('rejects bad prototype (prototype pollution)', () => {
    const poisoned = Object.create({ leaked: true });
    Object.assign(poisoned, makeCiphertextBody());
    const r = validateReportBody(poisoned);
    expect(r.ok).toBe(false);
  });

  it('rejects missing required keys', () => {
    const { iv, salt, ct } = makeCiphertextBody();
    expect(validateReportBody({ v: 1, iv, salt }).ok).toBe(false);
    expect(validateReportBody({ v: 1, iv, ct }).ok).toBe(false);
    expect(validateReportBody({ v: 1, salt, ct }).ok).toBe(false);
  });
});

describe('isValidIdempotencyKey', () => {
  it('accepts 16..64 chars from [A-Za-z0-9_-]', () => {
    expect(isValidIdempotencyKey('abcdefghijklmnop')).toBe(true);
    expect(isValidIdempotencyKey('A'.repeat(64))).toBe(true);
    expect(isValidIdempotencyKey('ABC_def-123_XYZ0')).toBe(true);
  });
  it('rejects too short, too long, bad chars, non-string', () => {
    expect(isValidIdempotencyKey('short')).toBe(false);
    expect(isValidIdempotencyKey('A'.repeat(65))).toBe(false);
    expect(isValidIdempotencyKey('has space 1234567')).toBe(false);
    expect(isValidIdempotencyKey('has/slash/1234567')).toBe(false);
    expect(isValidIdempotencyKey(12345)).toBe(false);
    expect(isValidIdempotencyKey(null)).toBe(false);
  });
});
