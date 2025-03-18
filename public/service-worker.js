// ChroMarx Service Worker
console.log('ChroMarx Service Worker Initialized');

// Check if Chrome extension APIs are available
const isChromeExtension = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
console.log(`Running in ${isChromeExtension ? 'Chrome Extension' : 'Web'} context`);

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

// Task management
const pendingTasks = new Map();
let isProcessingTasks = false;
let taskIdCounter = 0;

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

// Generate a unique task ID
function generateTaskId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `task_${timestamp}_${random}_${taskIdCounter++}`;
}

// Process a single task
async function processTask(taskId, taskData) {
  if (!pendingTasks.has(taskId)) {
    console.warn('Task not found:', taskId);
    return false;
  }
  
  const task = pendingTasks.get(taskId);
  
  try {
    task.status = 'processing';
    
    // Update clients about task status
    await notifyClients({
      type: 'TASK_STATUS_UPDATE',
      payload: {
        taskId,
        status: 'processing',
        progress: 0
      }
    });
    
    // Process different task types
    switch (task.taskType) {
      case 'CACHE_CLEANUP':
        await handleCacheCleanup(task);
        break;
        
      case 'DATA_PROCESSING':
        await handleDataProcessing(task);
        break;
        
      case 'BACKGROUND_SYNC':
        await handleBackgroundSync(task);
        break;
        
      case 'BOOKMARK_PROCESSING':
        await handleBookmarkProcessing(task);
        break;
        
      default:
        console.warn('Unknown task type:', task.taskType);
        task.status = 'failed';
        task.error = 'Unknown task type';
        return false;
    }
    
    // Mark task as completed
    task.status = 'completed';
    task.completedAt = Date.now();
    
    // Notify clients of completion
    await notifyClients({
      type: 'TASK_COMPLETED',
      payload: {
        taskId,
        result: task.result
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error processing task:', error);
    
    // Mark task as failed
    task.status = 'failed';
    task.error = error.message;
    task.failedAt = Date.now();
    
    // Notify clients of failure
    await notifyClients({
      type: 'TASK_FAILED',
      payload: {
        taskId,
        error: error.message
      }
    });
    
    return false;
  }
}

// Process all pending tasks
async function processAllTasks() {
  if (isProcessingTasks) {
    console.log('Already processing tasks');
    return;
  }
  
  isProcessingTasks = true;
  
  try {
    // Sort tasks by priority
    const sortedTasks = Array.from(pendingTasks.entries())
      .filter(([_, task]) => task.status === 'pending')
      .sort((a, b) => {
        const priorityValues = { high: 0, normal: 1, low: 2 };
        return priorityValues[a[1].priority] - priorityValues[b[1].priority];
      });
    
    console.log(`Processing ${sortedTasks.length} pending tasks`);
    
    // Process each task sequentially
    for (const [taskId, task] of sortedTasks) {
      if (task.status === 'pending') {
        await processTask(taskId, task);
      }
    }
    
    // Clean up completed tasks older than 1 hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [taskId, task] of pendingTasks.entries()) {
      if (task.status === 'completed' && task.completedAt < oneHourAgo) {
        pendingTasks.delete(taskId);
      }
    }
  } catch (error) {
    console.error('Error processing tasks:', error);
  } finally {
    isProcessingTasks = false;
  }
}

// Task handlers
async function handleCacheCleanup(task) {
  console.log('Cleaning up cache');
  const cacheNames = await caches.keys();
  
  // Keep track of progress
  let processed = 0;
  const total = cacheNames.length;
  
  for (const cacheName of cacheNames) {
    if (cacheName !== CACHE_NAME) {
      await caches.delete(cacheName);
    }
    
    processed++;
    
    // Update progress
    await notifyClients({
      type: 'TASK_STATUS_UPDATE',
      payload: {
        taskId: task.id,
        progress: Math.floor((processed / total) * 100)
      }
    });
  }
  
  task.result = {
    cachesCleaned: cacheNames.length - 1
  };
}

async function handleDataProcessing(task) {
  console.log('Processing data task', task.data);
  
  // Get items to process
  const items = task.data.items || [];
  const total = items.length;
  
  if (total === 0) {
    task.result = { processed: 0 };
    return;
  }
  
  // Process items in batches
  const batchSize = task.data.batchSize || 10;
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, Math.min(i + batchSize, items.length));
    
    // Process batch
    for (const item of batch) {
      // Simple example processing
      results.push({
        id: item.id,
        processed: true,
        result: `Processed ${item.name || item.id}`
      });
    }
    
    // Update progress
    const progress = Math.floor(((i + batch.length) / total) * 100);
    await notifyClients({
      type: 'TASK_STATUS_UPDATE',
      payload: {
        taskId: task.id,
        progress
      }
    });
    
    // Pause to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  task.result = {
    processed: results.length,
    results
  };
}

async function handleBackgroundSync(task) {
  console.log('Syncing data in background', task.data);
  
  // Example implementation
  await new Promise(resolve => setTimeout(resolve, 500));
  
  task.result = {
    synced: true,
    timestamp: Date.now()
  };
}

