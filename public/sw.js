// Minimal service worker — exists purely to satisfy PWA installability
// criteria (Chrome requires a registered service worker with a fetch
// handler). It never intercepts or re-issues requests — every request
// goes straight to the network exactly as if there were no service
// worker at all, so it can never break a page load.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // Intentionally empty — not calling event.respondWith() means the
  // browser handles the request normally, with zero interference.
});
