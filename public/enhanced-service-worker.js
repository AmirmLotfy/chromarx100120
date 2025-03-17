// Enhanced Service Worker for Chrome Extension
// Version 2.0.0

const CACHE_NAME = 'chromarx-cache-v2';
const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/icon16.png',
  '/icon48.png',
  '/icon128.png',
  '/logo.png',
  '/notification.mp3'
];

// Background sync tag names
const SYNC_TAGS = {
  BOOKMARKS: 'sync-bookmarks',
  CHAT: 'sync-chat-history',
  SETTINGS: 'sync-settings',
  OFFLINE_QUEUE: 'process-offline-queue'
};

// Periodic sync registration
const PERIODIC_SYNC = {
  HOURLY_CLEANUP: 'hourly-cleanup',
  DAILY_SYNC: 'daily-full-sync'
};

// Database constants
const DB_CONFIG = {
  DATABASE: 'enhanced-bookmark-manager-db',
  STORES: {
    BOOKMARKS: 'bookmarks',
    SYNC_QUEUE: 'syncQueue',
    SETTINGS: 'settings'
  }
};

// Centralized task scheduling
const TASKS = {
  CLEANUP: 'cleanup',
  PROCESS_QUEUE: 'process-queue',
  BACKUP: 'create-backup',
  UPDATE_CHECK: 'check-for-updates'
};

// Task intervals
const INTERVALS = {
  QUEUE_PROCESSING: 5 * 60 * 1000, // 5 minutes
  CONNECTIVITY_CHECK: 30 * 1000,   // 30 seconds
  CLEANUP: 60 * 60 * 1000,         // 1 hour
  UPDATE_CHECK: 24 * 60 * 60 * 1000 // 24 hours
};

// Control state
let isProcessingQueue = false;
let isOnline = true;
let pendingTasks = new Map();
let registeredPeriodicSyncs = new Set();

// ======================================================================
// Install Event - Cache Critical Assets
// ======================================================================
self.addEventListener('install', (event) => {
  console.log('[Enhanced Service Worker] Installing...');
  
  // Force the waiting service worker to become active
  self.skipWaiting();
  
  // Cache app shell assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Enhanced Service Worker] Caching app shell');
        return cache.addAll(APP_SHELL_ASSETS);
      })
      .then(() => {
        console.log('[Enhanced Service Worker] App shell cached successfully');
        
        // Initialize IndexedDB if needed
        return initializeDatabase();
      })
      .catch(error => {
        console.error('[Enhanced Service Worker] Cache failed:', error);
      })
  );
});

// ======================================================================
// Activate Event - Clean up old caches and take control
// ======================================================================
self.addEventListener('activate', (event) => {
  console.log('[Enhanced Service Worker] Activating...');
  
  // Remove old caches
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Enhanced Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Register for periodic background sync if supported
      registerPeriodicSyncs(),
      
      // Initialize alarms for scheduled tasks
      initializeAlarms(),
      
      // Set up initial connectivity status
      updateOnlineStatus()
    ])
    .then(() => {
      // Take control of clients immediately
      return self.clients.claim();
    })
  );
});

// ======================================================================
// Fetch Event - Network with cache fallback strategy
// ======================================================================
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and extension-specific URLs
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip Chrome extension and Supabase API requests
  if (
    url.pathname.startsWith('/chrome-extension') || 
    url.protocol === 'chrome-extension:' ||
    url.hostname.includes('supabase')
  ) {
    return;
  }
  
  // API requests - Network first, then cache
  if (url.pathname.startsWith('/api/') || url.hostname.includes('api.')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }
  
  // App shell requests - Cache first, then network
  if (APP_SHELL_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }
  
  // All other requests - Network with cache fallback
  event.respondWith(networkWithCacheFallbackStrategy(event.request));
});

