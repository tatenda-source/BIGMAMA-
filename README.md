# BIGMAMA$ — Civic Reporting Platform

A full-stack progressive web app for reporting land-rights abuses and
organising civic campaigns. Built for users operating on low-end devices,
metered mobile data, and sometimes adversarial network conditions.

## What lives where

| Path | Purpose |
|---|---|
| `src/` | React + Vite client (PWA) |
| `src/lib/` | Vetted primitives: crypto, sanitize, idempotency, retry, offline queue, emergency wipe |
| `src/primitives/` | Reusable UI primitives (CardItem, Toggle, StatDisplay, Badge, IconAvatar, SecondaryButton, CardHeader, FormSection) |
| `src/components/` | Feature components composed from primitives |
| `src/styles/` | Design tokens, glass, base, components CSS |
| `src/pwa/` | Service-worker registration + wipe helpers |
| `public/sw.js` | Service worker (stale-while-revalidate shell, never caches /api) |
| `public/manifest.webmanifest` | PWA manifest |
| `server/` | Cloudflare Workers backend (edge runtime, D1 + KV) |
| `tests/unit/` | Vitest unit coverage for `src/lib/**` |
| `tests/chaos/` | Chaos scenarios — resilience spec for the submit pipeline |
| `docs/security.md` | Threat model, controls, residual risks |
| `.claude/agents/` | Specialist review agents (security, threat, a11y, component, perf) |
| `.claude/skills/` | Workflows (pre-release-check, audit-commit) |
| `.github/workflows/` | CI, security scan, deploy, release, backend CI, backend deploy |

## Quick start

```bash
# Client
npm ci
npm run dev          # Vite dev server on http://localhost:5173

# Backend (separate package)
cd server
npm ci
cp .dev.vars.example .dev.vars
npm run dev          # wrangler dev
```

## Quality gates

```bash
npm run lint             # ESLint with jsx-a11y, no-alert, no-eval
npm run test             # Vitest unit suite
npm run test:chaos       # chaos smoke scenarios
npm run test:coverage    # coverage against 80% threshold
npm run build            # Vite production build
npm run bundle:size      # gzip-size gate (300 KB budget)
npm run audit:security   # npm audit at high+ severity
```

Release-ready? Run the `pre-release-check` skill — it sequences every gate
above plus the security-auditor and a11y-reviewer agents.

## Security posture

See [`docs/security.md`](docs/security.md) for the real threat model, the
controls actually implemented, and residual risks users must be told about.
The UI is forbidden from claiming "military-grade encryption"; allowed copy
is enumerated in that doc.

## Mission

BIGMAMA$ is built for citizens, activists, NGOs, and authorities who
confront illegal land deals. Every technical choice — real crypto, offline
queue, idempotency keys, bundle budget, emergency wipe — exists because a
whistleblower's device can fail and a whistleblower's safety cannot.
