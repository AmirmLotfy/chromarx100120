import { useState, useEffect, useCallback } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { suggestBookmarkCategory } from "@/utils/geminiUtils";
import { dummyBookmarks } from "@/utils/dummyBookmarks";
import { fetchPageContent } from "@/utils/contentExtractor";
import { useLanguage } from "@/stores/languageStore";
import { chromeDb } from "@/lib/chrome-storage";
import { auth } from "@/lib/chrome-utils";
import { useNavigate } from "react-router-dom";
import { useBookmarkSync } from '@/hooks/use-bookmark-sync';
import { retryWithBackoff } from "@/utils/retryUtils";
import { withErrorHandling } from "@/utils/errorUtils";
import { bookmarkLoader } from "@/utils/bookmarkLoader";

const CACHE_KEY = 'bookmark_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 50; // Process bookmarks in batches
const MAX_STORAGE_ITEM_SIZE = 8192; // Chrome's max size for a single sync storage item in bytes

export const useBookmarkState = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBookmarks, setNewBookmarks] = useState<ChromeBookmark[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookmarks, setSelectedBookmarks] = useState<ChromeBookmark[]>([]);
  const { currentLanguage } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [syncProgress, setSyncProgress] = useState(0);
  const navigate = useNavigate();
  
  const handleBookmarksChanged = useCallback((updatedBookmarks: ChromeBookmark[]) => {
    console.log("Bookmarks updated from sync:", updatedBookmarks.length);
    setBookmarks(updatedBookmarks);
  }, []);
  
  const { 
    syncStatus, 
    lastSynced, 
    isConnected,
    createBookmark,
    updateBookmark, 
    deleteBookmark,
    syncAllBookmarks
  } = useBookmarkSync(handleBookmarksChanged);

  const splitBookmarksForStorage = useCallback(async (bookmarks: ChromeBookmark[]) => {
    try {
      const bookmarksJSON = JSON.stringify(bookmarks);
      
      if (bookmarksJSON.length <= MAX_STORAGE_ITEM_SIZE) {
        await chromeDb.set('bookmarks', bookmarks);
        return;
      }
      
      const chunkSize = 20;
      const chunks = [];
      
      for (let i = 0; i < bookmarks.length; i += chunkSize) {
        chunks.push(bookmarks.slice(i, i + chunkSize));
      }
      
      for (let i = 0; i < 100; i++) {
        await chromeDb.remove(`bookmarks_chunk_${i}`);
      }
      
      for (let i = 0; i < chunks.length; i++) {
        await chromeDb.set(`bookmarks_chunk_${i}`, chunks[i]);
      }
      
      await chromeDb.set('bookmarks_chunk_count', chunks.length);
      
      await chromeDb.remove('bookmarks');
      
      console.log(`Split ${bookmarks.length} bookmarks into ${chunks.length} chunks`);
    } catch (error) {
      console.error("Error splitting bookmarks for storage:", error);
      toast.error("Failed to save bookmarks due to size limitations");
    }
  }, []);

  const loadSplitBookmarks = useCallback(async (): Promise<ChromeBookmark[]> => {
    try {
      const chunkCount = await chromeDb.get<number>('bookmarks_chunk_count');
      
      if (!chunkCount) {
        const regularBookmarks = await chromeDb.get<ChromeBookmark[]>('bookmarks');
        return regularBookmarks || [];
      }
      
      let allBookmarks: ChromeBookmark[] = [];
      
      for (let i = 0; i < chunkCount; i++) {
        const chunk = await chromeDb.get<ChromeBookmark[]>(`bookmarks_chunk_${i}`);
        if (chunk) {
          allBookmarks = [...allBookmarks, ...chunk];
        }
      }
      
      console.log(`Loaded ${allBookmarks.length} bookmarks from ${chunkCount} chunks`);
      return allBookmarks;
    } catch (error) {
      console.error("Error loading split bookmarks:", error);
      return [];
    }
  }, []);

  const getCachedBookmarks = async () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          console.log('Using local cache for bookmarks');
          return data;
        }
      }

      const syncedData = await chromeDb.get<{ data: ChromeBookmark[]; timestamp: number }>(CACHE_KEY);
      if (syncedData && Date.now() - syncedData.timestamp < CACHE_EXPIRY) {
        console.log('Using synced cache for bookmarks');
        return syncedData.data;
      }

      const splitBookmarks = await loadSplitBookmarks();
      if (splitBookmarks.length > 0) {
        return splitBookmarks;
      }

      return null;
    } catch (error) {
      console.error("Error getting cached bookmarks:", error);
      return null;
    }
  };

  const setCachedBookmarks = async (data: ChromeBookmark[]) => {
    const cacheData = {
      data,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
      try {
        await chromeDb.set(CACHE_KEY, cacheData);
      } catch (error) {
        console.warn("Cache might be too large for single storage item, using split storage");
        await splitBookmarksForStorage(data);
      }
      
      console.log('Bookmark cache updated');
    } catch (error) {
      console.error("Error caching bookmarks:", error);
      toast.error("Failed to save bookmark cache");
    }
  };

  const processChromeBookmarks = async (bookmarks: chrome.bookmarks.BookmarkTreeNode[]) => {
    const processed: ChromeBookmark[] = [];
    let progress = 0;
    
    for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
      const batch = bookmarks.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (bookmark): Promise<ChromeBookmark> => {
        try {
          const chromeBookmark: ChromeBookmark = {
            ...bookmark,
            category: await getCachedCategory(bookmark.id)
          };
          
          if (chromeBookmark.url && !chromeBookmark.category) {
            try {
              console.log('Processing bookmark:', chromeBookmark.url);
              const content = await fetchPageContent(chromeBookmark.url);
              chromeBookmark.content = content;

              chromeBookmark.category = await suggestBookmarkCategory(
                chromeBookmark.title,
                chromeBookmark.url,
                content,
                currentLanguage.code
              );

              if (chromeBookmark.category) {
                await chromeDb.set(`bookmark-category-${bookmark.id}`, chromeBookmark.category);
              }
            } catch (error) {
              console.error("Error processing bookmark:", error);
            }
          }
          return chromeBookmark;
        } catch (error) {
          console.error("Error processing bookmark:", bookmark, error);
          return {
            id: bookmark.id || `error-${Date.now()}-${Math.random()}`,
            title: bookmark.title || "Error loading bookmark",
            url: bookmark.url,
            dateAdded: bookmark.dateAdded
          };
        }
      });

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        const successfulResults = batchResults
          .filter((result): result is PromiseFulfilledResult<ChromeBookmark> => result.status === 'fulfilled')
          .map(result => result.value);
        
        processed.push(...successfulResults);
      } catch (error) {
        console.error("Error processing bookmark batch:", error);
      }
      
      progress = Math.round((processed.length / bookmarks.length) * 100);
      setSyncProgress(progress);
      console.log(`Processing bookmarks: ${progress}%`);
    }

    setSyncProgress(0);
    return processed;
  };

  const loadBookmarks = async () => {
    await withErrorHandling(async () => {
      setLoading(true);
      
      try {
        if (!bookmarkLoader.initialize) {
          await loadBookmarksLegacy();
          return;
        }
        
        await bookmarkLoader.initialize();
        
        const bookmarks = await bookmarkLoader.loadBookmarks(
          (progress) => {
            setSyncProgress(progress);
          },
          (newBatch) => {
            // No batch updates needed here, will get final result
          }
        );
        
        setBookmarks(bookmarks);
      } catch (error) {
        console.error("Error loading bookmarks with optimized loader:", error);
        await loadBookmarksLegacy();
      }
    }, {
      errorMessage: "Failed to load bookmarks",
      showError: true,
      rethrow: false,
    }).finally(() => {
      setLoading(false);
      setProcessingMessage("");
      setSyncProgress(0);
    });
  };

  const loadBookmarksLegacy = async () => {
    console.log("Using legacy bookmark loading method");
    
    try {
      const cached = await getCachedBookmarks();
      if (cached) {
        setBookmarks(cached);
        setLoading(false);
      }

      if (chrome.bookmarks) {
        const results = await chrome.bookmarks.getRecent(1000);
        setProcessingMessage("Processing bookmarks...");
        
        const processed = await processChromeBookmarks(results);
        
        await setCachedBookmarks(processed);
        setBookmarks(processed);
        setProcessingMessage("");

        const user = await auth.getCurrentUser();
        if (user) {
          for (const bookmark of processed) {
            await updateBookmark(bookmark);
          }
        }
      }
    } catch (error) {
      console.error("Error loading bookmarks with legacy method:", error);
    }
  };

  const getCachedCategory = async (bookmarkId: string): Promise<string | undefined> => {
    try {
      return await chromeDb.get<string>(`bookmark-category-${bookmarkId}`);
    } catch (error) {
      console.error("Error getting cached category:", error);
      return undefined;
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const filteredSuggestions = bookmarks
        .filter(b => 
          b.title.toLowerCase().includes(query.toLowerCase()) ||
          b.url?.toLowerCase().includes(query.toLowerCase())
        )
        .map(b => b.title)
        .slice(0, 5);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestCategories = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        toast.error("Please sign in to use AI features");
        navigate("/");
        return;
      }

      if (selectedBookmarks.length === 0) {
        toast.error("Please select bookmarks to categorize");
        return;
      }

      setIsProcessing(true);
      setProcessingMessage("Suggesting categories...");
      
      const categorizedBookmarks = await Promise.all(
        selectedBookmarks.map(async (bookmark, index) => {
          try {
            console.log(`Categorizing bookmark (${index + 1}/${selectedBookmarks.length}): ${bookmark.title}`);
            const content = await fetchPageContent(bookmark.url || "");
            const category = await suggestBookmarkCategory(
              bookmark.title,
              bookmark.url || "",
              content,
              currentLanguage.code
            );
            console.log(`Category suggested for ${bookmark.title}:`, category);
            
            setSyncProgress(Math.floor((index + 1) / selectedBookmarks.length * 100));
            
            return {
              ...bookmark,
              category,
            };
          } catch (error) {
            console.error(`Error categorizing bookmark ${bookmark.title}:`, error);
            toast.error(`Failed to categorize ${bookmark.title}`);
            return bookmark;
          }
        })
      );

      setBookmarks(prevBookmarks => 
        prevBookmarks.map(bookmark => 
          categorizedBookmarks.find(cb => cb.id === bookmark.id) || bookmark
        )
      );
      
      for (const bookmark of categorizedBookmarks) {
        if (bookmark.category) {
          await chromeDb.set(`bookmark-category-${bookmark.id}`, bookmark.category);
          await updateBookmark(bookmark);
        }
      }
      
      toast.success("Categories suggested and saved successfully!");
    } catch (error) {
      console.error("Failed to suggest categories:", error);
      toast.error("Failed to suggest categories");
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
      setSyncProgress(0);
    }
  };

  const handleForceSync = async () => {
    const user = await auth.getCurrentUser();
    if (!user) {
      toast.error("Please sign in to sync bookmarks");
      navigate("/");
      return;
    }
    
    setIsProcessing(true);
    setProcessingMessage("Syncing bookmarks to cloud...");
    
    try {
      await syncAllBookmarks();
      toast.success("Bookmarks synced successfully!");
    } catch (error) {
      console.error("Error during force sync:", error);
      toast.error("Failed to sync bookmarks");
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  useEffect(() => {
    loadBookmarks();
    if (chrome.bookmarks) {
      chrome.bookmarks.onCreated.addListener(loadBookmarks);
      chrome.bookmarks.onRemoved.addListener(loadBookmarks);
      chrome.bookmarks.onChanged.addListener(loadBookmarks);
      
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes[CACHE_KEY]) {
          console.log('Bookmark changes detected from sync');
          loadBookmarks();
        }
      });

      const handleStorageChange = (event: CustomEvent) => {
        const { key } = event.detail;
        if (key === 'bookmarks' || key.startsWith('bookmarks_chunk_')) {
          console.log('Bookmark changes detected via storage event');
          loadBookmarks();
        }
      };
      
      window.addEventListener('storage-changed', handleStorageChange as EventListener);

      return () => {
        chrome.bookmarks.onCreated.removeListener(loadBookmarks);
        chrome.bookmarks.onRemoved.removeListener(loadBookmarks);
        chrome.bookmarks.onChanged.removeListener(loadBookmarks);
        window.removeEventListener('storage-changed', handleStorageChange as EventListener);
      };
    }
  }, []);

  return {
    bookmarks,
    setBookmarks,
    loading,
    newBookmarks,
    loadBookmarks,
    suggestions,
    searchQuery,
    handleSearch,
    isProcessing,
    processingMessage,
    handleSuggestCategories,
    selectedBookmarks,
    setSelectedBookmarks,
    syncStatus,
    lastSynced,
    isConnected,
    syncProgress,
    handleForceSync
  };
};
