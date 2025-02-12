
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

export const useBookmarkState = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBookmarks, setNewBookmarks] = useState<ChromeBookmark[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { currentLanguage } = useLanguage();

  const getCachedBookmarks = async () => {
    try {
      // Try local storage first for quick load
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_EXPIRY) {
          return data;
        }
      }

      // If no local cache, try Chrome sync storage
      const syncedData = await chromeDb.get<{ data: ChromeBookmark[]; timestamp: number }>(CACHE_KEY);
      if (syncedData && Date.now() - syncedData.timestamp < CACHE_EXPIRY) {
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

    // Update both local and sync storage
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      await chromeDb.set(CACHE_KEY, cacheData);
    } catch (error) {
      console.error("Error caching bookmarks:", error);
    }
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
      const results = await chrome.bookmarks.getRecent(100);
      const previousCount = bookmarks.length;
      
      const categorizedResults = await Promise.all(
        results.map(async (bookmark): Promise<ChromeBookmark> => {
          const chromeBookmark: ChromeBookmark = {
            ...bookmark,
            category: await getCachedCategory(bookmark.id)
          };
          
          if (chromeBookmark.url && !chromeBookmark.category) {
            try {
              console.log('Fetching content for:', chromeBookmark.url);
              const content = await fetchPageContent(chromeBookmark.url);
              chromeBookmark.content = content;

              // Use content for category suggestion with language
              chromeBookmark.category = await suggestBookmarkCategory(
                chromeBookmark.title,
                chromeBookmark.url,
                content,
                currentLanguage.code
              );

              // Cache the category
              if (chromeBookmark.category) {
                await chromeDb.set(`bookmark-category-${bookmark.id}`, chromeBookmark.category);
              }
            } catch (error) {
              console.error("Error processing bookmark content:", error);
            }
          }
          return chromeBookmark;
        })
      );
      
      setBookmarks(categorizedResults);
      await setCachedBookmarks(categorizedResults);

      if (previousCount < categorizedResults.length) {
        const newOnes = categorizedResults.slice(0, categorizedResults.length - previousCount);
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

  useEffect(() => {
    loadBookmarks();
    if (chrome.bookmarks) {
      chrome.bookmarks.onCreated.addListener(loadBookmarks);
      chrome.bookmarks.onRemoved.addListener(loadBookmarks);
      chrome.bookmarks.onChanged.addListener(loadBookmarks);
      
      // Listen for changes from other devices
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes[CACHE_KEY]) {
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
  };
};
