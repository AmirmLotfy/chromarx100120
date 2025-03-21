
import { useState, useEffect, useCallback } from 'react';
import { isChromeExtension } from '@/lib/utils';
import { toast } from 'sonner';

interface OfflineStatusHookResult {
  isOffline: boolean;
  isChecking: boolean;
  checkConnection: () => Promise<boolean>;
  lastChecked: Date | null;
  setForceOffline: (offline: boolean) => void;
}

export function useOfflineStatus(): OfflineStatusHookResult {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [forceOffline, setForceOffline] = useState(false);

  // Function to check connection status
  const checkConnection = useCallback(async () => {
    setIsChecking(true);
    
    try {
      // If we're forcing offline mode, skip the actual check
      if (forceOffline) {
        setIsOffline(true);
        setLastChecked(new Date());
        return false;
      }
      
      // Try to fetch a small resource (favicon) to test connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const isOnline = response.ok;
      setIsOffline(!isOnline);
      setLastChecked(new Date());
      
      // If in Chrome Extension environment, notify the service worker of status change
      if (isChromeExtension() && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ONLINE_STATUS_CHANGE',
          isOnline
        });
      }
      
      return isOnline;
    } catch (error) {
      // If fetch fails, we're offline
      setIsOffline(true);
      setLastChecked(new Date());
      
      // Notify service worker if in extension context
      if (isChromeExtension() && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ONLINE_STATUS_CHANGE',
          isOnline: false
        });
      }
      
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [forceOffline]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (!forceOffline) {
        toast.info('Connection restored.');
        setIsOffline(false);
        setLastChecked(new Date());
        
        // Double-check with an actual network request
        checkConnection();
      }
    };
    
    const handleOffline = () => {
      toast.warning('You are offline. Using local data.');
      setIsOffline(true);
      setLastChecked(new Date());
      
      // Notify service worker if in extension context
      if (isChromeExtension() && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ONLINE_STATUS_CHANGE',
          isOnline: false
        });
      }
    };
    
    // Listen for service worker messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'ONLINE_STATUS_UPDATE') {
        setIsOffline(!event.data.isOnline);
        setLastChecked(new Date());
      }
    };
    
    // Set up event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }
    
    // Initial check
    checkConnection();
    
    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, [checkConnection, forceOffline]);

  // Override the online status when force offline is toggled
  useEffect(() => {
    if (forceOffline) {
      setIsOffline(true);
    } else if (navigator.onLine) {
      // Only set to online if browser reports as online
      checkConnection();
    }
  }, [forceOffline, checkConnection]);

  return {
    isOffline: isOffline || forceOffline,
    isChecking,
    checkConnection,
    lastChecked,
    setForceOffline
  };
}

export default useOfflineStatus;
