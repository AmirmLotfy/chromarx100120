
import React, { useState } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import PaginatedBookmarkList from "./PaginatedBookmarkList";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { RefreshCw, Filter, X } from "lucide-react";

interface OptimizedBookmarkContentProps {
  filteredBookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  onRefresh: () => void;
  onClearFilters: () => void;
  loading: boolean;
  categories: Array<{ name: string; count: number }>;
  domains: Array<{ domain: string; count: number }>;
  selectedCategory: string | null;
  selectedDomain: string | null; 
  onSelectCategory: (category: string | null) => void;
  onSelectDomain: (domain: string | null) => void;
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
  searchQuery?: string;
  isOffline?: boolean;
}

const OptimizedBookmarkContent: React.FC<OptimizedBookmarkContentProps> = ({
  filteredBookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  onRefresh,
  onClearFilters,
  loading,
  categories,
  domains,
  selectedCategory,
  selectedDomain,
  onSelectCategory,
  onSelectDomain,
  onUpdateCategories,
  searchQuery = "",
  isOffline = false,
}) => {
  const isMobile = useIsMobile();
  const hasActiveFilters = selectedCategory || selectedDomain;

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Sidebar filters - only on desktop */}
      {!isMobile && (
        <aside className="w-48 flex-shrink-0 space-y-4 self-start sticky top-20">
          <Card className="p-3">
            <h3 className="font-medium text-sm mb-2">Categories</h3>
            <ScrollArea className="h-48">
              <div className="space-y-1 pr-3">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    className={`text-xs w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                      selectedCategory === category.name
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() =>
                      onSelectCategory(
                        selectedCategory === category.name ? null : category.name
                      )
                    }
                  >
                    {category.name}{" "}
                    <span className="opacity-70">({category.count})</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>

          <Card className="p-3">
            <h3 className="font-medium text-sm mb-2">Domains</h3>
            <ScrollArea className="h-48">
              <div className="space-y-1 pr-3">
                {domains.map((domain) => (
                  <button
                    key={domain.domain}
                    className={`text-xs w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                      selectedDomain === domain.domain
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                    onClick={() =>
                      onSelectDomain(
                        selectedDomain === domain.domain ? null : domain.domain
                      )
                    }
                  >
                    {domain.domain}{" "}
                    <span className="opacity-70">({domain.count})</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </aside>
      )}

      {/* Main content area */}
      <main className="flex-1">
        {hasActiveFilters && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex flex-wrap gap-2">
              {selectedCategory && (
                <div className="inline-flex items-center bg-primary/10 text-xs rounded-full px-2 py-1">
                  <span className="mr-1">Category: {selectedCategory}</span>
                  <button onClick={() => onSelectCategory(null)}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {selectedDomain && (
                <div className="inline-flex items-center bg-primary/10 text-xs rounded-full px-2 py-1">
                  <span className="mr-1">Domain: {selectedDomain}</span>
                  <button onClick={() => onSelectDomain(null)}>
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={onClearFilters}
            >
              Clear all
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center my-8">
            <RefreshCw className="h-6 w-6 animate-spin opacity-70" />
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">No bookmarks found</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={onClearFilters}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <PaginatedBookmarkList
            bookmarks={filteredBookmarks}
            selectedBookmarks={selectedBookmarks}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
            formatDate={formatDate}
            onUpdateCategories={onUpdateCategories}
            searchQuery={searchQuery}
          />
        )}
      </main>
    </div>
  );
};

export default OptimizedBookmarkContent;
