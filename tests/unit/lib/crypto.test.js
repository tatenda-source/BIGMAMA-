import { describe, it, expect } from 'vitest';
import {
  encryptAesGcm,
  decryptAesGcm,
  randomId,
  randomCaseId,
} from '../../../src/lib/crypto.js';

describe('crypto.encrypt/decrypt', () => {
  it('round-trips UTF-8 plaintext', async () => {
    const plaintext = 'Mambo! Ndinoda kumhan\u2019aya vasiri kuzikanwa \u{1F54A}';
    const payload = await encryptAesGcm(plaintext, 'correct-horse-battery');
    expect(payload).toMatchObject({
      v: 1,
      iv: expect.any(String),
      salt: expect.any(String),
      ct: expect.any(String),
    });
    const back = await decryptAesGcm(payload, 'correct-horse-battery');
    expect(back).toBe(plaintext);
  });

  it('produces distinct salt + iv for identical plaintext/password', async () => {
    const a = await encryptAesGcm('hello', 'pw');
    const b = await encryptAesGcm('hello', 'pw');
    expect(a.iv).not.toBe(b.iv);
    expect(a.salt).not.toBe(b.salt);
    expect(a.ct).not.toBe(b.ct);
  });

  it('fails to decrypt with a wrong password', async () => {
    const payload = await encryptAesGcm('secret', 'right-pw');
    await expect(decryptAesGcm(payload, 'wrong-pw')).rejects.toBeDefined();
  });

  it('fails to decrypt tampered ciphertext', async () => {
    const payload = await encryptAesGcm('secret', 'pw');
    const tampered = { ...payload, ct: payload.ct.slice(0, -2) + (payload.ct.slice(-2) === 'AA' ? 'BB' : 'AA') };
    await expect(decryptAesGcm(tampered, 'pw')).rejects.toBeDefined();
  });

  it('rejects unsupported payload versions', async () => {
    await expect(decryptAesGcm({ v: 99, iv: 'x', salt: 'x', ct: 'x' }, 'pw')).rejects.toThrow();
  });

  it('rejects non-string plaintext', async () => {
    await expect(encryptAesGcm(123, 'pw')).rejects.toThrow(TypeError);
  });

  it('rejects empty password', async () => {
    await expect(encryptAesGcm('x', '')).rejects.toThrow(TypeError);
  });
});

describe('crypto.randomId', () => {
  it('returns base64url (no +/=) of the requested entropy', () => {
    const id = randomId(16);
    expect(id).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(id.length).toBeGreaterThan(0);
  });

  it('is unique across 1000 calls', () => {
    const set = new Set();
    for (let i = 0; i < 1000; i++) set.add(randomId(16));
    expect(set.size).toBe(1000);
  });

  it('rejects invalid byte counts', () => {
    expect(() => randomId(0)).toThrow(RangeError);
    expect(() => randomId(-1)).toThrow(RangeError);
    expect(() => randomId(1.5)).toThrow(RangeError);
    expect(() => randomId(2000)).toThrow(RangeError);
  });
});

describe('crypto.randomCaseId', () => {
  it('matches the ZR-<10 base32> format', () => {
    for (let i = 0; i < 50; i++) {
      const id = randomCaseId();
      expect(id).toMatch(/^ZR-[A-Z2-7]{10}$/);
    }
  });

  it('is unique across 1000 calls', () => {
    const set = new Set();
    for (let i = 0; i < 1000; i++) set.add(randomCaseId());
    expect(set.size).toBe(1000);
  });
});
