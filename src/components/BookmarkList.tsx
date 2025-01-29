import { ChromeBookmark } from "@/types/bookmark";
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
}: BookmarkListProps) => {
  return (
    <div>
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
    </div>
  );
};

export default BookmarkList;