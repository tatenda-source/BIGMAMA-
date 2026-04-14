/**
 * @file sanitize.js — Defensive input/output sanitization for BIGMAMA$.
 *
 * These helpers are intentionally conservative. They reject anything that
 * smells dangerous rather than trying to "fix" it. The goal is to give
 * component authors a safe default even when they forget to escape.
 *
 * Nothing here replaces a real DOM-aware sanitizer like DOMPurify; this is
 * a last-mile defense and a content gate for plain-text civic reports.
 */

/** Default maximum length for sanitized free-text fields. */
const DEFAULT_MAX_LEN = 5000;

/**
 * Control-character regex: C0/C1 except TAB (0x09) and LF (0x0A).
 * Matches 0x00–0x08, 0x0B, 0x0C, 0x0E–0x1F, 0x7F, and 0x80–0x9F.
 */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;

/**
 * Bidi override / isolate controls used in Trojan-Source style attacks.
 * U+202A LRE, U+202B RLE, U+202C PDF, U+202D LRO, U+202E RLO,
 * U+2066 LRI, U+2067 RLI, U+2068 FSI, U+2069 PDI.
 */
const BIDI_CHARS_RE = /[\u202A-\u202E\u2066-\u2069]/g;

/** `<script>...</script>` blocks (case-insensitive, cross-line). */
const SCRIPT_TAG_RE = /<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi;
/** Stray opening or closing script tags. */
const SCRIPT_STRAY_RE = /<\s*\/?\s*script\b[^>]*>/gi;

/** Inline event handlers, e.g. `onerror="..."`, `onclick=foo`. */
const EVENT_HANDLER_RE = /\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi;

/** `javascript:` URI scheme, tolerating whitespace/case. */
const JS_URI_RE = /javascript\s*:/gi;

/** `data:` URIs that are NOT `data:image/...`. */
const UNSAFE_DATA_URI_RE = /data\s*:(?!image\/)[^\s"'<>]+/gi;

/**
 * Sanitize a free-text string for storage or display as plain text.
 *
 * - Rejects non-strings (returns empty string).
 * - Normalizes to Unicode NFC.
 * - Strips control chars (keeps `\n` and `\t`).
 * - Strips bidi override / isolate chars (Trojan-Source defense).
 * - Removes `<script>` blocks, inline event handlers, `javascript:` URIs,
 *   and unsafe `data:` URIs (non-image).
 * - Truncates to `maxLen` characters.
 *
 * @param {string} input
 * @param {{maxLen?: number}} [opts]
 * @returns {string}
 */
export function sanitizeText(input, { maxLen = DEFAULT_MAX_LEN } = {}) {
  if (typeof input !== 'string') return '';
  let s = input.normalize('NFC');
  s = s.replace(CONTROL_CHARS_RE, '');
  s = s.replace(BIDI_CHARS_RE, '');
  s = s.replace(SCRIPT_TAG_RE, '');
  s = s.replace(SCRIPT_STRAY_RE, '');
  s = s.replace(EVENT_HANDLER_RE, '');
  s = s.replace(JS_URI_RE, '');
  s = s.replace(UNSAFE_DATA_URI_RE, '');
  if (s.length > maxLen) s = s.slice(0, maxLen);
  return s;
}

/**
 * Escape a string for insertion into an HTML text node or attribute.
 * Not a substitute for contextual escaping in attributes-with-URLs; use
 * {@link sanitizeUrl} there.
 *
 * @param {string} input
 * @returns {string}
 */
export function sanitizeForHtml(input) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate a URL against a strict scheme allowlist.
 * Allowed: `https:`, `mailto:`, `tel:`. Everything else returns `null`.
 *
 * @param {string} input
 * @returns {string | null} The trimmed URL, or `null` if rejected.
 */
export function sanitizeUrl(input) {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  // Reject any control/bidi chars embedded in the URL.
  if (CONTROL_CHARS_RE.test(trimmed) || BIDI_CHARS_RE.test(trimmed)) return null;
  // Quick scheme check before constructing URL (avoids throwing on mailto/tel).
  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed);
  if (!schemeMatch) return null;
  const scheme = schemeMatch[1].toLowerCase();
  if (scheme === 'https' || scheme === 'mailto' || scheme === 'tel') {
    return trimmed;
  }
  return null;
}

/**
 * Detect keys commonly used for prototype-pollution attacks.
 * Returns `true` if the object (or any nested object) contains a dangerous
 * OWN key. Does not throw on cycles — uses a seen-set.
 *
 * @param {unknown} obj
 * @returns {boolean}
 */
export function hasPrototypePollutionKey(obj) {
  if (obj === null || typeof obj !== 'object') return false;
  const seen = new WeakSet();
  const DANGEROUS = new Set(['__proto__', 'constructor', 'prototype']);
  const stack = [obj];
  while (stack.length) {
    const node = stack.pop();
    if (node === null || typeof node !== 'object') continue;
    if (seen.has(node)) continue;
    seen.add(node);
    for (const key of Object.getOwnPropertyNames(node)) {
      if (DANGEROUS.has(key)) return true;
      const val = node[key];
      if (val !== null && typeof val === 'object') stack.push(val);
    }
  }
  return false;
}
