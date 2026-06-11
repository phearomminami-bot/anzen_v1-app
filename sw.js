/* Anzen PWA service worker — app-shell caching + offline support.
   Bump CACHE when the shell needs to be refreshed. */
const CACHE = 'anzen-shell-v5';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'favicon-32.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function staleWhileRevalidate(request, url) {
  return caches.match(request).then((cached) => {
    const network = fetch(request).then((res) => {
      // Cache successful same-origin or CORS/opaque CDN assets (React, Supabase lib, fonts).
      if (res && (res.status === 200 || res.type === 'opaque')) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
      }
      return res;
    }).catch(() => cached);
    return cached || network;
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                 // never touch Supabase writes (POST/PATCH)
  let url;
  try { url = new URL(req.url); } catch (e) { return; }
  // Never cache live API data — always go to the network so data stays fresh.
  if (url.hostname.endsWith('supabase.co')) return;

  // Page navigations: network-first so an online user always gets the latest
  // build; fall back to the cached app shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Everything else (app assets + CDN libs + fonts): stale-while-revalidate.
  event.respondWith(staleWhileRevalidate(req, url));
});
