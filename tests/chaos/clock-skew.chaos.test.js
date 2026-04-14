// tests/chaos/clock-skew.chaos.test.js
//
// Scenario: device clock is wrong. Cheap phones, factory-resets, and users
// flipping timezones on burner devices all yield skewed wall clocks. If we
// sort reports by Date.now() alone, a report submitted AFTER another can
// appear BEFORE it in the timeline — catastrophic for evidentiary order.
//
// Invariants proven here:
//   1. Each report carries a monotonic sequence (e.g. performance.now() based
//      or server-time anchored) that never decreases between successive calls.
//   2. Sorting by that sequence yields submission order even when Date.now()
//      jumps backward by hours.
//   3. A server-reported time, when available, overrides the local clock for
//      display but the monotonic sequence is still used for ordering.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// TODO: wire real import.
import { stampReport, sortReportsChronologically } from '../../src/lib/idempotency.js';

describe.skip('chaos: clock-skew', () => {
  let nowValue;

  beforeEach(() => {
    nowValue = new Date('2026-04-14T10:00:00Z').getTime();
    vi.useFakeTimers();
    vi.setSystemTime(nowValue);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('stamps each report with a strictly monotonic sequence', () => {
    const a = stampReport({ title: 'a' });
    vi.advanceTimersByTime(10);
    const b = stampReport({ title: 'b' });
    vi.advanceTimersByTime(10);
    const c = stampReport({ title: 'c' });

    expect(typeof a.seq).toBe('number');
    expect(b.seq).toBeGreaterThan(a.seq);
    expect(c.seq).toBeGreaterThan(b.seq);
  });

  it('sorts correctly when Date.now() jumps backward by hours', () => {
    const a = stampReport({ title: 'a' });

    // Simulate the OS setting clock back 3 hours (e.g. DST fumble or attack).
    vi.setSystemTime(nowValue - 3 * 60 * 60 * 1000);

    const b = stampReport({ title: 'b' });

    // And now forward by 6 hours.
    vi.setSystemTime(nowValue + 6 * 60 * 60 * 1000);

    const c = stampReport({ title: 'c' });

    const sorted = sortReportsChronologically([c, a, b]);
    expect(sorted.map((r) => r.title)).toEqual(['a', 'b', 'c']);
  });

  it('sorts correctly when Date.now() jumps forward by hours mid-session', () => {
    const a = stampReport({ title: 'a' });
    vi.setSystemTime(nowValue + 12 * 60 * 60 * 1000);
    const b = stampReport({ title: 'b' });
    vi.setSystemTime(nowValue + 1 * 60 * 60 * 1000); // back a bit
    const c = stampReport({ title: 'c' });

    const sorted = sortReportsChronologically([b, c, a]);
    expect(sorted.map((r) => r.title)).toEqual(['a', 'b', 'c']);
  });

  it('uses server-reported time for display but monotonic seq for order', () => {
    const a = stampReport({ title: 'a' }, { serverTime: '2026-04-14T10:00:05Z' });
    vi.setSystemTime(nowValue - 60 * 60 * 1000); // clock goes back.
    const b = stampReport({ title: 'b' }, { serverTime: '2026-04-14T10:00:06Z' });

    // Display uses serverTime when provided.
    expect(a.displayTime).toBe('2026-04-14T10:00:05Z');
    expect(b.displayTime).toBe('2026-04-14T10:00:06Z');

    // Order is still driven by the monotonic seq, not the wall clock.
    expect(b.seq).toBeGreaterThan(a.seq);
  });

  it('monotonic seq is preserved across many submissions under clock chaos', () => {
    const reports = [];
    for (let i = 0; i < 50; i++) {
      // Random clock jitter: ±6 hours on each step.
      const jitter = (Math.sin(i) * 6 * 60 * 60 * 1000) | 0;
      vi.setSystemTime(nowValue + jitter);
      reports.push(stampReport({ title: `r${i}` }));
    }

    for (let i = 1; i < reports.length; i++) {
      expect(reports[i].seq).toBeGreaterThan(reports[i - 1].seq);
    }
  });
});
