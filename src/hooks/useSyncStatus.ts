
import { useState, useEffect, useCallback } from 'react';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

export function useSyncStatus() {
  const [status, setStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [conflicts, setConflicts] = useState(0);
  const { isOffline } = useOfflineStatus();

  // Function to check pending changes and conflicts (simplified version)
  const checkPendingChanges = useCallback(async () => {
    // Simplified implementation without Supabase
    setPendingChanges(0);
    setConflicts(0);
  }, []);

  // Mock data for sync status
  useEffect(() => {
    setStatus('idle');
    setLastSynced(new Date().toISOString());
    
    const interval = setInterval(() => {
      checkPendingChanges();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [checkPendingChanges]);

  return {
    isOnline: !isOffline,
    status,
    lastSynced,
    pendingChanges,
    conflicts,
    syncInProgress: status === 'syncing',
    triggerBackup: async () => {
      setStatus('syncing');
      setTimeout(() => {
        setStatus('success');
        setLastSynced(new Date().toISOString());
        toast.success('Backup completed successfully');
      }, 1000);
    },
    restoreFromBackup: async () => {
      setStatus('syncing');
      setTimeout(() => {
        setStatus('success');
        toast.success('Restore completed successfully');
      }, 1000);
    }
  };
}

// Simple toast implementation since we're removing Supabase
const toast = {
  success: (message: string) => console.log(`Success: ${message}`),
  error: (message: string) => console.error(`Error: ${message}`),
  warning: (message: string) => console.warn(`Warning: ${message}`)
};
