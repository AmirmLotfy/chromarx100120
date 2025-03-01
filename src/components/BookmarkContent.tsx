
import { useState, useEffect, useRef, useCallback } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import BookmarkList from "./BookmarkList";
import BookmarkCategories from "./BookmarkCategories";
import BookmarkDomains from "./BookmarkDomains";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CloudOff, Filter, X, BookmarkIcon, FolderIcon, GlobeIcon } from "lucide-react";
import { SearchFilter } from "./SearchBar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BookmarkContentProps {
  categories: { name: string; count: number }[];
  domains: { domain: string; count: number }[];
  selectedCategory: string | null;
  selectedDomain: string | null;
  onSelectCategory: (category: string | null) => void;
  onSelectDomain: (domain: string | null) => void;
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
  onReorder?: (bookmarks: ChromeBookmark[]) => void;
  onBulkDelete: () => void;
  onRefresh: () => void;
  loading: boolean;
  filteredBookmarks: ChromeBookmark[];
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
  isOffline?: boolean;
  activeFilters?: SearchFilter;
  onClearFilters?: () => void;
}

const BookmarkContent = ({
  categories,
  domains,
  selectedCategory,
  selectedDomain,
  onSelectCategory,
  onSelectDomain,
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  view,
  onReorder,
  onBulkDelete,
  onRefresh,
  loading,
  filteredBookmarks,
  onUpdateCategories,
  isOffline = false,
  activeFilters = {},
  onClearFilters = () => {},
}: BookmarkContentProps) => {
  const [activeTab, setActiveTab] = useState<string>("all");
  const hasActiveFilters = Object.values(activeFilters).some(Boolean);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Debug logging
  console.log("BookmarkContent rendered with:", {
    bookmarksCount: bookmarks.length,
    filteredCount: filteredBookmarks.length,
    categories: categories.length,
    domains: domains.length,
    view,
    activeTab
  });

  const renderEmptyState = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex flex-col items-center justify-center h-60 border-2 border-dashed rounded-xl bg-accent/5"
    >
      <div className="text-center p-6">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
          <BookmarkIcon className="h-8 w-8 text-primary" />
        </div>
        <p className="text-lg font-medium mb-2">No bookmarks found</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          {hasActiveFilters ? 
            "Try changing or clearing your filters" : 
            "Try a different search or add new bookmarks"
          }
        </p>
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            className="mt-4 rounded-full text-xs px-4 h-8"
            onClick={onClearFilters}
          >
            Clear Filters
          </Button>
        )}
      </div>
    </motion.div>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 w-full rounded-xl bg-gradient-to-r from-accent/10 to-muted/20 animate-pulse" />
          ))}
        </div>
      );
    }

    if (filteredBookmarks.length === 0) {
      return renderEmptyState();
    }

    return (
      <BookmarkList
        bookmarks={filteredBookmarks}
        selectedBookmarks={selectedBookmarks}
        onToggleSelect={onToggleSelect}
        onDelete={onDelete}
        formatDate={formatDate}
        view={view}
        onReorder={onReorder}
        onUpdateCategories={onUpdateCategories}
      />
    );
  };

  // Update active tab when category or domain is selected
  useEffect(() => {
    if (selectedCategory) {
      setActiveTab("categories");
    } else if (selectedDomain) {
      setActiveTab("domains");
    }
  }, [selectedCategory, selectedDomain]);

  return (
    <div className="h-full flex flex-col">
      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="h-full flex flex-col"
      >
        <TabsList className="mb-4 rounded-full p-1 bg-muted/30 backdrop-blur-sm sticky top-0 z-10 grid grid-cols-3 w-full sm:w-auto">
          <TabsTrigger 
            value="all" 
            className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs h-9"
            onClick={() => {
              console.log("All tab clicked");
              if (selectedCategory) onSelectCategory(null);
              if (selectedDomain) onSelectDomain(null);
            }}
          >
            <BookmarkIcon className="h-3.5 w-3.5 mr-1.5" />
            All
          </TabsTrigger>
          <TabsTrigger 
            value="categories" 
            className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs h-9"
          >
            <FolderIcon className="h-3.5 w-3.5 mr-1.5" />
            Categories
          </TabsTrigger>
          <TabsTrigger 
            value="domains" 
            className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs h-9"
          >
            <GlobeIcon className="h-3.5 w-3.5 mr-1.5" />
            Domains
          </TabsTrigger>
        </TabsList>

        {isOffline && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center p-3 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border rounded-lg border-amber-200 dark:border-amber-800/50 text-sm"
          >
            <CloudOff className="h-4 w-4 text-amber-500 mr-2 flex-shrink-0" />
            <p className="text-xs sm:text-sm">Offline mode: Some features like drag-and-drop organization and AI categorization are limited.</p>
          </motion.div>
        )}

        {hasActiveFilters && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 flex items-center justify-between p-3 bg-accent/20 backdrop-blur-sm border rounded-lg"
          >
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-primary" />
              <p className="text-xs sm:text-sm">Filtered results</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters} 
              className="h-7 text-xs rounded-full hover:bg-background px-2"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </motion.div>
        )}

        <ScrollArea className="flex-1 px-1 overflow-y-auto">
          <div ref={scrollRef} className="h-full pb-20">
            <TabsContent value="all" className="mt-0 space-y-4 h-full">
              {renderContent()}
            </TabsContent>

            <TabsContent value="categories" className="mt-0 space-y-6 h-full">
              <BookmarkCategories
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={onSelectCategory}
              />
              {selectedCategory && (
                <div className="mt-6 space-y-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <FolderIcon className="h-5 w-5 mr-2 text-primary opacity-70" />
                    <span>Category: </span>
                    <span className="ml-2 text-primary font-bold">{selectedCategory}</span>
                  </h2>
                  {renderContent()}
                </div>
              )}
            </TabsContent>

            <TabsContent value="domains" className="mt-0 space-y-6 h-full">
              <BookmarkDomains
                domains={domains}
                selectedDomain={selectedDomain}
                onSelectDomain={onSelectDomain}
              />
              {selectedDomain && (
                <div className="mt-6 space-y-4">
                  <h2 className="text-lg font-semibold flex items-center">
                    <GlobeIcon className="h-5 w-5 mr-2 text-primary opacity-70" />
                    <span>Domain: </span>
                    <span className="ml-2 text-primary font-bold">{selectedDomain}</span>
                  </h2>
                  {renderContent()}
                </div>
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );
};

export default BookmarkContent;
