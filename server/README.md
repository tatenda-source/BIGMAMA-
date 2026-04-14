# BIGMAMA$ Server

Production-quality Cloudflare Worker that accepts client-encrypted civic
reports from the BIGMAMA$ PWA. The worker never decrypts — it stores
whatever ciphertext the frontend produces with `src/lib/crypto.js`
(AES-GCM-256, PBKDF2-SHA256 @ 250k iters).

```
Frontend (React/Vite)                         Edge Worker
 src/lib/crypto.js  ── {v,iv,salt,ct} ──▶  POST /api/reports
                                                │
                                                ├─▶ D1  (reports)
                                                └─▶ KV  (idempotency ledger)
```

## Endpoints

| Method | Path                      | Purpose                                   |
| ------ | ------------------------- | ----------------------------------------- |
| POST   | `/api/reports`            | Accept encrypted payload, return `caseId` |
| GET    | `/api/case/:id/status`    | Receipt lookup (status only, no content)  |
| GET    | `/api/health`             | Liveness + version                        |
| OPTIONS| `/*`                      | CORS preflight                            |

### POST /api/reports

Request:

```http
POST /api/reports
Content-Type: application/json
Idempotency-Key: <16..64 chars, [A-Za-z0-9_-]>

{ "v": 1, "iv": "...", "salt": "...", "ct": "..." }
```

Responses:

| Status | Body                                         | When                       |
| ------ | -------------------------------------------- | -------------------------- |
| 201    | `{ caseId, status: "received" }`             | First submit               |
| 200    | `{ caseId, status: "duplicate" }`            | Retry with same key        |
| 400    | `{ error: "..." }`                           | Bad headers / body         |
| 413    | `{ error: "payload_too_large" }`             | > 256 KB                   |
| 415    | `{ error: "unsupported_media_type" }`        | Wrong Content-Type         |
| 429    | `{ error: "too_many_requests", retry_after_s }` | > 10 writes/min per IP  |
| 503    | `{ error: "storage_unavailable" }`           | D1 transient failure       |

## Local development

```bash
cd server
npm ci
cp .dev.vars.example .dev.vars
# edit .dev.vars and set a real SERVER_SECRET (32 bytes hex)
npm run dev
```

Visit http://localhost:8787/api/health.

### Running tests

```bash
npm run test
```

Tests run inside Miniflare via `@cloudflare/vitest-pool-workers`, so D1 /
KV / WebCrypto behave exactly as on the edge.

## First-time Cloudflare setup

```bash
# 1. Log in (once per machine)
npx wrangler login

# 2. Create bindings (paste the printed ids into wrangler.toml)
npx wrangler kv:namespace create IDEMPOTENCY
npx wrangler kv:namespace create RATE_LIMIT
npx wrangler d1 create bigmama-reports

# 3. Apply the schema
npx wrangler d1 migrations apply bigmama-reports --local   # local SQLite
npx wrangler d1 migrations apply bigmama-reports --remote  # remote (prod)

# 4. Secrets (never commit)
npx wrangler secret put SERVER_SECRET     --env production
npx wrangler secret put RATE_LIMIT_SALT   --env production
# repeat with --env staging as needed
```

## Deploy

```bash
npm run deploy:staging      # bigmama-api-staging.<workers.dev>
npm run deploy:production   # bigmama-api-production.<custom-domain>
```

CI/CD lives in `.github/workflows/backend-ci.yml` (lint + test) and
`.github/workflows/backend-deploy.yml` (runs `wrangler-action` on green
CI pushes to `main` touching `server/**`).

## Security posture

- **Client-side encryption only.** Server stores ciphertext, iv, salt —
  never plaintext, never keys.
- **HMAC-minted case IDs.** `HMAC-SHA256(idempotencyKey || bucket, SERVER_SECRET)`
  → Crockford Base32. Retries are idempotent; IDs are unforgeable.
- **Strict schema.** Exactly 4 keys: `v`, `iv`, `salt`, `ct`. Extras rejected.
- **Size caps.** 256 KB hard limit on request body.
- **CORS allowlist.** No wildcard. Origins set via `ALLOWED_ORIGINS`.
- **Security headers.** HSTS preload, nosniff, no-referrer, CORP same-origin,
  no-store, noindex.
- **Rate limits.** 10 writes/min and 60 reads/min per hashed IP.
- **Log hygiene.** Only `caseId`, `status`, `duration_ms`. No ciphertext,
  no IPs, no headers, no PII.

## Integration note for the frontend

`src/lib/submit-report.js` should `POST` to `/api/reports` with:

- `Content-Type: application/json`
- `Idempotency-Key: <crypto.randomUUID() without dashes, or similar>`
- Body: the exact object returned by `encryptAesGcm(plaintext, password)`.

On `200 duplicate` treat the submission as already accepted.
On `201 received` clear the offline queue entry.
On `429`, use `retry_after_s` for the queue backoff.
