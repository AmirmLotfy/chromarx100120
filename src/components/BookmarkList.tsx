import { ExternalLink, Trash2 } from "lucide-react";
import { ChromeBookmark } from "@/types/bookmark";
import BookmarkContent from "./BookmarkContent";
import BookmarkShare from "./BookmarkShare";
import { cn } from "@/lib/utils";

interface BookmarkListProps {
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
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
        "gap-4",
        view === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid"
      )}
    >
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className={cn(
            "flex flex-col p-4 rounded-lg group animate-fade-in transition-colors",
            selectedBookmarks.has(bookmark.id)
              ? "bg-primary/10"
              : "bg-accent hover:bg-accent/80"
          )}
        >
          <div 
            className="flex items-center justify-between"
            onClick={() => onToggleSelect(bookmark.id)}
          >
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{bookmark.title}</h3>
                {bookmark.url && (
                  <>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <BookmarkShare bookmark={bookmark} />
                  </>
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
          
          {bookmark.url && (
            <BookmarkContent title={bookmark.title} url={bookmark.url} />
          )}
        </div>
      ))}
    </div>
  );
};

export default BookmarkList;