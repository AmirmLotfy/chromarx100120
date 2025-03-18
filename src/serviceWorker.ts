
/**
 * Service Worker
 * Handles background processing using the Streams API
 */

import { handleMessage } from './utils/backgroundTaskManager';

// Initialize cache storage for the service worker
const CACHE_NAME = 'bookmark-manager-cache-v1';

// Register message handler
self.addEventListener('message', event => {
  // Forward to the message handler
  handleMessage(
    event.data,
    { id: 'internal' } as chrome.runtime.MessageSender,
    (response) => {
      if (response) {
        // Send response back to the client
        event.source?.postMessage(response);
      }
    }
  );
});

// Listen for Chrome extension messages
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Return true to indicate we will respond asynchronously
    return handleMessage(message, sender, sendResponse);
  });
  
  // Set up alarm listener for scheduled tasks
  if (chrome.alarms) {
    chrome.alarms.onAlarm.addListener((alarm) => {
      console.log('Alarm fired:', alarm.name);
      
      // Parse the alarm data from the name (JSON-encoded)
      try {
        const alarmData = JSON.parse(alarm.name);
        
        if (alarmData && alarmData.type) {
          // Process the alarm based on its type
          handleAlarm(alarmData);
        }
      } catch (error) {
        console.error('Error parsing alarm data:', error);
      }
    });
  }
}

// Cache essential resources for offline use
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service worker installing...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  // Cache essential resources
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/offline.html'
      ]);
    })
  );
});

// Clean up old caches when activated
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service worker activating...');
  
  // Claim clients so the service worker is in control without reloading
  (self as any).clients.claim();
  
  // Delete old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle fetch events for network/cache strategy
self.addEventListener('fetch', (event: FetchEvent) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // Network-first strategy with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response to store in cache
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If not in cache, return the offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
          
          // For other resources, return a simple error response
          return new Response('Network error occurred', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

/**
 * Handle alarm events from chrome.alarms
 */
function handleAlarm(alarmData: any) {
  switch (alarmData.type) {
    case 'SCHEDULED_TASK':
      handleScheduledTask(alarmData);
      break;
      
    case 'SYNC_BOOKMARKS':
      handleBookmarkSync(alarmData);
      break;
      
    case 'CLEANUP':
      handleCleanup(alarmData);
      break;
      
    default:
      console.warn('Unknown alarm type:', alarmData.type);
  }
}

/**
 * Handle a scheduled task
 */
function handleScheduledTask(taskData: any) {
  // Process the scheduled task
  handleMessage(
    {
      type: 'PROCESS_TASK',
      taskId: taskData.taskId
    },
    { id: 'alarm' } as chrome.runtime.MessageSender,
    (response) => {
      console.log('Task processed:', response);
      
      // Store task result in chrome.storage.local
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          [`task_result_${taskData.taskId}`]: {
            ...response,
            completedAt: Date.now()
          }
        });
      }
    }
  );
}

/**
 * Handle bookmark synchronization
 */
function handleBookmarkSync(syncData: any) {
  // Process bookmark synchronization
  handleMessage(
    {
      type: 'SYNC_BOOKMARKS',
      options: syncData.options
    },
    { id: 'alarm' } as chrome.runtime.MessageSender,
    (response) => {
      console.log('Bookmarks synced:', response);
      
      // Store sync result in chrome.storage.local
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          last_bookmark_sync: {
            timestamp: Date.now(),
            result: response
          }
        });
      }
      
      // Notify all clients about the sync completion
      (self as any).clients.matchAll().then((clients: any[]) => {
        clients.forEach(client => {
          client.postMessage({
            type: 'BOOKMARK_SYNC_COMPLETED',
            result: response
          });
        });
      });
    }
  );
}

/**
 * Handle cleanup operations
 */
function handleCleanup(cleanupData: any) {
  // Clean up old data, expired caches, etc.
  console.log('Running cleanup operation:', cleanupData);
  
  // Clean up old task results from storage
  if (chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(null, (items) => {
      const keysToRemove = [];
      const now = Date.now();
      const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const key in items) {
        // Remove old task results
        if (key.startsWith('task_result_')) {
          const result = items[key];
          if (result.completedAt && (now - result.completedAt > MAX_AGE)) {
            keysToRemove.push(key);
          }
        }
      }
      
      if (keysToRemove.length > 0) {
        chrome.storage.local.remove(keysToRemove, () => {
          console.log(`Cleaned up ${keysToRemove.length} old task results`);
        });
      }
    });
  }
  
  // Clean up expired cache entries
  caches.open(CACHE_NAME).then(cache => {
    cache.keys().then(requests => {
      const now = Date.now();
      const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      requests.forEach(request => {
        cache.match(request).then(response => {
          if (response) {
            const dateHeader = response.headers.get('date');
            if (dateHeader) {
              const date = new Date(dateHeader).getTime();
              if (now - date > MAX_AGE) {
                cache.delete(request).then(() => {
                  console.log('Removed expired cache entry:', request.url);
                });
              }
            }
          }
        });
      });
    });
  });
}

console.log('Stream processing service worker initialized');

// Add type definition to make TypeScript happy with service worker scope
declare var self: ServiceWorkerGlobalScope;
