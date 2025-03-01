import { useState, useCallback } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { extractDomain } from "@/utils/domainUtils";
import Layout from "@/components/Layout";
import BookmarkHeader from "@/components/BookmarkHeader";
import BookmarkContent from "@/components/BookmarkContent";
import { useBookmarkState } from "@/components/BookmarkStateManager";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertCircle, CloudOff, CloudDone, Wifi, WifiOff } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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
    isProcessing,
    processingMessage,
    syncStatus,
    lastSynced,
    isConnected,
    syncProgress,
    handleForceSync
  } = useBookmarkState();

  const [sortBy, setSortBy] = useState<"title" | "dateAdded" | "url">("dateAdded");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"grid" | "list">("list");

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

  const handleUpdateCategories = useCallback((updatedBookmarks: ChromeBookmark[]) => {
    setBookmarks(prev => {
      const bookmarkMap = new Map(prev.map(b => [b.id, b]));
      updatedBookmarks.forEach(bookmark => {
        bookmarkMap.set(bookmark.id, bookmark);
      });
      return Array.from(bookmarkMap.values());
    });
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
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30 rounded-lg">
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              {isConnected ? "Online" : "Offline"} 
              {syncStatus === 'success' && lastSynced && (
                <span className="text-muted-foreground ml-2">
                  Last synced: {new Date(lastSynced).toLocaleString()}
                </span>
              )}
            </span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="flex items-center space-x-1"
            onClick={handleForceSync}
            disabled={!isConnected || isProcessing}
          >
            {syncStatus === 'success' ? (
              <CloudDone className="h-4 w-4 mr-1" />
            ) : (
              <CloudOff className="h-4 w-4 mr-1" />
            )}
            <span>Sync Now</span>
          </Button>
        </div>
        
        {isProcessing && (
          <div className="px-4 py-3 bg-muted/30 rounded-lg space-y-2">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-500 animate-pulse" />
              <span className="text-sm font-medium">{processingMessage}</span>
            </div>
            <Progress value={syncProgress} className="h-1" />
          </div>
        )}

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
          onSelectSuggestion={(suggestion) => handleSearch(suggestion)}
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
          onUpdateCategories={handleUpdateCategories}
        />
      </div>
    </Layout>
  );
};

export default BookmarksPage;
