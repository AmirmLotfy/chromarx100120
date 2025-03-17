import { useState, useEffect, useCallback, useRef } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { useOfflineStatus } from "./useOfflineStatus";
import { enhancedBookmarkStorage } from "@/services/enhancedBookmarkStorage";

type BookmarkLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error';

interface UseEnhancedBookmarksOptions {
  autoLoad?: boolean;
  pageSize?: number;
  autoSync?: boolean;
}

interface SearchOptions {
  query: string;
  categoryFilter?: string;
  sortBy?: 'title' | 'dateAdded' | 'category' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

export function useEnhancedBookmarks(options: UseEnhancedBookmarksOptions = {}) {
  const { 
    autoLoad = true, 
    pageSize = 50,
    autoSync = true
  } = options;
  
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [filteredBookmarks, setFilteredBookmarks] = useState<ChromeBookmark[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<BookmarkLoadingStatus>('idle');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<'title' | 'dateAdded' | 'category' | 'relevance'>('dateAdded');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { isOffline, checkConnection } = useOfflineStatus();
  const searchTimeoutRef = useRef<number | null>(null);
  const initialLoadCompleted = useRef(false);

  // Load bookmarks on mount if autoLoad is true
  useEffect(() => {
    if (autoLoad && !initialLoadCompleted.current) {
      loadBookmarks();
      initialLoadCompleted.current = true;
    }
  }, [autoLoad]);

  // Load all available bookmarks with pagination
  const loadBookmarks = useCallback(async (forceRefresh = false) => {
    if (loadingStatus === 'loading' && !forceRefresh) return;
    
    setLoadingStatus('loading');
    setLoadingProgress(0);
    
    try {
      // Initialize storage
      await enhancedBookmarkStorage.initialize();
      
      // Get the total count for pagination
      const count = await enhancedBookmarkStorage.getBookmarkCount();
      setTotalCount(count);
      
      // Load categories for filtering
      const allCategories = await enhancedBookmarkStorage.getAllCategories();
      setCategories(allCategories);
      
      if (forceRefresh && isOffline) {
        toast.warning('Cannot refresh from Chrome while offline');
        setLoadingStatus('loaded');
        setLoadingProgress(100);
        return;
      }
      
      // If we're not forcing a refresh from Chrome, just load from IndexedDB
      if (!forceRefresh) {
        const firstPage = await enhancedBookmarkStorage.getAllBookmarks({ 
          limit: pageSize,
          offset: 0
        });
        
        setBookmarks(firstPage);
        setFilteredBookmarks(firstPage);
        setHasMore(firstPage.length < count);
        setLoadingStatus('loaded');
        setLoadingProgress(100);
        return;
      }
      
      // Otherwise sync from Chrome bookmarks
      await enhancedBookmarkStorage.syncFromChromeBookmarks({
        forceRefresh,
        onProgress: (progress) => {
          setLoadingProgress(progress);
        },
        onBatchComplete: (newBatch) => {
          setBookmarks(prev => {
            const combined = [...prev, ...newBatch];
            // Sort by date added, newest first
            combined.sort((a, b) => (b.dateAdded || 0) - (a.dateAdded || 0));
            // Limit to first page to avoid performance issues
            return combined.slice(0, pageSize);
          });
        }
      });
      
      // After sync completes, get the first page of results
      const firstPage = await enhancedBookmarkStorage.getAllBookmarks({ 
        limit: pageSize,
        offset: 0
      });
      
      // Update the counts
      const updatedCount = await enhancedBookmarkStorage.getBookmarkCount();
      setTotalCount(updatedCount);
      
      setBookmarks(firstPage);
      setFilteredBookmarks(firstPage);
      setHasMore(firstPage.length < updatedCount);
      setLoadingStatus('loaded');
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      toast.error('Failed to load bookmarks');
      setLoadingStatus('error');
    } finally {
      setLoadingProgress(100);
    }
  }, [loadingStatus, isOffline, pageSize]);

  // Search with debouncing
  useEffect(() => {
    const performSearch = async () => {
      try {
        setLoadingStatus('loading');
        
        // Prepare search options
        const searchOptions = {
          query: searchQuery,
          categoryFilter: selectedCategory,
          sortBy,
          sortOrder,
          limit: pageSize,
          offset: (currentPage - 1) * pageSize
        };
        
        // Perform the search
        const results = await enhancedBookmarkStorage.searchBookmarks(searchOptions);
        
        setFilteredBookmarks(results);
        setLoadingStatus('loaded');
        
        // Check if there are more results
        const total = await enhancedBookmarkStorage.getBookmarkCount();
        setHasMore(results.length < total);
      } catch (error) {
        console.error('Error searching bookmarks:', error);
        setLoadingStatus('error');
      }
    };
    
    // Clear previous timeout
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout (300ms debounce)
    searchTimeoutRef.current = window.setTimeout(performSearch, 300);
    
    // Cleanup
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedCategory, currentPage, sortBy, sortOrder, pageSize]);

  // Load next page of bookmarks
  const loadNextPage = useCallback(async () => {
    if (loadingStatus === 'loading' || !hasMore) return;
    
    setLoadingStatus('loading');
    
    try {
      const nextPage = currentPage + 1;
      const offset = (nextPage - 1) * pageSize;
      
      // If we're searching or filtering, use search function
      if (searchQuery || selectedCategory) {
        const searchOptions = {
          query: searchQuery,
          categoryFilter: selectedCategory,
          sortBy,
          sortOrder,
          limit: pageSize,
          offset
        };
        
        const nextResults = await enhancedBookmarkStorage.searchBookmarks(searchOptions);
        
        setFilteredBookmarks(prev => [...prev, ...nextResults]);
        setCurrentPage(nextPage);
        setHasMore(nextResults.length === pageSize);
      } else {
        // Otherwise just get next page of all bookmarks
        const nextBookmarks = await enhancedBookmarkStorage.getAllBookmarks({
          limit: pageSize,
          offset
        });
        
        setBookmarks(prev => [...prev, ...nextBookmarks]);
        setFilteredBookmarks(prev => [...prev, ...nextBookmarks]);
        setCurrentPage(nextPage);
        setHasMore(nextBookmarks.length === pageSize);
      }
      
      setLoadingStatus('loaded');
    } catch (error) {
      console.error('Error loading next page:', error);
      setLoadingStatus('error');
      toast.error('Failed to load more bookmarks');
    }
  }, [currentPage, hasMore, loadingStatus, pageSize, searchQuery, selectedCategory, sortBy, sortOrder]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, sortBy, sortOrder]);

  // Get a single bookmark by ID
  const getBookmark = useCallback(async (bookmarkId: string): Promise<ChromeBookmark | null> => {
    return enhancedBookmarkStorage.getBookmark(bookmarkId);
  }, []);

  // Update a bookmark
  const updateBookmark = useCallback(async (bookmark: ChromeBookmark): Promise<boolean> => {
    try {
      await enhancedBookmarkStorage.updateBookmark(bookmark);
      
      // Update state
      setBookmarks(prev => 
        prev.map(b => b.id === bookmark.id ? bookmark : b)
      );
      
      setFilteredBookmarks(prev => 
        prev.map(b => b.id === bookmark.id ? bookmark : b)
      );
      
      return true;
    } catch (error) {
      console.error('Error updating bookmark:', error);
      toast.error('Failed to update bookmark');
      return false;
    }
  }, []);

  // Update a bookmark's category
  const updateBookmarkCategory = useCallback(async (bookmarkId: string, category: string): Promise<boolean> => {
    try {
      const bookmark = await enhancedBookmarkStorage.getBookmark(bookmarkId);
      if (!bookmark) {
        throw new Error('Bookmark not found');
      }
      
      const updatedBookmark = { ...bookmark, category };
      
      await enhancedBookmarkStorage.updateBookmark(updatedBookmark);
      
      // Update categories list if this is a new category
      if (!categories.includes(category)) {
        setCategories(prev => [...prev, category]);
      }
      
      // Update state
      setBookmarks(prev => 
        prev.map(b => b.id === bookmarkId ? { ...b, category } : b)
      );
      
      setFilteredBookmarks(prev => 
        prev.map(b => b.id === bookmarkId ? { ...b, category } : b)
      );
      
      return true;
    } catch (error) {
      console.error('Error updating bookmark category:', error);
      toast.error('Failed to update bookmark category');
      return false;
    }
  }, [categories]);

  // Delete a bookmark
  const deleteBookmark = useCallback(async (bookmarkId: string): Promise<boolean> => {
    try {
      // First try to delete in Chrome if we're online and in extension context
      if (!isOffline && chrome.bookmarks) {
        try {
          await chrome.bookmarks.remove(bookmarkId);
        } catch (error) {
          console.error('Error removing bookmark from Chrome:', error);
        }
      }
      
      // Then delete from our storage
      await enhancedBookmarkStorage.deleteBookmark(bookmarkId);
      
      // Update state
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      setFilteredBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
      setTotalCount(prev => Math.max(0, prev - 1));
      
      return true;
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast.error('Failed to delete bookmark');
      return false;
    }
  }, [isOffline]);

  // Search bookmarks with advanced options
  const searchBookmarks = useCallback(async (searchOptions: SearchOptions): Promise<ChromeBookmark[]> => {
    try {
      setLoadingStatus('loading');
      
      const options = {
        ...searchOptions,
        limit: pageSize,
        offset: 0 // Always start from first page for new searches
      };
      
      const results = await enhancedBookmarkStorage.searchBookmarks(options);
      
      // Update state only if this is the main search
      if (searchOptions.query === searchQuery && 
          searchOptions.categoryFilter === selectedCategory &&
          searchOptions.sortBy === sortBy &&
          searchOptions.sortOrder === sortOrder) {
        setFilteredBookmarks(results);
        setCurrentPage(1);
        setHasMore(results.length === pageSize);
      }
      
      setLoadingStatus('loaded');
      return results;
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      setLoadingStatus('error');
      return [];
    }
  }, [searchQuery, selectedCategory, sortBy, sortOrder, pageSize]);

  // Set up Chrome bookmark change listeners for auto-sync
  useEffect(() => {
    if (!chrome.bookmarks || !autoSync) return;
    
    const handleBookmarkChange = () => {
      // Don't refresh if offline
      if (isOffline) return;
      loadBookmarks(true);
    };
    
    chrome.bookmarks.onCreated.addListener(handleBookmarkChange);
    chrome.bookmarks.onRemoved.addListener(handleBookmarkChange);
    chrome.bookmarks.onChanged.addListener(handleBookmarkChange);
    chrome.bookmarks.onMoved.addListener(handleBookmarkChange);
    
    return () => {
      chrome.bookmarks.onCreated.removeListener(handleBookmarkChange);
      chrome.bookmarks.onRemoved.removeListener(handleBookmarkChange);
      chrome.bookmarks.onChanged.removeListener(handleBookmarkChange);
      chrome.bookmarks.onMoved.removeListener(handleBookmarkChange);
    };
  }, [loadBookmarks, isOffline, autoSync]);

  // Refresh online status and bookmarks when coming back online
  useEffect(() => {
    if (!isOffline && autoSync) {
      checkConnection().then(isOnline => {
        if (isOnline) {
          loadBookmarks(true);
        }
      });
    }
  }, [isOffline, checkConnection, loadBookmarks, autoSync]);

  return {
    bookmarks: filteredBookmarks,
    allBookmarks: bookmarks,
    loadingStatus,
    loadingProgress,
    searchQuery,
    setSearchQuery,
    totalCount,
    currentPage,
    hasMore,
    categories,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    loadBookmarks,
    loadNextPage,
    getBookmark,
    updateBookmark,
    updateBookmarkCategory,
    deleteBookmark,
    searchBookmarks,
    isOffline
  };
}
