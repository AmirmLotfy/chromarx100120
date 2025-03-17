
// Optimized Service Worker for Bookmark Manager
// Version 1.0.0

// Check if Chrome extension APIs are available
const isChromeExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
console.log(`Running in ${isChromeExtension ? 'Chrome Extension' : 'Web'} context`);

const CACHE_NAME = 'bookmarks-cache-v1';
const OFFLINE_PAGE = '/offline.html';
const CACHED_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/logo.png'
];

// Performance optimization: Use a dedicated cache for API responses
const API_CACHE_NAME = 'bookmarks-api-cache-v1';
const STATIC_CACHE_NAME = 'bookmarks-static-cache-v1';

// Background tasks queue storage
let backgroundTasksQueue = [];
const TASK_STORAGE_KEY = 'sw-background-tasks';

// Retrieve stored tasks from IndexedDB
const openTasksDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('BackgroundTasksDB', 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('tasks')) {
        db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject('Error opening tasks database');
  });
};

// Load existing tasks when service worker starts
const loadStoredTasks = async () => {
  try {
    const db = await openTasksDB();
    const transaction = db.transaction(['tasks'], 'readonly');
    const store = transaction.objectStore('tasks');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        backgroundTasksQueue = event.target.result || [];
        console.log(`[Service Worker] Loaded ${backgroundTasksQueue.length} stored tasks`);
        resolve(backgroundTasksQueue);
      };
      request.onerror = (event) => reject('Error loading tasks');
    });
  } catch (error) {
    console.error('[Service Worker] Failed to load stored tasks:', error);
    return [];
  }
};

// Save tasks to IndexedDB
const saveTasksToStorage = async (tasks) => {
  try {
    const db = await openTasksDB();
    const transaction = db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    
    // Clear existing tasks
    await new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = resolve;
      clearRequest.onerror = reject;
    });
    
    // Add new tasks
    for (const task of tasks) {
      store.add(task);
    }
    
    console.log(`[Service Worker] Saved ${tasks.length} tasks to storage`);
  } catch (error) {
    console.error('[Service Worker] Failed to save tasks:', error);
  }
};

// Install event - Cache critical assets for offline use
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Optimized Service Worker...');
  
  // Skip waiting to activate the new service worker immediately
  self.skipWaiting();
  
  // Cache critical files
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell and content');
      return cache.addAll(CACHED_ASSETS);
    }).then(() => {
      return loadStoredTasks();
    })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Optimized Service Worker...');
  
  // Clean up old cache versions
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== STATIC_CACHE_NAME && 
            cacheName !== API_CACHE_NAME
          ) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients for latest version');
      return self.clients.claim();
    }).then(() => {
      // Process any pending background tasks on activation
      return processBackgroundTasks();
    })
  );
});

// Process background tasks
const processBackgroundTasks = async () => {
  if (backgroundTasksQueue.length === 0) return;
  
  console.log(`[Service Worker] Processing ${backgroundTasksQueue.length} background tasks`);
  
  // Process tasks in batches
  const batchSize = 5;
  let tasksToProcess = [...backgroundTasksQueue];
  let processedTasks = [];
  let failedTasks = [];
  
  try {
    for (let i = 0; i < tasksToProcess.length; i += batchSize) {
      const batch = tasksToProcess.slice(i, i + batchSize);
      
      // Process each batch in parallel
      const batchResults = await Promise.allSettled(batch.map(async (task) => {
        try {
          // Process task based on type
          switch (task.type) {
            case 'PROCESS_BATCH':
              // Just a placeholder, actual processing will be delegated to the client
              return { success: true, taskId: task.id };
              
            case 'SYNC_DATA':
              // Notify client to sync data
              notifyClients('SYNC_REQUEST', { taskId: task.id });
              return { success: true, taskId: task.id };
              
            default:
              console.warn(`[Service Worker] Unknown task type: ${task.type}`);
              return { success: false, taskId: task.id, error: 'Unknown task type' };
          }
        } catch (error) {
          console.error(`[Service Worker] Task processing error:`, error);
          return { success: false, taskId: task.id, error: error.message };
        }
      }));
      
      // Process results
      batchResults.forEach((result, index) => {
        const task = batch[index];
        if (result.status === 'fulfilled' && result.value.success) {
          processedTasks.push(task);
        } else {
          // Increment retry count and maybe try again later
          task.retries = (task.retries || 0) + 1;
          if (task.retries < 3) {
            failedTasks.push(task);
          } else {
            processedTasks.push(task); // Give up after 3 retries
            console.error(`[Service Worker] Giving up on task after ${task.retries} retries`);
          }
        }
      });
      
      // Update clients on progress
      const progress = Math.round((i + batch.length) / tasksToProcess.length * 100);
      notifyClients('BACKGROUND_PROGRESS', { progress, total: tasksToProcess.length, processed: processedTasks.length });
    }
  } catch (error) {
    console.error('[Service Worker] Error processing background tasks:', error);
  }
  
  // Update queue with remaining tasks
  backgroundTasksQueue = failedTasks;
  
  // Save updated tasks
  await saveTasksToStorage(backgroundTasksQueue);
  
  // Notify clients about completion
  notifyClients('BACKGROUND_COMPLETE', {
    processed: processedTasks.length,
    remaining: failedTasks.length
  });
  
  console.log(`[Service Worker] Background processing complete. Processed: ${processedTasks.length}, Failed: ${failedTasks.length}`);
};