async function handleBookmarkProcessing(task) {
  console.log('Processing bookmarks', task.data);
  
  // Example implementation for bookmark processing
  const bookmarks = task.data.bookmarks || [];
  const processed = [];
  
  for (let i = 0; i < bookmarks.length; i++) {
    const bookmark = bookmarks[i];
    
    // Process bookmark (example)
    processed.push({
      id: bookmark.id,
      title: bookmark.title,
      processed: true
    });
    
    // Update progress
    const progress = Math.floor(((i + 1) / bookmarks.length) * 100);
    await notifyClients({
      type: 'TASK_STATUS_UPDATE',
      payload: {
        taskId: task.id,
        progress
      }
    });
    
    // Prevent UI blocking
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  
  task.result = {
    processedCount: processed.length,
    bookmarks: processed
  };
}

// Notify all clients
async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  const message = event.data;
  
  if (!message || !message.type) {
    return;
  }
  
  console.log('Service Worker received message:', message.type);
  
  // Handle different message types
  switch (message.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearCache(event);
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus(event);
      break;
      
    case 'SCHEDULE_TASK':
      scheduleTask(event);
      break;
      
    case 'PROCESS_TASKS':
      processAllTasks()
        .then(() => {
          if (event.source) {
            event.source.postMessage({
              type: 'TASKS_PROCESSED',
              messageId: message.messageId
            });
          }
        });
      break;
      
    case 'GET_PENDING_TASKS':
      getPendingTasks(event);
      break;
      
    case 'CANCEL_TASK':
      cancelTask(event);
      break;
  }
});

// Handler functions for client messages
async function clearCache(event) {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(name => caches.delete(name))
    );
    
    // Re-create our primary cache
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urlsToCache);
    
    // Respond to client
    if (event.source) {
      event.source.postMessage({
        type: 'CACHE_CLEARED',
        messageId: event.data.messageId,
        payload: { success: true }
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    
    if (event.source) {
      event.source.postMessage({
        type: 'CACHE_CLEARED',
        messageId: event.data.messageId,
        payload: { success: false, error: error.message }
      });
    }
  }
}

async function getCacheStatus(event) {
  try {
    const cacheNames = await caches.keys();
    const caches_status = await Promise.all(
      cacheNames.map(async name => {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        return {
          name,
          entryCount: keys.length
        };
      })
    );
    
    if (event.source) {
      event.source.postMessage({
        type: 'CACHE_STATUS',
        messageId: event.data.messageId,
        payload: {
          caches: caches_status,
          totalCaches: cacheNames.length
        }
      });
    }
  } catch (error) {
    console.error('Error getting cache status:', error);
    
    if (event.source) {
      event.source.postMessage({
        type: 'CACHE_STATUS',
        messageId: event.data.messageId,
        payload: { error: error.message }
      });
    }
  }
}

function scheduleTask(event) {
  const { taskType, taskData, priority = 'normal' } = event.data.payload || {};
  
  if (!taskType) {
    console.error('Task type is required');
    
    if (event.source) {
      event.source.postMessage({
        type: 'TASK_SCHEDULED',
        messageId: event.data.messageId,
        payload: { success: false, error: 'Task type is required' }
      });
    }
    
    return;
  }
  
  const taskId = generateTaskId();
  
  pendingTasks.set(taskId, {
    id: taskId,
    taskType,
    data: taskData,
    priority,
    status: 'pending',
    createdAt: Date.now()
  });
  
  console.log(`Scheduled task ${taskId} of type ${taskType}`);
  
  if (event.source) {
    event.source.postMessage({
      type: 'TASK_SCHEDULED',
      messageId: event.data.messageId,
      payload: { 
        success: true, 
        taskId 
      }
    });
  }
  
  // Auto-process high priority tasks
  if (priority === 'high') {
    processAllTasks();
  }
}

function getPendingTasks(event) {
  const tasks = Array.from(pendingTasks.entries()).map(([taskId, task]) => ({
    id: taskId,
    type: task.taskType,
    status: task.status,
    priority: task.priority,
    createdAt: task.createdAt,
    completedAt: task.completedAt,
    failedAt: task.failedAt,
    error: task.error
  }));
  
  if (event.source) {
    event.source.postMessage({
      type: 'PENDING_TASKS',
      messageId: event.data.messageId,
      payload: { tasks }
    });
  }
}

function cancelTask(event) {
  const { taskId } = event.data.payload || {};
  
  if (!taskId || !pendingTasks.has(taskId)) {
    if (event.source) {
      event.source.postMessage({
        type: 'TASK_CANCELLED',
        messageId: event.data.messageId,
        payload: { success: false, error: 'Task not found' }
      });
    }
    
    return;
  }
  
  const task = pendingTasks.get(taskId);
  
  if (task.status === 'processing') {
    console.warn('Cannot cancel a task that is already processing');
    
    if (event.source) {
      event.source.postMessage({
        type: 'TASK_CANCELLED',
        messageId: event.data.messageId,
        payload: { success: false, error: 'Task is already processing' }
      });
    }
    
    return;
  }
  
  task.status = 'cancelled';
  
  if (event.source) {
    event.source.postMessage({
      type: 'TASK_CANCELLED',
      messageId: event.data.messageId,
      payload: { success: true }
    });
  }
}

// Chrome Extension specific API handlers - only run in extension context
if (isChromeExtension) {
  try {
    // Extension installed event
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
      if (chrome.sidePanel) {
        chrome.sidePanel.open({ windowId: tab.windowId });
      }
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
    
    console.log('Chrome Extension specific handlers registered');
  } catch (error) {
    console.error('Error setting up Chrome Extension handlers:', error);
  }
}
