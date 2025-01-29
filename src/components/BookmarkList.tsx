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

interface BookmarkListProps {
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
  onReorder?: (bookmarks: ChromeBookmark[]) => void;
}

const BookmarkList = ({
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  view,
  onReorder,
}: BookmarkListProps) => {
  const [items, setItems] = useState(bookmarks);
  const [groupedByDomain, setGroupedByDomain] = useState<Record<string, ChromeBookmark[]>>({});

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

  const renderBookmarks = (bookmarksToRender: ChromeBookmark[]) => (
    <div
      className={cn(
        "grid gap-4 animate-fade-in",
        view === "grid"
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1"
      )}
    >
      {bookmarksToRender.map((bookmark) => (
        <SortableBookmark
          key={bookmark.id}
          bookmark={bookmark}
          selected={selectedBookmarks.has(bookmark.id)}
          onToggleSelect={onToggleSelect}
          onDelete={onDelete}
          formatDate={formatDate}
          view={view}
        />
      ))}
    </div>
  );

  return (
    <DndContext
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={view === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <div className="space-y-8">
          {Object.entries(groupedByDomain).map(([domain, domainBookmarks]) => (
            <div key={domain} className="space-y-4">
              <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-lg flex items-center gap-2">
                <span className="text-sm font-medium">{domain}</span>
                <span className="text-xs text-muted-foreground">
                  ({domainBookmarks.length})
                </span>
              </div>
              {renderBookmarks(domainBookmarks)}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default BookmarkList;