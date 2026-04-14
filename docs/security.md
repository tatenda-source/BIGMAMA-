# BIGMAMA$ Security Posture

This document reflects the security controls actually implemented in the
codebase. Do not rely on the UI copy — rely on this document and the audit
commits that reference it.

## Threat model

BIGMAMA$ users are whistleblowers reporting land-rights abuses, often under
surveillance. Our adversaries include:

- State-level actors with legal authority to compel local data disclosure
- Organized private actors who can subpoena hosting providers or seize devices
- Network observers who can correlate TLS metadata

We cannot defend against every adversary at every layer. This doc is explicit
about what is protected, and what is not.

## Controls in place

| Control | Where | Notes |
|---|---|---|
| WebCrypto AES-GCM-256 with PBKDF2-SHA256 (250k iters) | `src/lib/crypto.js` | Replaces the former `simulated AES-256` in `src/utils/security.js` |
| Adversarial input sanitization (XSS vectors, bidi override chars, prototype pollution) | `src/lib/sanitize.js` | Applied at every user-input boundary |
| Emergency wipe that clears `localStorage`, `sessionStorage`, IndexedDB, Cache API, service workers, abort signals | `src/lib/wipe.js` + `src/pwa/register-sw.js` | Settings toggle triggers this |
| Idempotency-key-protected report submission with retry + circuit breaker + offline queue | `src/lib/submit-report.js`, `src/lib/idempotency.js`, `src/lib/retry.js`, `src/lib/offline-queue.js` | Exactly-once delivery under flaky networks |
| Strict CSP + Permissions-Policy + X-Content-Type-Options + no-referrer | `index.html`, `vite.config.js` | Meta as fallback; production must send HTTP headers |
| Error boundary that never logs render errors | `src/ErrorBoundary.jsx` | Payloads stay out of console |
| Service worker that refuses to cache `/api/` traffic | `public/sw.js` | Report bodies never land in shared HTTP cache |
| Bundle size gate (300 KB gzip budget) | `scripts/bundle-size.mjs`, CI | Accessibility for low-data users is a safety feature |
| CodeQL + npm audit + gitleaks in CI | `.github/workflows/security.yml` | Weekly + per-PR |

## Production deployment checklist

Meta-CSP is enforced by the browser, but HTTP-header CSP is strictly stronger.
A production deploy **must** also send these response headers (example for an
Nginx/Cloudflare edge):

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(self), geolocation=(self), microphone=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
```

## Residual risks

These are risks our code cannot address. They must be communicated to users in
product copy or onboarding:

1. **Network-level correlation.** TLS hides content but not timing or volume.
   An ISP-level observer can infer that a given device sent a report.
2. **Device compromise.** A rooted or MDM-managed device can observe the app
   regardless of in-browser controls. Emergency wipe is a best-effort response,
   not a forensic erase.
3. **Image/video metadata.** EXIF, device fingerprints, and audio hashes can
   re-identify a reporter even under anonymity. Future work: strip metadata
   client-side before submission.
4. **Legal compulsion.** Data at the server layer is outside this document's
   scope. Server-side E2EE will be tracked in `docs/roadmap.md`.

## What the UI is allowed to claim

Do NOT use the phrase "military-grade encryption" or similar. Allowed copy:

- "Reports are encrypted in your browser with AES-GCM-256 before sending."
- "Emergency wipe clears local app data on this device."
- "Anonymous mode hides your identity from our system; it cannot hide your
  network traffic from your internet provider."
