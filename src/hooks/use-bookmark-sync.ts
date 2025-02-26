
import { useState, useEffect } from 'react';
import { ChromeBookmark } from '@/types/bookmark';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  saveBookmarkMetadata,
  getBookmarkMetadata,
  updateBookmarkHealth,
  updateBookmarkAnalytics
} from '@/utils/bookmarkDatabaseUtils';

export const useBookmarkSync = (userId: string | null) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const syncBookmark = async (bookmark: ChromeBookmark) => {
    if (!userId) return;

    try {
      // Save basic metadata
      await saveBookmarkMetadata(bookmark, userId);

      // Check bookmark health
      const response = await fetch(bookmark.url || '');
      await updateBookmarkHealth(bookmark.id, userId, {
        is_accessible: response.ok,
        response_time: response.status,
        error_message: response.ok ? undefined : `HTTP ${response.status}`,
      });

      // Update analytics
      await updateBookmarkAnalytics(bookmark.id, userId, {
        visit_count: 0,
      });

    } catch (error) {
      console.error('Error syncing bookmark:', error);
      if (error instanceof Error) {
        toast.error(`Failed to sync bookmark: ${error.message}`);
      }
    }
  };

  const syncAllBookmarks = async (bookmarks: ChromeBookmark[]) => {
    if (!userId) {
      toast.error('Please sign in to sync bookmarks');
      return;
    }

    setIsSyncing(true);
    try {
      await Promise.all(bookmarks.map(bookmark => syncBookmark(bookmark)));
      setLastSynced(new Date());
      toast.success('All bookmarks synced successfully');
    } catch (error) {
      console.error('Error syncing bookmarks:', error);
      toast.error('Failed to sync some bookmarks');
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    syncBookmark,
    syncAllBookmarks,
    isSyncing,
    lastSynced
  };
};
