
import { serviceWorkerController } from '@/services/serviceWorkerController';

/**
 * Utility for managing scheduled tasks with chrome.alarms
 */
export const alarmManager = {
  /**
   * Schedule a recurring task using chrome.alarms
   */
  scheduleRecurringTask: async (
    taskName: string, 
    periodInMinutes: number,
    taskData: any = {}
  ): Promise<boolean> {
    if (!chrome?.alarms) {
      console.warn('chrome.alarms API not available');
      return false;
    }
    
    try {
      // Store task data in alarm name as JSON
      const alarmInfo = {
        type: taskName,
        data: taskData,
        createdAt: Date.now()
      };
      
      // Create the alarm
      await chrome.alarms.create(
        JSON.stringify(alarmInfo),
        { periodInMinutes }
      );
      
      console.log(`Scheduled recurring task: ${taskName} every ${periodInMinutes} minutes`);
      return true;
    } catch (error) {
      console.error('Error scheduling task:', error);
      return false;
    }
  },
  
  /**
   * Schedule a one-time task using chrome.alarms
   */
  scheduleOneTimeTask: async (
    taskName: string,
    delayInMinutes: number,
    taskData: any = {}
  ): Promise<boolean> {
    if (!chrome?.alarms) {
      console.warn('chrome.alarms API not available');
      return false;
    }
    
    try {
      // Store task data in alarm name as JSON
      const alarmInfo = {
        type: taskName,
        data: taskData,
        createdAt: Date.now()
      };
      
      // Create the alarm with delayInMinutes
      await chrome.alarms.create(
        JSON.stringify(alarmInfo),
        { delayInMinutes }
      );
      
      console.log(`Scheduled one-time task: ${taskName} in ${delayInMinutes} minutes`);
      return true;
    } catch (error) {
      console.error('Error scheduling one-time task:', error);
      return false;
    }
  },
  
  /**
   * Cancel a scheduled task
   */
  cancelTask: async (taskName: string): Promise<boolean> {
    if (!chrome?.alarms) {
      console.warn('chrome.alarms API not available');
      return false;
    }
    
    try {
      // Get all alarms
      const alarms = await chrome.alarms.getAll();
      
      // Find and clear matching alarms
      let found = false;
      for (const alarm of alarms) {
        try {
          const alarmInfo = JSON.parse(alarm.name);
          if (alarmInfo.type === taskName) {
            await chrome.alarms.clear(alarm.name);
            found = true;
          }
        } catch (e) {
          // Skip alarms with invalid JSON
        }
      }
      
      return found;
    } catch (error) {
      console.error('Error canceling task:', error);
      return false;
    }
  },
  
  /**
   * Get all scheduled tasks
   */
  getAllTasks: async (): Promise<any[]> {
    if (!chrome?.alarms) {
      console.warn('chrome.alarms API not available');
      return [];
    }
    
    try {
      const alarms = await chrome.alarms.getAll();
      
      // Parse alarm info from names
      return alarms.map(alarm => {
        try {
          const alarmInfo = JSON.parse(alarm.name);
          return {
            ...alarmInfo,
            scheduledTime: alarm.scheduledTime,
            periodInMinutes: alarm.periodInMinutes
          };
        } catch (e) {
          // Handle alarms with non-JSON names
          return {
            type: 'unknown',
            name: alarm.name,
            scheduledTime: alarm.scheduledTime,
            periodInMinutes: alarm.periodInMinutes
          };
        }
      });
    } catch (error) {
      console.error('Error getting scheduled tasks:', error);
      return [];
    }
  }
};

/**
 * Hook up alarm handling with the service worker
 */
export const initializeAlarmHandling = () => {
  // If in extension context with chrome.alarms API
  if (chrome?.alarms) {
    // Listen for alarm events
    chrome.alarms.onAlarm.addListener((alarm) => {
      try {
        // Parse the alarm data from the name
        const alarmInfo = JSON.parse(alarm.name);
        
        // Notify the service worker to handle the alarm
        serviceWorkerController.sendMessage({
          type: 'HANDLE_ALARM',
          payload: alarmInfo
        });
        
      } catch (error) {
        console.error('Error handling alarm:', error);
      }
    });
    
    console.log('Alarm handling initialized');
  }
};

// Auto-initialize alarm handling when imported in extension context
if (typeof chrome !== 'undefined' && chrome.alarms) {
  initializeAlarmHandling();
}
