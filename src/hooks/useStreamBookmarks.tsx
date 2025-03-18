
/**
 * Hook for stream-based bookmark processing
 * Provides a React interface to the stream bookmark storage service
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChromeBookmark } from '@/types/bookmark';
import { streamBookmarkStorage } from '@/services/streamBookmarkStorage';
import { toast } from 'sonner';

interface BookmarkSearchOptions {
  query?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'title' | 'dateAdded' | 'category' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  categoryFilter?: string;
  tagFilter?: string[];
}

interface SyncStatus {
  syncing: boolean;
  progress: number;
  lastSynced: Date | null;
  error: Error | null;
}

export function useStreamBookmarks() {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [bookmarkCount, setBookmarkCount] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    syncing: false,
    progress: 0,
    lastSynced: null,
    error: null
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Initialize the bookmark storage
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        await streamBookmarkStorage.initialize();
        
        // Load initial data
        const [initialBookmarks, allCategories, count] = await Promise.all([
          streamBookmarkStorage.getRecentBookmarks(50),
          streamBookmarkStorage.getAllCategories(),
          streamBookmarkStorage.getBookmarkCount()
        ]);
        
        setBookmarks(initialBookmarks);
        setCategories(allCategories);
        setBookmarkCount(count);
      } catch (err) {
        console.error('Error initializing bookmark storage:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        toast.error('Failed to initialize bookmarks');
      } finally {
        setLoading(false);
      }
    };
    
    initialize();
    
    // Clean up function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  // Load recent bookmarks
  const loadRecentBookmarks = useCallback(async (limit = 50, offset = 0) => {
    try {
      setLoading(true);
      const recent = await streamBookmarkStorage.getRecentBookmarks(limit, offset);
      setBookmarks(recent);
      return recent;
    } catch (err) {
      console.error('Error loading recent bookmarks:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      toast.error('Failed to load recent bookmarks');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Search bookmarks
  const searchBookmarks = useCallback(async (options: BookmarkSearchOptions = {}) => {
    try {
      setLoading(true);
      
      // Cancel any ongoing search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      const results = await streamBookmarkStorage.searchBookmarks(options);
      
      if (!abortControllerRef.current.signal.aborted) {
        setBookmarks(results);
      }
      
      return results;
    } catch (err) {
      console.error('Error searching bookmarks:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      if (!(error.message.includes('aborted'))) {
        setError(error);
        toast.error('Search failed');
      }
      
      throw error;
    } finally {
      if (abortControllerRef.current?.signal.aborted === false) {
        setLoading(false);
      }
    }
  }, []);
  
  // Cancel ongoing operations
  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      toast.info('Operation cancelled');
    }
  }, []);
  
  // Add a bookmark
  const addBookmark = useCallback(async (bookmark: ChromeBookmark) => {
    try {
      await streamBookmarkStorage.addBookmark(bookmark);
      
      // Update bookmarks if this would be shown in the current view
      setBookmarks(prev => {
        if (prev.length === 0 || bookmark.dateAdded > (prev[0].dateAdded || 0)) {
          return [bookmark, ...prev].slice(0, prev.length);
        }
        return prev;
      });
      
      // Update bookmark count
      setBookmarkCount(prev => prev + 1);
      
      // Update categories if necessary
      if (bookmark.category && !categories.includes(bookmark.category)) {
        setCategories(prev => [...prev, bookmark.category!]);
      }
      
      toast.success('Bookmark added');
      return bookmark;
    } catch (err) {
      console.error('Error adding bookmark:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast.error('Failed to add bookmark');
      throw error;
    }
  }, [categories]);
  
  // Update a bookmark
  const updateBookmark = useCallback(async (bookmark: ChromeBookmark) => {
    try {
      await streamBookmarkStorage.updateBookmark(bookmark);
      
      // Update the bookmarks list if the updated bookmark is in it
      setBookmarks(prev => {
        const index = prev.findIndex(b => b.id === bookmark.id);
        if (index >= 0) {
          const updatedBookmarks = [...prev];
          updatedBookmarks[index] = bookmark;
          return updatedBookmarks;
        }
        return prev;
      });
      
      // Update categories if necessary
      if (bookmark.category && !categories.includes(bookmark.category)) {
        setCategories(prev => [...prev, bookmark.category!]);
      }
      
      toast.success('Bookmark updated');
      return bookmark;
    } catch (err) {
      console.error('Error updating bookmark:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast.error('Failed to update bookmark');
      throw error;
    }
  }, [categories]);
  
  // Delete a bookmark
  const deleteBookmark = useCallback(async (id: string) => {
    try {
      await streamBookmarkStorage.deleteBookmark(id);
      
      // Update the bookmarks list
      setBookmarks(prev => prev.filter(b => b.id !== id));
      
      // Update bookmark count
      setBookmarkCount(prev => Math.max(0, prev - 1));
      
      toast.success('Bookmark deleted');
      return true;
    } catch (err) {
      console.error('Error deleting bookmark:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast.error('Failed to delete bookmark');
      throw error;
    }
  }, []);
  
  // Delete multiple bookmarks
  const deleteBookmarks = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    
    try {
      // Create new abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      await streamBookmarkStorage.deleteBookmarks(ids);
      
      // Update the bookmarks list
      setBookmarks(prev => prev.filter(b => !ids.includes(b.id)));
      
      // Update bookmark count
      setBookmarkCount(prev => Math.max(0, prev - ids.length));
      
      toast.success(`${ids.length} bookmarks deleted`);
      return true;
    } catch (err) {
      console.error('Error deleting bookmarks:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      if (!error.message.includes('aborted')) {
        toast.error('Failed to delete bookmarks');
      }
      
      throw error;
    } finally {
      if (abortControllerRef.current?.signal.aborted === false) {
        setLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, []);
  
  // Sync bookmarks from Chrome
  const syncFromChromeBookmarks = useCallback(async (forceRefresh = false) => {
    try {
      // Create new abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      
      setSyncStatus({
        syncing: true,
        progress: 0,
        lastSynced: syncStatus.lastSynced,
        error: null
      });
      
      const syncedBookmarks = await streamBookmarkStorage.syncFromChromeBookmarks({
        forceRefresh,
        onProgress: (progress) => {
          setSyncStatus(prev => ({
            ...prev,
            progress
          }));
        },
        onBatchComplete: (batch) => {
          console.log(`Synced batch of ${batch.length} bookmarks`);
        },
        signal: abortControllerRef.current.signal
      });
      
      if (!abortControllerRef.current.signal.aborted) {
        // Update bookmarks view with the most recent
        const recent = syncedBookmarks
          .sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0))
          .slice(0, 50);
          
        setBookmarks(recent);
        
        // Update metadata
        const [allCategories, count] = await Promise.all([
          streamBookmarkStorage.getAllCategories(),
          streamBookmarkStorage.getBookmarkCount()
        ]);
        
        setCategories(allCategories);
        setBookmarkCount(count);
        
        setSyncStatus({
          syncing: false,
          progress: 100,
          lastSynced: new Date(),
          error: null
        });
        
        toast.success(`Synced ${syncedBookmarks.length} bookmarks from Chrome`);
      }
      
      return syncedBookmarks;
    } catch (err) {
      console.error('Error syncing from Chrome bookmarks:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      if (!error.message.includes('aborted')) {
        setSyncStatus({
          syncing: false,
          progress: 0,
          lastSynced: syncStatus.lastSynced,
          error
        });
        
        toast.error('Failed to sync bookmarks from Chrome');
      }
      
      throw error;
    } finally {
      if (abortControllerRef.current?.signal.aborted) {
        setSyncStatus({
          syncing: false,
          progress: 0,
          lastSynced: syncStatus.lastSynced,
          error: null
        });
      }
      
      abortControllerRef.current = null;
    }
  }, [syncStatus.lastSynced]);
  
  // Get bookmark by ID
  const getBookmark = useCallback(async (id: string) => {
    try {
      return await streamBookmarkStorage.getBookmark(id);
    } catch (err) {
      console.error('Error getting bookmark:', err);
      throw err;
    }
  }, []);
  
  // Refresh all metadata
  const refreshMetadata = useCallback(async () => {
    try {
      setLoading(true);
      
      const [allCategories, count] = await Promise.all([
        streamBookmarkStorage.getAllCategories(),
        streamBookmarkStorage.getBookmarkCount()
      ]);
      
      setCategories(allCategories);
      setBookmarkCount(count);
    } catch (err) {
      console.error('Error refreshing metadata:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    bookmarks,
    loading,
    error,
    categories,
    bookmarkCount,
    syncStatus,
    
    // Actions
    loadRecentBookmarks,
    searchBookmarks,
    cancelOperation,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    deleteBookmarks,
    syncFromChromeBookmarks,
    getBookmark,
    refreshMetadata
  };
}