// ======================================================================
// Background Sync Event - Process offline queue
// ======================================================================
self.addEventListener('sync', (event) => {
  console.log('[Enhanced Service Worker] Background Sync:', event.tag);
  
  if (event.tag === SYNC_TAGS.BOOKMARKS) {
    event.waitUntil(syncBookmarks());
  } else if (event.tag === SYNC_TAGS.CHAT) {
    event.waitUntil(syncChatHistory());
  } else if (event.tag === SYNC_TAGS.SETTINGS) {
    event.waitUntil(syncSettings());
  } else if (event.tag === SYNC_TAGS.OFFLINE_QUEUE) {
    event.waitUntil(processOfflineQueue());
  }
});

// ======================================================================
// Periodic Background Sync - Regular maintenance tasks
// ======================================================================
self.addEventListener('periodicsync', (event) => {
  console.log('[Enhanced Service Worker] Periodic Sync:', event.tag);
  
  if (event.tag === PERIODIC_SYNC.HOURLY_CLEANUP) {
    event.waitUntil(performCleanupTask());
  } else if (event.tag === PERIODIC_SYNC.DAILY_SYNC) {
    event.waitUntil(performFullSync());
  }
});

// ======================================================================
// Push Event - Handle notifications
// ======================================================================
self.addEventListener('push', (event) => {
  console.log('[Enhanced Service Worker] Push notification received');
  
  let data = {};
  
  try {
    data = event.data.json();
  } catch (e) {
    // If JSON parsing fails, get data as text
    data = {
      title: 'New Notification',
      body: event.data ? event.data.text() : 'No details provided'
    };
  }
  
  const options = {
    body: data.body || '',
    icon: '/icon128.png',
    badge: '/icon48.png',
    data: data.data || {},
    actions: data.actions || [],
    silent: data.silent || false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'ChroMarx Notification', options)
  );
});

// ======================================================================
// Notification Click Event - Handle user interaction with notifications
// ======================================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[Enhanced Service Worker] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Handle notification action clicks
  if (event.action) {
    console.log('[Enhanced Service Worker] Action clicked:', event.action);
    
    // Handle different actions
    switch (event.action) {
      case 'open-bookmark':
        // Open the bookmark URL if provided
        if (event.notification.data && event.notification.data.url) {
          event.waitUntil(
            openOrFocusURL(event.notification.data.url)
          );
        }
        break;
        
      case 'open-settings':
        // Open the settings page
        event.waitUntil(
          openOrFocusURL('/settings')
        );
        break;
        
      case 'process-sync':
        // Trigger a manual sync
        event.waitUntil(
          processOfflineQueue().then(() => {
            openOrFocusURL('/')
          })
        );
        break;
    }
    
    return;
  }
  
  // Default action when notification body is clicked - open the app
  event.waitUntil(
    openOrFocusURL(event.notification.data.url || '/')
  );
});

// ======================================================================
// Message Event - Handle communication with the main app
// ======================================================================
self.addEventListener('message', (event) => {
  console.log('[Enhanced Service Worker] Message received:', event.data.type);
  
  // Skip waiting and activate immediately if requested
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  
  // Update online status when changed
  if (event.data.type === 'ONLINE_STATUS_CHANGE') {
    isOnline = event.data.isOnline;
    
    // If we're back online, try to process the queue
    if (isOnline) {
      processOfflineQueue().catch(console.error);
    }
    
    // Notify all clients of the status change
    notifyAllClients({
      type: 'ONLINE_STATUS_UPDATE',
      isOnline
    });
    
    return;
  }
  
  // Handle different message types
  switch (event.data.type) {
    case 'SCHEDULE_TASK':
      scheduleTask(event.data.task, event.data.delay || 0, event.data.data);
      break;
      
    case 'CANCEL_TASK':
      cancelTask(event.data.taskId);
      break;
      
    case 'GET_SYNC_STATUS':
      getSyncStatus().then(status => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage(status);
        }
      });
      break;
      
    case 'PROCESS_QUEUE':
      processOfflineQueue()
        .then(() => {
          notifyAllClients({ type: 'QUEUE_PROCESSED' });
        })
        .catch(error => {
          console.error('[Enhanced Service Worker] Queue processing error:', error);
          notifyAllClients({ 
            type: 'QUEUE_PROCESSING_ERROR',
            error: error.message
          });
        });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches()
        .then(() => {
          notifyAllClients({ type: 'CACHE_CLEARED' });
        })
        .catch(error => {
          console.error('[Enhanced Service Worker] Cache clearing error:', error);
        });
      break;
      
    case 'UPDATE_SETTINGS':
      updateServiceWorkerSettings(event.data.settings)
        .then(() => {
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: true });
          }
        })
        .catch(error => {
          console.error('[Enhanced Service Worker] Settings update error:', error);
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({ success: false, error: error.message });
          }
        });
      break;
  }
});

