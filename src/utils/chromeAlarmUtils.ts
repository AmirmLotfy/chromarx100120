
/**
 * Chrome Alarm Utilities
 * Helper functions for working with chrome.alarms API
 */

interface AlarmOptions {
  when?: number;
  delayInMinutes?: number;
  periodInMinutes?: number;
}

interface ScheduledTask {
  id: string;
  type: string;
  data?: any;
  alarmName: string;
}

// Store of task IDs to alarm names
const taskAlarms: Record<string, string> = {};

/**
 * Create an alarm
 */
export function createAlarm(
  name: string,
  options: AlarmOptions
): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.alarms) {
    console.warn('chrome.alarms API not available');
    return Promise.resolve(false);
  }
  
  return new Promise((resolve) => {
    chrome.alarms.create(name, options);
    
    // Chrome alarms API doesn't provide a callback or promise for alarm creation
    // We'll assume it succeeded if no runtime error occurred
    if (chrome.runtime.lastError) {
      console.error('Error creating alarm:', chrome.runtime.lastError);
      resolve(false);
    } else {
      resolve(true);
    }
  });
}

/**
 * Clear an alarm
 */
export function clearAlarm(name: string): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.alarms) {
    console.warn('chrome.alarms API not available');
    return Promise.resolve(false);
  }
  
  return new Promise((resolve) => {
    chrome.alarms.clear(name, (wasCleared) => {
      resolve(wasCleared);
    });
  });
}

/**
 * Get all alarms
 */
export function getAllAlarms(): Promise<chrome.alarms.Alarm[]> {
  if (typeof chrome === 'undefined' || !chrome.alarms) {
    console.warn('chrome.alarms API not available');
    return Promise.resolve([]);
  }
  
  return new Promise((resolve) => {
    chrome.alarms.getAll((alarms) => {
      resolve(alarms);
    });
  });
}

/**
 * Get a specific alarm
 */
export function getAlarm(name: string): Promise<chrome.alarms.Alarm | null> {
  if (typeof chrome === 'undefined' || !chrome.alarms) {
    console.warn('chrome.alarms API not available');
    return Promise.resolve(null);
  }
  
  return new Promise((resolve) => {
    chrome.alarms.get(name, (alarm) => {
      resolve(alarm || null);
    });
  });
}

/**
 * Schedule a task with chrome.alarms
 */
