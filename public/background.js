
// ChroMarx Extension Background Service
// This service worker orchestrates all background tasks and extension functionality

// ===== Initialization =====
chrome.runtime.onInstalled.addListener(async () => {
  console.log('ChroMarx installed!');

  // Initialize extension data structure
  await initializeStorage();
  
  // Setup context menu
  setupContextMenu();
  
  // Schedule regular maintenance tasks
  scheduleMaintenanceTasks();
  
  // Open options page on install
  chrome.runtime.openOptionsPage();
});

// ===== Storage Initialization =====
async function initializeStorage() {
  // Get current storage state
  const storageData = await chrome.storage.sync.get([
    'theme', 
    'settings', 
    'lastSyncTimestamp',
    'processingQueue',
    'offlineQueue'
  ]);
  
  // Initialize default settings if they don't exist
  if (!storageData.theme) {
    chrome.storage.sync.set({ theme: 'light' });
  }
  
  if (!storageData.settings) {
    chrome.storage.sync.set({ 
      settings: {
        dataCollection: false,
        experimentalFeatures: false,
        autoSync: true,
        syncInterval: 30, // minutes
        maxBackgroundConcurrency: 5
      }
    });
  }
  
  if (!storageData.processingQueue) {
    chrome.storage.sync.set({ processingQueue: [] });
  }
  
  if (!storageData.offlineQueue) {
    chrome.storage.sync.set({ offlineQueue: [] });
  }
  
  // Register for alarm-based sync
  setupAlarms();
  
  console.log('Storage initialization complete');
}

// ===== Context Menu Setup =====
function setupContextMenu() {
  // Clear existing context menus to prevent duplicates
  chrome.contextMenus.removeAll(() => {
    // Create main context menu
    chrome.contextMenus.create({
      id: "add-to-chromarx",
      title: "Add to ChroMarx",
      contexts: ["page", "selection", "link"]
    });
    
    // Create submenu items for different actions
    chrome.contextMenus.create({
      id: "quick-summarize",
      title: "Quick Summarize",
      contexts: ["selection"],
      parentId: "add-to-chromarx"
    });
    
    chrome.contextMenus.create({
      id: "add-with-tags",
      title: "Add with Tags...",
      contexts: ["page", "link"],
      parentId: "add-to-chromarx"
    });
  });
}

// ===== Alarms & Scheduled Tasks =====
function setupAlarms() {
  // Clear any existing alarms
  chrome.alarms.clearAll();
  
  // Create alarms for periodic tasks
  chrome.alarms.create('regular-maintenance', { periodInMinutes: 60 });
  chrome.alarms.create('process-queue', { periodInMinutes: 15 });
  chrome.alarms.create('sync-bookmarks', { periodInMinutes: 30 });
}

function scheduleMaintenanceTasks() {
  // Schedule initial maintenance tasks
  setTimeout(() => {
    runMaintenanceTasks();
  }, 5000); // 5 seconds after initialization
}

async function runMaintenanceTasks() {
  console.log('Running maintenance tasks...');
  
  try {
    // Process any pending background tasks
    await processTaskQueue();
    
    // Check for and clear expired cache items
    await clearExpiredCache();
    
    // Update bookmark health metrics
    await updateBookmarkHealthMetrics();
  } catch (error) {
    console.error('Error during maintenance tasks:', error);
  }
}

// ===== Command Handlers =====
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case "toggle-theme": 
      toggleTheme();
      break;
    case "quick-add":
      quickAddCurrentPage();
      break;
    case "advanced-search":
      openAdvancedSearch();
      break;
    default:
      console.log(`Unknown command: ${command}`);
  }
});

async function toggleTheme() {
  const { theme } = await chrome.storage.sync.get(['theme']);
  const newTheme = theme === 'light' ? 'dark' : 'light';
  await chrome.storage.sync.set({ theme: newTheme });
  broadcastThemeChange(newTheme);
}

function broadcastThemeChange(theme) {
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'THEME_CHANGED',
        theme: theme
      }).catch(err => {
        // Ignore errors for tabs that don't have content scripts
      });
    });
  });
}

async function quickAddCurrentPage() {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (currentTab && currentTab.id) {
    try {
      // Try to send a message to the content script
      chrome.tabs.sendMessage(currentTab.id, { type: "ADD_BOOKMARK" });
    } catch (error) {
      // If content script isn't loaded, create bookmark directly
      addBookmarkDirectly(currentTab);
    }
  }
}