// ======================================================================
// Chrome Extension Event Handlers
// ======================================================================

if (typeof chrome !== 'undefined' && chrome.runtime) {
  // Listen for extension install/update
  chrome.runtime.onInstalled.addListener((details) => {
    console.log('[Enhanced Service Worker] Extension installed:', details.reason);
    
    if (details.reason === 'install') {
      // First time installation
      chrome.storage.local.set({ installDate: Date.now() });
    } else if (details.reason === 'update') {
      // Extension was updated
      console.log('[Enhanced Service Worker] Updated from version', details.previousVersion);
    }
  });

  // Handle the browser action (icon) being clicked
  if (chrome.action) {
    chrome.action.onClicked.addListener((tab) => {
      // Open the side panel
      if (chrome.sidePanel) {
        chrome.sidePanel.open({ windowId: tab.windowId });
      }
    });
  }

  // Handle keyboard shortcuts
  if (chrome.commands) {
    chrome.commands.onCommand.addListener((command) => {
      console.log('[Enhanced Service Worker] Command triggered:', command);
      
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
  }
}

// ======================================================================
// Helper Functions
// ======================================================================

// Cache-first strategy
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cache valid responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[Enhanced Service Worker] Cache-first fetch failed:', error);
    return new Response('Network error', { status: 408 });
  }
}

// Network-first strategy
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache valid responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Enhanced Service Worker] Network fetch failed, falling back to cache');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Network error and no cached version available', { status: 408 });
  }
}

// Network with cache fallback strategy
async function networkWithCacheFallbackStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache valid responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Enhanced Service Worker] Network fetch failed, falling back to cache');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If the request is for an HTML document, serve the offline page
    if (request.headers.get('Accept').includes('text/html')) {
      return caches.match('/offline.html');
    }
    
    return new Response('Network error and no cached version available', { status: 408 });
  }
}

