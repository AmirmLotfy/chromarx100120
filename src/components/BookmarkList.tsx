
import { useEffect, useState } from "react";
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
import { extractDomain } from "@/utils/domainUtils";
import { Button } from "./ui/button";
import { CheckSquare, FileText, Globe, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { findDuplicateBookmarks, findBrokenBookmarks } from "@/utils/bookmarkCleanup";

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
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setItems(bookmarks);
  }, [bookmarks]);

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
            {items.map((bookmark) => (
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
      </SortableContext>
    </DndContext>
  );
};

export default BookmarkList;
