const CACHE_NAME = 'wear-weather-v0.6.0';
const STATIC_ASSETS = ['/', '/manifest.json', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(key => key.startsWith('wear-weather-v')).map(async (key) => {
        // Older workers stored API responses with the entire query string as the key.
        const cache = await caches.open(key);
        const requests = await cache.keys();
        await Promise.all(requests.filter(request => isLocalApi(new URL(request.url)))
          .map(request => cache.delete(request)));
      }))
    ).then(() => self.clients.claim())
  );
});

function isLocalApi(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/api/');
}

function isWeatherRequest(url) {
  const path = url.pathname.replace(/\/$/, '');
  return path === '/api/weather' || path === '/api/route';
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!isLocalApi(url)) return;
  event.respondWith(fetch(request, { cache: 'no-store' }).catch(() => {
    const body = url.pathname.replace(/\/$/, '') === '/api/health'
      ? { status: 'unavailable' }
      : { error: isWeatherRequest(url) ? 'Weather unavailable offline' : 'API unavailable offline' };
    return new Response(JSON.stringify(body), {
      status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }));
});
