
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

// In-memory task queue (would be stored in IndexedDB in a full implementation)
let taskQueue: BackgroundTask[] = [];
let isProcessing = false;

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
  
  // Notify content script about new task
  notifyTaskAdded(newTask);
  
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
  return taskQueue.length < initialLength;
}

/**
 * Clear completed tasks
 */
export function clearCompletedTasks(): number {
  const initialLength = taskQueue.length;
  taskQueue = taskQueue.filter(t => t.status !== 'completed');
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
          default:
            // Generic processing
            await simulateTaskProcessing(task.id);
        }
        
        processedCount++;
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
