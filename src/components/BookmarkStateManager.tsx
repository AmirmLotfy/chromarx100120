import { useState, useEffect } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { toast } from "sonner";
import { suggestBookmarkCategory } from "@/utils/geminiUtils";

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
        // Demo data with real links for testing
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
            title: "MDN Web Docs",
            url: "https://developer.mozilla.org",
            dateAdded: Date.now() - 259200000,
            category: "Development",
          },
          {
            id: "4",
            title: "GitHub",
            url: "https://github.com",
            dateAdded: Date.now() - 345600000,
            category: "Development",
          },
          {
            id: "5",
            title: "Stack Overflow",
            url: "https://stackoverflow.com",
            dateAdded: Date.now() - 432000000,
            category: "Development",
          },
          {
            id: "6",
            title: "CSS-Tricks",
            url: "https://css-tricks.com",
            dateAdded: Date.now() - 518400000,
            category: "Design",
          },
          {
            id: "7",
            title: "Dribbble",
            url: "https://dribbble.com",
            dateAdded: Date.now() - 604800000,
            category: "Design",
          },
          {
            id: "8",
            title: "Behance",
            url: "https://www.behance.net",
            dateAdded: Date.now() - 691200000,
            category: "Design",
          },
          {
            id: "9",
            title: "Medium",
            url: "https://medium.com",
            dateAdded: Date.now() - 777600000,
            category: "Reading",
          },
          {
            id: "10",
            title: "Dev.to",
            url: "https://dev.to",
            dateAdded: Date.now() - 864000000,
            category: "Development",
          },
          {
            id: "11",
            title: "Product Hunt",
            url: "https://www.producthunt.com",
            dateAdded: Date.now() - 950400000,
            category: "Technology",
          },
          {
            id: "12",
            title: "Hacker News",
            url: "https://news.ycombinator.com",
            dateAdded: Date.now() - 1036800000,
            category: "Technology",
          },
          {
            id: "13",
            title: "Figma",
            url: "https://www.figma.com",
            dateAdded: Date.now() - 1123200000,
            category: "Design",
          },
          {
            id: "14",
            title: "CodePen",
            url: "https://codepen.io",
            dateAdded: Date.now() - 1209600000,
            category: "Development",
          },
          {
            id: "15",
            title: "Smashing Magazine",
            url: "https://www.smashingmagazine.com",
            dateAdded: Date.now() - 1296000000,
            category: "Development",
          },
          {
            id: "16",
            title: "Node.js",
            url: "https://nodejs.org",
            dateAdded: Date.now() - 1382400000,
            category: "Development",
          },
          {
            id: "17",
            title: "npm",
            url: "https://www.npmjs.com",
            dateAdded: Date.now() - 1468800000,
            category: "Development",
          },
          {
            id: "18",
            title: "Vue.js",
            url: "https://vuejs.org",
            dateAdded: Date.now() - 1555200000,
            category: "Development",
          },
          {
            id: "19",
            title: "Angular",
            url: "https://angular.io",
            dateAdded: Date.now() - 1641600000,
            category: "Development",
          },
          {
            id: "20",
            title: "Next.js",
            url: "https://nextjs.org",
            dateAdded: Date.now() - 1728000000,
            category: "Development",
          }
        ]);
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