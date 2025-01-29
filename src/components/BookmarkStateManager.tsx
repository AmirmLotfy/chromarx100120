import { useState, useEffect } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { suggestBookmarkCategory } from "@/utils/geminiUtils";

export const useBookmarkState = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBookmarks, setNewBookmarks] = useState<ChromeBookmark[]>([]);

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
              chromeBookmark.category = await suggestBookmarkCategory(
                chromeBookmark.title,
                chromeBookmark.url
              );
            }
            return chromeBookmark;
          })
        );
        
        setBookmarks(categorizedResults);

        if (previousCount < categorizedResults.length) {
          const newOnes = categorizedResults.slice(0, categorizedResults.length - previousCount);
          setNewBookmarks(newOnes);
        }
      } else {
        // Demo data for development
        setBookmarks([
          {
            id: "1",
            title: "React Documentation",
            url: "https://react.dev",
            dateAdded: Date.now() - 86400000,
            category: "Development",
          },
          {
            id: "2",
            title: "TypeScript Handbook",
            url: "https://www.typescriptlang.org/docs/",
            dateAdded: Date.now() - 172800000,
            category: "Development",
          },
          {
            id: "3",
            title: "Tailwind CSS",
            url: "https://tailwindcss.com",
            dateAdded: Date.now() - 259200000,
            category: "Design",
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
      toast.error("Failed to load bookmarks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
    if (chrome.bookmarks) {
      chrome.bookmarks.onCreated.addListener(loadBookmarks);
      return () => {
        chrome.bookmarks.onCreated.removeListener(loadBookmarks);
      };
    }
  }, []);

  return {
    bookmarks,
    setBookmarks,
    loading,
    newBookmarks,
    loadBookmarks,
  };
};
