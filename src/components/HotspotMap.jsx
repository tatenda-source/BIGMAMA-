import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Navigation, AlertTriangle, RefreshCw } from 'lucide-react';
import { resolveHotspotProvider, ZIMBABWE_BBOX } from '../lib/hotspots.js';
import 'leaflet/dist/leaflet.css';

const INTENSITY_COLOR = {
  high: 'var(--color-accent-magenta, #ff007a)',
  medium: 'var(--color-accent-amber, #ffb020)',
  low: 'var(--color-accent-cyan, #00f2ff)',
};

const CENTER = [(ZIMBABWE_BBOX.north + ZIMBABWE_BBOX.south) / 2, (ZIMBABWE_BBOX.east + ZIMBABWE_BBOX.west) / 2];

/** Pans the map to the current hotspot bounds after data loads. */
function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const bounds = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 7 });
  }, [map, points]);
  return null;
}

const HotspotMap = () => {
  const [result, setResult] = useState({ status: 'loading', points: [], error: null });
  const [reloadCount, setReloadCount] = useState(0);

  const provider = useMemo(() => resolveHotspotProvider(), []);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    provider
      .loader({ signal: controller.signal })
      .then((data) => {
        if (cancelled) return;
        setResult({ status: 'ready', points: data, error: null });
      })
      .catch((err) => {
        if (cancelled || err?.name === 'AbortError') return;
        setResult({ status: 'error', points: [], error: err?.message ?? 'Failed to load hotspots' });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [provider, reloadCount]);

  const { status, points, error } = result;

  const counts = useMemo(() => {
    const by = { high: 0, medium: 0, low: 0 };
    for (const p of points) by[p.intensity]++;
    return by;
  }, [points]);

  return (
    <div
      className="glass-card"
      style={{ overflow: 'hidden', border: '1px solid var(--color-border-subtle)' }}
    >
      <header style={{ padding: '24px 24px 16px', display: 'flex', gap: 16, alignItems: 'start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <h3 className="font-display" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <Navigation size={20} color="var(--color-accent-cyan)" aria-hidden="true" />
            Live Hotspot Map
          </h3>
          <p style={{ color: 'var(--color-text-dim)', fontSize: 13, margin: '6px 0 0' }}>
            Source: <strong style={{ color: 'var(--color-text)' }}>{provider.name.toUpperCase()}</strong>
            {provider.reason ? (
              <span style={{ color: 'var(--color-accent-amber)' }}> — {provider.reason}</span>
            ) : null}
            {status === 'ready' && (
              <> · {points.length} active · {counts.high} high / {counts.medium} med / {counts.low} low</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadCount((n) => n + 1)}
          disabled={status === 'loading'}
          aria-label="Refresh hotspots"
          className="bm-icon-button"
          style={{ padding: 8 }}
        >
          <RefreshCw size={18} aria-hidden="true" className={status === 'loading' ? 'bm-spin' : undefined} />
        </button>
      </header>

      <div style={{ position: 'relative', height: 500 }}>
        <MapContainer
          center={CENTER}
          zoom={6}
          style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <FitBounds points={points} />
          {points.map((p) => (
            <CircleMarker
              key={p.id}
              center={[p.lat, p.lng]}
              radius={p.intensity === 'high' ? 10 : p.intensity === 'medium' ? 7 : 5}
              pathOptions={{
                color: INTENSITY_COLOR[p.intensity],
                fillColor: INTENSITY_COLOR[p.intensity],
                fillOpacity: 0.45,
                weight: 1.5,
              }}
            >
              <Popup>
                <strong>{p.title}</strong>
                <br />
                <span style={{ fontSize: 12 }}>
                  {p.source} · {p.intensity}
                  <br />
                  {new Date(p.ts).toLocaleString()}
                </span>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {status === 'error' && (
          <div
            role="alert"
            style={{
              position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
              background: 'rgba(5,5,5,0.75)', backdropFilter: 'blur(6px)', color: 'var(--color-text)',
              textAlign: 'center', padding: 24,
            }}
          >
            <div>
              <AlertTriangle size={28} color="var(--color-accent-amber)" aria-hidden="true" />
              <p style={{ marginTop: 12 }}>Couldn't load live hotspots.</p>
              <p style={{ color: 'var(--color-text-dim)', fontSize: 12, marginTop: 4 }}>{error}</p>
              <button
                type="button"
                onClick={() => setReloadCount((n) => n + 1)}
                style={{
                  marginTop: 16, padding: '8px 14px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border-strong)', background: 'transparent',
                  color: 'var(--color-text)', cursor: 'pointer',
                }}
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotspotMap;
