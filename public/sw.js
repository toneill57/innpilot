const CACHE_NAME = 'innpilot-v1.0.0';
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE_NAME = `${CACHE_NAME}-dynamic`;

// Files to cache on install
const STATIC_FILES = [
  '/',
  '/muva',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // Add other critical assets here
];

// API endpoints to cache with different strategies
const API_ENDPOINTS = {
  '/api/health': 'networkFirst',
  '/api/muva/health': 'networkFirst',
  '/api/chat': 'networkFirst',
  '/api/muva/chat': 'networkFirst'
};

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Skip waiting...');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients...');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets and pages
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const strategy = API_ENDPOINTS[url.pathname] || 'networkFirst';

  try {
    if (strategy === 'networkFirst') {
      // Try network first, fallback to cache
      try {
        const networkResponse = await fetch(request);

        // Cache successful responses
        if (networkResponse.ok) {
          const cache = await caches.open(DYNAMIC_CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }

        return networkResponse;
      } catch (networkError) {
        console.log('[SW] Network failed, trying cache for:', url.pathname);
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
          return cachedResponse;
        }

        // Return offline response for specific endpoints
        return createOfflineResponse(url.pathname);
      }
    }
  } catch (error) {
    console.error('[SW] API request failed:', error);
    return createOfflineResponse(url.pathname);
  }
}

// Handle static requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Fallback to network
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Static request failed:', error);

    // Return fallback for pages
    if (request.destination === 'document') {
      const cachedFallback = await caches.match('/');
      if (cachedFallback) {
        return cachedFallback;
      }
    }

    return new Response('Offline', { status: 503 });
  }
}

// Create offline responses for API endpoints
function createOfflineResponse(pathname) {
  const offlineResponses = {
    '/api/health': {
      status: 'offline',
      message: 'Sistema offline. Intenta más tarde.',
      timestamp: new Date().toISOString()
    },
    '/api/muva/health': {
      status: 'offline',
      message: 'MUVA offline. Intenta más tarde.',
      timestamp: new Date().toISOString()
    },
    '/api/chat': {
      error: 'Sin conexión',
      message: 'No hay conexión a internet. Reconecta para usar el chat SIRE.',
      offline: true
    },
    '/api/muva/chat': {
      error: 'Sin conexión',
      message: '🏝️ MUVA está offline. Reconecta para explorar San Andrés.',
      offline: true
    }
  };

  const responseData = offlineResponses[pathname] || {
    error: 'Offline',
    message: 'Sin conexión a internet'
  };

  return new Response(JSON.stringify(responseData), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  });
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  // For example, retry failed API requests
  console.log('[SW] Performing background sync...');
}

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva notificación de InnPilot',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('InnPilot', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('[SW] Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('[SW] Unhandled promise rejection:', event.reason);
});