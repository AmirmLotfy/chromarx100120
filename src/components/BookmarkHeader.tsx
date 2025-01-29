import { Bookmark } from "lucide-react";

interface BookmarkHeaderProps {
  selectedBookmarksCount: number;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  onDeleteSelected: () => void;
}

const BookmarkHeader = ({
  selectedBookmarksCount,
  view,
  onViewChange,
  onDeleteSelected,
}: BookmarkHeaderProps) => {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Bookmark className="h-5 w-5" />
        <h1>Bookmarks</h1>
      </div>
    </div>
  );
};

export default BookmarkHeader;