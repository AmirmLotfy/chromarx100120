import { ChromeBookmark } from "@/types/bookmark";
import DraggableBookmark from "./DraggableBookmark";
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
}: BookmarkListProps) => {
  return (
    <div
      className={cn(
        "grid gap-4 animate-fade-in",
        view === "grid"
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1"
      )}
    >
      {bookmarks.map((bookmark) => (
        <DraggableBookmark
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
};

export default BookmarkList;