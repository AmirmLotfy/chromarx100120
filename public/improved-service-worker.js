
// Improved Service Worker for Bookmark Manager
// Version 1.0.0

// Check if Chrome extension APIs are available
const isChromeExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
console.log(`Running in ${isChromeExtension ? 'Chrome Extension' : 'Web'} context`);

const CACHE_NAME = 'bookmark-manager-cache-v1';
const OFFLINE_PAGE = '/offline.html';
const CACHED_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/logo.png',
  '/icon48.png',
  '/icon128.png'
];

// Install event - Cache critical assets for offline use
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker...');
  
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
  
  // Cache critical files
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell and content');
      return cache.addAll(CACHED_ASSETS);
    })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker...');
  
  // Clean up old cache versions
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients for latest version');
      return self.clients.claim();
    })
  );
});

// Fetch event - Handle network requests with a cache-first strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip Chrome extension requests and supabase API calls
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/chrome-extension') || 
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.in')
  ) {
    return;
  }
  
  // Handle API requests separately with a network-first approach
  if (url.pathname.includes('/api/') || url.hostname.includes('api.')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For all other requests, use a cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful responses
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // If the request is for an HTML document, serve the offline page
            if (event.request.headers.get('Accept').includes('text/html')) {
              return caches.match(OFFLINE_PAGE);
            }
            
            // For other requests that fail, return a simple error response
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Handle message events
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Received Message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Handle online/offline status messages
  if (event.data && event.data.type === 'ONLINE_STATUS_CHANGE') {
    // This could trigger actions like syncing data when coming back online
    console.log('[Service Worker] Online status changed:', event.data.isOnline);
    
    // Notify all clients of online status change
    self.clients.matchAll().then((clients) => {
      clients.forEach(client => {
        client.postMessage({
          type: 'ONLINE_STATUS_UPDATE',
          isOnline: event.data.isOnline
        });
      });
    });
  }
});

// Background sync for offline queue
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background Sync:', event.tag);
  
  if (event.tag === 'sync-bookmarks') {
    event.waitUntil(syncBookmarks());
  }
});

// Function to handle background sync
async function syncBookmarks() {
  try {
    // Notify the app to process the offline queue
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PROCESS_OFFLINE_QUEUE'
      });
    });
    return true;
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
    return false;
  }
}

// Periodically check connection status
if (!isChromeExtension) {
  // Only use setInterval in web context, not in extension
  setInterval(() => {
    fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' })
      .then(() => {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'ONLINE_STATUS_UPDATE',
              isOnline: true
            });
          });
        });
      })
      .catch(() => {
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'ONLINE_STATUS_UPDATE',
              isOnline: false
            });
          });
        });
      });
  }, 30000);
}

// Chrome extension specific handlers
if (isChromeExtension) {
  try {
    console.log('[Service Worker] Setting up Chrome extension handlers');
    
    // Chrome Extension background script functionality would go here
    // But we use conditional checks to ensure these only run in extension context
    
  } catch (error) {
    console.error('[Service Worker] Failed to initialize extension features:', error);
  }
}

console.log('[Service Worker] Service Worker Registered');
