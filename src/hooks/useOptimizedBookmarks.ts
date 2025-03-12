
import { useState, useEffect, useCallback, useRef } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { bookmarkLoader } from "@/utils/bookmarkLoader";
import { toast } from "sonner";
import { useOfflineStatus } from "./useOfflineStatus";
import { optimizedBookmarkStorage } from "@/services/optimizedBookmarkStorage";
import { bookmarkDbService } from "@/services/indexedDbService";
import { useAuth } from "./useAuth";
import { streamProcess, backgroundIndexBookmarks } from "@/utils/streamProcessingUtils";

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
  const searchTimeoutRef = useRef<number | null>(null);

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
      // Try to load from optimized storage first if not forcing refresh
      if (!forceRefresh) {
        const storedBookmarks = await optimizedBookmarkStorage.getAllBookmarks();
        
        if (storedBookmarks && storedBookmarks.length > 0) {
          setBookmarks(storedBookmarks);
          setFilteredBookmarks(storedBookmarks);
          setLoadingStatus('loaded');
          setLoadingProgress(100);
          return;
        }
      }
      
      // Fall back to traditional loading
      const loadedBookmarks = await bookmarkLoader.loadBookmarks(
        (progress) => {
          setLoadingProgress(progress);
        },
        async (newBatch) => {
          // Update UI with each batch
          setBookmarks(current => {
            const combined = [...current, ...newBatch];
            return combined;
          });
          
          // Process batches in background to avoid blocking UI
          streamProcess(
            newBatch,
            async (bookmark) => {
              await optimizedBookmarkStorage.addBookmark(bookmark);
            },
            {
              chunkSize: 20,
              pauseBetweenChunks: 5
            }
          ).catch(error => {
            console.error('Error processing bookmark batch:', error);
          });
        }
      );
      
      setBookmarks(loadedBookmarks);
      setFilteredBookmarks(loadedBookmarks);
      setLoadingStatus('loaded');
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast.error('Failed to load bookmarks');
      setLoadingStatus('error');
    } finally {
      setLoadingProgress(100);
    }
  }, [loadingStatus]);

  // Handle search with debounce for better performance
  useEffect(() => {
    const handleSearch = async () => {
      if (searchQuery.trim() === '') {
        setFilteredBookmarks(bookmarks);
        return;
      }
      
      // For very short queries (1-2 chars), use simple filtering
      if (searchQuery.length < 3) {
        const filtered = bookmarks.filter(bookmark => 
          bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setFilteredBookmarks(filtered);
        return;
      }
      
      try {
        // Use optimized search for longer queries
        const results = await optimizedBookmarkStorage.searchBookmarks(searchQuery);
        setFilteredBookmarks(results);
      } catch (error) {
        console.error('Error searching bookmarks:', error);
        
        // Fall back to in-memory search if optimized search fails
        const filtered = bookmarks.filter(bookmark => 
          bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          bookmark.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setFilteredBookmarks(filtered);
      }
    };
    
    // Clear previous timeout
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout (300ms debounce)
    searchTimeoutRef.current = window.setTimeout(handleSearch, 300);
    
    // Cleanup
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
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
      
      // Also update in optimized storage
      const bookmark = await bookmarkDbService.get<ChromeBookmark>('bookmarks', bookmarkId);
      if (bookmark) {
        bookmark.category = category;
        await optimizedBookmarkStorage.updateBookmark(bookmark);
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
      
      // Also remove from optimized storage
      await optimizedBookmarkStorage.deleteBookmark(bookmarkId);
      
      // Update state
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
      setFilteredBookmarks(prev => prev.filter(bookmark => bookmark.id !== bookmarkId));
      
      return true;
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast.error('Failed to delete bookmark');
      return false;
    }
  }, []);

  // Run background optimization/indexing
  const runBackgroundOptimization = useCallback(async (onProgress?: (progress: number) => void): Promise<void> => {
    try {
      if (bookmarks.length === 0) return;
      
      await backgroundIndexBookmarks(bookmarks, onProgress);
      
      // Show success message only if we actually processed bookmarks
      if (bookmarks.length > 0) {
        toast.success('Bookmarks optimized for faster search');
      }
    } catch (error) {
      console.error('Error during background optimization:', error);
      toast.error('Failed to optimize bookmarks');
    }
  }, [bookmarks]);

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
    runBackgroundOptimization,
    isOffline
  };
}
