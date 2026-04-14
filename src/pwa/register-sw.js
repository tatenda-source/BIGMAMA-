/**
 * Register the BIGMAMA$ service worker.
 *
 * Idempotent — safe to call multiple times. Returns the registration (or null
 * if service workers are unsupported / disabled by the user).
 */

export async function registerServiceWorker({ url = '/sw.js', scope = '/' } = {}) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  if (import.meta?.env?.DEV) return null;

  try {
    const registration = await navigator.serviceWorker.register(url, { scope });
    return registration;
  } catch {
    return null;
  }
}

export async function unregisterServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((r) => r.unregister()));
}

export async function wipeServiceWorker() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  registration?.active?.postMessage({ type: 'WIPE' });
  await unregisterServiceWorker();
}
