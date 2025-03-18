
import { useState, useEffect } from 'react';

/**
 * Hook to detect and manage online/offline state with custom events and handlers
 */
export function useOfflineDetector() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [reconnected, setReconnected] = useState(false);

  useEffect(() => {
    // Handle offline detection
    const goOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
      setReconnected(false);
    };

    // Handle coming back online
    const goOnline = () => {
      if (isOffline) {
        setReconnected(true);
      }
      setIsOffline(false);
    };

    // Add event listeners
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Try to detect if network requests are failing even though browser reports online
    let pingInterval: number | undefined;
    
    // Only if the browser thinks we're online, regularly check connectivity
    if (navigator.onLine) {
      pingInterval = window.setInterval(async () => {
        try {
          // Send a tiny request to check real connectivity
          // Using a timestamp to prevent caching
          const response = await fetch(`/offline.html?cache-check=${Date.now()}`, {
            method: 'HEAD',
            // Short timeout
            signal: AbortSignal.timeout(3000)
          });
          
          if (!response.ok) {
            goOffline();
          } else if (isOffline) {
            goOnline();
          }
        } catch (error) {
          // If fetch fails, we're likely offline
          goOffline();
        }
      }, 30000); // Check every 30 seconds
    }

    // Clean up event listeners and intervals
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      if (pingInterval) clearInterval(pingInterval);
    };
  }, [isOffline]);

  // Reset the reconnected flag after it's been used
  const acknowledgeReconnection = () => {
    setReconnected(false);
  };

  return {
    isOffline,
    wasOffline,
    reconnected,
    acknowledgeReconnection
  };
}
