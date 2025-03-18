
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import serviceWorkerController from '@/services/serviceWorkerController';

interface UseServiceWorkerOptions {
  showToasts?: boolean;
  onStatusChange?: (status: string) => void;
  onMessage?: (type: string, data: any) => void;
}

/**
 * Hook for interacting with the service worker controller
 */
export function useServiceWorker(options: UseServiceWorkerOptions = {}) {
  const { showToasts = true, onStatusChange, onMessage } = options;
  
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState(serviceWorkerController.getStatus());
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cacheInfo, setCacheInfo] = useState<any>(null);

  // Initialize and get status
  useEffect(() => {
    let mounted = true;
    
    const initServiceWorker = async () => {
      setIsLoading(true);
      
      // Check status
      const currentStatus = serviceWorkerController.getStatus();
      
      if (currentStatus === 'unregistered') {
        // Try to initialize
        const success = await serviceWorkerController.initialize();
        
        if (mounted) {
          setIsActive(success);
          setStatus(serviceWorkerController.getStatus());
          
          if (success && showToasts) {
            toast.success('Service worker activated');
          } else if (!success && showToasts) {
            toast.error('Failed to activate service worker');
          }
        }
      } else {
        if (mounted) {
          setIsActive(currentStatus === 'active');
          setStatus(currentStatus);
        }
      }
      
      // Get pending tasks
      refreshTasks();
      
      // Get cache info
      refreshCacheInfo();
      
      if (mounted) {
        setIsLoading(false);
      }
    };
    
    initServiceWorker();
    
    // Set up listeners for task status updates
    const unsubscribeTaskUpdate = serviceWorkerController.subscribe('TASK_STATUS_UPDATE', (data) => {
      if (mounted) {
        refreshTasks();
      }
    });
    
    const unsubscribeTaskCompleted = serviceWorkerController.subscribe('TASK_COMPLETED', (data) => {
      if (mounted) {
        refreshTasks();
        
        if (showToasts) {
          toast.success('Background task completed');
        }
      }
    });
    
    const unsubscribeTaskFailed = serviceWorkerController.subscribe('TASK_FAILED', (data) => {
      if (mounted) {
        refreshTasks();
        
        if (showToasts) {
          toast.error(`Background task failed: ${data.error || 'Unknown error'}`);
        }
      }
    });
    
    // Set up a general message handler
    const unsubscribeMessage = serviceWorkerController.subscribe('*', (data) => {
      if (mounted && onMessage) {
        onMessage(data.type, data);
      }
    });
    
    return () => {
      mounted = false;
      unsubscribeTaskUpdate();
      unsubscribeTaskCompleted();
      unsubscribeTaskFailed();
      unsubscribeMessage();
    };
  }, [showToasts, onStatusChange, onMessage]);

  // Update status when it changes
  useEffect(() => {
    if (onStatusChange) {
      onStatusChange(status);
    }
  }, [status, onStatusChange]);

  // Refresh the list of pending tasks
  const refreshTasks = useCallback(async () => {
    if (serviceWorkerController.isReady()) {
      const tasks = await serviceWorkerController.getPendingTasks();
      setPendingTasks(tasks);
    } else {
      setPendingTasks([]);
    }
  }, []);

  // Refresh cache information
  const refreshCacheInfo = useCallback(async () => {
    if (serviceWorkerController.isReady()) {
      const info = await serviceWorkerController.getCacheStatus();
      setCacheInfo(info);
    } else {
      setCacheInfo(null);
    }
  }, []);

  // Schedule a background task
  const scheduleTask = useCallback(async (
    taskType: string, 
    taskData: any, 
    priority: 'high' | 'normal' | 'low' = 'normal'
  ) => {
    if (!serviceWorkerController.isReady()) {
      if (showToasts) {
        toast.error('Service worker is not active');
      }
      return null;
    }
    
    const taskId = await serviceWorkerController.scheduleTask(taskType, taskData, priority);
    
    if (taskId && showToasts) {
      toast.success('Background task scheduled');
    }
    
    refreshTasks();
    return taskId;
  }, [showToasts, refreshTasks]);

  // Process all pending tasks
  const processTasks = useCallback(async () => {
    if (!serviceWorkerController.isReady()) {
      if (showToasts) {
        toast.error('Service worker is not active');
      }
      return false;
    }
    
    const success = await serviceWorkerController.processTasks();
    
    if (success && showToasts) {
      toast.success('Processing background tasks');
    }
    
    return success;
  }, [showToasts]);

  // Clear the service worker cache
  const clearCache = useCallback(async () => {
    if (!serviceWorkerController.isReady()) {
      if (showToasts) {
        toast.error('Service worker is not active');
      }
      return false;
    }
    
    const success = await serviceWorkerController.clearCache();
    
    if (success && showToasts) {
      toast.success('Cache cleared successfully');
    }
    
    refreshCacheInfo();
    return success;
  }, [showToasts, refreshCacheInfo]);

  // Unregister the service worker
  const unregister = useCallback(async () => {
    const success = await serviceWorkerController.unregister();
    
    if (success) {
      setIsActive(false);
      setStatus('unregistered');
      
      if (showToasts) {
        toast.success('Service worker deactivated');
      }
    }
    
    return success;
  }, [showToasts]);

  // Update the service worker
  const update = useCallback(async () => {
    if (!serviceWorkerController.isReady()) {
      return false;
    }
    
    const success = await serviceWorkerController.update();
    
    if (success && showToasts) {
      toast.success('Service worker updated');
    }
    
    return success;
  }, [showToasts]);

  return {
    isActive,
    status,
    isLoading,
    pendingTasks,
    cacheInfo,
    scheduleTask,
    processTasks,
    refreshTasks,
    refreshCacheInfo,
    clearCache,
    unregister,
    update
  };
}

export default useServiceWorker;
