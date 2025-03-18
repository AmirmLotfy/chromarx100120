/**
 * Background Task Manager
 * Utilities for managing background tasks in the service worker
 */

export interface BackgroundTask {
  id: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  added: number;
  priority?: 'high' | 'normal' | 'low';
  error?: string;
  data?: any;
  result?: any;
}

// In-memory task queue (will be synchronized with chrome.storage.local)
let taskQueue: BackgroundTask[] = [];
let isProcessing = false;

// Initialize the task queue from storage (if available)
if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get('background_tasks', (result) => {
    if (result && result.background_tasks) {
      taskQueue = result.background_tasks;
      console.log(`Loaded ${taskQueue.length} tasks from storage`);
    }
  });
}

/**
 * Persist task queue to chrome.storage.local
 */
function persistTaskQueue() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ background_tasks: taskQueue }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error persisting task queue:', chrome.runtime.lastError);
      }
    });
  }
}

/**
 * Add a task to the queue
 */
export function addTask(task: Omit<BackgroundTask, 'id' | 'status' | 'added' | 'progress'>): string {
  const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newTask: BackgroundTask = {
    id,
    status: 'pending',
    added: Date.now(),
    progress: 0,
    ...task
  };
  
  taskQueue.push(newTask);
  
  // Persist to storage
  persistTaskQueue();
  
  // Notify content script about new task
  notifyTaskAdded(newTask);
  
  // Schedule the task with chrome.alarms if available and if it has a delay
  if (typeof chrome !== 'undefined' && chrome.alarms && task.data?.delay) {
    const alarmName = JSON.stringify({
      type: 'SCHEDULED_TASK',
      taskId: id,
      taskType: task.type
    });
    
    chrome.alarms.create(alarmName, {
      delayInMinutes: Math.max(0.05, task.data.delay / 60000) // Convert ms to minutes, minimum 3 seconds
    });
    
    console.log(`Scheduled task ${id} with alarm, delay: ${task.data.delay}ms`);
  }
  
  return id;
}

/**
 * Get all tasks
 */
export function getTasks(): BackgroundTask[] {
  return [...taskQueue];
}

/**
 * Update a task
 */
export function updateTask(
  taskId: string, 
  updates: Partial<Omit<BackgroundTask, 'id'>>
): BackgroundTask | null {
  const taskIndex = taskQueue.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return null;
  }
  
  const updatedTask = {
    ...taskQueue[taskIndex],
    ...updates
  };
  
  taskQueue[taskIndex] = updatedTask;
  
  // Persist to storage
  persistTaskQueue();
  
  // Notify content script about task update
  notifyTaskUpdated(updatedTask);
  
  return updatedTask;
}

/**
 * Remove a task
 */
export function removeTask(taskId: string): boolean {
  const initialLength = taskQueue.length;
  taskQueue = taskQueue.filter(t => t.id !== taskId);
  
  // Cancel any alarms associated with this task
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    chrome.alarms.getAll((alarms) => {
      alarms.forEach(alarm => {
        try {
          const alarmData = JSON.parse(alarm.name);
          if (alarmData && alarmData.taskId === taskId) {
            chrome.alarms.clear(alarm.name);
            console.log(`Cleared alarm for task ${taskId}`);
          }
        } catch (e) {
          // Not a JSON alarm name or not our task, ignore
        }
      });
    });
  }
  
  if (taskQueue.length < initialLength) {
    // Persist to storage
    persistTaskQueue();
    return true;
  }
  
  return false;
}

/**
 * Clear completed tasks
 */
export function clearCompletedTasks(): number {
  const initialLength = taskQueue.length;
  const completedTaskIds = taskQueue
    .filter(t => t.status === 'completed')
    .map(t => t.id);
    
  taskQueue = taskQueue.filter(t => t.status !== 'completed');
  
  // Persist to storage
  persistTaskQueue();
  
  // Remove completed task results from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local && completedTaskIds.length > 0) {
    const keysToRemove = completedTaskIds.map(id => `task_result_${id}`);
    chrome.storage.local.remove(keysToRemove);
  }
  
  return initialLength - taskQueue.length;
}

