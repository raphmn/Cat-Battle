const CACHE_NAME = 'catbattle-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/audio/ost1.mp3',
  '/audio/menu_click.mp3',
];

// Installation : pré-cache la coquille de base (pour le hors-ligne).
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).catch(() => {})
  );
  self.skipWaiting();
});

// Activation : supprime les anciens caches et prend le contrôle immédiatement.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : null)))
    )
  );
  self.clients.claim();
});

// Network-first : on tente TOUJOURS le réseau (code à jour), le cache ne sert
// que de repli hors-ligne. Évite de resservir un ancien build.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        try {
          if (response && response.ok && new URL(event.request.url).origin === self.location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
          }
        } catch (e) {
          /* ignore */
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