async function addBookmarkDirectly(tab) {
  if (!tab.url || !tab.title) return;
  
  // Add to processing queue
  const taskId = `task_${Date.now()}`;
  const newTask = {
    id: taskId,
    type: 'CREATE_BOOKMARK',
    status: 'pending',
    data: {
      url: tab.url,
      title: tab.title,
      timestamp: Date.now()
    },
    added: Date.now()
  };
  
  const { processingQueue } = await chrome.storage.sync.get(['processingQueue']);
  processingQueue.push(newTask);
  await chrome.storage.sync.set({ processingQueue });
  
  // Start processing immediately
  processTaskQueue();
}

function openAdvancedSearch() {
  // Open the advanced search in the side panel
  chrome.sidePanel.open({ path: 'index.html#/search' });
}

// ===== Context Menu Handlers =====
chrome.contextMenus.onClicked.addListener((data, tab) => {
  if (!tab || !tab.id) return;
  
  switch (data.menuItemId) {
    case "add-to-chromarx": 
      chrome.tabs.sendMessage(tab.id, { type: "ADD_BOOKMARK" });
      break;
    case "quick-summarize":
      if (data.selectionText) {
        chrome.tabs.sendMessage(tab.id, { 
          type: "SUMMARIZE_SELECTION", 
          text: data.selectionText
        });
      }
      break;
    case "add-with-tags":
      chrome.tabs.sendMessage(tab.id, { 
        type: "ADD_WITH_TAGS", 
        url: data.linkUrl || tab.url
      });
      break;
  }
});

// ===== Message Handling =====
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case "GET_THEME":
      handleGetTheme(sendResponse);
      return true;  // Keep channel open for async response
      
    case "SCHEDULE_TASK":
      handleScheduleTask(request.payload, sendResponse);
      return true;  // Keep channel open for async response
      
    case "GET_TASKS":
      handleGetTasks(sendResponse);
      return true;  // Keep channel open for async response
      
    case "PROCESS_TASKS":
      processTaskQueue().then(result => sendResponse(result));
      return true;  // Keep channel open for async response
  }
});

async function handleGetTheme(sendResponse) {
  const { theme } = await chrome.storage.sync.get(['theme']);
  sendResponse({ theme: theme || 'light' });
}

