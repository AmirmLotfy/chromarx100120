
import { useState, useEffect, useCallback } from 'react';
import { syncService } from '@/services/syncService';
import { ChromeBookmark } from '@/types/bookmark';
import { auth } from '@/lib/chrome-utils';
import { toast } from 'sonner';
import { chromeDb } from '@/lib/chrome-storage';

export const useBookmarkSync = (onBookmarksChange: (bookmarks: ChromeBookmark[]) => void) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'success'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(navigator.onLine);
  const [syncProgress, setSyncProgress] = useState<number>(0);

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsConnected(true);
    const handleOffline = () => setIsConnected(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize sync
  useEffect(() => {
    const initializeSync = async () => {
      try {
        const user = await auth.getCurrentUser();
        if (!user) {
          console.log('No user found, skipping sync initialization');
          return;
        }

        // Subscribe to real-time changes
        await syncService.subscribeToChanges(user.id, onBookmarksChange);

        // Get initial sync status
        const status = await syncService.getSyncStatus(user.id);
        if (status) {
          setSyncStatus(status.status);
          setLastSynced(status.last_sync);
        }

        // Initial sync from local to server if needed
        const lastSyncTime = await chromeDb.get<string>('last_bookmark_sync');
        const shouldSync = !lastSyncTime || 
          (new Date().getTime() - new Date(lastSyncTime).getTime() > 1000 * 60 * 60); // 1 hour
        
        if (shouldSync) {
          const bookmarks = await chromeDb.get<ChromeBookmark[]>('bookmarks');
          if (bookmarks && bookmarks.length > 0) {
            await syncService.syncAllBookmarks(user.id, bookmarks);
            await chromeDb.set('last_bookmark_sync', new Date().toISOString());
          }
        }

      } catch (error) {
        console.error('Error initializing sync:', error);
        toast.error('Error initializing bookmark sync');
      }
    };

    initializeSync();
  }, [onBookmarksChange]);

  // Create bookmark operation
  const createBookmark = useCallback(async (bookmark: ChromeBookmark) => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        toast.error('You must be signed in to create bookmarks');
        return;
      }

      const operation = {
        type: 'create',
        data: { 
          ...bookmark, 
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      await syncService.addToOfflineQueue(operation);
      
      // Update local storage immediately for responsiveness
      const bookmarks = await chromeDb.get<ChromeBookmark[]>('bookmarks') || [];
      bookmarks.push(bookmark);
      await chromeDb.set('bookmarks', bookmarks);
      
      onBookmarksChange(bookmarks);
    } catch (error) {
      console.error('Error creating bookmark:', error);
      toast.error('Failed to create bookmark');
    }
  }, [onBookmarksChange]);

  // Update bookmark operation
  const updateBookmark = useCallback(async (bookmark: ChromeBookmark) => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        toast.error('You must be signed in to update bookmarks');
        return;
      }

      const operation = {
        type: 'update',
        data: { 
          ...bookmark, 
          user_id: user.id,
          updated_at: new Date().toISOString()
        }
      };

      await syncService.addToOfflineQueue(operation);
      
      // Update local storage immediately for responsiveness
      const bookmarks = await chromeDb.get<ChromeBookmark[]>('bookmarks') || [];
      const index = bookmarks.findIndex(b => b.id === bookmark.id);
      if (index !== -1) {
        bookmarks[index] = {
          ...bookmark,
          version: (bookmark.version || 1) + 1
        };
        await chromeDb.set('bookmarks', bookmarks);
        onBookmarksChange(bookmarks);
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast.error('Failed to update bookmark');
    }
  }, [onBookmarksChange]);

  // Delete bookmark operation
  const deleteBookmark = useCallback(async (bookmarkId: string) => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        toast.error('You must be signed in to delete bookmarks');
        return;
      }

      const operation = {
        type: 'delete',
        data: { 
          id: bookmarkId,
          user_id: user.id
        }
      };

      await syncService.addToOfflineQueue(operation);
      
      // Update local storage immediately for responsiveness
      const bookmarks = await chromeDb.get<ChromeBookmark[]>('bookmarks') || [];
      const filteredBookmarks = bookmarks.filter(b => b.id !== bookmarkId);
      await chromeDb.set('bookmarks', filteredBookmarks);
      onBookmarksChange(filteredBookmarks);
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast.error('Failed to delete bookmark');
    }
  }, [onBookmarksChange]);

  // Force sync all bookmarks
  const syncAllBookmarks = useCallback(async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        toast.error('You must be signed in to sync bookmarks');
        return;
      }

      setSyncStatus('syncing');
      setSyncProgress(0);
      
      const bookmarks = await chromeDb.get<ChromeBookmark[]>('bookmarks') || [];
      if (bookmarks.length === 0) {
        toast.info('No bookmarks to sync');
        setSyncStatus('success');
        setLastSynced(new Date().toISOString());
        return;
      }
      
      // Process in batches
      const batchSize = 50;
      const totalBatches = Math.ceil(bookmarks.length / batchSize);
      
      for (let i = 0; i < bookmarks.length; i += batchSize) {
        const batch = bookmarks.slice(i, i + batchSize);
        await syncService.syncAllBookmarks(user.id, batch);
        
        const progress = Math.min(100, Math.round(((i + batch.length) / bookmarks.length) * 100));
        setSyncProgress(progress);
      }
      
      await chromeDb.set('last_bookmark_sync', new Date().toISOString());
      setSyncStatus('success');
      setLastSynced(new Date().toISOString());
      toast.success('All bookmarks synced successfully');
    } catch (error) {
      console.error('Error syncing all bookmarks:', error);
      setSyncStatus('error');
      toast.error('Failed to sync bookmarks');
    } finally {
      setSyncProgress(0);
    }
  }, []);

  return {
    syncStatus,
    lastSynced,
    isConnected,
    syncProgress,
    createBookmark,
    updateBookmark,
    deleteBookmark,
    syncAllBookmarks
  };
};
