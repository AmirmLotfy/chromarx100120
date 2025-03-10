
import { useState, useEffect, useCallback } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { bookmarkLoader } from "@/utils/bookmarkLoader";
import { toast } from "sonner";
import { useOfflineStatus } from "./useOfflineStatus";

type BookmarkLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

export function useOptimizedBookmarks() {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<ChromeBookmark[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<BookmarkLoadingStatus>('idle');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const { isOffline } = useOfflineStatus();

  // Initialize the loader
  useEffect(() => {
    if (!isInitialized) {
      bookmarkLoader.initialize().then(() => {
        setIsInitialized(true);
      });
    }
  }, [isInitialized]);

  // Load bookmarks with progress tracking
  const loadBookmarks = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      bookmarkLoader.clearCache();
    }
    
    if (loadingStatus === 'loading') return;
    
    setLoadingStatus('loading');
    setLoadingProgress(0);
    
    try {
      // Initial load - this might return cached data immediately
      const initialBookmarks = await bookmarkLoader.loadBookmarks(
        // Progress callback
        (progress) => {
          setLoadingProgress(progress);
        },
        // Batch complete callback - update the UI as we get more data
        (newBatch) => {
          setBookmarks(current => {
            // Merge without duplicates
            const idSet = new Set(current.map(b => b.id));
            const uniqueNewBookmarks = newBatch.filter(b => !idSet.has(b.id));
            return [...current, ...uniqueNewBookmarks];
          });
        }
      );
      
      // Set initial data if we got any
      if (initialBookmarks.length > 0) {
        setBookmarks(initialBookmarks);
      }
      
      setLoadingStatus('loaded');
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast.error('Failed to load bookmarks');
      setLoadingStatus('error');
    } finally {
      setLoadingProgress(100);
    }
  }, [loadingStatus]);

  // Filter bookmarks based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBookmarks(bookmarks);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = bookmarks.filter(bookmark => 
      bookmark.title.toLowerCase().includes(query) ||
      bookmark.url?.toLowerCase().includes(query) ||
      bookmark.category?.toLowerCase().includes(query)
    );
    
    setFilteredBookmarks(filtered);
  }, [bookmarks, searchQuery]);

  // Load bookmarks on mount
  useEffect(() => {
    if (isInitialized) {
      loadBookmarks();
    }
  }, [loadBookmarks, isInitialized]);

  // Set up Chrome bookmark change listeners
  useEffect(() => {
    if (!chrome.bookmarks) return;
    
    const handleBookmarkChange = () => {
      loadBookmarks(true);
    };
    
    chrome.bookmarks.onCreated.addListener(handleBookmarkChange);
    chrome.bookmarks.onRemoved.addListener(handleBookmarkChange);
    chrome.bookmarks.onChanged.addListener(handleBookmarkChange);
    
    return () => {
      chrome.bookmarks.onCreated.removeListener(handleBookmarkChange);
      chrome.bookmarks.onRemoved.removeListener(handleBookmarkChange);
      chrome.bookmarks.onChanged.removeListener(handleBookmarkChange);
    };
  }, [loadBookmarks]);

  // Update a bookmark's category
  const updateBookmarkCategory = useCallback(async (bookmarkId: string, category: string) => {
    try {
      await bookmarkLoader.setCategory(bookmarkId, category);
      
      // Update the bookmark in state
      setBookmarks(current => 
        current.map(bookmark => 
          bookmark.id === bookmarkId 
            ? { ...bookmark, category } 
            : bookmark
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error updating bookmark category:', error);
      toast.error('Failed to update bookmark category');
      return false;
    }
  }, []);

  // Delete a bookmark
  const deleteBookmark = useCallback(async (bookmarkId: string) => {
    try {
      if (chrome.bookmarks) {
        await chrome.bookmarks.remove(bookmarkId);
      }
      
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
      return true;
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast.error('Failed to delete bookmark');
      return false;
    }
  }, []);

  return {
    bookmarks,
    filteredBookmarks,
    loadingStatus,
    loadingProgress,
    searchQuery,
    setSearchQuery,
    loadBookmarks,
    updateBookmarkCategory,
    deleteBookmark,
    isOffline
  };
}
