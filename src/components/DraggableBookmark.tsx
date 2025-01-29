import { ChromeBookmark } from "@/types/bookmark";
import BookmarkContentDisplay from "./BookmarkContentDisplay";

interface DraggableBookmarkProps {
  bookmark: ChromeBookmark;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
}

const DraggableBookmark = ({
  bookmark,
  selected,
  onToggleSelect,
  onDelete,
}: DraggableBookmarkProps) => {
  return (
    <div 
      className="p-3 rounded-lg bg-accent"
      onClick={() => onToggleSelect(bookmark.id)}
    >
      <BookmarkContentDisplay 
        title={bookmark.title} 
        url={bookmark.url} 
      />
    </div>
  );
};

export default DraggableBookmark;