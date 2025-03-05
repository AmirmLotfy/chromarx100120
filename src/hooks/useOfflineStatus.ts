
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface OfflineStatusOptions {
  showToasts?: boolean;
  onlineCallback?: () => void;
  offlineCallback?: () => void;
  checkInterval?: number;
}

export function useOfflineStatus(options?: OfflineStatusOptions) {
  const { 
    showToasts = false, 
    onlineCallback, 
    offlineCallback,
    checkInterval = 30000 // Check connectivity every 30 seconds
  } = options || {};
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );

  // Check if service worker is available and registered
  const [isServiceWorkerActive, setIsServiceWorkerActive] = useState(false);

  useEffect(() => {
    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration()
        .then(registration => {
          setIsServiceWorkerActive(!!registration && 
            (registration.active?.state === 'activated' || 
             registration.active?.state === 'activating'));
        })
        .catch(err => console.error('Service worker check failed:', err));
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setLastOnlineTime(new Date());
      
      if (showToasts) {
        toast.success('You are back online');
      }
      
      if (onlineCallback) {
        onlineCallback();
      }
      
      // Notify service worker that we're back online
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ONLINE_STATUS_CHANGE',
          isOnline: true
        });
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      
      if (showToasts) {
        toast.warning('You are offline. Changes will be synced when connection is restored.', {
          duration: 5000
        });
      }
      
      if (offlineCallback) {
        offlineCallback();
      }
      
      // Notify service worker that we're offline
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ONLINE_STATUS_CHANGE',
          isOnline: false
        });
      }
    };

    // Set up active connection checking
    const checkConnection = async () => {
      try {
        // Try to fetch a small resource to confirm actual connectivity
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok && isOffline) {
          // We have connectivity but state says offline
          handleOnline();
        }
      } catch (error) {
        // If fetch fails and we think we're online, we're actually offline
        if (!isOffline && navigator.onLine) {
          handleOffline();
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set up interval for connection checking
    const intervalId = setInterval(checkConnection, checkInterval);
    
    // Initial check
    checkConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [showToasts, onlineCallback, offlineCallback, isOffline, checkInterval]);

  return { 
    isOffline,
    lastOnlineTime,
    isServiceWorkerActive,
    checkConnection: async () => {
      try {
        // Fix: Replace the invalid 'timeout' property with AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/favicon.ico', {
          method: 'HEAD',
          cache: 'no-store',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          if (isOffline) {
            setIsOffline(false);
            setLastOnlineTime(new Date());
            if (onlineCallback) onlineCallback();
            if (showToasts) toast.success('Connection restored');
          }
          return true;
        }
        return false;
      } catch (error) {
        if (!isOffline) {
          setIsOffline(true);
          if (offlineCallback) offlineCallback();
          if (showToasts) toast.error('Connection lost');
        }
        return false;
      }
    }
  };
}
