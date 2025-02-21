import { ChromeBookmark } from "@/types/bookmark";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import SortableBookmark from "./SortableBookmark";
import { useEffect, useState } from "react";
import { extractDomain } from "@/utils/domainUtils";
import { Button } from "./ui/button";
import { CheckSquare, FileText, Globe, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { summarizeContent, suggestBookmarkCategory, summarizeBookmark } from "@/utils/geminiUtils";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { findDuplicateBookmarks, findBrokenBookmarks } from "@/utils/bookmarkCleanup";
import { useLanguage } from "@/stores/languageStore";
import { fetchPageContent } from "@/utils/contentExtractor";

interface BookmarkListProps {
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
  onReorder?: (bookmarks: ChromeBookmark[]) => void;
  onUpdateCategories: (bookmarks: ChromeBookmark[]) => void;
}

const BookmarkList = ({
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  view,
  onReorder,
  onUpdateCategories,
}: BookmarkListProps) => {
  const [items, setItems] = useState(bookmarks);
  const [groupedByDomain, setGroupedByDomain] = useState<Record<string, ChromeBookmark[]>>({});
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setItems(bookmarks);
    const grouped = bookmarks.reduce((acc, bookmark) => {
      if (bookmark.url) {
        const domain = extractDomain(bookmark.url);
        if (!acc[domain]) {
          acc[domain] = [];
        }
        acc[domain].push(bookmark);
      }
      return acc;
    }, {} as Record<string, ChromeBookmark[]>);
    setGroupedByDomain(grouped);
  }, [bookmarks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (focusedIndex === -1) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, bookmarks.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < bookmarks.length) {
            onToggleSelect(bookmarks[focusedIndex].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, bookmarks, onToggleSelect]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((item) => item.id === active.id);
        const newIndex = prevItems.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(prevItems, oldIndex, newIndex);
        onReorder?.(newItems);
        return newItems;
      });
    }
  };

  const handleSelectAll = () => {
    const allSelected = bookmarks.length === selectedBookmarks.size;
    if (allSelected) {
      bookmarks.forEach(bookmark => {
        if (selectedBookmarks.has(bookmark.id)) {
          onToggleSelect(bookmark.id);
        }
      });
    } else {
      bookmarks.forEach(bookmark => {
        if (!selectedBookmarks.has(bookmark.id)) {
          onToggleSelect(bookmark.id);
        }
      });
    }
  };

  const renderBookmarks = (bookmarksToRender: ChromeBookmark[]) => {
    const groupedBookmarks = bookmarksToRender.reduce((acc, bookmark) => {
      if (bookmark.url) {
        const domain = extractDomain(bookmark.url);
        if (!acc[domain]) {
          acc[domain] = [];
        }
        acc[domain].push(bookmark);
      }
      return acc;
    }, {} as Record<string, ChromeBookmark[]>);

    return (
      <div className="space-y-8">
        {Object.entries(groupedBookmarks).map(([domain, domainBookmarks]) => (
          <div key={domain} className="space-y-4">
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 backdrop-blur-sm rounded-lg sticky top-0 z-10">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium">{domain}</h3>
              <span className="text-xs text-muted-foreground">
                ({domainBookmarks.length})
              </span>
            </div>
            <div
              className={cn(
                "grid gap-2",
                view === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              )}
            >
              {domainBookmarks.map((bookmark) => (
                <SortableBookmark
                  key={bookmark.id}
                  bookmark={bookmark}
                  selected={selectedBookmarks.has(bookmark.id)}
                  onToggleSelect={onToggleSelect}
                  onDelete={onDelete}
                  formatDate={formatDate}
                  view={view}
                  tabIndex={focusedIndex === bookmarks.indexOf(bookmark) ? 0 : -1}
                  onFocus={() => setFocusedIndex(bookmarks.indexOf(bookmark))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleCleanup = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to clean up");
      return;
    }

    setIsProcessing(true);
    try {
      const selectedBookmarksArray = Array.from(selectedBookmarks)
        .map(id => bookmarks.find(b => b.id === id))
        .filter((b): b is ChromeBookmark => b !== undefined);

      const duplicates = findDuplicateBookmarks(selectedBookmarksArray);
      const brokenBookmarks = await findBrokenBookmarks(selectedBookmarksArray);
      
      if (duplicates.byUrl.length === 0 && duplicates.byTitle.length === 0 && brokenBookmarks.length === 0) {
        toast.info("No issues found in selected bookmarks");
        return;
      }

      await onDelete(Array.from(selectedBookmarks)[0]);
      toast.success("Cleanup completed successfully");
    } catch (error) {
      toast.error("Failed to clean up bookmarks");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateSummaries = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to summarize");
      return;
    }

    setIsProcessing(true);
    const { currentLanguage } = useLanguage();
    
    try {
      const selectedBookmarksArray = Array.from(selectedBookmarks)
        .map(id => bookmarks.find(b => b.id === id))
        .filter((b): b is ChromeBookmark => b !== undefined);

      const summaries = await Promise.all(
        selectedBookmarksArray.map(async (bookmark) => {
          const summary = await summarizeBookmark(bookmark, currentLanguage.code);
          return {
            id: bookmark.id,
            title: bookmark.title,
            content: summary,
            url: bookmark.url || "",
            date: new Date().toLocaleDateString(),
          };
        })
      );

      const existingSummaries = JSON.parse(
        localStorage.getItem("bookmarkSummaries") || "[]"
      );
      localStorage.setItem(
        "bookmarkSummaries",
        JSON.stringify([...summaries, ...existingSummaries])
      );

      toast.success("Summaries generated successfully!");
      navigate("/summaries");
    } catch (error) {
      toast.error("Failed to generate summaries");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuggestCategories = async () => {
    if (selectedBookmarks.size === 0) {
      toast.error("Please select bookmarks to categorize");
      return;
    }

    setIsProcessing(true);
    try {
      const selectedBookmarksArray = Array.from(selectedBookmarks)
        .map(id => bookmarks.find(b => b.id === id))
        .filter((b): b is ChromeBookmark => b !== undefined);

      const updatedBookmarks = await Promise.all(
        selectedBookmarksArray.map(async (bookmark) => {
          const content = await fetchPageContent(bookmark.url || "");
          return {
            ...bookmark,
            category: await suggestBookmarkCategory(bookmark.title, content)
          };
        })
      );

      onUpdateCategories(updatedBookmarks);
      toast.success("Categories suggested successfully!");
    } catch (error) {
      toast.error("Failed to suggest categories");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={view === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="w-full sm:w-auto bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
            >
              <CheckSquare className="h-4 w-4 mr-1.5" />
              {selectedBookmarks.size === bookmarks.length ? "Deselect All" : "Select All"}
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCleanup}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Cleanup
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Find and remove duplicate or broken bookmarks
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleGenerateSummaries}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
                  >
                    <FileText className="h-4 w-4 mr-1.5" />
                    Summarize
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Generate summaries for selected bookmarks
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSuggestCategories}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-gradient-to-r from-accent to-muted hover:from-accent/90 hover:to-muted/90 transition-all duration-300 shadow-sm"
                  >
                    <Sparkles className="h-4 w-4 mr-1.5" />
                    Categorize
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Suggest categories for selected bookmarks
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div
            className={cn(
              "grid gap-2 animate-fade-in",
              view === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            )}
          >
            {renderBookmarks(items)}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default BookmarkList;