/**
 * Cancel a task
 */
export function cancelTask(taskId: string): boolean {
  const task = taskQueue.find(t => t.id === taskId);
  
  if (!task) {
    return false;
  }
  
  if (task.status === 'processing' || task.status === 'pending') {
    updateTask(taskId, {
      status: 'failed',
      error: 'Cancelled by user'
    });
    
    // Cancel any alarms associated with this task
    if (typeof chrome !== 'undefined' && chrome.alarms) {
      chrome.alarms.getAll((alarms) => {
        alarms.forEach(alarm => {
          try {
            const alarmData = JSON.parse(alarm.name);
            if (alarmData && alarmData.taskId === taskId) {
              chrome.alarms.clear(alarm.name);
              console.log(`Cleared alarm for cancelled task ${taskId}`);
            }
          } catch (e) {
            // Not a JSON alarm name or not our task, ignore
          }
        });
      });
    }
    
    return true;
  }
  
  return false;
}

/**
 * Retry a failed task
 */
export function retryTask(taskId: string): boolean {
  const task = taskQueue.find(t => t.id === taskId);
  
  if (!task || task.status !== 'failed') {
    return false;
  }
  
  updateTask(taskId, {
    status: 'pending',
    progress: 0,
    error: undefined
  });
  
  // Re-schedule the task with chrome.alarms if it had a delay
  if (typeof chrome !== 'undefined' && chrome.alarms && task.data?.delay) {
    const alarmName = JSON.stringify({
      type: 'SCHEDULED_TASK',
      taskId: task.id,
      taskType: task.type
    });
    
    chrome.alarms.create(alarmName, {
      delayInMinutes: Math.max(0.05, task.data.delay / 60000) // Convert ms to minutes, minimum 3 seconds
    });
  }
  
  return true;
}

/**
 * Start processing tasks
 */
