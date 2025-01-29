import { ExternalLink, Trash2 } from "lucide-react";
import { ChromeBookmark } from "@/types/bookmark";

interface BookmarkListProps {
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
}

const BookmarkList = ({
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
}: BookmarkListProps) => {
  return (
    <div className="grid gap-4">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className={`flex items-center justify-between p-4 rounded-lg group animate-fade-in ${
            selectedBookmarks.has(bookmark.id)
              ? "bg-primary/10"
              : "bg-accent hover:bg-accent/80"
          }`}
          onClick={() => onToggleSelect(bookmark.id)}
        >
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{bookmark.title}</h3>
              {bookmark.url && (
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            {bookmark.url && (
              <p className="text-sm text-muted-foreground truncate">
                {bookmark.url}
              </p>
            )}
            {bookmark.dateAdded && (
              <p className="text-xs text-muted-foreground">
                Added: {formatDate(bookmark.dateAdded)}
              </p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(bookmark.id);
            }}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete bookmark"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default BookmarkList;