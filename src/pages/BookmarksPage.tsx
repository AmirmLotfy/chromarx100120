
import { useState, useCallback } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { extractDomain } from "@/utils/domainUtils";
import Layout from "@/components/Layout";
import BookmarkHeader from "@/components/BookmarkHeader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Wifi, WifiOff } from "lucide-react";
import { AIProgressIndicator } from "@/components/ui/ai-progress-indicator";
import { BookmarkImport } from "@/components/BookmarkImport";
import { motion } from "framer-motion";
import { useBatchProcessing } from "@/hooks/useBatchProcessing";
import FolderCreationDialog from "@/components/FolderCreationDialog";
import { chromeBookmarkService } from "@/services/chromeBookmarkService";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import ErrorFallback from "@/components/ErrorFallback";
import LazyBookmarkList from "@/components/LazyBookmarkList";
import { useOptimizedBookmarks } from "@/hooks/useOptimizedBookmarks";

const BookmarksContent = () => {
  const {
    bookmarks,
    filteredBookmarks,
    loadingStatus,
    loadingProgress,
    searchQuery,
    setSearchQuery,
    loadBookmarks,
    updateBookmarkCategory,
    deleteBookmark,
    isOffline
  } = useOptimizedBookmarks();

  const [sortBy, setSortBy] = useState<"title" | "dateAdded" | "url">("dateAdded");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"grid" | "list">("list");
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");

  const handleDelete = async (id: string) => {
    await deleteBookmark(id);
  };

  const handleDeleteSelected = async () => {
    try {
      const promises = Array.from(selectedBookmarks).map(id => deleteBookmark(id));
      await Promise.all(promises);
      setSelectedBookmarks(new Set());
      toast.success("Selected bookmarks deleted");
    } catch (error) {
      console.error("Error deleting bookmarks:", error);
      toast.error("Failed to delete some bookmarks");
    }
  };

  const handleUpdateCategories = useCallback((updatedBookmarks: ChromeBookmark[]) => {
    updatedBookmarks.forEach(bookmark => {
      if (bookmark.category) {
        updateBookmarkCategory(bookmark.id, bookmark.category);
      }
    });
  }, [updateBookmarkCategory]);

  const handleImport = (importedBookmarks: ChromeBookmark[]) => {
    toast.success(`${importedBookmarks.length} bookmarks imported`);
    loadBookmarks(true);
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

  const handleCreateFolder = async (name: string, parentId?: string) => {
    try {
      const newFolder = await chromeBookmarkService.createFolder(name, parentId);
      if (newFolder) {
        toast.success(`Folder "${name}" created`);
        loadBookmarks(true);
        return Promise.resolve();
      }
      return Promise.reject("Failed to create folder");
    } catch (error) {
      console.error("Error creating folder:", error);
      return Promise.reject(error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleRefresh = () => {
    loadBookmarks(true);
    toast.success("Refreshing bookmarks...");
  };

  const handleForceSync = async () => {
    setIsProcessing(true);
    setProcessingMessage("Syncing bookmarks...");
    
    try {
      await loadBookmarks(true);
      toast.success("Bookmarks synced successfully!");
    } catch (error) {
      console.error("Error during sync:", error);
      toast.error("Failed to sync bookmarks");
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  const filteredAndSortedBookmarks = filteredBookmarks
    .filter((bookmark) => {
      const matchesCategory = !selectedCategory || bookmark.category === selectedCategory;
      const matchesDomain = !selectedDomain || 
        (bookmark.url && extractDomain(bookmark.url) === selectedDomain);
      return matchesCategory && matchesDomain;
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
    <div className="space-y-4 pb-24 px-2 max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/30"
      >
        <div className="flex items-center space-x-2">
          {!isOffline ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-xs">
            {!isOffline ? "Online" : "Offline"} 
          </span>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex items-center gap-1 h-7 rounded-full px-2.5 text-xs bg-white/80 dark:bg-slate-800/80"
          onClick={handleForceSync}
          disabled={isOffline || isProcessing || loadingStatus === 'loading'}
        >
          <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
          <span>Sync</span>
        </Button>
      </motion.div>
      
      {(isProcessing || loadingStatus === 'loading') && (
        <AIProgressIndicator 
          isLoading={true} 
          message={processingMessage || "Loading bookmarks..."}
          progress={loadingProgress}
          status={isOffline ? "offline" : "processing"}
        />
      )}

      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-2.5 bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/30 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-800 dark:text-amber-400">Offline Mode</span>
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
            You're currently offline. Some features like syncing and AI-powered categorization are limited.
          </p>
        </motion.div>
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
        onImport={() => {}}
        onCreateFolder={() => setIsFolderDialogOpen(true)}
        suggestions={[]}
        onSelectSuggestion={(suggestion) => handleSearch(suggestion)}
        importComponent={<BookmarkImport onImportComplete={handleImport} />}
        categories={categories.map(c => c.name)}
        domains={domains.map(d => d.domain)}
      />

      <div className="flex flex-col md:flex-row gap-4">
        {/* Main content area */}
        <main className="flex-1">
          {(selectedCategory || selectedDomain) && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex flex-wrap gap-2">
                {selectedCategory && (
                  <div className="inline-flex items-center bg-primary/10 text-xs rounded-full px-2 py-1">
                    <span className="mr-1">Category: {selectedCategory}</span>
                    <button onClick={() => setSelectedCategory(null)}>
                      <AlertCircle className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {selectedDomain && (
                  <div className="inline-flex items-center bg-primary/10 text-xs rounded-full px-2 py-1">
                    <span className="mr-1">Domain: {selectedDomain}</span>
                    <button onClick={() => setSelectedDomain(null)}>
                      <AlertCircle className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedDomain(null);
                }}
              >
                Clear all
              </Button>
            </div>
          )}

          <LazyBookmarkList
            bookmarks={filteredAndSortedBookmarks}
            selectedBookmarks={selectedBookmarks}
            onToggleSelect={(id) => {
              setSelectedBookmarks(prev => {
                const next = new Set(prev);
                if (next.has(id)) {
                  next.delete(id);
                } else {
                  next.add(id);
                }
                return next;
              });
            }}
            onDelete={handleDelete}
            formatDate={formatDate}
            onUpdateCategories={handleUpdateCategories}
            searchQuery={searchQuery}
            isLoading={loadingStatus === 'loading'}
            onRefresh={handleRefresh}
          />
        </main>
      </div>
    
      <FolderCreationDialog
        isOpen={isFolderDialogOpen}
        onClose={() => setIsFolderDialogOpen(false)}
        onCreateFolder={handleCreateFolder}
      />
    </div>
  );
};

const BookmarksPage = () => {
  const handleBookmarkError = (error: Error) => {
    console.error("Bookmark page error:", error);
    toast.error("There was an error loading your bookmarks");
  };

  return (
    <Layout>
      <ErrorBoundary
        onError={handleBookmarkError}
        fallback={
          <ErrorFallback 
            error={new Error("Failed to load bookmarks")}
            resetErrorBoundary={() => window.location.reload()} 
          />
        }
      >
        <BookmarksContent />
      </ErrorBoundary>
    </Layout>
  );
};

export default BookmarksPage;
