
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { isChromeExtension } from '@/lib/utils';

interface ServiceWorkerOptions {
  showToasts?: boolean;
  autoRegister?: boolean;
  onSuccess?: () => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

export function useOptimizedServiceWorker({
  showToasts = true,
  autoRegister = true,
  onSuccess,
  onUpdate,
  onError
}: ServiceWorkerOptions = {}) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      setIsInitializing(false);
      if (showToasts) {
        toast.warning('Offline mode not supported in this browser');
      }
      return;
    }

    try {
      // Use the appropriate service worker based on environment
      const swPath = isChromeExtension() 
        ? '/service-worker.js'        // Use original for extension
        : '/optimized-service-worker.js';  // Use optimized for web
      
      console.log(`Registering service worker from: ${swPath}`);
      const reg = await navigator.serviceWorker.register(swPath, { 
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      });
      
      setRegistration(reg);
      setIsActive(!!reg.active);
      
      if (showToasts) {
        toast.success('Offline mode activated');
      }
      
      if (onSuccess) {
        onSuccess();
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
            }
          });
        }
      });
      
      // Setup communication with the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (!event.data) return;
        
        switch (event.data.type) {
          case 'CACHE_CLEARED':
            if (showToasts) {
              toast.success('Cache cleared successfully');
            }
            break;
            
          case 'PROCESS_OFFLINE_QUEUE':
            // This would trigger offline queue processing in the app
            console.log('Received request to process offline queue');
            // Custom event for components to listen to
            window.dispatchEvent(new CustomEvent('process-offline-queue'));
            break;
            
          case 'CHECK_FOR_UPDATES':
            // Trigger an update check
            registration?.update();
            break;
        }
      });
      
    } catch (error) {
      console.error('Error during service worker registration:', error);
      
      if (showToasts) {
        toast.error('Failed to enable offline mode');
      }
      
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  const update = async () => {
    if (!registration) return false;
    
    try {
      await registration.update();
      return true;
    } catch (error) {
      console.error('Error updating service worker:', error);
      return false;
    }
  };

  const unregister = async () => {
    if (!registration) return false;
    
    try {
      const success = await registration.unregister();
      if (success) {
        setRegistration(null);
        setIsActive(false);
        setUpdateAvailable(false);
        
        if (showToasts) {
          toast.success('Offline mode deactivated');
        }
      }
      return success;
    } catch (error) {
      console.error('Error unregistering service worker:', error);
      return false;
    }
  };

  const skipWaiting = async () => {
    if (!registration || !registration.waiting) return false;
    
    try {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      return true;
    } catch (error) {
      console.error('Error skipping waiting:', error);
      return false;
    }
  };
  
  // Communicate with service worker
  const clearCache = async () => {
    if (!navigator.serviceWorker.controller) return false;
    
    try {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE'
      });
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  };

  // Register service worker on mount if autoRegister is true
  useEffect(() => {
    if (autoRegister) {
      registerServiceWorker();
    } else {
      setIsInitializing(false);
    }
  }, [autoRegister]);

  return {
    registration,
    isActive,
    updateAvailable,
    isInitializing,
    registerServiceWorker,
    update,
    unregister,
    skipWaiting,
    clearCache
  };
}
