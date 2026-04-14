# Chaos Test Suite

The BIGMAMA$ chaos suite is the resilience spec for the civic-reporting app.
Our users are whistleblowers. They submit from cell-edge coverage, refurbished
Android phones, captive portals, and infrastructure that is sometimes actively
hostile. Every test in this directory encodes one adversarial condition the
production client must survive without losing a report, duplicating a side
effect, or crashing the UI.

## What "chaos" means here

Unit tests ask: *does this function do what the contract says?*
Chaos tests ask: *what happens when the world breaks?*

These tests intentionally inject failure — dropped fetches, full storage,
skewed clocks, panic wipes, hostile strings — and assert on the invariants that
must hold **no matter what**:

- **No silent data loss.** Every submitted report is eventually delivered,
  queued for later delivery, or surfaced as a recoverable error to the user.
- **No duplicate side effects.** Retries, reconnects, double-clicks, and
  parallel tabs all converge on at most one accepted submission thanks to
  stable idempotency keys.
- **No uncaught crashes.** Validation never throws on adversarial input; the
  UI never deadlocks on a stuck submit button.
- **No leaked state after panic.** Emergency wipe clears every storage
  surface and aborts every in-flight request.

If any chaos test fails, the fix is *never* to weaken the test. The fix is to
make the app behave.

## Status: spec vs ship

The first-pass chaos files (`network-flake`, `offline-queue`, `rate-limit`,
`storage-quota`, `clock-skew`, `concurrent-submissions`, `emergency-wipe`,
`malformed-input`) were written against a richer API than currently ships from
`src/lib/`. They are marked `describe.skip` as *todo pressure*: each scenario
is a real invariant the codebase needs to cover, not yet wired to the public
surface.

Today's live chaos coverage lives in `smoke.chaos.test.js` and exercises the
actually-shipped `submitReport(...)` pipeline:
retry-then-deliver, stable idempotency key across retries, cache short-circuit,
offline enqueue, and 4xx non-retry. The skipped files will be reshaped as the
API evolves. Do not delete them — they encode the contract we are building
toward.

## How to run

```bash
npm run test:chaos
```

(That npm script is owned by the package.json agent; this directory only
describes what it should execute: Vitest over `tests/chaos/**/*.chaos.test.js`.)

A single scenario:

```bash
npx vitest run tests/chaos/network-flake.chaos.test.js
```

## Expected modules under test

These tests are written against a spec that two sibling agents are
implementing. Until those modules land, the tests fail — that's the point.

- `src/lib/idempotency.js` — `submitReport`, `peekOfflineQueue`,
  `flushOfflineQueue`, `drainRateLimitQueue`, `useSubmitController`,
  `stampReport`, `sortReportsChronologically`, `validateReport`,
  `sanitizeHtml`, `MAX_RETRIES`, `RATE_LIMIT_PER_WINDOW_MS`,
  `RATE_LIMIT_WINDOW_MS`, `QUEUE_STORAGE_KEY`, `NetworkExhaustedError`,
  `QuotaRecoveryError`.
- `src/lib/crypto.js` — `emergencyWipe`, `registerAbortable`.

Every import carries a `// TODO: wire real import` comment where appropriate
so the downstream agent can find them.

## Scenario matrix

| Scenario file | Invariant enforced | Expected module |
| --- | --- | --- |
| `network-flake.chaos.test.js` | Bounded retries, stable idempotency key across attempts, typed error on exhaustion, single `accepted` signal. | `src/lib/idempotency.js` |
| `offline-queue.chaos.test.js` | Offline submits persist to localStorage, flush FIFO on reconnect, survive reload, dedup on racing flush. | `src/lib/idempotency.js` |
| `storage-quota.chaos.test.js` | QuotaExceededError triggers oldest-first eviction; in-flight report is never sacrificed; oversize report yields `QuotaRecoveryError`. | `src/lib/idempotency.js` |
| `clock-skew.chaos.test.js` | Reports carry a monotonic `seq` that survives backward and forward wall-clock jumps; server time drives display only. | `src/lib/idempotency.js` |
| `concurrent-submissions.chaos.test.js` | Double-clicks collapse to one fetch; parallel callers share one idempotency key; `isSubmitting` toggles correctly. | `src/lib/idempotency.js` |
| `emergency-wipe.chaos.test.js` | localStorage, sessionStorage, IndexedDB, and Cache Storage all cleared; every registered AbortController fired; wipe is idempotent and awaits every surface. | `src/lib/crypto.js` |
| `malformed-input.chaos.test.js` | Validator never throws; null bytes / RTL / 10MB / prototype-pollution / XSS / SQL-ish inputs are rejected or sanitized; legitimate multi-script Unicode passes. | `src/lib/idempotency.js` |
| `rate-limit.chaos.test.js` | Burst above per-window limit queues the excess; no drops under sustained pressure; 429 `Retry-After` is honoured exactly. | `src/lib/idempotency.js` |

## Dependency notes for the package.json agent

Everything here runs on the standard Vitest stack — no extra deps required:

- `vitest` (runner + `vi.fn`, `vi.spyOn`, `vi.useFakeTimers`, `vi.stubGlobal`)
- jsdom or happy-dom environment (needed for `navigator`, `Headers`, `Blob`,
  `Response`, `AbortController`)

Suggested `vitest.config` snippet (owned by the config agent, not us):

```js
export default {
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
  },
};
```

And a `test:chaos` script that runs only this folder:

```json
{
  "scripts": {
    "test:chaos": "vitest run tests/chaos"
  }
}
```

## Conventions

- One scenario per file, named `<scenario>.chaos.test.js`.
- Each file opens with a comment block explaining the real-world situation
  and the invariants it enforces — treat it as documentation.
- Tests must FAIL until the production code upholds the invariant. Don't
  soften assertions to make a test green; that defeats the point of a
  chaos suite.
- Mock at the boundary (`fetch`, `localStorage`, `navigator.onLine`,
  `indexedDB`, `caches`). Don't mock the module under test.
