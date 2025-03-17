
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { isChromeExtension } from '@/lib/utils';

interface ServiceWorkerOptions {
  path?: string;
  scope?: string;
  onSuccess?: () => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
  showToasts?: boolean;
}

export function useServiceWorker({
  path,
  scope = '/',
  onSuccess,
  onUpdate,
  onError,
  showToasts = true
}: ServiceWorkerOptions = {}) {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Determine which service worker to use based on environment
    const defaultPath = isChromeExtension() 
      ? '/service-worker.js'
      : '/improved-service-worker.js';
    
    const swPath = path || defaultPath;
    
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          console.log(`Registering service worker from: ${swPath}`);
          const reg = await navigator.serviceWorker.register(swPath, { scope });
          
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
          
          // Handle controller changes (when an update is activated)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service worker controller changed');
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
      
      registerServiceWorker();
      
      return () => {
        // Nothing to clean up for service worker registrations as they persist
      };
    } else {
      if (showToasts) {
        toast.warning('Offline mode not supported in this browser');
      }
      setIsInitializing(false);
    }
  }, [path, scope, onSuccess, onUpdate, onError, showToasts]);

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

  return {
    registration,
    isActive,
    updateAvailable,
    isInitializing,
    update,
    unregister,
    skipWaiting
  };
}
