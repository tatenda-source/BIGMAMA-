---
name: pre-release-check
description: Run the full pre-release quality gate for BIGMAMA$ — lint, typecheck (if added), unit tests, chaos tests, build, bundle budget, security audit, and a11y review. Invoke before merging to main or cutting a release.
---

# Pre-Release Check

Execute these phases in order. Abort the release on any FAIL.

## 1. Static analysis
```
npm run lint
```
Any errors block release. Warnings over a threshold of 10 also block.

## 2. Unit tests
```
npm run test -- --run
```
Coverage for `src/utils/**` and `src/lib/**` must be ≥ 80% lines.

## 3. Chaos suite
```
npm run test:chaos
```
All chaos scenarios must either pass or be explicitly documented as known-risk.

## 4. Production build
```
npm run build
```
Build must succeed and emit a `dist/` with a manifest.

## 5. Bundle budget
Call the `perf-guardian` agent to verify bundle sizes against budget in `.claude/agents/perf-guardian.md`.

## 6. Security audit
Call the `security-auditor` agent. Verdict must be SHIP.

## 7. Accessibility review
Call the `a11y-reviewer` agent on any components changed since last release.

## 8. Manifest / PWA integrity
Confirm `public/manifest.webmanifest` present, `dist/sw.js` present, and `index.html` links both.

## 9. Commit hygiene
`git log` since last tag — every commit must be a conventional commit (feat/fix/chore/docs/refactor/test/perf/security/ci).

## Output
Write a one-page release report to `docs/releases/YYYY-MM-DD.md` summarizing each phase's result.
