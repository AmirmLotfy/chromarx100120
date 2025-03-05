
import { useState, useEffect } from 'react';
import { syncService } from '@/services/syncService';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

export function useSyncStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const { isOffline } = useOfflineStatus();

  // Fetch initial sync status
  useEffect(() => {
    if (!user) return;

    const fetchSyncStatus = async () => {
      try {
        const syncStatus = await syncService.getSyncStatus(user.id);
        if (syncStatus) {
          setStatus(syncStatus.status);
          setLastSynced(syncStatus.last_sync);
        }
      } catch (error) {
        console.error('Error fetching sync status:', error);
      }
    };

    fetchSyncStatus();

    // Also check the offline queue to get pending changes count
    const checkPendingChanges = async () => {
      const queue = await syncService.getOfflineQueueCount();
      setPendingChanges(queue);
    };

    checkPendingChanges();
    
    // Set up an interval to periodically check pending changes
    const interval = setInterval(checkPendingChanges, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user]);

  // When coming back online, check pending changes and show notifications
  useEffect(() => {
    if (!isOffline && user && pendingChanges > 0) {
      syncService.processOfflineQueue()
        .then(() => setPendingChanges(0))
        .catch(console.error);
    }
  }, [isOffline, user, pendingChanges]);

  return {
    isOnline: !isOffline,
    status,
    lastSynced,
    pendingChanges,
    syncInProgress: status === 'syncing'
  };
}
