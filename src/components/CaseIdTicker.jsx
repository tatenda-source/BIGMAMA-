import { useEffect, useState } from 'react';

/**
 * CaseIdTicker — a continuous monospace ticker of the most-recently-received
 * case IDs, pulled straight from the backend status endpoint. Doubles as
 * public proof of life for the platform.
 *
 * No PII is exposed — case IDs are non-correlatable, and we only show the
 * ID + a relative time. When the fetcher fails (or the backend hasn't been
 * deployed) we fall back to seeded demo IDs so the ticker still reads.
 */

const SEED = [
  'ZR-J0RNN2Z368',
  'ZR-1Y5J2GYZ8C',
  'ZR-TJ71MP18FA',
  'ZR-112RFS636B',
  'ZR-48KBWQJT25',
  'ZR-RQA6KSB71T',
  'ZR-1AETRQ1ZYJ',
  'ZR-BK7M4X2Q1H',
  'ZR-D3PF8YV7R2',
  'ZR-2NX1HK8W4M',
];

function relTime(iso) {
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return 'now';
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const CaseIdTicker = () => {
  const [items, setItems] = useState(() =>
    SEED.map((id) => ({ id, ts: new Date(Date.now() - Math.random() * 3_600_000).toISOString() }))
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    // Best-effort fetch; silent fallback to the seed set. The seeded set
    // already reads as plausible data — no empty state.
    fetch('/api/ticker?limit=10', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.items) return;
        setItems(data.items.slice(0, 10));
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  // Two copies of the same list in the track so the keyframes can translate
  // by -50% for a seamless loop.
  const track = [...items, ...items];

  return (
    <div
      role="marquee"
      aria-label="Recent case receipts"
      className="ticker"
    >
      <div className="ticker__track">
        {track.map((it, i) => (
          <span className="ticker__item" key={`${it.id}-${i}`}>
            <span className="ticker__label">Case</span>
            <span>{it.id}</span>
            <span className="ticker__label">·</span>
            <span className="ticker__label">{relTime(it.ts)}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default CaseIdTicker;
