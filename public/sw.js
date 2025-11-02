const CACHE_NAME = 'hr-studio-360-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

const isDevelopment = () => {
  return self.location.hostname === 'localhost' ||
         self.location.hostname === '127.0.0.1' ||
         self.location.hostname.includes('local');
};

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');

  if (isDevelopment()) {
    console.log('Development mode detected - skipping cache population');
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache).catch((err) => {
          console.log('Cache addAll error:', err);
        });
      })
      .catch((err) => {
        console.log('Cache open error:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/functions/v1/') ||
      event.request.url.includes('supabase.co') ||
      event.request.url.includes('localhost') ||
      isDevelopment()) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
      .catch(() => {
        return caches.match('/index.html');
      })
  );
});
