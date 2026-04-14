/**
 * BIGMAMA$ service worker.
 *
 * On install: self-unregister and nuke every cache this SW (or a previous
 * version) owns. Acts as a kill-switch for any stale SW that a dev was
 * accidentally serving from an earlier preview build.
 *
 * This keeps the PWA manifest + install surface around (the manifest doesn't
 * require an active SW to be installable) while removing the fetch handler
 * that was blocking /node_modules/.vite/deps in dev.
 *
 * A proper fetch-handling SW will ship in a follow-up commit with explicit
 * allowlists for the app shell and hard skips for /node_modules, /@vite,
 * query-stringed URLs, and /api/*.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) {
        try { client.navigate(client.url); } catch { /* noop */ }
      }
    })()
  );
});