// Initialize IndexedDB database
async function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_CONFIG.DATABASE, 1);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(DB_CONFIG.STORES.SYNC_QUEUE)) {
        const syncQueueStore = db.createObjectStore(DB_CONFIG.STORES.SYNC_QUEUE, { keyPath: 'id' });
        syncQueueStore.createIndex('type', 'type', { unique: false });
        syncQueueStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncQueueStore.createIndex('status', 'status', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(DB_CONFIG.STORES.SETTINGS)) {
        db.createObjectStore(DB_CONFIG.STORES.SETTINGS, { keyPath: 'id' });
      }
    };
    
    request.onsuccess = () => {
      console.log('[Enhanced Service Worker] IndexedDB initialized');
      resolve();
    };
    
    request.onerror = (event) => {
      console.error('[Enhanced Service Worker] IndexedDB initialization error:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Register for periodic sync
async function registerPeriodicSyncs() {
  if ('periodicSync' in self.registration) {
    try {
      // Register for hourly cleanup
      await self.registration.periodicSync.register(PERIODIC_SYNC.HOURLY_CLEANUP, {
        minInterval: 60 * 60 * 1000 // 1 hour
      });
      registeredPeriodicSyncs.add(PERIODIC_SYNC.HOURLY_CLEANUP);
      
      // Register for daily full sync
      await self.registration.periodicSync.register(PERIODIC_SYNC.DAILY_SYNC, {
        minInterval: 24 * 60 * 60 * 1000 // 24 hours
      });
      registeredPeriodicSyncs.add(PERIODIC_SYNC.DAILY_SYNC);
      
      console.log('[Enhanced Service Worker] Periodic syncs registered');
    } catch (error) {
      console.error('[Enhanced Service Worker] Periodic sync registration error:', error);
    }
  } else {
    console.log('[Enhanced Service Worker] Periodic Sync not supported');
    // Set up alarms as fallback
    initializeAlarms();
  }
}

// Initialize alarms for scheduled tasks
function initializeAlarms() {
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    // Cleanup task
    chrome.alarms.create(TASKS.CLEANUP, {
      periodInMinutes: INTERVALS.CLEANUP / 60000
    });
    
    // Queue processing task
    chrome.alarms.create(TASKS.PROCESS_QUEUE, {
      periodInMinutes: INTERVALS.QUEUE_PROCESSING / 60000
    });
    
    // Update check task
    chrome.alarms.create(TASKS.UPDATE_CHECK, {
      periodInMinutes: INTERVALS.UPDATE_CHECK / 60000
    });
    
    // Listen for alarm events
    chrome.alarms.onAlarm.addListener((alarm) => {
      console.log('[Enhanced Service Worker] Alarm triggered:', alarm.name);
      
      switch (alarm.name) {
        case TASKS.CLEANUP:
          performCleanupTask();
          break;
        case TASKS.PROCESS_QUEUE:
          processOfflineQueue();
          break;
        case TASKS.UPDATE_CHECK:
          checkForUpdates();
          break;
      }
    });
    
    console.log('[Enhanced Service Worker] Alarms initialized');
  } else {
    // Fallback to setTimeout for non-Chrome environments
    setTimeout(() => performCleanupTask(), INTERVALS.CLEANUP);
    setTimeout(() => processOfflineQueue(), INTERVALS.QUEUE_PROCESSING);
    setTimeout(() => checkForUpdates(), INTERVALS.UPDATE_CHECK);
    
    // Set up recurring interval checks
    setInterval(() => performCleanupTask(), INTERVALS.CLEANUP);
    setInterval(() => processOfflineQueue(), INTERVALS.QUEUE_PROCESSING);
    setInterval(() => checkForUpdates(), INTERVALS.UPDATE_CHECK);
    
    console.log('[Enhanced Service Worker] Timers initialized as alarm fallback');
  }
  
  // Set up connectivity checking
  setInterval(() => updateOnlineStatus(), INTERVALS.CONNECTIVITY_CHECK);
  
  return Promise.resolve();
}

// Task scheduling
function scheduleTask(taskName, delay = 0, data = {}) {
  const taskId = `${taskName}-${Date.now()}`;
  
  console.log(`[Enhanced Service Worker] Scheduling task ${taskId} with delay ${delay}ms`);
  
  const timeoutId = setTimeout(() => {
    console.log(`[Enhanced Service Worker] Executing scheduled task ${taskId}`);
    
    switch (taskName) {
      case TASKS.CLEANUP:
        performCleanupTask();
        break;
      case TASKS.PROCESS_QUEUE:
        processOfflineQueue();
        break;
      case TASKS.BACKUP:
        createBackup(data);
        break;
      default:
        console.warn(`[Enhanced Service Worker] Unknown task type: ${taskName}`);
    }
    
    pendingTasks.delete(taskId);
  }, delay);
  
  pendingTasks.set(taskId, {
    timeoutId,
    taskName,
    data,
    scheduledTime: Date.now(),
    executionTime: Date.now() + delay
  });
  
  return taskId;
}

// Cancel a scheduled task
function cancelTask(taskId) {
  if (pendingTasks.has(taskId)) {
    const task = pendingTasks.get(taskId);
    clearTimeout(task.timeoutId);
    pendingTasks.delete(taskId);
    console.log(`[Enhanced Service Worker] Cancelled task ${taskId}`);
    return true;
  }
  return false;
}

// Update online status
async function updateOnlineStatus() {
  try {
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    const newOnlineStatus = response.ok;
    
    if (isOnline !== newOnlineStatus) {
      isOnline = newOnlineStatus;
      
      notifyAllClients({
        type: 'ONLINE_STATUS_UPDATE',
        isOnline
      });
      
      console.log(`[Enhanced Service Worker] Online status changed to ${isOnline ? 'online' : 'offline'}`);
      
      // If we just came back online, try to process the offline queue
      if (isOnline) {
        processOfflineQueue().catch(console.error);
      }
    }
  } catch (error) {
    if (isOnline) {
      isOnline = false;
      
      notifyAllClients({
        type: 'ONLINE_STATUS_UPDATE',
        isOnline: false
      });
      
      console.log('[Enhanced Service Worker] Device is offline');
    }
  }
}

// Sync bookmarks
async function syncBookmarks() {
  console.log('[Enhanced Service Worker] Syncing bookmarks...');
  
  if (!isOnline) {
    console.log('[Enhanced Service Worker] Device is offline, bookmarks will sync when online');
    return;
  }
  
  try {
    // Notify all clients to perform the sync
    notifyAllClients({
      type: 'SYNC_BOOKMARKS'
    });
    
    console.log('[Enhanced Service Worker] Bookmark sync message sent to clients');
    return true;
  } catch (error) {
    console.error('[Enhanced Service Worker] Bookmark sync failed:', error);
    return false;
  }
}

// Sync chat history
async function syncChatHistory() {
  console.log('[Enhanced Service Worker] Syncing chat history...');
  
  if (!isOnline) {
    console.log('[Enhanced Service Worker] Device is offline, chat history will sync when online');
    return;
  }
  
  try {
    // Notify all clients to perform the sync
    notifyAllClients({
      type: 'SYNC_CHAT_HISTORY'
    });
    
    console.log('[Enhanced Service Worker] Chat history sync message sent to clients');
    return true;
  } catch (error) {
    console.error('[Enhanced Service Worker] Chat history sync failed:', error);
    return false;
  }
}

// Sync settings
async function syncSettings() {
  console.log('[Enhanced Service Worker] Syncing settings...');
  
  if (!isOnline) {
    console.log('[Enhanced Service Worker] Device is offline, settings will sync when online');
    return;
  }
  
  try {
    // Notify all clients to perform the sync
    notifyAllClients({
      type: 'SYNC_SETTINGS'
    });
    
    console.log('[Enhanced Service Worker] Settings sync message sent to clients');
    return true;
  } catch (error) {
    console.error('[Enhanced Service Worker] Settings sync failed:', error);
    return false;
  }
}

// Process offline queue
async function processOfflineQueue() {
  if (isProcessingQueue) {
    console.log('[Enhanced Service Worker] Queue processing already in progress');
    return;
  }
  
  if (!isOnline) {
    console.log('[Enhanced Service Worker] Device is offline, cannot process offline queue');
    return;
  }
  
  console.log('[Enhanced Service Worker] Processing offline queue...');
  isProcessingQueue = true;
  
  try {
    // Notify all clients to process their offline queues
    notifyAllClients({
      type: 'PROCESS_OFFLINE_QUEUE'
    });
    
    console.log('[Enhanced Service Worker] Offline queue processing message sent to clients');
    return true;
  } catch (error) {
    console.error('[Enhanced Service Worker] Offline queue processing failed:', error);
    return false;
  } finally {
    isProcessingQueue = false;
  }
}

// Perform cleanup task
async function performCleanupTask() {
  console.log('[Enhanced Service Worker] Performing cleanup task...');
  
  try {
    // Clear old caches
    const cacheCleanupPromise = caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // Keep the current cache, remove any old ones
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          console.log('[Enhanced Service Worker] Removing old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    });
    
    // Clean up old IndexedDB data
    // This is a placeholder - actual implementation would depend on app-specific logic
    
    // Notify clients to perform their cleanup tasks
    notifyAllClients({
      type: 'PERFORM_CLEANUP'
    });
    
    await cacheCleanupPromise;
    
    console.log('[Enhanced Service Worker] Cleanup task completed');
    return true;
  } catch (error) {
    console.error('[Enhanced Service Worker] Cleanup task failed:', error);
    return false;
  }
}

// Perform full sync
async function performFullSync() {
  console.log('[Enhanced Service Worker] Performing full sync...');
  
  if (!isOnline) {
    console.log('[Enhanced Service Worker] Device is offline, full sync deferred');
    return;
  }
  
  try {
    // Notify all clients to perform a full sync
    notifyAllClients({
      type: 'PERFORM_FULL_SYNC'
    });
    
    console.log('[Enhanced Service Worker] Full sync message sent to clients');
    return true;
  } catch (error) {
    console.error('[Enhanced Service Worker] Full sync failed:', error);
    return false;
  }
}

// Check for updates
async function checkForUpdates() {
  console.log('[Enhanced Service Worker] Checking for updates...');
  
  if (!isOnline) {
    console.log('[Enhanced Service Worker] Device is offline, update check deferred');
    return;
  }
  
  try {
    // This would typically check a server endpoint for updates
    // Here we'll just simulate by updating the registration
    await self.registration.update();
    
    console.log('[Enhanced Service Worker] Update check completed');
    return true;
  } catch (error) {
    console.error('[Enhanced Service Worker] Update check failed:', error);
    return false;
  }
}

// Get sync status
async function getSyncStatus() {
  // This would typically query the IndexedDB for pending items
  // For now we'll return a mock status
  return {
    isOnline,
    pendingChanges: 0,
    syncInProgress: isProcessingQueue,
    lastSynced: Date.now()
  };
}

// Clear all caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    
    console.log('[Enhanced Service Worker] All caches cleared');
    return true;
  } catch (error) {
    console.error('[Enhanced Service Worker] Failed to clear caches:', error);
    return false;
  }
}

