import { useState, useEffect } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { suggestBookmarkCategory } from "@/utils/geminiUtils";
import { dummyBookmarks } from "@/utils/dummyBookmarks";
import { fetchPageContent } from "@/utils/contentExtractor";
import { useLanguage } from "@/stores/languageStore";
import { chromeDb } from "@/lib/chrome-storage";

const CACHE_KEY = 'bookmark_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 50; // Process bookmarks in batches

export const useBookmarkState = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBookmarks, setNewBookmarks] = useState<ChromeBookmark[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { currentLanguage } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const getCachedBookmarks = async () => {
    try {
      // Try local storage first for quick load
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          console.log('Using local cache for bookmarks');
          return data;
        }
      }

      // If no local cache, try Chrome sync storage
      const syncedData = await chromeDb.get<{ data: ChromeBookmark[]; timestamp: number }>(CACHE_KEY);
      if (syncedData && Date.now() - syncedData.timestamp < CACHE_EXPIRY) {
        console.log('Using synced cache for bookmarks');
        return syncedData.data;
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
      // Update both local and sync storage
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      await chromeDb.set(CACHE_KEY, cacheData);
      console.log('Bookmark cache updated');
    } catch (error) {
      console.error("Error caching bookmarks:", error);
    }
  };

  const processChromeBookmarks = async (bookmarks: chrome.bookmarks.BookmarkTreeNode[]) => {
    const processed: ChromeBookmark[] = [];
    
    // Process bookmarks in batches
    for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
      const batch = bookmarks.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (bookmark): Promise<ChromeBookmark> => {
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
      });

      const batchResults = await Promise.all(batchPromises);
      processed.push(...batchResults);
      
      // Update progress
      const progress = Math.round((processed.length / bookmarks.length) * 100);
      console.log(`Processing bookmarks: ${progress}%`);
    }

    return processed;
  };

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      
      // Try to get cached bookmarks first
      const cached = await getCachedBookmarks();
      if (cached) {
        setBookmarks(cached);
        setLoading(false);
        
        // Load fresh data in background
        loadFreshBookmarks();
        return;
      }

      await loadFreshBookmarks();
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      toast.error("Failed to load bookmarks");
      if (!chrome.bookmarks) {
        setBookmarks(dummyBookmarks);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadFreshBookmarks = async () => {
    if (chrome.bookmarks) {
      const results = await chrome.bookmarks.getRecent(1000); // Increased limit
      const previousCount = bookmarks.length;
      
      const processed = await processChromeBookmarks(results);
      setBookmarks(processed);
      await setCachedBookmarks(processed);

      if (previousCount < processed.length) {
        const newOnes = processed.slice(0, processed.length - previousCount);
        setNewBookmarks(newOnes);

        if (chrome.action) {
          const unreadCount = newOnes.length;
          chrome.action.setBadgeText({ text: unreadCount > 0 ? unreadCount.toString() : "" });
          chrome.action.setBadgeBackgroundColor({ color: "#10B981" });
        }
      }
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
      // Check authentication first
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
        selectedBookmarks.map(async (bookmark) => {
          try {
            console.log(`Categorizing bookmark: ${bookmark.title}`);
            const content = await fetchPageContent(bookmark.url || "");
            const category = await suggestBookmarkCategory(
              bookmark.title,
              bookmark.url || "",
              content,
              currentLanguage.code
            );
            console.log(`Category suggested for ${bookmark.title}:`, category);
            
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

      onUpdateCategories(categorizedBookmarks);
      toast.success("Categories suggested and saved successfully!");
    } catch (error) {
      console.error("Failed to suggest categories:", error);
      toast.error("Failed to suggest categories");
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
      
      // Listen for changes from other devices
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes[CACHE_KEY]) {
          console.log('Bookmark changes detected from sync');
          loadBookmarks();
        }
      });

      return () => {
        chrome.bookmarks.onCreated.removeListener(loadBookmarks);
        chrome.bookmarks.onRemoved.removeListener(loadBookmarks);
        chrome.bookmarks.onChanged.removeListener(loadBookmarks);
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
  };
};
