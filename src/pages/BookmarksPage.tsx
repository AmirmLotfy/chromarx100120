
import { useState, useCallback } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { extractDomain } from "@/utils/domainUtils";
import Layout from "@/components/Layout";
import BookmarkHeader from "@/components/BookmarkHeader";
import BookmarkContent from "@/components/BookmarkContent";
import { useBookmarkState } from "@/components/BookmarkStateManager";
import { batchProcessBookmarks } from "@/utils/geminiUtils";
import { toast } from "sonner";

const BookmarksPage = () => {
  const {
    bookmarks,
    setBookmarks,
    selectedBookmarks,
    setSelectedBookmarks,
    loading,
    refreshBookmarks
  } = useBookmarkState();

  const [sortBy, setSortBy] = useState<"title" | "dateAdded" | "url">("dateAdded");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
  };

  const handleDelete = async (id: string) => {
    try {
      if (chrome.bookmarks) {
        await chrome.bookmarks.remove(id);
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
      } else {
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const promises = Array.from(selectedBookmarks).map((id) =>
        chrome.bookmarks ? chrome.bookmarks.remove(id) : Promise.resolve()
      );
      await Promise.all(promises);
      setBookmarks((prev) =>
        prev.filter((bookmark) => !selectedBookmarks.has(bookmark.id))
      );
      setSelectedBookmarks(new Set());
    } catch (error) {
      console.error("Error deleting bookmarks:", error);
    }
  };

  const handleUpdateCategories = useCallback(async (bookmarks: ChromeBookmark[]) => {
    try {
      const categorizedBookmarks = await batchProcessBookmarks(bookmarks, 'categorize');
      const updatedBookmarks = bookmarks.map(bookmark => ({
        ...bookmark,
        category: categorizedBookmarks.get(bookmark.id) || bookmark.category || 'uncategorized'
      }));
      
      setBookmarks(prev => {
        const bookmarkMap = new Map(prev.map(b => [b.id, b]));
        updatedBookmarks.forEach(bookmark => {
          bookmarkMap.set(bookmark.id, bookmark);
        });
        return Array.from(bookmarkMap.values());
      });

      toast.success("Categories updated successfully!");
    } catch (error) {
      console.error("Error updating categories:", error);
      toast.error("Failed to update categories");
    }
  }, [setBookmarks]);

  const handleImport = () => {
    toast.info("Import functionality coming soon!");
  };

  const handleCreateFolder = () => {
    toast.info("Create folder functionality coming soon!");
  };

  const toggleBookmarkSelection = (id: string) => {
    setSelectedBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "";
    return new Date(timestamp).toLocaleDateString();
  };

  const categories = Array.from(
    new Set(bookmarks.map((b) => b.category).filter(Boolean) as string[])
  ).map((name) => ({
    name,
    count: bookmarks.filter((b) => b.category === name).length,
  }));

  const domains = Array.from(
    new Set(
      bookmarks
        .map((b) => (b.url ? extractDomain(b.url) : null))
        .filter(Boolean) as string[]
    )
  ).map((domain) => ({
    domain,
    count: bookmarks.filter((b) => b.url && extractDomain(b.url) === domain)
      .length,
  }));

  const filteredBookmarks = bookmarks
    .filter((bookmark) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        bookmark.title.toLowerCase().includes(searchLower) ||
        bookmark.url?.toLowerCase().includes(searchLower);
      const matchesCategory =
        !selectedCategory || bookmark.category === selectedCategory;
      const matchesDomain =
        !selectedDomain ||
        (bookmark.url && extractDomain(bookmark.url) === selectedDomain);
      return matchesSearch && matchesCategory && matchesDomain;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "url":
          return (a.url || "").localeCompare(b.url || "");
        case "dateAdded":
          return (b.dateAdded || 0) - (a.dateAdded || 0);
        default:
          return 0;
      }
    });

  return (
    <Layout>
      <div className="space-y-8 pb-16">
        <BookmarkHeader
          selectedBookmarksCount={selectedBookmarks.size}
          selectedBookmarks={Array.from(selectedBookmarks)
            .map(id => bookmarks.find(b => b.id === id))
            .filter((b): b is ChromeBookmark => b !== undefined)}
          view={view}
          onViewChange={setView}
          onDeleteSelected={handleDeleteSelected}
          onUpdateCategories={handleUpdateCategories}
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onImport={handleImport}
          onCreateFolder={handleCreateFolder}
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
        />

        <BookmarkContent
          categories={categories}
          domains={domains}
          selectedCategory={selectedCategory}
          selectedDomain={selectedDomain}
          onSelectCategory={setSelectedCategory}
          onSelectDomain={setSelectedDomain}
          bookmarks={bookmarks}
          selectedBookmarks={selectedBookmarks}
          onToggleSelect={toggleBookmarkSelection}
          onDelete={handleDelete}
          formatDate={formatDate}
          view={view}
          onReorder={refreshBookmarks}
          onBulkDelete={handleDeleteSelected}
          onRefresh={refreshBookmarks}
          loading={loading}
          filteredBookmarks={filteredBookmarks}
          onUpdateCategories={handleUpdateCategories}
        />
      </div>
    </Layout>
  );
};

export default BookmarksPage;
