import { useState, useEffect, useCallback } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { bookmarkLoader } from "@/utils/bookmarkLoader";
import { toast } from "sonner";
import { useOfflineStatus } from "./useOfflineStatus";
import { bookmarkDbService } from "@/services/indexedDbService";
import { useAuth } from "./useAuth";

type BookmarkLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

export function useOptimizedBookmarks() {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<ChromeBookmark[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<BookmarkLoadingStatus>('idle');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const { isOffline } = useOfflineStatus();
  const { user } = useAuth();

  // Initialize the bookmark system
  useEffect(() => {
    if (!isInitialized) {
      const initializeBookmarks = async () => {
        try {
          // First initialize the traditional loader
          await bookmarkLoader.initialize({
            useFastLoading: true,
            prioritizeCache: true
          });
          
          // Then check if we have bookmarks in IndexedDB
          const storedBookmarks = await bookmarkDbService.getAll<ChromeBookmark>('bookmarks');
          
          if (storedBookmarks && storedBookmarks.length > 0) {
            setBookmarks(storedBookmarks);
            setFilteredBookmarks(storedBookmarks);
            console.log(`Loaded ${storedBookmarks.length} bookmarks from IndexedDB`);
          }
          
          setIsInitialized(true);
        } catch (error) {
          console.error('Error initializing bookmark system:', error);
          // Fall back to traditional initialization
          await bookmarkLoader.initialize({
            useFastLoading: true,
            prioritizeCache: true
          });
          setIsInitialized(true);
        }
      };
      
      initializeBookmarks();
    }
  }, [isInitialized]);

  // Load bookmarks with chunked processing
  const loadBookmarks = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      bookmarkLoader.clearCache();
      // Also clear the IndexedDB cache if forcing refresh
      try {
        await bookmarkDbService.clear('bookmarks');
      } catch (error) {
        console.error('Error clearing IndexedDB cache:', error);
      }
    }
    
    if (loadingStatus === 'loading') return;
    
    setLoadingStatus('loading');
    setLoadingProgress(0);
    
    try {
      // Try to load from IndexedDB first for better performance
      const storedBookmarks = await bookmarkDbService.getAll<ChromeBookmark>('bookmarks');
      
      if (!forceRefresh && storedBookmarks && storedBookmarks.length > 0) {
        setBookmarks(storedBookmarks);
        setLoadingStatus('loaded');
        setLoadingProgress(100);
        return;
      }
      
      // Fall back to traditional loading if no indexed data or force refresh
      const loadedBookmarks = await bookmarkLoader.loadBookmarks(
        (progress) => {
          setLoadingProgress(progress);
        },
        (newBatch) => {
          setBookmarks(current => {
            const combined = [...current, ...newBatch];
            
            // Store batch in IndexedDB (don't await to keep UI responsive)
            storeBookmarksInIndexedDb(newBatch);
            
            return combined;
          });
        }
      );
      
      if (loadedBookmarks.length > 0) {
        setBookmarks(loadedBookmarks);
        
        // Store all bookmarks in IndexedDB
        storeBookmarksInIndexedDb(loadedBookmarks);
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

  // Helper function to store bookmarks in IndexedDB
  const storeBookmarksInIndexedDb = async (bookmarksToStore: ChromeBookmark[]) => {
    try {
      await bookmarkDbService.bulkPut('bookmarks', bookmarksToStore);
    } catch (error) {
      console.error('Error storing bookmarks in IndexedDB:', error);
    }
  };

  // Filter bookmarks based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredBookmarks(bookmarks);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    
    // For simple queries, use in-memory filtering
    if (query.length < 3) {
      const filtered = bookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.url?.toLowerCase().includes(query) ||
        bookmark.category?.toLowerCase().includes(query)
      );
      
      setFilteredBookmarks(filtered);
      return;
    }
    
    // For longer queries, consider using IndexedDB indices
    // This is a fallback using memory filtering, but will be enhanced in future iterations
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
      // First, update in the traditional way
      await bookmarkLoader.setCategory(bookmarkId, category);
      
      // Also update in IndexedDB
      const bookmark = await bookmarkDbService.get<ChromeBookmark>('bookmarks', bookmarkId);
      if (bookmark) {
        bookmark.category = category;
        await bookmarkDbService.put('bookmarks', bookmark);
      }
      
      // Update state
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
      
      // Also remove from IndexedDB
      await bookmarkDbService.delete('bookmarks', bookmarkId);
      
      // Update state
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