export async function processTasks(): Promise<number> {
  if (isProcessing) {
    return 0;
  }
  
  const pendingTasks = taskQueue.filter(t => t.status === 'pending');
  
  if (pendingTasks.length === 0) {
    return 0;
  }
  
  isProcessing = true;
  let processedCount = 0;
  
  try {
    // Sort by priority
    const sortedTasks = [...pendingTasks].sort((a, b) => {
      const priorityMap = { high: 0, normal: 1, low: 2 };
      const aPriority = a.priority ? priorityMap[a.priority] : 1;
      const bPriority = b.priority ? priorityMap[b.priority] : 1;
      
      return aPriority - bPriority;
    });
    
    // Process tasks sequentially
    for (const task of sortedTasks) {
      // Check if task was cancelled
      const currentTask = taskQueue.find(t => t.id === task.id);
      if (!currentTask || currentTask.status !== 'pending') {
        continue;
      }
      
      // Mark as processing
      updateTask(task.id, {
        status: 'processing',
        progress: 0
      });
      
      try {
        // Process based on task type
        switch (task.type) {
          case 'SYNC_BOOKMARKS':
            await processBookmarkSync(task.id);
            break;
          case 'PROCESS_BOOKMARKS':
            await processBookmarks(task.id);
            break;
          case 'ANALYZE_BOOKMARKS':
            await analyzeBookmarks(task.id);
            break;
          case 'CACHE_CLEANUP':
            await processCacheCleanup(task.id);
            break;
          case 'DATA_PROCESSING':
            await processDataTask(task.id);
            break;
          default:
            // Generic processing
            await simulateTaskProcessing(task.id);
        }
        
        processedCount++;
        
        // Store task result in chrome.storage.local for completed tasks
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          const completedTask = taskQueue.find(t => t.id === task.id);
          if (completedTask && completedTask.status === 'completed') {
            chrome.storage.local.set({
              [`task_result_${task.id}`]: {
                ...completedTask,
                completedAt: Date.now()
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        
        updateTask(task.id, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return processedCount;
  } finally {
    isProcessing = false;
  }
}

/**
 * Process a bookmark sync task
 */
async function processBookmarkSync(taskId: string): Promise<void> {
  // Simulate processing with progress updates
  const totalSteps = 10;
  
  for (let step = 0; step < totalSteps; step++) {
    // Check if task was cancelled
    const task = taskQueue.find(t => t.id === taskId);
    if (!task || task.status !== 'processing') {
      throw new Error('Task was cancelled');
    }
    
    // Update progress
    const progress = Math.round(((step + 1) / totalSteps) * 100);
    updateTask(taskId, { progress });
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Mark as completed
  updateTask(taskId, {
    status: 'completed',
    progress: 100,
    result: {
      syncedBookmarks: 250,
      newBookmarks: 15,
      updatedBookmarks: 10,
      timestamp: Date.now()
    }
  });
  
  // Schedule regular sync using chrome.alarms
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    // Create a recurring sync task (daily)
    const alarmName = JSON.stringify({
      type: 'SYNC_BOOKMARKS',
      options: { full: false }
    });
    
    chrome.alarms.create(alarmName, {
      periodInMinutes: 24 * 60 // Daily sync
    });
    
    console.log('Scheduled recurring bookmark sync');
  }
}

/**
 * Process bookmarks task
 */
async function processBookmarks(taskId: string): Promise<void> {
  // Get task data
  const task = taskQueue.find(t => t.id === taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  
  const count = task.data?.count || 100;
  const totalSteps = Math.min(count, 20); // Limit steps for simulation
  
  for (let step = 0; step < totalSteps; step++) {
    // Check if task was cancelled
    const updatedTask = taskQueue.find(t => t.id === taskId);
    if (!updatedTask || updatedTask.status !== 'processing') {
      throw new Error('Task was cancelled');
    }
    
    // Update progress
    const progress = Math.round(((step + 1) / totalSteps) * 100);
    updateTask(taskId, { progress });
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Mark as completed
  updateTask(taskId, {
    status: 'completed',
    progress: 100,
    result: {
      processedCount: count,
      timestamp: Date.now()
    }
  });
}

/**
 * Analyze bookmarks task
 */
async function analyzeBookmarks(taskId: string): Promise<void> {
  // Get task data
  const task = taskQueue.find(t => t.id === taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  
  const bookmarkIds = task.data?.bookmarkIds || [];
  const totalSteps = bookmarkIds.length || 10;
  
  for (let step = 0; step < totalSteps; step++) {
    // Check if task was cancelled
    const updatedTask = taskQueue.find(t => t.id === taskId);
    if (!updatedTask || updatedTask.status !== 'processing') {
      throw new Error('Task was cancelled');
    }
    
    // Update progress
    const progress = Math.round(((step + 1) / totalSteps) * 100);
    updateTask(taskId, { progress });
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  
  // Mark as completed
  updateTask(taskId, {
    status: 'completed',
    progress: 100,
    result: {
      analyzedCount: totalSteps,
      categories: ['Work', 'Personal', 'Shopping', 'News'],
      timestamp: Date.now()
    }
  });
}

/**
 * Process cache cleanup task
 */
async function processCacheCleanup(taskId: string): Promise<void> {
  // Update task status
  updateTask(taskId, {
    progress: 10,
    status: 'processing'
  });
  
  // Clean caches if in the service worker context
  if (typeof caches !== 'undefined') {
    try {
      // Get all cache keys
      const cacheNames = await caches.keys();
      
      // Update progress
      updateTask(taskId, { progress: 30 });
      
      // Delete old or unnecessary caches
      await Promise.all(
        cacheNames.map(async cacheName => {
          // Keep only the current cache
          if (cacheName !== 'bookmark-manager-cache-v1') {
            return caches.delete(cacheName);
          }
        })
      );
      
      // Update progress
      updateTask(taskId, { progress: 70 });
      
      // For the current cache, remove outdated entries
      const currentCache = await caches.open('bookmark-manager-cache-v1');
      const requests = await currentCache.keys();
      const now = Date.now();
      const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      await Promise.all(
        requests.map(async request => {
          const response = await currentCache.match(request);
          if (response) {
            const dateHeader = response.headers.get('date');
            if (dateHeader) {
              const date = new Date(dateHeader).getTime();
              if (now - date > MAX_AGE) {
                return currentCache.delete(request);
              }
            }
          }
        })
      );
      
      // Mark as completed
      updateTask(taskId, {
        status: 'completed',
        progress: 100,
        result: {
          clearedCaches: cacheNames.length - 1,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('Error cleaning cache:', error);
      updateTask(taskId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown cache cleanup error'
      });
    }
  } else {
    // Simulate cleanup if not in service worker context
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mark as completed
    updateTask(taskId, {
      status: 'completed',
      progress: 100,
      result: {
        clearedCaches: 3,
        timestamp: Date.now()
      }
    });
  }
  
  // Schedule regular cleanup using chrome.alarms
  if (typeof chrome !== 'undefined' && chrome.alarms) {
    // Create a recurring cleanup task (weekly)
    const alarmName = JSON.stringify({
      type: 'CLEANUP',
      options: { full: true }
    });
    
    chrome.alarms.create(alarmName, {
      periodInMinutes: 7 * 24 * 60 // Weekly cleanup
    });
    
    console.log('Scheduled recurring cache cleanup');
  }
}

/**
 * Process a generic data processing task
 */
async function processDataTask(taskId: string): Promise<void> {
  // Get task data
  const task = taskQueue.find(t => t.id === taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  
  const items = task.data?.items || [];
  const batchSize = task.data?.batchSize || 5;
  const totalItems = items.length;
  
  if (totalItems === 0) {
    updateTask(taskId, {
      status: 'completed',
      progress: 100,
      result: {
        processedCount: 0,
        timestamp: Date.now()
      }
    });
    return;
  }
  
  // Process items in batches
  let processedCount = 0;
  
  for (let i = 0; i < totalItems; i += batchSize) {
    // Check if task was cancelled
    const updatedTask = taskQueue.find(t => t.id === taskId);
    if (!updatedTask || updatedTask.status !== 'processing') {
      throw new Error('Task was cancelled');
    }
    
    // Process this batch
    const batch = items.slice(i, Math.min(i + batchSize, totalItems));
    await processBatch(batch);
    
    processedCount += batch.length;
    
    // Update progress
    const progress = Math.round((processedCount / totalItems) * 100);
    updateTask(taskId, { progress });
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Mark as completed
  updateTask(taskId, {
    status: 'completed',
    progress: 100,
    result: {
      processedCount,
      timestamp: Date.now()
    }
  });
}

/**
 * Process a batch of items (simulated)
 */
async function processBatch(batch: any[]): Promise<any[]> {
  // In a real implementation, this would process the batch of items
  return new Promise(resolve => {
    setTimeout(() => {
      // Simulate processing results
      const results = batch.map(item => ({
        id: item.id,
        processed: true,
        result: `Processed item ${item.id || 'unknown'}`
      }));
      
      resolve(results);
    }, 300);
  });
}

/**
 * Generic task processing simulation
 */
async function simulateTaskProcessing(taskId: string): Promise<void> {
  const totalSteps = 10;
  
  for (let step = 0; step < totalSteps; step++) {
    // Check if task was cancelled
    const task = taskQueue.find(t => t.id === taskId);
    if (!task || task.status !== 'processing') {
      throw new Error('Task was cancelled');
    }
    
    // Update progress
    const progress = Math.round(((step + 1) / totalSteps) * 100);
    updateTask(taskId, { progress });
    
    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Mark as completed
  updateTask(taskId, {
    status: 'completed',
    progress: 100,
    result: {
      timestamp: Date.now()
    }
  });
}

/**
 * Notify content script about task update
 */
function notifyTaskUpdated(task: BackgroundTask): void {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      type: 'TASK_UPDATED',
      task
    }).catch(error => {
      console.error('Error sending task update message:', error);
    });
  }
}

/**
 * Notify content script about task addition
 */
function notifyTaskAdded(task: BackgroundTask): void {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.sendMessage({
      type: 'TASK_ADDED',
      task
    }).catch(error => {
      console.error('Error sending task added message:', error);
    });
  }
}

/**
 * Handle messages from content scripts
 */
export function handleMessage(
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void
): boolean {
  try {
    switch (message.type) {
      case 'GET_TASKS':
        sendResponse({ success: true, tasks: getTasks() });
        break;
        
      case 'SCHEDULE_TASK':
        const taskId = addTask(message.payload);
        sendResponse({ success: true, taskId });
        break;
        
      case 'PROCESS_TASKS':
        // Process tasks asynchronously
        processTasks().then(processedCount => {
          // No need to send response here as it's processed async
          console.log(`Processed ${processedCount} tasks`);
        }).catch(error => {
          console.error('Error processing tasks:', error);
        });
        
        // Send immediate response
        sendResponse({ 
          success: true, 
          message: 'Processing started',
          taskCount: taskQueue.filter(t => t.status === 'pending').length
        });
        break;
        
      case 'CANCEL_TASK':
        const cancelled = cancelTask(message.taskId);
        sendResponse({ success: cancelled });
        break;
        
      case 'RETRY_TASK':
        const retried = retryTask(message.taskId);
        sendResponse({ success: retried });
        break;
        
      case 'CLEAR_COMPLETED_TASKS':
        const cleared = clearCompletedTasks();
        sendResponse({ success: true, clearedCount: cleared });
        break;
      
      case 'GET_STORAGE_USAGE':
        // Get chrome.storage.local usage information
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
            const usageInfo = {
              bytesInUse,
              // 5MB is the default quota for chrome.storage.local
              quotaBytes: chrome.storage.local.QUOTA_BYTES || 5 * 1024 * 1024,
              percentUsed: bytesInUse / (chrome.storage.local.QUOTA_BYTES || 5 * 1024 * 1024) * 100
            };
            sendResponse({ success: true, usageInfo });
          });
          return true; // Will respond asynchronously
        } else {
          sendResponse({ 
            success: false, 
            error: 'chrome.storage.local not available' 
          });
        }
        break;
      
      case 'SCHEDULE_SYNC':
        // Schedule a bookmark sync using chrome.alarms
        if (typeof chrome !== 'undefined' && chrome.alarms) {
          const syncOptions = message.options || {};
          const alarmName = JSON.stringify({
            type: 'SYNC_BOOKMARKS',
            options: syncOptions
          });
          
          // Schedule the sync
          chrome.alarms.create(alarmName, {
            when: Date.now() + (syncOptions.delay || 0)
          });
          
          sendResponse({ success: true, message: 'Sync scheduled' });
        } else {
          // Fallback if alarms not available
          setTimeout(() => {
            processTasks();
          }, message.options?.delay || 0);
          
          sendResponse({ success: true, message: 'Sync scheduled via setTimeout' });
        }
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown message type' });
        return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    return false;
  }
}

// Initialize the scheduler to run periodically
if (typeof setInterval !== 'undefined') {
  // Check for pending tasks every minute
  setInterval(() => {
    processTasks().catch(error => {
      console.error('Error in periodic task processing:', error);
    });
  }, 60000);
}

// Set up a cleanup alarm if running in extension context
if (typeof chrome !== 'undefined' && chrome.alarms) {
  // Set up a daily cleanup alarm
  const cleanupAlarmName = JSON.stringify({
    type: 'CLEANUP',
    options: { daily: true }
  });
  
  chrome.alarms.get(cleanupAlarmName, (alarm) => {
    if (!alarm) {
      chrome.alarms.create(cleanupAlarmName, {
        periodInMinutes: 24 * 60 // Once per day
      });
      console.log('Daily cleanup alarm created');
    }
  });
}
