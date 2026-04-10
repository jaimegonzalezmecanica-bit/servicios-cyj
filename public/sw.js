// Service Worker - Servicios Integrales CyJ
const CACHE_NAME = 'cyj-security-v2.1.0';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/download/logo-cyj.png',
  '/download/icon-192.png',
  '/download/icon-512.png',
  '/download/icon-maskable.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API calls - always network
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response and cache it
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If request is for a page, return the cached home page
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});

// Background sync for SOS alerts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sos-alert') {
    event.waitUntil(
      // Retry any failed SOS requests
      self.registration.showNotification('SOS CyJ', {
        body: 'Tu alerta SOS fue enviada correctamente.',
        icon: '/download/icon-192.png',
        badge: '/download/icon-192.png',
        vibrate: [200, 100, 200],
        tag: 'sos',
        renotify: true,
      })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'Servicios Integrales CyJ', body: 'Nueva alerta comunitaria' };
  if (event.data) {
    try { data = event.data.json(); } catch (e) { /* use defaults */ }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/download/icon-192.png',
      badge: '/download/icon-192.png',
      vibrate: [100, 50, 100],
      tag: 'cyj-alert',
      renotify: true,
      actions: [
        { action: 'view', title: 'Ver Alerta' },
        { action: 'dismiss', title: 'Ignorar' },
      ],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});
