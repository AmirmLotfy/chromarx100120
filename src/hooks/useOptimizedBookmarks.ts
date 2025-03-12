import { useState, useEffect, useCallback } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { bookmarkLoader } from "@/utils/bookmarkLoader";
import { toast } from "sonner";
import { useOfflineStatus } from "./useOfflineStatus";
import { optimizedBookmarkStorage } from "@/services/optimizedBookmarkStorage";
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
          // Initialize the optimized storage
          await optimizedBookmarkStorage.initialize();
          
          // First try to load from optimized storage
          const storedBookmarks = await optimizedBookmarkStorage.getAllBookmarks();
          
          if (storedBookmarks && storedBookmarks.length > 0) {
            setBookmarks(storedBookmarks);
            setFilteredBookmarks(storedBookmarks);
            console.log(`Loaded ${storedBookmarks.length} bookmarks from optimized storage`);
          }
          
          setIsInitialized(true);
        } catch (error) {
          console.error('Error initializing bookmark system:', error);
          toast.error('Failed to initialize bookmark system');
        }
      };
      
      initializeBookmarks();
    }
  }, [isInitialized]);

  // Load bookmarks with chunked processing
  const loadBookmarks = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      // Clear both storages if forcing refresh
      try {
        await bookmarkDbService.clear('bookmarks');
        await bookmarkDbService.clear('bookmark_indices');
      } catch (error) {
        console.error('Error clearing storage:', error);
      }
    }
    
    if (loadingStatus === 'loading') return;
    
    setLoadingStatus('loading');
    setLoadingProgress(0);
    
    try {
      // Try to load from optimized storage first
      const storedBookmarks = await optimizedBookmarkStorage.getAllBookmarks();
      
      if (!forceRefresh && storedBookmarks && storedBookmarks.length > 0) {
        setBookmarks(storedBookmarks);
        setLoadingStatus('loaded');
        setLoadingProgress(100);
        return;
      }
      
      // Fall back to traditional loading if needed
      const loadedBookmarks = await bookmarkLoader.loadBookmarks(
        (progress) => {
          setLoadingProgress(progress);
        },
        async (newBatch) => {
          setBookmarks(current => {
            const combined = [...current, ...newBatch];
            
            // Store batch in optimized storage (don't await to keep UI responsive)
            optimizedBookmarkStorage.addBookmarks(newBatch).catch(console.error);
            
            return combined;
          });
        }
      );
      
      if (loadedBookmarks.length > 0) {
        setBookmarks(loadedBookmarks);
        
        // Store all bookmarks in optimized storage
        await optimizedBookmarkStorage.addBookmarks(loadedBookmarks);
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
