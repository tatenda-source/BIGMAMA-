// tests/chaos/concurrent-submissions.chaos.test.js
//
// Scenario: user double-clicks Submit, or network lag makes them hit the
// button three times. We must accept exactly one report: client-side guard
// blocks duplicate invocations in the same tick, and even if they slip
// through, the idempotency key guarantees server-side dedup.
//
// Invariants proven here:
//   1. N concurrent submitReport calls for the same payload result in at most
//      one fetch when the client guard is active.
//   2. If concurrent fetches DO occur (e.g. from separate tabs), all of them
//      send the same idempotency key so the server can dedup.
//   3. The UI-level submitting flag is true during in-flight and cleared on
//      settle (success or failure).
//   4. Exactly one caller-visible "accepted" resolution is returned.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// TODO: wire real import.
import { submitReport, useSubmitController } from '../../src/lib/idempotency.js';

describe('chaos: concurrent-submissions', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('collapses N simultaneous double-clicks into a single fetch', async () => {
    let resolveFetch;
    const pending = new Promise((r) => {
      resolveFetch = r;
    });
    fetchMock.mockImplementation(() => pending);

    const controller = useSubmitController();
    const payload = { title: 'double-click', body: 'stop!' };

    // Fire three clicks in the same tick.
    const p1 = controller.submit(payload);
    const p2 = controller.submit(payload);
    const p3 = controller.submit(payload);

    // Controller should be "submitting" right now.
    expect(controller.isSubmitting()).toBe(true);

    resolveFetch(new Response(JSON.stringify({ accepted: true }), { status: 202 }));

    const results = await Promise.all([p1, p2, p3]);

    // Only one real POST.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // All three callers must receive the same logical result.
    expect(results[0]).toMatchObject({ accepted: true });
    expect(results[1]).toEqual(results[0]);
    expect(results[2]).toEqual(results[0]);
  });

  it('clears isSubmitting on successful settle', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), { status: 202 }),
    );
    const controller = useSubmitController();
    const p = controller.submit({ title: 't', body: 'b' });
    expect(controller.isSubmitting()).toBe(true);
    await p;
    expect(controller.isSubmitting()).toBe(false);
  });

  it('clears isSubmitting on failure too', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const controller = useSubmitController();
    const p = controller.submit({ title: 't', body: 'b' }).catch(() => null);
    expect(controller.isSubmitting()).toBe(true);
    await p;
    expect(controller.isSubmitting()).toBe(false);
  });

  it('parallel submitReport calls from separate callers share one idempotency key', async () => {
    // If two tabs call submitReport without a shared controller, they can
    // still both reach fetch — but the payload-derived idempotency key must
    // be stable so the server can dedup.
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ accepted: true }), { status: 202 }),
    );
    const payload = { title: 'same', body: 'thing', clientReportId: 'cid-42' };

    await Promise.all([submitReport(payload), submitReport(payload)]);

    const keys = fetchMock.mock.calls.map(([, init]) => {
      const headers = new Headers(init?.headers || {});
      return headers.get('X-Idempotency-Key');
    });
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(1);
  });

  it('ignores rapid re-click while in-flight', async () => {
    let resolveFetch;
    fetchMock.mockImplementation(
      () =>
        new Promise((r) => {
          resolveFetch = r;
        }),
    );
    const controller = useSubmitController();

    const first = controller.submit({ title: 'first', body: '1' });
    // A second payload while the first is in-flight must either queue or be
    // rejected with a sentinel — never silently fire a parallel fetch.
    const second = controller.submit({ title: 'second', body: '2' }).catch((e) => e);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveFetch(new Response(JSON.stringify({ accepted: true }), { status: 202 }));
    await first;
    const settled = await second;

    // Either the second call was rejected with a sentinel, or it was queued
    // and fired after the first settled. Both are acceptable.
    const parallelFiredDuringFirst = fetchMock.mock.calls.length >= 2 && settled?.accepted;
    expect(parallelFiredDuringFirst || settled?.name === 'AlreadySubmittingError').toBeTruthy();
  });
});
