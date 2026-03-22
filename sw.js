// Main service worker for GigsCourt PWA
const CACHE_NAME = 'gigscourt-v1';

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  // Let the browser handle all requests
  // This prevents the "Load failed" error
  event.respondWith(fetch(event.request).catch(() => {
    return new Response('Network error', { status: 408 });
  }));
});
