import { useState, useEffect } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { suggestBookmarkCategory } from "@/utils/geminiUtils";
import { dummyBookmarks } from "@/utils/dummyBookmarks";
import { fetchPageContent } from "@/utils/contentExtractor";
import { useLanguage } from "@/utils/language";

const CACHE_KEY = 'bookmark_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const useBookmarkState = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBookmarks, setNewBookmarks] = useState<ChromeBookmark[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const getCachedBookmarks = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
    }
    return null;
  };

  const setCachedBookmarks = (data: ChromeBookmark[]) => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  };

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      
      // Try to get cached bookmarks first
      const cached = getCachedBookmarks();
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
      const { currentLanguage } = useLanguage();
      
      const categorizedResults = await Promise.all(
        results.map(async (bookmark): Promise<ChromeBookmark> => {
          const chromeBookmark: ChromeBookmark = {
            ...bookmark,
            category: undefined
          };
          
          if (chromeBookmark.url) {
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
            } catch (error) {
              console.error("Error processing bookmark content:", error);
            }
          }
          return chromeBookmark;
        })
      );
      
      setBookmarks(categorizedResults);
      setCachedBookmarks(categorizedResults);

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
