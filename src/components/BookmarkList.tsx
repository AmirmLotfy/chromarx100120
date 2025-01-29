import { ExternalLink, Trash2 } from "lucide-react";
import { ChromeBookmark } from "@/types/bookmark";
import BookmarkContent from "./BookmarkContent";
import BookmarkShare from "./BookmarkShare";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import DraggableBookmark from "./DraggableBookmark";

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
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = bookmarks.findIndex((b) => b.id === active.id);
      const newIndex = bookmarks.findIndex((b) => b.id === over.id);
      const newBookmarks = arrayMove(bookmarks, oldIndex, newIndex);
      onReorder?.(newBookmarks);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "gap-4",
          view === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid"
        )}
      >
        <SortableContext items={bookmarks.map((b) => b.id)} strategy={rectSortingStrategy}>
          {bookmarks.map((bookmark) => (
            <DraggableBookmark
              key={bookmark.id}
              bookmark={bookmark}
              selected={selectedBookmarks.has(bookmark.id)}
              onToggleSelect={onToggleSelect}
              onDelete={onDelete}
              formatDate={formatDate}
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
};

export default BookmarkList;