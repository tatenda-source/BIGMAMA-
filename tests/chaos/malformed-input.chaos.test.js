// tests/chaos/malformed-input.chaos.test.js
//
// Scenario: adversaries and broken keyboards. Every string that crosses our
// validation boundary is a potential weapon. Null bytes, RTL override chars,
// 10MB bodies, prototype pollution keys, SQL-ish strings, XSS vectors — the
// validator must reject them or sanitize them, and under no circumstances
// throw an uncaught exception that would crash the app.
//
// Invariants proven here:
//   1. validateReport returns { ok: boolean, value?, error? } — never throws.
//   2. Null-byte and control-char inputs are rejected or stripped.
//   3. Oversized payloads are rejected with a typed TooLargeError reason.
//   4. Prototype pollution attempts do not mutate Object.prototype.
//   5. Output HTML from sanitize() never contains executable script vectors.

import { describe, it, expect, afterEach, vi } from 'vitest';

// TODO: wire real import.
import { validateReport, sanitizeHtml } from '../../src/lib/idempotency.js';

const NULL_BYTE = '\u0000';
const RTL_OVERRIDE = '\u202E';
const ZERO_WIDTH = '\u200B';

const XSS_VECTORS = [
  '<script>alert(1)</script>',
  '"><img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<svg/onload=alert(1)>',
  '<a href="javascript:alert(1)">x</a>',
  '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
  '<style>@import"javascript:alert(1)";</style>',
];

const SQL_ISH = [
  "'; DROP TABLE reports; --",
  "1' OR '1'='1",
  "admin'--",
  'UNION SELECT password FROM users',
];

const PROTO_KEYS = ['__proto__', 'constructor', 'prototype'];

describe('chaos: malformed-input', () => {
  afterEach(() => {
    // Defensive: wipe any pollution the app may have introduced.
    // If these are set, a later test would fail — which is what we want.
    delete Object.prototype.polluted;
    vi.restoreAllMocks();
  });

  it('never throws on any of a large set of adversarial inputs', () => {
    const inputs = [
      null,
      undefined,
      '',
      ' ',
      NULL_BYTE,
      RTL_OVERRIDE + 'legit-looking',
      ZERO_WIDTH.repeat(1000),
      'A'.repeat(10 * 1024 * 1024), // 10MB string
      ...XSS_VECTORS,
      ...SQL_ISH,
      { title: { toString: () => { throw new Error('evil'); } } },
      { title: 'ok', body: Symbol('not-a-string') },
      { title: 123, body: true },
      [],
      {},
    ];

    for (const raw of inputs) {
      expect(() => validateReport(raw)).not.toThrow();
      const result = validateReport(raw);
      expect(result).toHaveProperty('ok');
      expect(typeof result.ok).toBe('boolean');
      if (!result.ok) {
        expect(result).toHaveProperty('error');
      }
    }
  });

  it('rejects or strips null bytes and control characters', () => {
    const result = validateReport({ title: 'hi' + NULL_BYTE, body: 'ok' });
    if (result.ok) {
      expect(result.value.title.includes(NULL_BYTE)).toBe(false);
    } else {
      expect(result.error.code).toMatch(/invalid.?chars?/i);
    }
  });

  it('rejects payloads over the configured max size with TooLargeError', () => {
    const huge = 'x'.repeat(10 * 1024 * 1024); // 10MB
    const result = validateReport({ title: 'ok', body: huge });
    expect(result.ok).toBe(false);
    expect(result.error.code).toMatch(/too.?large/i);
  });

  it('does not allow prototype pollution via __proto__ / constructor keys', () => {
    for (const key of PROTO_KEYS) {
      const raw = JSON.parse(
        `{"title":"ok","body":"ok","${key}":{"polluted":"yes"}}`,
      );
      validateReport(raw);
      expect(Object.prototype.hasOwnProperty.call(Object.prototype, 'polluted')).toBe(
        false,
      );
      expect({}.polluted).toBeUndefined();
    }
  });

  it('sanitizeHtml strips every tested XSS vector', () => {
    for (const vector of XSS_VECTORS) {
      const clean = sanitizeHtml(vector);
      expect(clean).not.toMatch(/<script\b/i);
      expect(clean).not.toMatch(/on\w+\s*=/i);
      expect(clean).not.toMatch(/javascript\s*:/i);
      expect(clean).not.toMatch(/<iframe\b/i);
      expect(clean).not.toMatch(/<svg\b[^>]*onload/i);
    }
  });

  it('preserves legitimate Unicode content (emojis, non-Latin scripts)', () => {
    const okInputs = [
      { title: 'Corruption in Harare', body: 'I saw a thing.' },
      { title: 'Mubhadharo unonetsa', body: 'Shona text with ñ and é.' },
      { title: '腐败举报', body: '在北京的一件事。' },
      { title: 'Report', body: 'good job' },
    ];
    for (const input of okInputs) {
      const result = validateReport(input);
      expect(result.ok).toBe(true);
      expect(result.value.title).toBeTruthy();
      expect(result.value.body).toBeTruthy();
    }
  });

  it('handles RTL override by preserving or stripping, never by crashing', () => {
    const result = validateReport({
      title: RTL_OVERRIDE + 'evil.exe',
      body: 'note',
    });
    expect(result).toHaveProperty('ok');
    // Whatever the policy, the decision must be deterministic.
    const again = validateReport({
      title: RTL_OVERRIDE + 'evil.exe',
      body: 'note',
    });
    expect(again.ok).toBe(result.ok);
  });
});
