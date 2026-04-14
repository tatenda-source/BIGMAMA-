# `src/lib/` — BIGMAMA$ security primitives

Real, boring, battle-tested building blocks. These modules exist because
`src/utils/security.js` is a cosmetic Base64 wrapper masquerading as
AES-256. Nothing in this directory lies about what it does.

Every module here is:

- **Zero-dependency.** Only platform APIs (WebCrypto, `AbortController`,
  storage interfaces).
- **Pure / best-effort.** Crypto and CSP are pure functions. `wipe.js` is
  best-effort and never throws.
- **CSPRNG-only.** No `Math.random`. Not ever. Not once.

Another agent wires these into components. This library does not import
app state, does not read from `window` globals beyond the standard ones,
and does not log secrets.

## Public API

### `crypto.js`

| Export                             | Purpose                                                        |
| ---------------------------------- | -------------------------------------------------------------- |
| `encryptAesGcm(plaintext, password)` | PBKDF2-SHA256 (250k iters) + AES-GCM-256. Returns `{v,iv,salt,ct}`. |
| `decryptAesGcm(payload, password)` | Reverses `encryptAesGcm`. Throws on tamper / wrong password.   |
| `randomId(bytes = 16)`             | CSPRNG base64url identifier.                                   |
| `randomCaseId()`                   | Human-readable `ZR-XXXXXXXXXX` case ID (~50 bits entropy).     |

All byte fields in the encrypted payload are base64url (no padding).
Payloads are versioned (`v: 1`) so future migrations don't corrupt
on-disk data.

### `sanitize.js`

| Export                               | Purpose                                                                             |
| ------------------------------------ | ----------------------------------------------------------------------------------- |
| `sanitizeText(input, { maxLen })`    | NFC-normalize, strip C0/C1 controls (keep `\n`/`\t`), bidi overrides, `<script>`, `onerror=`, `javascript:`, non-image `data:`. Truncate. |
| `sanitizeForHtml(input)`             | Escape `& < > " ' /` for safe text-node insertion.                                  |
| `sanitizeUrl(input)`                 | Allowlist `https:` / `mailto:` / `tel:`; everything else → `null`.                  |
| `hasPrototypePollutionKey(obj)`      | Deep scan for `__proto__` / `constructor` / `prototype` own-keys. Cycle-safe.       |

Not a DOM sanitizer. Compose with React's default text-escaping or
DOMPurify when rendering rich content.

### `wipe.js`

| Export                                | Purpose                                                                |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `emergencyWipe()`                     | Clears localStorage, sessionStorage, IndexedDB, Cache API, service workers, and every registered AbortController. Returns `{cleared, failed}`. Never throws. |
| `registerAbortable(controller)`       | Register an `AbortController` for emergency abort. Returns deregister fn. |

Callers who know specific IndexedDB database names should delete them
explicitly in Firefox before 126, where `indexedDB.databases()` is
unavailable.

### `case-id.js`

Re-exports `randomCaseId` so UI code can import it without pulling the
full crypto surface.

### `csp.js`

| Export                  | Purpose                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| `default buildCspMeta({ nonce })` | Pure function returning the CSP string. Requires a per-response nonce. |

The current CSP keeps `style-src 'unsafe-inline'` for Vite's emitted
inline styles. `TODO:` tighten once the style pipeline is extracted.

## Tests

Tests live under `tests/unit/lib/` and use Vitest (`describe / it /
expect / vi`). Run them with whatever runner the root project wires up.
