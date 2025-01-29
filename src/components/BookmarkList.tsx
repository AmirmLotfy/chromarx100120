import { ChromeBookmark } from "@/types/bookmark";
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
import { useEffect, useState } from "react";
import { extractDomain } from "@/utils/domainUtils";
import BookmarkSelectionActions from "./bookmark/BookmarkSelectionActions";
import BookmarkDomainGroup from "./bookmark/BookmarkDomainGroup";

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

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={view === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {selectedBookmarks.size > 0 && (
            <div className="bg-accent/50 rounded-lg p-3 animate-fade-in">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">AI Actions</h3>
              <BookmarkSelectionActions
                selectedBookmarks={selectedBookmarks}
                bookmarks={bookmarks}
                onUpdateCategories={onUpdateCategories}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            </div>
          )}

          <div className="space-y-8">
            {Object.entries(groupedByDomain).map(([domain]) => (
              <BookmarkDomainGroup
                key={domain}
                domain={domain}
                bookmarks={bookmarks}
                selectedBookmarks={selectedBookmarks}
                onToggleSelect={onToggleSelect}
                onDelete={onDelete}
                formatDate={formatDate}
                view={view}
                focusedIndex={focusedIndex}
                setFocusedIndex={setFocusedIndex}
              />
            ))}
          </div>
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default BookmarkList;