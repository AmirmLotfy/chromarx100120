import { useState, useCallback, useEffect } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { extractDomain } from "@/utils/domainUtils";
import Layout from "@/components/Layout";
import BookmarkHeader from "@/components/BookmarkHeader";
import { useBookmarkState } from "@/components/BookmarkStateManager";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Wifi, WifiOff } from "lucide-react";
import { AIProgressIndicator } from "@/components/ui/ai-progress-indicator";
import { BookmarkImport } from "@/components/BookmarkImport";
import { motion } from "framer-motion";
import { dummyBookmarks } from "@/utils/dummyBookmarks";
import { useBatchProcessing } from "@/hooks/useBatchProcessing";
import OptimizedBookmarkContent from "@/components/OptimizedBookmarkContent";
import FolderCreationDialog from "@/components/FolderCreationDialog";
import { chromeBookmarkService } from "@/services/chromeBookmarkService";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import ErrorFallback from "@/components/ErrorFallback";

const BookmarksContent = () => {
  const {
    bookmarks: originalBookmarks,
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

  const bookmarks = originalBookmarks.length > 0 
    ? originalBookmarks 
    : dummyBookmarks.slice(0, 10);

  const [sortBy, setSortBy] = useState<"title" | "dateAdded" | "url">("dateAdded");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"grid" | "list">("list");
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOfflineMode(false);
      toast.success("You're back online");
    };
    
    const handleOffline = () => {
      setIsOfflineMode(true);
      toast.warning("You're offline. Limited functionality available.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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

  const handleImport = (importedBookmarks: ChromeBookmark[]) => {
    setBookmarks(prev => [...prev, ...importedBookmarks]);
    
    if (chrome.bookmarks && navigator.onLine) {
      importedBookmarks.forEach(bookmark => {
        if (bookmark.url) {
          chrome.bookmarks.create({
            title: bookmark.title,
            url: bookmark.url,
          }).catch(error => {
            console.error("Error adding to Chrome bookmarks:", error);
          });
        }
      });
    }
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
        setBookmarks(prev => [...prev, newFolder]);
        return Promise.resolve();
      }
      return Promise.reject("Failed to create folder");
    } catch (error) {
      console.error("Error creating folder:", error);
      return Promise.reject(error);
    }
  };

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
    <div className="space-y-4 pb-24 px-2 max-w-md mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-xl backdrop-blur-sm border border-indigo-100 dark:border-indigo-900/30"
      >
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-500" />
          )}
          <span className="text-xs">
            {isConnected ? "Online" : "Offline"} 
            {syncStatus === 'success' && lastSynced && (
              <span className="text-muted-foreground ml-2 hidden sm:inline text-xs">
                Last synced: {new Date(lastSynced).toLocaleString()}
              </span>
            )}
          </span>
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          className="flex items-center gap-1 h-7 rounded-full px-2.5 text-xs bg-white/80 dark:bg-slate-800/80"
          onClick={handleForceSync}
          disabled={!isConnected || isProcessing}
        >
          {syncStatus === 'success' ? (
            <Check className="h-3.5 w-3.5 mr-1 text-green-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 mr-1" />
          )}
          <span>Sync</span>
        </Button>
      </motion.div>
      
      {isProcessing && (
        <AIProgressIndicator 
          isLoading={true} 
          message={processingMessage}
          progress={syncProgress}
          status={isConnected ? "processing" : "offline"}
        />
      )}

      {isOfflineMode && (
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
        onImport={(bookmarks) => {
          /* This will be replaced by the new import functionality */
        }}
        onCreateFolder={() => setIsFolderDialogOpen(true)}
        suggestions={suggestions}
        onSelectSuggestion={(suggestion) => handleSearch(suggestion)}
        importComponent={<BookmarkImport onImportComplete={handleImport} />}
        categories={categories.map(c => c.name)}
        domains={domains.map(d => d.domain)}
      />

      <OptimizedBookmarkContent
        filteredBookmarks={filteredBookmarks}
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
        onRefresh={loadBookmarks}
        onClearFilters={() => {
          setSelectedCategory(null);
          setSelectedDomain(null);
          handleSearch("");
        }}
        loading={loading}
        categories={categories}
        domains={domains}
        selectedCategory={selectedCategory}
        selectedDomain={selectedDomain}
        onSelectCategory={setSelectedCategory}
        onSelectDomain={setSelectedDomain}
        onUpdateCategories={handleUpdateCategories}
        searchQuery={searchQuery}
        isOffline={isOfflineMode}
      />
    
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
