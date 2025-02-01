import { useState, useEffect } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { extractDomain } from "@/utils/domainUtils";

export const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<ChromeBookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [domains, setDomains] = useState<{ domain: string; count: number }[]>([]);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filteredBookmarks, setFilteredBookmarks] = useState<ChromeBookmark[]>([]);

  const loadBookmarks = async () => {
    try {
      if (chrome.bookmarks) {
        const results = await chrome.bookmarks.getRecent(100);
        const typedResults = results as ChromeBookmark[];
        setBookmarks(typedResults);
        
        // Calculate categories and domains
        const categoryMap = new Map<string, number>();
        const domainMap = new Map<string, number>();
        
        typedResults.forEach(bookmark => {
          if (bookmark.url) {
            // Handle domains
            const domain = extractDomain(bookmark.url);
            domainMap.set(domain, (domainMap.get(domain) || 0) + 1);
            
            // Handle categories (now safely accessing optional category)
            if (bookmark.category) {
              categoryMap.set(bookmark.category, (categoryMap.get(bookmark.category) || 0) + 1);
            }
          }
        });

        setCategories(Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count })));
        setDomains(Array.from(domainMap.entries()).map(([domain, count]) => ({ domain, count })));
      }
    } catch (error) {
      console.error("Error loading bookmarks:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedBookmarks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleDelete = async (id: string) => {
    if (chrome.bookmarks) {
      await chrome.bookmarks.remove(id);
      loadBookmarks();
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString();
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (chrome.bookmarks) {
      await Promise.all(ids.map(id => chrome.bookmarks.remove(id)));
      loadBookmarks();
    }
  };

  const handleUpdateCategories = (updatedBookmarks: ChromeBookmark[]) => {
    setBookmarks(prev => {
      const newBookmarks = [...prev];
      updatedBookmarks.forEach(updated => {
        const index = newBookmarks.findIndex(b => b.id === updated.id);
        if (index !== -1) {
          newBookmarks[index] = updated;
        }
      });
      return newBookmarks;
    });
  };

  useEffect(() => {
    loadBookmarks();
  }, []);

  useEffect(() => {
    let filtered = [...bookmarks];
    
    if (selectedCategory) {
      filtered = filtered.filter(b => b.category === selectedCategory);
    }
    
    if (selectedDomain) {
      filtered = filtered.filter(b => b.url && extractDomain(b.url) === selectedDomain);
    }
    
    setFilteredBookmarks(filtered);
  }, [bookmarks, selectedCategory, selectedDomain]);

  return {
    bookmarks,
    loading,
    categories,
    domains,
    selectedCategory,
    selectedDomain,
    onSelectCategory: setSelectedCategory,
    onSelectDomain: setSelectedDomain,
    selectedBookmarks,
    onToggleSelect: handleToggleSelect,
    onDelete: handleDelete,
    formatDate,
    view,
    onReorder: setBookmarks,
    onBulkDelete: handleBulkDelete,
    onRefresh: loadBookmarks,
    filteredBookmarks,
    onUpdateCategories: handleUpdateCategories,
  };
};