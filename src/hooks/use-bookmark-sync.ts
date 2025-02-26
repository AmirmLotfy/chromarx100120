
import { useState, useEffect } from 'react';
import { syncService } from '@/services/syncService';
import { ChromeBookmark } from '@/types/bookmark';
import { auth } from '@/lib/chrome-utils';

export const useBookmarkSync = (onBookmarksChange: (bookmarks: ChromeBookmark[]) => void) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    const initializeSync = async () => {
      const user = await auth.getCurrentUser();
      if (!user) return;

      // Subscribe to real-time changes
      syncService.subscribeToChanges(user.id, onBookmarksChange);

      // Get initial sync status
      const status = await syncService.getSyncStatus(user.id);
      if (status) {
        setSyncStatus(status.status);
        setLastSynced(status.last_sync);
      }
    };

    initializeSync();
  }, [onBookmarksChange]);

  const updateBookmark = async (bookmark: ChromeBookmark) => {
    const user = await auth.getCurrentUser();
    if (!user) return;

    const operation = {
      type: 'update',
      data: { ...bookmark, user_id: user.id }
    };

    await syncService.addToOfflineQueue(operation);
  };

  const deleteBookmark = async (bookmarkId: string) => {
    const user = await auth.getCurrentUser();
    if (!user) return;

    const operation = {
      type: 'delete',
      data: { id: bookmarkId }
    };

    await syncService.addToOfflineQueue(operation);
  };

  return {
    syncStatus,
    lastSynced,
    updateBookmark,
    deleteBookmark
  };
};
