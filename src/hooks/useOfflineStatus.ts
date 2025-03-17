
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Enhanced hook to monitor and manage offline status
 * Provides additional functionality for working with service worker
 */
export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);
  const [lastOnlineTime, setLastOnlineTime] = useState<number | null>(null);
  const [hasNetworkListeners, setHasNetworkListeners] = useState(false);
  const [serviceWorkerActive, setServiceWorkerActive] = useState(false);

  // Set up network status listeners
  useEffect(() => {
    if (hasNetworkListeners) return;

    const handleOnline = () => {
      setIsOffline(false);
      setLastOnlineTime(Date.now());
      console.log('Connection restored, device is online');
      
      // Notify service worker of online status change
      if (serviceWorkerActive && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ONLINE_STATUS_CHANGE',
          isOnline: true
        });
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      console.log('Connection lost, device is offline');
      
      // Notify service worker of online status change
      if (serviceWorkerActive && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'ONLINE_STATUS_CHANGE',
          isOnline: false
        });
      }
      
      // Show toast notification
      toast.warning('You are offline. Changes will be saved locally and synced when you reconnect.');
    };

    // Check initial status using Network Information API if available
    if ('connection' in navigator && navigator.connection) {
      const connection = navigator.connection as any;
      setIsOffline(connection.type === 'none');
      
      // Listen for connection changes if supported
      if (connection.addEventListener) {
        connection.addEventListener('change', () => {
          setIsOffline(connection.type === 'none');
          
          if (connection.type !== 'none') {
            setLastOnlineTime(Date.now());
          }
        });
      }
    }

    // Set up standard online/offline listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Also listen for service worker messages
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'ONLINE_STATUS_UPDATE') {
        setIsOffline(!event.data.isOnline);
        
        if (event.data.isOnline) {
          setLastOnlineTime(Date.now());
        }
      }
    });
    
    setHasNetworkListeners(true);

    // Initial status check
    setIsOffline(!navigator.onLine);
    
    if (navigator.onLine) {
      setLastOnlineTime(Date.now());
    }

    // Check for service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setServiceWorkerActive(true);
        console.log('Service worker is active and ready');
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasNetworkListeners, serviceWorkerActive]);

  // Function to manually check connection
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      // Perform a fetch to check connectivity
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      const isOnline = response.ok;
      setIsOffline(!isOnline);
      
      if (isOnline) {
        setLastOnlineTime(Date.now());
      }
      
      return isOnline;
    } catch (error) {
      setIsOffline(true);
      return false;
    }
  }, []);

  // Function to trigger syncing when back online
  const syncWhenOnline = useCallback(async () => {
    if (isOffline) {
      toast.info('Sync requested. Will sync when back online.');
      return false;
    }
    
    if (serviceWorkerActive && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'PROCESS_QUEUE'
      });
      
      toast.success('Syncing data...');
      return true;
    } else {
      // Fallback if no service worker
      toast.info('Sync requested but service worker is not active.');
      return false;
    }
  }, [isOffline, serviceWorkerActive]);

  return {
    isOffline,
    lastOnlineTime,
    serviceWorkerActive,
    checkConnection,
    syncWhenOnline
  };
}