// Notify all clients
const notifyClients = async (type, data) => {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type,
      ...data
    });
  });
};

// Fetch event with optimized strategies for different request types
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Don't intercept Chrome extension requests
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/chrome-extension') || 
    url.hostname.includes('chrome-extension')
  ) {
    return;
  }
  
  // Handle API requests with a network-first, then cache strategy
  if (url.pathname.includes('/api/') || url.hostname.includes('api.')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(API_CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For HTML requests, use a cache-first strategy but update the cache in the background
  if (event.request.headers.get('Accept').includes('text/html')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached response immediately if available
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              // Update the cache with the new response
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                });
              return networkResponse;
            })
            .catch(() => {
              // If fetch fails and we don't have a cached response, show offline page
              if (!response) {
                return caches.match(OFFLINE_PAGE);
              }
              return response;
            });
          
          return response || fetchPromise;
        })
    );
    return;
  }
  
  // For all other requests, use a cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          // Even if we have a cached response, fetch in the background to update the cache
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                caches.open(STATIC_CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, networkResponse);
                  });
              }
            })
            .catch(() => {
              // Silently fail as we already have a cached response
            });
          
          return response;
        }
        
        // If not cached, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Clone the response to cache it and return it
            const responseToCache = networkResponse.clone();
            
            if (networkResponse.ok) {
              caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            
            return networkResponse;
          })
          .catch(() => {
            // If request fails and it's an image, return a fallback
            if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
              return new Response(
                `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            
            // For other resource types, return a simple error
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Handle message events for communication with the application
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (!data) return;
  
  console.log('[Service Worker] Received message:', data.type);
  
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'ONLINE_STATUS_CHANGE':
      // Notify all clients of online status change
      self.clients.matchAll().then((clients) => {
        clients.forEach(client => {
          client.postMessage({
            type: 'ONLINE_STATUS_UPDATE',
            isOnline: data.isOnline
          });
        });
      });
      break;
      
    case 'CLEAR_CACHE':
      // Clear all caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        // Notify clients cache was cleared
        self.clients.matchAll().then((clients) => {
          clients.forEach(client => {
            client.postMessage({
              type: 'CACHE_CLEARED'
            });
          });
        });
      });
      break;
      
    case 'ADD_BACKGROUND_TASK':
      // Add task to background processing queue
      if (data.task) {
        backgroundTasksQueue.push({
          ...data.task,
          added: Date.now(),
          retries: 0
        });
        saveTasksToStorage(backgroundTasksQueue);
        console.log(`[Service Worker] Added background task. Queue size: ${backgroundTasksQueue.length}`);
        
        // Process tasks immediately if online
        if (navigator.onLine) {
          processBackgroundTasks();
        }
      }
      break;
      
    case 'GET_BACKGROUND_TASKS':
      // Return current tasks to the client that asked
      if (event.source) {
        event.source.postMessage({
          type: 'BACKGROUND_TASKS',
          tasks: backgroundTasksQueue
        });
      }
      break;
      
    case 'PROCESS_BACKGROUND_TASKS':
      // Manually trigger background processing
      processBackgroundTasks();
      break;
      
    case 'TASK_COMPLETED':
      // Remove a completed task from the queue
      if (data.taskId) {
        backgroundTasksQueue = backgroundTasksQueue.filter(task => task.id !== data.taskId);
        saveTasksToStorage(backgroundTasksQueue);
        console.log(`[Service Worker] Removed completed task ${data.taskId}. Remaining: ${backgroundTasksQueue.length}`);
      }
      break;
  }
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookmarks') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach(client => {
          client.postMessage({
            type: 'PROCESS_OFFLINE_QUEUE'
          });
        });
      }).then(() => {
        return processBackgroundTasks();
      })
    );
  }
});

// Handle periodic sync for background tasks
if ('periodicSync' in self.registration) {
  // Try to process background tasks periodically
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'process-background-tasks') {
      event.waitUntil(processBackgroundTasks());
    }
  });
}

// If online status changes, try to process tasks
self.addEventListener('online', () => {
  console.log('[Service Worker] Device came online, processing background tasks');
  processBackgroundTasks();
});

// Only use periodic sync in web context to conserve resources in extension
if (!isChromeExtension && 'periodicSync' in self.registration) {
  // Register for periodic sync if supported
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-updates') {
      event.waitUntil(
        self.clients.matchAll().then((clients) => {
          clients.forEach(client => {
            client.postMessage({
              type: 'CHECK_FOR_UPDATES'
            });
          });
        })
      );
    }
  });
}

// If in Chrome extension, set up limited extension handling
if (isChromeExtension) {
  try {
    // Minimal extension-specific handling
    console.log('[Service Worker] Running in extension context with minimal overhead');
  } catch (error) {
    console.error('[Service Worker] Failed to set up extension features:', error);
  }
}

console.log('[Service Worker] Optimized Service Worker Registered');
