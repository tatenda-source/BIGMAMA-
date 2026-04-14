import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  sanitizeForHtml,
  sanitizeUrl,
  hasPrototypePollutionKey,
} from '../../../src/lib/sanitize.js';

describe('sanitizeText', () => {
  it('returns empty string for non-strings', () => {
    expect(sanitizeText(null)).toBe('');
    expect(sanitizeText(undefined)).toBe('');
    expect(sanitizeText(42)).toBe('');
    expect(sanitizeText({})).toBe('');
  });

  it('strips <script> blocks including content', () => {
    const out = sanitizeText('hi <script>alert(1)</script> there');
    expect(out).not.toMatch(/script/i);
    expect(out).not.toMatch(/alert\(1\)/);
  });

  it('strips stray script tags', () => {
    expect(sanitizeText('<script src=x>')).not.toMatch(/script/i);
    expect(sanitizeText('</script>')).not.toMatch(/script/i);
  });

  it('strips inline event handlers like onerror=', () => {
    const out = sanitizeText('<img onerror=alert(1) src=x>');
    expect(out).not.toMatch(/onerror/i);
  });

  it('strips javascript: URIs', () => {
    expect(sanitizeText('click javascript:alert(1)')).not.toMatch(/javascript:/i);
    expect(sanitizeText('java\tscript:...')).toBeDefined(); // sanity
    expect(sanitizeText('JAVASCRIPT:alert(1)')).not.toMatch(/javascript:/i);
  });

  it('strips non-image data: URIs but tolerates image/*', () => {
    expect(sanitizeText('src=data:text/html,<b>')).not.toMatch(/data:text/);
    const ok = sanitizeText('src=data:image/png;base64,AAAA');
    expect(ok).toMatch(/data:image\/png/);
  });

  it('removes bidi override chars (Trojan-Source defense)', () => {
    const s = 'hello\u202Eworld\u2066rtl\u2069';
    const out = sanitizeText(s);
    expect(out).toBe('helloworldrtl');
  });

  it('removes null bytes and C0 control chars but keeps \\n and \\t', () => {
    const out = sanitizeText('a\u0000b\u0007c\nd\te');
    expect(out).toBe('abc\nd\te');
  });

  it('truncates to maxLen', () => {
    const big = 'x'.repeat(10_000_000); // 10MB-ish string
    const out = sanitizeText(big, { maxLen: 100 });
    expect(out.length).toBe(100);
  });

  it('normalizes to NFC', () => {
    // "é" decomposed (e + U+0301) should become single U+00E9.
    const decomposed = 'e\u0301';
    const out = sanitizeText(decomposed);
    expect(out).toBe('\u00E9');
  });

  it('handles huge strings without throwing', () => {
    const big = 'a'.repeat(5_000_000);
    expect(() => sanitizeText(big)).not.toThrow();
  });
});

describe('sanitizeForHtml', () => {
  it('escapes the six critical chars', () => {
    expect(sanitizeForHtml('<b>"Ndeipi" & \'hi\'/</b>')).toBe(
      '&lt;b&gt;&quot;Ndeipi&quot; &amp; &#39;hi&#39;&#x2F;&lt;&#x2F;b&gt;'
    );
  });

  it('returns empty string for non-strings', () => {
    expect(sanitizeForHtml(null)).toBe('');
    expect(sanitizeForHtml(undefined)).toBe('');
  });
});

describe('sanitizeUrl', () => {
  it('accepts https, mailto, tel', () => {
    expect(sanitizeUrl('https://example.org/path?q=1')).toBe('https://example.org/path?q=1');
    expect(sanitizeUrl('mailto:reporter@example.org')).toBe('mailto:reporter@example.org');
    expect(sanitizeUrl('tel:+263771234567')).toBe('tel:+263771234567');
  });

  it('rejects javascript:, data:, file:, ftp:, http:', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl('data:text/html,<b>')).toBeNull();
    expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
    expect(sanitizeUrl('ftp://example.org')).toBeNull();
    expect(sanitizeUrl('http://example.org')).toBeNull();
  });

  it('rejects non-strings and empty strings', () => {
    expect(sanitizeUrl(null)).toBeNull();
    expect(sanitizeUrl('')).toBeNull();
    expect(sanitizeUrl('   ')).toBeNull();
    expect(sanitizeUrl(123)).toBeNull();
  });

  it('rejects URLs with embedded control or bidi chars', () => {
    expect(sanitizeUrl('https://example.org\u0000/x')).toBeNull();
    expect(sanitizeUrl('https://example.org\u202E/evil')).toBeNull();
  });
});

describe('hasPrototypePollutionKey', () => {
  it('detects __proto__, constructor, prototype at top level', () => {
    expect(hasPrototypePollutionKey(JSON.parse('{"__proto__":{"x":1}}'))).toBe(true);
    expect(hasPrototypePollutionKey(JSON.parse('{"constructor":{"x":1}}'))).toBe(true);
    expect(hasPrototypePollutionKey(JSON.parse('{"prototype":{"x":1}}'))).toBe(true);
  });

  it('detects nested dangerous keys', () => {
    const o = JSON.parse('{"a":{"b":{"__proto__":{"x":1}}}}');
    expect(hasPrototypePollutionKey(o)).toBe(true);
  });

  it('returns false for safe objects', () => {
    expect(hasPrototypePollutionKey({ a: 1, b: { c: 2 } })).toBe(false);
    expect(hasPrototypePollutionKey([])).toBe(false);
    expect(hasPrototypePollutionKey(null)).toBe(false);
    expect(hasPrototypePollutionKey('string')).toBe(false);
  });

  it('handles cyclic references without throwing', () => {
    const o = { a: 1 };
    o.self = o;
    expect(() => hasPrototypePollutionKey(o)).not.toThrow();
    expect(hasPrototypePollutionKey(o)).toBe(false);
  });
});
