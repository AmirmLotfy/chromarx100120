
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useOfflineStatus(options?: { 
  showToasts?: boolean;
  onlineCallback?: () => void;
  offlineCallback?: () => void;
}) {
  const { 
    showToasts = false, 
    onlineCallback, 
    offlineCallback 
  } = options || {};
  
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (showToasts) {
        toast.success('You are back online');
      }
      if (onlineCallback) {
        onlineCallback();
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
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToasts, onlineCallback, offlineCallback]);

  return { isOffline };
}
