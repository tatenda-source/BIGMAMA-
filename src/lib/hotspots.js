/**
 * Hotspot data providers.
 *
 * The HotspotMap component consumes a provider-agnostic array of
 * `{ id, lat, lng, intensity, title, source, ts }` objects. Swapping data
 * sources is a config change, not a refactor:
 *
 *   VITE_HOTSPOT_PROVIDER=usgs      (default — live earthquakes; zero auth)
 *   VITE_HOTSPOT_PROVIDER=firms     (NASA FIRMS active-fire hotspots; needs MAP_KEY)
 *   VITE_HOTSPOT_PROVIDER=local     (seeded sample data; offline + low-data safe)
 *
 * No provider is permitted to return more than MAX_POINTS entries. We clamp
 * hard so a misbehaving upstream can't flood the renderer.
 */

const MAX_POINTS = 200;

// Zimbabwe-centered default bbox: roughly the country envelope.
export const ZIMBABWE_BBOX = {
  north: -15.5, south: -22.5, west: 25.0, east: 33.2,
};

/** Normalise any provider's raw record into the canonical shape. */
function normalise({ id, lat, lng, intensity, title, source, ts }) {
  return {
    id: String(id),
    lat: Number(lat),
    lng: Number(lng),
    intensity: clampIntensity(intensity),
    title: String(title ?? 'Incident'),
    source,
    ts: ts ? new Date(ts).toISOString() : new Date().toISOString(),
  };
}

function clampIntensity(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 'low';
  if (n >= 5) return 'high';
  if (n >= 3) return 'medium';
  return 'low';
}

/** USGS earthquakes — past day, M2.5+. Zero auth, CORS-enabled. */
async function fetchUsgs({ signal, bbox = ZIMBABWE_BBOX } = {}) {
  const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`USGS ${res.status}`);
  const geo = await res.json();

  const features = Array.isArray(geo?.features) ? geo.features : [];
  return features
    .filter((f) => {
      const [lng, lat] = f?.geometry?.coordinates ?? [];
      return (
        Number.isFinite(lng) && Number.isFinite(lat) &&
        lat <= bbox.north && lat >= bbox.south &&
        lng >= bbox.west && lng <= bbox.east
      );
    })
    .slice(0, MAX_POINTS)
    .map((f) => {
      const [lng, lat] = f.geometry.coordinates;
      return normalise({
        id: f.id,
        lat, lng,
        intensity: f.properties?.mag,
        title: f.properties?.place,
        source: 'USGS',
        ts: f.properties?.time,
      });
    });
}

/**
 * NASA FIRMS active-fire hotspots. Requires a free MAP_KEY from
 * https://firms.modaps.eosdis.nasa.gov/api/map_key/.
 * Endpoint returns CSV; we parse the first N rows.
 */
async function fetchFirms({ signal, bbox = ZIMBABWE_BBOX, apiKey } = {}) {
  if (!apiKey) throw new Error('FIRMS: VITE_FIRMS_MAP_KEY not set');
  const area = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${apiKey}/VIIRS_SNPP_NRT/${area}/1`;
  const res = await fetch(url, { signal, headers: { Accept: 'text/csv' } });
  if (!res.ok) throw new Error(`FIRMS ${res.status}`);
  const csv = await res.text();

  const [header, ...rows] = csv.trim().split('\n');
  const cols = header.split(',');
  const idx = (name) => cols.indexOf(name);
  const iLat = idx('latitude');
  const iLng = idx('longitude');
  const iBright = idx('bright_ti4');
  const iDate = idx('acq_date');
  const iTime = idx('acq_time');
  if (iLat < 0 || iLng < 0) return [];

  return rows.slice(0, MAX_POINTS).map((row, i) => {
    const parts = row.split(',');
    return normalise({
      id: `firms-${i}`,
      lat: parts[iLat],
      lng: parts[iLng],
      intensity: (Number(parts[iBright]) - 300) / 20,
      title: 'Active fire',
      source: 'NASA FIRMS',
      ts: `${parts[iDate]}T${(parts[iTime] ?? '0000').padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2')}:00Z`,
    });
  });
}

/** Sample data used in low-data mode or when a provider fetch fails. */
const LOCAL_SEED = [
  { id: 'local-1', lat: -17.82, lng: 31.05, intensity: 5, title: 'Harare North — suspected clearing', source: 'Community' },
  { id: 'local-2', lat: -17.78, lng: 31.08, intensity: 3, title: 'Borrowdale East — disputed stand', source: 'Community' },
  { id: 'local-3', lat: -20.15, lng: 28.58, intensity: 4, title: 'Bulawayo — unverified sale',       source: 'Community' },
  { id: 'local-4', lat: -18.97, lng: 32.67, intensity: 2, title: 'Mutare — permit review',          source: 'Community' },
];

function fetchLocal() {
  return Promise.resolve(LOCAL_SEED.map(normalise));
}

/**
 * Pick a provider at runtime. Returns a loader function with the signature
 * `(opts?: { signal? }) => Promise<Hotspot[]>`. Never throws on config
 * errors; falls back to `local` and reports the reason.
 *
 * @returns {{ loader: (opts?:{signal?:AbortSignal}) => Promise<Array>, name: string, reason?: string }}
 */
export function resolveHotspotProvider() {
  const env = typeof import.meta !== 'undefined' ? (import.meta.env ?? {}) : {};
  const requested = String(env.VITE_HOTSPOT_PROVIDER ?? 'usgs').toLowerCase();
  const firmsKey = env.VITE_FIRMS_MAP_KEY;

  if (requested === 'firms') {
    if (!firmsKey) {
      return { name: 'local', reason: 'FIRMS requested but VITE_FIRMS_MAP_KEY missing', loader: fetchLocal };
    }
    return { name: 'firms', loader: (opts) => fetchFirms({ ...opts, apiKey: firmsKey }) };
  }
  if (requested === 'local') {
    return { name: 'local', loader: fetchLocal };
  }
  // Default: USGS with local fallback baked in at the call site.
  return { name: 'usgs', loader: fetchUsgs };
}

export const __internals = { normalise, clampIntensity, LOCAL_SEED, MAX_POINTS };