async function handleScheduleTask(taskPayload, sendResponse) {
  const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newTask = {
    id: taskId,
    ...taskPayload,
    status: 'pending',
    added: Date.now(),
    progress: 0
  };
  
  try {
    const { processingQueue } = await chrome.storage.sync.get(['processingQueue']);
    processingQueue.push(newTask);
    await chrome.storage.sync.set({ processingQueue });
    sendResponse({ success: true, taskId });
  } catch (error) {
    console.error('Error scheduling task:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function handleGetTasks(sendResponse) {
  try {
    const { processingQueue } = await chrome.storage.sync.get(['processingQueue']);
    sendResponse({ success: true, tasks: processingQueue || [] });
  } catch (error) {
    console.error('Error getting tasks:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// ===== Task Queue Processing =====
async function processTaskQueue() {
  // Get the current processing queue
  const { processingQueue, settings } = await chrome.storage.sync.get(['processingQueue', 'settings']);
  
  if (!processingQueue || processingQueue.length === 0) {
    return { success: true, message: 'No tasks to process' };
  }
  
  console.log(`Processing ${processingQueue.length} tasks...`);
  
  // Sort by priority
  const sortedTasks = [...processingQueue].sort((a, b) => {
    // Priority order: high, normal, low
    const priorityValues = { high: 0, normal: 1, low: 2 };
    return (priorityValues[a.priority] || 1) - (priorityValues[b.priority] || 1);
  });
  
  // Process tasks in batches to avoid overloading
  const maxConcurrent = settings?.maxBackgroundConcurrency || 5;
  const pendingTasks = sortedTasks.filter(task => task.status === 'pending');
  const tasksToProcess = pendingTasks.slice(0, maxConcurrent);
  
  // Process each task
  const results = await Promise.allSettled(
    tasksToProcess.map(task => processTask(task))
  );
  
  // Update the processing queue with the results
  const updatedQueue = processingQueue.map(task => {
    const processedTask = tasksToProcess.find(t => t.id === task.id);
    if (!processedTask) return task;
    
    const result = results.find(r => r.status === 'fulfilled' && r.value.id === task.id);
    if (result && result.status === 'fulfilled') {
      return result.value;
    }
    
    // If the task failed, mark it as failed
    if (processedTask) {
      return {
        ...task,
        status: 'failed',
        error: 'Processing failed'
      };
    }
    
    return task;
  });
  
  // Remove completed tasks after 24 hours
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  const filteredQueue = updatedQueue.filter(task => {
    return !(task.status === 'completed' && task.completed && task.completed < oneDayAgo);
  });
  
  // Update the storage
  await chrome.storage.sync.set({ processingQueue: filteredQueue });
  
  return { 
    success: true, 
    processed: tasksToProcess.length,
    remaining: filteredQueue.filter(t => t.status === 'pending').length
  };
}

async function processTask(task) {
  console.log(`Processing task: ${task.id} (${task.type})`);
  
  // Update task status to processing
  task.status = 'processing';
  task.progress = 10;
  await updateTaskInQueue(task);
  
  try {
    // Process the task based on its type
    switch (task.type) {
      case 'CREATE_BOOKMARK':
        await processCreateBookmark(task);
        break;
      case 'SUMMARIZE_CONTENT':
        await processSummarizeContent(task);
        break;
      case 'ANALYZE_BOOKMARKS':
        await processAnalyzeBookmarks(task);
        break;
      case 'CUSTOM_TASK':
        await processCustomTask(task);
        break;
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
    
    // Mark task as completed
    task.status = 'completed';
    task.progress = 100;
    task.completed = Date.now();
    await updateTaskInQueue(task);
    
    return task;
  } catch (error) {
    console.error(`Error processing task ${task.id}:`, error);
    
    // Mark task as failed
    task.status = 'failed';
    task.error = error.message;
    task.progress = 0;
    await updateTaskInQueue(task);
    
    return task;
  }
}

async function updateTaskInQueue(updatedTask) {
  const { processingQueue } = await chrome.storage.sync.get(['processingQueue']);
  const updatedQueue = processingQueue.map(task => 
    task.id === updatedTask.id ? updatedTask : task
  );
  await chrome.storage.sync.set({ processingQueue: updatedQueue });
}

// Task processing implementations
async function processCreateBookmark(task) {
  // Simplified implementation - in a real extension, this would create a bookmark
  task.progress = 50;
  await updateTaskInQueue(task);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  task.progress = 100;
  return task;
}

async function processSummarizeContent(task) {
  // Simplified implementation - in a real extension, this would use an AI service
  task.progress = 50;
  await updateTaskInQueue(task);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  task.result = {
    summary: `This is a simulated summary for ${task.data.url || 'content'}`
  };
  task.progress = 100;
  return task;
}

async function processAnalyzeBookmarks(task) {
  // Simplified implementation
  task.progress = 50;
  await updateTaskInQueue(task);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  task.result = {
    analysis: 'Simulated bookmark analysis completed'
  };
  task.progress = 100;
  return task;
}

async function processCustomTask(task) {
  // Generic task processor for custom tasks
  task.progress = 50;
  await updateTaskInQueue(task);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  task.result = {
    message: `Completed custom task: ${task.data?.message || 'No message provided'}`
  };
  task.progress = 100;
  return task;
}

// ===== Cache Management =====
async function clearExpiredCache() {
  // This would clear expired cache entries from IndexedDB
  console.log('Clearing expired cache items...');
  // Simplified implementation
}

// ===== Bookmark Health Metrics =====
async function updateBookmarkHealthMetrics() {
  // This would update health metrics for bookmarks (e.g., check for broken links)
  console.log('Updating bookmark health metrics...');
  // Simplified implementation
}

// ===== Alarm Handlers =====
chrome.alarms.onAlarm.addListener((alarm) => {
  switch (alarm.name) {
    case 'regular-maintenance':
      runMaintenanceTasks();
      break;
    case 'process-queue':
      processTaskQueue();
      break;
    case 'sync-bookmarks':
      syncBookmarksIfNeeded();
      break;
  }
});

async function syncBookmarksIfNeeded() {
  const { settings } = await chrome.storage.sync.get(['settings']);
  if (settings?.autoSync) {
    console.log('Running scheduled bookmark synchronization...');
    // This would sync bookmarks with the Chrome bookmark API
    // Simplified implementation
  }
}
