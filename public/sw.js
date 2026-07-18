// Minimal service worker — exists purely to satisfy PWA installability
// criteria (Chrome requires a registered service worker with a fetch
// handler). It doesn't cache anything; every request just goes to the
// network as normal, so the site always shows fresh content.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
