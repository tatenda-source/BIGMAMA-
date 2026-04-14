/**
 * BIGMAMA$ service worker.
 *
 * Strategy:
 *  - App shell (HTML, JS, CSS, icons) cached with stale-while-revalidate so
 *    returning offline users still load the UI instantly.
 *  - API / report submissions are NEVER cached — whistleblower data must not
 *    live in shared HTTP caches. Those requests pass through untouched.
 *  - On `message: {type: 'WIPE'}` the worker self-unregisters and deletes
 *    every cache it owns so the emergency-wipe flow from src/lib/wipe.js can
 *    reliably scrub the service-worker layer.
 */

const SHELL_CACHE = 'bigmama-shell-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg',
  '/manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache reports or anything marked no-store.
  if (url.pathname.startsWith('/api/') || request.headers.get('cache-control') === 'no-store') {
    return;
  }

  // Same-origin app-shell: stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'WIPE') {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.registration.unregister())
    );
  }
});
