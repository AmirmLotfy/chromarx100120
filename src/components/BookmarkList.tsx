import { ChromeBookmark } from "@/types/bookmark";
import { extractDomain } from "@/utils/domainUtils";
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
import DomainGroup from "./DomainGroup";
import { cn } from "@/lib/utils";

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

  // Group bookmarks by domain
  const domains = Array.from(
    new Set(
      bookmarks
        .map((b) => b.url && extractDomain(b.url))
        .filter(Boolean) as string[]
    )
  ).sort();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          "space-y-8",
          view === "grid" && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        )}
      >
        <SortableContext items={bookmarks.map((b) => b.id)} strategy={rectSortingStrategy}>
          {domains.map((domain) => (
            <DomainGroup
              key={domain}
              domain={domain}
              bookmarks={bookmarks}
              selectedBookmarks={selectedBookmarks}
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