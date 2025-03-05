
// ChroMarx Service Worker
console.log('ChroMarx Service Worker Initialized');

// Cache name for offline support
const CACHE_NAME = 'chromarx-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/icon16.png',
  '/icon48.png',
  '/icon128.png',
  '/notification.mp3'
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  
  // Force the waiting service worker to become active
  self.skipWaiting();
  
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching Files');
        return cache.addAll(urlsToCache);
      })
      .then(() => console.log('Service Worker: All Files Cached'))
      .catch(error => console.error('Service Worker: Cache Failed:', error))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  
  // Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of clients immediately
  return self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // API requests should not be cached
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('supabase') || 
      url.hostname.includes('googleapis')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // If not in cache, fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Add response to cache for future offline use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // If fetch fails (offline), try to serve a fallback
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Chrome Extension specific API handlers
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // First time installation
    chrome.storage.local.set({ installDate: Date.now() });
  } else if (details.reason === 'update') {
    // Extension was updated
    console.log('Updated from version', details.previousVersion);
  }
});

// Handle the browser action (icon) being clicked
chrome.action.onClicked.addListener((tab) => {
  // Open the side panel
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
  console.log('Command triggered:', command);
  
  switch (command) {
    case 'toggle-theme':
      chrome.runtime.sendMessage({ action: 'toggle-theme' });
      break;
    case 'quick-add':
      // Get the current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.runtime.sendMessage({ 
            action: 'quick-add-bookmark',
            url: tabs[0].url,
            title: tabs[0].title
          });
        }
      });
      break;
    case 'advanced-search':
      chrome.runtime.sendMessage({ action: 'open-advanced-search' });
      break;
  }
});

// Handle CORS preflight requests
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'OPTIONS') {
    // Respond to CORS preflight requests
    event.respondWith(
      new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400'
        }
      })
    );
  }
});
