
import React, { useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChromeBookmark } from "@/types/bookmark";
import { Card } from "@/components/ui/card";
import { Check, Globe, Bookmark, MoreVertical } from "lucide-react";
import { extractDomain } from "@/utils/domainUtils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import HighlightedText from "./HighlightedText";

interface VirtualizedBookmarkListProps {
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
  searchQuery?: string;
}

export const VirtualizedBookmarkList: React.FC<VirtualizedBookmarkListProps> = ({
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  onUpdateCategories,
  searchQuery = "",
}) => {
  const isMobile = useIsMobile();
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: bookmarks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88, // Estimated row height
    overscan: 5,
  });

  const items = useMemo(() => virtualizer.getVirtualItems(), [virtualizer, bookmarks]);

  return (
    <div 
      ref={parentRef} 
      className="max-h-[70vh] overflow-auto hide-scrollbar"
      style={{ height: '100%', minHeight: '400px' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualItem) => {
          const bookmark = bookmarks[virtualItem.index];
          const isSelected = selectedBookmarks.has(bookmark.id);
          const domain = bookmark.url ? extractDomain(bookmark.url) : "";

          return (
            <div
              key={bookmark.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: virtualItem.index * 0.03 }}
                className="px-1 py-1"
              >
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
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary-foreground/90 rounded-full mr-2">
                            <HighlightedText 
                              text={bookmark.category} 
                              highlight={searchQuery} 
                            />
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(bookmark.dateAdded)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VirtualizedBookmarkList;
