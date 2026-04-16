# Deploying BIGMAMA$ to Vercel

This is the dissertation-MVP deploy path: one vendor, one command, one URL.
The frontend (Vite) and the API (serverless functions in `/api`) deploy
together. Storage is in-memory inside each serverless instance — fine for
user testing, documented as a known limitation.

## 0. One-time setup

```bash
# 1. Install the Vercel CLI globally (or use npx every time)
npm install -g vercel

# 2. Sign up + log in (free tier; no card required)
vercel login
#   Pick GitHub — this also links the repo so future pushes auto-deploy.
```

## 1. Generate a server secret

The API uses this to HMAC case IDs so retries return the same ID and no
one can forge one. Any 32 bytes of entropy work.

```bash
openssl rand -hex 32
# copy the output — you'll paste it into Vercel in the next step
```

## 2. First deploy (links the project)

From the repo root:

```bash
vercel
```

- When asked **"Set up and deploy?"** → `Y`
- **Which scope?** → your personal/team account
- **Link to existing project?** → `N`
- **Project name?** → `bigmama` (or whatever)
- **Directory?** → `./` (accept default)
- **Override settings?** → `N` — `vercel.json` already has the right
  build command, output dir, and framework preset

Vercel prints a preview URL like `https://bigmama-xxxx.vercel.app`.
Open it. `/api/health` should return `{ status: "ok", ... }`.

## 3. Add the secret + allowed origin

```bash
vercel env add SERVER_SECRET production
# paste the hex from step 1

vercel env add ALLOWED_ORIGINS production
# paste: https://bigmama.vercel.app
# (use your actual deployed domain from step 2)
```

Do the same for `preview` and `development` if you want env parity.

## 4. Redeploy so the env vars take effect

```bash
vercel --prod
```

That's it. Your URL is live, and every `git push` to `main` will trigger
another deploy automatically (via Vercel's GitHub integration).

## Local development against the Vercel stack

Two terminals:

```bash
# Terminal 1 — runs the /api functions on :3000
vercel dev --listen 3000

# Terminal 2 — runs Vite with /api proxied to :3000
VITE_API_BASE=http://localhost:3000 npm run dev
```

Open http://localhost:5173.

## Known limitations (deliberate for the MVP)

1. **In-memory storage** — idempotency + reports live in each serverless
   instance's RAM. A cold start or redeploy loses them. This is fine for
   user testing; production would back these with Vercel KV (Redis) +
   Vercel Postgres. All business logic stays the same; swap happens in
   `api/_storage.js`.
2. **No decryption path** — reports are encrypted with a per-report key
   that's discarded. Write-only tip line. Authority-pubkey wrapping is
   the next architectural step and is out of scope for the MVP.
3. **Rate limiting is per-instance** — another reason to back it with KV
   before real traffic.

## Rollback

`vercel rollback` — Vercel keeps every deployment. One command.

## Costs

Free hobby tier covers: 100 GB-hours serverless, 100 GB bandwidth, auto
HTTPS. A dissertation demo with ~100 reviewers hits ~0% of any limit.
