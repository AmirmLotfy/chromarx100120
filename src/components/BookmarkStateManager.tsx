
import { useState, useEffect } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { dummyBookmarks } from "@/utils/dummyBookmarks";
import { chromeDb } from "@/lib/chrome-storage";
import { auth } from "@/lib/chrome-utils";
import { useNavigate } from "react-router-dom";

const CACHE_KEY = 'bookmark_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes
const BATCH_SIZE = 50; // Process bookmarks in batches

export const useBookmarkState = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBookmarks, setNewBookmarks] = useState<ChromeBookmark[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBookmarks, setSelectedBookmarks] = useState<ChromeBookmark[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const navigate = useNavigate();

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
      await chromeDb.set(CACHE_KEY, cacheData);
      console.log('Bookmark cache updated');
    } catch (error) {
      console.error("Error caching bookmarks:", error);
    }
  };

  const processChromeBookmarks = async (bookmarks: chrome.bookmarks.BookmarkTreeNode[]) => {
    const processed: ChromeBookmark[] = [];
    
    for (let i = 0; i < bookmarks.length; i += BATCH_SIZE) {
      const batch = bookmarks.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (bookmark): Promise<ChromeBookmark> => {
        return {
          ...bookmark,
          category: await chromeDb.get(`bookmark-category-${bookmark.id}`) || 'Uncategorized'
        };
      });

      const batchResults = await Promise.all(batchPromises);
      processed.push(...batchResults);
      
      const progress = Math.round((processed.length / bookmarks.length) * 100);
      console.log(`Processing bookmarks: ${progress}%`);
    }

    return processed;
  };

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      
      const cached = await getCachedBookmarks();
      if (cached) {
        setBookmarks(cached);
        setLoading(false);
        
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
      const results = await chrome.bookmarks.getRecent(1000);
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
    selectedBookmarks,
    setSelectedBookmarks,
  };
};
