import { Bookmark } from "lucide-react";

interface BookmarkHeaderProps {
  selectedBookmarksCount: number;
  view: "grid" | "list";
  onViewChange: (view: "grid" | "list") => void;
  onDeleteSelected: () => void;
}

const BookmarkHeader = ({
  selectedBookmarksCount,
}: BookmarkHeaderProps) => {
  return (
    <div>
      <div>
        <Bookmark />
        <div>Bookmarks</div>
        {selectedBookmarksCount > 0 && (
          <div>{selectedBookmarksCount} selected</div>
        )}
      </div>
    </div>
  );
};

export default BookmarkHeader;