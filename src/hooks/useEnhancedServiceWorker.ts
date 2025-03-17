
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { isChromeExtension } from '@/lib/utils';

interface EnhancedServiceWorkerOptions {
  path?: string;
  scope?: string;
  onSuccess?: () => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
  onMessage?: (event: MessageEvent) => void;
  showToasts?: boolean;
  autoUpdate?: boolean;
}

interface ScheduledTask {
  taskName: string;
  data?: any;
  delay?: number;
}

/**
 * Enhanced hook for working with service workers
 * Provides additional functionality for Chrome extensions
 */
export function useEnhancedServiceWorker({
  path,
  scope = '/',
  onSuccess,
  onUpdate,
  onError,
  onMessage,
  showToasts = true,
  autoUpdate = true
}: EnhancedServiceWorkerOptions = {}) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [messageChannel, setMessageChannel] = useState<MessageChannel | null>(null);
  const [pendingTasks, setPendingTasks] = useState<string[]>([]);

  // Initialize the service worker
  useEffect(() => {
    // Determine which service worker to use based on environment
    const defaultPath = isChromeExtension()
      ? '/service-worker.js'
      : '/enhanced-service-worker.js';
    
    const swPath = path || defaultPath;
    
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          setIsInitializing(true);
          
          console.log(`Registering enhanced service worker from: ${swPath}`);
          // Register the service worker
          const reg = await navigator.serviceWorker.register(swPath, { scope });
          setRegistration(reg);
          
          // Check if active
          setIsActive(!!reg.active);
          
          if (showToasts) {
            toast.success('Enhanced offline support activated');
          }
          
          if (onSuccess) {
            onSuccess();
          }
          
          // Create a message channel for communication
          const channel = new MessageChannel();
          setMessageChannel(channel);
          
          // Set up message handling
          channel.port1.onmessage = (event) => {
            console.log('Message from service worker:', event.data);
            
            if (onMessage) {
              onMessage(event);
            }
          };
          
          // Send initial message to establish the channel
          if (reg.active) {
            reg.active.postMessage({
              type: 'INIT_CHANNEL'
            }, [channel.port2]);
          }
          
          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  
                  if (showToasts) {
                    toast.info('Update available! Refresh to apply.', {
                      action: {
                        label: 'Refresh',
                        onClick: () => window.location.reload()
                      }
                    });
                  }
                  
                  if (onUpdate) {
                    onUpdate(reg);
                  }
                  
                  // Auto update if configured
                  if (autoUpdate) {
                    skipWaiting();
                  }
                }
              });
            }
          });
          
          // Handle controller changes (when an update is activated)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service worker controller changed');
            
            if (showToasts) {
              toast.success('Enhanced offline support updated');
            }
          });
          
          // Set up message listener
          navigator.serviceWorker.addEventListener('message', (event) => {
            console.log('Message from service worker:', event.data);
            
            // Handle specific message types
            if (event.data?.type === 'TASK_COMPLETED') {
              setPendingTasks(prev => prev.filter(id => id !== event.data.taskId));
            }
            
            if (onMessage) {
              onMessage(event);
            }
          });
          
        } catch (error) {
          console.error('Error during service worker registration:', error);
          
          if (showToasts) {
            toast.error('Failed to enable enhanced offline mode');
          }
          
          if (onError && error instanceof Error) {
            onError(error);
          }
        } finally {
          setIsInitializing(false);
        }
      };
      
      registerServiceWorker();
      
      return () => {
        // Clean up message channel if it exists
        if (messageChannel) {
          messageChannel.port1.close();
        }
      };
    } else {
      if (showToasts) {
        toast.warning('Enhanced offline mode not supported in this browser');
      }
      setIsInitializing(false);
    }
  }, [path, scope, onSuccess, onUpdate, onError, onMessage, showToasts, autoUpdate]);

  // Update the service worker
  const update = useCallback(async () => {
    if (!registration) return false;
    
    try {
      await registration.update();
      return true;
    } catch (error) {
      console.error('Error updating service worker:', error);
      return false;
    }
  }, [registration]);

  // Unregister the service worker
  const unregister = useCallback(async () => {
    if (!registration) return false;
    
    try {
      const success = await registration.unregister();
      if (success) {
        setRegistration(null);
        setIsActive(false);
        setUpdateAvailable(false);
        
        if (showToasts) {
          toast.success('Enhanced offline mode deactivated');
        }
      }
      return success;
    } catch (error) {
      console.error('Error unregistering service worker:', error);
      return false;
    }
  }, [registration, showToasts]);

  // Skip waiting and activate new service worker
  const skipWaiting = useCallback(async () => {
    if (!registration || !registration.waiting) return false;
    
    try {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    } catch (error) {
      console.error('Error skipping waiting:', error);
      return false;
    }
  }, [registration]);

  // Send a message to the service worker
  const sendMessage = useCallback(async (message: any, useChannel = false) => {
    if (!registration || !registration.active) {
      return false;
    }
    
    try {
      if (useChannel && messageChannel) {
        // Use the message channel for two-way communication
        return new Promise((resolve) => {
          // Set up one-time handler for the response
          const responseHandler = (event: MessageEvent) => {
            messageChannel.port1.removeEventListener('message', responseHandler);
            resolve(event.data);
          };
          
          messageChannel.port1.addEventListener('message', responseHandler);
          
          // Send the message
          registration.active.postMessage(message, [messageChannel.port2]);
        });
      } else {
        // Use regular postMessage for one-way communication
        registration.active.postMessage(message);
        return true;
      }
    } catch (error) {
      console.error('Error sending message to service worker:', error);
      return false;
    }
  }, [registration, messageChannel]);

  // Schedule a task
  const scheduleTask = useCallback(async ({ taskName, data = {}, delay = 0 }: ScheduledTask) => {
    if (!registration || !registration.active) {
      return null;
    }
    
    try {
      // Create a message channel for this task
      const taskChannel = new MessageChannel();
      
      const taskPromise = new Promise<string>((resolve) => {
        taskChannel.port1.onmessage = (event) => {
          if (event.data?.taskId) {
            resolve(event.data.taskId);
          }
        };
      });
      
      // Send the task to the service worker
      registration.active.postMessage({
        type: 'SCHEDULE_TASK',
        task: taskName,
        delay,
        data
      }, [taskChannel.port2]);
      
      const taskId = await taskPromise;
      
      // Add to pending tasks
      setPendingTasks(prev => [...prev, taskId]);
      
      return taskId;
    } catch (error) {
      console.error('Error scheduling task:', error);
      return null;
    }
  }, [registration]);

  // Cancel a scheduled task
  const cancelTask = useCallback(async (taskId: string) => {
    if (!registration || !registration.active) {
      return false;
    }
    
    try {
      registration.active.postMessage({
        type: 'CANCEL_TASK',
        taskId
      });
      
      // Remove from pending tasks
      setPendingTasks(prev => prev.filter(id => id !== taskId));
      
      return true;
    } catch (error) {
      console.error('Error canceling task:', error);
      return false;
    }
  }, [registration]);

  // Get sync status
  const getSyncStatus = useCallback(async () => {
    if (!registration || !registration.active) {
      return {
        isOnline: navigator.onLine,
        pendingChanges: 0,
        syncInProgress: false,
        lastSynced: null
      };
    }
    
    try {
      // Create a message channel for this request
      const statusChannel = new MessageChannel();
      
      const statusPromise = new Promise((resolve) => {
        statusChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
      });
      
      // Send the request to the service worker
      registration.active.postMessage({
        type: 'GET_SYNC_STATUS'
      }, [statusChannel.port2]);
      
      return await statusPromise;
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        isOnline: navigator.onLine,
        pendingChanges: 0,
        syncInProgress: false,
        lastSynced: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }, [registration]);

  // Process the offline queue
  const processQueue = useCallback(async () => {
    if (!registration || !registration.active) {
      return false;
    }
    
    try {
      registration.active.postMessage({
        type: 'PROCESS_QUEUE'
      });
      
      if (showToasts) {
        toast.success('Processing offline queue...');
      }
      
      return true;
    } catch (error) {
      console.error('Error processing queue:', error);
      
      if (showToasts) {
        toast.error('Failed to process offline queue');
      }
      
      return false;
    }
  }, [registration, showToasts]);

  // Clear the cache
  const clearCache = useCallback(async () => {
    if (!registration || !registration.active) {
      return false;
    }
    
    try {
      registration.active.postMessage({
        type: 'CLEAR_CACHE'
      });
      
      if (showToasts) {
        toast.success('Cache cleared successfully');
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      
      if (showToasts) {
        toast.error('Failed to clear cache');
      }
      
      return false;
    }
  }, [registration, showToasts]);

  // Update service worker settings
  const updateSettings = useCallback(async (settings: any) => {
    if (!registration || !registration.active) {
      return false;
    }
    
    try {
      // Create a message channel for this request
      const settingsChannel = new MessageChannel();
      
      const settingsPromise = new Promise((resolve) => {
        settingsChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
      });
      
      // Send the settings to the service worker
      registration.active.postMessage({
        type: 'UPDATE_SETTINGS',
        settings
      }, [settingsChannel.port2]);
      
      const result = await settingsPromise;
      
      if ((result as any).success) {
        if (showToasts) {
          toast.success('Service worker settings updated');
        }
        return true;
      } else {
        if (showToasts) {
          toast.error(`Failed to update settings: ${(result as any).error || 'Unknown error'}`);
        }
        return false;
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      
      if (showToasts) {
        toast.error('Failed to update service worker settings');
      }
      
      return false;
    }
  }, [registration, showToasts]);

  return {
    registration,
    isActive,
    updateAvailable,
    isInitializing,
    pendingTasks,
    update,
    unregister,
    skipWaiting,
    sendMessage,
    scheduleTask,
    cancelTask,
    getSyncStatus,
    processQueue,
    clearCache,
    updateSettings
  };
}
