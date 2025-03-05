
import { useState, useEffect, useCallback } from 'react';
import { syncService } from '@/services/syncService';
import { useAuth } from '@/hooks/useAuth';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { supabaseBackup } from '@/services/supabaseBackupService';

export function useSyncStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [conflicts, setConflicts] = useState(0);
  const { isOffline } = useOfflineStatus();

  // Function to check pending changes and conflicts
  const checkPendingChanges = useCallback(async () => {
    try {
      const queue = await syncService.getOfflineQueueCount();
      setPendingChanges(queue);
      
      const conflictCount = await syncService.getConflictCount();
      setConflicts(conflictCount);
    } catch (error) {
      console.error('Error checking pending changes:', error);
    }
  }, []);

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
    checkPendingChanges();
    
    // Set up an interval to periodically check pending changes
    const interval = setInterval(() => {
      checkPendingChanges();
      // Trigger backup if we're online
      if (!isOffline && user) {
        supabaseBackup.syncAll().catch(console.error);
      }
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user, isOffline, checkPendingChanges]);

  // When coming back online, check pending changes and show notifications
  useEffect(() => {
    if (!isOffline && user && pendingChanges > 0) {
      syncService.processOfflineQueue()
        .then(() => checkPendingChanges())
        .catch(console.error);
    }
  }, [isOffline, user, pendingChanges, checkPendingChanges]);

  return {
    isOnline: !isOffline,
    status,
    lastSynced,
    pendingChanges,
    conflicts,
    syncInProgress: status === 'syncing',
    triggerBackup: supabaseBackup.syncAll.bind(supabaseBackup),
    restoreFromBackup: supabaseBackup.restoreFromBackup.bind(supabaseBackup)
  };
}
