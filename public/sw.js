const CACHE_NAME = 'catbattle-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/audio/ost1.mp3',
  '/audio/menu_click.mp3',
  '/favicon.svg',
  '/src/main.js',
  '/src/style.css'
];

// Installation du Service Worker et mise en cache des assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interception des requêtes réseau (Cache First strategy)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retourne la réponse en cache si elle existe, sinon fait la requête réseau
      return response || fetch(event.request).catch(() => {
        // Fallback optionnel si hors-ligne
        console.warn('Network fetch failed and asset not in cache:', event.request.url);
      });
    })
  );
});