// Update service worker settings
async function updateServiceWorkerSettings(settings = {}) {
  try {
    const request = indexedDB.open(DB_CONFIG.DATABASE, 1);
    
    request.onsuccess = async (event) => {
      const db = event.target.result;
      const transaction = db.transaction(DB_CONFIG.STORES.SETTINGS, 'readwrite');
      const store = transaction.objectStore(DB_CONFIG.STORES.SETTINGS);
      
      await store.put({
        id: 'serviceWorkerSettings',
        ...settings,
        updatedAt: Date.now()
      });
      
      console.log('[Enhanced Service Worker] Settings updated');
    };
    
    request.onerror = (event) => {
      console.error('[Enhanced Service Worker] Failed to update settings:', event.target.error);
      throw event.target.error;
    };
    
    return true;
  } catch (error) {
    console.error('[Enhanced Service Worker] Settings update error:', error);
    throw error;
  }
}

// Create backup
async function createBackup(data = {}) {
  console.log('[Enhanced Service Worker] Creating backup...');
  
  try {
    // Notify all clients to create a backup
    notifyAllClients({
      type: 'CREATE_BACKUP',
      data
    });
    
    console.log('[Enhanced Service Worker] Backup creation message sent to clients');
    return true;
  } catch (error) {
    console.error('[Enhanced Service Worker] Backup creation failed:', error);
    return false;
  }
}

// Notify all clients
async function notifyAllClients(message) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  
  for (const client of clients) {
    client.postMessage(message);
  }
}

// Open or focus a URL
async function openOrFocusURL(url) {
  const clients = await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  });
  
  // Try to find an existing window
  for (const client of clients) {
    if (client.url.includes(url) && 'focus' in client) {
      await client.focus();
      return;
    }
  }
  
  // If no matching client, open a new window
  await self.clients.openWindow(url);
}

console.log('[Enhanced Service Worker] Enhanced Service Worker Registered (Version 2.0.0)');
