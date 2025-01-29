import { ChromeBookmark } from "@/types/bookmark";
import { extractDomain } from "@/utils/domainUtils";
import { Globe } from "lucide-react";
import SortableBookmark from "../SortableBookmark";

interface BookmarkDomainGroupProps {
  domain: string;
  bookmarks: ChromeBookmark[];
  selectedBookmarks: Set<string>;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  formatDate: (timestamp?: number) => string;
  view: "grid" | "list";
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
}

const BookmarkDomainGroup = ({
  domain,
  bookmarks,
  selectedBookmarks,
  onToggleSelect,
  onDelete,
  formatDate,
  view,
  focusedIndex,
  setFocusedIndex,
}: BookmarkDomainGroupProps) => {
  const bookmarksInDomain = bookmarks.filter(
    (b) => b.url && extractDomain(b.url) === domain
  );

  if (bookmarksInDomain.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 backdrop-blur-sm rounded-lg sticky top-0 z-10">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">{domain}</h3>
        <span className="text-xs text-muted-foreground">
          ({bookmarksInDomain.length})
        </span>
      </div>
      <div
        className={`grid gap-2 ${
          view === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1"
        }`}
      >
        {bookmarksInDomain.map((bookmark) => (
          <SortableBookmark
            key={bookmark.id}
            bookmark={bookmark}
            selected={selectedBookmarks.has(bookmark.id)}
            onToggleSelect={onToggleSelect}
            onDelete={onDelete}
            formatDate={formatDate}
            view={view}
            tabIndex={focusedIndex === bookmarks.indexOf(bookmark) ? 0 : -1}
            onFocus={() => setFocusedIndex(bookmarks.indexOf(bookmark))}
          />
        ))}
      </div>
    </div>
  );
};

export default BookmarkDomainGroup;