export async function scheduleTask(
  taskType: string,
  taskData: any = {},
  options: {
    delay?: number;  // Delay in milliseconds
    period?: number; // Period in milliseconds
    id?: string;     // Optional custom ID
  } = {}
): Promise<ScheduledTask | null> {
  if (typeof chrome === 'undefined' || !chrome.alarms) {
    console.warn('chrome.alarms API not available');
    return null;
  }
  
  const taskId = options.id || `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Create alarm data
  const alarmData = {
    type: taskType,
    taskId,
    data: taskData
  };
  
  // Create a JSON string as the alarm name
  // (Chrome alarms API requires a string name and doesn't store additional data)
  const alarmName = JSON.stringify(alarmData);
  
  // Configure alarm options
  const alarmOptions: AlarmOptions = {};
  
  if (options.period) {
    // Convert milliseconds to minutes for periodInMinutes
    alarmOptions.periodInMinutes = Math.max(0.05, options.period / 60000);
  }
  
  if (options.delay) {
    if (options.delay < 60000) {
      // For short delays, use 'when' instead of 'delayInMinutes'
      // This allows for sub-minute precision
      alarmOptions.when = Date.now() + options.delay;
    } else {
      // For longer delays, use delayInMinutes (convert ms to minutes)
      alarmOptions.delayInMinutes = options.delay / 60000;
    }
  }
  
  // Create the alarm
  const success = await createAlarm(alarmName, alarmOptions);
  
  if (success) {
    // Store the mapping
    taskAlarms[taskId] = alarmName;
    
    return {
      id: taskId,
      type: taskType,
      data: taskData,
      alarmName
    };
  }
  
  return null;
}

/**
 * Cancel a scheduled task
 */
export async function cancelScheduledTask(taskId: string): Promise<boolean> {
  const alarmName = taskAlarms[taskId];
  
  if (!alarmName) {
    console.warn(`No alarm found for task ID: ${taskId}`);
    return false;
  }
  
  const cleared = await clearAlarm(alarmName);
  
  if (cleared) {
    delete taskAlarms[taskId];
  }
  
  return cleared;
}

/**
 * Schedule a bookmark sync
 */
export async function scheduleBookmarkSync(
  options: {
    fullSync?: boolean;
    delay?: number;
    periodic?: boolean;
    periodInHours?: number;
  } = {}
): Promise<ScheduledTask | null> {
  const alarmData = {
    type: 'SYNC_BOOKMARKS',
    options: {
      full: options.fullSync || false
    }
  };
  
  const alarmName = JSON.stringify(alarmData);
  
  // Configure alarm options
  const alarmOptions: AlarmOptions = {};
  
  if (options.periodic && options.periodInHours) {
    // Convert hours to minutes
    alarmOptions.periodInMinutes = options.periodInHours * 60;
  }
  
  if (options.delay) {
    if (options.delay < 60000) {
      alarmOptions.when = Date.now() + options.delay;
    } else {
      alarmOptions.delayInMinutes = options.delay / 60000;
    }
  }
  
  // Create the alarm
  const success = await createAlarm(alarmName, alarmOptions);
  
  if (success) {
    return {
      id: `sync_${Date.now()}`,
      type: 'SYNC_BOOKMARKS',
      data: options,
      alarmName
    };
  }
  
  return null;
}

/**
 * Schedule a cache cleanup task
 */
export async function scheduleCacheCleanup(
  options: {
    delay?: number;
    periodic?: boolean;
    periodInDays?: number;
  } = {}
): Promise<ScheduledTask | null> {
  const alarmData = {
    type: 'CLEANUP',
    options: { full: true }
  };
  
  const alarmName = JSON.stringify(alarmData);
  
  // Configure alarm options
  const alarmOptions: AlarmOptions = {};
  
  if (options.periodic && options.periodInDays) {
    // Convert days to minutes
    alarmOptions.periodInMinutes = options.periodInDays * 24 * 60;
  }
  
  if (options.delay) {
    if (options.delay < 60000) {
      alarmOptions.when = Date.now() + options.delay;
    } else {
      alarmOptions.delayInMinutes = options.delay / 60000;
    }
  }
  
  // Create the alarm
  const success = await createAlarm(alarmName, alarmOptions);
  
  if (success) {
    return {
      id: `cleanup_${Date.now()}`,
      type: 'CLEANUP',
      data: options,
      alarmName
    };
  }
  
  return null;
}

/**
 * Parse alarm data from an alarm name
 */
export function parseAlarmData(alarmName: string): any {
  try {
    return JSON.parse(alarmName);
  } catch (error) {
    console.error('Error parsing alarm data:', error);
    return null;
  }
}

/**
 * Set up alarm listeners
 */
export function setupAlarmListeners(
  callback: (alarmData: any, alarm: chrome.alarms.Alarm) => void
): () => void {
  if (typeof chrome === 'undefined' || !chrome.alarms) {
    console.warn('chrome.alarms API not available');
    return () => {};
  }
  
  const listener = (alarm: chrome.alarms.Alarm) => {
    const alarmData = parseAlarmData(alarm.name);
    
    if (alarmData) {
      callback(alarmData, alarm);
    }
  };
  
  chrome.alarms.onAlarm.addListener(listener);
  
  // Return a cleanup function
  return () => {
    chrome.alarms.onAlarm.removeListener(listener);
  };
}

/**
 * Get all scheduled tasks (by parsing alarm names)
 */
export async function getAllScheduledTasks(): Promise<ScheduledTask[]> {
  const alarms = await getAllAlarms();
  
  return alarms
    .map(alarm => {
      const data = parseAlarmData(alarm.name);
      
      if (!data) return null;
      
      return {
        id: data.taskId || `task_${Date.now()}`,
        type: data.type,
        data: data.data,
        alarmName: alarm.name
      };
    })
    .filter((task): task is ScheduledTask => task !== null);
}
