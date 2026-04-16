import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Navigation, AlertTriangle, RefreshCw } from 'lucide-react';
import { resolveHotspotProvider, ZIMBABWE_BBOX } from '../lib/hotspots.js';
import 'leaflet/dist/leaflet.css';

const INTENSITY_COLOR = {
  high: 'var(--stamp, #a32410)',
  medium: 'var(--ochre-deep, #9b6a24)',
  low: 'var(--sky, #3e5870)',
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
    <section
      className="dossier"
      style={{ padding: 0, overflow: 'hidden' }}
      aria-labelledby="map-caption"
    >
      <header
        style={{
          padding: '22px 24px 14px',
          display: 'flex',
          gap: 16,
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          borderBottom: '1px solid var(--ink)',
          background: 'var(--paper-warm)',
        }}
      >
        <div>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.28em',
              color: 'var(--granite)',
              textTransform: 'uppercase',
              margin: '0 0 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Navigation size={12} aria-hidden="true" /> Plate I · Live hotspots
          </p>
          <h3
            id="map-caption"
            className="caption"
            style={{
              fontFamily: 'var(--font-display)',
              fontVariationSettings: '"opsz" 144, "wght" 500',
              fontSize: 'clamp(22px, 2.6vw, 30px)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Territorial incident register
          </h3>
          <p
            style={{
              color: 'var(--ink-muted)',
              fontSize: 12,
              margin: '6px 0 0',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.02em',
            }}
          >
            Source{' '}
            <strong style={{ color: 'var(--ink)' }}>{provider.name.toUpperCase()}</strong>
            {provider.reason ? (
              <span style={{ color: 'var(--ochre-deep)' }}> · {provider.reason}</span>
            ) : null}
            {status === 'ready' && (
              <> · {points.length} filed · {counts.high}H / {counts.medium}M / {counts.low}L</>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadCount((n) => n + 1)}
          disabled={status === 'loading'}
          aria-label="Refresh hotspots"
          className="bm-icon-button"
          style={{ padding: 8, border: '1.5px solid var(--ink)' }}
        >
          <RefreshCw size={16} aria-hidden="true" className={status === 'loading' ? 'bm-spin' : undefined} />
        </button>
      </header>

      <div style={{ position: 'relative', height: 500 }}>
        <MapContainer
          center={CENTER}
          zoom={6}
          style={{ height: '100%', width: '100%', background: 'var(--paper-warm)' }}
          scrollWheelZoom={false}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &middot; &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
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
              background: 'rgba(241, 235, 224, 0.92)', color: 'var(--ink)',
              textAlign: 'center', padding: 24,
            }}
          >
            <div style={{ maxWidth: 320 }}>
              <AlertTriangle size={24} color="var(--stamp)" aria-hidden="true" />
              <p
                style={{
                  marginTop: 10,
                  fontFamily: 'var(--font-display)',
                  fontVariationSettings: '"opsz" 72, "wght" 500',
                  fontSize: 18,
                }}
              >
                Couldn't load live hotspots.
              </p>
              <p
                style={{
                  color: 'var(--ink-muted)',
                  fontSize: 12,
                  marginTop: 4,
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {error}
              </p>
              <button
                type="button"
                onClick={() => setReloadCount((n) => n + 1)}
                className="btn-secondary"
                style={{ marginTop: 16 }}
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default HotspotMap;
