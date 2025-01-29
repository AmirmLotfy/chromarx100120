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
    <div className="p-4">
      <div className="flex items-center gap-2">
        <Bookmark className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">Bookmarks</h1>
      </div>
    </div>
  );
};

export default BookmarkHeader;