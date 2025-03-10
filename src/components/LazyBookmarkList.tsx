
import React, { useState, useEffect, useRef } from "react";
import { ChromeBookmark } from "@/types/bookmark";
import { Card } from "@/components/ui/card";
import { Check, Globe, Bookmark, MoreVertical, Tag, Calendar, RefreshCw } from "lucide-react";
import { extractDomain } from "@/utils/domainUtils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import HighlightedText from "./HighlightedText";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";

interface LazyBookmarkListProps {
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
  searchQuery?: string;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const LazyBookmarkItem = React.memo(({
  bookmark,
  isSelected,
  onToggleSelect,
  onDelete,
  formatDate,
  onUpdateCategories,
  searchQuery = "",
  isMobile
}: {
  bookmark: ChromeBookmark;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
  searchQuery?: string;
  isMobile: boolean;
}) => {
  const domain = bookmark.url ? extractDomain(bookmark.url) : "";

  return (
    <Card
      className={`group flex flex-col p-3 hover:shadow-md transition-all ${
        isSelected ? "bg-primary/5 border-primary/20" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          className={`h-5 w-5 rounded-full p-0 ${
            isSelected
              ? "bg-primary text-primary-foreground"
              : "border border-muted-foreground/30"
          }`}
          onClick={() => onToggleSelect(bookmark.id)}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 truncate">
              <a
                href={bookmark.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium hover:underline truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                <HighlightedText 
                  text={bookmark.title} 
                  highlight={searchQuery} 
                />
              </a>
              <p className="text-xs text-muted-foreground truncate">
                <HighlightedText 
                  text={domain} 
                  highlight={searchQuery} 
                />
              </p>
            </div>

            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => onDelete(bookmark.id)}
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              )}
              
              {isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onDelete(bookmark.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const updated = { ...bookmark, category: "Work" };
                        onUpdateCategories([updated]);
                      }}
                    >
                      Set as Work
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const updated = { ...bookmark, category: "Personal" };
                        onUpdateCategories([updated]);
                      }}
                    >
                      Set as Personal
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          <div className="flex items-center mt-1">
            {bookmark.category && (
              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary-foreground/90 rounded-full mr-2 flex items-center">
                <Tag className="h-2.5 w-2.5 mr-1" />
                <HighlightedText 
                  text={bookmark.category} 
                  highlight={searchQuery} 
                />
              </span>
            )}
            <span className="text-xs text-muted-foreground flex items-center">
              <Calendar className="h-2.5 w-2.5 mr-1" />
              {formatDate(bookmark.dateAdded)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
});

LazyBookmarkItem.displayName = "LazyBookmarkItem";

const LazyBookmarkList: React.FC<LazyBookmarkListProps> = ({
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  onUpdateCategories,
  searchQuery = "",
  isLoading = false,
  onRefresh
}) => {
  const isMobile = useIsMobile();
  const parentRef = useRef<HTMLDivElement>(null);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  // Stop animations after initial render for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const virtualizer = useVirtualizer({
    count: isLoading && bookmarks.length === 0 ? 10 : bookmarks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88, // Estimated row height
    overscan: 5,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div 
      ref={parentRef} 
      className="max-h-[70vh] overflow-auto hide-scrollbar"
      style={{ height: '100%', minHeight: '400px' }}
    >
      {bookmarks.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center h-full py-8 text-center">
          <Bookmark className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
          <h3 className="text-lg font-medium mb-1">No bookmarks found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try different search criteria or refresh
          </p>
          {onRefresh && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh bookmarks
            </Button>
          )}
        </div>
      ) : (
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualItem) => {
            // Show loading placeholders
            if (isLoading && bookmarks.length === 0) {
              return (
                <div
                  key={virtualItem.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                    padding: '4px',
                  }}
                >
                  <Card className="p-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-[80%]" />
                        <Skeleton className="h-3 w-[60%]" />
                        <div className="flex gap-2 mt-1">
                          <Skeleton className="h-4 w-16 rounded-full" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            }

            const bookmark = bookmarks[virtualItem.index];
            const isSelected = selectedBookmarks.has(bookmark.id);

            return (
              <div
                key={bookmark.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                  padding: '4px',
                }}
              >
                {shouldAnimate ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(0.5, virtualItem.index * 0.03) }}
                  >
                    <LazyBookmarkItem
                      bookmark={bookmark}
                      isSelected={isSelected}
                      onToggleSelect={onToggleSelect}
                      onDelete={onDelete}
                      formatDate={formatDate}
                      onUpdateCategories={onUpdateCategories}
                      searchQuery={searchQuery}
                      isMobile={isMobile}
                    />
                  </motion.div>
                ) : (
                  <LazyBookmarkItem
                    bookmark={bookmark}
                    isSelected={isSelected}
                    onToggleSelect={onToggleSelect}
                    onDelete={onDelete}
                    formatDate={formatDate}
                    onUpdateCategories={onUpdateCategories}
                    searchQuery={searchQuery}
                    isMobile={isMobile}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LazyBookmarkList;
