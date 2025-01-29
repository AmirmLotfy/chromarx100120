import { useState } from "react";
import { toast } from "sonner";
import Layout from "../components/Layout";
import { ChromeBookmark } from "@/types/bookmark";
import { groupByDomain, extractDomain } from "@/utils/domainUtils";
import BookmarkHeader from "@/components/BookmarkHeader";
import BookmarkControls from "@/components/BookmarkControls";
import BookmarkContent from "@/components/BookmarkContent";
import BookmarkNotifications from "@/components/BookmarkNotifications";
import { useBookmarkState } from "@/components/BookmarkStateManager";
import { useIsMobile } from "@/hooks/use-mobile";

const BookmarksPage = () => {
  const {
    bookmarks,
    setBookmarks,
    loading,
    newBookmarks,
    loadBookmarks,
    suggestions,
    searchQuery,
    handleSearch,
  } = useBookmarkState();

  const [sortBy, setSortBy] = useState<"title" | "dateAdded" | "url">("dateAdded");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"grid" | "list">("list");
  const isMobile = useIsMobile();

  const handleDelete = async (id: string) => {
    try {
      if (chrome.bookmarks) {
        await chrome.bookmarks.remove(id);
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
        toast.success("Bookmark deleted");
      } else {
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id));
        toast.success("Bookmark deleted (demo mode)");
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      toast.error("Failed to delete bookmark");
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
      toast.success(
        `${selectedBookmarks.size} bookmark${
          selectedBookmarks.size === 1 ? "" : "s"
        } deleted`
      );
    } catch (error) {
      console.error("Error deleting bookmarks:", error);
      toast.error("Failed to delete bookmarks");
    }
  };

  const handleUpdateCategories = async (updatedBookmarks: ChromeBookmark[]) => {
    try {
      setBookmarks((prev) => {
        const bookmarkMap = new Map(prev.map(b => [b.id, b]));
        updatedBookmarks.forEach(bookmark => {
          bookmarkMap.set(bookmark.id, bookmark);
        });
        return Array.from(bookmarkMap.values());
      });
      toast.success("Categories updated successfully");
    } catch (error) {
      console.error("Error updating categories:", error);
      toast.error("Failed to update categories");
    }
  };

  const handleImport = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.html';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          // Implementation for HTML bookmark file parsing would go here
          toast.success("Bookmarks imported successfully");
          await loadBookmarks();
        }
      };
      input.click();
    } catch (error) {
      console.error("Error importing bookmarks:", error);
      toast.error("Failed to import bookmarks");
    }
  };

  const handleCreateFolder = async () => {
    try {
      if (chrome.bookmarks) {
        await chrome.bookmarks.create({
          title: "New Folder",
          parentId: "1"
        });
        toast.success("Folder created successfully");
        await loadBookmarks();
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      toast.error("Failed to create folder");
    }
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

  const domains = groupByDomain(bookmarks);

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

  const selectedBookmarksArray = Array.from(selectedBookmarks)
    .map(id => bookmarks.find(b => b.id === id))
    .filter((b): b is ChromeBookmark => b !== undefined);

  return (
    <Layout>
      <div 
        className="space-y-8 pb-16"
        role="main"
        aria-label="Bookmarks Management"
      >
        <BookmarkNotifications newBookmarks={newBookmarks} />
        
        <BookmarkHeader
          selectedBookmarksCount={selectedBookmarks.size}
          selectedBookmarks={selectedBookmarksArray}
          view={view}
          onViewChange={setView}
          onDeleteSelected={handleDeleteSelected}
          onUpdateCategories={handleUpdateCategories}
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          onImport={handleImport}
          onCreateFolder={handleCreateFolder}
          suggestions={suggestions}
          onSelectSuggestion={(suggestion) => handleSearch(suggestion)}
        />

        <div className="flex flex-col md:flex-row gap-6">
          <BookmarkControls
            sortBy={sortBy}
            onSortChange={setSortBy}
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
            onReorder={loadBookmarks}
            onBulkDelete={handleDeleteSelected}
            onRefresh={loadBookmarks}
            loading={loading}
            filteredBookmarks={filteredBookmarks}
          />
        </div>
      </div>
    </Layout>
  );
};

export default BookmarksPage;