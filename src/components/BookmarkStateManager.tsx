import { useState, useEffect } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { suggestBookmarkCategory } from "@/utils/geminiUtils";
import { dummyBookmarks } from "@/utils/dummyBookmarks";

export const useBookmarkState = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBookmarks, setNewBookmarks] = useState<ChromeBookmark[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadBookmarks = async () => {
    try {
      if (chrome.bookmarks) {
        const results = await chrome.bookmarks.getRecent(100);
        const previousCount = bookmarks.length;
        
        const categorizedResults = await Promise.all(
          results.map(async (bookmark): Promise<ChromeBookmark> => {
            const chromeBookmark: ChromeBookmark = {
              ...bookmark,
              category: undefined
            };
            
            if (!chromeBookmark.category && chromeBookmark.url) {
              try {
                chromeBookmark.category = await suggestBookmarkCategory(
                  chromeBookmark.title,
                  chromeBookmark.url
                );
              } catch (error) {
                console.error("Error suggesting category:", error);
              }
            }
            return chromeBookmark;
          })
        );
        
        setBookmarks(categorizedResults);

        if (previousCount < categorizedResults.length) {
          const newOnes = categorizedResults.slice(0, categorizedResults.length - previousCount);
          setNewBookmarks(newOnes);

          if (chrome.action) {
            const unreadCount = newOnes.length;
            chrome.action.setBadgeText({ text: unreadCount > 0 ? unreadCount.toString() : "" });
            chrome.action.setBadgeBackgroundColor({ color: "#10B981" });
          }
        }
      } else {
        setBookmarks(dummyBookmarks);
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
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